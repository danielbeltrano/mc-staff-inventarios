// src/core/config/supabase/studentsFetchFunctions.js

import { supabaseStudentClient } from "./supabaseCampusStudentClient";


/**
 * Normaliza texto para búsqueda (elimina acentos y convierte a minúsculas)
 * @param {string} texto - Texto a normalizar
 * @returns {string} - Texto normalizado
 */
const normalizarTexto = (texto) => {
  if (!texto) return "";
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
};


/**
 * Normaliza texto para búsqueda (elimina acentos y convierte a minúsculas)
 * @param {string} texto - Texto a normalizar
 * @returns {string} - Texto normalizado
 */
const sanitizeTerm = (t) => {
  // Evita caracteres que rompen el parser del or(): comas/paréntesis/%
  return String(t || "")
    .replace(/[(),]/g, " ")
    .replace(/%/g, "")
    .trim();
};

/**
 * Construye la consulta de búsqueda por nombre de forma inteligente
 * @param {Object} query - Query de Supabase
 * @param {string} nombre - Nombre a buscar
 * @returns {Object} - Query modificada
 */
const construirBusquedaPorNombre = (query, nombre) => {
  const nombreNormalizado = normalizarTexto(nombre);
  const palabras = nombreNormalizado.split(/\s+/).filter((p) => p.length > 0);

  console.log("🔤 [studentsFetch] Palabras de búsqueda:", palabras);

  if (palabras.length === 0) return query;

  // CASO 1: Una sola palabra - buscar en todos los campos
  if (palabras.length === 1) {
    const palabra = sanitizeTerm(palabras[0]);
    console.log("🔍 [studentsFetch] Búsqueda simple con 1 palabra:", palabra);

    const orFilter = [
      `primer_nombre.ilike.%${palabra}%`,
      `segundo_nombre.ilike.%${palabra}%`,
      `primer_apellido.ilike.%${palabra}%`,
      `segundo_apellido.ilike.%${palabra}%`,
    ].join(",");

    console.log("✅ [studentsFetch] orFilter(1):", orFilter);
    return query.or(orFilter);
  }

  // CASO 2: Dos palabras
  if (palabras.length === 2) {
    const palabra1 = sanitizeTerm(palabras[0]);
    const palabra2 = sanitizeTerm(palabras[1]);
    console.log("🔍 [studentsFetch] Búsqueda con 2 palabras:", palabra1, palabra2);

    const orFilter = [
      `and(primer_nombre.ilike.%${palabra1}%,primer_apellido.ilike.%${palabra2}%)`,
      `and(primer_nombre.ilike.%${palabra1}%,segundo_apellido.ilike.%${palabra2}%)`,
      `and(segundo_nombre.ilike.%${palabra1}%,primer_apellido.ilike.%${palabra2}%)`,
      `and(segundo_nombre.ilike.%${palabra1}%,segundo_apellido.ilike.%${palabra2}%)`,
      `and(primer_nombre.ilike.%${palabra1}%,segundo_nombre.ilike.%${palabra2}%)`,
      `and(primer_apellido.ilike.%${palabra1}%,segundo_apellido.ilike.%${palabra2}%)`,
    ].join(",");

    console.log("✅ [studentsFetch] orFilter(2):", orFilter);
    return query.or(orFilter);
  }

  // CASO 3: Tres palabras
  if (palabras.length === 3) {
    const palabra1 = sanitizeTerm(palabras[0]);
    const palabra2 = sanitizeTerm(palabras[1]);
    const palabra3 = sanitizeTerm(palabras[2]);
    console.log("🔍 [studentsFetch] Búsqueda con 3 palabras:", palabra1, palabra2, palabra3);

    const orFilter = [
      `and(primer_nombre.ilike.%${palabra1}%,segundo_nombre.ilike.%${palabra2}%,primer_apellido.ilike.%${palabra3}%)`,
      `and(primer_nombre.ilike.%${palabra1}%,segundo_nombre.ilike.%${palabra2}%,segundo_apellido.ilike.%${palabra3}%)`,
      `and(primer_nombre.ilike.%${palabra1}%,primer_apellido.ilike.%${palabra2}%,segundo_apellido.ilike.%${palabra3}%)`,
      `and(segundo_nombre.ilike.%${palabra1}%,primer_apellido.ilike.%${palabra2}%,segundo_apellido.ilike.%${palabra3}%)`,
    ].join(",");

    console.log("✅ [studentsFetch] orFilter(3):", orFilter);
    return query.or(orFilter);
  }

  // CASO 4: Cuatro palabras - aquí NO uses query.and("a,b,c")
  // Mejor encadenar ilike (más robusto y sin parser)
  if (palabras.length === 4) {
    const [p1, p2, p3, p4] = palabras.map(sanitizeTerm);
    console.log("🔍 [studentsFetch] Búsqueda con 4 palabras (nombre completo):", [p1, p2, p3, p4]);

    return query
      .ilike("primer_nombre", `%${p1}%`)
      .ilike("segundo_nombre", `%${p2}%`)
      .ilike("primer_apellido", `%${p3}%`)
      .ilike("segundo_apellido", `%${p4}%`);
  }

  // CASO 5: Más de 4 palabras
  const full = sanitizeTerm(nombreNormalizado);
  console.log("🔍 [studentsFetch] Búsqueda con más de 4 palabras - búsqueda completa:", full);

  const orFilter = [
    `primer_nombre.ilike.%${full}%`,
    `segundo_nombre.ilike.%${full}%`,
    `primer_apellido.ilike.%${full}%`,
    `segundo_apellido.ilike.%${full}%`,
  ].join(",");

  console.log("✅ [studentsFetch] orFilter(>4):", orFilter);
  return query.or(orFilter);
};


