import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PersonalForm from '../components/PersonalForm';
import { useCreatePersonal } from '../hooks/useCreatePersonal';
import { personalService } from '../services/personalService';
import { AlertCircle, Shield } from 'lucide-react';
import useScreenSize from '../../../../hooks/useScreenSize';
import LoadingSpinner from '../../../../components/LoadingSpinner';

/**
 * Contenedor principal para crear personal
 * Maneja la lógica de autenticación y permisos
 */
const CreatePersonalContainer = () => {
  const navigate = useNavigate();
  const screenSize = useScreenSize();
  const isMobile = screenSize.width <= 768;
  
  // Estados de seguridad
  const [permissionsLoading, setPermissionsLoading] = useState(true);
  const [permissionError, setPermissionError] = useState(null);
  const [hasAccess, setHasAccess] = useState(false);

  // Hook del formulario
  const {
    formData,
    loading,
    errors,
    roles,
    rolesLoading,
    submitSuccess,
    updateField,
    updatePermission,
    resetForm,
    submitForm
  } = useCreatePersonal();

  // Verificar permisos al cargar
  useEffect(() => {
    checkPermissions();
  }, []);

  /**
   * Verificar permisos de acceso
   */
  const checkPermissions = async () => {
    setPermissionsLoading(true);
    try {
      const userData = await personalService.checkUserPermissions();
      
      // Verificar si es superadministrador Y tiene permiso de crear usuarios
      const canAccessService = userData.rol === 'superadministrador';
      
      if (!canAccessService) {
        setPermissionError('No tienes permisos para acceder a esta funcionalidad');
        setHasAccess(false);
        return;
      }

      setHasAccess(true);
      setPermissionError(null);
      
    } catch (error) {
      console.error('Error verificando permisos:', error);
      setPermissionError(error.message || 'Error verificando permisos de acceso');
      setHasAccess(false);
      
      // Si es error de autenticación, redirigir al login
      if (error.message.includes('autenticado')) {
        setTimeout(() => navigate('/'), 2000);
      }
    } finally {
      setPermissionsLoading(false);
    }
  };

  /**
   * Manejar envío del formulario
   */
  const handleSubmit = async () => {
    const success = await submitForm();
    if (success) {
      // Opcional: mostrar notificación adicional o redirigir
      console.log('Personal creado exitosamente');
    }
  };

  /**
   * Manejar regreso sin permisos
   */
  const handleGoBack = () => {
    navigate(-1); // Regresar a la página anterior
  };

  // Pantalla de carga de permisos
  if (permissionsLoading) {
    return (
      <div className={`${isMobile ? "mt-20" : "p-4"} min-h-screen flex items-center justify-center`}>
        <div className="text-center">
          <LoadingSpinner />
          <p className="text-blue-default">Verificando permisos de acceso...</p>
        </div>
      </div>
    );
  }

  // Pantalla de error de permisos
  if (permissionError || !hasAccess) {
    return (
      <div className={`${isMobile ? "mt-20" : "p-4"} min-h-screen flex items-center justify-center bg-white `}>
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h1>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                <div className="text-left">
                  <h3 className="font-semibold text-red-800">Sin Permisos</h3>
                  <p className="text-red-600 text-sm">
                    {permissionError || 'No tienes los permisos necesarios para acceder a esta funcionalidad'}
                  </p>
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-600 mb-6">
              <p><strong>Requisitos para acceder:</strong></p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Rol: Superadministrador</li>
                <li>Permiso: Crear Usuarios</li>
              </ul>
            </div>
          </div>
          
          <button
            onClick={handleGoBack}
            className="w-full px-4 py-2 bg-blue-default hover:bg-blue-hover text-white rounded-md transition-colors"
          >
            Regresar
          </button>
        </div>
      </div>
    );
  }

  // Formulario principal
  return (
    <div className={`${isMobile ? "pt-14" : "p-4"} min-h-screen bg-white rounded-md`}>
      <PersonalForm
        formData={formData}
        errors={errors}
        loading={loading}
        roles={roles}
        rolesLoading={rolesLoading}
        submitSuccess={submitSuccess}
        onFieldChange={updateField}
        onPermissionChange={updatePermission}
        onSubmit={handleSubmit}
        onReset={resetForm}
        isMobile={isMobile}
      />
    </div>
  );
};

export default CreatePersonalContainer;