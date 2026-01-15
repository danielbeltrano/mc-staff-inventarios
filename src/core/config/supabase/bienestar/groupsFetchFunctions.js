import { supabaseStudentClient } from "../supabaseCampusStudentClient";

/******************************
 ******** CREATEGROUPS *********
 *******************************/

// Obtener todos los estudiantes
export const fetchEstudiantes = async () => {
  try {
    let allStudents = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabaseStudentClient
        .from("estudiantes")
        .select(
          "codigo_estudiante, primer_nombre, primer_apellido, grado, curso"
        )
        .order("grado", { ascending: true })
        .order("curso", { ascending: true })
        .order("primer_apellido", { ascending: true })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (error) throw error;

      if (data.length < pageSize) {
        hasMore = false;
      }

      allStudents = [...allStudents, ...data];
      page++;
    }

    return allStudents;
  } catch (error) {
    console.error("Error al obtener estudiantes:", error);
    throw error;
  }
};

/**
 * Crea un nuevo grupo de bienestar
 * @param {Object} grupoData - Datos del grupo a crear
 * @param {string} profesionalId - ID del profesional que crea el grupo
 * @returns {Promise<Object>} Datos del grupo creado
 */
export const createGrupoBienestar = async (
  grupoData,
  personalId,
  currentProfessionalRole
) => {
  try {
    // Extraer información de grados mixtos si es aplicable
    let grados_mixtos = [];
    if (grupoData.tipo === "mixto" && grupoData.grados_mixtos) {
      grados_mixtos = grupoData.grados_mixtos;
      delete grupoData.grados_mixtos; // Eliminamos para no duplicar en el objeto principal
    }

    console.log("grupoData from createGrupoBienestar", grupoData);
    console.log("personalId from createGrupoBienestar", personalId);
    console.log("currentProfessionalRole from createGrupoBienestar", currentProfessionalRole);
    // Asegurar que personal_id esté incluido en los datos
    const grupoCompleto = {
      ...grupoData,
      profesional_id: currentProfessionalRole,
      personal_mc_id: personalId,
      observaciones_grupo: [], // Inicializamos array vacío
      grados_mixtos: grados_mixtos, // Añadimos los grados seleccionados (para grupos mixtos)
    };

    const { data, error } = await supabaseStudentClient
      .from("grupos_bienestar")
      .insert([grupoCompleto])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error al crear grupo de bienestar:", error);
    throw error;
  }
};

/**
 * Añadir un estudiante a un grupo
 * @param {Object} params - Parámetros de la función
 * @param {string} params.grupo_id - ID del grupo
 * @param {string} params.estudiante_id - ID del estudiante
 * @returns {Promise<Object>} Datos de la relación creada
 */
export const addEstudianteToGrupo = async ({ grupo_id, estudiante_id }) => {
  try {
    const { data, error } = await supabaseStudentClient
      .from("grupo_estudiantes") // Nombre actualizado
      .insert([
        {
          grupo_id,
          estudiante_id,
          observaciones: [], // Inicializar array vacío de observaciones
        },
      ]);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error al añadir estudiante al grupo:", error);
    throw error;
  }
};

/**
 * Eliminar un estudiante de un grupo
 * @param {Object} params - Parámetros de la función
 * @param {string} params.grupo_id - ID del grupo
 * @param {string} params.estudiante_id - ID del estudiante
 * @returns {Promise<Object>} Respuesta de la operación
 */
export const removeEstudianteFromGrupo = async ({
  grupo_id,
  estudiante_id,
}) => {
  try {
    const { data, error } = await supabaseStudentClient
      .from("grupo_estudiantes") // Nombre actualizado
      .delete()
      .match({ grupo_id, estudiante_id });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error al eliminar estudiante del grupo:", error);
    throw error;
  }
};

/**
 * Obtener todos los grupos con información adicional
 * @returns {Promise<Array>} Lista de grupos
 */
