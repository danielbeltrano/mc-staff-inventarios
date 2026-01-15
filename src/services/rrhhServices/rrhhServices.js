// services/rrhhServices/rrhhServices.js

import { createRRHHService, getEmployeesWithFilters, getEmployeeComplete } from './RRHHBaseService';

// ==============================================
// SERVICIOS ESPECÍFICOS MODERNOS
// ==============================================

/**
 * Servicio para gestión de empleados
 */
export const employeeService = {
  ...createRRHHService('v_empleados_completo', 'public'),
  
  // Métodos específicos para empleados
  getEmployeesWithFilters,
  getEmployeeComplete,
  
  /**
   * Buscar empleados por texto
   */
  async searchEmployees(searchTerm, filters = {}) {
    const baseService = createRRHHService('v_empleados_completo', 'public');
    return baseService.fullTextSearch(
      searchTerm,
      ['primer_nombre', 'primer_apellido', 'codigo_empleado', 'correo_institucional'],
      filters
    );
  },

  /**
   * Obtener empleados por departamento
   */
  async getByDepartment(departmentId, options = {}) {
    return getEmployeesWithFilters({
      departamento_id: departmentId,
      ...options
    });
  },

  /**
   * Obtener empleados activos
   */
  async getActiveEmployees(options = {}) {
    return getEmployeesWithFilters({
      estado: 'activo',
      ...options
    });
  }
};

/**
 * Servicio para gestión de vacantes
 */
export const vacancyService = {
  ...createRRHHService('vacantes'),
  
  /**
   * Publicar una vacante
   */
  async publishVacancy(vacancyId, publishedBy) {
    const baseService = createRRHHService('vacantes');
    return baseService.update(vacancyId, {
      estado: 'publicada',
      publicado_en: new Date().toISOString(),
      aprobado_por: publishedBy
    });
  },

  /**
   * Cerrar una vacante
   */
  async closeVacancy(vacancyId) {
    const baseService = createRRHHService('vacantes');
    return baseService.update(vacancyId, {
      estado: 'cerrada',
      cerrado_en: new Date().toISOString()
    });
  },

  /**
   * Obtener vacantes públicas
   */
  async getPublicVacancies(filters = {}) {
    const baseService = createRRHHService('vacantes');
    return baseService.findAll({
      estado: 'publicada',
      ...filters
    });
  },

  /**
   * Obtener vacantes por cargo
   */
  async getByPosition(positionId, filters = {}) {
    const baseService = createRRHHService('vacantes');
    return baseService.findAll({
      cargo_id: positionId,
      ...filters
    });
  }
};

/**
 * Servicio para gestión de aplicaciones
 */
export const applicationService = {
  ...createRRHHService('aplicaciones'),
  
  /**
   * Actualizar estado de aplicación con datos adicionales
   */
  async updateStatus(applicationId, status, notes = null, score = null) {
    const baseService = createRRHHService('aplicaciones');
    const updateData = {
      estado: status,
      ultima_actualizacion: new Date().toISOString()
    };

    if (notes) updateData.notas_reclutador = notes;
    if (score !== undefined) updateData.puntuacion_inicial = score;

    return baseService.update(applicationId, updateData);
  },

  /**
   * Obtener aplicaciones por vacante
   */
  async getByVacancy(vacancyId, filters = {}) {
    const baseService = createRRHHService('aplicaciones');
    return baseService.findAll({
      vacante_id: vacancyId,
      ...filters
    });
  },

  /**
   * Obtener aplicaciones pendientes
   */
  async getPendingApplications(filters = {}) {
    const baseService = createRRHHService('aplicaciones');
    return baseService.findAll({
      estado: 'recibida',
      ...filters
    });
  },

  /**
   * Búsqueda de aplicaciones por candidato
   */
  async searchByCandidateName(searchTerm, filters = {}) {
    const baseService = createRRHHService('aplicaciones');
    return baseService.fullTextSearch(
      searchTerm,
      ['nombre_completo', 'email_aplicante'],
      filters
    );
  }
};

/**
 * Servicio para gestión de solicitudes de empleados
 */
