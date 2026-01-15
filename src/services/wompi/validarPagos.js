// validarPagos.js
import { supabaseStudentClient } from "../../core/config/supabase/supabaseCampusStudentClient";
import { sendEmail } from "../azure/AzureAdServices";
import {
  generarCodigoYCorreo,
  insertMatricula,
  updateMatriculaByID,
} from "./pagoMatriculaExternoApi";

/* ---------------------------
   OBTENER EMAIL DESTINATARIO (local) - VERSIÓN CORREGIDA
   - Prioridad: Padre → Madre → Guardián
   - Busca el email marcado como acudiente primero
   - Si no hay acudiente, toma el primer email disponible
   --------------------------- */
const obtenerEmailDestinatarioLocal = async (student, matricula = null) => {
  const estudianteId = student?.id || matricula?.estudiante_id;
  
  if (!estudianteId) {
    console.error("❌ obtenerEmailDestinatarioLocal: No se proporcionó estudiante_id");
    return null;
  }

  console.log(`🔍 Buscando email para estudiante_id: ${estudianteId}`);
  console.log(`📊 Student IDs disponibles:`, {
    father_id: student?.father_id || student?.new_father_id,
    mother_id: student?.mother_id || student?.new_mother_id,
    guardian_id: student?.guardian_id
  });

  // ============================================
  // PASO 1: BUSCAR EN PADRES (father_id y mother_id)
  // ============================================
  const fatherId = student?.new_father_id || student?.father_id;
  const motherId = student?.new_mother_id || student?.mother_id;

  // Array para almacenar padres encontrados
  const padresEncontrados = [];

  // Buscar padre
  if (fatherId) {
    try {
      console.log(`🔍 Buscando padre con ID: ${fatherId}`);
      const { data: padre, error: errorPadre } = await supabaseStudentClient
        .from("padres")
        .select("id, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, email, es_acudiente")
        .eq("id", fatherId)
        .maybeSingle();

      if (errorPadre) {
        console.warn(`⚠️ Error consultando padre:`, errorPadre.message);
      } else if (padre && padre.email && String(padre.email).includes("@")) {
        console.log(`✅ Padre encontrado:`, padre.email);
        padresEncontrados.push({
          email: padre.email,
          nombre: `${padre.primer_nombre || ""} ${padre.segundo_nombre || ""} ${padre.primer_apellido || ""} ${padre.segundo_apellido || ""}`.trim(),
          tipo: "padre",
          es_acudiente: padre.es_acudiente || false,
          prioridad: 1
        });
      } else {
        console.log(`⚠️ Padre encontrado pero sin email válido`);
      }
    } catch (e) {
      console.error(`❌ Excepción consultando padre:`, e);
    }
  }

  // Buscar madre
  if (motherId) {
    try {
      console.log(`🔍 Buscando madre con ID: ${motherId}`);
      const { data: madre, error: errorMadre } = await supabaseStudentClient
        .from("padres")
        .select("id, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, email, es_acudiente")
        .eq("id", motherId)
        .maybeSingle();

      if (errorMadre) {
        console.warn(`⚠️ Error consultando madre:`, errorMadre.message);
      } else if (madre && madre.email && String(madre.email).includes("@")) {
        console.log(`✅ Madre encontrada:`, madre.email);
        padresEncontrados.push({
          email: madre.email,
          nombre: `${madre.primer_nombre || ""} ${madre.segundo_nombre || ""} ${madre.primer_apellido || ""} ${madre.segundo_apellido || ""}`.trim(),
          tipo: "madre",
          es_acudiente: madre.es_acudiente || false,
          prioridad: 2
        });
      } else {
        console.log(`⚠️ Madre encontrada pero sin email válido`);
      }
    } catch (e) {
      console.error(`❌ Excepción consultando madre:`, e);
    }
  }

  // ============================================
  // PASO 2: PRIORIZAR ACUDIENTE ENTRE PADRES
  // ============================================
  if (padresEncontrados.length > 0) {
    // Buscar primero quien esté marcado como acudiente
    const acudiente = padresEncontrados.find(p => p.es_acudiente === true);
    if (acudiente) {
      console.log(`✅ Email de acudiente (${acudiente.tipo}) encontrado:`, acudiente.email);
      return {
        email: acudiente.email,
        nombre: acudiente.nombre,
        tipo: acudiente.tipo,
        es_acudiente: true
      };
    }

    // Si no hay acudiente marcado, tomar el primero disponible (padre tiene prioridad)
    padresEncontrados.sort((a, b) => a.prioridad - b.prioridad);
    const primerPadre = padresEncontrados[0];
    console.log(`✅ Email de ${primerPadre.tipo} encontrado (sin marca de acudiente):`, primerPadre.email);
    return {
      email: primerPadre.email,
      nombre: primerPadre.nombre,
      tipo: primerPadre.tipo,
      es_acudiente: false
    };
  }

  console.log(`⚠️ No se encontraron padres con email válido`);

  // ============================================
  // PASO 3: BUSCAR EN GUARDIANES (última opción)
  // ============================================
  const guardianId = student?.guardian_id;

  if (guardianId) {
    try {
      console.log(`🔍 Buscando guardián con ID: ${guardianId}`);
      const { data: guardian, error: errorGuardian } = await supabaseStudentClient
        .from("guardianes")
        .select("id, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, email, es_acudiente")
        .eq("id", guardianId)
        .maybeSingle();

      if (errorGuardian) {
        console.warn(`⚠️ Error consultando guardián:`, errorGuardian.message);
      } else if (guardian && guardian.email && String(guardian.email).includes("@")) {
        console.log(`✅ Guardián encontrado:`, guardian.email);
        return {
          email: guardian.email,
          nombre: `${guardian.primer_nombre || ""} ${guardian.segundo_nombre || ""} ${guardian.primer_apellido || ""} ${guardian.segundo_apellido || ""}`.trim(),
          tipo: "guardian",
          es_acudiente: guardian.es_acudiente || false
        };
      } else {
        console.log(`⚠️ Guardián encontrado pero sin email válido`);
      }
    } catch (e) {
      console.error(`❌ Excepción consultando guardián:`, e);
    }
  }

  // ============================================
  // PASO 4: NO SE ENCONTRÓ NINGÚN EMAIL
  // ============================================
  console.error("❌ No se encontró ningún email válido después de buscar en padres y guardián");
  console.error("📊 Datos del estudiante:", {
    id: estudianteId,
    codigo: student?.codigo_estudiante,
    father_id: fatherId,
    mother_id: motherId,
    guardian_id: guardianId
  });
  
  return null;
};
/* ---------------------------
   ENVIAR NOTIFICACIÓN DE PAGO REALIZADO
   - Usa sendEmail para enviar un HTML simple
   - Retorna { success, message, email? }
   --------------------------- */
