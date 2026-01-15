// docusignApi.js
// API para interactuar con el Edge Function de DocuSign

import { supabaseStudentClient } from '../../core/config/supabase/supabaseCampusStudentClient';

/**
 * URL del Edge Function principal (para validación automática)
 */
const EDGE_FUNCTION_URL = `${import.meta.env.VITE_APP_SUPABASE_URL_CAMPUS_STUDENT}/functions/v1/check-and-download-signed-docs-staff`;

/**
 * URL del Edge Function para validación por Envelope ID específico
 */
const EDGE_FUNCTION_SPECIFIC_ENVELOPE_URL = `${import.meta.env.VITE_APP_SUPABASE_URL_CAMPUS_STUDENT}/functions/v1/download-specific-envelope-staff`;

/**
 * Valida el estado de firmas del contrato de matrícula
 * y descarga el documento si está completo
 * 
 * @param {string} studentCode - Código del estudiante
 * @returns {Promise<Object>} Resultado de la validación
 */
export const validarYDescargarContrato = async (studentCode) => {
  try {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_APP_SUPABASE_ANON_KEY_CAMPUS_STUDENT}`,
      },
      body: JSON.stringify({
        studentCode,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `Error ${response.status}: ${response.statusText}`
      );
    }

    const result = await response.json();
    return result;

  } catch (error) {
    console.error('❌ Error validando contrato:', error);
    throw error;
  }
};

/**
 * Obtiene la URL pública del documento firmado desde Storage
 * 
 * @param {string} storagePath - Ruta del archivo en Storage
 * @returns {Promise<string>} URL pública del documento
 */
export const obtenerUrlDocumento = async (storagePath) => {
  try {
    const { data, error } = await supabaseStudentClient
      .storage
      .from('documentos_estudiantes')
      .createSignedUrl(storagePath, 3600); // 1 hora de validez

    if (error) {
      throw new Error(`Error obteniendo URL: ${error.message}`);
    }

    return data.signedUrl;

  } catch (error) {
    console.error('❌ Error obteniendo URL del documento:', error);
    throw error;
  }
};

/**
 * Calcula el año escolar actual
 */
const calcularAnoEscolarActual = () => {
  const ahora = new Date();
  const mes = ahora.getMonth() + 1;
  const ano = ahora.getFullYear();
  const anoEscolar = mes >= 7 ? ano + 1 : ano;
  return anoEscolar.toString();
};

/**
 * Consulta el estado actual del envelope en la BD
 * SIEMPRE busca el MÁS RECIENTE del año actual
 */
export const consultarEstadoLocal = async (studentCode) => {
  try {
    const anoEscolarActual = calcularAnoEscolarActual();

    const { data, error } = await supabaseStudentClient
      .from('matriculas_envelopes')
      .select('*')
      .eq('student_code', studentCode)
      .eq('ano_escolar', anoEscolarActual)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(`Error consultando BD: ${error.message}`);
    }

    return data;

  } catch (error) {
    console.error('❌ Error consultando estado local:', error);
    throw error;
  }
};

/**
 * Verificar si hay una versión más reciente del contrato
 * y actualizarla automáticamente
 */
export const verificarYActualizarContrato = async (studentCode, currentDocumentPath) => {
  try {
    const resultado = await validarYDescargarContrato(studentCode);

    if (resultado.success === false && resultado.error === 'NO_ENVELOPE') {
      return {
        hayActualizacion: false,
        tipo: 'no_envelope',
        mensaje: 'No existe contrato para este estudiante'
      };
    }

    if (resultado.success === false && !resultado.isCompleted) {
      return {
        hayActualizacion: false,
        tipo: 'pendiente',
        mensaje: 'El contrato aún tiene firmas pendientes',
        firmantes: resultado.data.pendingSigners
      };
    }

    if (resultado.success && resultado.alreadyDownloaded) {
      const esElMismo = resultado.data.storagePath === currentDocumentPath;
      
      if (esElMismo) {
        return {
          hayActualizacion: false,
          tipo: 'actualizado',
          mensaje: 'Ya tienes la versión más reciente del contrato',
          documentPath: resultado.data.storagePath
        };
      } else {
        return {
          hayActualizacion: true,
          tipo: 'path_diferente',
          mensaje: 'Se detectó una diferencia en el documento',
          documentoAntiguo: currentDocumentPath,
          documentoNuevo: resultado.data.storagePath
        };
      }
    }

    if (resultado.success && resultado.isCompleted) {
      if (currentDocumentPath && currentDocumentPath !== resultado.data.storagePath) {
        await eliminarDocumentoAntiguo(currentDocumentPath);
      }

      return {
        hayActualizacion: true,
        tipo: 'nueva_version',
        mensaje: '¡Nueva versión del contrato descargada exitosamente!',
        documentoAntiguo: currentDocumentPath,
        documentoNuevo: resultado.data.storagePath
      };
    }

    return {
      hayActualizacion: false,
      tipo: 'desconocido',
      mensaje: 'No se pudo determinar el estado del contrato',
      resultado
    };

  } catch (error) {
    console.error('❌ Error verificando actualizaciones:', error);
    throw error;
  }
};

/**
 * Elimina un documento del Storage
 */
const eliminarDocumentoAntiguo = async (documentPath) => {
  try {
    const { error } = await supabaseStudentClient
      .storage
      .from('documentos_estudiantes')
      .remove([documentPath]);

    if (error) {
      console.warn('⚠️ Advertencia al eliminar documento antiguo:', error.message);
    }
  } catch (error) {
    console.warn('⚠️ Error eliminando documento antiguo:', error);
  }
};

// ============================================
// NUEVAS FUNCIONES: VALIDAR POR ENVELOPE ID
// ============================================

/**
 * Valida el formato de un Envelope ID (UUID)
 * 
 * @param {string} envelopeId - ID del envelope
 * @returns {boolean} true si es válido
 */
export const validarFormatoEnvelopeId = (envelopeId) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(envelopeId);
};

/**
 * Consulta la información de un paquete de DocuSign por su Envelope ID
 */
export const consultarPaquetePorId = async (envelopeId, studentCode) => {
  try {
    console.log('🔍 Consultando paquete por ID:', { envelopeId, studentCode });

    if (!validarFormatoEnvelopeId(envelopeId)) {
      throw new Error('Formato de Envelope ID inválido. Debe ser un UUID válido.');
    }

    const response = await fetch(EDGE_FUNCTION_SPECIFIC_ENVELOPE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_APP_SUPABASE_ANON_KEY_CAMPUS_STUDENT}`,
      },
      body: JSON.stringify({
        studentCode, // ← CÓDIGO DEL ESTUDIANTE
        envelopeIdManual: envelopeId, // ← ID MANUAL
        soloConsultar: true,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `Error ${response.status}: ${response.statusText}`
      );
    }

    const result = await response.json();
    console.log('✅ Datos del paquete obtenidos:', result);

    return result;

  } catch (error) {
    console.error('❌ Error consultando paquete:', error);
    throw error;
  }
};

