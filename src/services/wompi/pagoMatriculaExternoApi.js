// pagoMatriculaApi.js - Versión mejorada
import { toast } from "react-toastify";
import { supabaseStudentClient } from "../../core/config/supabase/supabaseCampusStudentClient";
import { sendEmail } from "../azure/AzureAdServices";

const supabase = supabaseStudentClient;

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
    .eq("codigo_estudiante", student.codigo_estudiante)
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
    // enviar ARRAY (no JSON.stringify) para que supabase inserte JSONB
    concepto_pago: `MATRICULA ${anoSiguiente}`,
    conceptos_pago: transformed,
    codigo_estudiante: student.codigo_estudiante,
    referencia_aws: awsDataPrincipal?.Tercero_Interno ?? null,
    valor_a_pagar: Math.round(valor_a_pagar_total),
    fecha_vencimiento: awsDataPrincipal?.Vencimiento ? formatDMYToYYYYMMDD(awsDataPrincipal.Vencimiento) : null,
    descuento_aplicado: 0,
    notas_adicionales: "Pago Externo a Gakutech",
    estudiante_id: student.id,
    ano_academico: new Date().getFullYear(),
    estado_pago_sistema: "pagado",
    fecha_pago_completado: new Date().toISOString(),
    codigo_adm_aws: student.codigo_estudiante.startsWith("ADM")? student.codigo_estudiante: null,
    link_pago_wompi: "",
    pagado_por_nombre: "",
    pagado_por_email: "",
    pagado_por_telefono: "",
    pagado_por_documento: "",
  };

  try {
    const { data, error } = await supabase
      .from("matriculas")
      .insert(payload)
      .select("*");

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
    const { data: matriculaUpdated, error } = await supabase
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

export const updateMatriculaByID = async(id, data)=>{
  const {data: matriculaUpdated, error} = await supabase
  .from('matriculas')
  .update(data)
  .eq("id", id);

  if(error){
      console.log("Error actualizando: ", error);
    }

  return {matriculaUpdated, error};
}

function removeAccents(str) {
  return String(str || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export const generarCodigoUnico = async () => {
  try {
    const { data: estudiantes, error } = await supabase
      .from("estudiantes")
      .select("codigo_estudiante")
      .not("codigo_estudiante", "is", null)
      .not("codigo_estudiante", "eq", "")
      .like("codigo_estudiante", "[0-9]%");

    if (error) {
      throw new Error(`Error obteniendo códigos: ${error.message}`);
    }

    const codigosNumericos = estudiantes
      ?.map((e) => {
        const codigoStr = String(e.codigo_estudiante).trim();
        if (!/^\d+$/.test(codigoStr)) return null;
        const codigo = parseInt(codigoStr, 10);
        return codigo >= 5320 && codigo <= 7000 ? codigo : null;
      })
      .filter((codigo) => codigo !== null)
      .sort((a, b) => b - a);

    let nuevoCodigo;
    if (!codigosNumericos || codigosNumericos.length === 0) {
      nuevoCodigo = 5320;
    } else {
      const ultimoCodigo = codigosNumericos[0];
      nuevoCodigo = ultimoCodigo + 1;
    }

    if (nuevoCodigo > 7000) {
      throw new Error("Se han agotado los códigos disponibles (5320-7000)");
    }

    const codigoStr = String(nuevoCodigo).padStart(4, "0");

    const { data: existe, error: errorExiste } = await supabase
      .from("estudiantes")
      .select("id, codigo_estudiante")
      .eq("codigo_estudiante", codigoStr)
      .limit(1);

    if (errorExiste) {
      console.error("Error verificando existencia del código:", errorExiste);
    }

    if (existe && existe.length > 0) {
      return await buscarSiguienteDisponible(nuevoCodigo + 1);
    }

    return codigoStr;
  } catch (error) {
    console.error("Error en generarCodigoUnico:", error);
    throw error;
  }
};

const buscarSiguienteDisponible = async (desde) => {
  for (let codigo = desde; codigo <= 7000; codigo++) {
    const codigoStr = String(codigo).padStart(4, "0");

    const { data: existe } = await supabase
      .from("estudiantes")
      .select("id")
      .eq("codigo_estudiante", codigoStr)
      .limit(1);

    if (!existe || existe.length === 0) {
      return codigoStr;
    }
  }

  throw new Error("No hay códigos disponibles en el rango 5320-7000");
};

/* ---------------------------
   GENERAR CORREO ÚNICO
   --------------------------- */
export const generarCorreoUnico = async (nombre, apellido1, apellido2 = null) => {
  const baseCorreo = removeAccents(`${String(nombre || "").toLowerCase()}.${String(apellido1 || "").toLowerCase()}`);
  let correo = `${baseCorreo}@gimnasiomariecurie.edu.co`;

  let { data: existe } = await supabase
    .from("estudiantes")
    .select("id")
    .eq("email_institucional", correo)
    .limit(1);

  if (existe && existe.length > 0 && apellido2) {
    correo = removeAccents(`${baseCorreo}.${String(apellido2 || "").toLowerCase()}@gimnasiomariecurie.edu.co`);
    const { data: existe2 } = await supabase
      .from("estudiantes")
      .select("id")
      .eq("email_institucional", correo)
      .limit(1);
    existe = existe2;
  }

  let contador = 1;
  while (existe && existe.length > 0) {
    correo = `${baseCorreo}${contador}@gimnasiomariecurie.edu.co`;
    const { data: existeNum } = await supabase
      .from("estudiantes")
      .select("id")
      .eq("email_institucional", correo)
      .limit(1);
    existe = existeNum;
    contador++;
    if (contador > 1000) {
      throw new Error("No se pudo generar un correo único");
    }
  }

  return correo;
};

/* ---------------------------
   OBTENER EMAIL DESTINATARIO
   Busca correo del padre/madre/acudiente:
   - Revisa campos dentro del student (posibles nombres comunes)
   - Si no encuentra, intenta consultar tabla 'familiares' (si existe)
   --------------------------- */
const obtenerEmailDestinatario = async (student, matricula = null) => {
  // 1) revisar campos comunes en el registro del estudiante
  const posiblesCampos = [
    "email_acudiente",
    "email_padre",
    "email_madre",
    "email_tutor",
    "email_responsable",
    "correo_acudiente",
    "correo_padre",
    "correo_madre",
  ];

  for (const field of posiblesCampos) {
    if (student && student[field]) {
      return {
        email: student[field],
        nombre: student[`${field.replace(/email_|correo_/, "nombre_")}`] || "Acudiente",
        tipo: field,
      };
    }
  }

  // 2) intentar buscar en tabla 'familiares' (ó 'familiares_estudiantes' / 'estudiantes_familiares')
  // intentar una consulta genérica - adapta el nombre de la tabla si tu BD usa otro.
  const tablasPosibles = ["familiares", "familiares_estudiantes", "estudiantes_familiares", "familiares_alumnos"];
  for (const tabla of tablasPosibles) {
    try {
      const { data, error } = await supabase
        .from(tabla)
        .select("id, nombre, email")
        .eq("estudiante_id", student?.id || matricula?.estudiante_id)
        .limit(1);

      if (!error && data && data.length > 0) {
        return {
          email: data[0].email,
          nombre: data[0].nombre || "Acudiente",
          tipo: tabla,
        };
      }
    } catch (err) {
      // ignorar y seguir probando otras tablas
      // console.debug("Tabla no existente o error consultando", tabla, err);
    }
  }

  // 3) no encontrado
  return null;
};

/* ---------------------------
   ENVIAR NOTIFICACIÓN (HTML)
   --------------------------- */
export const enviarNotificacionCodigoAsignado = async ({ estudiante, nuevoCodigo, nuevoCorreo, anoIngreso, matricula = null }) => {
  try {
    const destinatario = await obtenerEmailDestinatario(estudiante, matricula);

    if (!destinatario || !destinatario.email) {
      console.warn("No se encontró email del destinatario. No se enviará notificación.");
      return { success: false, message: "Email destinatario no disponible" };
    }

    const nombreCompleto = `${estudiante.primer_nombre || ""} ${estudiante.segundo_nombre || ""} ${estudiante.primer_apellido || ""} ${estudiante.segundo_apellido || ""}`.trim();
    const asunto = `Código de Estudiante Asignado - ${nombreCompleto}`;

    const mensaje = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial; color:#111827; background:#f5f7fb; padding:20px; }
    .card { background:white; border-radius:10px; padding:24px; max-width:700px; margin:0 auto; box-shadow:0 6px 18px rgba(15,23,42,0.06); }
    .header { background:linear-gradient(135deg,#1e40af,#3b82f6); color:#fff; padding:12px 16px; border-radius:8px; text-align:center; }
    .credential { margin:20px 0; text-align:center; }
    .label { font-size:12px; color:#6b7280; text-transform:uppercase; letter-spacing:0.6px; }
    .value { font-family: "Courier New", monospace; font-size:22px; color:#1e40af; font-weight:700; margin-top:8px; }
    .info { margin-top:18px; color:#374151; line-height:1.5; }
    .cta { display:inline-block; margin-top:20px; padding:12px 22px; background:#1e40af; color:#fff; border-radius:8px; text-decoration:none; }
    .footer { margin-top:24px; font-size:12px; color:#9ca3af; text-align:center; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header"><h2>Notificaciones GBCMC - Código Asignado</h2></div>
    <p style="margin-top:16px;">Estimado(a) <strong>${destinatario.nombre}</strong>,</p>
    <p class="info">Se ha registrado el pago de matrícula y se ha asignado el siguiente código institucional para <strong>${nombreCompleto}</strong> (${anoIngreso}).</p>

    <div class="credential">
      <div class="label">Código de Estudiante</div>
      <div class="value">${nuevoCodigo}</div>

      <div style="height:16px"></div>

      <div class="label">Correo Institucional</div>
      <div class="value" style="font-size:16px;">${nuevoCorreo}</div>
    </div>

    <p class="info">Puedes ingresar al portal de la institución con las credenciales. Si tienes problemas, contacta a helpdesk@gimnasiomariecurie.edu.co</p>

    <p style="text-align:center;">
      <a class="cta" href="https://campusgbcmc.gakutech.com/parents" target="_blank" rel="noreferrer">Ir al Portal de Matrículas</a>
    </p>

    <div class="footer">
      Gimnasio Bilingüe Campestre Marie Curie<br/>
      Este es un correo automático, por favor no responder.
    </div>
  </div>
</body>
</html>
    `.trim();

    const resultadoEnvio = await sendEmail(asunto, mensaje, destinatario.email);

    if (!resultadoEnvio.success) {
      console.error("Fallo envío correo:", resultadoEnvio.error || resultadoEnvio);
      return { success: false, message: resultadoEnvio.error || "Error enviando email" };
    }

    return {
      success: true,
      message: "Email enviado",
      email: destinatario.email,
      destinatario: destinatario.nombre,
      tipo: destinatario.tipo,
      data: resultadoEnvio.data || null,
    };
  } catch (error) {
    console.error("Error en enviarNotificacionCodigoAsignado:", error);
    return { success: false, message: error.message || "Error desconocido" };
  }
};

/* ---------------------------
   FUNCIÓN PRINCIPAL: generarCodigoYCorreo
   - matricula: objeto con al menos .estudiante_id y .id
   - opciones: { setGenerandoCodigo, handleRecargar } (opcionales)
   --------------------------- */
export const generarCodigoYCorreo = async (matricula, { setGenerandoCodigo, handleRecargar } = {}) => {
  if (typeof setGenerandoCodigo === "function") setGenerandoCodigo(true);

  try {
    const { data: student, error: studentError } = await supabase
      .from("estudiantes")
      .select("*")
      .eq("id", matricula.estudiante_id)
      .single();

    if (studentError) {
      console.error("Error obteniendo estudiante:", studentError);
      throw studentError;
    }
    if (!student) {
      throw new Error("Estudiante no encontrado");
    }

    // Generar código y correo (la lógica actual GENERA SIEMPRE ambos)
    const nuevoCodigo = await generarCodigoUnico();
    const nuevoCorreo = await generarCorreoUnico(
      student.primer_nombre,
      student.primer_apellido,
      student.segundo_apellido
    );

    // Fecha actual -> año de ingreso (regla: Nov/Dic -> año siguiente; resto -> año actual)
    const ahora = new Date();
    const mes = ahora.getMonth() + 1;
    const añoActual = ahora.getFullYear();
    const añoSiguiente = añoActual + 1;
    const ano_ingreso_valor = (mes === 11 || mes === 12) ? `Año ${añoSiguiente}` : `Año ${añoActual}`;

    // Actualizar estudiante
    const { data: uploadedStudent, error: updateError } = await supabase
      .from("estudiantes")
      .update({
        codigo_estudiante: nuevoCodigo,
        email_institucional: nuevoCorreo,
        ano_ingreso_institucion: ano_ingreso_valor,
        estudiante_nuevo_antiguo: "Nuevo",
      })
      .eq("id", student.id)
      .select();

    if (updateError) {
      console.error("Error actualizando estudiante:", updateError);
      throw updateError;
    }

    // Actualizar matrícula con el nuevo código
    const { matriculaUpdated, error: errorMatricula } = await updateMatriculaByID(matricula.id, { 
      codigo_estudiante: nuevoCodigo, 
      codigo_adm_aws: matricula.codigo_estudiante.startsWith("ADM")? matricula.codigo_estudiante: null
    });
    if (errorMatricula) {
      console.error("Error actualizando matrícula:", errorMatricula);
      throw errorMatricula;
    }

    // Enviar notificación por correo al familiar
    const resultadoEmail = await enviarNotificacionCodigoAsignado({
      estudiante: student,
      nuevoCodigo,
      nuevoCorreo,
      anoIngreso: ano_ingreso_valor,
      matricula,
    });

    if (resultadoEmail.success) {
      toast.success(`Código ${nuevoCodigo} generado y notificación enviada a ${resultadoEmail.email}`, {
        autoClose: 5000,
        icon: "✅",
      });
    } else {
      toast.warning(`Código ${nuevoCodigo} generado, pero no se pudo enviar notificación: ${resultadoEmail.message}`, { autoClose: 5000 });
    }

    return {
      success: true,
      uploadedStudent,
      codigo: nuevoCodigo,
      correo: nuevoCorreo,
      ano_ingreso: ano_ingreso_valor,
      emailResult: resultadoEmail,
    };
  } catch (err) {
    console.error("Error en generarCodigoYCorreo:", err);
    toast.error(`Error generando código: ${err.message || err}`);
    return { success: false, error: err };
  } finally {
    if (typeof setGenerandoCodigo === "function") setGenerandoCodigo(false);
    if (typeof handleRecargar === "function") handleRecargar();
  }
};

/* ---------------------------
   API AUX: validarEmail (ejemplo)
   --------------------------- */
export const validarEmail = async (email) => {
  try {
    const response = await fetch("https://8ufsw0wsb5.execute-api.us-east-1.amazonaws.com/prod/validateEmail", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error al validar email:", error);
    return null;
  }
};