export const requestService = {
  ...createRRHHService('solicitudes_empleado'),
  
  /**
   * Crear solicitud con número único
   */
  async createRequest(requestData) {
    const baseService = createRRHHService('solicitudes_empleado');
    
    // Generar número único para la solicitud
    const numeroSolicitud = await baseService.generateUniqueNumber(
      'SOL', 
      'solicitudes_empleado', 
      'numero_solicitud'
    );
    
    const enrichedData = { 
      ...requestData, 
      numero_solicitud: numeroSolicitud,
      estado: 'enviada',
      fecha_solicitud: new Date().toISOString()
    };
    
    return baseService.create(enrichedData);
  },

  /**
   * Aprobar solicitud
   */
  async approveRequest(requestId, comments, approverId) {
    const baseService = createRRHHService('solicitudes_empleado');
    return baseService.update(requestId, {
      estado: 'aprobada',
      fecha_respuesta_real: new Date().toISOString(),
      respuesta_final: comments,
      aprobado_por: approverId
    });
  },

  /**
   * Rechazar solicitud
   */
  async rejectRequest(requestId, reason, rejectedBy) {
    const baseService = createRRHHService('solicitudes_empleado');
    return baseService.update(requestId, {
      estado: 'rechazada',
      fecha_respuesta_real: new Date().toISOString(),
      respuesta_final: reason,
      rechazado_por: rejectedBy
    });
  },

  /**
   * Obtener solicitudes pendientes
   */
  async getPendingRequests(filters = {}) {
    const baseService = createRRHHService('solicitudes_empleado');
    return baseService.findAll({
      estado: 'enviada',
      ...filters
    });
  },

  /**
   * Obtener solicitudes por empleado
   */
  async getByEmployee(employeeId, filters = {}) {
    const baseService = createRRHHService('solicitudes_empleado');
    return baseService.findAll({
      empleado_id: employeeId,
      ...filters
    });
  },

  /**
   * Obtener solicitudes por tipo
   */
  async getByType(requestType, filters = {}) {
    const baseService = createRRHHService('solicitudes_empleado');
    return baseService.findAll({
      tipo_solicitud_id: requestType,
      ...filters
    });
  }
};

/**
 * Servicio para gestión de asistencia
 */
export const attendanceService = {
  ...createRRHHService('registros_asistencia'),
  
  /**
   * Registrar asistencia diaria
   */
  async recordAttendance(employeeId, date, checkIn, checkOut = null) {
    const baseService = createRRHHService('registros_asistencia');
    
    const attendanceData = {
      empleado_id: employeeId,
      fecha: date,
      hora_entrada: checkIn,
      hora_salida: checkOut,
      estado: checkOut ? 'completo' : 'entrada_registrada'
    };
    
    return baseService.create(attendanceData);
  },

  /**
   * Actualizar salida
   */
  async updateCheckOut(recordId, checkOut) {
    const baseService = createRRHHService('registros_asistencia');
    return baseService.update(recordId, {
      hora_salida: checkOut,
      estado: 'completo'
    });
  },

  /**
   * Obtener asistencia por empleado y rango de fechas
   */
  async getByEmployeeAndDateRange(employeeId, startDate, endDate) {
    const baseService = createRRHHService('registros_asistencia');
    return baseService.findAll({
      empleado_id: employeeId,
      fecha: { operator: 'gte', value: startDate }
    }, {
      orderBy: { field: 'fecha', ascending: false }
    });
  },

  /**
   * Obtener estadísticas de asistencia
   */
  async getAttendanceStats(employeeId, month, year) {
    const baseService = createRRHHService('registros_asistencia');
    return baseService.getStats('estado', {
      empleado_id: employeeId,
      // Agregar filtros de mes y año según sea necesario
    });
  }
};

/**
 * Servicio para gestión de departamentos
 */
export const departmentService = {
  ...createRRHHService('departamentos'),
  
  /**
   * Obtener departamentos activos
   */
  async getActiveDepartments() {
    const baseService = createRRHHService('departamentos');
    return baseService.findAll({ activo: true });
  },

  /**
   * Asignar jefe de departamento
   */
  async assignHead(departmentId, headEmployeeId) {
    const baseService = createRRHHService('departamentos');
    return baseService.update(departmentId, {
      jefe_departamento_id: headEmployeeId
    });
  },

  /**
   * Obtener empleados por departamento
   */
  async getEmployees(departmentId) {
    return employeeService.getByDepartment(departmentId);
  }
};

/**
 * Servicio para gestión de cargos/posiciones
 */
export const positionService = {
  ...createRRHHService('cargos'),
  
  /**
   * Obtener cargos activos
   */
  async getActivePositions(filters = {}) {
    const baseService = createRRHHService('cargos');
    return baseService.findAll({ 
      activo: true,
      ...filters 
    });
  },

  /**
   * Obtener cargos por departamento
   */
  async getByDepartment(departmentId) {
    const baseService = createRRHHService('cargos');
    return baseService.findAll({ 
      departamento_id: departmentId,
      activo: true 
    });
  },

  /**
   * Obtener cargos con rango salarial
   */
  async getWithSalaryRange(minSalary = null, maxSalary = null) {
    const baseService = createRRHHService('cargos');
    const filters = { activo: true };
    
    if (minSalary) {
      filters.rango_salarial_min = { operator: 'gte', value: minSalary };
    }
    
    if (maxSalary) {
      filters.rango_salarial_max = { operator: 'lte', value: maxSalary };
    }
    
    return baseService.findAll(filters);
  }
};

