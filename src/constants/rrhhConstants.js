// constants/rrhhConstants.js
// Constantes generales y compartidas del sistema de RRHH

// ============================================================================
// TIPOS DE EMPLEADOS
// ============================================================================
export const EMPLOYEE_TYPES = {
  DOCENTE: 'docente',
  ADMINISTRATIVO: 'administrativo',
  AUXILIAR: 'auxiliar',
  DIRECTIVO: 'directivo',
  ASEO: 'aseo',
  SEGURIDAD: 'seguridad',
  CONTADOR: 'contador',
  SECRETARIA: 'secretaria',
  PSICOLOGIA: 'psicologia',
  ENFERMERIA: 'enfermeria',
  SISTEMAS: 'sistemas',
  MANTENIMIENTO: 'mantenimiento'
}

export const EMPLOYEE_TYPE_LABELS = {
  [EMPLOYEE_TYPES.DOCENTE]: 'Docente',
  [EMPLOYEE_TYPES.ADMINISTRATIVO]: 'Administrativo',
  [EMPLOYEE_TYPES.AUXILIAR]: 'Auxiliar',
  [EMPLOYEE_TYPES.DIRECTIVO]: 'Directivo',
  [EMPLOYEE_TYPES.ASEO]: 'Personal de Aseo',
  [EMPLOYEE_TYPES.SEGURIDAD]: 'Seguridad',
  [EMPLOYEE_TYPES.CONTADOR]: 'Contador',
  [EMPLOYEE_TYPES.SECRETARIA]: 'Secretaria',
  [EMPLOYEE_TYPES.PSICOLOGIA]: 'Psicología',
  [EMPLOYEE_TYPES.ENFERMERIA]: 'Enfermería',
  [EMPLOYEE_TYPES.SISTEMAS]: 'Sistemas',
  [EMPLOYEE_TYPES.MANTENIMIENTO]: 'Mantenimiento'
}

// ============================================================================
// NIVELES JERÁRQUICOS
// ============================================================================
export const HIERARCHY_LEVELS = {
  ESTRATEGICO: 'estrategico',
  TACTICO: 'tactico',
  OPERATIVO: 'operativo'
}

export const HIERARCHY_LEVEL_LABELS = {
  [HIERARCHY_LEVELS.ESTRATEGICO]: 'Estratégico',
  [HIERARCHY_LEVELS.TACTICO]: 'Táctico',
  [HIERARCHY_LEVELS.OPERATIVO]: 'Operativo'
}

// ============================================================================
// TIPOS DE CONTRATO
// ============================================================================
export const CONTRACT_TYPES = {
  INDEFINIDO: 'indefinido',
  TEMPORAL: 'temporal',
  POR_OBRA: 'por_obra',
  PRESTACION_SERVICIOS: 'prestacion_servicios',
  PRACTICA: 'practica',
  APRENDIZAJE: 'aprendizaje'
}

export const CONTRACT_TYPE_LABELS = {
  [CONTRACT_TYPES.INDEFINIDO]: 'Término Indefinido',
  [CONTRACT_TYPES.TEMPORAL]: 'Término Fijo',
  [CONTRACT_TYPES.POR_OBRA]: 'Por Obra o Labor',
  [CONTRACT_TYPES.PRESTACION_SERVICIOS]: 'Prestación de Servicios',
  [CONTRACT_TYPES.PRACTICA]: 'Práctica Profesional',
  [CONTRACT_TYPES.APRENDIZAJE]: 'Contrato de Aprendizaje'
}

// ============================================================================
// ESTADOS DE EMPLEADOS
// ============================================================================
export const EMPLOYEE_STATES = {
  ACTIVO: 'activo',
  INACTIVO: 'inactivo',
  SUSPENDIDO: 'suspendido',
  VACACIONES: 'vacaciones',
  INCAPACIDAD: 'incapacidad',
  LICENCIA: 'licencia',
  TERMINADO: 'terminado'
}

