// ============================================================================
// services/rrhhServices/rrhhBaseApi.js
// Servicio base modernizado para operaciones RRHH - Arquitectura funcional
// ============================================================================

import { supabaseStudentClient } from "../../core/config/supabase/supabaseCampusStudentClient";

// ==============================================
// CONSTANTES PARA AUDITORÍA
// ==============================================
const AUDIT_ACTIONS = {
  INSERT: 'INSERT',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE'
};

// Mapeo de acciones comunes a acciones válidas de auditoría
const ACTION_MAPPING = {
  'create': AUDIT_ACTIONS.INSERT,
  'insert': AUDIT_ACTIONS.INSERT,
  'add': AUDIT_ACTIONS.INSERT,
  'new': AUDIT_ACTIONS.INSERT,
  'crear': AUDIT_ACTIONS.INSERT,
  'agregar': AUDIT_ACTIONS.INSERT,
  
  'update': AUDIT_ACTIONS.UPDATE,
  'edit': AUDIT_ACTIONS.UPDATE,
  'modify': AUDIT_ACTIONS.UPDATE,
  'change': AUDIT_ACTIONS.UPDATE,
  'actualizar': AUDIT_ACTIONS.UPDATE,
  'editar': AUDIT_ACTIONS.UPDATE,
  'modificar': AUDIT_ACTIONS.UPDATE,
  
  'delete': AUDIT_ACTIONS.DELETE,
  'remove': AUDIT_ACTIONS.DELETE,
  'destroy': AUDIT_ACTIONS.DELETE,
  'eliminar': AUDIT_ACTIONS.DELETE,
  'borrar': AUDIT_ACTIONS.DELETE
};

/**
 * Normaliza la acción de auditoría para que coincida con los valores permitidos
 * @param {string} action - Acción a normalizar
 * @returns {string} - Acción normalizada o 'UPDATE' por defecto
 */
const normalizeAuditAction = (action) => {
  if (!action || typeof action !== 'string') {
    return AUDIT_ACTIONS.UPDATE;
  }
  
  const normalizedAction = action.toLowerCase().trim();
  
  // Si ya es una acción válida, devolverla en mayúsculas
  if (Object.values(AUDIT_ACTIONS).includes(action.toUpperCase())) {
    return action.toUpperCase();
  }
  
  // Buscar en el mapeo
  return ACTION_MAPPING[normalizedAction] || AUDIT_ACTIONS.UPDATE;
};

/**
 * Factory function para crear servicios RRHH específicos
 * @param {string} tableName - Nombre de la tabla
 * @param {string} schema - Schema de la base de datos
 * @returns {Object} Objeto con todas las operaciones CRUD
 */
