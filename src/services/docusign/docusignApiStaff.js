// services/docusign/docusignApiStaff.js

import { supabaseStudentClient } from '../../core/config/supabase/supabaseCampusStudentClient';

// ============================================
// URLs DE EDGE FUNCTIONS
// ============================================
const EDGE_FUNCTION_URL_SYNC = `${import.meta.env.VITE_APP_SUPABASE_URL_CAMPUS_STUDENT}/functions/v1/sync-student-envelopes`;
const EDGE_FUNCTION_URL_STAFF_LIST = `${import.meta.env.VITE_APP_SUPABASE_URL_CAMPUS_STUDENT}/functions/v1/list-student-envelopes-staff`;
const EDGE_FUNCTION_URL_STAFF_DOWNLOAD = `${import.meta.env.VITE_APP_SUPABASE_URL_CAMPUS_STUDENT}/functions/v1/download-specific-envelope-staff`;

// ============================================
// FUNCIONES AUXILIARES
// ============================================

/**
 * Sincronizar envelopes del estudiante desde DocuSign
 * @param {string} studentCode - Código del estudiante
 * @param {string[]} envelopeIds - IDs de envelopes conocidos (opcional)
 */
export const sincronizarEnvelopesEstudiante = async (studentCode, envelopeIds = []) => {
  try {
    console.log(`🔄 [SYNC] Sincronizando envelopes para: ${studentCode}`, {
      envelopeIds
    });

    const response = await fetch(EDGE_FUNCTION_URL_SYNC, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_APP_SUPABASE_ANON_KEY_CAMPUS_STUDENT}`,
      },
      body: JSON.stringify({ 
        studentCode,
        envelopeIds
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Error ${response.status}`);
    }

    const result = await response.json();
    console.log(`✅ [SYNC] Sincronización completada`, {
      total: result.total,
    });
    
    return result;

  } catch (error) {
    console.error('❌ [SYNC] Error sincronizando:', error);
    throw error;
  }
};

const obtenerAnoEscolarActual = () => {
  const ahora = new Date();
  const mes = ahora.getMonth() + 1;
  const año = ahora.getFullYear();
  
  return mes >= 7 ? año + 1 : año;
};

const mapearEstadoDocuSign = (status) => {
  const mapeo = {
    'created': 'Creado',
    'sent': 'Enviado',
    'delivered': 'Entregado',
    'signed': 'Firmado',
    'completed': 'Completado',
    'declined': 'Rechazado',
    'voided': 'Anulado',
    'unknown': 'Desconocido',
  };
  
  return mapeo[status] || status;
};

// ============================================
// FUNCIONES PRINCIPALES
// ============================================

/**
 * Listar TODOS los envelopes (STAFF)
 * @param {string} studentCode - Código del estudiante
 * @param {boolean} forzarSincronizacion - Forzar consulta a DocuSign
 */
export const listarEnvelopesEstudiante = async (studentCode, forzarSincronizacion = false) => {
  try {
    console.log(`📋 [STAFF] Listando envelopes para: ${studentCode}`, {
      forzarSincronizacion
    });

    const response = await fetch(EDGE_FUNCTION_URL_STAFF_LIST, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_APP_SUPABASE_ANON_KEY_CAMPUS_STUDENT}`,
      },
      body: JSON.stringify({ 
        studentCode,
        forzarSincronizacion  // ⬅️ NUEVO PARÁMETRO
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Error ${response.status}`);
    }

    const result = await response.json();
    console.log(`✅ [STAFF] Se encontraron ${result.total} envelopes`, {
      sincronizado: result.sincronizadoConDocuSign,
      ultimaActualizacion: result.ultimaActualizacion,
    });
    
    return result;

  } catch (error) {
    console.error('❌ [STAFF] Error listando envelopes:', error);
    throw error;
  }
};

/**
 * Descargar envelope específico (STAFF)
 */
