// pagoMatriculaApi.js - Versión mejorada
import { toast } from "react-toastify";
import { supabaseStudentClient } from '../../core/config/supabase/supabaseCampusStudentClient';
import { ESTADOS_TRANSACCION_WOMPI } from "../../constants/wompi/wompi.constants";

// ⭐ Cache para evitar mostrar toasts duplicados
const toastCache = new Map();
const TOAST_CACHE_DURATION = 5000; // 5 segundos

// Helper para mostrar toast sin duplicados
const showToastOnce = (key, type, message, options = {}) => {
  const now = Date.now();
  const cached = toastCache.get(key);
  
  if (cached && (now - cached) < TOAST_CACHE_DURATION) {
    // console.log(`⏭️ Toast duplicado ignorado: ${key}`);
    return;
  }
  
  toastCache.set(key, now);
  
  // Limpiar cache antiguo
  setTimeout(() => toastCache.delete(key), TOAST_CACHE_DURATION);
  
  toast[type](message, { toastId: key, ...options });
};

// ⭐ Función mejorada para insertar transacción (sin recargar página)
export const insertTransaccion = async (transactionData, options = {}) => {
  const { skipToast = false, onSuccess = null } = options;

  if (!transactionData || !transactionData.id) {
    throw new Error("transactionData inválida");
  }

  // console.log("📝 Insertando transacción:", transactionData.id);

  try {
    // Buscar matrícula
    const { data: matricula, error: errorMatricula } = await supabaseStudentClient
      .from("matriculas")
      .select("*")
      .eq("link_pago_wompi", `https://checkout.wompi.co/l/${transactionData.payment_link_id}`)
      .maybeSingle();

    if (errorMatricula) {
      console.error("❌ Error buscando matrícula:", errorMatricula);
      throw errorMatricula;
    }

    if (!matricula) {
      console.warn("⚠️ No se encontró matrícula para payment_link_id:", transactionData.payment_link_id);
      return { transacciones: null, error: new Error("No matricula") };
    }

    // Preparar payload
    const payload = {
      matricula_id: matricula.id,
      wompi_transaction_id: transactionData.id,
      wompi_reference: transactionData.reference,
      monto: transactionData.amount_in_cents,
      estado_wompi: transactionData.status,
      metodo_pago_wompi: transactionData.payment_method_type,
      respuesta_completa_wompi: transactionData,
      fecha_transaccion: transactionData.created_at,
      user_agent: transactionData.customer_data?.full_name ?? null,
      observaciones: "",
    };

    // Upsert (evita duplicados)
    const { data: transacciones, error } = await supabaseStudentClient
      .from("transacciones_wompi_matriculas")
      .upsert([payload], { onConflict: "wompi_transaction_id" })
      .select();

    if (error) {
      console.error("❌ Error en upsert:", error);
      return { transacciones: null, error };
    }

    const transaccion = Array.isArray(transacciones) ? transacciones[0] : transacciones;
    // console.log("✅ Transacción guardada:", transaccion?.id);

    // ⭐ Procesar según estado SIN mostrar toasts múltiples
    if (transactionData.status === "APPROVED") {
      let phone = transactionData.customer_data?.phone_number || "";
      if (phone.startsWith("+57")) phone = phone.slice(3);

      await updateMatriculaByID(transaccion.matricula_id, {
        estado_pago_sistema: "pagado",
        fecha_pago_completado: transactionData.finalized_at,
        pagado_por_nombre: transactionData.customer_data?.full_name ?? "",
        pagado_por_email: transactionData.customer_email ?? "",
        pagado_por_telefono: phone,
        pagado_por_documento: transactionData.billing_data?.legal_id ?? ""
      });

      if (matricula.codigo_estudiante?.includes("ADM")) {
        await generarCodigoYCorreo(matricula);
      }

      if (!skipToast) {
        showToastOnce(
          `approved-${transactionData.id}`,
          'success',
          '¡Pago aprobado!',
          { autoClose: 3000 }
        );
      }

      // ⭐ Emitir evento en lugar de reload
      window.dispatchEvent(
        new CustomEvent('transactionProcessed', {
          detail: {
            transactionId: transactionData.id,
            status: 'APPROVED',
            matriculaId: matricula.id
          }
        })
      );

      if (typeof onSuccess === 'function') {
        onSuccess({ transaccion, matricula });
      }

    } else if (transactionData.status === "DECLINED") {
      if (!skipToast) {
        showToastOnce(
          `declined-${transactionData.id}`,
          'error',
          'El pago fue rechazado. Por favor intenta nuevamente.',
          { autoClose: 5000 }
        );
      }

      window.dispatchEvent(
        new CustomEvent('transactionProcessed', {
          detail: {
            transactionId: transactionData.id,
            status: 'DECLINED',
            matriculaId: matricula.id
          }
        })
      );

    } else if (transactionData.status === "PENDING") {
      if (!skipToast) {
        showToastOnce(
          `pending-${transactionData.id}`,
          'warning',
          'El pago está en proceso. Te notificaremos cuando se complete.',
          { autoClose: 5000 }
        );
      }
    }

    return { transacciones, error: null };

  } catch (err) {
    console.error("💥 Excepción en insertTransaccion:", err);
    
    // Manejar duplicados
    if (err?.code === "23505") {
      const { data: existing } = await supabaseStudentClient
        .from("transacciones_wompi_matriculas")
        .select("*")
        .eq("wompi_transaction_id", transactionData.id)
        .maybeSingle();
      
      return { transacciones: existing ? [existing] : null, error: err };
    }
    
    return { transacciones: null, error: err };
  }
};

