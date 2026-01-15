import { supabaseStudentClient } from "../../core/config/supabase/supabaseCampusStudentClient";

// cliente: awsApi.js
export async function getAWSInfo({ key=null, filterWord = "", limit = 100, timeoutMs = 10000 }) {
  const safeKey = encodeURIComponent(String(key));
  const AWS_PAGOS_URL = import.meta.env.VITE_APP_AWS_PAGOS_URL;
  // const url = `${AWS_PAGOS_URL}/pagos-por-tercero/${safeKey}?limit=${encodeURIComponent(String(limit))}`;
  const url = `${AWS_PAGOS_URL}/pagos-por-aspirante/${safeKey}?limit=${encodeURIComponent(String(limit))}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: "GET",
      mode: "cors",
      credentials: "omit",
      signal: controller.signal,
    });
    clearTimeout(timer);

    console.log("URL:", url);
    console.log("RESPONSE:", res);
    if (!res.ok) {
      let text;
      try { text = await res.text(); } catch (e) { text = ""; }
      throw new Error(`HTTP ${res.status} ${res.statusText} - ${text}`);
    }

    const data = await res.json();

    console.log(data);
    const allItems = Array.isArray(data) ? data : (data.items || []);

    // 1) Filtrar sólo los pagos "PAGADO"
    const pagosPagados = allItems.filter(item =>
      String(item?.Estado_Pago ?? "").toUpperCase() === "PAGADO"
    );

    // Preprocesar filterWord
    const fw = String(filterWord ?? "").trim().toUpperCase();

    // helper: detectar código de estudiante según varios campos (ajusta según tu JSON real)
    const getStudentCode = (item) => {
      // intenta rutas comunes y alternativas, en orden preferido
      try {
        if (item?.ADM && typeof item.ADM === "object" && item.ADM.Tercero_Interno) {
          return String(item.ADM.Tercero_Interno);
        }
        if (item?.Tercero_Externo) return String(item.Tercero_Externo);
        if (item?.Personalizado1) return String(item.Personalizado1);
        // campos alternativos
        const candidates = [
          "codigo_estudiante", "CodigoEstudiante", "codigoEstudiante",
          "Codigo", "codigo", "CodigoAlumno", "AlumnoID", "IdEstudiante", "ID"
        ];
        for (const k of candidates) {
          if (k in item && item[k] != null && String(item[k]).trim() !== "") {
            return String(item[k]);
          }
        }
        // último recurso: nombre o nota1, o "UNKNOWN"
        if (item?.Nombre) return String(item.Nombre);
        if (item?.["Nota.1"]) return String(item["Nota.1"]);
        return "UNKNOWN";
      } catch (e) {
        return "UNKNOWN";
      }
    };

    // helper: comprobar si un item contiene filterWord (en cualquier campo JSON)
    const matchesFilterWord = (item) => {
      if (!fw) return true; // si no hay filterWord, todo coincide
      // opción segura: buscar en campos clave primero
      const candFields = [
        item?.["Nota.1"],
        item?.Personalizado1,
        item?.Descripcion,
        item?.Concepto,
        item?.Nombre,
        item?.Codigo || item?.codigo_estudiante
      ];
      for (const f of candFields) {
        if (f != null && String(f).toUpperCase().includes(fw)) return true;
      }
      // fallback: buscar en todo el objeto serializado (más pesado)
      try {
        const s = JSON.stringify(item).toUpperCase();
        return s.includes(fw);
      } catch (e) {
        return false;
      }
    };

    // 2) Agrupar por código de estudiante
    const map = new Map();
    for (const item of pagosPagados) {
      if (!matchesFilterWord(item)) continue; // separar por filterWord: sólo los que coinciden
      const code = getStudentCode(item);
      if (!map.has(code)) map.set(code, []);
      map.get(code).push(item);
    }

    // 3) Construir array final
    const items = Array.from(map.entries()).map(([codigo_estudiante, info_pago]) => ({
      codigo_estudiante,
      info_pago
    }));

    // Retornar items (puedes retornar más metadata si quieres)
    return { items };
  } catch (err) {
    clearTimeout(timer);
    if (err.name === "AbortError") {
      console.error("Request aborted por timeout", err);
      throw new Error("Request timeout");
    }
    console.error("Error getAWSInfo:", err);
    throw err;
  }
}

export const deleteCodMatricula=async()=>{
  const {data, error} = await supabaseStudentClient
  .from("matriculas")
  .delete()
  .eq("codigo_estudiante", 4558);
}

export const verMatriculas=async()=>{
  const {data, error} = await supabaseStudentClient
  .from("matriculas")
  .select("*");

  console.log(data);
}

/**
 * Trae las matrículas marcadas como 'pagado' en la tabla 'matriculas'
 * y retorna un array de objetos { codigo_estudiante, codigo_adm_aws }
 */
const getStudentsMatriculasPagadas = async () => {
  const { data, error } = await supabaseStudentClient
    .from("matriculas")
    .select("codigo_estudiante, codigo_adm_aws")
    .eq("estado_pago_sistema", "pagado");

  if (error) {
    console.error("Error al consultar matriculas pagadas:", error);
    // En caso de error devolvemos array vacío (para no bloquear la ejecución),
    // pero podrías lanzar si prefieres que falle la operación.
    return [];
  }
  return Array.isArray(data) ? data : [];
};

// ----------------- Helpers compartidos -----------------
const DEFAULT_LIMIT = 1000;

function normalizeKey(v) {
  if (v == null) return null;
  return String(v).trim().toUpperCase();
}

function getStudentCode(item) {
  try {
    if (item?.ADM && typeof item.ADM === "object" && item.ADM.Tercero_Interno) {
      return String(item.ADM.Tercero_Interno);
    }
    if (item?.Tercero_Externo) return String(item.Tercero_Externo);
    if (item?.Personalizado1) return String(item.Personalizado1);

    const candidates = [
      "codigo_estudiante", "CodigoEstudiante", "codigoEstudiante",
      "Codigo", "codigo", "CodigoAlumno", "AlumnoID", "IdEstudiante", "ID"
    ];
    for (const k of candidates) {
      if (k in item && item[k] != null && String(item[k]).trim() !== "") {
        return String(item[k]);
      }
    }
    if (item?.Nombre) return String(item.Nombre);
    if (item?.["Nota.1"]) return String(item["Nota.1"]);
    return "UNKNOWN";
  } catch (e) {
    return "UNKNOWN";
  }
}

function matchesFilterWord(item, fw) {
  if (!fw) return true;
  const candFields = [
    item?.["Nota.1"],
    item?.Personalizado1,
    item?.Descripcion,
    item?.Concepto,
    item?.Nombre,
    item?.Codigo || item?.codigo_estudiante
  ];
  for (const f of candFields) {
    if (f != null && String(f).toUpperCase().includes(fw)) return true;
  }
  try {
    const s = JSON.stringify(item).toUpperCase();
    return s.includes(fw);
  } catch (e) {
    return false;
  }
}

// Extrae monto desde varios nombres de campo y normaliza a Number
function getAmountFromItem(item) {
  if (item == null) return 0;
  const candidates = [
    "Valor_Unitario", "Valor", "valor", "Monto", "monto", "Valor_Pagado", "ValorPagado",
    "Monto_Pagado", "monto_pagado", "Amount", "amount", "Total", "total",
    "Pago", "pago"
  ];

  for (const key of candidates) {
    if (key in item && typeof item[key] === "number" && !Number.isNaN(item[key])) {
      return Number(item[key]);
    }
  }

  let raw = null;
  for (const key of candidates) {
    if (key in item && item[key] != null) {
      const v = item[key];
      if (typeof v === "string" && v.trim() !== "") {
        raw = v;
        break;
      }
    }
  }

  if (raw == null) {
    if (item?.Pago?.Valor) raw = item.Pago.Valor;
    else if (item?.ADM?.Valor) raw = item.ADM.Valor;
  }
  if (raw == null) return 0;

  let s = String(raw).trim();
  s = s.replace(/[^\d\.,-]/g, "");
  if (s === "") return 0;

  const hasDot = s.indexOf(".") !== -1;
  const hasComma = s.indexOf(",") !== -1;

  try {
    if (hasDot && hasComma) {
      if (s.lastIndexOf(".") > s.lastIndexOf(",")) {
        s = s.replace(/,/g, "");
      } else {
        s = s.replace(/\./g, "");
        s = s.replace(/,/g, ".");
      }
    } else if (hasComma && !hasDot) {
      s = s.replace(/,/g, ".");
    } else {
      s = s.replace(/,/g, "");
    }

    const n = parseFloat(s);
    return Number.isFinite(n) ? n : 0;
  } catch (e) {
    return 0;
  }
}

function getFullNameFromItem(item) {
  if (!item) return null;
  const candidates = [
    "NombreCompleto", "Nombre_Completo", "Nombre", "Nombres", "Nombre_Pagador", "ClienteNombre",
    "FullName", "fullName", "Nota"
  ];
  for (const k of candidates) {
    if (k in item && item[k] != null && String(item[k]).trim() !== "") {
      return String(item[k]).trim();
    }
  }
  const firstParts = [item?.Nombres, item?.Nombre, item?.Nombre1, item?.PrimerNombre].find(Boolean);
  const lastParts = [item?.Apellidos, item?.Apellido, item?.Apellido1, item?.SegundoApellido].find(Boolean);
  if (firstParts && lastParts) return `${String(firstParts).trim()} ${String(lastParts).trim()}`;
  if (item?.ADM) {
    const adm = item.ADM;
    const admName = [adm?.NombreCompleto, adm?.Nombre, adm?.Nombres].find(Boolean);
    if (admName) return String(admName).trim();
  }
  return null;
}
// ---------------------------------------------------------

/**
 * Obtiene todos los pagos por nota (usa paginación con cursor).
 * Excluye estudiantes que ya están en la tabla 'matriculas' (por codigo_estudiante o codigo_adm_aws).
 *
 * @param {Object} opts
 * @param {string} opts.nota - valor del query param `nota` (ej. "MATRICULA 2026")
 * @param {number} [opts.limit=200] - limit por página (el API puede tener un máximo)
 * @param {string} [opts.filterWord=""] - filtro opcional (se aplica después)
 * @param {number} [opts.timeoutMs=10000] - timeout por request
 */
export async function getPagosPorNota({
  nota,
  limit = DEFAULT_LIMIT,
  filterWord = "",
  timeoutMs = 10000
}) {
  if (!nota) throw new Error("Parameter 'nota' is required.");

  // 1) Obtener códigos/ADM ya pagados desde Supabase
  const matriculas = await getStudentsMatriculasPagadas(); // [{ codigo_estudiante, codigo_adm_aws }, ...]
  const existingStudentCodes = new Set();
  const existingAdmCodes = new Set();

  for (const m of matriculas) {
    const c = normalizeKey(m?.codigo_estudiante);
    const adm = normalizeKey(m?.codigo_adm_aws);
    if (c) existingStudentCodes.add(c);
    if (adm) existingAdmCodes.add(adm);
  }

  const baseUrl = "https://olrsgns0eh.execute-api.us-east-1.amazonaws.com/pagos-por-nota";
  const allItems = [];
  let cursor = null;
  const fw = String(filterWord ?? "").trim().toUpperCase();

  // bucle de paginación
  do {
    const params = new URLSearchParams({ nota, limit: String(limit) });
    if (cursor) params.set("cursor", cursor);
    const url = `${baseUrl}?${params.toString()}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, {
        method: "GET",
        mode: "cors",
        credentials: "omit",
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!res.ok) {
        let text;
        try { text = await res.text(); } catch (_) { text = ""; }
        throw new Error(`HTTP ${res.status} ${res.statusText} - ${text}`);
      }

      const data = await res.json();
      const pageItems = Array.isArray(data) ? data : (data.items || []);

      allItems.push(...pageItems);
      cursor = data.nextCursor || null;
    } catch (err) {
      clearTimeout(timer);
      if (err.name === "AbortError") {
        console.error("Request aborted por timeout", err);
        throw new Error("Request timeout");
      }
      console.error("Error getPagosPorNota:", err);
      throw err;
    }
  } while (cursor);

  // Filtrar sólo PAGADO
  const pagosPagados = allItems.filter(item =>
    String(item?.Estado_Pago ?? "").toUpperCase() === "PAGADO"
  );

  // Agrupar por código de estudiante (sin aún aplicar exclusiones)
  const map = new Map();
  for (const item of pagosPagados) {
    if (!matchesFilterWord(item, fw)) continue;
    const code = getStudentCode(item) ?? "UNKNOWN";
    if (!map.has(code)) map.set(code, []);
    map.get(code).push(item);
  }

  // Construir array final incluyendo monto_total y nombre_completo,
  // pero EXCLUYENDO los códigos que ya existen en Supabase (existingStudentCodes / existingAdmCodes)
  const items = [];
  for (const [codigo_estudiante, info_pago] of Array.from(map.entries())) {
    const codigoNorm = normalizeKey(codigo_estudiante);

    // Si el codigo_estudiante ya existe en Supabase -> excluir
    if (codigoNorm && existingStudentCodes.has(codigoNorm)) {
      continue;
    }

    // Verificar si ALGUNO de los pagos tiene un ADM que exista en existingAdmCodes
    let hasExistingAdm = false;
    for (const it of info_pago) {
      // chequeamos campos comunes donde podría estar el ADM
      const admValCandidates = [
        it?.ADM?.Tercero_Interno,
        it?.ADM?.TerceroExterno,
        it?.ADM?.CodigoAdm,
        it?.codigo_adm,
        it?.codigo_adm_aws,
        it?.Personalizado1,
        it?.Tercero_Externo
      ];
      for (const cand of admValCandidates) {
        const norm = normalizeKey(cand);
        if (norm && existingAdmCodes.has(norm)) {
          hasExistingAdm = true;
          break;
        }
      }
      if (hasExistingAdm) break;
    }
    if (hasExistingAdm) continue; // excluir si alguno coincide con ADM ya registrado

    // Si llegó aquí, no está en las listas de exclusión -> construir objeto final
    const monto_total_raw = info_pago.reduce((acc, it) => acc + getAmountFromItem(it), 0);
    const monto_total = Math.round((monto_total_raw + Number.EPSILON) * 100) / 100;

    let nombre_completo = null;
    for (const it of info_pago) {
      const n = getFullNameFromItem(it);
      if (n) {
        nombre_completo = n;
        break;
      }
    }
    if (!nombre_completo) nombre_completo = codigo_estudiante || "NOMBRE_DESCONOCIDO";

    items.push({
      codigo_estudiante,
      nombre_completo,
      monto_total,
      info_pago
    });
  }

  return { items, rawCount: allItems.length, excludedCounts: {
    byStudentCode: Array.from(existingStudentCodes).length,
    byAdmCode: Array.from(existingAdmCodes).length
  } };
}