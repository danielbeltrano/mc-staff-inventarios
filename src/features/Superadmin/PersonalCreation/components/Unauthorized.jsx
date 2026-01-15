import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Shield, ArrowLeft, AlertTriangle, User } from 'lucide-react';
import PermissionsInfo from '../../../../components/PermissionsInfo';
import usePermissions from '../../../../hooks/usePermissions';

const Unauthorized = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, role } = useSelector((state) => state.auth);
  const { permissions, isReady } = usePermissions();

  const attemptedRoute = location.state?.from?.pathname || 'la página solicitada';

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    // Redirigir según el rol del usuario
    switch (role) {
      case "director_grupo":
      case "jefe_nivel":
        navigate("/directorgrupo");
        break;
      case "coordinador_general":
        navigate("/coordinadorgrupo");
        break;
      case "admin_bienestar":
      case "profesional_bienestar":
        navigate("/bienestar/dashboard");
        break;
      case "superadministrador":
        navigate("/superadmin");
        break;
      default:
        navigate("/");
        break;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          
          {/* Header con icono de error */}
          <div className="text-center mb-8">
            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-100 mb-4">
              <Shield className="h-10 w-10 text-red-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Acceso Denegado
            </h1>
            <p className="text-lg text-gray-600">
              No tienes permisos para acceder a {attemptedRoute}
            </p>
          </div>

          {/* Información del usuario actual */}
          {user && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="font-medium text-blue-900">
                    Sesión activa como: {user.email}
                  </p>
                  <p className="text-sm text-blue-700">
                    Rol: {role}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Mostrar información de permisos si están disponibles */}
          {isReady && permissions.hasPermissions ? (
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Tus Permisos Actuales
              </h3>
              <PermissionsInfo showDetailed={true} />
            </div>
          ) : (
            <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-800">
                    Sin permisos asignados
                  </p>
                  <p className="text-sm text-yellow-700">
                    Contacta al administrador del sistema para solicitar los permisos necesarios.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Acciones disponibles */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">
              ¿Qué puedes hacer?
            </h3>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <button
                onClick={handleGoBack}
                className="flex items-center justify-center gap-2 w-full py-3 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver atrás
              </button>

              <button
                onClick={handleGoHome}
                className="flex items-center justify-center gap-2 w-full py-3 px-4 border border-transparent rounded-md shadow-sm bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Ir a mi dashboard
              </button>
            </div>

            {/* Información adicional */}
            <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">
                ¿Necesitas acceso a esta funcionalidad?
              </h4>
              <p className="text-sm text-gray-600 mb-3">
                Contacta al administrador del sistema para solicitar los permisos necesarios:
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Explica qué funcionalidad necesitas</li>
                <li>• Justifica por qué necesitas este acceso</li>
                <li>• Indica tu rol actual: <span className="font-medium">{role}</span></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;