// ⭐ Función mejorada para actualizar estado (sin toasts duplicados)
export const updateStatusTransaccion = async (
  transactionId, 
  status, 
  transactionData, 
  transaccion,
  options = {}
) => {
  const { skipToast = false } = options;

  // console.log(`🔄 Actualizando transacción ${transactionId} a estado: ${status}`);

  try {
    const { data, error } = await supabaseStudentClient
      .from("transacciones_wompi_matriculas")
      .update({
        estado_wompi: status,
        respuesta_completa_wompi: transactionData,
        updated_at: new Date().toISOString()
      })
      .eq("wompi_transaction_id", transactionId)
      .select();

    if (error) {
      console.error("❌ Error actualizando transacción:", error);
      return { data: null, error };
    }

    // Procesar según estado
    if (status === "APPROVED") {
      let phone = transactionData.customer_data?.phone_number || "";
      if (phone.startsWith("+57")) phone = phone.slice(3);

      await updateMatriculaByID(transaccion.matricula_id, {
        estado_pago_sistema: "pagado",
        fecha_pago_completado: transactionData.finalized_at,
        pagado_por_nombre: transactionData.customer_data?.full_name ?? "",
        pagado_por_email: transactionData.customer_email ?? "",
        pagado_por_telefono: phone,
        pagado_por_documento: transactionData.billing_data?.legal_id ?? ""
      });

      const { data: matricula } = await supabaseStudentClient
        .from("matriculas")
        .select("*")
        .eq("id", transaccion.matricula_id)
        .single();

      if (matricula && !matricula.codigo_estudiante) {
        await generarCodigoYCorreo(matricula);
      }

      if (!skipToast) {
        showToastOnce(
          `approved-${transactionId}`,
          'success',
          '¡Pago aprobado exitosamente!',
          { autoClose: 3000 }
        );
      }

      // Emitir evento
      window.dispatchEvent(
        new CustomEvent('transactionProcessed', {
          detail: {
            transactionId,
            status: 'APPROVED',
            matriculaId: transaccion.matricula_id
          }
        })
      );

    } else if (status === "DECLINED") {
      if (!skipToast) {
        showToastOnce(
          `declined-${transactionId}`,
          'error',
          'El pago fue rechazado.',
          { autoClose: 5000 }
        );
      }

      window.dispatchEvent(
        new CustomEvent('transactionProcessed', {
          detail: {
            transactionId,
            status: 'DECLINED',
            matriculaId: transaccion.matricula_id
          }
        })
      );
    }

    return { data, error: null };

  } catch (err) {
    console.error("💥 Error en updateStatusTransaccion:", err);
    return { data: null, error: err };
  }
};

// ⭐ Procesar transacciones pendientes (mejorado)
export const processTransaccionesPendientes = async (matricula, options = {}) => {
  const { skipToast = true } = options; // Por defecto no mostrar toasts en batch

  try {
    const { data: transaccionesPendientes, error } = await supabaseStudentClient
      .from("transacciones_wompi_matriculas")
      .select("*")
      .eq("matricula_id", matricula.id)
      .eq("estado_wompi", ESTADOS_TRANSACCION_WOMPI.PENDING);

    if (error || !transaccionesPendientes?.length) {
      return { success: true, processed: 0 };
    }

    // console.log(`🔍 Procesando ${transaccionesPendientes.length} transacciones pendientes...`);

    // Procesar en paralelo con límite
    const promises = transaccionesPendientes.map(transaccion => 
      procesarTransaccionIndividual(transaccion, matricula, { skipToast })
        .catch(error => ({
          transactionId: transaccion.wompi_transaction_id,
          success: false,
          error: error.message
        }))
    );

    const resultados = await Promise.all(promises);

    const exitosos = resultados.filter(r => r.success).length;
    const fallidos = resultados.filter(r => !r.success).length;

    // console.log(`✅ Procesadas: ${exitosos} exitosas, ${fallidos} fallidas`);

    return {
      success: true,
      processed: resultados.length,
      successful: exitosos,
      failed: fallidos,
      results: resultados
    };

  } catch (error) {
    console.error("💥 Error en processTransaccionesPendientes:", error);
    return { success: false, error: error.message };
  }
};