const enviarNotificacionPagoRealizado = async ({ student, matricula }) => {
  try {
    const destinatario = await obtenerEmailDestinatarioLocal(student, matricula);
    if (!destinatario || !destinatario.email) {
      console.warn("No se encontró email destinatario para notificación de pago");
      return { success: false, message: "No hay email del destinatario" };
    }

    const nombreCompleto = `${student?.primer_nombre || ""} ${student?.segundo_nombre || ""} ${student?.primer_apellido || ""} ${student?.segundo_apellido || ""}`.trim();

    const asunto = `Notificaciones GBCMC - Confirmación de pago de matrícula - ${nombreCompleto}`;

    const mensaje = `
      <!doctype html>
      <html lang="es">
      <head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
      <body style="font-family: Arial, Helvetica, sans-serif; color:#111; background:#f7fafc; padding:20px;">
        <div style="max-width:680px;margin:0 auto;background:#fff;padding:20px;border-radius:8px;box-shadow:0 6px 18px rgba(0,0,0,0.06);">
          <h2 style="color:#1e40af;margin-top:0;">Confirmación de pago</h2>
          <p>Estimado(a) <strong>${destinatario.nombre}</strong>,</p>
          <p>Le informamos que hemos recibido correctamente el pago de matrícula para <strong>${nombreCompleto}</strong>.</p>
          <p>Por favor ingrese al campus instutucional y continue con el proceso de matrícula.</p>
            <br />
          <h3 style="margin-top:20px;">Recuerde:</h3>
            <ul>
            <li>Completar o actualizar los datos de los formularios.</li>
            <li>Completar el formulario de familiarízate.</li>
            <li>Actualizar y subir los docuemntos requeridos.</li>
            <li>Realizar el envío de los contratos y firmar cada uno de ellos teniendo en cuenta los corres de destino detallados.</li>
            <li>Eviar matrícula antes de la fecha límite establecida.</li>
          </ul>
            <br />
          <p>Si tiene alguna duda, por favor contacte a <a href="mailto:helpdesk@gimnasiomariecurie.edu.co">helpdesk@gimnasiomariecurie.edu.co</a>.</p>

          <p style="margin-top:20px;"><a href="https://campusgbcmc.gakutech.com/parents" style="display:inline-block;padding:10px 18px;background:#1e40af;color:white;border-radius:6px;text-decoration:none;">Ingresar al portal</a></p>

          <hr style="border:none;border-top:1px solid #eee;margin-top:18px" />
          <p style="font-size:12px;color:#6b7280">Gimnasio Bilingüe Campestre Marie Curie — Correo automático, por favor no responder.</p>
        </div>
      </body>
      </html>
    `.trim();

    const resultado = await sendEmail(asunto, mensaje, destinatario.email,);
    const resultado2 = await sendEmail(asunto, mensaje, "danielbeltranosor@gmail.com",);
    if (!resultado.success) {
      console.error("Error enviando notificación de pago:", resultado.error || resultado);
      return { success: false, message: resultado.error || "Error enviando email" };
    }

    if(resultado.success){
      console.log("✅ Notificación de pago enviada exitosamente a:", destinatario.email);
      console.log("resultado:", resultado);
      console.log("resultado2:", resultado2);
    }

    return { success: true, message: "Email enviado", email: destinatario.email };
  } catch (err) {
    console.error("Excepción en enviarNotificacionPagoRealizado:", err);
    return { success: false, message: err?.message || String(err) };
  }
};