export const descargarContratoEspecifico = async (envelopeId, codigoEstudiante, anoEscolar) => {
  try {
    console.log(`📥 [STAFF] Descargando contrato específico:`, {
      envelopeId,
      codigoEstudiante,
      anoEscolar
    });

    const response = await fetch(EDGE_FUNCTION_URL_STAFF_DOWNLOAD, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_APP_SUPABASE_ANON_KEY_CAMPUS_STUDENT}`,
      },
      body: JSON.stringify({ envelopeId }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Error ${response.status}`);
    }

    const resultado = await response.json();

    if (resultado.success === false && !resultado.isCompleted) {
      return {
        success: false,
        error: 'ENVELOPE_NOT_COMPLETED',
        mensaje: resultado.message || `El contrato no está completado`,
        firmantesInfo: {
          pendientes: resultado.data?.pendingSigners || [],
          completos: resultado.data?.recipients
            ?.filter(r => r.status)
            .map(r => r.name) || [],
        }
      };
    }

    if (resultado.success && resultado.alreadyDownloaded) {
      console.log('✅ [STAFF] Documento ya descargado previamente');
      
      return {
        success: true,
        alreadyDownloaded: true,
        storagePath: resultado.data.storagePath,
        fileName: resultado.data.storagePath.split('/').pop(),
        envelopeId: resultado.data.envelopeId,
        anoEscolar: resultado.data.anoEscolar,
        mensaje: `Contrato ${resultado.data.anoEscolar} ya estaba descargado`,
      };
    }

    if (resultado.success && resultado.isCompleted) {
      console.log('🎉 [STAFF] Contrato descargado exitosamente');
      
      return {
        success: true,
        storagePath: resultado.data.storagePath,
        fileName: resultado.data.storagePath.split('/').pop(),
        envelopeId: resultado.data.envelopeId,
        anoEscolar: resultado.data.anoEscolar,
        codigoEstudiante,
        mensaje: `Contrato ${resultado.data.anoEscolar} descargado exitosamente`,
      };
    }

    return {
      success: false,
      error: 'UNKNOWN_STATE',
      mensaje: 'Estado desconocido del contrato',
    };

  } catch (error) {
    console.error('❌ [STAFF] Error en descargarContratoEspecifico:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Listar contratos disponibles (STAFF)
 * @param {string} codigoEstudiante - Código del estudiante
 * @param {boolean} forzarSincronizacion - Forzar consulta a DocuSign
 */
export const listarContratosDisponibles = async (codigoEstudiante, forzarSincronizacion = false) => {
  try {
    console.log(`📋 [STAFF] Listando contratos para: ${codigoEstudiante}`);

    const resultadoEnvelopes = await listarEnvelopesEstudiante(codigoEstudiante, forzarSincronizacion);

    if (!resultadoEnvelopes.success || resultadoEnvelopes.total === 0) {
      return {
        success: true,
        contratos: [],
        organizados: { activos: [], historicos: [], pendientes: [], todos: [] },
        total: 0,
        mensaje: 'No hay contratos generados para este estudiante',
        sincronizadoConDocuSign: resultadoEnvelopes.sincronizadoConDocuSign || false,
      };
    }

    const registrosLocales = resultadoEnvelopes.envelopes;
    console.log(`✅ [STAFF] Procesando ${registrosLocales.length} contratos`);

    const anoEscolarActual = obtenerAnoEscolarActual();
    
    const contratosDetallados = registrosLocales.map(registro => ({
      id: registro.id,
      envelopeId: registro.envelopeId,
      codigoEstudiante: registro.studentCode,
      anoEscolar: registro.anoEscolar,
      fechaCreacion: registro.createdAt,
      documentPath: registro.documentPath,
      yaDescargado: registro.documentosGuardados,

      status: registro.status || 'unknown',
      statusDescripcion: mapearEstadoDocuSign(registro.status || 'unknown'),
      fechaCompletado: null,
      
      recipients: [],
      firmantesCompletos: 0,
      firmantesTotales: 0,
      
      emailSubject: registro.emailSubject || `Contrato Matrícula ${registro.anoEscolar}`,

      estaCompleto: registro.status === 'completed',
      puedoDescargar: registro.status === 'completed' && !registro.documentosGuardados,
      
      // ✅ Marcar si es el actualmente descargado
      esVersionMasReciente: registro.envelopeId === resultadoEnvelopes.envelopeActualmenteDescargado,
      
      error: false,
      errorMensaje: null,
    }));

    const contratosOrganizados = {
      activos: contratosDetallados.filter(c => c.esVersionMasReciente),
      historicos: contratosDetallados.filter(c => !c.esVersionMasReciente && c.estaCompleto),
      pendientes: contratosDetallados.filter(c => !c.estaCompleto),
      todos: contratosDetallados,
    };

    console.log('📊 [STAFF] Contratos organizados:', {
      activos: contratosOrganizados.activos.length,
      historicos: contratosOrganizados.historicos.length,
      pendientes: contratosOrganizados.pendientes.length,
      total: contratosDetallados.length,
      sincronizado: resultadoEnvelopes.sincronizadoConDocuSign,
    });

    return {
      success: true,
      contratos: contratosDetallados,
      organizados: contratosOrganizados,
      total: contratosDetallados.length,
      sincronizadoConDocuSign: resultadoEnvelopes.sincronizadoConDocuSign,
      ultimaActualizacion: resultadoEnvelopes.ultimaActualizacion,
    };

  } catch (error) {
    console.error('❌ [STAFF] Error en listarContratosDisponibles:', error);
    return {
      success: false,
      error: error.message,
      contratos: [],
      organizados: { activos: [], historicos: [], pendientes: [], todos: [] },
      total: 0,
    };
  }
};

/**
 * Obtener URL pública del documento firmado desde Storage
 */
export const obtenerUrlDocumento = async (storagePath) => {
  try {
    console.log('🔗 Obteniendo URL pública para:', storagePath);

    const { data, error } = await supabaseStudentClient
      .storage
      .from('documentos-estudiantes')
      .createSignedUrl(storagePath, 3600);

    if (error) {
      throw new Error(`Error obteniendo URL: ${error.message}`);
    }

    console.log('✅ URL generada exitosamente');
    return data.signedUrl;

  } catch (error) {
    console.error('❌ Error obteniendo URL del documento:', error);
    throw error;
  }
};