// Función auxiliar
const procesarTransaccionIndividual = async (transaccion, matricula, options = {}) => {
  const { skipToast = true } = options;
  const transactionId = transaccion.wompi_transaction_id;

  try {
    const transactionData = await consultarTransaccionWompi(transactionId);
    
    if (!transactionData) {
      throw new Error(`No se pudo obtener datos de transacción ${transactionId}`);
    }

    const nuevoEstado = transactionData.status;
    
    // Solo actualizar si el estado cambió
    if (nuevoEstado === transaccion.estado_wompi) {
      // console.log(`⏭️ Estado sin cambios para ${transactionId}: ${nuevoEstado}`);
      return {
        transactionId,
        success: true,
        changed: false,
        status: nuevoEstado
      };
    }

    const resultado = await updateStatusTransaccion(
      transactionId, 
      nuevoEstado, 
      transactionData,
      transaccion,
      { skipToast }
    );

    return {
      transactionId,
      success: true,
      changed: true,
      oldStatus: transaccion.estado_wompi,
      newStatus: nuevoEstado,
      ...resultado
    };

  } catch (error) {
    console.error(`❌ Error procesando transacción ${transactionId}:`, error);
    throw error;
  }
};

// Resto de funciones (sin cambios en lógica, solo mejoras de logging)
export const consultarTransaccionWompi = async (transactionId) => {
  try {
    // console.log(`🌐 Consultando Wompi para transacción: ${transactionId}`);
    
    const response = await fetch(
      // `https://sandbox.wompi.co/v1/transactions/${transactionId}`,
      `https://production.wompi.co/v1/transactions/${transactionId}`,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${import.meta.env.VITE_APP_WOMPI_PRIVATE_KEY_PRO}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const responseData = await response.json();
    
    if (!responseData.data) {
      throw new Error("Respuesta de Wompi sin datos válidos");
    }

    // console.log(`✅ Transacción ${transactionId} consultada: ${responseData.data.status}`);
    return responseData.data;

  } catch (error) {
    console.error(`❌ Error consultando Wompi [${transactionId}]:`, error);
    throw error;
  }
};

export const buscarTransaccion = async (transactionId) => {
  const { data, error } = await supabaseStudentClient
    .from("transacciones_wompi_matriculas")
    .select("*")
    .eq("wompi_transaction_id", transactionId)
    .maybeSingle();

  return { data, error };
};

export const pagoMatriculaApi = {
  // Obtener matrículas por ID del padre
  getMatriculasByPadre: async (padreId) => {
    try {
      const { data, error } = await supabaseStudentClient
        .from('contabilidad')
        .select('matriculas')
        .in('estudiante_id', 
          supabaseStudentClient
            .from('estudiantes')
            .select('id')
            .or(`father_id.eq.${padreId},mother_id.eq.${padreId}`)
        );
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error getMatriculasByPadre:', error);
      return { data: null, error };
    }
  },

  // Obtener matrícula pendiente por código de estudiante
  getMatriculaPendiente: async (codigoEstudiante) => {
    try {
      const { data, error } = await supabaseStudentClient.rpc('get_matricula_pendiente_padre', {
        codigo_estudiante: codigoEstudiante
      });
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error getMatriculaPendiente:', error);
      return { data: null, error };
    }
  },

  // Generar link de pago con datos del padre
  generarLinkConDatosPadre: async (matriculaId, padreId) => {
    try {
      const { data, error } = await supabaseStudentClient.rpc('generar_link_pago_padre', {
        matricula_id: matriculaId,
        padre_id: padreId
      });
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error generarLinkConDatosPadre:', error);
      return { data: null, error };
    }
  },

  // Consultar estado de pago
  consultarEstado: async (matriculaId) => {
    try {
      const { data, error } = await supabaseStudentClient
        .from('contabilidad')
        .select('estado_pago_sistema, fecha_pago_completado')
        .eq('matriculas', matriculaId)  // o el campo correcto
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error consultarEstado:', error);
      return { data: null, error };
    }
  }
};

export const getMatriculas = async()=>{
  const {data, error} = await supabaseStudentClient
  .from("matriculas")
  .select("*");

  return {data, error}
}

function toISODateString(fechaStr) {
  if (!fechaStr) return null; // si no hay valor

  // dividir por "/" o "-"
  const parts = fechaStr.split(/[\/\-]/);
  if (parts.length !== 3) return null;

  let [d, m, y] = parts.map((p) => parseInt(p, 10));

  // Si el año está primero (YYYY-MM-DD)
  if (d > 999) {
    [y, m, d] = [d, m, y];
  }

  // Asegurar que mes y día estén en dos dígitos
  const day = String(d).padStart(2, "0");
  const month = String(m).padStart(2, "0");
  const year = String(y);

  // Validar fecha básica
  if (isNaN(d) || isNaN(m) || isNaN(y)) return null;
  if (d < 1 || d > 31 || m < 1 || m > 12) return null;

  return `${year}-${month}-${day}`; // formato final
}


// helpers
function toNumber(v) {
  if (v === null || v === undefined || v === "") return 0;
  const s = String(v).replace(/\./g, "").replace(/,/g, ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Convertir "D/M/YYYY" o "DD/MM/YYYY" -> "YYYY-MM-DD"
 * Retorna null si no se puede parsear.
 */
function formatDMYToYYYYMMDD(s) {
  if (!s) return null;
  const parts = String(s).trim().split("/");
  if (parts.length !== 3) return null;
  const d = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const y = parseInt(parts[2], 10);
  if (!Number.isFinite(d) || !Number.isFinite(m) || !Number.isFinite(y)) return null;
  if (d < 1 || d > 31 || m < 1 || m > 12) return null;
  const day = String(d).padStart(2, "0");
  const month = String(m).padStart(2, "0");
  const year = String(y);
  return `${year}-${month}-${day}`; // formato seguro para tipo date en Postgres
}

export const insertMatricula = async (student, awsDataArray = []) => {
  if (!Array.isArray(awsDataArray) || awsDataArray.length === 0) {
    console.warn("awsDataArray vacío - no se insertará matrícula");
    return { data: null, error: "awsDataArray vacío" };
  }

  // Evitar insertar si ya existe matrícula para este estudiante
  const { data: matriculaExiste } = await supabaseStudentClient
    .from("matriculas")
    .select("*")
    .eq("estudiante_id", student.id)
    .maybeSingle();

  if (matriculaExiste) {
    console.info("Matrícula ya existe para estudiante:", student.id);
    return { data: matriculaExiste, error: null };
  }

  // Transformar y renombrar campos por cada elemento
  const transformed = awsDataArray.map((item) => {
    const valorUnitario = toNumber(item?.Valor_Unitario);
    const descuentoPct = Math.max(0, Math.min(100, toNumber(item?.Descuento)));
    const descuentoAmount = (valorUnitario * descuentoPct) / 100;
    const importeFinal = Math.round(valorUnitario - descuentoAmount);

    return {
      descuento: descuentoPct,
      documento_numero: item?.Documento_Numero ?? null,
      estado_pago: item?.Estado_Pago ?? null,
      // mantengo el raw original en caso que quieras inspeccionar
      fecha_original: item?.Fecha ?? null,
      fecha: formatDMYToYYYYMMDD(item?.Fecha) ?? null,
      fecha_entrega_original: item?.Fecha_Entrega ?? null,
      fecha_entrega: formatDMYToYYYYMMDD(item?.Fecha_Entrega) ?? null,
      nombre_estudiante: item?.Nota ?? null,
      rubro: item?.["Nota.1"] ?? null,
      codigo_estudiante: item?.Personalizado1 ?? null,
      tercero_externo: item?.Tercero_Externo ?? null,
      tercero_interno: item?.Tercero_Interno ?? null,
      valor_a_pagar: importeFinal,
      fecha_vencimiento_original: item?.Vencimiento ?? null,
      fecha_vencimiento: formatDMYToYYYYMMDD(item?.Vencimiento) ?? null,
      id: item?.id ?? null,
      _raw_valor_unitario: valorUnitario,
      _raw_descuento_amount: Math.round(descuentoAmount),
    };
  });

  const valor_a_pagar_total = transformed.reduce((sum, t) => sum + (t.valor_a_pagar || 0), 0);
  const descuento_total_amount = transformed.reduce((sum, t) => sum + (t._raw_descuento_amount || 0), 0);

  // elegir fila "principal" (MATRICULA Año siguiente o tomar la primera
  const anoSiguiente = new Date().getFullYear() + 1;
  const awsDataPrincipal = awsDataArray.find((p) => p["Nota.1"] === `MATRICULA ${anoSiguiente}`) || awsDataArray[0] || {};

  const payload = {
    aws_registro_id: awsDataPrincipal?.id || null,
    numero_documento_estudiante: student.documento_estudiante,
    estado_pago_aws: awsDataPrincipal?.Estado_Pago || null,
    // fecha en formato YYYY-MM-DD o null
    fecha_registro_aws: awsDataPrincipal?.Fecha ? formatDMYToYYYYMMDD(awsDataPrincipal.Fecha) : null,
    nombre_estudiante: `${student.primer_nombre || ""}${student.segundo_nombre ? ` ${student.segundo_nombre}` : ""} ${student.primer_apellido || ""}${student.segundo_apellido ? ` ${student.segundo_apellido}` : ""}`.trim(),
    // enviar ARRAY (no JSON.stringify) para que supabaseStudentClient inserte JSONB
    concepto_pago: `MATRICULA ${anoSiguiente}`,
    conceptos_pago: transformed,
    codigo_estudiante: student.codigo_estudiante,
    referencia_aws: awsDataPrincipal?.Tercero_Interno ?? null,
    valor_a_pagar: Math.round(valor_a_pagar_total),
    fecha_vencimiento: awsDataPrincipal?.Vencimiento ? formatDMYToYYYYMMDD(awsDataPrincipal.Vencimiento) : null,
    descuento_aplicado: 0,
    notas_adicionales: "",
    estudiante_id: student.id,
    ano_academico: new Date().getFullYear(),
    estado_pago_sistema: "pendiente_link",
    link_pago_wompi: "",
    pagado_por_nombre: "",
    pagado_por_email: "",
    pagado_por_telefono: "",
    pagado_por_documento: "",
  };

  // DEBUG: ver qué vamos a enviar a supabaseStudentClient
  // //console.log("insertMatricula payload:", JSON.stringify(payload, null, 2));

  try {
    const { data, error } = await supabaseStudentClient
      .from("matriculas")
      .insert(payload)
      .select();

    if (error) {
      console.error("Error subiendo matrícula:", error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (err) {
    console.error("Excepción insertando matrícula:", err);
    return { data: null, error: err };
  }
};

// Actualiza la(s) matrícula(s) por estudiante (estudiante.id)
export const updateMatricula = async (student, data) => {
  if (!student || !student.id) {
    console.warn("updateMatricula: student o student.id no proporcionado");
    return { matriculaUpdated: null, error: new Error("student.id no proporcionado") };
  }

  try {
    const { data: matriculaUpdated, error } = await supabaseStudentClient
      .from('matriculas')
      .update(data)
      .eq('estudiante_id', student.id)
      .select();

    if (error) {
      console.log("Error actualizando matrícula por estudiante:", error);
      return { matriculaUpdated: null, error };
    }

    return { matriculaUpdated, error: null };
  } catch (err) {
    console.error("Excepción en updateMatricula:", err);
    return { matriculaUpdated: null, error: err };
  }
};



/**
 * Normaliza fechas que pueden venir como "DD/MM/YYYY" o "YYYY-MM-DD" o ISO.
 * Devuelve "YYYY-MM-DD" o null si no se puede parsear.
 */
function toPostgresDate(fecha) {
  if (!fecha) return null;
  const s = String(fecha).trim();
  if (s.includes("/")) {
    return formatDMYToYYYYMMDD(s);
  }
  // si ya parece YYYY-MM-DD o ISO completo, extraer la parte de fecha
  const isoMatch = s.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoMatch) return isoMatch[1];
  return null;
}

// Función corregida
export const updateAWSDataMatricula = async (student, awsData) => {
  try {
    if (!student || !student.id) {
      console.warn("updateAWSDataMatricula: estudiante inválido", student);
      return { data: null, error: "estudiante inválido" };
    }
    if (!awsData) {
      console.warn("updateAWSDataMatricula: awsData no proporcionado");
      return { data: null, error: "awsData no proporcionado" };
    }

    // Normalizar valores
    const fechaRegistro = toPostgresDate(awsData.Fecha);
    const fechaVencimiento = toPostgresDate(awsData.Vencimiento);
    const valorUnitario = toNumber(awsData.Valor_Unitario);
    const descuento = awsData?.Descuento ?? null; // si quieres mantener original

    const updatePayload = {
      aws_registro_id: awsData.id ?? null,
      estado_pago_aws: awsData.Estado_Pago ?? null,
      fecha_registro_aws: fechaRegistro,           // YYYY-MM-DD o null
      concepto_pago: awsData["Nota.1"] ?? null,
      referencia_aws: awsData.Tercero_Interno ?? null,
      valor_a_pagar: valorUnitario || null,
      fecha_vencimiento: fechaVencimiento,         // YYYY-MM-DD o null
      descuento_aplicado: descuento ?? null,
      // opcional: puedes actualizar tambien campos secundarios si quieres
      // codigo_estudiante_aws: awsData.Personalizado1 ?? null,
    };

    // DEBUG: mostrar lo que se va a actualizar
    console.debug("updateAWSDataMatricula -> payload:", updatePayload, "estudiante_id:", student.id);

    const { data, error } = await supabaseStudentClient
      .from("matriculas")
      .update(updatePayload)
      .eq("estudiante_id", student.id)
      .select();

    if (error) {
      console.error("updateAWSDataMatricula error:", error);
      return { data: null, error };
    }

    console.info("Matrícula actualizada correctamente:", data);
    return { data, error: null };
  } catch (err) {
    console.error("Excepción en updateAWSDataMatricula:", err);
    return { data: null, error: err };
  }
};

export const deleteMatricula = async(student)=>{
  const {data: matriculaDeleted, error} = await supabaseStudentClient
  .from('matriculas')
  .delete()
  .eq("estudiante_id", student.id);

  if(error){
      console.log("Error eliminando: ", error);
    }

  return {matriculaDeleted, error};
}

export const updateMatriculaByID = async(id, data)=>{
  const {data: matriculaUpdated, error} = await supabaseStudentClient
  .from('matriculas')
  .update(data)
  .eq("id", id);

  if(error){
      console.log("Error actualizando: ", error);
    }

  return {matriculaUpdated, error};
}

// FUNCIÓN AUXILIAR PARA GENERAR CÓDIGO ÚNICO DE 4 DÍGITOS (5320-7000)
// const generarCodigoUnico = async () => {

//   // Obtener el último código de 4 dígitos en el rango 5320-7000
//   const { data: ultimoCodigo, error } = await supabaseStudentClient
//     .from("estudiantes")
//     .select("*")
//     .gte("codigo_estudiante", 5320) // Códigos empiezan en 5320
//     .lte("codigo_estudiante", 7000) // Códigos terminan en 7000
//     .order("codigo_estudiante", { ascending: false })
//     .limit(1);

//     console.log(ultimoCodigo);

//   if (error) {
//     throw new Error(`Error obteniendo último código: ${error.message}`);
//   }

//   const baseCodigo = ultimoCodigo && ultimoCodigo.length > 0 
//     ? Number(ultimoCodigo[0].codigo_estudiante) + 1 
//     : 5320; // Comenzar desde 5320

//     console.log(baseCodigo);
  
//   // Verificar que no exceda 7000
//   if (baseCodigo > 7000) {
//     throw new Error("Se han agotado los códigos de 4 dígitos disponibles (5320-7000). Solo hay 1000 códigos disponibles en este rango.");
//   }

//   return baseCodigo;
// };

// FUNCIÓN AUXILIAR PARA GENERAR CÓDIGO ÚNICO DE 4 DÍGITOS (5320-7000)
const generarCodigoUnico = async () => {
  try {
    // Obtener todos los estudiantes que tienen códigos numéricos en el rango
    // Usamos CAST para convertir VARCHAR a INTEGER en la consulta
    const { data: estudiantes, error } = await supabaseStudentClient
      .from("estudiantes")
      .select("codigo_estudiante")
      .not("codigo_estudiante", "is", null)
      .not("codigo_estudiante", "eq", "")
      // Filtrar solo los que parecen números (opcional, para mejor performance)
      .like("codigo_estudiante", "[0-9]%");

    if (error) {
      throw new Error(`Error obteniendo códigos: ${error.message}`);
    }

    // console.log("Estudiantes encontrados:", estudiantes?.length || 0);

    // Filtrar y convertir códigos numéricos válidos en el rango 5320-7000
    const codigosNumericos = estudiantes
      ?.map(e => {
        const codigoStr = String(e.codigo_estudiante).trim();
        // Verificar que sea solo dígitos
        if (!/^\d+$/.test(codigoStr)) return null;
        
        const codigo = parseInt(codigoStr, 10);
        // Verificar que esté en el rango válido
        return (codigo >= 5320 && codigo <= 7000) ? codigo : null;
      })
      .filter(codigo => codigo !== null)
      .sort((a, b) => b - a); // Ordenar descendente

    // console.log("Códigos válidos en rango 5320-7000:", codigosNumericos);

    // Determinar el siguiente código
    let nuevoCodigo;
    if (!codigosNumericos || codigosNumericos.length === 0) {
      nuevoCodigo = 5320; // Comenzar desde 5320 si no hay códigos
      // console.log("No hay códigos previos, iniciando desde 5320");
    } else {
      const ultimoCodigo = codigosNumericos[0];
      nuevoCodigo = ultimoCodigo + 1;
      // console.log(`Último código encontrado: ${ultimoCodigo}, nuevo código: ${nuevoCodigo}`);
    }
    
    // Verificar que no exceda 7000
    if (nuevoCodigo > 7000) {
      throw new Error(
        "Se han agotado los códigos disponibles (5320-7000). " +
        `Total disponible: 1680 códigos. Último asignado: ${codigosNumericos[0]}`
      );
    }

    // Convertir a string con padding de 4 dígitos (garantiza 4 dígitos mínimo)
    const codigoStr = String(nuevoCodigo).padStart(4, '0');
    
    // console.log(`Código a asignar (string): "${codigoStr}"`);

    // Doble verificación: asegurar que no existe el código como string
    const { data: existe, error: errorExiste } = await supabaseStudentClient
      .from("estudiantes")
      .select("id, codigo_estudiante")
      .eq("codigo_estudiante", codigoStr)
      .limit(1);

    if (errorExiste) {
      console.error("Error verificando existencia:", errorExiste);
    }

    if (existe && existe.length > 0) {
      console.warn(`⚠️ Código ${codigoStr} ya existe, buscando siguiente disponible...`);
      console.warn("Estudiante con código duplicado:", existe[0]);
      // Buscar el siguiente código disponible
      return await buscarSiguienteDisponible(nuevoCodigo + 1);
    }

    return codigoStr; // Retornar como string

  } catch (error) {
    console.error("❌ Error en generarCodigoUnico:", error);
    throw error;
  }
};

// Función auxiliar para buscar el siguiente código disponible en caso de duplicados
const buscarSiguienteDisponible = async (desde) => {
  for (let codigo = desde; codigo <= 7000; codigo++) {
    const codigoStr = String(codigo).padStart(4, '0');
    
    const { data: existe } = await supabaseStudentClient
      .from("estudiantes")
      .select("id")
      .eq("codigo_estudiante", codigoStr)
      .limit(1);
    
    if (!existe || existe.length === 0) {
      // console.log(`✅ Código disponible encontrado: ${codigoStr}`);
      return codigoStr;
    }
  }
  
  throw new Error("No hay códigos disponibles en el rango 5320-7000");
};

function removeAccents(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}


// FUNCIÓN AUXILIAR PARA GENERAR CORREO ÚNICO
const generarCorreoUnico = async (nombre, apellido1, apellido2 = null) => {
  const baseCorreo = removeAccents(`${nombre.toLowerCase()}.${apellido1.toLowerCase()}`);
  let correo = `${baseCorreo}@gimnasiomariecurie.edu.co`;
  
  // Verificar si ya existe el correo base
  let { data: existe } = await supabaseStudentClient
    .from("estudiantes")
    .select("id")
    .eq("email_institucional", correo)
    .limit(1);
  
  // Si existe y hay segundo apellido, intentar con él
  if (existe && existe.length > 0 && apellido2) {
    correo = removeAccents(`${baseCorreo}.${apellido2.toLowerCase()}@gimnasiomariecurie.edu.co`);
    
    const { data: existe2 } = await supabaseStudentClient
      .from("estudiantes")
      .select("id")
      .eq("email_institucional", correo)
      .limit(1);
    
    existe = existe2;
  }
  
  // Si aún existe, agregar número secuencial
  let contador = 1;
  while (existe && existe.length > 0) {
    correo = `${baseCorreo}${contador}@gimnasiomariecurie.edu.co`;
    
    const { data: existeNum } = await supabaseStudentClient
      .from("estudiantes")
      .select("id")
      .eq("email_institucional", correo)
      .limit(1);
    
    existe = existeNum;
    contador++;
    
    // Evitar bucles infinitos
    if (contador > 1000) {
      throw new Error("No se pudo generar un correo único");
    }
  }
  
  return correo;
};

// export const generarCodigoYCorreo = async (matricula) => {
//   try {
//     const { data: student, error: studentError } = await supabaseStudentClient
//       .from("estudiantes")
//       .select("*")
//       .eq("id", matricula.estudiante_id)
//       .single();

//     if (studentError) {
//       console.error("Error obteniendo estudiante:", studentError);
//       throw studentError;
//     }
//     if (!student) {
//       throw new Error("Estudiante no encontrado");
//     }

//     const nuevoCodigo = await generarCodigoUnico();
//     const nuevoCorreo = await generarCorreoUnico(
//       student.primer_nombre,
//       student.primer_apellido,
//       student.segundo_apellido
//     );

//     // Fecha actual (hora local del servidor / navegador)
//     const ahora = new Date();
//     const mes = ahora.getMonth() + 1; // 1..12
//     const añoActual = ahora.getFullYear();
//     const añoSiguiente = añoActual + 1;

//     // Regla: si es Nov(11) o Dic(12) -> Año siguiente; en caso contrario Año actual
//     const ano_ingreso_valor =
//       mes === 11 || mes === 12 ? `Año ${añoSiguiente}` : `Año ${añoActual}`;

//     const { data: uploadedStudent, error: updateError } = await supabaseStudentClient
//       .from("estudiantes")
//       .update({
//         codigo_estudiante: nuevoCodigo,
//         email_institucional: nuevoCorreo,
//         ano_ingreso_institucion: ano_ingreso_valor,
//         estudiante_nuevo_antiguo: "Nuevo",
//       })
//       .eq("id", student.id);

//     if (updateError) {
//       console.error("Error actualizando estudiante:", updateError);
//       throw updateError;
//     }

//     // Actualizar la matrícula ligada
//     await updateMatriculaByID(matricula.id, {
//       codigo_estudiante: nuevoCodigo,
//     });

//     return { success: true, uploadedStudent };
//   } catch (err) {
//     console.error("Error en generarCodigoYCorreo:", err);
//     return { success: false, error: err };
//   }
// };

export const generarCodigoYCorreo = async (matricula) => {
  try {
    // console.log("🔄 Iniciando generación de código y correo para matrícula:", matricula.id);
    
    const { data: student, error: studentError } = await supabaseStudentClient
      .from("estudiantes")
      .select("*")
      .eq("id", matricula.estudiante_id)
      .single();

    if (studentError) {
      console.error("❌ Error obteniendo estudiante:", studentError);
      throw studentError;
    }
    if (!student) {
      throw new Error("Estudiante no encontrado");
    }

    // console.log("👤 Estudiante encontrado:", {
    //   id: student.id,
    //   nombre: `${student.primer_nombre} ${student.primer_apellido}`,
    //   codigoActual: student.codigo_estudiante
    // });

    // Generar nuevo código (retorna string)
    const nuevoCodigo = await generarCodigoUnico();
    // console.log(`🔢 Nuevo código generado: "${nuevoCodigo}" (tipo: ${typeof nuevoCodigo})`);
    
    const nuevoCorreo = await generarCorreoUnico(
      student.primer_nombre,
      student.primer_apellido,
      student.segundo_apellido
    );
    // console.log(`📧 Nuevo correo generado: ${nuevoCorreo}`);

    // Fecha actual (hora local del servidor / navegador)
    const ahora = new Date();
    const mes = ahora.getMonth() + 1; // 1..12
    const añoActual = ahora.getFullYear();
    const añoSiguiente = añoActual + 1;

    // Regla: si es Nov(11) o Dic(12) -> Año siguiente; en caso contrario Año actual
    const ano_ingreso_valor =
      mes === 11 || mes === 12 ? `${añoSiguiente}` : `${añoActual}`;

    // console.log(`📅 Año de ingreso: ${ano_ingreso_valor}`);

    // Actualizar estudiante
    const { data: uploadedStudent, error: updateError } = await supabaseStudentClient
      .from("estudiantes")
      .update({
        codigo_estudiante: nuevoCodigo, // Ya es string
        email_institucional: nuevoCorreo,
        ano_ingreso_institucion: ano_ingreso_valor,
        estudiante_nuevo_antiguo: "Nuevo",
      })
      .eq("id", student.id)
      .select();

    if (updateError) {
      console.error("❌ Error actualizando estudiante:", updateError);
      throw updateError;
    }

    // console.log("✅ Estudiante actualizado correctamente:", uploadedStudent);

    // Actualizar la matrícula ligada
    const { data: matriculaUpdated, error: errorMatricula } = await updateMatriculaByID(
      matricula.id, 
      { codigo_estudiante: nuevoCodigo }
    );

    if (errorMatricula) {
      console.error("❌ Error actualizando matrícula:", errorMatricula);
      throw errorMatricula;
    }

    // console.log("✅ Matrícula actualizada correctamente");

    toast.success(`✅ Código ${nuevoCodigo} y correo ${nuevoCorreo} generados exitosamente`);

    return { 
      success: true, 
      uploadedStudent,
      codigo: nuevoCodigo,
      correo: nuevoCorreo
    };
    
  } catch (err) {
    console.error("❌ Error en generarCodigoYCorreo:", err);
    toast.error(`Error generando código: ${err.message}`);
    return { success: false, error: err };
  }
};


export const resetProceso = async(id)=>{
  await supabaseStudentClient
  .from("matriculas")
  .update({
    codigo_estudiante: null,
    estado_pago_sistema: "pendiente_link",
    link_pago_wompi: ""
  })
  .eq("id", id);
}

//AWS API
export const validarEmail = async (email) => {
  try {
    const response = await fetch("https://8ufsw0wsb5.execute-api.us-east-1.amazonaws.com/prod/validateEmail", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }), // 👈 lo que tu endpoint espera
    });

    const data = await response.json();
    // console.log("Respuesta API:", data);
    return data;
  } catch (error) {
    console.error("Error al validar email:", error);
  }
};



/************************************************************************************* 
 ************** FUNCIONES PARA REINICIAR GENERADOR DE LINK DE PAGO *******************
 *************************************************************************************/

 // services/wompi/pagoMatriculaApi.js

/**
 * Reinicia una matrícula para permitir generar un nuevo link de pago
 * Funciona para estados: 'link_generado' y 'expirado'
 * 
 * @param {string} matriculaId - ID de la matrícula
 * @returns {Object} - { success, data, error }
 */
export const reiniciarMatriculaParaNuevoLink = async (matriculaId) => {
  try {
    console.log('🔄 Iniciando reinicio de matrícula:', matriculaId);

    // 1. VALIDACIÓN: Verificar estado actual
    const { data: matriculaActual, error: errorConsulta } = await supabaseStudentClient
      .from('matriculas')
      .select('id, estado_pago_sistema, link_pago_wompi, codigo_estudiante, nombre_estudiante')
      .eq('id', matriculaId)
      .single();

    if (errorConsulta) throw errorConsulta;

    console.log('📋 Estado actual de la matrícula:', matriculaActual.estado_pago_sistema);

    // 2. VALIDACIÓN: Solo permitir 'link_generado' o 'expirado'
    const estadosPermitidos = ['link_generado', 'expirado'];
    if (!estadosPermitidos.includes(matriculaActual.estado_pago_sistema)) {
      return {
        success: false,
        error: `No se puede reiniciar. Estado actual: "${matriculaActual.estado_pago_sistema}". Solo se permite reiniciar matrículas con estado "link_generado" o "expirado".`
      };
    }

    // 3. VALIDACIÓN: No permitir si ya fue pagado (seguridad adicional)
    if (matriculaActual.estado_pago_sistema === 'pagado') {
      return {
        success: false,
        error: 'No se puede reiniciar una matrícula que ya fue pagada'
      };
    }

    console.log('✅ Validaciones pasadas, ejecutando reinicio...');

    // 4. EJECUTAR REINICIO - Resetear campos
    const { data, error } = await supabaseStudentClient
      .from('matriculas')
      .update({
        estado_pago_sistema: 'pendiente_link',
        link_pago_wompi: null,
        fecha_link_generado: null,
      })
      .eq('id', matriculaId)
      .select();

    if (error) throw error;

    console.log('✅ Matrícula reiniciada exitosamente:', data);

    return { 
      success: true, 
      data,
      mensaje: 'Matrícula reiniciada. Ya puedes generar un nuevo link de pago.'
    };
    
  } catch (error) {
    console.error('❌ Error al reiniciar matrícula:', error);
    return { 
      success: false, 
      error: error.message || 'Error desconocido al reiniciar matrícula'
    };
  }
};