export const createRRHHService = (tableName, schema = 'rrhh') => {
  const fullTableName = schema === 'public' ? tableName : `${schema}.${tableName}`;
  
  // Helper para crear queries con schema correcto
  const createQuery = () => {
    return schema === 'public' 
      ? supabaseStudentClient.from(tableName)
      : supabaseStudentClient.schema(schema).from(tableName);
  };

  // ==============================================
  // OPERACIONES CRUD BÁSICAS
  // ==============================================

  /**
   * Obtener todos los registros con filtros opcionales
   */
  const findAll = async (filters = {}, options = {}) => {
    try {
      let query = createQuery();
      
      // Seleccionar campos específicos o todos
      const selectFields = options.select || '*';
      query = query.select(selectFields, { count: 'exact' });

      // Aplicar filtros dinámicamente
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            query = query.in(key, value);
          } else if (typeof value === 'object' && value.operator) {
            // Filtros con operadores personalizados
            const operators = {
              gte: () => query.gte(key, value.value),
              lte: () => query.lte(key, value.value),
              like: () => query.ilike(key, `%${value.value}%`),
              contains: () => query.contains(key, value.value),
              not: () => query.neq(key, value.value),
              default: () => query.eq(key, value.value)
            };
            
            const operation = operators[value.operator] || operators.default;
            operation();
          } else {
            query = query.eq(key, value);
          }
        }
      });

      // Aplicar ordenamiento
      if (options.orderBy) {
        const { field, ascending = true } = options.orderBy;
        query = query.order(field, { ascending });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      // Aplicar paginación
      if (options.page && options.limit) {
        const from = (options.page - 1) * options.limit;
        const to = from + options.limit - 1;
        query = query.range(from, to);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: data || [],
        count: count || 0,
        page: options.page || 1,
        limit: options.limit || data?.length || 0
      };
    } catch (error) {
      console.error(`Error fetching ${tableName}:`, error);
      throw new Error(`Error al obtener registros de ${tableName}: ${error.message}`);
    }
  };

  /**
   * Obtener un registro por ID
   */
  const findById = async (id, selectFields = '*') => {
    try {
      const { data, error } = await createQuery()
        .select(selectFields)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Error fetching ${tableName} by ID:`, error);
      throw new Error(`Error al obtener registro: ${error.message}`);
    }
  };

  /**
   * Crear un nuevo registro con auditoría automática
   */
  const create = async (data, auditOptions = {}) => {
    try {
      const enrichedData = {
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: newRecord, error } = await createQuery()
        .insert(enrichedData)
        .select()
        .single();

      if (error) throw error;

      // Registrar auditoría si se proporcionan opciones
      if (auditOptions.userId) {
        await logAuditAction(
          AUDIT_ACTIONS.INSERT,
          newRecord.id,
          auditOptions.userId,
          {
            descripcion: auditOptions.description || `Nuevo registro creado en ${tableName}`,
            datos_anteriores: null,
            datos_nuevos: newRecord,
            ...auditOptions.details
          }
        );
      }

      return newRecord;
    } catch (error) {
      console.error(`Error creating ${tableName}:`, error);
      throw new Error(`Error al crear registro: ${error.message}`);
    }
  };

  /**
   * Actualizar un registro existente con auditoría automática
   */
  const update = async (id, data, auditOptions = {}) => {
    try {
      // Obtener datos anteriores para auditoría
      const previousData = auditOptions.userId ? await findById(id) : null;

      const enrichedData = {
        ...data,
        updated_at: new Date().toISOString()
      };

      const { data: updatedRecord, error } = await createQuery()
        .update(enrichedData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Registrar auditoría si se proporcionan opciones
      if (auditOptions.userId) {
        await logAuditAction(
          AUDIT_ACTIONS.UPDATE,
          updatedRecord.id,
          auditOptions.userId,
          {
            descripcion: auditOptions.description || `Registro actualizado en ${tableName}`,
            datos_anteriores: previousData,
            datos_nuevos: updatedRecord,
            cambios: data,
            ...auditOptions.details
          }
        );
      }

      return updatedRecord;
    } catch (error) {
      console.error(`Error updating ${tableName}:`, error);
      throw new Error(`Error al actualizar registro: ${error.message}`);
    }
  };

  /**
   * Eliminar un registro (eliminación lógica o física) con auditoría automática
   */
  const remove = async (id, options = {}) => {
    const { hardDelete = false, auditOptions = {} } = options;
    
    try {
      // Obtener datos anteriores para auditoría
      const previousData = auditOptions.userId ? await findById(id) : null;

      if (hardDelete) {
        const { error } = await createQuery().delete().eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await createQuery()
          .update({ 
            activo: false, 
            updated_at: new Date().toISOString() 
          })
          .eq('id', id);
        if (error) throw error;
      }

      // Registrar auditoría si se proporcionan opciones
      if (auditOptions.userId) {
        await logAuditAction(
          AUDIT_ACTIONS.DELETE,
          id,
          auditOptions.userId,
          {
            descripcion: auditOptions.description || `Registro ${hardDelete ? 'eliminado físicamente' : 'eliminado lógicamente'} en ${tableName}`,
            datos_anteriores: previousData,
            datos_nuevos: null,
            tipo_eliminacion: hardDelete ? 'FISICA' : 'LOGICA',
            ...auditOptions.details
          }
        );
      }

      return true;
    } catch (error) {
      console.error(`Error deleting ${tableName}:`, error);
      throw new Error(`Error al eliminar registro: ${error.message}`);
    }
  };

  // ==============================================
  // OPERACIONES ESPECÍFICAS PARA RRHH
  // ==============================================

  /**
   * Generar número único para solicitudes, procesos, etc.
   */
  const generateUniqueNumber = async (prefix, targetTable, fieldName) => {
    try {
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      
      const targetQuery = targetTable === tableName 
        ? createQuery()
        : schema === 'public' 
          ? supabaseStudentClient.from(targetTable)
          : supabaseStudentClient.schema(schema).from(targetTable);

      const { data, error } = await targetQuery
        .select(fieldName)
        .ilike(fieldName, `${prefix}-${year}${month}%`)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      let nextNumber = 1;
      if (data?.length > 0) {
        const lastNumber = data[0][fieldName];
        const match = lastNumber.match(/(\d+)$/);
        if (match) {
          nextNumber = parseInt(match[1]) + 1;
        }
      }

      return `${prefix}-${year}${month}${String(nextNumber).padStart(4, '0')}`;
    } catch (error) {
      console.error('Error generating unique number:', error);
      throw new Error(`Error al generar número único: ${error.message}`);
    }
  };

  /**
   * Búsqueda de texto completo
   */
  const fullTextSearch = async (searchTerm, searchFields = [], additionalFilters = {}) => {
    try {
      let query = createQuery().select('*');

      // Aplicar filtros adicionales
      Object.entries(additionalFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          query = query.eq(key, value);
        }
      });

      // Búsqueda en múltiples campos
      if (searchTerm && searchFields.length > 0) {
        const searchConditions = searchFields
          .map(field => `${field}.ilike.%${searchTerm}%`)
          .join(',');
        query = query.or(searchConditions);
      }

      const { data, error } = await query
        .order('updated_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error in full text search:', error);
      throw new Error(`Error en búsqueda: ${error.message}`);
    }
  };

  /**
   * Obtener estadísticas básicas
   */
  const getStats = async (groupBy = null, filters = {}) => {
    try {
      let query = createQuery();

      // Aplicar filtros
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          query = query.eq(key, value);
        }
      });

      if (groupBy) {
        query = query.select(`${groupBy}, count()`);
      } else {
        query = query.select('*', { count: 'exact', head: true });
      }

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        total: count || 0,
        groups: data || []
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      throw new Error(`Error al obtener estadísticas: ${error.message}`);
    }
  };

  /**
   * Validar si un campo es único
   */
  const isFieldUnique = async (fieldName, value, excludeId = null) => {
    try {
      let query = createQuery()
        .select('id')
        .eq(fieldName, value);

      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return !data || data.length === 0;
    } catch (error) {
      console.error('Error validating field uniqueness:', error);
      throw new Error(`Error al validar unicidad: ${error.message}`);
    }
  };

  // ==============================================
  // OPERACIONES DE ARCHIVOS
  // ==============================================

  /**
   * Subir archivo a Supabase Storage
   */
  const uploadFile = async (file, bucket, folder = '', fileName = null) => {
    try {
      const fileExt = file.name.split('.').pop();
      const finalFileName = fileName || `${Date.now()}.${fileExt}`;
      const filePath = folder ? `${folder}/${finalFileName}` : finalFileName;

      const { data, error } = await supabaseStudentClient.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabaseStudentClient.storage
        .from(bucket)
        .getPublicUrl(filePath);

      return {
        path: data.path,
        publicUrl,
        fileName: finalFileName
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new Error(`Error al subir archivo: ${error.message}`);
    }
  };

  /**
   * Eliminar archivo de Supabase Storage
   */
  const deleteFile = async (bucket, filePath) => {
    try {
      const { error } = await supabaseStudentClient.storage
        .from(bucket)
        .remove([filePath]);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      throw new Error(`Error al eliminar archivo: ${error.message}`);
    }
  };

  /**
   * Registrar acción de auditoría - VERSIÓN CORREGIDA
   */
  const logAuditAction = async (action, recordId, userId, details = {}) => {
    try {
      // Normalizar la acción para que coincida con los valores permitidos
      const normalizedAction = normalizeAuditAction(action);
      
      // Validar parámetros requeridos
      if (!recordId || !userId) {
        console.warn('logAuditAction: recordId y userId son requeridos');
        return false;
      }

      // Mapear los campos según la estructura real de la tabla
      const auditData = {
        // NO incluir 'id' - se genera automáticamente con gen_random_uuid()
        tabla_afectada: tableName,
        accion: normalizedAction,
        registro_id: recordId,
        usuario_id: userId,
        // Mapear detalles a los campos correctos
        valores_anteriores: details.datos_anteriores || null,
        valores_nuevos: details.datos_nuevos || null,
        descripcion_accion: details.descripcion || `Acción ${normalizedAction} en ${tableName}`,
        modulo: details.modulo || 'RRHH',
        detalles: typeof details === 'string' ? details : JSON.stringify(details),
        // direccion_ip en lugar de ip_address
        direccion_ip: details.direccion_ip || null,
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
        // timestamp_accion tiene default now(), pero podemos especificarlo
        timestamp_accion: new Date().toISOString()
      };

      console.log("auditData from logAuditAction", auditData);
      
      const { error } = await supabaseStudentClient
        .from('auditoria_logs')
        .insert(auditData);

      if (error) {
        console.error('Error inserting audit log:', error);
        throw error;
      }
      
      return true;
    } catch (error) {
      console.error('Error logging audit action:', error);
      // No lanzar error para evitar interrumpir operaciones principales
      return false;
    }
  };

  // Retornar todas las funciones del servicio
  return {
    tableName,
    schema,
    fullTableName,
    
    // CRUD básico
    findAll,
    findById,
    create,
    update,
    remove,
    
    // Operaciones específicas
    generateUniqueNumber,
    fullTextSearch,
    getStats,
    isFieldUnique,
    
    // Archivos
    uploadFile,
    deleteFile,
    
    // Auditoría
    logAuditAction,
    
    // Constantes útiles
    AUDIT_ACTIONS
  };
};

// ==============================================
// SERVICIOS ESPECÍFICOS PARA EMPLEADOS
// ==============================================

/**
 * Servicio especializado para operaciones de empleados
 */
export const createEmployeeService = () => {
  const baseService = createRRHHService('v_empleados_completo', 'public');
  
  /**
   * Obtener empleados con filtros específicos para RRHH
   */
  const getEmployeesWithFilters = async (filters = {}) => {
    try {
      let query = supabaseStudentClient
        .from('v_empleados_completo')
        .select('*', { count: 'exact' });

      // Filtros específicos para empleados
      const filterMap = {
        departamento_id: (value) => query.eq('departamento_id', value),
        cargo_id: (value) => query.eq('cargo_id', value),
        estado: (value) => query.eq('estado', value),
        fecha_ingreso_desde: (value) => query.gte('fecha_ingreso', value),
        fecha_ingreso_hasta: (value) => query.lte('fecha_ingreso', value),
        search: (value) => query.or(
          `primer_nombre.ilike.%${value}%,` +
          `primer_apellido.ilike.%${value}%,` +
          `codigo_empleado.ilike.%${value}%,` +
          `correo_institucional.ilike.%${value}%`
        )
      };

      // Aplicar filtros dinámicamente
      Object.entries(filters).forEach(([key, value]) => {
        if (value && filterMap[key]) {
          filterMap[key](value);
        }
      });

      // Ordenamiento
      const orderBy = filters.orderBy || 'primer_apellido';
      const orderDirection = filters.orderDirection ?? true;
      query = query.order(orderBy, { ascending: orderDirection });

      // Paginación
      if (filters.page && filters.limit) {
        const from = (filters.page - 1) * filters.limit;
        const to = from + filters.limit - 1;
        query = query.range(from, to);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: data || [],
        count: count || 0,
        page: filters.page || 1,
        limit: filters.limit || data?.length || 0
      };
    } catch (error) {
      console.error('Error fetching employees with filters:', error);
      throw new Error(`Error al obtener empleados: ${error.message}`);
    }
  };

  /**
   * Obtener información completa de un empleado
   */
  const getEmployeeComplete = async (employeeId) => {
    try {
      const { data, error } = await supabaseStudentClient
        .from('v_empleados_completo')
        .select('*')
        .eq('id', employeeId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching complete employee:', error);
      throw new Error(`Error al obtener información del empleado: ${error.message}`);
    }
  };

  return {
    ...baseService,
    getEmployeesWithFilters,
    getEmployeeComplete
  };
};

// ==============================================
// INSTANCIAS DE SERVICIOS
// ==============================================

// Crear instancias de servicios reutilizables
export const employeeService = createEmployeeService();
export const vacancyService = createRRHHService('vacantes');
export const applicationService = createRRHHService('aplicaciones');
export const requestService = createRRHHService('solicitudes_empleado');
export const attendanceService = createRRHHService('registros_asistencia');
export const departmentService = createRRHHService('departamentos');
export const positionService = createRRHHService('cargos');
export const hiringService = createRRHHService('procesos_contratacion');

// ==============================================
// HOOKS PERSONALIZADOS PARA REACT
// ==============================================

/**
 * Hook personalizado para usar servicios RRHH con estado local
 */
export const useRRHHService = (serviceName) => {
  const services = {
    employees: employeeService,
    vacancies: vacancyService,
    applications: applicationService,
    requests: requestService,
    attendance: attendanceService,
    departments: departmentService,
    positions: positionService,
    hiring: hiringService
  };

  const service = services[serviceName];
  
  if (!service) {
    throw new Error(`Servicio "${serviceName}" no encontrado`);
  }

  return service;
};

// ==============================================
// UTILIDADES PARA REDUX
// ==============================================

/**
 * Helper para crear thunks estandarizados
 */
export const createStandardThunk = (name, serviceMethod) => {
  return async (params, { rejectWithValue }) => {
    try {
      const data = await serviceMethod(params);
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  };
};

/**
 * Helper para operaciones bulk con mejor rendimiento
 */
export const createBulkOperation = async (service, operation, items, batchSize = 10) => {
  const results = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchPromises = batch.map(item => operation(service, item));
    const batchResults = await Promise.allSettled(batchPromises);
    results.push(...batchResults);
  }
  
  return results;
};

// ==============================================
// FUNCIONES AUXILIARES DE AUDITORÍA
// ==============================================

/**
 * Función auxiliar para registrar auditoría desde cualquier parte de la aplicación
 */
export const logAuditAction = async (tableName, action, recordId, userId, details = {}) => {
  try {
    const normalizedAction = normalizeAuditAction(action);
    
    // Mapear los campos según la estructura real de la tabla
    const auditData = {
      // NO incluir 'id' - se genera automáticamente con gen_random_uuid()
      tabla_afectada: tableName,
      accion: normalizedAction,
      registro_id: recordId,
      usuario_id: userId,
      // Mapear detalles a los campos correctos
      valores_anteriores: details.datos_anteriores || null,
      valores_nuevos: details.datos_nuevos || null,
      descripcion_accion: details.descripcion || `Acción ${normalizedAction} en ${tableName}`,
      modulo: details.modulo || 'RRHH',
      detalles: typeof details === 'string' ? details : JSON.stringify(details),
      // direccion_ip en lugar de ip_address
      direccion_ip: details.direccion_ip || null,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      // timestamp_accion tiene default now(), pero podemos especificarlo
      timestamp_accion: new Date().toISOString()
    };

    const { error } = await supabaseStudentClient
      .from('auditoria_logs')
      .insert(auditData);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error logging audit action:', error);
    return false;
  }
};

export default {
  createRRHHService,
  createEmployeeService,
  useRRHHService,
  createStandardThunk,
  createBulkOperation,
  logAuditAction,
  normalizeAuditAction,
  AUDIT_ACTIONS,
  
  // Servicios exportados
  employeeService,
  vacancyService,
  applicationService,
  requestService,
  attendanceService,
  departmentService,
  positionService,
  hiringService
};