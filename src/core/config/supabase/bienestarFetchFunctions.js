import { supabaseStudentClient } from "./supabaseCampusStudentClient";

export const getProfessionalByEmail = async (email) => {
  try {
    const { data, error } = await supabaseStudentClient
      .from("profesionales")
      .select(
        `
        id,
        nombre,
        especialidad,
        correo,
        categoria_id,
        permiso_crear_cualquier_caso
      `
      )
      .eq("correo", email)
      .single();

    if (error) {
      console.error("Error fetching professional:", error);
      return null;
    }

    console.log("Datos del profesional obtenidos:", data);
    return data;
  } catch (err) {
    console.error("Unexpected error:", err);
    return null;
  }
};

export const getProfessionalIdByEmail = async (profesionaID) => {
  try {
    const { data, error } = await supabaseStudentClient
      .from("profesionales")
      .select(
        `
        id,
        nombre,
        especialidad,
        correo
      `
      )
      .eq("id", profesionaID)
      .single();

    if (error) {
      console.error("Error fetching professional:", error);
      return null;
    }

    //console.log("Datos del profesional obtenidos:", data);
    return data;
  } catch (err) {
    console.error("Unexpected error:", err);
    return null;
  }
};

export const getProfessionalIdByUuid = async (currentUserUuid) => {
  try {
    const { data, error } = await supabaseStudentClient
      .from("profesionales")
      .select(
        `
        *
      `
      )
      .eq("personal_mc_uuid", currentUserUuid)

    if (error) {
      console.error("Error fetching professional:", error);
      return null;
    }

    //console.log("Datos del profesional obtenidos:", data);
    return data;
  } catch (err) {
    console.error("Unexpected error:", err);
    return null;
  }
};

export const fetchStudents = async (searchQuery) => {
  const { data, error } = await supabaseStudentClient
    .from("estudiantes")
    .select("codigo_estudiante, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, grado, curso")
    .or(
      `codigo_estudiante.ilike.%${searchQuery}%,primer_nombre.ilike.%${searchQuery}%,primer_apellido.ilike.%${searchQuery}%`
    )
    .limit(10); // Limitar resultados para mejor rendimiento

  if (error) {
    console.error("Error fetching students:", error);
    return [];
  }

  return data;
};

export const fetchCategories = async () => {
  const { data, error } = await supabaseStudentClient
    .from("categorias") // Ahora usa la vista en public
    .select("id, nombre");
    

  if (error) {
    console.error("Error completo:", error);
    return [];
  }

  return data;
};

export const fetchProfessionalsByCategory = async (categoryId) => {
  const { data, error } = await supabaseStudentClient
    .from("profesionales")
    .select("id, nombre, especialidad")
    .eq("categoria_id", categoryId)
    .eq("activo", true);

    console.log("profesionales from Category data:", data);
  if (error) {
    console.error("Error fetching professionals:", error);
    return [];
  }

  console.log("profesionales from Category data:", data);
  
  if (error) {
    console.error("Error fetching professionals:", error);
    return [];
  }

  // Formatear los datos para incluir nombre completo y especialidad
  return data.map(professional => ({
    id: professional.id,
    nombre: `${professional.nombre} - ${professional.especialidad || ''}`.trim(),
    especialidad: professional.especialidad || 'Sin especialidad',
    // Mantener propiedades individuales por si las necesitas
    nombreOriginal: professional.nombre
  }));
};



export const fetchAllCases = async () => {
  const { data, error } = await supabaseStudentClient
    .from("casos")
    .select(`
      *,
      estudiantes:(
        *
      )
    `)
    .order('fecha_apertura', { ascending: false });

  if (error) {
    console.error("Error fetching cases:", error);
    return [];
  }
};


export const fetchStudentCases = async (codigoEstudiante) => {
  try {
    console.log("Buscando casos para estudiante:", codigoEstudiante);

    const { data, error } = await supabaseStudentClient
      .from("casos")
      .select(
        `
        id,
        estado,
        fecha_apertura,
        categorias:categorias!casos_categoria_id_fkey (
          id, 
          nombre
        ),
        profesional:profesionales!casos_profesional_principal_id_fkey (
          id,
          nombre
        )
      `
      )
      .eq("codigo_estudiante", codigoEstudiante)
      .order("fecha_apertura", { ascending: false });

    if (error) {
      console.error("Error en fetchStudentCases:", {
        error,
        errorCode: error.code,
        details: error.details,
        hint: error.hint,
      });
      return [];
    }

    // Transformar los datos para manejar casos donde falten relaciones
    const transformedData = data.map((caso) => ({
      ...caso,
      categoria: caso.categorias || {
        id: null,
        nombre: "No asignada",
      },
      profesional: caso.profesional || {
        id: null,
        nombre: "No asignado",
      },
    }));

    console.log("Casos encontrados:", transformedData);
    return transformedData;
  } catch (err) {
    console.error("Error inesperado en fetchStudentCases:", err);
    return [];
  }
};

// export const fetchCaseCollaborators = async (caseId) => {
//   const { data, error } = await supabaseStudentClient
//     .from("profesionales")
//     .select("*")
//     .eq("caso_id", caseId);

//   if (error) {
//     console.error("Error fetching case collaborators:", error);
//     return [];
//   }

//   return data;
// };



// export async function createCaseNote(noteData) {
//   try {
//     if (!noteData.caso_id || !noteData.autor_id || !noteData.texto) {
//       console.error("Datos incompletos para crear la nota:", noteData);
//       return null;
//     }

//     const newNote = {
//       caso_id: noteData.caso_id,
//       autor_tipo: "profesional",
//       autor_id: noteData.autor_id,
//       texto: noteData.texto.trim(),
//       tipo: "nota",
//       visible_padres: noteData.visible_padres || false,
//       visible_colaboradores: noteData.visible_colaboradores || false,
//       fecha: new Date().toISOString(),
//     };

//     console.log("Intentando crear nota:", newNote);

//     const { data, error } = await supabaseStudentClient
//       .from("notas_casos")
//       .insert([newNote])
//       .select(
//         `
//         id,
//         caso_id,
//         texto,
//         fecha,
//         tipo,
//         visible_padres,
//         autor_tipo,
//         autor_id
//       `
//       )
//       .single();

//     if (error) {
//       console.error("Error al crear nota:", error);
//       return null;
//     }

//     console.log("Nota creada exitosamente:", data);
//     return data;
//   } catch (err) {
//     console.error("Error inesperado al crear nota:", err);
//     return null;
//   }
// }

// export async function updateCaseNote(noteData) {
//   try {
//     // Validar datos requeridos
//     if (
//       !noteData.id ||
//       !noteData.texto ||
//       !noteData.caso_id ||
//       !noteData.autor_id
//     ) {
//       console.error("Datos incompletos para actualizar la nota:", noteData);
//       return null;
//     }

//     // Preparar datos para actualización
//     const updateNote = {
//       texto: noteData.texto.trim(),
//       visible_padres: noteData.visible_padres || false,
//       visible_colaboradores: noteData.visible_colaboradores || false,
//       nota_anulada: noteData.nota_anulada || false,
//       // Incluir justificacion_anulacion solo si nota_anulada es true
//       ...(noteData.nota_anulada && {
//         justificacion_anulacion: noteData.justificacion_anulacion
//       })
//     };

//     console.log("Intentando actualizar nota:", updateNote);

//     // Realizar la actualización
//     const { data, error } = await supabaseStudentClient
//       .from("notas_casos")
//       .update(updateNote)
//       .eq("id", noteData.id)
//       .eq("caso_id", noteData.caso_id)
//       .eq("autor_id", noteData.autor_id)
//       .select(
//         `
//         id,
//         caso_id,
//         texto,
//         fecha,
//         tipo,
//         visible_padres,
//         visible_colaboradores,
//         autor_tipo,
//         autor_id,
//         nota_anulada,
//         justificacion_anulacion
//       `
//       )
//       .single();

//     if (error) {
//       console.error("Error al actualizar nota:", error);
//       return null;
//     }

//     console.log("Nota actualizada exitosamente:", data);
//     return data;
//   } catch (err) {
//     console.error("Error inesperado al actualizar nota:", err);
//     return null;
//   }
// }





//GESTION DE DOCUMENTOS
// En el archivo bienestarFetchFunctions.js

