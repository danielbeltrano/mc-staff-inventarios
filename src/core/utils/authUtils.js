import { supabaseStucenClient } from '../../core/config/supabase/supabaseCampusStudentClient';

/**
 * Obtiene los datos completos del usuario por email
 * @param {string} email - Email del usuario
 * @returns {Object|null} Datos completos del usuario
 */
export const fetchUsuarioByEmail = async (email) => {
  try {
    const { data, error } = await supabaseStucenClient
      .from('personal_mc')
      .select('*')
      .eq('correo_institucional', email.toLowerCase())
      .single();

    if (error) {
      console.error('Error fetching user by email:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching user by email:', error);
    return null;
  }
};

/**
 * Obtiene los accesos específicos de un usuario desde autenticacion.accesos_usuario
 * @param {string} userUuid - UUID del usuario
 * @returns {Object|null} Accesos del usuario
 */
export const fetchUserAccess = async (userUuid) => {
  try {
    const { data, error } = await supabaseStucenClient
      .from('accesos_usuario')
      .select('*')
      .eq('usuario_uuid', userUuid)
      .eq('activo', true)
      .maybeSingle(); // Usar maybeSingle para permitir null

    if (error) {
      console.error('Error fetching user access:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching user access:', error);
    return null;
  }
};

/**
 * Obtiene información del rol con nivel jerárquico
 * @param {string} roleName - Nombre del rol
 * @returns {Object|null} Información del rol
 */
export const fetchRoleData = async (roleName) => {
  try {
    const { data, error } = await supabaseStucenClient
      .from('roles')
      .select('*')
      .eq('nombre', roleName)
      .single();

    if (error) {
      console.warn('No se encontró información del rol:', roleName, error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching role data:', error);
    return null;
  }
};

/**
 * Obtiene todos los servicios disponibles desde autenticacion.servicios
 * @returns {Array} Lista de servicios
 */
export const fetchAvailableServices = async () => {
  try {
    const { data, error } = await supabaseStucenClient
      .from('servicios')
      .select('*')
      .eq('activo', true)
      .order('orden_visualizacion');

    if (error) {
      console.error('Error fetching services:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching services:', error);
    return [];
  }
};

/**
 * Obtiene todos los roles disponibles
 * @returns {Array} Lista de roles
 */
export const fetchAvailableRoles = async () => {
  try {
    const { data, error } = await supabaseStucenClient
      .from('roles')
      .select('*')
      .order('nombre');

    if (error) {
      console.error('Error fetching roles:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching roles:', error);
    return [];
  }
};

/**
 * Obtiene todos los niveles jerárquicos disponibles
 * @returns {Array} Lista de niveles jerárquicos
 */
export const fetchHierarchicalLevels = async () => {
  try {
    const { data, error } = await supabaseStucenClient
      .from('niveles_jerarquicos')
      .select('*')
      .order('nivel_prioridad');

    if (error) {
      console.error('Error fetching hierarchical levels:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching hierarchical levels:', error);
    return [];
  }
};

/**
 * Actualiza los accesos de un usuario
 * @param {string} userUuid - UUID del usuario
 * @param {Object} accesses - Nuevos accesos
 * @param {string} grantedByUuid - UUID del usuario que otorga los accesos
 * @param {string} reason - Razón del cambio
 * @returns {boolean} Success
 */
export const updateUserAccess = async (userUuid, accesses, grantedByUuid, reason = null) => {
  try {
    // Verificar si ya existe un registro de accesos
    const { data: existingAccess } = await supabaseStucenClient
      .from('accesos_usuario')
      .select('*')
      .eq('usuario_uuid', userUuid)
      .maybeSingle();

    let result;
    
    if (existingAccess) {
      // Actualizar accesos existentes
      const { data, error } = await supabaseStucenClient
        .from('accesos_usuario')
        .update({
          ...accesses,
          updated_at: new Date().toISOString(),
          notas: reason
        })
        .eq('usuario_uuid', userUuid)
        .select()
        .single();

      result = { data, error };
    } else {
      // Crear nuevos accesos
      const { data, error } = await supabaseStucenClient
        .from('accesos_usuario')
        .insert({
          usuario_uuid: userUuid,
          ...accesses,
          otorgado_por: grantedByUuid,
          notas: reason,
          activo: true
        })
        .select()
        .single();

      result = { data, error };
    }

    if (result.error) {
      throw result.error;
    }

    // Registrar en auditoría
    await registerAccessAudit(
      userUuid,
      grantedByUuid,
      existingAccess ? 'UPDATE' : 'CREATE',
      accesses,
      existingAccess || {},
      reason
    );

    return true;
  } catch (error) {
    console.error('Error updating user access:', error);
    return false;
  }
};

/**
 * Registra cambios en la auditoría de accesos
 * @param {string} userAffected - UUID del usuario afectado
 * @param {string} userModifying - UUID del usuario que modifica
 * @param {string} action - Acción realizada
 * @param {Object} newValues - Nuevos valores
 * @param {Object} oldValues - Valores anteriores
 * @param {string} reason - Razón del cambio
 */
const registerAccessAudit = async (userAffected, userModifying, action, newValues, oldValues, reason) => {
  try {
    await supabaseStucenClient
      .from('auditoria_accesos')
      .insert({
        usuario_afectado: userAffected,
        usuario_que_modifica: userModifying,
        accion: action,
        valores_anteriores: oldValues,
        valores_nuevos: newValues,
        razon: reason,
        direccion_ip: await getUserIP()
      });
  } catch (error) {
    console.error('Error registering audit:', error);
  }
};

/**
 * Obtiene la IP del usuario (simplificado)
 */
const getUserIP = async () => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    return 'unknown';
  }
};

/**
 * Verifica si un usuario tiene acceso a un servicio específico
 * @param {string} userUuid - UUID del usuario
 * @param {string} serviceName - Nombre del servicio
 * @returns {boolean} Tiene acceso
 */
export const checkServiceAccess = async (userUuid, serviceName) => {
  try {
    const userAccess = await fetchUserAccess(userUuid);
    return userAccess && userAccess[serviceName] === true;
  } catch (error) {
    console.error('Error checking service access:', error);
    return false;
  }
};

/**
 * Obtiene el nivel jerárquico de un usuario
 * @param {string} userEmail - Email del usuario
 * @returns {string|null} Nivel jerárquico
 */
export const getUserHierarchicalLevel = async (userEmail) => {
  try {
    const userData = await fetchUsuarioByEmail(userEmail);
    if (!userData?.rol) return null;
    
    const roleData = await fetchRoleData(userData.rol);
    return roleData?.nivel_jerarquico || null;
  } catch (error) {
    console.error('Error getting user hierarchical level:', error);
    return null;
  }
};

/**
 * Verifica si un nivel jerárquico tiene acceso a un servicio
 * @param {string} userLevel - Nivel del usuario
 * @param {string} serviceName - Nombre del servicio
 * @returns {boolean} Tiene acceso por jerarquía
 */
export const checkHierarchicalServiceAccess = async (userLevel, serviceName) => {
  try {
    const { data: service, error } = await supabaseStucenClient
      .from('servicios')
      .select('nivel_minimo_requerido')
      .eq('clave_servicio', serviceName)
      .single();

    if (error) {
      return false;
    }

    const levelPriority = {
      'estrategico': 1,
      'tactico': 2,
      'operativo': 3
    };

    const userPriority = levelPriority[userLevel];
    const requiredPriority = levelPriority[service.nivel_minimo_requerido];

    return userPriority <= requiredPriority;
  } catch (error) {
    console.error('Error checking hierarchical service access:', error);
    return false;
  }
};

/**
 * Obtiene usuarios con acceso a un servicio específico
 * @param {string} serviceName - Nombre del servicio
 * @returns {Array} Lista de usuarios con acceso
 */
export const getUsersWithServiceAccess = async (serviceName) => {
  try {
    const { data, error } = await supabaseStucenClient
      .from('accesos_usuario')
      .select(`
        *,
        personal_mc:usuario_uuid(
          correo_institucional,
          primer_nombre,
          primer_apellido,
          rol
        )
      `)
      .eq(serviceName, true)
      .eq('activo', true);

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error getting users with service access:', error);
    return [];
  }
};

/**
 * Obtiene la lista completa de usuarios para administradores
 * @returns {Array} Lista de usuarios
 */
export const fetchAllUsers = async () => {
  try {
    const { data, error } = await supabaseStucenClient
      .from('personal_mc')
      .select(`
        id,
        uuid,
        correo_institucional,
        primer_nombre,
        segundo_nombre,
        primer_apellido,
        segundo_apellido,
        rol,
        estado,
        fecha_ingreso,
        last_login,
        roles:rol(
          nombre,
          descripcion,
          nivel_jerarquico
        )
      `)
      .neq('estado', 'inactivo')
      .order('primer_apellido');

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching all users:', error);
    return [];
  }
};

/**
 * Obtiene usuarios con sus accesos completos para gestión
 * @returns {Array} Lista de usuarios con accesos
 */
export const fetchUsersWithAccess = async () => {
  try {
    // Primero obtener todos los usuarios activos
    const users = await fetchAllUsers();
    
    // Luego obtener los accesos de cada usuario
    const usersWithAccess = await Promise.all(
      users.map(async (user) => {
        if (user.uuid) {
          const access = await fetchUserAccess(user.uuid);
          return {
            ...user,
            accesos: access || {
              bienestar: false,
              admisiones: false,
              matriculas: false,
              academico: false,
              recursos_humanos: false,
              financiero: false
            }
          };
        }
        return {
          ...user,
          accesos: {
            bienestar: false,
            admisiones: false,
            matriculas: false,
            academico: false,
            recursos_humanos: false,
            financiero: false
          }
        };
      })
    );

    return usersWithAccess;
  } catch (error) {
    console.error('Error fetching users with access:', error);
    return [];
  }
};

/**
 * Desactiva todos los accesos de un usuario
 * @param {string} userUuid - UUID del usuario
 * @param {string} deactivatedByUuid - UUID del usuario que desactiva
 * @param {string} reason - Razón de la desactivación
 * @returns {boolean} Success
 */
export const deactivateUserAccess = async (userUuid, deactivatedByUuid, reason) => {
  try {
    const { error } = await supabaseStucenClient
      .from('accesos_usuario')
      .update({
        activo: false,
        updated_at: new Date().toISOString(),
        notas: reason
      })
      .eq('usuario_uuid', userUuid);

    if (error) {
      throw error;
    }

    // Registrar en auditoría
    await registerAccessAudit(
      userUuid,
      deactivatedByUuid,
      'DEACTIVATE',
      { activo: false },
      { activo: true },
      reason
    );

    return true;
  } catch (error) {
    console.error('Error deactivating user access:', error);
    return false;
  }
};

/**
 * Reactiva los accesos de un usuario
 * @param {string} userUuid - UUID del usuario
 * @param {string} reactivatedByUuid - UUID del usuario que reactiva
 * @param {string} reason - Razón de la reactivación
 * @returns {boolean} Success
 */
export const reactivateUserAccess = async (userUuid, reactivatedByUuid, reason) => {
  try {
    const { error } = await supabaseStucenClient
      .from('accesos_usuario')
      .update({
        activo: true,
        updated_at: new Date().toISOString(),
        notas: reason
      })
      .eq('usuario_uuid', userUuid);

    if (error) {
      throw error;
    }

    // Registrar en auditoría
    await registerAccessAudit(
      userUuid,
      reactivatedByUuid,
      'REACTIVATE',
      { activo: true },
      { activo: false },
      reason
    );

    return true;
  } catch (error) {
    console.error('Error reactivating user access:', error);
    return false;
  }
};

/**
 * Obtiene el historial de auditoría de un usuario
 * @param {string} userUuid - UUID del usuario
 * @param {number} limit - Límite de registros
 * @returns {Array} Historial de auditoría
 */
export const getUserAuditHistory = async (userUuid, limit = 50) => {
  try {
    const { data, error } = await supabaseStucenClient
      .from('auditoria_accesos')
      .select(`
        *,
        usuario_modificador:usuario_que_modifica(
          correo_institucional,
          primer_nombre,
          primer_apellido
        )
      `)
      .eq('usuario_afectado', userUuid)
      .order('fecha_cambio', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error getting user audit history:', error);
    return [];
  }
};

/**
 * Actualiza el rol de un usuario
 * @param {string} userUuid - UUID del usuario
 * @param {string} newRole - Nuevo rol
 * @param {string} updatedByUuid - UUID del usuario que actualiza
 * @returns {boolean} Success
 */
export const updateUserRole = async (userUuid, newRole, updatedByUuid) => {
  try {
    const { error } = await supabaseStucenClient
      .from('personal_mc')
      .update({
        rol: newRole,
        updated_at: new Date().toISOString()
      })
      .eq('uuid', userUuid);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error updating user role:', error);
    return false;
  }
};

/**
 * Verifica permisos de usuario de forma granular
 * @param {Object} userAccess - Accesos del usuario
 * @param {string} userRole - Rol del usuario
 * @param {string} requiredService - Servicio requerido
 * @param {Array} requiredRoles - Roles requeridos
 * @param {string} requiredLevel - Nivel jerárquico requerido
 * @param {Object} roleData - Datos del rol con nivel jerárquico
 * @returns {boolean} Tiene permisos
 */
export const checkUserPermissions = (userAccess, userRole, requiredService = null, requiredRoles = [], requiredLevel = null, roleData = null) => {
  // Superadministrador tiene acceso a todo
  if (userRole === "superadministrador") return true;

  // Verificar roles requeridos
  if (requiredRoles.length > 0 && !requiredRoles.includes(userRole)) {
    return false;
  }

  // Verificar nivel jerárquico si es requerido
  if (requiredLevel && roleData) {
    const userLevel = roleData.nivel_jerarquico;
    if (!userLevel) return false;

    const levelPriority = {
      'estrategico': 1,
      'tactico': 2,
      'operativo': 3
    };

    const userPriority = levelPriority[userLevel];
    const requiredPriority = levelPriority[requiredLevel];

    if (userPriority > requiredPriority) {
      return false;
    }
  }

  // Verificar acceso al servicio específico
  if (requiredService) {
    if (!userAccess) return false;
    return userAccess[requiredService] === true;
  }

  return true;
};

/**
 * Crea un nuevo usuario en el sistema
 * @param {Object} userData - Datos del usuario
 * @param {string} createdByUuid - UUID del usuario que crea
 * @returns {boolean} Success
 */
export const createUser = async (userData, createdByUuid) => {
  try {
    const { error } = await supabaseStucenClient
      .from('personal_mc')
      .insert({
        ...userData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error creating user:', error);
    return false;
  }
};

/**
 * Actualiza los datos de un usuario
 * @param {string} userUuid - UUID del usuario
 * @param {Object} userData - Nuevos datos
 * @param {string} updatedByUuid - UUID del usuario que actualiza
 * @returns {boolean} Success
 */
export const updateUser = async (userUuid, userData, updatedByUuid) => {
  try {
    const { error } = await supabaseStucenClient
      .from('personal_mc')
      .update({
        ...userData,
        updated_at: new Date().toISOString()
      })
      .eq('uuid', userUuid);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error updating user:', error);
    return false;
  }
};

/**
 * Desactiva un usuario del sistema
 * @param {string} userUuid - UUID del usuario
 * @param {string} deactivatedByUuid - UUID del usuario que desactiva
 * @param {string} reason - Razón de la desactivación
 * @returns {boolean} Success
 */
export const deactivateUser = async (userUuid, deactivatedByUuid, reason) => {
  try {
    // Desactivar usuario
    const { error: userError } = await supabaseStucenClient
      .from('personal_mc')
      .update({
        estado: 'inactivo',
        updated_at: new Date().toISOString()
      })
      .eq('uuid', userUuid);

    if (userError) {
      throw userError;
    }

    // Desactivar accesos
    await deactivateUserAccess(userUuid, deactivatedByUuid, reason);

    return true;
  } catch (error) {
    console.error('Error deactivating user:', error);
    return false;
  }
};

/**
 * Reactiva un usuario del sistema
 * @param {string} userUuid - UUID del usuario
 * @param {string} reactivatedByUuid - UUID del usuario que reactiva
 * @param {string} reason - Razón de la reactivación
 * @returns {boolean} Success
 */
export const reactivateUser = async (userUuid, reactivatedByUuid, reason) => {
  try {
    // Reactivar usuario
    const { error: userError } = await supabaseStucenClient
      .from('personal_mc')
      .update({
        estado: 'activo',
        updated_at: new Date().toISOString()
      })
      .eq('uuid', userUuid);

    if (userError) {
      throw userError;
    }

    // Reactivar accesos
    await reactivateUserAccess(userUuid, reactivatedByUuid, reason);

    return true;
  } catch (error) {
    console.error('Error reactivating user:', error);
    return false;
  }
};

/**
 * Busca usuarios por diferentes criterios
 * @param {Object} searchCriteria - Criterios de búsqueda
 * @returns {Array} Lista de usuarios encontrados
 */
export const searchUsers = async (searchCriteria) => {
  try {
    let query = supabaseStucenClient
      .from('personal_mc')
      .select(`
        id,
        uuid,
        correo_institucional,
        primer_nombre,
        segundo_nombre,
        primer_apellido,
        segundo_apellido,
        rol,
        estado,
        fecha_ingreso,
        last_login,
        roles:rol(
          nombre,
          descripcion,
          nivel_jerarquico
        )
      `);

    // Aplicar filtros según criterios
    if (searchCriteria.email) {
      query = query.ilike('correo_institucional', `%${searchCriteria.email}%`);
    }

    if (searchCriteria.name) {
      query = query.or(`primer_nombre.ilike.%${searchCriteria.name}%,primer_apellido.ilike.%${searchCriteria.name}%`);
    }

    if (searchCriteria.role) {
      query = query.eq('rol', searchCriteria.role);
    }

    if (searchCriteria.estado) {
      query = query.eq('estado', searchCriteria.estado);
    }

    // Ordenar resultados
    query = query.order('primer_apellido');

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error searching users:', error);
    return [];
  }
};

/**
 * Obtiene estadísticas de usuarios del sistema
 * @returns {Object} Estadísticas de usuarios
 */
export const getUserStats = async () => {
  try {
    // Contar usuarios por estado
    const { data: statusStats, error: statusError } = await supabaseStucenClient
      .from('personal_mc')
      .select('estado')
      .not('estado', 'is', null);

    if (statusError) throw statusError;

    // Contar usuarios por rol
    const { data: roleStats, error: roleError } = await supabaseStucenClient
      .from('personal_mc')
      .select('rol')
      .not('rol', 'is', null)
      .eq('estado', 'activo');

    if (roleError) throw roleError;

    // Contar accesos por servicio
    const { data: accessStats, error: accessError } = await supabaseStucenClient
      .from('accesos_usuario')
      .select('bienestar, admisiones, matriculas, academico, recursos_humanos, financiero')
      .eq('activo', true);

    if (accessError) throw accessError;

    // Procesar estadísticas
    const stats = {
      totalUsers: statusStats.length,
      usersByStatus: statusStats.reduce((acc, user) => {
        acc[user.estado] = (acc[user.estado] || 0) + 1;
        return acc;
      }, {}),
      usersByRole: roleStats.reduce((acc, user) => {
        acc[user.rol] = (acc[user.rol] || 0) + 1;
        return acc;
      }, {}),
      accessByService: {
        bienestar: accessStats.filter(a => a.bienestar).length,
        admisiones: accessStats.filter(a => a.admisiones).length,
        matriculas: accessStats.filter(a => a.matriculas).length,
        academico: accessStats.filter(a => a.academico).length,
        recursos_humanos: accessStats.filter(a => a.recursos_humanos).length,
        financiero: accessStats.filter(a => a.financiero).length,
      }
    };

    return stats;
  } catch (error) {
    console.error('Error getting user stats:', error);
    return {
      totalUsers: 0,
      usersByStatus: {},
      usersByRole: {},
      accessByService: {}
    };
  }
};

/**
 * Valida si un email es único en el sistema
 * @param {string} email - Email a validar
 * @param {string} excludeUuid - UUID a excluir de la validación (para edición)
 * @returns {boolean} Es único
 */
export const validateUniqueEmail = async (email, excludeUuid = null) => {
  try {
    let query = supabaseStucenClient
      .from('personal_mc')
      .select('uuid')
      .eq('correo_institucional', email.toLowerCase());

    if (excludeUuid) {
      query = query.neq('uuid', excludeUuid);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data.length === 0;
  } catch (error) {
    console.error('Error validating unique email:', error);
    return false;
  }
};

/**
 * Obtiene la configuración de servicios con sus niveles requeridos
 * @returns {Array} Configuración de servicios
 */
export const getServicesConfiguration = async () => {
  try {
    const { data, error } = await supabaseStucenClient
      .from('servicios')
      .select(`
        *,
        nivel_minimo:nivel_minimo_requerido(
          nombre,
          descripcion,
          nivel_prioridad
        )
      `)
      .eq('activo', true)
      .order('orden_visualizacion');

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error getting services configuration:', error);
    return [];
  }
};

