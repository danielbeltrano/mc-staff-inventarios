import { useState, useEffect } from 'react';
import { personalService } from '../services/personalService';
import { validatePersonalForm } from '../utils/validationUtils';

/**
 * Hook personalizado para manejar la creación de personal
 */
export const useCreatePersonal = () => {
  // Estados del formulario
  const [formData, setFormData] = useState({
    correoInstitucional: '',
    primerNombre: '',
    segundoNombre: '',
    primerApellido: '',
    segundoApellido: '',
    rol: '',
    cargo: '',
    permisos: {
      admisiones: false,
      matriculas: false,
      bienestar: false,
      recursosHumanos: false,
      academico: false,
      admnistrador: false,
    }
  });

  // Estados de control
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Cargar roles al montar el componente
  useEffect(() => {
    loadRoles();
  }, []);

  /**
   * Cargar roles desde la base de datos
   */
  const loadRoles = async () => {
    setRolesLoading(true);
    try {
      const rolesData = await personalService.getRoles();
      setRoles(rolesData);
    } catch (error) {
      setErrors(prev => ({
        ...prev,
        roles: 'No se pudieron cargar los roles disponibles'
      }));
    } finally {
      setRolesLoading(false);
    }
  };

  /**
   * Actualizar campo del formulario
   * @param {string} field - Nombre del campo
   * @param {any} value - Valor del campo
   */
  const updateField = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Limpiar error del campo al modificarlo
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    // Limpiar éxito previo
    if (submitSuccess) {
      setSubmitSuccess(false);
    }
  };

  /**
   * Actualizar permiso específico
   * @param {string} permission - Nombre del permiso
   * @param {boolean} value - Valor del permiso
   */
  const updatePermission = (permission, value) => {
    setFormData(prev => ({
      ...prev,
      permisos: {
        ...prev.permisos,
        [permission]: value
      }
    }));

    // Limpiar error de permisos si existe
    if (errors.permisos) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.permisos;
        return newErrors;
      });
    }

    // Limpiar éxito previo
    if (submitSuccess) {
      setSubmitSuccess(false);
    }
  };

  /**
   * Resetear formulario
   */
  const resetForm = () => {
    setFormData({
      correoInstitucional: '',
      primerNombre: '',
      segundoNombre: '',
      primerApellido: '',
      segundoApellido: '',
      rol: '',
      cargo: '',
      permisos: {
        admisiones: false,
        matriculas: false,
        bienestar: false,
        recursosHumanos: false,
        academico: false,
        admnistrador: false,
      }
    });
    setErrors({});
    setSubmitSuccess(false);
  };

  /**
   * Validar y enviar formulario
   */
  const submitForm = async () => {
    setLoading(true);
    setErrors({});
    setSubmitSuccess(false);

    try {
      // Validar formulario
      const validation = validatePersonalForm(formData);
      if (!validation.isValid) {
        setErrors(validation.errors);
        return false;
      }

      // Verificar si el correo ya existe
      const emailExists = await personalService.checkEmailExists(formData.correoInstitucional);
      if (emailExists) {
        setErrors({ correoInstitucional: 'Ya existe personal registrado con este correo' });
        return false;
      }

      // Crear personal
      await personalService.createPersonal(formData);
      
      setSubmitSuccess(true);
      resetForm();
      return true;

    } catch (error) {
      setErrors({ 
        submit: error.message || 'Ocurrió un error al crear el personal' 
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    // Datos del formulario
    formData,
    
    // Estados de control
    loading,
    errors,
    roles,
    rolesLoading,
    submitSuccess,
    
    // Métodos
    updateField,
    updatePermission,
    resetForm,
    submitForm,
    loadRoles
  };
};