/**
 * Servicio para procesos de contratación
 */
export const hiringService = {
  ...createRRHHService('procesos_contratacion'),
  
  /**
   * Crear proceso de contratación con número único
   */
  async createProcess(processData) {
    const baseService = createRRHHService('procesos_contratacion');
    
    // Generar número único para el proceso
    const numeroProceso = await baseService.generateUniqueNumber(
      'PROC',
      'procesos_contratacion',
      'numero_proceso'
    );
    
    const enrichedData = {
      ...processData,
      numero_proceso: numeroProceso,
      estado_general: 'iniciado',
      fecha_inicio: new Date().toISOString()
    };
    
    return baseService.create(enrichedData);
  },

  /**
   * Actualizar etapa del proceso
   */
  async updateStage(processId, newStage, notes = null) {
    const baseService = createRRHHService('procesos_contratacion');
    const updateData = {
      etapa_actual: newStage,
      ultima_actualizacion: new Date().toISOString()
    };
    
    if (notes) updateData.notas_etapa = notes;
    
    return baseService.update(processId, updateData);
  },

  /**
   * Finalizar proceso de contratación
   */
  async finalizeProcess(processId, result, finalNotes = null) {
    const baseService = createRRHHService('procesos_contratacion');
    return baseService.update(processId, {
      estado_general: 'finalizado',
      resultado_final: result,
      fecha_finalizacion: new Date().toISOString(),
      notas_finales: finalNotes
    });
  },

  /**
   * Obtener procesos activos
   */
  async getActiveProcesses(filters = {}) {
    const baseService = createRRHHService('procesos_contratacion');
    return baseService.findAll({
      estado_general: 'en_proceso',
      ...filters
    });
  },

  /**
   * Obtener procesos por aplicación
   */
  async getByApplication(applicationId) {
    const baseService = createRRHHService('procesos_contratacion');
    return baseService.findAll({ aplicacion_id: applicationId });
  }
};

/**
 * Servicio para tipos de solicitud
 */
export const requestTypeService = {
  ...createRRHHService('tipos_solicitud'),
  
  /**
   * Obtener tipos activos
   */
  async getActiveTypes() {
    const baseService = createRRHHService('tipos_solicitud');
    return baseService.findAll({ activo: true });
  },

  /**
   * Obtener tipos por categoría
   */
  async getByCategory(category) {
    const baseService = createRRHHService('tipos_solicitud');
    return baseService.findAll({ 
      categoria: category,
      activo: true 
    });
  }
};

/**
 * Servicio para etapas de contratación
 */
export const hiringStageService = {
  ...createRRHHService('etapas_contratacion'),
  
  /**
   * Obtener etapas ordenadas
   */
  async getOrderedStages() {
    const baseService = createRRHHService('etapas_contratacion');
    return baseService.findAll({ activo: true }, {
      orderBy: { field: 'orden', ascending: true }
    });
  },

  /**
   * Obtener siguiente etapa
   */
  async getNextStage(currentStageId) {
    const baseService = createRRHHService('etapas_contratacion');
    
    // Primero obtener la etapa actual
    const currentStage = await baseService.findById(currentStageId);
    if (!currentStage) return null;
    
    // Buscar la siguiente etapa por orden
    const result = await baseService.findAll({
      orden: { operator: 'gt', value: currentStage.orden },
      activo: true
    }, {
      orderBy: { field: 'orden', ascending: true },
      limit: 1
    });
    
    return result.data.length > 0 ? result.data[0] : null;
  }
};

/**
 * Servicio para horarios de trabajo
 */
export const scheduleService = {
  ...createRRHHService('horarios_trabajo'),
  
  /**
   * Asignar horario a empleado
   */
  async assignToEmployee(employeeId, scheduleData) {
    const baseService = createRRHHService('horarios_trabajo');
    return baseService.create({
      empleado_id: employeeId,
      ...scheduleData,
      fecha_inicio: scheduleData.fecha_inicio || new Date().toISOString()
    });
  },

  /**
   * Obtener horario actual de empleado
   */
  async getCurrentSchedule(employeeId) {
    const baseService = createRRHHService('horarios_trabajo');
    const result = await baseService.findAll({
      empleado_id: employeeId,
      activo: true
    }, {
      orderBy: { field: 'fecha_inicio', ascending: false },
      limit: 1
    });
    
    return result.data.length > 0 ? result.data[0] : null;
  },

  /**
   * Actualizar horario
   */
  async updateSchedule(scheduleId, newScheduleData) {
    const baseService = createRRHHService('horarios_trabajo');
    return baseService.update(scheduleId, {
      ...newScheduleData,
      fecha_modificacion: new Date().toISOString()
    });
  }
};