/* ---------------------------
   VALIDAR PAGOS (función principal)
   --------------------------- */
export const validarPagos = async ({ datos }) => {
  if (!Array.isArray(datos)) {
    throw new Error("El parámetro 'datos' debe ser un array");
  }

  const results = [];

  for (const d of datos) {
    const awsCodigoRaw = d?.codigo_estudiante ?? "";
    const awsCodigo = String(awsCodigoRaw).trim();
    const isAdm = awsCodigo.toUpperCase().startsWith("ADM");

    try {
      // Buscar matrícula por codigo_estudiante
      const { data: matriculas, error: errMat } = await supabaseStudentClient
        .from("matriculas")
        .select("*")
        .eq("codigo_estudiante", awsCodigo)
        .limit(1);

      if (errMat) {
        console.error("Error consultando matriculas:", errMat);
        results.push({ codigo_estudiante: awsCodigo, ok: false, error: errMat });
        continue;
      }

      const matricula = Array.isArray(matriculas) ? matriculas[0] : matriculas;

      if (!matricula) {
        // No existe matrícula -> buscar estudiante
        const { data: estudiantes, error: errEst } = await supabaseStudentClient
          .from("estudiantes")
          .select("*")
          .eq("codigo_estudiante", awsCodigo)
          .limit(1);

        if (errEst) {
          console.error("Error consultando estudiante:", errEst);
          results.push({ codigo_estudiante: awsCodigo, ok: false, error: errEst });
          continue;
        }

        const estudiante = Array.isArray(estudiantes) ? estudiantes[0] : estudiantes;
        if (!estudiante) {
          console.warn("No se encontró estudiante para código:", awsCodigo);
          results.push({ codigo_estudiante: awsCodigo, ok: false, error: "Estudiante no encontrado" });
          continue;
        }

        // Insertar matrícula
        const awsDataArray = Array.isArray(d.info_pago) ? d.info_pago : (d.info_pago ? [d.info_pago] : []);
        let insertRes;
        try {
          insertRes = await insertMatricula(estudiante, awsDataArray);
        } catch (errInsertEx) {
          console.error("Excepción insertando matrícula:", errInsertEx);
          results.push({ codigo_estudiante: awsCodigo, ok: false, error: errInsertEx });
          continue;
        }

        // Normalizar resultado
        let createdMatricula = null;
        let errInsert = null;
        if (!insertRes) {
          errInsert = "insertMatricula returned null/undefined";
        } else if (insertRes?.error) {
          errInsert = insertRes.error;
          createdMatricula = Array.isArray(insertRes.data) ? insertRes.data[0] : insertRes.data;
        } else if (insertRes.data !== undefined) {
          errInsert = insertRes.error || null;
          createdMatricula = Array.isArray(insertRes.data) ? insertRes.data[0] : insertRes.data;
        } else {
          createdMatricula = insertRes;
        }

        if (errInsert) {
          console.error("Error insertando matricula (normalizado):", errInsert);
          results.push({ codigo_estudiante: awsCodigo, ok: false, error: errInsert });
          continue;
        }

        // Si la creación no devolvió id, aún así continuamos (pero avisamos)
        if (!createdMatricula || !createdMatricula.id) {
          console.warn("Insert matricula OK pero sin id:", createdMatricula);
        }

        // Generar código y correo si procede (ADM)
        let generated = false;
        let genResult = null;
        if (isAdm) {
          try {
            genResult = await generarCodigoYCorreo(createdMatricula);
            generated = !!(genResult && genResult.success);
          } catch (errGen) {
            console.error("Error generando código/correo para creada matricula:", errGen);
          }
        }

        // Enviar notificación de pago al padre/madre/acudiente (si es posible)
        let pagoEmailResult = null;
        try {
          pagoEmailResult = await enviarNotificacionPagoRealizado({ student: estudiante, matricula: createdMatricula });
        } catch (errEmail) {
          console.error("Error enviando notificación de pago (insert):", errEmail);
        }

        results.push({
          codigo_estudiante: awsCodigo,
          ok: true,
          action: "inserted",
          matricula_id: createdMatricula?.id ?? null,
          generatedCodigoCorreo: generated,
          generarResult: genResult ?? null,
          pagoEmailResult,
        });
      } else {
        // Existe matrícula -> actualizar estado a 'pagado'
        const updatePayload = {
          estado_pago_sistema: "pagado",
          fecha_pago_completado: new Date().toISOString(),
          notas_adicionales: d?.notas_adicionales ?? "Pago externo a Gakutech",
        };

        let updateRes;
        try {
          updateRes = await updateMatriculaByID(matricula.id, updatePayload);
        } catch (errUpdateEx) {
          console.error("Excepción actualizando matrícula:", errUpdateEx);
          results.push({ codigo_estudiante: awsCodigo, ok: false, error: errUpdateEx });
          continue;
        }

        const updateError = updateRes && (updateRes.error || null);
        if (updateError) {
          console.error("Error actualizando matrícula (normalizado):", updateError);
          results.push({ codigo_estudiante: awsCodigo, ok: false, error: updateError });
          continue;
        }

        // Reconsultar matrícula actualizada
        const { data: matriculaRefetchArr, error: errRefetch } = await supabaseStudentClient
          .from("matriculas")
          .select("*")
          .eq("id", matricula.id)
          .limit(1);

        if (errRefetch) {
          console.error("Error al reconsultar matricula:", errRefetch);
          results.push({ codigo_estudiante: awsCodigo, ok: false, error: errRefetch });
          continue;
        }

        const matriculaRefetch = Array.isArray(matriculaRefetchArr) ? matriculaRefetchArr[0] : matriculaRefetchArr;

        // Comprobar si la matrícula ya tiene código
        const matriculaHasCodigo = matriculaRefetch && matriculaRefetch.codigo_estudiante && String(matriculaRefetch.codigo_estudiante).trim() !== "";

        // Generar código y correo si es ADM o no tiene código
        let generated = false;
        let genResult = null;
        if (isAdm || !matriculaHasCodigo) {
          try {
            genResult = await generarCodigoYCorreo(matriculaRefetch);
            generated = !!(genResult && genResult.success);
          } catch (errGen) {
            console.error("Error generando código/correo en actualización:", errGen);
          }
        }

        // Obtener estudiante para enviar correo de pago
        const { data: studentArr, error: errStudentFetch } = await supabaseStudentClient
          .from("estudiantes")
          .select("*")
          .eq("id", matriculaRefetch.estudiante_id)
          .limit(1);

        if (errStudentFetch) {
          console.error("Error obteniendo estudiante para notificación:", errStudentFetch);
        }

        const student = Array.isArray(studentArr) ? studentArr[0] : studentArr;

        let pagoEmailResult = null;
        try {
          pagoEmailResult = await enviarNotificacionPagoRealizado({ student, matricula: matriculaRefetch });
        } catch (errEmail) {
          console.error("Error enviando notificación de pago (update):", errEmail);
        }

        results.push({
          codigo_estudiante: awsCodigo,
          ok: true,
          action: "updated",
          matricula_id: matricula.id,
          generatedCodigoCorreo: generated,
          generarResult: genResult ?? null,
          pagoEmailResult,
        });
      }
    } catch (err) {
      console.error("Error procesando registro:", d, err);
      results.push({
        codigo_estudiante: awsCodigo,
        ok: false,
        error: String(err?.message ?? err),
      });
    }
  }

  return results;
};

export default validarPagos;