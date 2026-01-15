//hooks/usePermissions/

import { useSelector, useDispatch } from 'react-redux';
import { useCallback, useMemo, useEffect } from 'react';
import { fetchUserPermissions, checkPermission } from '../../redux/slices/permissionsSlice';

/**
 * Hook personalizado para manejar permisos de usuario
 * @returns {Object} Objeto con métodos y datos de permisos
 */
export const usePermissions = () => {
  const dispatch = useDispatch();
  
  const { user } = useSelector((state) => state.auth);
  const permissionsState = useSelector((state) => state.permissions);

  // Debug logging
  useEffect(() => {
    // console.log('🎣 usePermissions - Auth user:', user);
    // console.log('🎣 usePermissions - Permissions state:', permissionsState);
  }, [user, permissionsState]);

  // Auto-load permissions cuando el usuario este logueado
  useEffect(() => {
    if (user?.uuid && permissionsState.status === 'idle') {
      // console.log('🚀 Auto-loading permissions for user:', user.uuid);
      dispatch(fetchUserPermissions(user.uuid));
    }
  }, [user?.uuid, permissionsState.status, dispatch]);

  const { permissions, status, error } = permissionsState;

  /**
   * Verifica si el usuario tiene acceso a un servicio específico
   * @param {string} service - Clave del servicio (ej: 'bienestar', 'admisiones')
   * @returns {boolean} true si tiene acceso, false si no
   */
  const hasServiceAccess = useCallback((service) => {
    // console.log(`🔍 Checking service access for: ${service}`, {
    //   hasPermissions: permissions.hasPermissions,
    //   servicePermission: permissions.permissions[service],
    //   canAccess: permissions.permissions[service]?.canAccess
    // });

    //console.log("my permissions", permissions);
    if (!permissions.hasPermissions || !permissions.permissions[service]) {
      return false;
    }
    return permissions.permissions[service].canAccess;
  }, [permissions]);

  /**
   * Verifica si el usuario tiene el permiso específico (sin validar jerarquía)
   * @param {string} service - Clave del servicio
   * @returns {boolean} true si tiene el permiso otorgado
   */
  const hasPermission = useCallback((service) => {
    if (!permissions.hasPermissions || !permissions.permissions[service]) {
      return false;
    }
    return permissions.permissions[service].hasPermission;
  }, [permissions]);

  /**
   * Verifica si el usuario tiene el nivel jerárquico suficiente para un servicio
   * @param {string} service - Clave del servicio
   * @returns {boolean} true si tiene el nivel jerárquico suficiente
   */
  const hasHierarchyLevel = useCallback((service) => {
    if (!permissions.hasPermissions || !permissions.permissions[service]) {
      return false;
    }
    return permissions.permissions[service].hasHierarchy;
  }, [permissions]);

  /**
   * Obtiene información detallada de un permiso específico
   * @param {string} service - Clave del servicio
   * @returns {Object|null} Objeto con información del permiso o null
   */
  const getPermissionInfo = useCallback((service) => {
    if (!permissions.hasPermissions || !permissions.permissions[service]) {
      return null;
    }
    return permissions.permissions[service];
  }, [permissions]);

  /**
   * Refresca los permisos del usuario actual
   * @returns {Promise} Promise de la acción de recarga
   */
  const refreshPermissions = useCallback(async () => {
    if (!user?.uuid) {
      throw new Error('UUID de usuario no disponible');
    }
    // console.log('🔄 Refreshing permissions for user:', user.uuid);
    return dispatch(fetchUserPermissions(user.uuid));
  }, [dispatch, user?.uuid]);

  /**
   * Verifica un permiso específico (útil para validaciones puntuales)
   * @param {string} service - Clave del servicio
   * @returns {Promise} Promise con el resultado de la verificación
   */
  const checkSpecificPermission = useCallback(async (service) => {
    if (!user?.uuid) {
      throw new Error('UUID de usuario no disponible');
    }
    return dispatch(checkPermission({ userUuid: user.uuid, service }));
  }, [dispatch, user?.uuid]);

  /**
   * Verifica si el usuario tiene acceso a múltiples servicios
   * @param {string[]} services - Array de claves de servicios
   * @param {boolean} requireAll - Si requiere todos los servicios (AND) o al menos uno (OR)
   * @returns {boolean} true si cumple la condición
   */
  const hasMultipleServiceAccess = useCallback((services, requireAll = false) => {
    if (!Array.isArray(services) || services.length === 0) {
      return false;
    }

    const results = services.map(service => hasServiceAccess(service));
    
    return requireAll 
      ? results.every(result => result)  // Todos deben ser true
      : results.some(result => result);   // Al menos uno debe ser true
  }, [hasServiceAccess]);

  /**
   * Obtiene una lista de servicios a los que el usuario tiene acceso
   * @returns {string[]} Array con las claves de servicios accesibles
   */
  const getAccessibleServices = useMemo(() => {
    if (!permissions.hasPermissions) {
      return [];
    }

    const accessible = Object.entries(permissions.permissions)
      .filter(([_, permission]) => permission.canAccess)
      .map(([serviceKey, _]) => serviceKey);

    // console.log('📝 Accessible services:', accessible);
    return accessible;
  }, [permissions]);

  /**
   * Obtiene estadísticas de permisos del usuario
   * @returns {Object} Objeto con estadísticas
   */
  const getPermissionStats = useMemo(() => {
    if (!permissions.hasPermissions) {
      return {
        totalServices: 0,
        accessibleServices: 0,
        permissionsGranted: 0,
        hierarchyRestricted: 0,
        totalUsers: 0,
        usersWithPermissions: 0
      };
    }

    const services = Object.values(permissions.permissions);
    
    // console.log("totalServices", services.length);
    // console.log("accessibleServices", services.filter(p => p.canAccess).length);
    // console.log("permissionsGranted", services.filter(p => p.hasPermission).length);
    // console.log("hierarchyRestricted", services.filter(p => p.hasPermission && !p.hasHierarchy).length);
    return {
      totalServices: services.length,
      accessibleServices: services.filter(p => p.canAccess).length,
      permissionsGranted: services.filter(p => p.hasPermission).length,
      hierarchyRestricted: services.filter(p => p.hasPermission && !p.hasHierarchy).length,
    };
  }, [permissions]);

  /**
   * Verifica si los permisos están cargados y son válidos
   * @returns {boolean} true si los permisos están listos para usar
   */
  const isPermissionsReady = useMemo(() => {
    const ready = status === 'succeeded' && permissions.hasPermissions;
    // console.log('✅ Permissions ready:', ready, { status, hasPermissions: permissions.hasPermissions });
    return ready;
  }, [status, permissions.hasPermissions]);

  return {
    // Datos
    permissions,
    status,
    error,
    user,
    isReady: isPermissionsReady,
    accessibleServices: getAccessibleServices,
    stats: getPermissionStats,
    
    // Métodos de verificación
    hasServiceAccess,
    hasPermission,
    hasHierarchyLevel,
    hasMultipleServiceAccess,
    
    // Métodos de información
    getPermissionInfo,
    
    // Métodos de gestión
    refreshPermissions,
    checkSpecificPermission
  };
};

export default usePermissions;