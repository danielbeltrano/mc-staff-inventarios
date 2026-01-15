// ===================================================================
// 🔐 useAuth.jsx - Hook de Autenticación
// ===================================================================

import { useSelector, useDispatch } from 'react-redux';
import { useEffect, useCallback } from 'react';
import { 
  loginUser, 
  logoutUser, 
  registerUser, 
  restoreSession,
  clearAuthError,
  updateUserLastLogin,
  fetchUsuarios 
} from '../../redux/slices/authSlice';

/**
 * Hook personalizado para manejar la autenticación
 * Basado en el authSlice existente del sistema
 */
export const useAuth = () => {
  const dispatch = useDispatch();
  
  // Selectors del estado de autenticación
  const auth = useSelector((state) => state.auth);
  const { user, role, usuarios, status, error } = auth;

  // Estados derivados para facilitar el uso
  const isAuthenticated = !!user;
  const isLoading = status === 'loading';
  const isIdle = status === 'idle';
  const isSucceeded = status === 'succeeded';
  const isFailed = status === 'failed';

  // Información del usuario procesada para el Portal de Empleados
  const userInfo = user ? {
    id: user.id,
    uuid: user.uuid,
    email: user.email,
    role: user.role || role,
    personal_mc_id: user.personal_mc_id || user.id, // Para compatibilidad con containers
    primer_nombre: user.primer_nombre,
    segundo_nombre: user.segundo_nombre,
    primer_apellido: user.primer_apellido,
    segundo_apellido: user.segundo_apellido,
    correo_institucional: user.email,
    last_login: user.last_login,
    estado: user.estado || 'activo'
  } : null;

  // Función para iniciar sesión
  const login = useCallback(async (credentials) => {
    try {
      const result = await dispatch(loginUser(credentials)).unwrap();
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error };
    }
  }, [dispatch]);

  // Función para cerrar sesión
  const logout = useCallback(async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  }, [dispatch]);

  // Función para registrar usuario (solo para superadministradores)
  const register = useCallback(async (userData) => {
    try {
      const result = await dispatch(registerUser(userData)).unwrap();
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error };
    }
  }, [dispatch]);

  // Función para restaurar sesión al cargar la aplicación
  const restoreUserSession = useCallback(async () => {
    try {
      const result = await dispatch(restoreSession()).unwrap();
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error };
    }
  }, [dispatch]);

  // Función para obtener lista de usuarios (superadministrador)
  const loadUsuarios = useCallback(async () => {
    try {
      const result = await dispatch(fetchUsuarios()).unwrap();
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error };
    }
  }, [dispatch]);

  // Función para limpiar errores
  const clearError = useCallback(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  // Función para actualizar último login
  const updateLastLogin = useCallback(() => {
    dispatch(updateUserLastLogin());
  }, [dispatch]);

  // Verificar permisos específicos (integración con el Portal de Empleados)
  const hasPortalAccess = useCallback(() => {
    if (!isAuthenticated) return false;
    
    // Verificar si el usuario tiene acceso al portal de empleados
    // Esto se puede expandir según tus reglas de negocio
    const allowedRoles = [
      'admin_rrhh',
      'profesional_rrhh', 
      'asistente_rrhh',
      'jefe_departamento',
      'coordinador',
      'empleado' // Rol básico para empleados
    ];
    
    return allowedRoles.includes(role) || allowedRoles.includes(user?.role);
  }, [isAuthenticated, role, user]);

  // Verificar si es administrador de RRHH
  const isHRAdmin = useCallback(() => {
    if (!isAuthenticated) return false;
    
    const adminRoles = ['admin_rrhh', 'superadministrador'];
    return adminRoles.includes(role) || adminRoles.includes(user?.role);
  }, [isAuthenticated, role, user]);

  // Verificar si es empleado regular
  const isEmployee = useCallback(() => {
    if (!isAuthenticated) return false;
    
    // Los empleados pueden ser cualquier rol que no sea administrativo del sistema
    const nonEmployeeRoles = ['superadministrador', 'admin_sistema'];
    const currentRole = role || user?.role;
    
    return !nonEmployeeRoles.includes(currentRole);
  }, [isAuthenticated, role, user]);

  // Obtener información específica del empleado para el portal
  const getEmployeeInfo = useCallback(() => {
    if (!userInfo) return null;

    return {
      employeeId: userInfo.personal_mc_id || userInfo.id,
      fullName: `${userInfo.primer_nombre || ''} ${userInfo.segundo_nombre || ''} ${userInfo.primer_apellido || ''} ${userInfo.segundo_apellido || ''}`.trim(),
      displayName: userInfo.primer_nombre || 'Usuario',
      email: userInfo.correo_institucional || userInfo.email,
      role: userInfo.role,
      isActive: userInfo.estado === 'activo',
      uuid: userInfo.uuid
    };
  }, [userInfo]);

  // Auto-restaurar sesión al montar el componente
  useEffect(() => {
    if (isIdle && !isAuthenticated) {
      restoreUserSession();
    }
  }, [isIdle, isAuthenticated, restoreUserSession]);

  // Objeto de retorno del hook
  return {
    // Estado de autenticación
    user: userInfo,
    role,
    usuarios,
    isAuthenticated,
    isLoading,
    isIdle,
    isSucceeded,
    isFailed,
    error,
    
    // Funciones de autenticación
    login,
    logout,
    register,
    restoreSession: restoreUserSession,
    loadUsuarios,
    clearError,
    updateLastLogin,
    
    // Verificaciones de permisos
    hasPortalAccess,
    isHRAdmin,
    isEmployee,
    
    // Información del empleado
    employeeInfo: getEmployeeInfo(),
    
    // Estados de carga específicos
    loading: {
      auth: isLoading,
      login: isLoading && status === 'loading',
      logout: false, // El logout es generalmente rápido
      register: isLoading && status === 'loading'
    }
  };
};