const sanitizeFileName = (fileName) => {
  return fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9.-]/g, "_")
    .replace(/_+/g, "_")
    .toLowerCase();
};

export const uploadCaseDocument = async (file, caseData, profesionalData) => {
  try {
    console.log("Iniciando upload con datos:", {
      caseData,
      profesionalData,
      file,
    });

    if (!profesionalData || !profesionalData.nombre) {
      console.error("Datos del profesional incompletos:", profesionalData);
      throw new Error("Datos del profesional incompletos");
    }

    // Sanitizar todos los componentes de la ruta
    const sanitizedStudentCode = caseData.estudiante_info.codigo || "temp";
    const sanitizedStudentName = sanitizeFileName(caseData.estudiante_nombre);
    const sanitizedProfessionalName = sanitizeFileName(profesionalData.nombre);

    // Asegurarse de que el nombre del archivo esté sanitizado
    const sanitizedFileName = sanitizeFileName(file.name);

    // Crear la ruta sanitizada
    const studentFolder = `${sanitizedStudentCode}_${sanitizedStudentName}`;
    const filePath = `${studentFolder}/${sanitizedProfessionalName}/${sanitizedFileName}`;

    console.log("Ruta sanitizada del archivo a subir:", filePath);

    // Subir el archivo
    const { data: uploadData, error: uploadError } =
      await supabaseStudentClient.storage
        .from("bienestar_documentos")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

    if (uploadError) {
      console.error("Error en storage upload:", uploadError);
      return null;
    }

    console.log("Archivo subido exitosamente:", uploadData);

    // Crear el registro en la base de datos
    const { data: docRecord, error: dbError } = await supabaseStudentClient
      .from("documentos_casos")
      .insert({
        caso_id: caseData.id,
        nombre_archivo: file.name, // Guardamos el nombre original
        ruta_archivo: filePath, // Guardamos la ruta sanitizada
        tipo_archivo: file.type,
        tamanio: file.size,
        autor_tipo: "profesional",
        autor_id: profesionalData.id,
        visible_padres: false,
      })
      .select()
      .single();

    if (dbError) {
      console.error("Error en DB insert:", dbError);
      await supabaseStudentClient.storage
        .from("bienestar_documentos")
        .remove([filePath]);
      return null;
    }

    return {
      ...docRecord,
      autor_nombre: profesionalData.nombre,
      fecha_formateada: new Date().toLocaleDateString("es-CO", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  } catch (err) {
    console.error("Error inesperado en uploadCaseDocument:", err);
    throw err;
  }
};

export const updateCaseDocument = async (
  oldDocumentPath,
  file,
  caseData,
  profesionalData
) => {
  try {
    console.log("Iniciando actualización de documento:", {
      oldDocumentPath,
      fileName: file.name,
      caseData,
      profesionalData,
    });

    // Crear una nueva ruta sanitizada manteniendo la misma estructura de carpetas
    const pathParts = oldDocumentPath.split("/");
    const sanitizedFileName = sanitizeFileName(file.name);
    const newPath = [...pathParts.slice(0, -1), sanitizedFileName].join("/");

    console.log("Rutas de archivo:", {
      oldPath: oldDocumentPath,
      newPath: newPath,
    });

    // Primero intentamos eliminar el archivo anterior
    const { error: deleteError } = await supabaseStudentClient.storage
      .from("bienestar_documentos")
      .remove([oldDocumentPath]);

    if (deleteError) {
      console.error("Error al eliminar archivo anterior:", deleteError);
      throw deleteError;
    }

    console.log("Archivo anterior eliminado exitosamente");

    // Subimos el nuevo archivo
    const { data: uploadData, error: uploadError } =
      await supabaseStudentClient.storage
        .from("bienestar_documentos")
        .upload(newPath, file, {
          cacheControl: "3600",
          upsert: true,
        });

    if (uploadError) {
      console.error("Error al subir nuevo archivo:", uploadError);
      throw uploadError;
    }

    console.log("Nuevo archivo subido exitosamente");

    // Primero obtenemos el registro actual para verificar que existe
    const { data: currentRecord, error: fetchError } =
      await supabaseStudentClient
        .from("documentos_casos")
        .select("*")
        .eq("ruta_archivo", oldDocumentPath)
        .single();

    if (fetchError) {
      console.error("Error al buscar registro actual:", fetchError);
      throw fetchError;
    }

    if (!currentRecord) {
      throw new Error("No se encontró el registro a actualizar");
    }

    console.log("Registro actual encontrado:", currentRecord);

    // Actualizamos el registro usando el ID en lugar de la ruta
    const { data: docRecord, error: dbError } = await supabaseStudentClient
      .from("documentos_casos")
      .update({
        nombre_archivo: file.name,
        ruta_archivo: newPath,
        tipo_archivo: file.type,
        tamanio: file.size,
        fecha_actualizacion: new Date().toISOString(),
      })
      .eq("id", currentRecord.id) // Usamos el ID en lugar de la ruta
      .select()
      .single();

    if (dbError) {
      console.error("Error al actualizar registro en BD:", dbError);
      throw dbError;
    }

    console.log("Registro actualizado exitosamente:", docRecord);

    return {
      ...docRecord,
      autor_nombre: profesionalData.nombre,
      fecha_formateada: new Date().toLocaleDateString("es-CO", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  } catch (err) {
    console.error("Error en updateCaseDocument:", err);
    throw err;
  }
};

export const fetchCaseDocuments = async (casoId) => {
  try {
    // Primero obtener los documentos
    const { data: docs, error: docsError } = await supabaseStudentClient
      .from("documentos_casos")
      .select("*")
      .eq("caso_id", casoId)
      .order("fecha_subida", { ascending: false });

    if (docsError) {
      console.error("Error fetching documents:", docsError);
      return [];
    }

    // Obtener los IDs únicos de los profesionales
    const profesionalIds = [
      ...new Set(
        docs
          .filter((doc) => doc.autor_tipo === "profesional")
          .map((doc) => doc.autor_id)
      ),
    ];

    // Si hay profesionales, obtenemos sus datos
    let profesionales = {};
    if (profesionalIds.length > 0) {
      const { data: profsData, error: profsError } = await supabaseStudentClient
        .from("profesionales")
        .select("id, nombre")
        .in("id", profesionalIds);

      if (!profsError && profsData) {
        profesionales = profsData.reduce(
          (acc, prof) => ({
            ...acc,
            [prof.id]: prof,
          }),
          {}
        );
      }
    }

    // Transformación los datos
    const transformedData = docs.map((doc) => ({
      ...doc,
      autor_nombre:
        doc.autor_tipo === "profesional"
          ? profesionales[doc.autor_id]?.nombre || "Profesional no encontrado"
          : "Sistema",
      fecha_formateada: new Date(doc.fecha_subida).toLocaleDateString("es-CO", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    }));

    return transformedData;
  } catch (err) {
    console.error("Unexpected error fetching documents:", err);
    return [];
  }
};

export const downloadCaseDocument = async (filePath, fileName) => {
  try {
    const { data, error } = await supabaseStudentClient.storage
      .from("bienestar_documentos")
      .download(filePath);

    if (error) {
      console.error("Error downloading file:", error);
      return;
    }

    // Crear un objeto URL para el archivo
    const url = URL.createObjectURL(data);

    // Crear un elemento <a> temporal
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName; // Usar el nombre original del archivo
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Liberar el objeto URL
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Unexpected error downloading document:", err);
  }
};

//HISTORIAL DE ESTUDIANTES
// En bienestarFetchFunctions.js
export const fetchStudentHistory = async (codigoEstudiante) => {
  try {
    // Primero obtenemos los casos del estudiante
    const { data: casos, error: casosError } = await supabaseStudentClient
      .from("casos")
      .select(
        `
        id,
        descripcion,
        estado,
        prioridad,
        fecha_apertura,
        fecha_cierre,
        categoria:categorias!casos_categoria_id_fkey(
          id,
          nombre
        ),
        profesional:profesionales!casos_profesional_principal_id_fkey(
          id,
          nombre,
          especialidad
        )
      `
      )
      .eq("codigo_estudiante", codigoEstudiante)
      .order("fecha_apertura", { ascending: false });

    if (casosError) {
      console.error("Error fetching student history:", casosError);
      return [];
    }

    // Para cada caso, obtenemos sus colaboradores
    const casesWithColaborators = await Promise.all(
      casos.map(async (caso) => {
        const { data: colaboradores, error: collabError } =
          await supabaseStudentClient
            .from("vista_colaboradores_casos")
            .select(
              `*
        `
            )
            .eq("caso_id", caso.id)
            .eq("estado", "activo");

        if (collabError) {
          console.error(
            "Error fetching collaborators for case:",
            caso.id,
            collabError
          );
          return {
            ...caso,
            colaboradores: [],
          };
        }

        return {
          ...caso,
          colaboradores: colaboradores || [],
        };
      })
    );

    const transformedData = casesWithColaborators.map((caso) => ({
      id: caso.id,
      descripcion: caso.descripcion,
      estado: caso.estado,
      prioridad: caso.prioridad,
      fecha_apertura: caso.fecha_apertura,
      fecha_cierre: caso.fecha_cierre,
      categoria: {
        id: caso.categoria.id,
        nombre: caso.categoria.nombre,
      },
      profesional_principal: {
        id: caso.profesional.id,
        nombre: caso.profesional.nombre,
        especialidad: caso.profesional.especialidad,
      },
      colaboradores: caso.colaboradores,
      es_compartido: caso.colaboradores.length > 0,
    }));

    return transformedData;
  } catch (err) {
    console.error("Unexpected error fetching student history:", err);
    return [];
  }
};

//COLABORADORES
// export const fetchCurrentCollaborators = async (casoId) => {
//   try {
//     const { data, error } = await supabaseStudentClient
//       .from("vista_colaboradores_casos")
//       .select("*")
//       .eq("caso_id", casoId)
//       .eq("estado", "activo") // Agregar filtro por estado
//       .order("fecha_asignacion", { ascending: false });

//     if (error) {
//       console.error("Error fetching collaborators:", error);
//       return [];
//     }

//     // Transformar los datos incluyendo el estado y más información del caso
//     return data.map((collab) => ({
//       id: collab.id,
//       caso_id: collab.caso_id,
//       es_lider: collab.es_lider,
//       estado: collab.estado,
//       fecha_asignacion: collab.fecha_asignacion,
//       profesional: {
//         id: collab.profesional_id,
//         nombre: collab.profesional_nombre,
//         especialidad: collab.profesional_especialidad,
//         categoria: {
//           id: collab.categoria_id,
//           nombre: collab.categoria_nombre,
//         },
//       },
//       caso: {
//         estado: collab.estado_caso,
//         descripcion: collab.descripcion_caso,
//       },
//       estudiante: {
//         codigo: collab.codigo_estudiante,
//         nombre: collab.estudiante_nombre,
//         apellido: collab.estudiante_apellido,
//       },
//     }));
//   } catch (err) {
//     console.error("Unexpected error fetching collaborators:", err);
//     return [];
//   }
// };





export const addCollaborator = async (
  casoId,
  profesionalId,
  esLider = false
) => {
  try {
    console.log("Iniciando addCollaborator con datos:", {
      casoId,
      profesionalId,
      esLider,
    });

    // Verificar que los datos necesarios estén presentes
    if (!casoId || !profesionalId) {
      console.error("Datos incompletos para agregar colaborador:", {
        casoId,
        profesionalId,
      });
      throw new Error("Datos incompletos para agregar colaborador");
    }

    // Verificar que el profesional existe antes de intentar agregarlo
    const { data: profesional, error: profError } = await supabaseStudentClient
      .from("profesionales")
      .select("id, nombre")
      .eq("id", profesionalId)
      .single();

    if (profError) {
      console.error("Error verificando profesional:", profError);
      throw new Error("No se pudo verificar el profesional");
    }

    console.log("Profesional verificado:", profesional);

    // Verificar que el caso existe
    const { data: caso, error: casoError } = await supabaseStudentClient
      .from("casos")
      .select("id")
      .eq("id", casoId)
      .single();

    if (casoError) {
      console.error("Error verificando caso:", casoError);
      throw new Error("No se pudo verificar el caso");
    }

    console.log("Caso verificado:", caso);

    // Verificar si el colaborador ya existe y está activo
    const { data: existingCollab, error: existingError } =
      await supabaseStudentClient
        .from("casos")
        .select("id, estado")
        .eq("caso_id", casoId)
        .eq("profesional_id", profesionalId)
        .eq("estado", "activo")
        .single();

    if (existingCollab) {
      console.error(
        "El colaborador ya está asignado a este caso:",
        existingCollab
      );
      throw new Error("El profesional ya es colaborador activo en este caso");
    }

    console.log("Intentando insertar colaborador...");

    // Insertar usando la tabla directamente
    const { data: insertedData, error: insertError } =
      await supabaseStudentClient
        .from("colaboradores_casos")
        .insert({
          caso_id: casoId,
          profesional_id: profesionalId,
          es_lider: esLider,
          estado: "activo",
          fecha_asignacion: new Date().toISOString(),
        })
        .select()
        .single();

    if (insertError) {
      console.error("Error en la inserción del colaborador:", {
        error: insertError,
        errorCode: insertError.code,
        errorMessage: insertError.message,
        errorDetails: insertError.details,
      });
      throw new Error("Error al insertar colaborador");
    }

    console.log("Colaborador insertado exitosamente:", insertedData);

    // Obtener datos completos de la vista
    const { data: fullData, error: fetchError } = await supabaseStudentClient
      .from("vista_colaboradores_casos")
      .select("*")
      .eq("id", insertedData.id)
      .single();

    if (fetchError) {
      console.error("Error obteniendo datos completos:", fetchError);
      return insertedData; // Retornamos los datos básicos si no podemos obtener los completos
    }

    // Transformar los datos al formato esperado por el componente
    const formattedData = {
      id: fullData.id,
      caso_id: fullData.caso_id,
      es_lider: fullData.es_lider,
      estado: fullData.estado,
      fecha_asignacion: fullData.fecha_asignacion,
      profesional: {
        id: fullData.profesional_id,
        nombre: fullData.profesional_nombre,
        especialidad: fullData.profesional_especialidad,
        categoria: {
          id: fullData.categoria_id,
          nombre: fullData.categoria_nombre,
        },
      },
      caso: {
        estado: fullData.estado_caso,
        descripcion: fullData.descripcion_caso,
      },
      estudiante: {
        codigo: fullData.codigo_estudiante,
        nombre: fullData.estudiante_nombre,
        apellido: fullData.estudiante_apellido,
      },
    };

    console.log("Datos completos formateados:", formattedData);
    return formattedData;
  } catch (err) {
    console.error("Error completo en addCollaborator:", {
      error: err,
      message: err.message,
      stack: err.stack,
    });
    throw err;
  }
};

//   try {
//     console.log("Iniciando addCollaborator con datos:", {
//       casoId,
//       profesionalId,
//       esLider,
//     });

//     // A. Verificar que los datos mínimos estén presentes
//     if (!casoId || !profesionalId) {
//       console.error("Datos incompletos para agregar colaborador:", {
//         casoId,
//         profesionalId,
//       });
//       throw new Error("Datos incompletos para agregar colaborador");
//     }

//     // B. Verificar que el profesional exista
//     const { data: profesional, error: profError } = await supabaseStudentClient
//       .from("profesionales")
//       .select("id, nombre")
//       .eq("id", profesionalId)
//       .single();

//     if (profError) {
//       console.error("Error verificando profesional:", profError);
//       throw new Error("No se pudo verificar el profesional");
//     }
//     console.log("Profesional verificado:", profesional);

//     // C. Verificar que el caso exista y obtener info relevante (como profesional_principal_id)
//     const { data: caso, error: casoError } = await supabaseStudentClient
//       .from("casos")
//       .select("id, profesional_principal_id") // Para validación de principal
//       .eq("id", casoId)
//       .single();

//     if (casoError) {
//       console.error("Error verificando caso:", casoError);
//       throw new Error("No se pudo verificar el caso");
//     }
//     console.log("Caso verificado:", caso);

//     // C1. Validar que no se asigne el profesional principal como colaborador
//     if (caso.profesional_principal_id === profesionalId) {
//       console.error(
//         "El profesional es principal en este caso, no puede ser colaborador."
//       );
//       throw new Error("No se puede asignar al profesional principal como colaborador");
//     }

//     // D. Validar si ya existe un colaborador activo (por si no quieres duplicados)
//     const { data: existingCollab } = await supabaseStudentClient
//       .from("colaboradores_casos")
//       .select("id, estado")
//       .eq("caso_id", casoId)
//       .eq("profesional_id", profesionalId)
//       .eq("estado", "activo")
//       .single(); // Si existe, lanza error

//     if (existingCollab) {
//       console.error("El colaborador ya está asignado a este caso:", existingCollab);
//       throw new Error("El profesional ya es colaborador activo en este caso");
//     }

//     // D1. Validar que no haya más de un líder en este caso (solo si esLider = true)
//     if (esLider) {
//       const { data: existingLeader } = await supabaseStudentClient
//         .from("colaboradores_casos")
//         .select("id")
//         .eq("caso_id", casoId)
//         .eq("es_lider", true)
//         .eq("estado", "activo")
//         .maybeSingle();
//         // maybeSingle() evita lanzar error si no se encuentra un registro

//       if (existingLeader) {
//         console.error("Ya existe un líder en este caso:", existingLeader);
//         throw new Error("Ya existe un líder asignado para este caso");
//       }
//     }

//     console.log("Validaciones completadas. Intentando insertar colaborador (colaboradores_casos)...");

//     // E. Insertar sin usar .select() -> evita "insert returning" en la vista con rules
//     const { error: insertError } = await supabaseStudentClient
//       .from("colaboradores_casos")
//       .insert({
//         caso_id: casoId,
//         profesional_id: profesionalId,
//         es_lider: esLider,
//         estado: "activo",
//         fecha_asignacion: new Date().toISOString(),
//       });

//     if (insertError) {
//       console.error("Error en la inserción del colaborador:", insertError);
//       throw new Error("Error al insertar colaborador");
//     }
//     console.log("Colaborador insertado exitosamente (desde la vista)");

//     // F. Re-consultar para obtener la fila completa (limitando a 1 registro más reciente)
//     const { data: [lastInserted], error: fetchError } = await supabaseStudentClient
//       .from("colaboradores_casos")
//       .select("*")
//       .eq("caso_id", casoId)
//       .eq("profesional_id", profesionalId)
//       .eq("estado", "activo")
//       .order("fecha_asignacion", { ascending: false })
//       .limit(1);

//     if (fetchError || !lastInserted) {
//       console.error("Error obteniendo datos completos:", fetchError);
//       // Retornamos algo básico si no se encuentra
//       return {
//         caso_id: casoId,
//         profesional_id: profesionalId,
//         es_lider: esLider,
//         estado: "activo",
//         fecha_asignacion: new Date().toISOString(),
//       };
//     }

//     // G. Formatear los datos si lo deseas
//     const formattedData = {
//       id: lastInserted.id,
//       caso_id: lastInserted.caso_id,
//       es_lider: lastInserted.es_lider,
//       estado: lastInserted.estado,
//       fecha_asignacion: lastInserted.fecha_asignacion,
//       profesional: {
//         id: lastInserted.profesional_id,
//         nombre: lastInserted.profesional_nombre,
//         especialidad: lastInserted.profesional_especialidad,
//         categoria: {
//           id: lastInserted.categoria_id,
//           nombre: lastInserted.categoria_nombre,
//         },
//       },
//       caso: {
//         estado: lastInserted.estado_caso,
//         descripcion: lastInserted.descripcion_caso,
//       },
//       estudiante: {
//         codigo: lastInserted.codigo_estudiante,
//         nombre: lastInserted.estudiante_nombre,
//         apellido: lastInserted.estudiante_apellido,
//       },
//     };

//     console.log("Datos completos formateados:", formattedData);
//     return formattedData;
//   } catch (err) {
//     console.error("Error completo en addCollaborator:", {
//       error: err,
//       message: err.message,
//       stack: err.stack,
//     });
//     throw err;
//   }
// };

// En lugar de eliminar, actualizamos el estado a inactivo
// Eliminar colaborador
export const removeCollaborator = async (collaboratorId) => {
  try {
    const { error } = await supabaseStudentClient
      .from("colaboradores_casos")
      .delete()
      .eq("id", collaboratorId);

    if (error) {
      console.error("Error removing collaborator:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Unexpected error removing collaborator:", err);
    return false;
  }
};

export const searchAvailableProfessionals = async (searchTerm) => {
  try {
    const { data, error } = await supabaseStudentClient
      .from("profesionales")
      .select(
        `
        id,
        nombre,
        especialidad,
        personal_mc_uuid,
        categorias!inner(
          id,
          nombre
        ),
        personal_mc_id:personal_mc_uuid!
      `
      )
      .or(`nombre.ilike.%${searchTerm}%,especialidad.ilike.%${searchTerm}%`)
      .limit(10);

    if (error) {
      console.error("Error detallado en búsqueda de profesionales:", {
        error,
        code: error.code,
        message: error.message,
        details: error.details,
      });
      return [];
    }

    // Transformar los datos para mantener la estructura esperada
    const transformedData = data.map((prof) => ({
      id: prof.id,
      nombre: prof.nombre,
      especialidad: prof.especialidad,
      categoria: {
        id: prof.categorias.id,
        nombre: prof.categorias.nombre,
      },
    }));

    console.log("Profesionales encontrados:", transformedData);
    return transformedData;
  } catch (err) {
    console.error("Error inesperado en searchAvailableProfessionals:", err);
    return [];
  }
};

// Buscar profesionales disponibles
// export const searchAvailableProfessionals = async (searchTerm) => {
//   try {
//     const { data, error } = await supabaseStudentClient
//       .from('profesionales')
//       .select(`
//         id,
//         nombre,
//         especialidad,
//         categoria:categorias(
//           id,
//           nombre
//         )
//       `)
//       .or(`nombre.ilike.%${searchTerm}%,especialidad.ilike.%${searchTerm}%`)
//       .limit(10);

//     if (error) {
//       console.error('Error searching professionals:', error);
//       return [];
//     }

//     return data;
//   } catch (err) {
//     console.error('Unexpected error searching professionals:', err);
//     return [];
//   }
// };

// export const fetchCollaborativeCases = async (personalMcUuid) => {
//   try {
//     console.log("📥 Buscando casos colaborativos para UUID:", personalMcUuid);

//     // Obtener TODOS los casos activos que tienen colaboradores
//     const { data: casos, error } = await supabaseStudentClient
//       .from("casos")
//       .select(`
//         *,
//         estudiantes:codigo_estudiante(
//           codigo_estudiante,
//           primer_nombre,
//           primer_apellido,
//           curso,
//           grado
//         ),
//         tipologia_id: tipologia_id(
//           id,
//           title
//         )
//       `)
//       .in('estado', ['por iniciar', 'en proceso'])
//       .not('colaboradores', 'is', null)
//       .order("fecha_apertura", { ascending: false });

//     if (error) {
//       console.error("❌ Error al obtener casos colaborativos:", error);
//       throw error;
//     }

//     console.log(`📊 Total de casos activos con colaboradores: ${casos?.length || 0}`);

//     // Filtrar en JavaScript los casos donde el usuario es colaborador activo
//     const casosColaborativos = casos?.filter(caso => {
//       if (!caso.colaboradores || !Array.isArray(caso.colaboradores)) {
//         return false;
//       }
      
//       // Verificar si el usuario está en los colaboradores y está activo
//       return caso.colaboradores.some(colaborador => 
//         colaborador.personal_mc_uuid === personalMcUuid && 
//         colaborador.activo === true
//       );
//     }).map(caso => ({
//       ...caso,
//       es_colaborador: true,
//       es_lider: caso.colaboradores.find(c => 
//         c.personal_mc_uuid === personalMcUuid
//       )?.es_lider || false,
//       estudiante: caso.estudiantes || {
//         primer_nombre: "No disponible",
//         primer_apellido: "",
//         curso: "N/A",
//         grado: "N/A",
//       },
//     })) || [];

//     console.log(`✅ Casos colaborativos encontrados: ${casosColaborativos.length}`);
//     return casosColaborativos;
    
//   } catch (error) {
//     console.error("❌ Error al obtener casos colaborativos:", error);
//     throw error;
//   }
// };

//REPORTES
// Update in bienestarFetchFunctions.js

export const generateCaseReport = async (casoId) => {
  try {
    // 1. Obtener detalles del caso
    const { data: caseData, error: caseError } = await supabaseStudentClient
      .from("casos")
      .select(
        `
        id,
        descripcion,
        estado,
        prioridad,
        fecha_apertura,
        fecha_cierre,
        indicador_riesgo,
        codigo_estudiante,
        profesional_principal_id,
        estudiantes!inner (
          codigo_estudiante,
          primer_nombre,
          primer_apellido,
          grado,
          curso
        ),
        categorias!inner (
          id,
          nombre
        )
      `
      )
      .eq("id", casoId)
      .single();

    if (caseError) {
      console.error("Error fetching case data:", caseError);
      throw caseError;
    }

    // Obtener datos del profesional principal
    const { data: profesionalPrincipal, error: profError } =
      await supabaseStudentClient
        .from("profesionales")
        .select("id, nombre, especialidad")
        .eq("id", caseData.profesional_principal_id)
        .single();

    if (profError) {
      console.error("Error fetching principal professional:", profError);
      throw profError;
    }

    // 2. Obtener colaboradores
    const { data: collaborators, error: collabError } =
      await supabaseStudentClient
        .from("vista_colaboradores_casos")
        .select(
          `
        id,
        profesional_id,
        profesional_nombre,
        profesional_especialidad,
        es_lider,
        fecha_asignacion
      `
        )
        .eq("caso_id", casoId)
        .eq("estado", "activo");

    if (collabError) {
      console.error("Error fetching collaborators:", collabError);
      throw collabError;
    }

    // 3. Obtener notas
    const { data: notesData, error: notesError } = await supabaseStudentClient
      .from("notas_casos")
      .select(
        `
        id,
        texto,
        fecha,
        autor_tipo,
        autor_id,
        visible_padres
      `
      )
      .eq("caso_id", casoId)
      .order("fecha", { ascending: true });

    if (notesError) {
      console.error("Error fetching notes:", notesError);
      throw notesError;
    }

    // Obtener los profesionales para las notas
    const profesionalIds = [
      ...new Set(
        notesData
          .filter((note) => note.autor_tipo === "profesional")
          .map((note) => note.autor_id)
      ),
    ];

    let profesionales = {};
    if (profesionalIds.length > 0) {
      const { data: profsData } = await supabaseStudentClient
        .from("profesionales")
        .select("id, nombre")
        .in("id", profesionalIds);

      if (profsData) {
        profesionales = profsData.reduce(
          (acc, prof) => ({
            ...acc,
            [prof.id]: prof,
          }),
          {}
        );
      }
    }

    // Transformar las notas con los nombres de los profesionales
    const notes = notesData.map((note) => ({
      id: note.id,
      texto: note.texto,
      fecha: note.fecha,
      autor:
        note.autor_tipo === "profesional"
          ? profesionales[note.autor_id]?.nombre || "Profesional no encontrado"
          : "Sistema",
      visible_padres: note.visible_padres,
    }));

    // 4. Obtener documentos
    const { data: docsData, error: docsError } = await supabaseStudentClient
      .from("documentos_casos")
      .select(
        `
        id,
        nombre_archivo,
        tipo_archivo,
        fecha_subida,
        autor_id
      `
      )
      .eq("caso_id", casoId)
      .order("fecha_subida", { ascending: true });

    if (docsError) {
      console.error("Error fetching documents:", docsError);
      throw docsError;
    }

    // Obtener los profesionales para los documentos
    const docProfesionalIds = [
      ...new Set(
        docsData.filter((doc) => doc.autor_id).map((doc) => doc.autor_id)
      ),
    ];

    let docProfesionales = {};
    if (docProfesionalIds.length > 0) {
      const { data: docProfsData } = await supabaseStudentClient
        .from("profesionales")
        .select("id, nombre")
        .in("id", docProfesionalIds);

      if (docProfsData) {
        docProfesionales = docProfsData.reduce(
          (acc, prof) => ({
            ...acc,
            [prof.id]: prof,
          }),
          {}
        );
      }
    }

    // Transformar los documentos con los nombres de los profesionales
    const documents = docsData.map((doc) => ({
      id: doc.id,
      nombre: doc.nombre_archivo,
      tipo: doc.tipo_archivo,
      fecha: doc.fecha_subida,
      autor: docProfesionales[doc.autor_id]?.nombre || "Sistema",
    }));

    // 5. Construir el objeto de reporte
    const report = {
      caso: {
        id: caseData.id,
        descripcion: caseData.descripcion,
        estado: caseData.estado,
        prioridad: caseData.prioridad,
        fecha_apertura: caseData.fecha_apertura,
        fecha_cierre: caseData.fecha_cierre,
        indicador_riesgo: caseData.indicador_riesgo,
      },
      estudiante: {
        codigo: caseData.estudiantes.codigo_estudiante,
        nombre: `${caseData.estudiantes.primer_nombre} ${caseData.estudiantes.primer_apellido}`,
        grado: caseData.estudiantes.grado,
        curso: caseData.estudiantes.curso,
      },
      categoria: caseData.categorias,
      profesional_principal: {
        ...profesionalPrincipal,
        tipo: "Principal",
      },
      colaboradores: collaborators.map((collab) => ({
        id: collab.profesional_id,
        nombre: collab.profesional_nombre,
        especialidad: collab.profesional_especialidad,
        es_lider: collab.es_lider,
        fecha_asignacion: collab.fecha_asignacion,
      })),
      notas: notes,
      documentos: documents,
      fecha_generacion: new Date().toISOString(),
      estadisticas: {
        total_notas: notes.length,
        total_documentos: documents.length,
        total_colaboradores: collaborators.length,
        duracion_dias: caseData.fecha_cierre
          ? Math.ceil(
              (new Date(caseData.fecha_cierre) -
                new Date(caseData.fecha_apertura)) /
                (1000 * 60 * 60 * 24)
            )
          : Math.ceil(
              (new Date() - new Date(caseData.fecha_apertura)) /
                (1000 * 60 * 60 * 24)
            ),
      },
    };

    return report;
  } catch (error) {
    console.error("Error generating case report:", error);
    throw new Error("Error al generar el reporte del caso");
  }
};



// PLAN DE INTERVENCIÓN

// Obtener plan de intervención
export const getInterventionPlan = async (caseId) => {
  try {
    const { data, error } = await supabaseStudentClient
      .from("planes_intervencion")
      .select("*")
      .eq("caso_id", caseId)
      .eq("estado", "activo")
      .is("deleted_at", null)
      .maybeSingle();

    if (error) {
      console.error("Error fetching plan:", error);
      throw error;
    }

    // Si encontramos un plan, asegurarnos que los arrays estén inicializados
    if (data) {
      return {
        ...data,
        objetivos: data.objetivos || [],
        estrategias: data.estrategias || [],
        seguimiento: data.seguimiento || [],
      };
    }

    return null;
  } catch (error) {
    console.error("Error in getInterventionPlan:", error);
    throw error;
  }
};

// Crear plan de intervención
export const createInterventionPlan = async (planData) => {
  try {
    console.log("Creating plan with data:", planData);

    const { data, error } = await supabaseStudentClient
      .from("planes_intervencion")
      .insert([
        {
          caso_id: planData.caso_id,
          profesional_id: planData.profesional_id,
          estado: "activo",
          objetivos: planData.objetivos || [],
          estrategias: planData.estrategias || [],
          seguimiento: planData.seguimiento || [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creating plan:", error);
      throw error;
    }

    console.log("Created plan:", data);
    return data;
  } catch (error) {
    console.error("Error in createInterventionPlan:", error);
    throw error;
  }
};

// Actualizar plan de intervención
export const updateInterventionPlan = async (planId, field, data) => {
  try {
    // 1. Obtener el plan actual
    const { data: currentPlan, error: fetchError } = await supabaseStudentClient
      .from("planes_intervencion")
      .select("*")
      .eq("id", planId)
      .eq("estado", "activo")
      .is("deleted_at", null)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!currentPlan)
      throw new Error(`No se encontró el plan con ID: ${planId}`);

    // 2. Preparar los datos para la actualización
    const now = new Date().toISOString();

    // Asegurarse de que el campo actual sea un array
    const currentField = Array.isArray(currentPlan[field])
      ? currentPlan[field]
      : [];
    const updatedField = [...currentField, { ...data, created_at: now }];

    // 3. Realizar la actualización
    const { data: updatedPlan, error: updateError } = await supabaseStudentClient
      .from("planes_intervencion")
      .update({
        [field]: updatedField,
        updated_at: now,
      })
      .eq("id", planId)
      .eq("estado", "activo")
      .is("deleted_at", null)
      .select()
      .maybeSingle();

    if (updateError) throw updateError;
    return updatedPlan;
  } catch (error) {
    console.error("Error in updateInterventionPlan:", error);
    throw error;
  }
};

// Actualizar estado de objetivo
export const updateObjectiveStatus = async (
  planId,
  objectiveIndex,
  newStatus
) => {
  try {
    // 1. Obtener el plan actual
    const { data: currentPlan, error: fetchError } = await supabaseStudentClient
      .from("planes_intervencion")
      .select("*")
      .eq("id", planId)
      .eq("estado", "activo")
      .is("deleted_at", null)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!currentPlan)
      throw new Error(`No se encontró el plan con ID: ${planId}`);
    if (!Array.isArray(currentPlan.objetivos))
      throw new Error("El plan no tiene objetivos definidos");
    if (objectiveIndex < 0 || objectiveIndex >= currentPlan.objetivos.length) {
      throw new Error("Índice de objetivo inválido");
    }

    // 2. Actualizar el objetivo específico
    const updatedObjectives = [...currentPlan.objetivos];
    updatedObjectives[objectiveIndex] = {
      ...updatedObjectives[objectiveIndex],
      estado: newStatus,
      updated_at: new Date().toISOString(),
    };

    // 3. Realizar la actualización
    const { data: updatedPlan, error: updateError } = await supabaseStudentClient
      .from("planes_intervencion")
      .update({
        objetivos: updatedObjectives,
        updated_at: new Date().toISOString(),
      })
      .eq("id", planId)
      .eq("estado", "activo")
      .is("deleted_at", null)
      .select()
      .maybeSingle();

    if (updateError) throw updateError;
    return updatedPlan;
  } catch (error) {
    console.error("Error in updateObjectiveStatus:", error);
    throw error;
  }
};

// Verificar estructura del plan
export const checkPlanStructure = async (planId) => {
  try {
    const { data, error } = await supabaseStudentClient
      .from("planes_intervencion")
      .select("*")
      .eq("id", planId)
      .eq("estado", "activo")
      .is("deleted_at", null)
      .maybeSingle();

    if (error) throw error;

    console.log("Plan structure check:", {
      id: planId,
      exists: !!data,
      structure: data
        ? {
            hasObjetivos: Array.isArray(data.objetivos),
            hasEstrategias: Array.isArray(data.estrategias),
            hasSeguimiento: Array.isArray(data.seguimiento),
          }
        : null,
    });

    return { plan: data, error: null };
  } catch (error) {
    console.error("Error checking plan structure:", error);
    return { plan: null, error };
  }
};

//BIENESTAR FORM
// Crear registro en bienestar_form
// Función para crear un nuevo registro en bienestar_form
// Función para verificar si hay datos significativos en el formulario
const hasSignificantData = (formData) => {
  // Excluir campos que no deben contarse para la verificación
  const {
    id,
    codigo_estudiante,
    nombres_apellidos,
    edad,
    curso,
    ...relevantData
  } = formData;

  // Verificar si hay al menos un campo con datos
  return Object.values(relevantData).some(
    (value) => value !== null && value !== undefined && value !== ""
  );
};

// Función para obtener el formulario existente por código de estudiante
export const getBienestarFormByStudent = async (codigo_estudiante) => {
  try {
    const { data, error } = await supabaseStudentClient
      .from("bienestar_form")
      .select("*")
      .eq("codigo_estudiante", codigo_estudiante)
      .maybeSingle(); // Usa maybeSingle en lugar de single para evitar errores si no existe

    if (error) {
      console.error("Error fetching bienestar form:", error);
      throw error;
    }

    return data;
  } catch (err) {
    console.error("Error en getBienestarFormByStudent:", err);
    throw err;
  }
};

// Función para crear un nuevo registro
export const createBienestarForm = async (formData) => {
  try {
    console.log("Datos recibidos para crear bienestar_form:", formData);

    // Verificar si ya existe un formulario para este estudiante
    const existingForm = await getBienestarFormByStudent(
      formData.codigo_estudiante
    );

    if (existingForm) {
      console.log(
        "Ya existe un formulario para este estudiante, actualizando..."
      );
      return await updateBienestarForm(existingForm.id, formData);
    }

    // Si no existe, crear uno nuevo
    const { id, ...dataToInsert } = formData;

    const { data, error } = await supabaseStudentClient
      .from("bienestar_form")
      .insert([dataToInsert])
      .select()
      .single();

    if (error) {
      console.error("Error creating bienestar form:", error);
      throw error;
    }

    console.log("Bienestar form creado exitosamente:", data);
    return data;
  } catch (err) {
    console.error("Error en createBienestarForm:", err);
    throw err;
  }
};

// Función para actualizar un registro existente
export const updateBienestarForm = async (formId, formData) => {
  try {
    console.log("Actualizando bienestar_form:", { formId, formData });

    // Remover el id de los datos a actualizar si existe
    const { id, ...updateData } = formData;

    const { data, error } = await supabaseStudentClient
      .from("bienestar_form")
      .update(updateData)
      .eq("id", formId)
      .select()
      .single();

    if (error) {
      console.error("Error updating bienestar form:", error);
      throw error;
    }

    console.log("Bienestar form actualizado exitosamente:", data);
    return data;
  } catch (err) {
    console.error("Error en updateBienestarForm:", err);
    throw err;
  }
};

// Función helper principal para manejar el submit
export const handleBienestarFormSubmit = async (formData, caseId) => {
  try {
    // Verificar si hay datos significativos antes de proceder
    if (!hasSignificantData(formData)) {
      console.log("No hay datos significativos para guardar");
      return null;
    }

    let result;

    // Obtener el formulario existente por código de estudiante
    const existingForm = await getBienestarFormByStudent(
      formData.codigo_estudiante
    );

    if (existingForm) {
      // Si existe un formulario, actualizar
      result = await updateBienestarForm(existingForm.id, formData);
    } else {
      // Si no existe, crear uno nuevo
      result = await createBienestarForm(formData);

      // Actualizar la referencia en el caso solo si es una creación inicial
      if (result && result.id) {
        await updateCaseBienestarForm(caseId, result.id);
      }
    }

    return result;
  } catch (error) {
    console.error("Error en handleBienestarFormSubmit:", error);
    throw error;
  }
};

// Función para actualizar la referencia en la tabla casos
export const updateCaseBienestarForm = async (caseId, bienestarFormId) => {
  try {
    const { data, error } = await supabaseStudentClient
      .from("casos")
      .update({ bienestar_form_id: bienestarFormId })
      .eq("id", caseId)
      .select()
      .single();

    if (error) {
      console.error("Error updating case with bienestar form:", error);
      throw error;
    }

    return data;
  } catch (err) {
    console.error("Error en updateCaseBienestarForm:", err);
    throw err;
  }
};


// BIENESTARFORM

/**
 * Verifica si un usuario tiene permiso para editar un caso específico
 * @param {string} userId - ID del usuario actual (personal_mc_id)
 * @param {number} caseId - ID del caso que se está consultando
 * @return {Promise<boolean>} - true si tiene permiso, false si no
 */
export const checkCaseEditPermission = async (userId, caseId) => {
  try {
    if (!userId || !caseId) {
      console.warn("checkCaseEditPermission: Faltan datos necesarios", { userId, caseId });
      return false;
    }

    console.log("Verificando permisos para:", { userId, caseId });

    // 1. Verificar si el usuario es el profesional principal del caso
    const { data: caso, error: casoError } = await supabaseStudentClient
      .from("casos")
      .select(`
        id,
        profesional_principal_id,
        profesionales!inner (
          id, 
          personal_mc_id
        )
      `)
      .eq("id", caseId)
      .single();

    if (casoError) {
      console.error("Error al verificar caso:", casoError);
      return false;
    }

    console.log("Datos del caso encontrado:", caso);

    // Verificar si el personal_mc_id del profesional coincide con el userId
    if (caso?.profesionales?.personal_mc_id === userId) {
      console.log("El usuario es el profesional principal del caso");
      return true;
    }

    // 2. Verificar si el usuario es un colaborador activo del caso
    const { data: colaboradores, error: colabError } = await supabaseStudentClient
      .from("colaboradores_casos")
      .select(`
        id,
        profesional_id,
        profesionales!inner (
          id,
          personal_mc_id
        )
      `)
      .eq("caso_id", caseId)
      .eq("estado", "activo");

    if (colabError) {
      console.error("Error al verificar colaboradores:", colabError);
      // Continuamos porque es posible que no haya colaboradores
    } else if (colaboradores?.length > 0) {
      // Verificar si algún colaborador coincide con el userId
      const esColaborador = colaboradores.some(
        c => c.profesionales.personal_mc_id === userId
      );
      
      if (esColaborador) {
        console.log("El usuario es un colaborador activo del caso");
        return true;
      }
    }
    
    // 3. Verificar si el usuario tiene un rol administrativo
    const { data: userRole, error: roleError } = await supabaseStudentClient
      .from("personal_mc")
      .select("id, rol")
      .eq("id", userId)
      .single();
      
    if (roleError) {
      console.error("Error al verificar rol del usuario:", roleError);
    } else if (userRole?.rol) {
      const rolesAdmin = ['admin', 'coordinador', 'superadmin'];
      if (rolesAdmin.includes(userRole.rol.toLowerCase())) {
        console.log("El usuario tiene rol administrativo:", userRole.rol);
        return true;
      }
    }

    console.log("El usuario no tiene permisos para editar este caso");
    return false;
  } catch (error) {
    console.error("Error en checkCaseEditPermission:", error);
    return false;
  }
};

/**
 * Obtiene el nombre del profesional principal asignado al caso
 * @param {number} caseId - ID del caso
 * @return {Promise<string>} - Nombre del profesional o mensaje por defecto
 */
export const getProfessionalName = async (caseId) => {
  try {
    const { data, error } = await supabaseStudentClient
      .from("casos")
      .select(`
        profesionales (
          nombre
        )
      `)
      .eq("id", caseId)
      .single();

    if (error || !data?.profesionales?.nombre) {
      return "Profesional no asignado";
    }

    return data.profesionales.nombre;
  } catch (error) {
    console.error("Error en getProfessionalName:", error);
    return "Error al obtener información del profesional";
  }
};











//----- Final Methods ---------

/**
 * Función optimizada usando la vista (usar después de crear la vista)
 * @param {number} professionalId - ID del profesional
 * @returns {Promise<Array>} - Lista de casos completos
 */
export const fetchCases = async (professionalId) => {
  try {
    const { data, error } = await supabaseStudentClient
      .from("vista_casos_completos")
      .select("*")
      .eq("profesional_principal_id", professionalId);

    if (error) {
      console.error("Error fetching cases from view:", error);
      return [];
    }

    // Transformar los datos al formato esperado por el frontend
    return data?.map(row => ({
      id: row.id,
      codigo_estudiante: row.codigo_estudiante,
      categoria_id: row.categoria_id,
      profesional_principal_id: row.profesional_principal_id,
      descripcion: row.descripcion,
      prioridad: row.prioridad,
      estado: row.estado,
      indicador_riesgo: row.indicador_riesgo,
      fecha_apertura: row.fecha_apertura,
      tipo_atencion: row.tipo_atencion,
      tipologias_casos: row.tipologia_title ? {
        id: row.tipologia_id,
        title: row.tipologia_title
      } : null,
      estudiante: row.primer_nombre ? {
        codigo_estudiante: row.codigo_estudiante,
        primer_nombre: row.primer_nombre,
        primer_apellido: row.primer_apellido,
        grado: row.grado,
        curso: row.curso
      } : null
    })) || [];

  } catch (error) {
    console.error("Unexpected error fetching cases from view:", error);
    return [];
  }
};


/**
 * Obtiene casos donde el usuario es colaborador activo
 * @param {string} personalMcUuid - UUID del personal MC
 * @returns {Promise<Array>} - Lista de casos colaborativos
 */
export const fetchCollaborativeCases = async (personalMcUuid) => {
  try {
    console.log("📥 Buscando casos colaborativos para UUID:", personalMcUuid);

    // 1. Obtener casos activos con colaboradores desde la vista optimizada
    const { data: casos, error } = await supabaseStudentClient
      .from("vista_casos_completos")
      .select("*")
      .in('estado', ['por iniciar', 'en proceso'])
      .not('colaboradores', 'is', null)
      .order("fecha_apertura", { ascending: false });

    if (error) {
      console.error("❌ Error al obtener casos colaborativos:", error);
      throw error;
    }

    console.log(`📊 Total de casos activos con colaboradores: ${casos?.length || 0}`);

    // 2. Filtrar en JavaScript los casos donde el usuario es colaborador activo
    const casosColaborativos = casos?.filter(caso => {
      if (!caso.colaboradores || !Array.isArray(caso.colaboradores)) {
        return false;
      }
      
      // Verificar si el usuario está en los colaboradores y está activo
      return caso.colaboradores.some(colaborador => 
        colaborador.personal_mc_uuid === personalMcUuid && 
        colaborador.activo === true
      );
    }).map(caso => {
      // Encontrar la información del colaborador actual
      const colaboradorActual = caso.colaboradores.find(c => 
        c.personal_mc_uuid === personalMcUuid
      );

      return {
        ...caso,
        es_colaborador: true,
        es_lider: colaboradorActual?.es_lider || false,
        
        // Información del estudiante (ya viene de la vista)
        estudiante: caso.primer_nombre ? {
          codigo_estudiante: caso.codigo_estudiante,
          primer_nombre: caso.primer_nombre,
          primer_apellido: caso.primer_apellido,
          curso: caso.curso,
          grado: caso.grado,
        } : {
          primer_nombre: "No disponible",
          primer_apellido: "",
          curso: "N/A",
          grado: "N/A",
        },

        // Información de tipología (ya viene de la vista)
        tipologia_id: caso.tipologia_title ? {
          id: caso.tipologia_id,
          title: caso.tipologia_title
        } : null,

        // Información adicional del colaborador
        colaborador_info: {
          fecha_asignacion: colaboradorActual?.fecha_asignacion,
          rol_colaboracion: colaboradorActual?.rol || 'colaborador',
          estado_colaboracion: colaboradorActual?.activo ? 'activo' : 'inactivo'
        }
      };
    }) || [];

    console.log(`✅ Casos colaborativos encontrados: ${casosColaborativos.length}`);
    return casosColaborativos;
    
  } catch (error) {
    console.error("❌ Error al obtener casos colaborativos:", error);
    throw error;
  }
};


/**
 * Crea un caso
 * @param {Object} caseData - Datos del caso a crear
 * @returns {Promise<Object>} - Caso creado
 */
export const createCase = async (caseData) => {
  try {
    const { data, error } = await supabaseStudentClient
      .from("casos")
      .insert([caseData])
      .select(); // Añadir .select() para obtener los datos insertados

    if (error) {
      throw error; // Lanzar el error para manejarlo en el catch
    }

    return data;
  } catch (err) {
    throw err; // Re-lanzar el error para manejarlo en el componente
  }
};

/**
 * Obtiene los colaboradores de un caso específico
 * @param {number} caseId - ID del caso
 * @returns {Promise<Array>} - Lista de colaboradores
 */
export const fetchCaseDetails = async (caseId) => {
  try {
    // 1. Datos principales desde la vista
    const { data: casoData, error: casoError } = await supabaseStudentClient
      .from("vista_casos_completos")
      .select("*")
      .eq("id", caseId)
      .single();

    if (casoError) {
      console.error("Error fetching case details from vista:", casoError);
      return null;
    }

    // 2. Consultas complementarias para datos no incluidos en la vista
    
    // 2.1 Información completa de la categoría
    let categoriaData = null;
    if (casoData.categoria_id) {
      const { data: categoria } = await supabaseStudentClient

        .from("categorias")
        .select("id, nombre, descripcion")
        .eq("id", casoData.categoria_id)
        .single();
      categoriaData = categoria;
    }

    // 2.2 Información del profesional
    let profesionalData = null;
    if (casoData.profesional_principal_id) {
      const { data: profesional } = await supabaseStudentClient

        .from("profesionales")
        .select("id, nombre, personal_mc_uuid, especialidad")
        .eq("id", casoData.profesional_principal_id)
        .single();
      profesionalData = profesional;
    }

    // 2.3 Información del personal MC
    let personalMcData = null;
    if (profesionalData?.personal_mc_uuid) {
      const { data: personalMc } = await supabaseStudentClient
        .from("personal_mc")
        .select("id, uuid, primer_nombre, primer_apellido")
        .eq("uuid", profesionalData.personal_mc_uuid)
        .single();
      personalMcData = personalMc;
    }

    // 3. Construir respuesta con formato original
    return {
      ...casoData,
      estudiante: casoData.primer_nombre ? {
        primer_nombre: casoData.primer_nombre,
        primer_apellido: casoData.primer_apellido,
        codigo_estudiante: casoData.codigo_estudiante,
        curso: casoData.curso,
        grado: casoData.grado
      } : null,
      categoria: categoriaData,
      profesional: profesionalData,
      tipologia_id: casoData.tipologia_title ? {
        id: casoData.tipologia_id,
        title: casoData.tipologia_title
      } : null,
      profesional_asignado: personalMcData,
      
      // Campos calculados (compatibilidad)
      estudiante_nombre: casoData.primer_nombre
        ? `${casoData.primer_nombre} ${casoData.primer_apellido}`
        : "No asignado",
      estudiante_info: casoData.primer_nombre ? {
        codigo: casoData.codigo_estudiante,
        curso: casoData.curso,
        grado: casoData.grado,
      } : null,
      categoria_nombre: categoriaData?.nombre || "No asignada",
      profesional_nombre: profesionalData?.nombre || "No asignado",
    };

  } catch (error) {
    console.error("Error completo al obtener detalles del caso:", error);
    return null;
  }
};

/**
 * Función auxiliar para obtener el contenido de una nota
 * @param {Object} note - Nota a obtener
 * @returns {Object} - Contenido de la nota
 */
export async function fetchCaseNotes(
  casoId,
  currentProfessional,
  isParent = false,
  isCollaborator = false
) {
  try {
    // Obtener el caso junto con sus notas almacenadas en JSON
    const { data: casoData, error: casoError } = await supabaseStudentClient
      .from("casos")
      .select("notas_casos")
      .eq("id", casoId)
      .single();

    if (casoError) {
      console.error("Error fetching case:", casoError);
      return [];
    }

    // Si no hay notas, devolver array vacío
    if (!casoData || !casoData.notas_casos || !Array.isArray(casoData.notas_casos)) {
      return [];
    }

    // Filtrar las notas según el tipo de usuario
    let notesData = casoData.notas_casos;

    if (isParent) {
      // Para padres solo mostrar notas visibles para padres
      notesData = notesData.filter(note => note.visible_padres);
    } else if (isCollaborator) {
      // Para colaboradores mostrar sus propias notas y las visibles para colaboradores
      notesData = notesData.filter(note => 
        note.visible_colaboradores || note.profesional_id === currentProfessional.id
      );
    } else if (currentProfessional?.id) {
      // Para profesional principal: todas sus notas + notas compartidas con colaboradores
      notesData = notesData.filter(note => 
        note.profesional_id === currentProfessional.id || note.visible_colaboradores
      );
    }

    // Ordenar por fecha de creación (más reciente primero)
    return notesData.sort((a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion));
  } catch (err) {
    console.error("Unexpected error fetching notes:", err);
    return [];
  }
}





/**
 * Obtiene colaboradores actuales de un caso específico
 * @param {number} casoId - ID del caso
 * @returns {Promise<Array>} - Lista de colaboradores activos
 */
export const fetchCurrentCollaborators = async (casoId) => {
  try {
    // 1. Verificar si existe la vista vista_colaboradores_casos
    let useVista = true;
    
    try {
      const { data: vistaTest } = await supabaseStudentClient
        .from("vista_colaboradores_casos")
        .select("caso_id")
        .eq("caso_id", casoId)
        .limit(1);
    } catch (vistaError) {
      console.log("Vista vista_colaboradores_casos no disponible, usando método alternativo");
      useVista = false;
    }

    if (useVista) {
      // Usar la vista si está disponible
      const { data, error } = await supabaseStudentClient
        .from("vista_colaboradores_casos")
        .select("*")
        .eq("caso_id", casoId)
        .eq("estado", "activo")
        .order("fecha_asignacion", { ascending: false });

      if (error) {
        console.error("Error fetching collaborators from vista:", error);
        useVista = false; // Fallback al método alternativo
      } else {
        // Transformar los datos de la vista
        return data.map((collab) => ({
          id: collab.id,
          caso_id: collab.caso_id,
          es_lider: collab.es_lider,
          estado: collab.estado,
          fecha_asignacion: collab.fecha_asignacion,
          profesional: {
            id: collab.profesional_id,
            nombre: collab.profesional_nombre,
            especialidad: collab.profesional_especialidad,
            categoria: {
              id: collab.categoria_id,
              nombre: collab.categoria_nombre,
            },
          },
          caso: {
            estado: collab.estado_caso,
            descripcion: collab.descripcion_caso,
          },
          estudiante: {
            codigo: collab.codigo_estudiante,
            nombre: collab.estudiante_nombre,
            apellido: collab.estudiante_apellido,
          },
        }));
      }
    }

    // 2. Método alternativo: consultar directamente la tabla casos
    if (!useVista) {
      console.log("Usando método alternativo para obtener colaboradores");
      
      const { data: caso, error: casoError } = await supabaseStudentClient
        .from("casos")
        .select(`
          id,
          codigo_estudiante,
          descripcion,
          estado,
          colaboradores
        `)
        .eq("id", casoId)
        .single();

      if (casoError) {
        console.error("Error fetching case for collaborators:", casoError);
        return [];
      }

      if (!caso.colaboradores || !Array.isArray(caso.colaboradores)) {
        return [];
      }

      // Filtrar colaboradores activos
      const colaboradoresActivos = caso.colaboradores.filter(c => c.activo === true);

      if (colaboradoresActivos.length === 0) {
        return [];
      }

      // Obtener información de los profesionales
      const professionalUuids = colaboradoresActivos.map(c => c.personal_mc_uuid);
      
      const { data: profesionales, error: profesionalesError } = await supabaseStudentClient
        .from("profesionales")
        .select(`
          id,
          nombre,
          especialidad,
          personal_mc_uuid,
          categoria_id,
          categorias!categoria_id(
            id,
            nombre
          )
        `)
        .in("personal_mc_uuid", professionalUuids);

      if (profesionalesError) {
        console.error("Error fetching professionals:", profesionalesError);
        return [];
      }

      // Obtener información del estudiante
      let estudiante = null;
      if (caso.codigo_estudiante) {
        const { data: estudianteData } = await supabaseStudentClient
          .from("estudiantes")
          .select("codigo_estudiante, primer_nombre, primer_apellido")
          .eq("codigo_estudiante", caso.codigo_estudiante)
          .single();
        
        estudiante = estudianteData;
      }

      // Combinar datos
      return colaboradoresActivos.map((colaborador, index) => {
        const profesional = profesionales.find(p => p.personal_mc_uuid === colaborador.personal_mc_uuid);
        
        return {
          id: `${casoId}-${index}`, // ID temporal para la interfaz
          caso_id: casoId,
          es_lider: colaborador.es_lider || false,
          estado: "activo",
          fecha_asignacion: colaborador.fecha_asignacion,
          profesional: {
            id: profesional?.id,
            nombre: profesional?.nombre || "No disponible",
            especialidad: profesional?.especialidad || "No especificada",
            categoria: {
              id: profesional?.categorias?.id,
              nombre: profesional?.categorias?.nombre || "Sin categoría",
            },
          },
          caso: {
            estado: caso.estado,
            descripcion: caso.descripcion,
          },
          estudiante: {
            codigo: estudiante?.codigo_estudiante || caso.codigo_estudiante,
            nombre: estudiante?.primer_nombre || "No disponible",
            apellido: estudiante?.primer_apellido || "",
          },
        };
      });
    }

  } catch (err) {
    console.error("Unexpected error fetching collaborators:", err);
    return [];
  }
};