export const fetchGruposBienestar = async () => {
  try {
    const { data, error } = await supabaseStudentClient
      .from("grupos_info")
      .select("*")
      .order("fecha_creacion", { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error al obtener grupos de bienestar:", error);
    throw error;
  }
};

// Añadir a groupsFetchFunctions.js

/**
 * Obtener grupos creados por un usuario específico
 * @param {string} personalMcId - UUID del personal_mc que creó los grupos
 * @returns {Promise<Array>} Lista de grupos creados por el usuario
 */
export const fetchGruposByCreator = async (personalMcId) => {
  try {
    console.log("📥 Obteniendo grupos creados por:", personalMcId);

    const { data, error } = await supabaseStudentClient
      .from("grupos_info")
      .select("*")
      .eq("personal_mc_id", personalMcId)
      .order("fecha_creacion", { ascending: false });

    if (error) {
      console.error("❌ Error al obtener grupos del creador:", error);
      throw error;
    }

    console.log(`✅ Grupos encontrados: ${data?.length || 0}`);
    return data || [];
  } catch (error) {
    console.error("Error al obtener grupos del creador:", error);
    throw error;
  }
};

/**
 * Obtener grupos compartidos con un usuario
 * @param {string} personalMcId - UUID del personal_mc con quien se comparten los grupos
 * @returns {Promise<Array>} Lista de grupos compartidos con el usuario
 */
export const fetchGruposCompartidos = async (personalMcId) => {
  try {
    console.log("📥 Buscando grupos compartidos con:", personalMcId);

    // Paso 1: Obtener las colaboraciones de tipo 'grupo' para el usuario
    const { data: colaboraciones, error: errorColaboraciones } =
      await supabaseStudentClient
        .from("colaboradores_bienestar")
        .select("entidad_id")
        .eq("entidad_tipo", "grupo")
        .eq("personal_mc_id", personalMcId)
        .eq("estado", "activo");

    if (errorColaboraciones) {
      console.error("❌ Error al obtener colaboraciones:", errorColaboraciones);
      throw errorColaboraciones;
    }

    // Si no hay colaboraciones, devolver array vacío
    if (!colaboraciones || colaboraciones.length === 0) {
      console.log("ℹ️ No hay grupos compartidos con este usuario");
      return [];
    }

    // Paso 2: Extraer los IDs de los grupos
    const grupoIds = colaboraciones.map((c) => c.entidad_id);
    console.log(`🔍 IDs de grupos compartidos: [${grupoIds.join(", ")}]`);

    // Paso 3: Obtener la información completa de esos grupos
    const { data: grupos, error: errorGrupos } = await supabaseStudentClient
      .from("grupos_info")
      .select("*")
      .in("id", grupoIds)
      .order("fecha_creacion", { ascending: false });

    if (errorGrupos) {
      console.error(
        "❌ Error al obtener detalles de grupos compartidos:",
        errorGrupos
      );
      throw errorGrupos;
    }

    console.log(`✅ Grupos compartidos encontrados: ${grupos?.length || 0}`);
    return grupos || [];
  } catch (error) {
    console.error("Error al obtener grupos compartidos:", error);
    throw error;
  }
};

/**
 * Obtener un grupo específico por su ID
 * @param {string} id - ID del grupo
 * @returns {Promise<Object>} Datos del grupo
 */
export const fetchGrupoById = async (id) => {
  try {
    const { data, error } = await supabaseStudentClient
      .from("grupos_bienestar")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error al obtener grupo por ID:", error);
    throw error;
  }
};

/**
 * Actualizar un grupo existente
 * @param {string} id - ID del grupo
 * @param {Object} grupoData - Datos actualizados del grupo
 * @returns {Promise<Object>} Datos del grupo actualizado
 */
export const updateGrupoBienestar = async (id, grupoData) => {
  try {
    // Si estamos actualizando un grupo mixto, manejamos grados_mixtos
    if (grupoData.tipo === "mixto" && grupoData.grados_mixtos) {
      // No eliminar grados_mixtos del objeto aquí, ya que queremos actualizar el campo
    } else if (grupoData.tipo !== "mixto") {
      // Si no es un grupo mixto, asegurarnos de vaciar el array de grados mixtos
      grupoData.grados_mixtos = [];
    }

    const { data, error } = await supabaseStudentClient
      .from("grupos_bienestar")
      .update(grupoData)
      .eq("id", id)
      .select();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error al actualizar grupo:", error);
    throw error;
  }
};

/**
 * Sincronizar estudiantes de un grupo (para edición)
 * @param {string} grupoId - ID del grupo
 * @param {Array} nuevosEstudiantes - Lista de IDs de estudiantes actualizados
 * @returns {Promise<boolean>} Resultado de la operación
 */
export const sincronizarEstudiantesGrupo = async (
  grupoId,
  nuevosEstudiantes
) => {
  try {
    // 1. Obtener estudiantes actuales del grupo
    const { data: actuales, error: errorActuales } = await supabaseStudentClient
      .from("grupo_estudiantes")
      .select("estudiante_id")
      .eq("grupo_id", grupoId);

    if (errorActuales) throw errorActuales;

    // 2. Determinar estudiantes a eliminar y a añadir
    const idsActuales = actuales.map((a) => a.estudiante_id);
    const idsNuevos = nuevosEstudiantes.map((e) => e.codigo_estudiante);

    const idsEliminar = idsActuales.filter((id) => !idsNuevos.includes(id));
    const idsAgregar = idsNuevos.filter((id) => !idsActuales.includes(id));

    // 3. Eliminar estudiantes que ya no están en el grupo
    if (idsEliminar.length > 0) {
      const { error: errorEliminar } = await supabaseStudentClient
        .from("grupo_estudiantes")
        .delete()
        .eq("grupo_id", grupoId)
        .in("estudiante_id", idsEliminar);

      if (errorEliminar) throw errorEliminar;
    }

    // 4. Agregar nuevos estudiantes al grupo
    if (idsAgregar.length > 0) {
      const nuevosRegistros = idsAgregar.map((id) => ({
        grupo_id: grupoId,
        estudiante_id: id,
        observaciones: [],
      }));

      const { error: errorAgregar } = await supabaseStudentClient
        .from("grupo_estudiantes")
        .insert(nuevosRegistros);

      if (errorAgregar) throw errorAgregar;
    }

    return true;
  } catch (error) {
    console.error("Error al sincronizar estudiantes del grupo:", error);
    throw error;
  }
};

/********************* */
//COLABORADORES

// Implementa esta función en tu archivo de fetching (../../../../../core/config/supabase/bienestarFetchFunctions)
// Asegúrate de que la función searchAvailableProfessionals devuelva la estructura correcta
// Debe incluir tanto el id del profesional como el personalMcId

/**
 * Busca profesionales disponibles en base a un término de búsqueda
 * @param {string} searchTerm - Término para buscar profesionales
 * @returns {Promise<Array>} Lista de profesionales encontrados
 */
export const searchAvailableProfessionals = async (searchTerm) => {
  try {
    console.log("🔍 Buscando profesionales con término:", searchTerm);

    // Consulta a la base de datos
    const { data, error } = await supabaseStudentClient
      .from("profesionales")
      .select(
        `
          id,
          profesion,
          especialidad,
          personal_mc_id,
          personal_mc(uuid, nombre, apellido)
        `
      )
      .or(
        `profesion.ilike.%${searchTerm}%,especialidad.ilike.%${searchTerm}%,personal_mc.nombre.ilike.%${searchTerm}%,personal_mc.apellido.ilike.%${searchTerm}%`
      )
      .eq("estado", "activo");

    if (error) {
      console.error("❌ Error en la consulta de profesionales:", error);
      throw error;
    }

    console.log("✅ Datos crudos de profesionales:", data);

    // Verificar que cada profesional tenga personal_mc_id
    const missingMcId = data.filter((prof) => !prof.personal_mc_id);
    if (missingMcId.length > 0) {
      console.warn("⚠️ Profesionales sin personal_mc_id:", missingMcId);
    }

    // Transformar los datos para que tengan la estructura esperada
    const transformedData = data.map((prof) => {
      // Verificar que existan los datos necesarios
      if (!prof.personal_mc_id) {
        console.warn(`⚠️ Profesional ID ${prof.id} no tiene personal_mc_id`);
      }

      if (!prof.personal_mc) {
        console.warn(
          `⚠️ Profesional ID ${prof.id} no tiene datos de personal_mc`
        );
      }

      return {
        id: prof.id, // Este es para profesional_id (int4)
        personalMcId: prof.personal_mc_id, // Este es para personal_mc_id (uuid)
        nombre: prof.personal_mc
          ? `${prof.personal_mc.nombre} ${prof.personal_mc.apellido}`
          : "Sin nombre",
        especialidad: prof.especialidad || "Sin especialidad",
        categoria: {
          nombre: prof.profesion || "No especificada",
        },
        // Guardar datos raw para debugging
        _raw: {
          personal_mc: prof.personal_mc,
          personal_mc_id: prof.personal_mc_id,
        },
      };
    });

    console.log("✅ Datos transformados de profesionales:", transformedData);

    // Filtrar profesionales sin personal_mc_id
    const validProfessionals = transformedData.filter(
      (prof) => !!prof.personalMcId
    );

    if (validProfessionals.length < transformedData.length) {
      console.warn("⚠️ Se filtraron profesionales sin personal_mc_id");
    }

    return validProfessionals;
  } catch (error) {
    console.error("❌ Error buscando profesionales:", error);
    throw error;
  }
};

/**
 * Obtiene la lista de estudiantes de un grupo específico
 * @param {number} grupoId - ID del grupo
 * @returns {Promise<Array>} - Lista de estudiantes
 */
export const fetchEstudiantesGrupo = async (grupoId) => {
  try {
    const { data, error } = await supabaseStudentClient
      .from("grupo_estudiantes")
      .select(
        `
          id,
          estudiante_id,
          observaciones,
          fecha_adicion,
          estudiantes:estudiante_id(
            codigo_estudiante,
            primer_nombre,
            segundo_nombre,
            primer_apellido,
            segundo_apellido,
            grado,
            curso
          )
        `
      )
      .eq("grupo_id", grupoId);

    if (error) throw error;

    // Aplanar la estructura para facilitar su uso
    return data.map((item) => ({
      grupo_estudiante_id: item.id,
      codigo_estudiante: item.estudiante_id,
      observaciones: item.observaciones,
      fecha_adicion: item.fecha_adicion,
      ...item.estudiantes,
    }));
  } catch (error) {
    console.error("Error fetching estudiantes del grupo:", error);
    throw error;
  }
};

/**
 * Obtiene el ID de la relación grupo-estudiante
 * @param {number} grupoId - ID del grupo
 * @param {string} estudianteId - ID del estudiante
 * @returns {Promise<number>} - ID de la relación grupo-estudiante
 */
export const getGrupoEstudianteId = async (grupoId, estudianteId) => {
  try {
    const { data, error } = await supabaseStudentClient
      .from("grupo_estudiantes")
      .select("id")
      .eq("grupo_id", grupoId)
      .eq("estudiante_id", estudianteId)
      .single();

    if (error) throw error;
    return data.id;
  } catch (error) {
    console.error("Error obteniendo ID de grupo-estudiante:", error);
    throw error;
  }
};

/**
 * Obtiene las notas generales de un grupo
 * @param {number} grupoId - ID del grupo
 * @returns {Promise<Array>} - Lista de notas del grupo
 */
export const fetchGrupoNotas = async (grupoId) => {
  try {
    const { data, error } = await supabaseStudentClient
      .from("grupos_bienestar")
      .select("observaciones_grupo")
      .eq("id", grupoId)
      .single();

    if (error) throw error;

    // Retornamos el array de notas (observaciones)
    return data.observaciones_grupo || [];
  } catch (error) {
    console.error("Error fetching notas del grupo:", error);
    throw error;
  }
};

// /**
//  * Añade una nueva nota general al grupo
//  * @param {Object} notaData - Datos de la nota {grupo_id, texto, visible_colaboradores, nota_urgente, nombre_profesional}
//  * @returns {Promise<Array>} - Las notas actualizadas
//  */
// export const addGrupoNota = async (notaData) => {
//   try {
//     // Obtener el usuario actual (igual que en addEstudianteNota)
//     const { data: authData } = await supabaseStudentClient.auth.getUser();
//     const userId = notaData.profesional_id;
//     console.log("notaData from addGrupoNota", notaData);
//     // Primero obtenemos las notas actuales del grupo
//     const { data: grupoData, error: fetchError } = await supabaseStudentClient
//       .from("grupos_bienestar")
//       .select("observaciones_grupo")
//       .eq("id", notaData.grupo_id)
//       .single();

//     console.log("grupoData from addGrupoNota", grupoData);
//     if (fetchError) throw fetchError;

//     // Preparar el array de notas
//     let notas = Array.isArray(grupoData.observaciones_grupo)
//       ? [...grupoData.observaciones_grupo]
//       : [];

//     // Crear la nueva nota (siguiendo el patrón de addEstudianteNota)
//     const nuevaNota = {
//       id: Date.now(), // Usamos un timestamp como ID único
//       texto: notaData.texto,
//       profesional_id: userId,
//       nombre_profesional: notaData.nombre_profesional || "Profesional", // Usar el valor recibido o un fallback
//       visible_colaboradores: notaData.visible_colaboradores || false,
//       nota_urgente: notaData.nota_urgente || false, // Mantener nota_urgente como en addEstudianteNota
//       fecha_creacion: new Date().toISOString(),
//       fecha_actualizacion: new Date().toISOString(),
//       nota_anulada: false,
//     };

//     console.log("Antes de enviar nuevaNota from addGrupoNota", nuevaNota);

//     // Añadir la nota al inicio del array
//     notas.unshift(nuevaNota);

//     console.log("Ates de enviar notas from addGrupoNota", notas);
//     // Actualizar las notas en la tabla
//     const { data, error } = await supabaseStudentClient
//       .from("grupos_bienestar")
//       .update({ observaciones_grupo: notas })
//       .eq("id", notaData.grupo_id)
//       .select("observaciones_grupo");

//     console.log(
//       "Actualizar las notas en la tabla data from addGrupoNota",
//       data
//     );
//     if (error) throw error;

//     return data ? data.observaciones_grupo : notas;
//   } catch (error) {
//     console.error("Error adding nota de grupo:", error);
//     throw error;
//   }
// };

export const addGrupoNota = async (notaData) => {
  try {
    if (!notaData?.grupo_id || !notaData?.texto) {
      throw new Error("Datos de nota incompletos");
    }

    // Usar el ID profesional proporcionado o obtener el usuario actual
    let profesionalId = notaData.profesional_id;

    if (!profesionalId) {
      // Fallback: Obtener el usuario actual si no se proporciona ID
      const { data: authData, error: authError } =
        await supabaseStudentClient.auth.getUser();
      if (authError) throw authError;
      profesionalId = authData.user.id;
    }

    // Usar el nombre proporcionado o un valor por defecto
    const nombreProfesional = notaData.nombre_profesional || "Profesional";

    // Obtener notas actuales
    const { data: grupoData, error: fetchError } = await supabaseStudentClient
      .from("grupos_bienestar")
      .select("observaciones_grupo")
      .eq("id", notaData.grupo_id)
      .single();

    if (fetchError) throw fetchError;

    // Preparar el array de notas con manejo de casos nulos
    let notasActuales = grupoData.observaciones_grupo;
    let notas = [];

    if (Array.isArray(notasActuales)) {
      notas = [...notasActuales];
    } else if (notasActuales === null || notasActuales === undefined) {
      // Inicializar como array vacío si es null o undefined
      notas = [];
    } else {
      // Intenta convertir a array si es posible, o usa un array vacío
      try {
        notas = JSON.parse(JSON.stringify(notasActuales));
        if (!Array.isArray(notas)) {
          console.warn(
            "observaciones_grupo no es un array válido después de la conversión"
          );
          notas = [];
        }
      } catch (e) {
        console.error("Error al convertir observaciones_grupo a array:", e);
        notas = [];
      }
    }

    // Crear la nueva nota con UUID para id
    const nuevaNota = {
      id: Date.now().toString(), // Podría usar una biblioteca UUID para mayor consistencia
      texto: notaData.texto,
      profesional_id: profesionalId,
      nombre_profesional: nombreProfesional,
      visible_colaboradores: notaData.visible_colaboradores || false,
      visible_administrativos: notaData.visible_administrativos || false,
      visible_lideres_nivel: notaData.visible_lideres_nivel || false,
      visible_director_grupo: notaData.visible_director_grupo || false,
      visible_padres: notaData.visible_padres || false,
      visible_estudiante: notaData.visible_estudiante || false,
      nota_urgente: notaData.nota_urgente || false,
      fecha_creacion: new Date().toISOString(),
      fecha_actualizacion: new Date().toISOString(),
    };

    // Añadir la nota al inicio del array
    notas.unshift(nuevaNota);

    //console.log("Actualizando observaciones_grupo con:", JSON.stringify(notas));

    const { data: updateData, error: updateError } = await supabaseStudentClient
      .from("grupos_bienestar")
      .update({ observaciones_grupo: notas })
      .eq("id", notaData.grupo_id)
      .select("observaciones_grupo");

    if (updateError) throw updateError;

    return updateData.observaciones_grupo;
  } catch (error) {
    console.error("Error adding nota de grupo:", error);
    throw error;
  }
};

/**
 * Obtiene las notas específicas de un estudiante en un grupo
 * @param {number} grupoEstudianteId - ID de la relación grupo-estudiante
 * @returns {Promise<Array>} - Lista de notas del estudiante
 */
export const fetchEstudianteNotas = async (grupoEstudianteId) => {
  try {
    const { data, error } = await supabaseStudentClient
      .from("grupo_estudiantes")
      .select("observaciones")
      .eq("id", grupoEstudianteId)
      .single();

    if (error) throw error;

    // Retornar el array de notas (observaciones)
    return data.observaciones || [];
  } catch (error) {
    console.error("Error fetching notas del estudiante:", error);
    throw error;
  }
};

// Corrección para la función addEstudianteNota en groupsFetchFunctions.js

/**
 * Añade una nueva nota para un estudiante específico
 * @param {Object} notaData - {grupo_estudiante_id, texto, visible_colaboradores, visible_padres, nombre_profesional}
 * @returns {Promise<Array>} - Las notas actualizadas
 */
export const addEstudianteNota = async (notaData) => {
  try {
    // Obtener el usuario actual
    const { data: authData } = await supabaseStudentClient.auth.getUser();
    const userId = authData.user.id;

    // Primero obtenemos las notas actuales
    const { data: estudianteData, error: fetchError } =
      await supabaseStudentClient
        .from("grupo_estudiantes")
        .select("observaciones")
        .eq("id", notaData.grupo_estudiante_id)
        .single();

    if (fetchError) throw fetchError;

    // Preparar el array de notas
    let notas = Array.isArray(estudianteData.observaciones)
      ? [...estudianteData.observaciones]
      : [];

    // Crear la nueva nota - usando notaData.nombre_profesional en lugar de nombreProfesional
    const nuevaNota = {
      id: Date.now(), // Usamos un timestamp como ID único
      texto: notaData.texto,
      profesional_id: userId,
      nombre_profesional: notaData.nombre_profesional || "Profesional", // Usar el valor recibido o un fallback
      visible_colaboradores: notaData.visible_colaboradores || false,
      visible_padres: notaData.visible_padres || false,
      visible_administrativos: notaData.visible_administrativos || false,
      visible_lideres_nivel: notaData.visible_lideres_nivel || false,
      visible_director_grupo: notaData.visible_director_grupo || false,
      visible_estudiante: notaData.visible_estudiante || false,
      nota_urgente: notaData.nota_urgente || false,
      fecha_creacion: new Date().toISOString(),
      fecha_actualizacion: new Date().toISOString(),
    };

    // Añadir la nota al inicio del array
    notas.unshift(nuevaNota);

    // Actualizar las notas en la tabla
    const { data, error } = await supabaseStudentClient
      .from("grupo_estudiantes")
      .update({ observaciones: notas })
      .eq("id", notaData.grupo_estudiante_id)
      .select("observaciones");

    if (error) throw error;

    return data ? data.observaciones : notas;
  } catch (error) {
    console.error("Error adding nota de estudiante:", error);
    throw error;
  }
};

/**
 * Actualiza una nota de grupo existente
 * @param {number} grupoId - ID del grupo
 * @param {number} notaId - ID de la nota
 * @param {Object} notaData - Datos actualizados {texto, visible_colaboradores}
 * @returns {Promise<Array>} - Las notas actualizadas
 */
export const updateGrupoNota = async (grupoId, notaId, notaData) => {
  try {
    // Primero obtenemos las notas actuales
    const { data: grupoData, error: fetchError } = await supabaseStudentClient
      .from("grupos_bienestar")
      .select("observaciones_grupo")
      .eq("id", grupoId)
      .single();

    if (fetchError) throw fetchError;

    // Verificar que las notas existan
    if (!Array.isArray(grupoData.observaciones_grupo)) {
      throw new Error("No hay notas disponibles para actualizar");
    }

    // Encontrar y actualizar la nota específica
    const notasActualizadas = grupoData.observaciones_grupo.map((nota) => {
      if (nota.id === notaId) {
        return {
          ...nota,
          texto: notaData.texto !== undefined ? notaData.texto : nota.texto,
          visible_colaboradores:
            notaData.visible_colaboradores !== undefined
              ? notaData.visible_colaboradores
              : nota.visible_colaboradores,
          visible_padres:
            notaData.visible_padres !== undefined
              ? notaData.visible_padres
              : nota.visible_padres,
          visible_administrativos:
            notaData.visible_administrativos !== undefined
              ? notaData.visible_administrativos
              : nota.visible_administrativos,
          visible_lideres_nivel:
            notaData.visible_lideres_nivel !== undefined
              ? notaData.visible_lideres_nivel
              : nota.visible_lideres_nivel,
          visible_director_grupo:
            notaData.visible_director_grupo !== undefined
              ? notaData.visible_director_grupo
              : nota.visible_director_grupo,
          visible_estudiante:
            notaData.visible_estudiante !== undefined
              ? notaData.visible_estudiante
              : nota.visible_estudiante,
          fecha_actualizacion: new Date().toISOString(),
          nota_anulada:
            notaData.nota_anulada !== undefined
              ? notaData.nota_anulada
              : nota.nota_anulada,
          justificacion_anulacion:
            notaData.justificacion_anulacion !== undefined
              ? notaData.justificacion_anulacion
              : nota.justificacion_anulacion,
          nota_urgente:
            notaData.nota_urgente !== undefined
              ? notaData.nota_urgente
              : nota.nota_urgente,
        };
      }
      return nota;
    });

    // Actualizar las notas en la tabla
    const { data, error } = await supabaseStudentClient
      .from("grupos_bienestar")
      .update({ observaciones_grupo: notasActualizadas })
      .eq("id", grupoId)
      .select("observaciones_grupo");

    if (error) throw error;

    return data ? data.observaciones_grupo : notasActualizadas;
  } catch (error) {
    console.error("Error updating nota de grupo:", error);
    throw error;
  }
};

/**
 * Actualiza una nota de estudiante existente
 * @param {number} grupoEstudianteId - ID de la relación grupo-estudiante
 * @param {number} notaId - ID de la nota
 * @param {Object} notaData - Datos actualizados {texto, visible_colaboradores, visible_padres}
 * @returns {Promise<Array>} - Las notas actualizadas
 */
export const updateEstudianteNota = async (
  grupoEstudianteId,
  notaId,
  notaData
) => {
  try {
    // Primero obtenemos las notas actuales
    const { data: estudianteData, error: fetchError } =
      await supabaseStudentClient
        .from("grupo_estudiantes")
        .select("observaciones")
        .eq("id", grupoEstudianteId)
        .single();

    if (fetchError) throw fetchError;

    // Verificar que las notas existan
    if (!Array.isArray(estudianteData.observaciones)) {
      throw new Error("No hay notas disponibles para actualizar");
    }

    // Encontrar y actualizar la nota específica
    const notasActualizadas = estudianteData.observaciones.map((nota) => {
      if (nota.id === notaId) {
        return {
          ...nota,
          texto: notaData.texto !== undefined ? notaData.texto : nota.texto,
          visible_colaboradores:
            notaData.visible_colaboradores !== undefined
              ? notaData.visible_colaboradores
              : nota.visible_colaboradores,
          visible_padres:
            notaData.visible_padres !== undefined
              ? notaData.visible_padres
              : nota.visible_padres,
          visible_administrativos:
            notaData.visible_administrativos !== undefined
              ? notaData.visible_administrativos
              : nota.visible_administrativos,
          visible_lideres_nivel:
            notaData.visible_lideres_nivel !== undefined
              ? notaData.visible_lideres_nivel
              : nota.visible_lideres_nivel,
              visible_director_grupo:
            notaData.visible_director_grupo !== undefined
              ? notaData.visible_director_grupo
              : nota.visible_director_grupo,
              visible_estudiante:
            notaData.visible_estudiante !== undefined
              ? notaData.visible_estudiante
              : nota.visible_estudiante,
          fecha_actualizacion: new Date().toISOString(),
          nota_anulada:
            notaData.nota_anulada !== undefined
              ? notaData.nota_anulada
              : nota.nota_anulada,
          justificacion_anulacion:
            notaData.justificacion_anulacion !== undefined
              ? notaData.justificacion_anulacion
              : nota.justificacion_anulacion,
          nota_urgente:
            notaData.nota_urgente !== undefined
              ? notaData.nota_urgente
              : nota.nota_urgente,
        };
      }
      return nota;
    });

    // Actualizar las notas en la tabla
    const { data, error } = await supabaseStudentClient
      .from("grupo_estudiantes")
      .update({ observaciones: notasActualizadas })
      .eq("id", grupoEstudianteId)
      .select("observaciones");

    if (error) throw error;

    return data ? data.observaciones : notasActualizadas;
  } catch (error) {
    console.error("Error updating nota de estudiante:", error);
    throw error;
  }
};

/**
 * Elimina una nota de grupo
 * @param {number} grupoId - ID del grupo
 * @param {number} notaId - ID de la nota
 * @returns {Promise<Array>} - Las notas actualizadas
 */
export const deleteGrupoNota = async (grupoId, notaId) => {
  try {
    // Primero obtenemos las notas actuales
    const { data: grupoData, error: fetchError } = await supabaseStudentClient
      .from("grupos_bienestar")
      .select("observaciones_grupo")
      .eq("id", grupoId)
      .single();

    if (fetchError) throw fetchError;

    // Verificar que las notas existan
    if (!Array.isArray(grupoData.observaciones_grupo)) {
      throw new Error("No hay notas disponibles para eliminar");
    }

    // Filtrar la nota a eliminar
    const notasActualizadas = grupoData.observaciones_grupo.filter(
      (nota) => nota.id !== notaId
    );

    // Actualizar las notas en la tabla
    const { data, error } = await supabaseStudentClient
      .from("grupos_bienestar")
      .update({ observaciones_grupo: notasActualizadas })
      .eq("id", grupoId)
      .select("observaciones_grupo");

    if (error) throw error;

    return data ? data.observaciones_grupo : notasActualizadas;
  } catch (error) {
    console.error("Error deleting nota de grupo:", error);
    throw error;
  }
};

/**
 * Elimina una nota de estudiante
 * @param {number} grupoEstudianteId - ID de la relación grupo-estudiante
 * @param {number} notaId - ID de la nota
 * @returns {Promise<Array>} - Las notas actualizadas
 */
export const deleteEstudianteNota = async (grupoEstudianteId, notaId) => {
  try {
    // Primero obtenemos las notas actuales
    const { data: estudianteData, error: fetchError } =
      await supabaseStudentClient
        .from("grupo_estudiantes")
        .select("observaciones")
        .eq("id", grupoEstudianteId)
        .single();

    if (fetchError) throw fetchError;

    // Verificar que las notas existan
    if (!Array.isArray(estudianteData.observaciones)) {
      throw new Error("No hay notas disponibles para eliminar");
    }

    // Filtrar la nota a eliminar
    const notasActualizadas = estudianteData.observaciones.filter(
      (nota) => nota.id !== notaId
    );

    // Actualizar las notas en la tabla
    const { data, error } = await supabaseStudentClient
      .from("grupo_estudiantes")
      .update({ observaciones: notasActualizadas })
      .eq("id", grupoEstudianteId)
      .select("observaciones");

    if (error) throw error;

    return data ? data.observaciones : notasActualizadas;
  } catch (error) {
    console.error("Error deleting nota de estudiante:", error);
    throw error;
  }
};

/**
 * Obtiene todos los grupos de bienestar sin filtrar por creador
 * Esta función es útil para administradores y jefes de nivel que necesitan acceder a todos los grupos
 * @returns {Promise<Array>} Lista de todos los grupos de bienestar
 */
export const fetchAllBienestarGroups = async () => {
  try {
    console.log("📥 Obteniendo todos los grupos de bienestar");

    const { data, error } = await supabaseStudentClient
      .from("grupos_bienestar")
      .select(
        `
        id, 
        nombre_grupo, 
        descripcion, 
        tipo, 
        grado, 
        curso, 
        fecha_creacion, 
        activo, 
        observaciones_grupo, 
        grados_mixtos,
        profesionales:profesional_id
      `
      )
      .eq("activo", true)
      .order("fecha_creacion", { ascending: false });

    if (error) {
      console.error("❌ Error al obtener todos los grupos:", error);
      throw error;
    }

    console.log(`✅ Total de grupos encontrados: ${data?.length || 0}`);
    return data || [];
  } catch (error) {
    console.error("Error al obtener todos los grupos de bienestar:", error);
    throw error;
  }
};