// ==============================================
// SERVICIOS DE DASHBOARD Y REPORTES
// ==============================================

/**
 * Servicio para dashboard de RRHH
 */
export const dashboardService = {
  /**
   * Obtener métricas principales del dashboard
   */
  async getDashboardMetrics() {
    try {
      const { data, error } = await supabaseStudentClient
        .from('v_dashboard_rrhh')
        .select('*')
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      throw new Error(`Error al obtener métricas del dashboard: ${error.message}`);
    }
  },

  /**
   * Obtener estadísticas rápidas
   */
  async getQuickStats() {
    try {
      const [
        employeesStats,
        vacanciesStats,
        applicationsStats,
        requestsStats
      ] = await Promise.all([
        employeeService.getStats(),
        vacancyService.getStats(),
        applicationService.getStats(),
        requestService.getStats()
      ]);

      return {
        totalEmployees: employeesStats.total,
        activeVacancies: vacanciesStats.groups?.find(g => g.estado === 'publicada')?.count || 0,
        pendingApplications: applicationsStats.groups?.find(g => g.estado === 'recibida')?.count || 0,
        pendingRequests: requestsStats.groups?.find(g => g.estado === 'enviada')?.count || 0
      };
    } catch (error) {
      console.error('Error fetching quick stats:', error);
      throw new Error(`Error al obtener estadísticas rápidas: ${error.message}`);
    }
  }
};

/**
 * Servicio para reportes
 */
export const reportService = {
  /**
   * Generar reporte de empleados
   */
  async generateEmployeeReport(filters = {}) {
    try {
      const employees = await employeeService.getEmployeesWithFilters(filters);
      
      return {
        title: 'Reporte de Empleados',
        generated_at: new Date().toISOString(),
        filters_applied: filters,
        total_records: employees.count,
        data: employees.data,
        summary: {
          by_department: await employeeService.getStats('departamento_id', filters),
          by_status: await employeeService.getStats('estado', filters),
          by_position: await employeeService.getStats('cargo_id', filters)
        }
      };
    } catch (error) {
      console.error('Error generating employee report:', error);
      throw new Error(`Error al generar reporte de empleados: ${error.message}`);
    }
  },

  /**
   * Generar reporte de vacantes
   */
  async generateVacancyReport(filters = {}) {
    try {
      const vacancies = await vacancyService.findAll(filters);
      
      return {
        title: 'Reporte de Vacantes',
        generated_at: new Date().toISOString(),
        filters_applied: filters,
        total_records: vacancies.count,
        data: vacancies.data,
        summary: {
          by_status: await vacancyService.getStats('estado', filters),
          by_position: await vacancyService.getStats('cargo_id', filters),
          by_priority: await vacancyService.getStats('prioridad', filters)
        }
      };
    } catch (error) {
      console.error('Error generating vacancy report:', error);
      throw new Error(`Error al generar reporte de vacantes: ${error.message}`);
    }
  },

  /**
   * Generar reporte de solicitudes
   */
  async generateRequestReport(filters = {}) {
    try {
      const requests = await requestService.findAll(filters);
      
      return {
        title: 'Reporte de Solicitudes',
        generated_at: new Date().toISOString(),
        filters_applied: filters,
        total_records: requests.count,
        data: requests.data,
        summary: {
          by_status: await requestService.getStats('estado', filters),
          by_type: await requestService.getStats('tipo_solicitud_id', filters),
          by_month: await requestService.getStats('DATE_TRUNC(\'month\', fecha_solicitud)', filters)
        }
      };
    } catch (error) {
      console.error('Error generating request report:', error);
      throw new Error(`Error al generar reporte de solicitudes: ${error.message}`);
    }
  }
};

// ==============================================
// EXPORT ALL SERVICES
// ==============================================

export default {
  employee: employeeService,
  vacancy: vacancyService,
  application: applicationService,
  request: requestService,
  attendance: attendanceService,
  department: departmentService,
  position: positionService,
  hiring: hiringService,
  requestType: requestTypeService,
  hiringStage: hiringStageService,
  schedule: scheduleService,
  dashboard: dashboardService,
  report: reportService
};