export const EMPLOYEE_STATE_LABELS = {
  [EMPLOYEE_STATES.ACTIVO]: 'Activo',
  [EMPLOYEE_STATES.INACTIVO]: 'Inactivo',
  [EMPLOYEE_STATES.SUSPENDIDO]: 'Suspendido',
  [EMPLOYEE_STATES.VACACIONES]: 'En Vacaciones',
  [EMPLOYEE_STATES.INCAPACIDAD]: 'Incapacidad',
  [EMPLOYEE_STATES.LICENCIA]: 'Licencia',
  [EMPLOYEE_STATES.TERMINADO]: 'Terminado'
}

export const EMPLOYEE_STATE_COLORS = {
  [EMPLOYEE_STATES.ACTIVO]: 'green',
  [EMPLOYEE_STATES.INACTIVO]: 'gray',
  [EMPLOYEE_STATES.SUSPENDIDO]: 'red',
  [EMPLOYEE_STATES.VACACIONES]: 'blue',
  [EMPLOYEE_STATES.INCAPACIDAD]: 'orange',
  [EMPLOYEE_STATES.LICENCIA]: 'purple',
  [EMPLOYEE_STATES.TERMINADO]: 'red'
}

// ============================================================================
// NIVELES DE PRIORIDAD
// ============================================================================
export const PRIORITY_LEVELS = {
  BAJA: 'baja',
  NORMAL: 'normal',
  ALTA: 'alta',
  URGENTE: 'urgente'
}

export const PRIORITY_LEVEL_LABELS = {
  [PRIORITY_LEVELS.BAJA]: 'Baja',
  [PRIORITY_LEVELS.NORMAL]: 'Normal',
  [PRIORITY_LEVELS.ALTA]: 'Alta',
  [PRIORITY_LEVELS.URGENTE]: 'Urgente'
}

export const PRIORITY_LEVEL_COLORS = {
  [PRIORITY_LEVELS.BAJA]: 'gray',
  [PRIORITY_LEVELS.NORMAL]: 'blue',
  [PRIORITY_LEVELS.ALTA]: 'orange',
  [PRIORITY_LEVELS.URGENTE]: 'red'
}

// ============================================================================
// ROLES DEL SISTEMA RRHH
// ============================================================================
export const RRHH_ROLES = {
  ADMIN_RRHH: 'admin_rrhh',
  PROFESIONAL_RRHH: 'profesional_rrhh',
  ASISTENTE_RRHH: 'asistente_rrhh',
  JEFE_DEPARTAMENTO: 'jefe_departamento',
  COORDINADOR: 'coordinador',
  EMPLEADO: 'empleado'
}

export const RRHH_ROLE_LABELS = {
  [RRHH_ROLES.ADMIN_RRHH]: 'Administrador RRHH',
  [RRHH_ROLES.PROFESIONAL_RRHH]: 'Profesional RRHH',
  [RRHH_ROLES.ASISTENTE_RRHH]: 'Asistente RRHH',
  [RRHH_ROLES.JEFE_DEPARTAMENTO]: 'Jefe de Departamento',
  [RRHH_ROLES.COORDINADOR]: 'Coordinador',
  [RRHH_ROLES.EMPLEADO]: 'Empleado'
}

// ============================================================================
// TIPOS DE NOTIFICACIÓN
// ============================================================================
export const NOTIFICATION_TYPES = {
  NEW_APPLICATION: 'nueva_aplicacion',
  INTERVIEW_SCHEDULED: 'entrevista_programada',
  INTERVIEW_REMINDER: 'recordatorio_entrevista',
  REQUEST_SUBMITTED: 'solicitud_enviada',
  REQUEST_APPROVED: 'solicitud_aprobada',
  REQUEST_REJECTED: 'solicitud_rechazada',
  CONTRACT_READY: 'contrato_listo',
  DOCUMENT_GENERATED: 'documento_generado',
  DOCUMENT_EXPIRING: 'documento_venciendo',
  EVALUATION_DUE: 'evaluacion_pendiente',
  BIRTHDAY: 'cumpleanos',
  WORK_ANNIVERSARY: 'aniversario_laboral',
  VACATION_REMINDER: 'recordatorio_vacaciones',
  SYSTEM_ALERT: 'alerta_sistema'
}

