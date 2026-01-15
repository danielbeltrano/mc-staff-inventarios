// import React from 'react';
// import { useSelector } from 'react-redux';
// import { Navigate, useLocation, Outlet } from 'react-router-dom';
// import LoadingSpinner from '../LoadingSpinner';  // Asumimos que tienes un componente de spinner

// const ProtectedRoute = ({ allowedRoles }) => {
//   const { user, status } = useSelector((state) => state.auth);
//   const location = useLocation();

//   // Mostrar un spinner mientras la sesión se restaura
//   if (status === 'loading') {
//     return (
//       <div className="w-full mt-4 p-4 flex justify-center items-center">
//         <LoadingSpinner />
//       </div>
//     );
//   }

//   // Si la restauración de sesión falló o no hay usuario autenticado
//   if (status === 'failed' || !user) {
//     return <Navigate to="/" state={{ from: location }} replace />;
//   }

//   // Si se especifican roles permitidos y el usuario no tiene uno de esos roles, redirigir
//   if (allowedRoles && !allowedRoles.includes(user.role)) {
//     return <Navigate to="/unauthorized" state={{ from: location }} replace />;
//   }

//   // Si todo está bien, renderizar el contenido protegido
//   return <Outlet />;
// };

// export default ProtectedRoute;


import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import LoadingSpinner from '../LoadingSpinner';
import { fetchUserPermissions, checkPermission } from '../../redux/slices/permissionsSlice';

const ProtectedRoute = ({ 
  allowedRoles = [], 
  requiredService = null,
  fallbackRoute = "/",
  unauthorizedRoute = "/unauthorized" 
}) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const [validationComplete, setValidationComplete] = useState(false);
  const [accessGranted, setAccessGranted] = useState(false);
  
  // Selectores Redux
  const { user, status: authStatus, role } = useSelector((state) => state.auth);
  const { permissions, status: permissionsStatus, error: permissionsError } = useSelector((state) => state.permissions);

  useEffect(() => {
    const validateAccess = async () => {
      // Reset validation state
      setValidationComplete(false);
      setAccessGranted(false);

      try {
        // 1. Verificar autenticación básica
        if (authStatus === 'loading') {
          return; // Esperar a que termine la autenticación
        }

        if (authStatus === 'failed' || !user) {
          setValidationComplete(true);
          setAccessGranted(false);
          return;
        }

        // 2. Verificar roles si se especifican
        if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
          console.warn(`Acceso denegado: Rol '${role}' no está en roles permitidos:`, allowedRoles);
          setValidationComplete(true);
          setAccessGranted(false);
          return;
        }

        // 3. Si no se requiere servicio específico, permitir acceso
        if (!requiredService) {
          setValidationComplete(true);
          setAccessGranted(true);
          return;
        }

        // 4. Verificar permisos de servicio
        if (!user.uuid) {
          console.error('UUID de usuario no disponible');
          setValidationComplete(true);
          setAccessGranted(false);
          return;
        }

        // Si los permisos no están cargados, cargarlos
        if (permissionsStatus === 'idle' || !permissions.hasPermissions) {
          console.log('Cargando permisos de usuario...');
          await dispatch(fetchUserPermissions(user.uuid)).unwrap();
        }

        // Esperar a que los permisos se carguen
        if (permissionsStatus === 'loading') {
          return;
        }

        // Si falló la carga de permisos
        if (permissionsStatus === 'failed') {
          console.error('Error cargando permisos:', permissionsError);
          setValidationComplete(true);
          setAccessGranted(false);
          return;
        }

        // Verificar acceso al servicio específico
        const servicePermission = permissions.permissions[requiredService];
        
        if (!servicePermission) {
          console.warn(`Servicio '${requiredService}' no encontrado en permisos`);
          setValidationComplete(true);
          setAccessGranted(false);
          return;
        }

        const canAccess = servicePermission.canAccess;
        
        if (!canAccess) {
          console.warn(`Acceso denegado al servicio '${requiredService}':`, {
            hasPermission: servicePermission.hasPermission,
            hasHierarchy: servicePermission.hasHierarchy,
            requiredLevel: servicePermission.requiredLevel,
            userLevel: permissions.hierarchyLevel
          });
        }

        setValidationComplete(true);
        setAccessGranted(canAccess);

      } catch (error) {
        console.error('Error en validación de acceso:', error);
        setValidationComplete(true);
        setAccessGranted(false);
      }
    };

    validateAccess();
  }, [
    authStatus, 
    user, 
    role, 
    allowedRoles, 
    requiredService, 
    permissions, 
    permissionsStatus, 
    permissionsError,
    dispatch
  ]);

  // Mostrar spinner mientras se valida el acceso
  if (!validationComplete || authStatus === 'loading' || permissionsStatus === 'loading') {
    return (
      <div className="w-full mt-4 p-4 flex justify-center items-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Si la validación completó pero no se otorgó acceso
  if (!accessGranted) {
    // Si no está autenticado, redirigir a home
    if (!user) {
      return <Navigate to={fallbackRoute} state={{ from: location }} replace />;
    }
    
    // Si está autenticado pero no tiene permisos, redirigir a página de no autorizado
    return <Navigate to={unauthorizedRoute} state={{ from: location }} replace />;
  }

  // Si todo está bien, renderizar el contenido protegido
  return <Outlet />;
};

export default ProtectedRoute;