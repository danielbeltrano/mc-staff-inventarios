import { useState, useEffect } from 'react';
import { supabaseStudentClient } from '../../core/config/supabase/supabaseCampusStudentClient';

/**
 * Hook para obtener estadísticas administrativas completas del sistema de permisos y usuarios
 * Solo para superadministradores
 */
export const useAdminPermissionsStats = () => {
  const [stats, setStats] = useState({
    // Estadísticas de usuarios
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    usersWithPermissions: 0,
    usersWithoutPermissions: 0,
    
    // Estadísticas de servicios
    totalServices: 0,
    
    // Distribuciones
    usersByRole: {},
    inactiveUsersByRole: {},
    usersByHierarchy: {},
    serviceUsage: {},
    
    // Estados de carga
    loading: true,
    error: null,
    lastUpdated: null
  });

  const loadStats = async () => {
    try {
      setStats(prev => ({ ...prev, loading: true, error: null }));

      // 1. Obtener TODOS los usuarios (activos e inactivos)
      const { data: allUsersData, error: allUsersError } = await supabaseStudentClient
        .from('personal_mc')
        .select('uuid, rol, estado, primer_nombre, primer_apellido, correo_institucional')
        .order('primer_apellido', { ascending: true });

      if (allUsersError) throw allUsersError;

      // 2. Obtener usuarios con permisos activos
      const { data: permissionsData, error: permissionsError } = await supabaseStudentClient
        .from('accesos_usuario')
        .select(`
          usuario_uuid,
          nivel_jerarquico,
          bienestar,
          admisiones,
          matriculas,
          academico,
          recursos_humanos,
          financiero,
          administrador,
          activo
        `)
        .eq('activo', true);

      if (permissionsError) throw permissionsError;

      // 3. Obtener servicios disponibles
      const { data: servicesData, error: servicesError } = await supabaseStudentClient
        .from('servicios')
        .select('clave_servicio, nombre_servicio, activo')
        .eq('activo', true);

      if (servicesError) throw servicesError;

      // 4. Procesar estadísticas básicas
      const totalUsers = allUsersData.length;
      const activeUsers = allUsersData.filter(user => user.estado === 'activo').length;
      const inactiveUsers = allUsersData.filter(user => user.estado === 'inactivo').length;
      const usersWithPermissions = permissionsData.length;
      const usersWithoutPermissions = activeUsers - usersWithPermissions;
      const totalServices = servicesData.length;

      // 5. Agrupar usuarios activos por rol
      const usersByRole = allUsersData
        .filter(user => user.estado === 'activo')
        .reduce((acc, user) => {
          const role = user.rol || 'Sin rol asignado';
          acc[role] = (acc[role] || 0) + 1;
          return acc;
        }, {});

      // 6. Agrupar usuarios INACTIVOS por rol
      const inactiveUsersByRole = allUsersData
        .filter(user => user.estado === 'inactivo')
        .reduce((acc, user) => {
          const role = user.rol || 'Sin rol asignado';
          acc[role] = (acc[role] || 0) + 1;
          return acc;
        }, {});

      // 7. Agrupar usuarios por nivel jerárquico (solo activos con permisos)
      const usersByHierarchy = permissionsData.reduce((acc, perm) => {
        const level = perm.nivel_jerarquico || 'Sin nivel';
        acc[level] = (acc[level] || 0) + 1;
        return acc;
      }, {});

      // 8. Calcular uso de servicios
      const serviceUsage = {};
      servicesData.forEach(service => {
        const serviceKey = service.clave_servicio;
        const usageCount = permissionsData.filter(perm => 
          perm[serviceKey] === true
        ).length;
        
        serviceUsage[serviceKey] = {
          name: service.nombre_servicio,
          count: usageCount,
          percentage: activeUsers > 0 ? ((usageCount / activeUsers) * 100).toFixed(1) : 0,
          percentageOfTotal: totalUsers > 0 ? ((usageCount / totalUsers) * 100).toFixed(1) : 0
        };
      });

      console.log('📊 Enhanced Admin Stats loaded:', {
        totalUsers,
        activeUsers,
        inactiveUsers,
        usersWithPermissions,
        usersWithoutPermissions,
        totalServices,
        usersByRole,
        inactiveUsersByRole,
        usersByHierarchy,
        serviceUsage
      });

      setStats({
        totalUsers,
        activeUsers,
        inactiveUsers,
        usersWithPermissions,
        usersWithoutPermissions,
        totalServices,
        usersByRole,
        inactiveUsersByRole,
        usersByHierarchy,
        serviceUsage,
        loading: false,
        error: null,
        lastUpdated: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Error loading enhanced admin stats:', error);
      setStats(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }));
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  return {
    ...stats,
    refresh: loadStats
  };
};

export default useAdminPermissionsStats;