/**
 * Obtiene estudiantes filtrados por diversos criterios incluyendo búsqueda por nombre.
 * @param {string} codigo - Código del estudiante (opcional).
 * @param {string} nombre - Nombre del estudiante para búsqueda (opcional).
 * @param {string} curso - Curso del estudiante (opcional).
 * @param {string} grado - Grado del estudiante (opcional).
 * @param {string} estadoFormulario - Estado del formulario ("true" o "false") (opcional).
 * @param {string} tipoEstudiante - Tipo de estudiante ("Nuevo" o "Antiguo") (opcional).
 * @returns {Promise<Array>} - Lista de estudiantes.
 */
export const fetchEstudiantesByCursoGrado = async (
  codigo, 
  nombre = null,
  curso = null, 
  grado = null, 
  estadoFormulario = null, 
  tipoEstudiante = null
) => {
  try {
    let query = supabaseStudentClient
      .from('estudiantes')
      .select('*');

    console.log('🔍 [studentsFetch] Parámetros recibidos:', { 
      codigo, 
      nombre,
      curso, 
      grado, 
      estadoFormulario, 
      tipoEstudiante 
    });

    // CASO 1: Búsqueda por código (tiene prioridad máxima)
    if (codigo) {
      query = query.eq('codigo_estudiante', codigo);
      console.log('✅ [studentsFetch] Aplicando filtro por código:', codigo);
    } 
    // CASO 2: Búsqueda por nombre
    else if (nombre && nombre.trim()) {
      console.log('✅ [studentsFetch] Iniciando búsqueda por nombre');
      query = construirBusquedaPorNombre(query, nombre);
    }
    // CASO 3: Búsqueda por filtros (grado, curso, etc.)
    else {
      // Aplicar grado si está presente
      if (grado && grado !== "" && grado !== null) {
        query = query.eq('grado', grado);
        console.log('✅ [studentsFetch] Aplicando filtro grado:', grado);
      }

      // Aplicar curso solo si tiene un valor válido
      if (curso && curso !== "" && curso !== null) {
        query = query.eq('curso', curso);
        console.log('✅ [studentsFetch] Aplicando filtro curso:', curso);
      }

      // Aplicar estado del formulario solo si tiene un valor válido
      if (estadoFormulario && estadoFormulario !== "" && estadoFormulario !== null) {
        const isEnviado = estadoFormulario === "true";
        query = query.eq('formulario_enviado', isEnviado);
        console.log('✅ [studentsFetch] Aplicando filtro formulario enviado:', isEnviado);
      }

      // Aplicar tipo de estudiante solo si tiene un valor válido
      if (tipoEstudiante && tipoEstudiante !== "" && tipoEstudiante !== null) {
        query = query.eq('estudiante_nuevo_antiguo', tipoEstudiante);
        console.log('✅ [studentsFetch] Aplicando filtro tipo estudiante:', tipoEstudiante);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ [studentsFetch] Error en la consulta:', error);
      throw new Error(`Error al obtener estudiantes: ${error.message}`);
    }

    console.log('✅ [studentsFetch] Resultados:', {
      cantidad: data?.length,
      muestra: data?.slice(0, 2)?.map(e => ({
        codigo: e.codigo_estudiante,
        nombre: `${e.primer_nombre} ${e.segundo_nombre || ''} ${e.primer_apellido} ${e.segundo_apellido || ''}`.trim()
      }))
    });

    return data || [];
  } catch (error) {
    console.error('❌ [studentsFetch] Error en fetchEstudiantesByCursoGrado:', error);
    throw error;
  }
};

/**
 * Obtiene datos de padres por sus IDs.
 * @param {Array<string>} fatherIds - Lista de IDs de padres (padres paternos).
 * @param {Array<string>} motherIds - Lista de IDs de madres (padres maternos).
 * @returns {Promise<Object>} - Objeto con datos de padres paternos y maternos.
 */
export const fetchPadres = async (fatherIds, motherIds) => {
  try {
    const { data: fathersData, error: fathersError } = await supabaseStudentClient
      .from('padres')
      .select('*')
      .in('id', fatherIds);

    const { data: mothersData, error: mothersError } = await supabaseStudentClient
      .from('padres')
      .select('*')
      .in('id', motherIds);

    if (fathersError || mothersError) {
      console.error('Error al obtener padres:', fathersError || mothersError);
      throw new Error('Error al obtener padres');
    }

    return { fathersData, mothersData };
  } catch (error) {
    console.error('Error en fetchPadres:', error);
    throw error;
  }
};

export const fetchAcudiente = async (studentId) => {
  try {
    const { data, error } = await someFetchFunction("guardianes")
      .select("*")
      .eq("codigo_estudiante", studentId);

    if (error) {
      throw error;
    }
    return data[0];
  } catch (error) {
    console.error("Error al obtener la información del acudiente:", error);
    throw error;
  }
};

/**
 * Obtiene datos de padres acudientes por sus IDs.
 * @param {Array<string>} fatherIds - Lista de IDs de padres (padres paternos).
 * @param {Array<string>} motherIds - Lista de IDs de madres (padres maternos).
 * @returns {Promise<Object>} - Objeto con datos de padres acudientes paternos y maternos.
 */
export const fetchPadresAcudientes = async (fatherIds, motherIds) => {
  try {
    const { data: fathersData, error: fathersError } = await supabaseStudentClient
      .from('padres')
      .select('es_acudiente')
      .in('id', fatherIds);

    const { data: mothersData, error: mothersError } = await supabaseStudentClient
      .from('padres')
      .select('*')
      .in('id', motherIds);

    if (fathersError || mothersError) {
      console.error('Error al obtener padres acudientes:', fathersError || mothersError);
      throw new Error('Error al obtener padres acudientes');
    }

    return { fathersData, mothersData };
  } catch (error) {
    console.error('Error en fetchPadresAcudientes:', error);
    throw error;
  }
};

/**
 * Obtiene guardianes por sus IDs.
 * @param {Array<string>} guardianIds - Lista de IDs de guardianes.
 * @returns {Promise<Array>} - Lista de guardianes.
 */
export const fetchGuardianes = async (guardianId) => {
  try {
    const { data, error } = await supabaseStudentClient
      .from("guardianes")
      .select("*")
      .eq("id", guardianId);

    if (error) {
      console.error("Error al consultar guardianes:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error al obtener el acudiente:", error);
    throw error;
  }
};

export const fetchGuardianes2 = async (guardianId) => {
  try {
    const id = parseInt(guardianId);
    if (isNaN(id)) {
      throw new Error('ID inválido');
    }

    const { data, error } = await supabaseStudentClient
      .from("guardianes")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error al consultar guardianes:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error al obtener el acudiente:", error);
    throw error;
  }
};

/**
 * Obtiene la lista de cursos únicos.
 * @returns {Promise<Array<string>>} - Lista de cursos únicos.
 */
export const fetchCursos = async () => {
  try {
    const { data, error } = await supabaseStudentClient
      .from('cursos')
      .select('curso')
      .order('curso');

    if (error) {
      console.error('Error al obtener los cursos:', error);
      throw new Error(`Error al obtener los cursos: ${error.message}`);
    }

    const cursosUnicos = [...new Set(data.map((item) => item.curso))];
    return cursosUnicos;
  } catch (error) {
    console.error('Error en fetchCursos:', error);
    throw error;
  }
};

/**
 * Obtiene la lista de grados únicos.
 * @returns {Promise<Array<string>>} - Lista de grados únicos.
 */
export const fetchGrados = async () => {
  try {
    const { data, error } = await supabaseStudentClient
      .from('grados')
      .select('grado')
      .order('id');

    if (error) {
      console.error('Error al obtener los grados:', error);
      throw new Error(`Error al obtener los grados: ${error.message}`);
    }

    const gradosUnicos = [...new Set(data.map((item) => item.grado))];
    return gradosUnicos;
  } catch (error) {
    console.error('Error en fetchGrados:', error);
    throw error;
  }
};

/**
 * Obtiene los estados del formulario enviado.
 * @returns {Promise<Array<string>>} - Lista de estados del formulario.
 */
export const fetchFormEnviado = async () => {
  try {
    const { data, error } = await supabaseStudentClient
      .from('estudiantes')
      .select('formulario_enviado')
      .order('id');

    if (error) {
      console.error('Error al obtener el estado del formulario:', error);
      throw new Error(`Error al obtener el estado del formulario: ${error.message}`);
    }

    const estadoFormulario = [...new Set(data.map((item) => item.formulario_enviado))];
    return estadoFormulario;
  } catch (error) {
    console.error('Error en fetchFormEnviado:', error);
    throw error;
  }
};

/**
 * Descarga un archivo específico del almacenamiento de Supabase.
 * @param {string} codigoEstudiante - Código del estudiante.
 * @param {string} nombreArchivo - Nombre del archivo a descargar.
 */
export const descargarArchivo = async (codigoEstudiante, nombreArchivo) => {
  try {
    const listarBuckets = async () => {
      const { data, error } = await supabaseStudentClient.storage.listBuckets();

      if (error) {
        console.error('Error al listar los buckets:', error);
      }
    };

    await listarBuckets();

    const { data, error } = await supabaseStudentClient.storage
      .from('documentos_estudiantes')
      .getPublicUrl(`${codigoEstudiante}/${nombreArchivo}`);

    if (error) {
      console.error('Error al obtener la URL pública:', error);
      throw error;
    }

    if (!data || !data.publicUrl) {
      console.error('No se pudo obtener la URL pública del archivo.');
      throw new Error('No se pudo obtener la URL pública del archivo.');
    }

    window.open(data.publicUrl, '_blank');
  } catch (error) {
    console.error('Error al descargar el archivo:', error.message);
    alert('Error al descargar el archivo.');
  }
};

/**
 * Obtiene la URL firmada de la foto de perfil de un estudiante.
 * @param {string} codigoEstudiante - El código del estudiante.
 * @returns {Promise<string|null>} - La URL firmada de la foto o null si no se encuentra.
 */
export const getProfilePhotoUrl = async (codigoEstudiante) => {
  try {
    const { data: archivos, error } = await supabaseStudentClient
      .storage
      .from('documentos_estudiantes')
      .list(`${codigoEstudiante}/foto_perfil/`, { limit: 1 });

    if (error) {
      console.error('Error al listar archivos de foto de perfil:', error);
      throw error;
    }

    if (!archivos || archivos.length === 0) {
      return null;
    }

    const archivo = archivos[0];
    const filePath = `${codigoEstudiante}/foto_perfil/${archivo.name}`;

    const { data: signedUrlData, error: signedUrlError } = await supabaseStudentClient
      .storage
      .from('documentos_estudiantes')
      .createSignedUrl(filePath, 60 * 60);

    if (signedUrlError) {
      console.error('Error al crear la URL firmada:', signedUrlError);
      throw signedUrlError;
    }

    return signedUrlData.signedUrl;
  } catch (error) {
    console.error('Error obteniendo la foto de perfil:', error.message);
    return null;
  }
};

/**
 * Aprobar la matrícula de un estudiante.
 * @param {string} codigoEstudiante - El código del estudiante.
 * @param {string} usuario - El nombre del usuario que aprueba la matrícula.
 * @returns {Promise<{ data: any, error: any }>} - Resultado de la operación.
 */
export const approveMatricula = async (codigoEstudiante, usuario) => {
  try {
    const { data, error } = await supabaseStudentClient
      .from('estudiantes')
      .update({
        matricula_aprobada: true,
        fecha_matricula_aprobada: new Date().toISOString(),
        usuario_aprueba_matricula: usuario,
      })
      .eq('codigo_estudiante', codigoEstudiante);

    if (error) {
      console.error('Error al aprobar la matrícula:', error);
    }

    return { data, error };
  } catch (error) {
    console.error('Error en approveMatricula:', error.message);
    return { data: null, error };
  }
};

/**
 * Obtiene el correo electrónico del usuario autenticado.
 * @returns {Promise<string|null>} - Correo del usuario o null si no está autenticado.
 */
export const getCurrentUserEmail = async () => {
  try {
    const { data, error } = await supabaseStudentClient.auth.getUser();
    if (error || !data.user) {
      console.error('Error al obtener el usuario:', error ? error.message : 'Usuario no autenticado');
      return null;
    }

    return data.user.email;
  } catch (error) {
    console.error('Error inesperado al obtener el usuario:', error.message);
    return null;
  }
};

/**
 * Obtiene los datos de un estudiante por su código de estudiante.
 * @param {string} codigoEstudiante - Código del estudiante.
 * @returns {Promise<Object|null>} - Datos del estudiante o null si no existe.
 */
export const fetchStudentByCodigo = async (codigoEstudiante) => {
  try {
    const { data, error } = await supabaseStudentClient
      .from('estudiantes')
      .select('*')
      .eq('codigo_estudiante', codigoEstudiante)
      .single();

    if (error) {
      console.error('Error al obtener datos del estudiante:', error.message);
      throw error;
    }

    return data || null;
  } catch (error) {
    console.error('Error en fetchStudentByCodigo:', error);
    throw error;
  }
};

/**
 * Habilita nuevamente el formulario de matrícula para un estudiante.
 * @param {string} codigoEstudiante - Código del estudiante.
 * @returns {Promise<{ success: boolean }>}
 */
export const toggleFormularioEstado = async (codigoEstudiante) => {
  try {
    const { data: currentState, error: fetchError } = await supabaseStudentClient
      .from('estudiantes')
      .select('formulario_enviado')
      .eq('codigo_estudiante', codigoEstudiante)
      .single();

    if (fetchError) throw fetchError;

    const { error: updateError } = await supabaseStudentClient
      .from('estudiantes')
      .update({ 
        formulario_enviado: false,
      })
      .eq('codigo_estudiante', codigoEstudiante);

    if (updateError) throw updateError;

    return { success: true };
  } catch (error) {
    console.error('Error al cambiar estado del formulario:', error);
    throw error;
  }
};