/**
 * Descarga y guarda un contrato específico por Envelope ID
 */
export const descargarYGuardarPaquete = async (envelopeId, studentCode) => {
  try {
    console.log('📥 Descargando paquete:', { envelopeId, studentCode });

    if (!validarFormatoEnvelopeId(envelopeId)) {
      throw new Error('Formato de Envelope ID inválido');
    }

    const response = await fetch(EDGE_FUNCTION_SPECIFIC_ENVELOPE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_APP_SUPABASE_ANON_KEY_CAMPUS_STUDENT}`,
      },
      body: JSON.stringify({
        studentCode, // ← CÓDIGO DEL ESTUDIANTE
        envelopeIdManual: envelopeId, // ← ID MANUAL
        soloConsultar: false,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `Error ${response.status}: ${response.statusText}`
      );
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Error al descargar el contrato');
    }

    if (!result.isCompleted) {
      throw new Error('El contrato aún tiene firmas pendientes');
    }

    console.log('✅ Contrato descargado y guardado exitosamente');

    return {
      success: true,
      storagePath: result.data.storagePath,
      mensaje: 'Contrato descargado y guardado exitosamente',
      envelopeId: result.data.envelopeId,
      studentCode: result.data.studentCode,
    };

  } catch (error) {
    console.error('❌ Error descargando y guardando paquete:', error);
    throw error;
  }
};