export const NOTIFICATION_TYPE_LABELS = {
  [NOTIFICATION_TYPES.NEW_APPLICATION]: 'Nueva Aplicación',
  [NOTIFICATION_TYPES.INTERVIEW_SCHEDULED]: 'Entrevista Programada',
  [NOTIFICATION_TYPES.INTERVIEW_REMINDER]: 'Recordatorio de Entrevista',
  [NOTIFICATION_TYPES.REQUEST_SUBMITTED]: 'Solicitud Enviada',
  [NOTIFICATION_TYPES.REQUEST_APPROVED]: 'Solicitud Aprobada',
  [NOTIFICATION_TYPES.REQUEST_REJECTED]: 'Solicitud Rechazada',
  [NOTIFICATION_TYPES.CONTRACT_READY]: 'Contrato Listo',
  [NOTIFICATION_TYPES.DOCUMENT_GENERATED]: 'Documento Generado',
  [NOTIFICATION_TYPES.DOCUMENT_EXPIRING]: 'Documento por Vencer',
  [NOTIFICATION_TYPES.EVALUATION_DUE]: 'Evaluación Pendiente',
  [NOTIFICATION_TYPES.BIRTHDAY]: 'Cumpleaños',
  [NOTIFICATION_TYPES.WORK_ANNIVERSARY]: 'Aniversario Laboral',
  [NOTIFICATION_TYPES.VACATION_REMINDER]: 'Recordatorio de Vacaciones',
  [NOTIFICATION_TYPES.SYSTEM_ALERT]: 'Alerta del Sistema'
}

// ============================================================================
// MENSAJES DEL SISTEMA
// ============================================================================
export const SYSTEM_MESSAGES = {
  SUCCESS: {
    EMPLOYEE_CREATED: 'Empleado creado exitosamente',
    EMPLOYEE_UPDATED: 'Información del empleado actualizada',
    DATA_SAVED: 'Datos guardados correctamente',
    DOCUMENT_UPLOADED: 'Documento cargado correctamente',
    NOTIFICATION_SENT: 'Notificación enviada',
    PROFILE_UPDATED: 'Perfil actualizado correctamente',
    ACTION_COMPLETED: 'Acción completada exitosamente'
  },
  ERROR: {
    INSUFFICIENT_PERMISSIONS: 'No tienes permisos suficientes para realizar esta acción',
    INVALID_DATA: 'Los datos proporcionados no son válidos',
    EMAIL_EXISTS: 'Ya existe un empleado con este correo electrónico',
    EMPLOYEE_CODE_EXISTS: 'El código de empleado ya está en uso',
    FILE_TOO_LARGE: 'El archivo es demasiado grande',
    INVALID_FILE_TYPE: 'Tipo de archivo no permitido',
    NETWORK_ERROR: 'Error de conexión. Por favor, intenta nuevamente',
    SERVER_ERROR: 'Error interno del servidor',
    VALIDATION_ERROR: 'Error de validación en los datos',
    INVALID_DATE_RANGE: 'El rango de fechas no es válido',
    MISSING_REQUIRED_FIELDS: 'Faltan campos obligatorios',
    UNAUTHORIZED_ACCESS: 'Acceso no autorizado',
    SESSION_EXPIRED: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente'
  },
  WARNING: {
    UNSAVED_CHANGES: 'Tienes cambios sin guardar. ¿Deseas continuar?',
    DELETE_CONFIRMATION: '¿Estás seguro de que deseas eliminar este elemento?',
    PERMANENT_ACTION: 'Esta acción no se puede deshacer',
    DATA_LOSS_WARNING: 'Algunos datos podrían perderse',
    FILE_REPLACE_WARNING: 'El archivo existente será reemplazado',
    BULK_ACTION_WARNING: 'Esta acción afectará múltiples registros',
    OUTDATED_DATA: 'Los datos mostrados podrían estar desactualizados',
    QUOTA_EXCEEDED: 'Has excedido el límite permitido'
  },
  INFO: {
    LOADING: 'Cargando...',
    SAVING: 'Guardando...',
    PROCESSING: 'Procesando...',
    UPLOADING: 'Subiendo archivo...',
    NO_DATA_FOUND: 'No se encontraron datos',
    NO_RESULTS: 'No hay resultados para mostrar',
    EMPTY_LIST: 'La lista está vacía',
    FEATURE_COMING_SOON: 'Esta funcionalidad estará disponible pronto',
    MAINTENANCE_MODE: 'El sistema está en mantenimiento',
    DATA_SYNCING: 'Sincronizando datos...'
  }
}