// ===================================================================
// 🛡️ usePermissions.jsx - Hook de Permisos (Complementario)
// ===================================================================

/**
 * Hook complementario para manejar permisos específicos
 * Se integra con el sistema de permisos existente
 */
export const usePermissions = () => {
  const dispatch = useDispatch();
  
  // Asumiendo que tienes un permissionsSlice
  const permissions = useSelector((state) => state.permissions || {});
  const { user } = useAuth();
  
  // Estado de carga de permisos
  const loading = permissions.status === 'loading';
  
  // Función para verificar permisos específicos
  const hasPermission = useCallback((permission) => {
    if (!user) return false;
    
    // Si es superadministrador, tiene todos los permisos
    if (user.role === 'superadministrador') return true;
    
    // Verificar permisos específicos basados en tu lógica
    const userPermissions = permissions.data || {};
    
    // Para el portal de empleados, verificar permisos específicos
    switch (permission) {
      case 'recursos_humanos':
        return userPermissions.recursos_humanos === true ||
               ['admin_rrhh', 'profesional_rrhh', 'asistente_rrhh'].includes(user.role);
      
      case 'portal_empleado':
        return hasPortalAccess(); // Usar la función del hook useAuth
      
      case 'admin_rrhh':
        return ['admin_rrhh', 'superadministrador'].includes(user.role);
      
      case 'gestionar_solicitudes':
        return userPermissions.recursos_humanos === true ||
               ['admin_rrhh', 'profesional_rrhh', 'jefe_departamento'].includes(user.role);
      
      case 'ver_reportes_rrhh':
        return userPermissions.recursos_humanos === true ||
               ['admin_rrhh', 'profesional_rrhh'].includes(user.role);
      
      default:
        return userPermissions[permission] === true;
    }
  }, [user, permissions]);

  // Función para verificar múltiples permisos
  const hasAnyPermission = useCallback((permissionsList) => {
    return permissionsList.some(permission => hasPermission(permission));
  }, [hasPermission]);

  // Función para verificar todos los permisos
  const hasAllPermissions = useCallback((permissionsList) => {
    return permissionsList.every(permission => hasPermission(permission));
  }, [hasPermission]);

  // Obtener nivel de acceso para el portal de RRHH
  const getHRAccessLevel = useCallback(() => {
    if (!user) return 'none';
    
    if (hasPermission('admin_rrhh')) return 'admin';
    if (hasPermission('gestionar_solicitudes')) return 'manager';
    if (hasPermission('portal_empleado')) return 'employee';
    
    return 'none';
  }, [user, hasPermission]);

  return {
    // Estado de permisos
    permissions: permissions.data || {},
    loading,
    error: permissions.error,
    
    // Funciones de verificación
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    
    // Niveles de acceso específicos
    accessLevel: getHRAccessLevel(),
    
    // Permisos comunes pre-calculados para performance
    canAccessPortal: hasPermission('portal_empleado'),
    canManageHR: hasPermission('recursos_humanos'),
    canManageRequests: hasPermission('gestionar_solicitudes'),
    canViewReports: hasPermission('ver_reportes_rrhh'),
    isHRAdmin: hasPermission('admin_rrhh')
  };
};

export default useAuth;