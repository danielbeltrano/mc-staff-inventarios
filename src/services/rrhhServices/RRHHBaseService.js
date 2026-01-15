// services/rrhhSrivices/RRHHBaseService.js

import { supabaseStudentClient } from "../../core/config/supabase/supabaseCampusStudentClient"


/**
 * Servicio base para operaciones CRUD del módulo de RRHH
 * Proporciona funcionalidades genéricas y específicas para gestión de recursos humanos
 */
class RRHHBaseService {
  constructor(tableName, schema = 'rrhh') {
    this.tableName = tableName
    this.schema = schema
    this.fullTableName = schema === 'public' ? tableName : `${schema}.${tableName}`
  }

  // ==============================================
  // OPERACIONES CRUD BÁSICAS
  // ==============================================

  /**
   * Obtener todos los registros con filtros opcionales
   * @param {Object} filters - Filtros a aplicar
   * @param {Object} options - Opciones adicionales (ordenamiento, paginación)
   * @returns {Promise<Array>} Lista de registros
   */
  async findAll(filters = {}, options = {}) {
    try {
      let query = supabaseStudentClient.from(this.tableName)

      // Aplicar schema si no es public
      if (this.schema !== 'public') {
        query = supabaseStudentClient.schema(this.schema).from(this.tableName)
      }

      // Seleccionar campos específicos o todos
      const selectFields = options.select || '*'
      query = query.select(selectFields, { count: 'exact' })

      // Aplicar filtros
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            query = query.in(key, value)
          } else if (typeof value === 'object' && value.operator) {
            // Filtros con operadores personalizados
            switch (value.operator) {
              case 'gte':
                query = query.gte(key, value.value)
                break
              case 'lte':
                query = query.lte(key, value.value)
                break
              case 'like':
                query = query.ilike(key, `%${value.value}%`)
                break
              case 'contains':
                query = query.contains(key, value.value)
                break
              case 'not':
                query = query.neq(key, value.value)
                break
              default:
                query = query.eq(key, value.value)
            }
          } else {
            query = query.eq(key, value)
          }
        }
      })

      // Aplicar ordenamiento
      if (options.orderBy) {
        const { field, ascending = true } = options.orderBy
        query = query.order(field, { ascending })
      } else {
        // Ordenamiento por defecto
        query = query.order('created_at', { ascending: false })
      }

      // Aplicar paginación
      if (options.page && options.limit) {
        const from = (options.page - 1) * options.limit
        const to = from + options.limit - 1
        query = query.range(from, to)
      }

      const { data, error, count } = await query

      if (error) throw error

      return {
        data: data || [],
        count: count || 0,
        page: options.page || 1,
        limit: options.limit || data?.length || 0
      }
    } catch (error) {
      console.error(`Error fetching ${this.tableName}:`, error)
      throw new Error(`Error al obtener registros de ${this.tableName}: ${error.message}`)
    }
  }

  /**
   * Obtener un registro por ID
   * @param {string|number} id - ID del registro
   * @param {string} selectFields - Campos a seleccionar
   * @returns {Promise<Object>} Registro encontrado
   */
  async findById(id, selectFields = '*') {
    try {
      let query = supabaseStudentClient.from(this.tableName)

      if (this.schema !== 'public') {
        query = supabaseStudentClient.schema(this.schema).from(this.tableName)
      }

      const { data, error } = await query
        .select(selectFields)
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error(`Error fetching ${this.tableName} by ID:`, error)
      throw new Error(`Error al obtener registro: ${error.message}`)
    }
  }

  /**
   * Crear un nuevo registro
   * @param {Object} data - Datos del nuevo registro
   * @returns {Promise<Object>} Registro creado
   */
  async create(data) {
    try {
      // Agregar timestamps automáticos
      const enrichedData = {
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      let query = supabaseStudentClient.from(this.tableName)

      if (this.schema !== 'public') {
        query = supabaseStudentClient.schema(this.schema).from(this.tableName)
      }

      const { data: newRecord, error } = await query
        .insert(enrichedData)
        .select()
        .single()

      if (error) throw error
      return newRecord
    } catch (error) {
      console.error(`Error creating ${this.tableName}:`, error)
      throw new Error(`Error al crear registro: ${error.message}`)
    }
  }

  /**
   * Actualizar un registro existente
   * @param {string|number} id - ID del registro
   * @param {Object} data - Datos a actualizar
   * @returns {Promise<Object>} Registro actualizado
   */
  async update(id, data) {
    try {
      // Agregar timestamp de actualización
      const enrichedData = {
        ...data,
        updated_at: new Date().toISOString()
      }

      let query = supabaseStudentClient.from(this.tableName)

      if (this.schema !== 'public') {
        query = supabaseStudentClient.schema(this.schema).from(this.tableName)
      }

      const { data: updatedRecord, error } = await query
        .update(enrichedData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return updatedRecord
    } catch (error) {
      console.error(`Error updating ${this.tableName}:`, error)
      throw new Error(`Error al actualizar registro: ${error.message}`)
    }
  }

  /**
   * Eliminar un registro (eliminación lógica si tiene campo 'activo')
   * @param {string|number} id - ID del registro
   * @param {boolean} hardDelete - Si true, elimina físicamente
   * @returns {Promise<boolean>} True si se eliminó correctamente
   */
  async delete(id, hardDelete = false) {
    try {
      let query = supabaseStudentClient.from(this.tableName)

      if (this.schema !== 'public') {
        query = supabaseStudentClient.schema(this.schema).from(this.tableName)
      }

      if (hardDelete) {
        const { error } = await query.delete().eq('id', id)
        if (error) throw error
      } else {
        // Eliminación lógica
        const { error } = await query
          .update({ 
            activo: false, 
            updated_at: new Date().toISOString() 
          })
          .eq('id', id)
        if (error) throw error
      }

      return true
    } catch (error) {
      console.error(`Error deleting ${this.tableName}:`, error)
      throw new Error(`Error al eliminar registro: ${error.message}`)
    }
  }

  // ==============================================
  // OPERACIONES ESPECÍFICAS PARA RRHH
  // ==============================================

  /**
   * Generar número único para solicitudes, procesos, etc.
   * @param {string} prefix - Prefijo del número (ej: 'SOL', 'PROC')
   * @param {string} tableName - Nombre de la tabla
   * @param {string} fieldName - Nombre del campo
   * @returns {Promise<string>} Número único generado
   */
  async generateUniqueNumber(prefix, tableName, fieldName) {
    try {
      const year = new Date().getFullYear()
      const month = String(new Date().getMonth() + 1).padStart(2, '0')
      
      // Buscar el último número del mes actual
      let query = supabaseStudentClient.from(tableName)
      
      if (this.schema !== 'public') {
        query = supabaseStudentClient.schema(this.schema).from(tableName)
      }

      const { data, error } = await query
        .select(fieldName)
        .ilike(fieldName, `${prefix}-${year}${month}%`)
        .order('created_at', { ascending: false })
        .limit(1)

      if (error) throw error

      let nextNumber = 1
      if (data && data.length > 0) {
        const lastNumber = data[0][fieldName]
        const match = lastNumber.match(/(\d+)$/)
        if (match) {
          nextNumber = parseInt(match[1]) + 1
        }
      }

      return `${prefix}-${year}${month}${String(nextNumber).padStart(4, '0')}`
    } catch (error) {
      console.error('Error generating unique number:', error)
      throw new Error(`Error al generar número único: ${error.message}`)
    }
  }

  /**
   * Obtener empleados con filtros específicos para RRHH
   * @param {Object} filters - Filtros específicos
   * @returns {Promise<Object>} Lista de empleados con información completa
   */
  async getEmployeesWithFilters(filters = {}) {
    try {
      let query = supabaseStudentClient
        .from('v_empleados_completo')
        .select('*', { count: 'exact' })

      // Filtros específicos para empleados
      if (filters.departamento_id) {
        query = query.eq('departamento_id', filters.departamento_id)
      }

      if (filters.cargo_id) {
        query = query.eq('cargo_id', filters.cargo_id)
      }

      if (filters.estado) {
        query = query.eq('estado', filters.estado)
      }

      if (filters.search) {
        query = query.or(
          `primer_nombre.ilike.%${filters.search}%,` +
          `primer_apellido.ilike.%${filters.search}%,` +
          `codigo_empleado.ilike.%${filters.search}%,` +
          `correo_institucional.ilike.%${filters.search}%`
        )
      }

      if (filters.fecha_ingreso_desde) {
        query = query.gte('fecha_ingreso', filters.fecha_ingreso_desde)
      }

      if (filters.fecha_ingreso_hasta) {
        query = query.lte('fecha_ingreso', filters.fecha_ingreso_hasta)
      }

      // Ordenamiento
      const orderBy = filters.orderBy || 'primer_apellido'
      const orderDirection = filters.orderDirection || true
      query = query.order(orderBy, { ascending: orderDirection })

      // Paginación
      if (filters.page && filters.limit) {
        const from = (filters.page - 1) * filters.limit
        const to = from + filters.limit - 1
        query = query.range(from, to)
      }

      const { data, error, count } = await query

      if (error) throw error

      return {
        data: data || [],
        count: count || 0,
        page: filters.page || 1,
        limit: filters.limit || data?.length || 0
      }
    } catch (error) {
      console.error('Error fetching employees with filters:', error)
      throw new Error(`Error al obtener empleados: ${error.message}`)
    }
  }

  /**
   * Obtener información completa de un empleado
   * @param {string|number} employeeId - ID del empleado
   * @returns {Promise<Object>} Información completa del empleado
   */
  async getEmployeeComplete(employeeId) {
    try {
      const { data, error } = await supabaseStudentClient
        .from('v_empleados_completo')
        .select('*')
        .eq('id', employeeId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching complete employee:', error)
      throw new Error(`Error al obtener información del empleado: ${error.message}`)
    }
  }

  // ==============================================
  // OPERACIONES DE BÚSQUEDA AVANZADA
  // ==============================================

  /**
   * Búsqueda de texto completo
   * @param {string} searchTerm - Término de búsqueda
   * @param {Array} searchFields - Campos en los que buscar
   * @param {Object} additionalFilters - Filtros adicionales
   * @returns {Promise<Array>} Resultados de la búsqueda
   */
  async fullTextSearch(searchTerm, searchFields = [], additionalFilters = {}) {
    try {
      let query = supabaseStudentClient.from(this.tableName)

      if (this.schema !== 'public') {
        query = supabaseStudentClient.schema(this.schema).from(this.tableName)
      }

      query = query.select('*')

      // Aplicar filtros adicionales
      Object.entries(additionalFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          query = query.eq(key, value)
        }
      })

      // Búsqueda en múltiples campos
      if (searchTerm && searchFields.length > 0) {
        const searchConditions = searchFields
          .map(field => `${field}.ilike.%${searchTerm}%`)
          .join(',')
        query = query.or(searchConditions)
      }

      const { data, error } = await query
        .order('updated_at', { ascending: false })
        .limit(50)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error in full text search:', error)
      throw new Error(`Error en búsqueda: ${error.message}`)
    }
  }

  // ==============================================
  // OPERACIONES DE ESTADÍSTICAS
  // ==============================================

  /**
   * Obtener estadísticas básicas de una tabla
   * @param {Object} groupBy - Campo para agrupar
   * @param {Object} filters - Filtros a aplicar
   * @returns {Promise<Object>} Estadísticas
   */
  async getStats(groupBy = null, filters = {}) {
    try {
      let query = supabaseStudentClient.from(this.tableName)

      if (this.schema !== 'public') {
        query = supabaseStudentClient.schema(this.schema).from(this.tableName)
      }

      // Aplicar filtros
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          query = query.eq(key, value)
        }
      })

      if (groupBy) {
        query = query.select(`${groupBy}, count()`)
      } else {
        query = query.select('*', { count: 'exact', head: true })
      }

      const { data, error, count } = await query

      if (error) throw error

      return {
        total: count || 0,
        groups: data || []
      }
    } catch (error) {
      console.error('Error getting stats:', error)
      throw new Error(`Error al obtener estadísticas: ${error.message}`)
    }
  }

  // ==============================================
  // OPERACIONES DE ARCHIVOS
  // ==============================================

  /**
   * Subir archivo a supabaseStudentClient Storage
   * @param {File} file - Archivo a subir
   * @param {string} bucket - Bucket de destino
   * @param {string} folder - Carpeta de destino
   * @param {string} fileName - Nombre del archivo (opcional)
   * @returns {Promise<Object>} URL del archivo subido
   */
  async uploadFile(file, bucket, folder = '', fileName = null) {
    try {
      const fileExt = file.name.split('.').pop()
      const finalFileName = fileName || `${Date.now()}.${fileExt}`
      const filePath = folder ? `${folder}/${finalFileName}` : finalFileName

      const { data, error } = await supabaseStudentClient.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) throw error

      // Obtener URL pública
      const { data: { publicUrl } } = supabaseStudentClient.storage
        .from(bucket)
        .getPublicUrl(filePath)

      return {
        path: data.path,
        publicUrl,
        fileName: finalFileName
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      throw new Error(`Error al subir archivo: ${error.message}`)
    }
  }

  /**
   * Eliminar archivo de supabaseStudentClient Storage
   * @param {string} bucket - Bucket origen
   * @param {string} filePath - Ruta del archivo
   * @returns {Promise<boolean>} True si se eliminó correctamente
   */
  async deleteFile(bucket, filePath) {
    try {
      const { error } = await supabaseStudentClient.storage
        .from(bucket)
        .remove([filePath])

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error deleting file:', error)
      throw new Error(`Error al eliminar archivo: ${error.message}`)
    }
  }

  // ==============================================
  // OPERACIONES DE VALIDACIÓN
  // ==============================================

  /**
   * Validar si un campo es único
   * @param {string} fieldName - Nombre del campo
   * @param {any} value - Valor a validar
   * @param {string|number} excludeId - ID a excluir de la validación
   * @returns {Promise<boolean>} True si es único
   */
  async isFieldUnique(fieldName, value, excludeId = null) {
    try {
      let query = supabaseStudentClient.from(this.tableName)

      if (this.schema !== 'public') {
        query = supabaseStudentClient.schema(this.schema).from(this.tableName)
      }

      query = query.select('id').eq(fieldName, value)

      if (excludeId) {
        query = query.neq('id', excludeId)
      }

      const { data, error } = await query

      if (error) throw error
      return !data || data.length === 0
    } catch (error) {
      console.error('Error validating field uniqueness:', error)
      throw new Error(`Error al validar unicidad: ${error.message}`)
    }
  }

  // ==============================================
  // OPERACIONES DE AUDITORÍA
  // ==============================================

  /**
   * Registrar acción de auditoría
   * @param {string} action - Acción realizada
   * @param {string|number} recordId - ID del registro afectado
   * @param {string} userId - ID del usuario que realizó la acción
   * @param {Object} details - Detalles adicionales
   * @returns {Promise<boolean>} True si se registró correctamente
   */
  async logAuditAction(action, recordId, userId, details = {}) {
    try {
      const auditData = {
        tabla_afectada: this.tableName,
        accion: action,
        registro_id: recordId,
        usuario_id: userId,
        detalles: details,
        timestamp: new Date().toISOString(),
        ip_address: null, // Se puede obtener del contexto si es necesario
        user_agent: navigator?.userAgent || null
      }

      const { error } = await supabaseStudentClient
        .schema('rrhh')
        .from('auditoria_logs')
        .insert(auditData)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error logging audit action:', error)
      // No lanzar error para que no afecte la operación principal
      return false
    }
  }
}

export default RRHHBaseService