// ============================================================================
// CONFIGURACIONES REGIONALES (COLOMBIA)
// ============================================================================
export const REGIONAL_CONFIG = {
  COUNTRY: 'Colombia',
  CURRENCY: 'COP',
  CURRENCY_SYMBOL: '$',
  DATE_FORMAT: 'DD/MM/YYYY',
  TIME_FORMAT: 'HH:mm',
  TIMEZONE: 'America/Bogota',
  LANGUAGE: 'es-CO',
  MINIMUM_WAGE: 1300000, // Salario mínimo legal vigente (actualizar anualmente)
  WORKING_HOURS_PER_WEEK: 48,
  VACATION_DAYS_PER_YEAR: 15,
  LEGAL_HOLIDAYS: [
    'Año Nuevo',
    'Día de los Reyes Magos',
    'Día de San José',
    'Jueves Santo',
    'Viernes Santo',
    'Día del Trabajo',
    'Ascensión del Señor',
    'Corpus Christi',
    'Sagrado Corazón',
    'San Pedro y San Pablo',
    'Día de la Independencia',
    'Batalla de Boyacá',
    'Asunción de la Virgen',
    'Día de la Raza',
    'Todos los Santos',
    'Independencia de Cartagena',
    'Inmaculada Concepción',
    'Navidad'
  ]
}

// ============================================================================
// CONFIGURACIÓN DE VALIDACIONES
// ============================================================================
export const VALIDATION_RULES = {
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    MAX_LENGTH: 255
  },
  PHONE: {
    PATTERN: /^[\+]?[\d\s\-\(\)]{7,15}$/,
    MIN_LENGTH: 7,
    MAX_LENGTH: 15
  },
  PASSWORD: {
    MIN_LENGTH: 8,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBERS: true,
    REQUIRE_SPECIAL_CHARS: false
  },
  EMPLOYEE_CODE: {
    PATTERN: /^[A-Z0-9]{6,10}$/,
    MIN_LENGTH: 6,
    MAX_LENGTH: 10
  },
  SALARY: {
    MIN_VALUE: 1300000, // Salario mínimo legal
    MAX_VALUE: 50000000 // Límite máximo para validación
  },
  TEXT_FIELDS: {
    SHORT_TEXT_MAX: 100,
    MEDIUM_TEXT_MAX: 255,
    LONG_TEXT_MAX: 1000,
    DESCRIPTION_MAX: 5000
  }
}

// ============================================================================
// CONFIGURACIÓN DE PAGINACIÓN
// ============================================================================
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
  MAX_PAGE_SIZE: 100,
  SHOW_SIZE_CHANGER: true,
  SHOW_QUICK_JUMPER: true,
  SHOW_TOTAL: true
}

// ============================================================================
// CONFIGURACIÓN DE BÚSQUEDA
// ============================================================================
export const SEARCH_CONFIG = {
  MIN_SEARCH_LENGTH: 2,
  DEBOUNCE_DELAY: 300, // milliseconds
  MAX_RESULTS: 50,
  HIGHLIGHT_MATCHES: true,
  CASE_SENSITIVE: false
}

// ============================================================================
// CONFIGURACIÓN DE CACHE
// ============================================================================
export const CACHE_CONFIG = {
  DEFAULT_TTL: 5 * 60 * 1000, // 5 minutos
  LONG_TTL: 60 * 60 * 1000, // 1 hora
  SHORT_TTL: 1 * 60 * 1000, // 1 minuto
  CACHE_KEYS: {
    DEPARTMENTS: 'departments',
    POSITIONS: 'positions',
    EMPLOYEE_TYPES: 'employee_types',
    REQUEST_TYPES: 'request_types',
    HIRING_STAGES: 'hiring_stages',
    USER_PERMISSIONS: 'user_permissions'
  }
}

// ============================================================================
// CONFIGURACIÓN DE LOGS Y AUDITORÍA
// ============================================================================
export const AUDIT_CONFIG = {
  LOG_ACTIONS: {
    CREATE: 'CREATE',
    UPDATE: 'UPDATE',
    DELETE: 'DELETE',
    LOGIN: 'LOGIN',
    LOGOUT: 'LOGOUT',
    VIEW: 'VIEW',
    EXPORT: 'EXPORT',
    APPROVE: 'APPROVE',
    REJECT: 'REJECT'
  },
  SENSITIVE_TABLES: [
    'personal_mc',
    'empleados_detalle',
    'solicitudes_empleado',
    'aplicaciones',
    'procesos_contratacion'
  ],
  RETENTION_DAYS: 2555 // 7 años
}

// ============================================================================
// CONFIGURACIÓN DE ALMACENAMIENTO DE ARCHIVOS
// ============================================================================
export const FILE_STORAGE = {
  BUCKETS: {
    RESUMES: 'rrhh-hojas-vida',
    DOCUMENTS: 'rrhh-documentos',
    CONTRACTS: 'rrhh-contratos',
    EMPLOYEE_DOCS: 'rrhh-empleados-documentos',
    PROFILE_PHOTOS: 'rrhh-fotos-perfil',
    EVALUATIONS: 'rrhh-evaluaciones'
  },
  MAX_FILE_SIZE: {
    RESUME: 10 * 1024 * 1024,        // 10MB
    DOCUMENT: 5 * 1024 * 1024,       // 5MB
    CONTRACT: 20 * 1024 * 1024,      // 20MB
    PHOTO: 2 * 1024 * 1024,          // 2MB
    EVALUATION: 15 * 1024 * 1024     // 15MB
  },
  ALLOWED_TYPES: {
    RESUME: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    IMAGE: ['image/jpeg', 'image/png', 'image/webp'],
    DOCUMENT: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'],
    EXCEL: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    ALL_DOCS: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'image/jpeg', 'image/png', 'image/webp']
  }
}

// ============================================================================
// EXPORTACIÓN POR DEFECTO
// ============================================================================
export default {
  EMPLOYEE_TYPES,
  EMPLOYEE_TYPE_LABELS,
  HIERARCHY_LEVELS,
  HIERARCHY_LEVEL_LABELS,
  CONTRACT_TYPES,
  CONTRACT_TYPE_LABELS,
  EMPLOYEE_STATES,
  EMPLOYEE_STATE_LABELS,
  EMPLOYEE_STATE_COLORS,
  PRIORITY_LEVELS,
  PRIORITY_LEVEL_LABELS,
  PRIORITY_LEVEL_COLORS,
  RRHH_ROLES,
  RRHH_ROLE_LABELS,
  NOTIFICATION_TYPES,
  NOTIFICATION_TYPE_LABELS,
  SYSTEM_MESSAGES,
  REGIONAL_CONFIG,
  VALIDATION_RULES,
  PAGINATION_CONFIG,
  SEARCH_CONFIG,
  CACHE_CONFIG,
  AUDIT_CONFIG,
  FILE_STORAGE
}