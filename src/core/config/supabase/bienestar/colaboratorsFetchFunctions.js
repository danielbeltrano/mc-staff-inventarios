import { supabaseStudentClient } from "../supabaseCampusStudentClient";
/**
 * COLABORADORES *****************************************************************************
 */





/**
 * Obtener la lista de colaboradores de un grupo específico
 * @param {number} grupoId - ID del grupo
 * @returns {Promise<Array>} - Array de colaboradores
 */
export const fetchColaboradoresGrupo = async (grupoId) => {
  try {
    // console.log("📥 Obteniendo colaboradores del grupo:", grupoId);
    
    if (!grupoId) {
      console.error("❌ fetchColaboradoresGrupo: ID de grupo inválido");
      return [];
    }
    
    // Obtener el grupo con los colaboradores
    const { data: grupo, error } = await supabaseStudentClient
      .from("grupos_bienestar")
      .select("colaboradores")
      .eq("id", grupoId)
      .single();
      
    if (error) {
      console.error("❌ Error obteniendo grupo:", error);
      throw error;
    }
    
    // Si no tiene colaboradores o el campo no existe
    if (!grupo || !grupo.colaboradores) {
      // console.log("ℹ️ El grupo no tiene colaboradores");
      return [];
    }
    
    // console.log("✅ Colaboradores obtenidos:", grupo.colaboradores);
    
    // Filtrar solo colaboradores activos
    const colaboradoresActivos = Array.isArray(grupo.colaboradores) 
      ? grupo.colaboradores.filter(c => c.activo !== false) 
      : [];
      
    // Enriquecer con datos adicionales si es necesario (nombres, etc.)
    if (colaboradoresActivos.length > 0) {
      // Obtener IDs únicos de profesionales y personal_mc para consultas
      const personalMcIds = [...new Set(colaboradoresActivos
        .map(c => c.personal_mc_uuid)
        .filter(Boolean))];
        
      const profesionalIds = [...new Set(colaboradoresActivos
        .map(c => c.profesional_id)
        .filter(Boolean))];
      
      // Datos de profesionales
      let profesionalesData = [];
      if (profesionalIds.length > 0) {
        const { data: profData, error: profError } = await supabaseStudentClient
          .from("profesionales")
          .select(`
            id,
            nombre,
            especialidad,
            categorias(id, nombre)
          `)
          .in("id", profesionalIds);
          
        if (!profError) {
          profesionalesData = profData || [];
        } else {
          console.error("❌ Error obteniendo datos de profesionales:", profError);
        }
      }
      
      // Datos de personal_mc
      let personalMcData = [];
      if (personalMcIds.length > 0) {
        const { data: personalData, error: personalError } = await supabaseStudentClient
          .from("personal_mc")
          .select("uuid, primer_nombre, primer_apellido")
          .in("uuid", personalMcIds);
          
        if (!personalError) {
          personalMcData = personalData || [];
        } else {
          console.error("❌ Error obteniendo datos de personal_mc:", personalError);
        }
      }
      
      // Crear mapas para búsqueda rápida
      const profesionalesMap = profesionalesData.reduce((acc, p) => {
        acc[p.id] = p;
        return acc;
      }, {});
      
      const personalMcMap = personalMcData.reduce((acc, p) => {
        acc[p.uuid] = p;
        return acc;
      }, {});
      
      // Enriquecer cada colaborador con información adicional
      const colaboradoresEnriquecidos = colaboradoresActivos.map(colab => {
        const profesional = profesionalesMap[colab.profesional_id] || null;
        const personalMc = personalMcMap[colab.personal_mc_uuid] || null;
        
        return {
          ...colab,
          id: colab.profesional_id, // Usar profesional_id como identificador único
          profesional_id: profesional,
          personal_mc: personalMc,
          // Preservar otros campos importantes
          es_lider: colab.es_lider || false,
          permiso_anadir_colaborador: colab.permiso_anadir_colaborador || false,
          fecha_asignacion: colab.fecha_asignacion || new Date().toISOString()
        };
      });
      
      // console.log("✅ Colaboradores enriquecidos:", colaboradoresEnriquecidos);
      return colaboradoresEnriquecidos;
    }
    
    return colaboradoresActivos;
  } catch (error) {
    console.error("❌ Error en fetchColaboradoresGrupo:", error);
    return [];
  }
};

/**
 * Añadir un colaborador a un grupo
 * @param {Object} params - Parámetros para añadir colaborador
 * @param {number} params.grupoId - ID del grupo
 * @param {number} params.profesionalId - ID del profesional
 * @param {string} params.personalMcId - UUID del personal_mc
 * @param {boolean} params.esLider - Si es líder del grupo
 * @param {boolean} params.permisoAnadirColaborador - Si puede añadir colaboradores
 * @returns {Promise<Object>} - Resultado de la operación
 */
export const addColaboradorGrupo = async ({ 
  grupoId, 
  profesionalId, 
  personalMcId, 
  esLider = false,
  permisoAnadirColaborador = false 
}) => {
  try {
    // console.log("📤 Añadiendo colaborador al grupo:", {
    //   grupoId, profesionalId, personalMcId, esLider, permisoAnadirColaborador
    // });
    
    // Validaciones básicas
    if (!grupoId || isNaN(parseInt(grupoId))) {
      throw new Error("ID de grupo inválido");
    }
    
    if (!profesionalId || isNaN(parseInt(profesionalId))) {
      throw new Error("ID de profesional inválido");
    }
    
    if (!personalMcId || typeof personalMcId !== 'string') {
      throw new Error("ID de personal MC inválido");
    }
    
    // Convertir a tipos adecuados
    const numGrupoId = parseInt(grupoId, 10);
    const numProfesionalId = parseInt(profesionalId, 10);
    const boolEsLider = Boolean(esLider);
    const boolPermisoAnadirColaborador = Boolean(permisoAnadirColaborador);
    
    // Obtener los colaboradores actuales
    const { data: grupo, error: getError } = await supabaseStudentClient
      .from("grupos_bienestar")
      .select("colaboradores")
      .eq("id", numGrupoId)
      .single();
      
    if (getError) {
      console.error("❌ Error obteniendo grupo:", getError);
      throw getError;
    }
    
    // Lista actual de colaboradores (o array vacío si no hay)
    const colaboradoresActuales = grupo?.colaboradores || [];
    
    // Verificar si el profesional ya es colaborador
    const colaboradorExistente = Array.isArray(colaboradoresActuales) ? 
      colaboradoresActuales.find(c => c.profesional_id === numProfesionalId) : null;
      
    if (colaboradorExistente) {
      // Actualizar colaborador existente
      // console.log("✅ Colaborador existente, actualizando:", colaboradorExistente);
      
      const colaboradoresActualizados = colaboradoresActuales.map(c => {
        if (c.profesional_id === numProfesionalId) {
          return {
            ...c,
            personal_mc_uuid: personalMcId,
            es_lider: boolEsLider,
            permiso_anadir_colaborador: boolPermisoAnadirColaborador,
            fecha_asignacion: new Date().toISOString(),
            activo: true // Reactivar en caso de haber sido desactivado
          };
        }
        return c;
      });
      
      // Guardar colaboradores actualizados
      const { data: updateResult, error: updateError } = await supabaseStudentClient
        .from("grupos_bienestar")
        .update({ colaboradores: colaboradoresActualizados })
        .eq("id", numGrupoId)
        .select("colaboradores");
        
      if (updateError) {
        console.error("❌ Error actualizando colaborador:", updateError);
        throw updateError;
      }
      
      // console.log("✅ Colaborador actualizado:", updateResult);
      
      // Encontrar el colaborador actualizado
      const colaboradorActualizado = Array.isArray(updateResult?.colaboradores) ? 
        updateResult.colaboradores.find(c => c.profesional_id === numProfesionalId) : null;
        
      return colaboradorActualizado || { message: "Colaborador actualizado con éxito" };
    } else {
      // Crear nuevo colaborador
      const nuevoColaborador = {
        profesional_id: numProfesionalId,
        personal_mc_uuid: personalMcId,
        es_lider: boolEsLider,
        permiso_anadir_colaborador: boolPermisoAnadirColaborador,
        fecha_asignacion: new Date().toISOString(),
        activo: true
      };
      
      const nuevosColaboradores = [...colaboradoresActuales, nuevoColaborador];
      
      // Guardar colaboradores actualizados
      const { data: updateResult, error: updateError } = await supabaseStudentClient
        .from("grupos_bienestar")
        .update({ colaboradores: nuevosColaboradores })
        .eq("id", numGrupoId)
        .select("colaboradores");
        
      if (updateError) {
        console.error("❌ Error añadiendo nuevo colaborador:", updateError);
        throw updateError;
      }
      
      // console.log("✅ Nuevo colaborador añadido:", updateResult);
      
      // Encontrar el colaborador actualizado
      const colaboradorCreado = Array.isArray(updateResult?.colaboradores) ? 
        updateResult.colaboradores.find(c => c.profesional_id === numProfesionalId) : null;
        
      return colaboradorCreado || nuevoColaborador;
    }
  } catch (error) {
    console.error("❌ Error en addColaboradorGrupo:", error);
    throw error;
  }
};

/**
 * Eliminar colaborador de un grupo (marcar como inactivo)
 * @param {Object} params - Parámetros para eliminar colaborador 
 * @param {number} params.grupoId - ID del grupo
 * @param {number} params.profesionalId - ID del profesional a eliminar
 * @returns {Promise<Object>} - Resultado de la operación
 */
export const removeColaborador = async ({ grupoId, profesionalId }) => {
  try {
    // console.log("🗑️ Eliminando colaborador:", { grupoId, profesionalId });
    
    if (!grupoId || !profesionalId) {
      throw new Error("Se requieren ID de grupo y profesional");
    }
    
    // Obtener los colaboradores actuales
    const { data: grupo, error: getError } = await supabaseStudentClient
      .from("grupos_bienestar")
      .select("colaboradores")
      .eq("id", grupoId)
      .single();
      
    if (getError) {
      console.error("❌ Error obteniendo grupo:", getError);
      throw getError;
    }
    
    // Lista actual de colaboradores (o array vacío si no hay)
    const colaboradoresActuales = grupo?.colaboradores || [];
    
    // Verificar si el profesional es colaborador
    const existeColaborador = Array.isArray(colaboradoresActuales) ? 
      colaboradoresActuales.some(c => c.profesional_id === profesionalId) : false;
      
    if (!existeColaborador) {
      throw new Error("El profesional no es colaborador de este grupo");
    }
    
    // Marcar como inactivo el colaborador
    const colaboradoresActualizados = colaboradoresActuales.map(c => {
      if (c.profesional_id === profesionalId) {
        return {
          ...c,
          activo: false
        };
      }
      return c;
    });
    
    // Guardar colaboradores actualizados
    const { data: updateResult, error: updateError } = await supabaseStudentClient
      .from("grupos_bienestar")
      .update({ colaboradores: colaboradoresActualizados })
      .eq("id", grupoId)
      .select();
      
    if (updateError) {
      console.error("❌ Error desactivando colaborador:", updateError);
      throw updateError;
    }
    
    // console.log("✅ Colaborador desactivado:", updateResult);
    return { success: true, message: "Colaborador eliminado con éxito" };
  } catch (error) {
    console.error("❌ Error en removeColaborador:", error);
    throw error;
  }
};

/**
 * Verifica los permisos de un profesional en un grupo
 * @param {number} grupoId - ID del grupo
 * @param {string|number} profesionalId - ID del profesional (puede ser número o UUID)
 * @returns {Promise<Object>} - Objeto con permisos
 */
export const checkColaboradorPermissions = async (grupoId, profesionalId) => {
  try {
    // console.log("🔒 Verificando permisos:", { grupoId, profesionalId });
    // console.log("🔒 Tipo de profesionalId:", typeof profesionalId);
    
    if (!grupoId || !profesionalId) {
      return {
        es_colaborador: false,
        es_lider: false,
        permiso_anadir_colaborador: false,
        error: "Se requieren ID de grupo y profesional"
      };
    }
    
    // Convertir el grupoId a número si es string
    const numericGrupoId = typeof grupoId === "string" ? parseInt(grupoId, 10) : grupoId;
    
    // Para el profesionalId, distinguimos si es un UUID o un ID numérico
    // Verificamos si parece un UUID (tiene guiones o letras)
    const isUuid = typeof profesionalId === "string" && 
                  (profesionalId.includes("-") || /[a-zA-Z]/.test(profesionalId));
    
    let numericProfesionalId = null;
    if (!isUuid) {
      // Solo convertir a número si NO es un UUID
      numericProfesionalId = typeof profesionalId === "string" ? 
                            parseInt(profesionalId, 10) : parseInt(profesionalId);
    }
    
    // console.log("🔒 IDs procesados:", { 
    //   numericGrupoId, 
    //   profesionalId,
    //   isUuid,
    //   numericProfesionalId
    // });
    
    // Verificar si es creador del grupo
    const { data: grupo, error: grupoError } = await supabaseStudentClient
      .from("grupos_bienestar")
      .select("profesional_id, colaboradores")
      .eq("id", numericGrupoId)
      .maybeSingle();
      
    // console.log("grupo from checkColaboradorPermissions", grupo);
    
    if (grupoError) {
      console.error("❌ Error consultando grupo:", grupoError);
      return {
        es_colaborador: false,
        es_lider: false,
        permiso_anadir_colaborador: false,
        error: grupoError.message
      };
    }
    
    // Solo comparar como creador si no es UUID
    if (!isUuid) {
      // Si es el creador del grupo, tiene todos los permisos
      const creadorId = parseInt(grupo?.profesional_id);
      // console.log("🔒 Comparando creador:", creadorId, "con profesional:", numericProfesionalId);
      
      if (grupo && creadorId === numericProfesionalId) {
        // console.log("✅ Es el creador del grupo, tiene todos los permisos");
        return {
          es_colaborador: true,
          es_lider: true,
          permiso_anadir_colaborador: true,
          es_creador: true
        };
      }
    }
    
    // Verificar si es colaborador con permisos
    if (grupo && Array.isArray(grupo.colaboradores)) {
      // Log para depuración detallada
      if (isUuid) {
        // console.log("🔍 Buscando colaborador con personal_mc_uuid:", profesionalId);
      } else {
        // console.log("🔍 Buscando colaborador con profesional_id:", numericProfesionalId);
      }
      // console.log("🔍 Lista de colaboradores:", JSON.stringify(grupo.colaboradores));
      
      // Verificar cada colaborador individualmente
      let colaboradorEncontrado = null;
      
      for (const c of grupo.colaboradores) {
        const isActive = c.activo !== false;
        
        if (isUuid) {
          // Comparar con personal_mc_uuid si es un UUID
          // console.log("🔍 Comparando UUID:", c.personal_mc_uuid, "con", profesionalId, 
            // "¿Son iguales?", c.personal_mc_uuid === profesionalId, 
            // "Activo:", isActive, 
            // "permiso:", c.permiso_anadir_colaborador);
          
          if (c.personal_mc_uuid === profesionalId && isActive) {
            colaboradorEncontrado = c;
            break;
          }
        } else {
          // Comparar con profesional_id si es un ID numérico
          let profId = c.profesional_id;
          
          // Asegurarse de que estamos comparando números con números
          if (typeof profId === 'object' && profId !== null) {
            profId = parseInt(profId.id);
          } else {
            profId = parseInt(profId);
          }
          
          // console.log("🔍 Comparando:", profId, "con", numericProfesionalId, 
            // "¿Son iguales?", profId === numericProfesionalId, 
            // "Activo:", isActive, 
            // "permiso:", c.permiso_anadir_colaborador);
          
          if (profId === numericProfesionalId && isActive) {
            colaboradorEncontrado = c;
            break;
          }
        }
      }
      
      // console.log("colaborador from checkColaboradorPermissions", colaboradorEncontrado);
      
      if (colaboradorEncontrado) {
        // Verificar explícitamente el valor de permiso_anadir_colaborador
        // Convertir a booleano si es necesario
        let tienePermiso = false;
        
        if (colaboradorEncontrado.permiso_anadir_colaborador === true || 
            colaboradorEncontrado.permiso_anadir_colaborador === 1 || 
            colaboradorEncontrado.permiso_anadir_colaborador === "true") {
          tienePermiso = true;
        }
        
        // console.log("✅ Es colaborador con permiso para añadir:", tienePermiso);
        // console.log("✅ Datos del colaborador:", colaboradorEncontrado);
        
        return {
          es_colaborador: true,
          es_lider: !!colaboradorEncontrado.es_lider,
          permiso_anadir_colaborador: tienePermiso,
          collaborator_details: colaboradorEncontrado // Útil para depuración
        };
      } else {
        // console.log("⚠️ No se encontró como colaborador");
      }
    } else {
      // console.log("⚠️ No hay colaboradores en el grupo o no es un array");
    }
    
    // No es ni creador ni colaborador
    // console.log("⚠️ No es colaborador ni creador del grupo");
    return {
      es_colaborador: false,
      es_lider: false,
      permiso_anadir_colaborador: false
    };
  } catch (error) {
    console.error("❌ Error en checkColaboradorPermissions:", error);
    return {
      es_colaborador: false,
      es_lider: false,
      permiso_anadir_colaborador: false,
      error: error.message
    };
  }
};







// ----------------

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
        )
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
      personal_mc_uuid: prof.personal_mc_uuid,
    }));

    // console.log("Profesionales encontrados:", transformedData);
    return transformedData;
  } catch (err) {
    console.error("Error inesperado en searchAvailableProfessionals:", err);
    return [];
  }
};


/**
 * Obtener colaboradores de un caso
 * @param {number} casoId - ID del caso
 * @returns {Promise<Array>} Lista de colaboradores
 */
export const fetchColaboradoresCaso = async (casoId) => {
    try {
      const { data, error } = await supabaseStudentClient
        .from('colaboradores_bienestar')
        .select(`
          *,
          personal_mc(uuid, nombre, apellido),
          profesionales:profesional_id(id, profesion, especialidad)
        `)
        .eq('entidad_tipo', 'caso')
        .eq('entidad_id', casoId)
        .eq('estado', 'activo');
  
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error al obtener colaboradores del caso:', error);
      throw error;
    }
  };
  
  /**
   * Añadir colaborador a un caso
   * @param {Object} params - Parámetros de la función
   * @param {number} params.casoId - ID del caso
   * @param {number} params.profesionalId - ID del profesional (tabla bienestar.profesionales)
   * @param {string} params.personalMcId - UUID del personal_mc
   * @param {boolean} params.esLider - Indica si es líder del caso
   * @returns {Promise<Object>} Datos del colaborador creado
   */
  export const addColaboradorCaso = async ({ casoId, profesionalId, personalMcId, esLider = false }) => {
    try {
      const { data, error } = await supabaseStudentClient
        .from('colaboradores_bienestar')
        .insert([{
          entidad_tipo: 'caso',
          entidad_id: casoId,
          profesional_id: profesionalId,
          personal_mc_id: personalMcId,
          es_lider: esLider
        }])
        .select();
  
      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Error al añadir colaborador al caso:', error);
      throw error;
    }
  };
  
  
  // /**
  //  * Obtener colaboradores de un grupo
  //  * @param {number} grupoId - ID del grupo
  //  * @returns {Promise<Array>} Lista de colaboradores
  //  */
  // export const fetchColaboradoresGrupo = async (grupoId) => {
  //   try {
  // //     console.log("📥 Iniciando fetchColaboradoresGrupo para grupoId:", grupoId);
      
  //     // Primera consulta: Obtener solo los datos básicos de colaboradores sin joins
  //     const { data, error } = await supabaseStudentClient
  //       .from('colaboradores_bienestar')
  //       .select(`
  //         id, 
  //         entidad_tipo,
  //         entidad_id,
  //         personal_mc_id,
  //         es_lider,
  //         fecha_asignacion,
  //         estado,
  //         roles,
  //         profesional_id:profesionales(
  //           id,
  //           personal_mc_id,
  //           especialidad,
  //           nombre,
  //           categoria:categorias(
  //             id,
  //             nombre
  //           )
  //         )
  //       `)
  //       .eq('entidad_tipo', 'grupo')
  //       .eq('entidad_id', grupoId)
  //       .eq('estado', 'activo');

  // //       console.log("data from fetchColaboradoresGrupo", data);
  
  //     if (error) {
  //       console.error("❌ Error en fetchColaboradoresGrupo:", error);
  //       throw error;
  //     }
      
  // //     console.log("✅ Datos básicos de colaboradores recibidos:", data);
      
  //     // Si no hay colaboradores, devolver array vacío
  //     if (!data || data.length === 0) {
  // //       console.log("ℹ️ No hay colaboradores para este grupo");
  //       return [];
  //     }
      
  //     // Extraer arrays de IDs para consultas adicionales
  //     const personalMcIds = data.map(item => item.personal_mc_id).filter(Boolean);
  //     const profesionalIds = data.map(item => item.profesional_id).filter(Boolean);
      
  //     // Consulta 2: Obtener datos de personal_mc
  //     let personalMcMap = {};
  //     if (personalMcIds.length > 0) {
  //       try {
  //         const { data: personalData, error: personalError } = await supabaseStudentClient
  //           .from('personal_mc')
  //           .select('uuid, primer_nombre, primer_apellido')
  //           .in('uuid', personalMcIds);
            
  //         if (personalError) {
  //           console.error("❌ Error al obtener datos de personal_mc:", personalError);
  //         } else {
  // //           console.log("✅ Datos de personal_mc obtenidos:", personalData);
            
  //           // Crear mapa para acceso rápido
  //           personalMcMap = personalData.reduce((acc, person) => {
  //             acc[person.uuid] = person;
  //             return acc;
  //           }, {});
  //         }
  //       } catch (err) {
  //         console.error("❌ Error en consulta de personal_mc:", err);
  //       }
  //     }
      
  // //     console.log("profesionalIds consulta 3", profesionalIds);
  //     // Consulta 3: Obtener datos de profesionales
  //     // let profesionalesMap = {};
  //     // if (profesionalIds.length > 0) {
  //     //   try {
  //     //     const { data: profesionalesData, error: profesionalesError } = await supabaseStudentClient
  //     //       .from('profesionales')
  //     //       .select('id, especialidad')
  //     //       .in('id', profesionalIds);
          
  //     //     if (profesionalesError) {
  //     //       console.error("❌ Error al obtener datos de profesionales:", profesionalesError);
  //     //     } else {
  // //     //       console.log("✅ Datos de profesionales obtenidos:", profesionalesData);
            
  //     //       // Crear mapa para acceso rápido
  //     //       profesionalesMap = profesionalesData.reduce((acc, prof) => {
  //     //         acc[prof.id] = prof;
  //     //         return acc;
  //     //       }, {});
  //     //     }
  //     //   } catch (err) {
  //     //     console.error("❌ Error en consulta de profesionales:", err);
  //     //   }
  //     // }
      
  //     // Combinar todos los datos
  //     const colaboradoresCompletos = data.map(colaborador => {
  //       const personal = personalMcMap[colaborador.personal_mc_id] || null;
  //       //const profesional = profesionalesMap[colaborador.profesional_id] || null;
        
  //       // Añadir las propiedades de las relaciones
  //       return {
  //         ...colaborador,
  //         personal_mc: personal,
  //         //profesionales: profesional
  //       };
  //     });
      
  // //     console.log("✅ Datos combinados de colaboradores:", colaboradoresCompletos);
  //     return colaboradoresCompletos;
  //   } catch (error) {
  //     console.error('❌ Error al obtener colaboradores del grupo:', error);
  //     throw error;
  //   }
  // };


/**
 * Obtiene los grupos donde el profesional es colaborador
 * @param {string|number} profesionalId - ID del profesional (puede ser UUID o numérico)
 * @returns {Promise<Array>} Lista de grupos compartidos con detalles completos
 * 
 * Nota: La columna colaboradores es de tipo JSON con esta estructura:
 * [
 *   {
 *     "activo": true,
 *     "es_lider": false,
 *     "profesional_id": 2,
 *     "fecha_asignacion": "2025-04-12T18:20:58.041Z",
 *     "personal_mc_uuid": "911c-ce0b1",
 *     "permiso_anadir_colaborador": true
 *   }
 * ]
 */
export const fetchGruposCompartidos = async (profesionalId) => {
  try {
    // console.log("📥 Iniciando fetchGruposCompartidos para profesionalId:", profesionalId);
    // console.log("📥 Tipo de profesionalId:", typeof profesionalId);
    
    if (!profesionalId) {
      console.warn("❌ fetchGruposCompartidos: profesionalId es requerido");
      return [];
    }
    
    // Determinar si estamos trabajando con un UUID
    const isUuid = typeof profesionalId === "string" && 
                  (profesionalId.includes("-") || /[a-zA-Z]/.test(profesionalId));
                  
    // console.log("📥 ¿Es UUID?:", isUuid);
    
    // Paso 1: Obtener todos los grupos con su campo colaboradores
    // Primero obtenemos de grupos_bienestar solo el id y el campo colaboradores
    const { data: gruposColaboradores, error: errorGruposColaboradores } = await supabaseStudentClient
      .from("grupos_bienestar")
      .select(`
        id, 
        colaboradores
      `);
    
    if (errorGruposColaboradores) {
      console.error("❌ Error consultando grupos para colaboradores:", errorGruposColaboradores);
      return [];
    }
    
    if (!gruposColaboradores || gruposColaboradores.length === 0) {
      // console.log("ℹ️ No se encontraron grupos");
      return [];
    }
    
    // console.log(`📥 Se encontraron ${gruposColaboradores.length} grupos para filtrar colaboradores`);
    
    // Paso 2: Filtrar los IDs de grupos donde el profesional actual es colaborador
    const idsGruposCompartidos = gruposColaboradores
      .filter(grupo => {
        // Verificar que colaboradores sea un array válido
        if (!grupo.colaboradores || !Array.isArray(grupo.colaboradores) || grupo.colaboradores.length === 0) {
          return false;
        }
        
        // Buscar al profesional en la lista de colaboradores
        return grupo.colaboradores.some(colaborador => {
          // Verificar que el colaborador está activo
          const isActive = colaborador.activo !== false;
          if (!isActive) return false;
          
          if (isUuid) {
            // Si es UUID, comparar con personal_mc_uuid
            return colaborador.personal_mc_uuid === profesionalId;
          } else {
            // Si es ID numérico, comparar con profesional_id
            let profId = colaborador.profesional_id;
            
            // Manejar diferentes formatos de profesional_id
            if (typeof profId === 'object' && profId !== null) {
              profId = parseInt(profId.id);
            } else {
              profId = parseInt(profId);
            }
            
            const numericProfesionalId = typeof profesionalId === "string" ? 
                                      parseInt(profesionalId, 10) : parseInt(profesionalId);
                                      
            return profId === numericProfesionalId;
          }
        });
      })
      .map(grupo => grupo.id);
    
    if (idsGruposCompartidos.length === 0) {
      // console.log("ℹ️ No se encontraron grupos compartidos para este profesional");
      return [];
    }
    
    // console.log(`📥 IDs de grupos compartidos: ${idsGruposCompartidos.join(', ')}`);
    
    // Paso 3: Obtener los detalles completos de estos grupos desde la vista grupos_info
    const { data: gruposDetalles, error: errorGruposDetalles } = await supabaseStudentClient
      .from("grupos_info")
      .select(`
        id,
        nombre_grupo,
        descripcion,
        tipo,
        grado,
        curso,
        limite_integrantes,
        cantidad_estudiantes,
        personal_mc_id
      `)
      .in('id', idsGruposCompartidos);
    
    if (errorGruposDetalles) {
      console.error("❌ Error al obtener detalles de grupos:", errorGruposDetalles);
      return [];
    }
    
    if (!gruposDetalles || gruposDetalles.length === 0) {
      // console.log("ℹ️ No se encontraron detalles para los grupos compartidos");
      return [];
    }
    
    // Paso 4: Enriquecer con información de permisos desde los colaboradores originales
    const gruposEnriquecidos = gruposDetalles.map(grupoDetalle => {
      // Encontrar el grupo original con los colaboradores
      const grupoOriginal = gruposColaboradores.find(g => g.id === grupoDetalle.id);
      
      // Si por alguna razón no lo encontramos, devolver el grupo tal cual
      if (!grupoOriginal || !grupoOriginal.colaboradores) {
        return grupoDetalle;
      }
      
      // Encontrar el colaborador actual
      const colaboradorActual = grupoOriginal.colaboradores.find(colab => {
        if (isUuid) {
          return colab.personal_mc_uuid === profesionalId;
        } else {
          let profId = colab.profesional_id;
          
          if (typeof profId === 'object' && profId !== null) {
            profId = parseInt(profId.id);
          } else {
            profId = parseInt(profId);
          }
          
          const numericProfesionalId = typeof profesionalId === "string" ? 
                                     parseInt(profesionalId, 10) : parseInt(profesionalId);
                                     
          return profId === numericProfesionalId;
        }
      });
      
      // Añadir información de permisos
      return {
        ...grupoDetalle,
        es_lider: colaboradorActual?.es_lider || false,
        permiso_anadir_colaborador: colaboradorActual?.permiso_anadir_colaborador || false
      };
    });
    
    // console.log("✅ Grupos compartidos procesados:", gruposEnriquecidos.length);
    
    // Imprimir información detallada para depuración
    gruposEnriquecidos.forEach(grupo => {
      // console.log(`✅ Grupo: ${grupo.id} - ${grupo.nombre_grupo} - Estudiantes: ${grupo.cantidad_estudiantes}`);
    });
    
    return gruposEnriquecidos;
    
  } catch (error) {
    console.error('❌ Error en fetchGruposCompartidos:', error);
    return [];
  }
};

  // /**
  //  * Eliminar colaborador (marcando como inactivo)
  //  * @param {number} colaboradorId - ID del colaborador
  //  * @returns {Promise<Object>} Datos del colaborador actualizado
  //  */
  // export const removeColaborador = async (colaboradorId) => {
  // //   console.log("colaboradorId", colaboradorId);
  //   try {
  //     const { data, error } = await supabaseStudentClient
  //       .from('colaboradores_bienestar')
  //       .update({ estado: 'inactivo' })
  //       .eq('id', colaboradorId)
  //       .select();
  
  //     if (error) throw error;
  //     return data[0];
  //   } catch (error) {
  //     console.error('Error al eliminar colaborador:', error);
  //     throw error;
  //   }
  // };


// /**
//  * Añadir colaborador a un grupo
//  * @param {Object} params - Parámetros de la función
//  * @param {number} params.grupoId - ID del grupo
//  * @param {number} params.profesionalId - ID del profesional (tabla bienestar.profesionales)
//  * @param {string} params.personalMcId - UUID del personal_mc
//  * @param {boolean} params.esLider - Indica si es líder del grupo
//  * @param {boolean} params.permisoAnadirColaborador - Indica si tiene permiso para añadir otros colaboradores
//  * @returns {Promise<Object>} Datos del colaborador creado o reactivado
//  */
// export const addColaboradorGrupo = async ({ 
//   grupoId, 
//   profesionalId, 
//   personalMcId, 
//   esLider = false,
//   permisoAnadirColaborador = false 
// }) => {
//   // Validaciones de tipo de datos
// //   console.log("profesionalId", profesionalId);
// //   console.log("personalMcId", personalMcId);
// //   console.log("grupoId", grupoId);
// //   console.log("permisoAnadirColaborador", permisoAnadirColaborador);

//   if (!grupoId || isNaN(parseInt(grupoId))) {
//     console.error("❌ addColaboradorGrupo: grupoId inválido", grupoId);
//     throw new Error("ID de grupo inválido");
//   }
  
//   if (!profesionalId || isNaN(parseInt(profesionalId))) {
//     console.error("❌ addColaboradorGrupo: profesionalId inválido", profesionalId);
//     throw new Error("ID de profesional inválido");
//   }
  
//   if (!personalMcId || typeof personalMcId !== 'string') {
//     console.error("❌ addColaboradorGrupo: personalMcId inválido", personalMcId);
//     throw new Error("ID de personal MC inválido");
//   }

//   // Convertir a los tipos correctos para la base de datos
//   const numGrupoId = parseInt(grupoId, 10);
//   const numProfesionalId = parseInt(profesionalId, 10);
//   const boolEsLider = Boolean(esLider);
//   const boolPermisoAnadirColaborador = Boolean(permisoAnadirColaborador);
  
//   try {
//     // Primero verificar si ya existe un registro para este profesional en este grupo
// //     console.log("🔍 Verificando si el colaborador ya existe...");
//     const { data: existingData, error: existingError } = await supabaseStudentClient
//       .from('colaboradores_bienestar')
//       .select('*')
//       .eq('entidad_tipo', 'grupo')
//       .eq('entidad_id', numGrupoId)
//       .eq('profesional_id', numProfesionalId)
//       .maybeSingle(); // Recupera un solo registro, o null si no existe

//     if (existingError) {
//       console.error("❌ Error verificando colaborador existente:", existingError);
//       throw existingError;
//     }

//     // Si existe un registro previo, reactivarlo y actualizar permisos
//     if (existingData) {
// //       console.log("✅ Colaborador encontrado, reactivando:", existingData);
      
//       const { data: updatedData, error: updateError } = await supabaseStudentClient
//         .from('colaboradores_bienestar')
//         .update({ 
//           estado: 'activo',
//           personal_mc_id: personalMcId, // Actualizar por si ha cambiado
//           es_lider: boolEsLider, // Actualizar rol
//           permiso_anadir_colaborador: boolPermisoAnadirColaborador, // Actualizar permiso
//           fecha_asignacion: new Date().toISOString() // Actualizar fecha de asignación
//         })
//         .eq('id', existingData.id)
//         .select();

//       if (updateError) {
//         console.error("❌ Error reactivando colaborador:", updateError);
//         throw updateError;
//       }
      
// //       console.log("✅ Colaborador reactivado exitosamente:", updatedData?.[0]);
//       return updatedData?.[0] || existingData;
//     }
    
//     // Si no existe, crear nuevo registro
// //     console.log("📤 Añadiendo colaborador con datos:", {
//       entidad_tipo: 'grupo',
//       entidad_id: numGrupoId,
//       profesional_id: numProfesionalId,
//       personal_mc_id: personalMcId,
//       es_lider: boolEsLider,
//       permiso_anadir_colaborador: boolPermisoAnadirColaborador
//     });
    
//     const { data, error } = await supabaseStudentClient
//       .from('colaboradores_bienestar')
//       .insert([{
//         entidad_tipo: 'grupo',
//         entidad_id: numGrupoId,
//         profesional_id: numProfesionalId,
//         personal_mc_id: personalMcId,
//         es_lider: boolEsLider,
//         permiso_anadir_colaborador: boolPermisoAnadirColaborador,
//         estado: 'activo' // Asegurarse de que el nuevo registro esté activo
//       }])
//       .select();

//     if (error) {
//       console.error("❌ Error de Supabase al añadir colaborador:", error);
//       // Mejorar el mensaje de error para problemas comunes
//       if (error.code === '23505') {
//         throw new Error("Este profesional ya es colaborador de este grupo y no se pudo reactivar");
//       } else if (error.code === '23503') {
//         throw new Error("Referencia inválida: Verifica que los IDs sean correctos");
//       } else {
//         throw error;
//       }
//     }
    
//     if (!data || data.length === 0) {
//       console.error("❌ No se recibieron datos al crear colaborador");
//       throw new Error("No se pudo crear el colaborador");
//     }
    
// //     console.log("✅ Colaborador añadido exitosamente:", data[0]);
//     return data[0];
//   } catch (error) {
//     console.error('❌ Error completo al añadir colaborador:', error);
//     // Reenviar el error con mejor mensaje
//     throw error.message ? error : new Error("Error al añadir colaborador: " + JSON.stringify(error));
//   }
// };
  
  /**
   * Eliminar colaborador permanentemente
   * @param {number} colaboradorId - ID del colaborador
   * @returns {Promise<Object>} Resultado de la operación
   */
  export const deleteColaborador = async (colaboradorId) => {
    try {
      const { data, error } = await supabaseStudentClient
        .from('colaboradores_bienestar')
        .delete()
        .eq('id', colaboradorId);
  
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error al eliminar colaborador permanentemente:', error);
      throw error;
    }
  };
  
  /**
   * Verificar si un profesional es colaborador de una entidad
   * @param {Object} params - Parámetros de la función
   * @param {string} params.entidadTipo - Tipo de entidad ('caso' o 'grupo')
   * @param {number} params.entidadId - ID de la entidad
   * @param {number} params.profesionalId - ID del profesional
   * @returns {Promise<boolean>} True si es colaborador, False si no
   */
  export const esColaborador = async ({ entidadTipo, entidadId, profesionalId }) => {
    try {
      const { data, error, count } = await supabaseStudentClient
        .from('colaboradores_bienestar')
        .select('*', { count: 'exact', head: true })
        .eq('entidad_tipo', entidadTipo)
        .eq('entidad_id', entidadId)
        .eq('profesional_id', profesionalId)
        .eq('estado', 'activo');
  
      if (error) throw error;
      return count > 0;
    } catch (error) {
      console.error('Error al verificar colaborador:', error);
      return false;
    }
  };
  
  /**
   * Verificar si un usuario personal_mc es colaborador de una entidad
   * @param {Object} params - Parámetros de la función
   * @param {string} params.entidadTipo - Tipo de entidad ('caso' o 'grupo')
   * @param {number} params.entidadId - ID de la entidad
   * @param {string} params.personalMcId - UUID del personal_mc
   * @returns {Promise<boolean>} True si es colaborador, False si no
   */
  export const esColaboradorPersonalMc = async ({ entidadTipo, entidadId, personalMcId }) => {
    try {
      const { data, error, count } = await supabaseStudentClient
        .from('colaboradores_bienestar')
        .select('*', { count: 'exact', head: true })
        .eq('entidad_tipo', entidadTipo)
        .eq('entidad_id', entidadId)
        .eq('personal_mc_id', personalMcId)
        .eq('estado', 'activo');
  
      if (error) throw error;
      return count > 0;
    } catch (error) {
      console.error('Error al verificar colaborador personal_mc:', error);
      return false;
    }
  };
  
  /**
   * Obtener todas las entidades en las que colabora un profesional
   * @param {number} profesionalId - ID del profesional
   * @returns {Promise<Object>} Objeto con listas de entidades por tipo
   */
  export const fetchEntidadesColaborador = async (profesionalId) => {
    try {
      const { data, error } = await supabaseStudentClient
        .from('colaboradores_bienestar')
        .select('entidad_tipo, entidad_id')
        .eq('profesional_id', profesionalId)
        .eq('estado', 'activo');
  
      if (error) throw error;
      
      // Organizar por tipo de entidad
      const resultado = {
        casos: [],
        grupos: []
      };
      
      data.forEach(item => {
        if (item.entidad_tipo === 'caso') {
          resultado.casos.push(item.entidad_id);
        } else if (item.entidad_tipo === 'grupo') {
          resultado.grupos.push(item.entidad_id);
        }
      });
      
      return resultado;
    } catch (error) {
      console.error('Error al obtener entidades del colaborador:', error);
      throw error;
    }
  };
  
  /**
   * Obtener todas las entidades en las que colabora un usuario personal_mc
   * @param {string} personalMcId - UUID del personal_mc
   * @returns {Promise<Object>} Objeto con listas de entidades por tipo
   */
  export const fetchEntidadesColaboradorPersonalMc = async (personalMcId) => {
    try {
      const { data, error } = await supabaseStudentClient
        .from('colaboradores_bienestar')
        .select('entidad_tipo, entidad_id')
        .eq('personal_mc_id', personalMcId)
        .eq('estado', 'activo');
  
      if (error) throw error;
      
      // Organizar por tipo de entidad
      const resultado = {
        casos: [],
        grupos: []
      };
      
      data.forEach(item => {
        if (item.entidad_tipo === 'caso') {
          resultado.casos.push(item.entidad_id);
        } else if (item.entidad_tipo === 'grupo') {
          resultado.grupos.push(item.entidad_id);
        }
      });
      
      return resultado;
    } catch (error) {
      console.error('Error al obtener entidades del colaborador personal_mc:', error);
      throw error;
    }
  };


  





  /**
   * NUEVA SECCIÓN DE FUNCIONES DE COLABORADORES PARA CASOS
   */

  /**
 * Obtener la lista de colaboradores de un caso específico
 * @param {number} casoId - ID del caso
 * @returns {Promise<Array>} - Array de colaboradores
 */
export const fetchCaseCollaborators = async (casoId) => {
  try {
    // console.log("📥 Obteniendo colaboradores del caso:", casoId);
    
    if (!casoId) {
      console.error("❌ fetchCaseCollaborators: ID de caso inválido");
      return [];
    }
    
    // Obtener el caso con los colaboradores
    const { data: caso, error } = await supabaseStudentClient
      .from("casos")
      .select("colaboradores")
      .eq("id", casoId)
      .single();
      
    if (error) {
      console.error("❌ Error obteniendo caso:", error);
      throw error;
    }
    
    // Si no tiene colaboradores o el campo no existe
    if (!caso || !caso.colaboradores) {
      // console.log("ℹ️ El caso no tiene colaboradores");
      return [];
    }
    
    // console.log("✅ Colaboradores obtenidos:", caso.colaboradores);
    
    // Filtrar solo colaboradores activos
    const colaboradoresActivos = Array.isArray(caso.colaboradores) 
      ? caso.colaboradores.filter(c => c.activo !== false) 
      : [];
      
    // Enriquecer con datos adicionales si es necesario (nombres, etc.)
    if (colaboradoresActivos.length > 0) {
      // Obtener IDs únicos de profesionales y personal_mc para consultas
      const personalMcIds = [...new Set(colaboradoresActivos
        .map(c => c.personal_mc_uuid)
        .filter(Boolean))];
        
      const profesionalIds = [...new Set(colaboradoresActivos
        .map(c => c.profesional_id)
        .filter(Boolean))];
      
      // Datos de profesionales
      let profesionalesData = [];
      if (profesionalIds.length > 0) {
        const { data: profData, error: profError } = await supabaseStudentClient
          .from("profesionales")
          .select(`
            id,
            nombre,
            especialidad,
            categorias(id, nombre)
          `)
          .in("id", profesionalIds);
          
        if (!profError) {
          profesionalesData = profData || [];
        } else {
          console.error("❌ Error obteniendo datos de profesionales:", profError);
        }
      }
      
      // Datos de personal_mc
      let personalMcData = [];
      if (personalMcIds.length > 0) {
        const { data: personalData, error: personalError } = await supabaseStudentClient
          .from("personal_mc")
          .select("uuid, primer_nombre, primer_apellido")
          .in("uuid", personalMcIds);
          
        if (!personalError) {
          personalMcData = personalData || [];
        } else {
          console.error("❌ Error obteniendo datos de personal_mc:", personalError);
        }
      }
      
      // Crear mapas para búsqueda rápida
      const profesionalesMap = profesionalesData.reduce((acc, p) => {
        acc[p.id] = p;
        return acc;
      }, {});
      
      const personalMcMap = personalMcData.reduce((acc, p) => {
        acc[p.uuid] = p;
        return acc;
      }, {});
      
      // Enriquecer cada colaborador con información adicional
      const colaboradoresEnriquecidos = colaboradoresActivos.map(colab => {
        const profesional = profesionalesMap[colab.profesional_id] || null;
        const personalMc = personalMcMap[colab.personal_mc_uuid] || null;
        
        return {
          ...colab,
          id: colab.profesional_id, // Usar profesional_id como identificador único
          profesional_id: profesional,
          personal_mc: personalMc,
          // Preservar otros campos importantes
          es_lider: colab.es_lider || false,
          permiso_anadir_colaborador: colab.permiso_anadir_colaborador || false,
          fecha_asignacion: colab.fecha_asignacion || new Date().toISOString()
        };
      });
      
      // console.log("✅ Colaboradores enriquecidos:", colaboradoresEnriquecidos);
      return colaboradoresEnriquecidos;
    }
    
    return colaboradoresActivos;
  } catch (error) {
    console.error("❌ Error en fetchCaseCollaborators:", error);
    return [];
  }
};

// /**
//  * Añadir un colaborador a un caso
//  * @param {Object} params - Parámetros para añadir colaborador
//  * @param {number} params.casoId - ID del caso
//  * @param {number} params.profesionalId - ID del profesional
//  * @param {string} params.personalMcId - UUID del personal_mc
//  * @param {boolean} params.esLider - Si es líder del caso
//  * @param {boolean} params.permisoAnadirColaborador - Si puede añadir colaboradores
//  * @returns {Promise<Object>} - Resultado de la operación
//  */
// export const addCaseCollaborator = async ({ 
//   casoId, 
//   profesionalId, 
//   personalMcId, 
//   esLider = false,
//   permisoAnadirColaborador = false 
// }) => {
//   try {
// //     console.log("📤 Añadiendo colaborador al caso:", {
//       casoId, profesionalId, personalMcId, esLider, permisoAnadirColaborador
//     });
    
//     // Validaciones básicas
//     if (!casoId || isNaN(parseInt(casoId))) {
//       throw new Error("ID de caso inválido");
//     }
    
//     if (!profesionalId || isNaN(parseInt(profesionalId))) {
//       throw new Error("ID de profesional inválido");
//     }
    
//     if (!personalMcId || typeof personalMcId !== 'string') {
//       throw new Error("ID de personal MC inválido");
//     }
    
//     // Convertir a tipos adecuados
//     const numCasoId = parseInt(casoId, 10);
//     const numProfesionalId = parseInt(profesionalId, 10);
//     const boolEsLider = Boolean(esLider);
//     const boolPermisoAnadirColaborador = Boolean(permisoAnadirColaborador);
    
//     // Obtener los colaboradores actuales
//     const { data: caso, error: getError } = await supabaseStudentClient
//       .from("casos")
//       .select("colaboradores")
//       .eq("id", numCasoId)
//       .single();
      
//     if (getError) {
//       console.error("❌ Error obteniendo caso:", getError);
//       throw getError;
//     }
    
//     // Lista actual de colaboradores (o array vacío si no hay)
//     const colaboradoresActuales = caso?.colaboradores || [];
    
//     // Verificar si el profesional ya es colaborador
//     const colaboradorExistente = Array.isArray(colaboradoresActuales) ? 
//       colaboradoresActuales.find(c => c.profesional_id === numProfesionalId) : null;
      
//     if (colaboradorExistente) {
//       // Si existe pero está inactivo, reactivarlo
//       if (colaboradorExistente.activo === false) {
//         const colaboradoresActualizados = colaboradoresActuales.map(c => {
//           if (c.profesional_id === numProfesionalId) {
//             return {
//               ...c,
//               es_lider: boolEsLider,
//               permiso_anadir_colaborador: boolPermisoAnadirColaborador,
//               fecha_asignacion: new Date().toISOString(),
//               activo: true // Reactivar
//             };
//           }
//           return c;
//         });
        
//         // Guardar colaboradores actualizados
//         const { data: updateResult, error: updateError } = await supabaseStudentClient
//           .from("casos")
//           .update({ colaboradores: colaboradoresActualizados })
//           .eq("id", numCasoId)
//           .select("colaboradores");
          
//         if (updateError) {
//           console.error("❌ Error reactivando colaborador:", updateError);
//           throw updateError;
//         }
        
// //         console.log("✅ Colaborador reactivado:", updateResult);
        
//         // Encontrar el colaborador reactivado
//         const colaboradorReactivado = Array.isArray(updateResult?.colaboradores) ? 
//           updateResult.colaboradores.find(c => c.profesional_id === numProfesionalId) : null;
          
//         return colaboradorReactivado || { message: "Colaborador reactivado con éxito" };
//       }
      
//       // Si ya está activo, lanzar error
//       throw new Error("El profesional ya es colaborador activo en este caso");
//     }
    
//     // Crear nuevo colaborador
//     const nuevoColaborador = {
//       profesional_id: numProfesionalId,
//       personal_mc_uuid: personalMcId,
//       es_lider: boolEsLider,
//       permiso_anadir_colaborador: boolPermisoAnadirColaborador,
//       fecha_asignacion: new Date().toISOString(),
//       activo: true
//     };
    
//     const nuevosColaboradores = [...colaboradoresActuales, nuevoColaborador];
    
//     // Guardar colaboradores actualizados
//     const { data: updateResult, error: updateError } = await supabaseStudentClient
//       .from("casos")
//       .update({ colaboradores: nuevosColaboradores })
//       .eq("id", numCasoId)
//       .select("colaboradores");
      
//     if (updateError) {
//       console.error("❌ Error añadiendo nuevo colaborador:", updateError);
//       throw updateError;
//     }
    
// //     console.log("✅ Nuevo colaborador añadido:", updateResult);
    
//     // Encontrar el colaborador recién añadido
//     const colaboradorCreado = Array.isArray(updateResult?.colaboradores) ? 
//       updateResult.colaboradores.find(c => c.profesional_id === numProfesionalId) : null;
      
//     return colaboradorCreado || nuevoColaborador;
//   } catch (error) {
//     console.error("❌ Error en addCaseCollaborator:", error);
//     throw error;
//   }
// };

// /**
//  * Eliminar colaborador de un caso (marcar como inactivo)
//  * @param {Object} params - Parámetros para eliminar colaborador 
//  * @param {number} params.casoId - ID del caso
//  * @param {number} params.profesionalId - ID del profesional a eliminar
//  * @returns {Promise<Object>} - Resultado de la operación
//  */
// export const removeCaseCollaborator = async ({ casoId, profesionalId }) => {
//   try {
// //     console.log("🗑️ Eliminando colaborador:", { casoId, profesionalId });
    
//     if (!casoId || !profesionalId) {
//       throw new Error("Se requieren ID de caso y profesional");
//     }
    
//     // Obtener los colaboradores actuales
//     const { data: caso, error: getError } = await supabaseStudentClient
//       .from("casos")
//       .select("colaboradores")
//       .eq("id", casoId)
//       .single();
      
//     if (getError) {
//       console.error("❌ Error obteniendo caso:", getError);
//       throw getError;
//     }
    
//     // Lista actual de colaboradores (o array vacío si no hay)
//     const colaboradoresActuales = caso?.colaboradores || [];
    
//     // Verificar si el profesional es colaborador
//     const existeColaborador = Array.isArray(colaboradoresActuales) ? 
//       colaboradoresActuales.some(c => c.profesional_id === profesionalId) : false;
      
//     if (!existeColaborador) {
//       throw new Error("El profesional no es colaborador de este caso");
//     }
    
//     // Marcar como inactivo el colaborador
//     const colaboradoresActualizados = colaboradoresActuales.map(c => {
//       if (c.profesional_id === profesionalId) {
//         return {
//           ...c,
//           activo: false
//         };
//       }
//       return c;
//     });
    
//     // Guardar colaboradores actualizados
//     const { data: updateResult, error: updateError } = await supabaseStudentClient
//       .from("casos")
//       .update({ colaboradores: colaboradoresActualizados })
//       .eq("id", casoId)
//       .select();
      
//     if (updateError) {
//       console.error("❌ Error desactivando colaborador:", updateError);
//       throw updateError;
//     }
    
// //     console.log("✅ Colaborador desactivado:", updateResult);
//     return { success: true, message: "Colaborador eliminado con éxito" };
//   } catch (error) {
//     console.error("❌ Error en removeCaseCollaborator:", error);
//     throw error;
//   }
// };

// /**
//  * Verifica los permisos de un profesional en un caso
//  * @param {number} casoId - ID del caso
//  * @param {string|number} profesionalId - ID del profesional (puede ser número o UUID)
//  * @returns {Promise<Object>} - Objeto con permisos
//  */
// export const checkCaseCollaboratorPermissions = async (casoId, profesionalId) => {
//   try {
// //     console.log("🔒 Verificando permisos:", { casoId, profesionalId });
    
//     if (!casoId || !profesionalId) {
//       return {
//         es_colaborador: false,
//         es_lider: false,
//         permiso_anadir_colaborador: false,
//         error: "Se requieren ID de caso y profesional"
//       };
//     }
    
//     // Convertir el casoId a número si es string
//     const numericCasoId = typeof casoId === "string" ? parseInt(casoId, 10) : casoId;
    
//     // Para el profesionalId, distinguimos si es un UUID o un ID numérico
//     const isUuid = typeof profesionalId === "string" && 
//                   (profesionalId.includes("-") || /[a-zA-Z]/.test(profesionalId));
    
//     let numericProfesionalId = null;
//     if (!isUuid) {
//       // Solo convertir a número si NO es un UUID
//       numericProfesionalId = typeof profesionalId === "string" ? 
//                             parseInt(profesionalId, 10) : parseInt(profesionalId);
//     }
    
//     // Verificar si es profesional principal del caso
//     const { data: caso, error: casoError } = await supabaseStudentClient
//       .from("casos")
//       .select("profesional_principal_id, colaboradores")
//       .eq("id", numericCasoId)
//       .maybeSingle();
      
//     if (casoError) {
//       console.error("❌ Error consultando caso:", casoError);
//       return {
//         es_colaborador: false,
//         es_lider: false,
//         permiso_anadir_colaborador: false,
//         error: casoError.message
//       };
//     }
    
//     // Solo comparar como profesional principal si no es UUID
//     if (!isUuid) {
//       // Si es el profesional principal del caso, tiene todos los permisos
//       const profesionalPrincipalId = parseInt(caso?.profesional_principal_id);
      
//       if (caso && profesionalPrincipalId === numericProfesionalId) {
// //         console.log("✅ Es el profesional principal del caso, tiene todos los permisos");
//         return {
//           es_colaborador: true,
//           es_lider: true,
//           permiso_anadir_colaborador: true,
//           es_profesional_principal: true
//         };
//       }
//     }
    
//     // Verificar si es colaborador con permisos
//     if (caso && Array.isArray(caso.colaboradores)) {
//       let colaboradorEncontrado = null;
      
//       for (const c of caso.colaboradores) {
//         const isActive = c.activo !== false;
        
//         if (isUuid) {
//           // Comparar con personal_mc_uuid si es un UUID
//           if (c.personal_mc_uuid === profesionalId && isActive) {
//             colaboradorEncontrado = c;
//             break;
//           }
//         } else {
//           // Comparar con profesional_id si es un ID numérico
//           let profId = c.profesional_id;
          
//           // Asegurarse de que estamos comparando números con números
//           if (typeof profId === 'object' && profId !== null) {
//             profId = parseInt(profId.id);
//           } else {
//             profId = parseInt(profId);
//           }
          
//           if (profId === numericProfesionalId && isActive) {
//             colaboradorEncontrado = c;
//             break;
//           }
//         }
//       }
      
//       if (colaboradorEncontrado) {
//         // Verificar explícitamente el valor de permiso_anadir_colaborador
//         let tienePermiso = false;
        
//         if (colaboradorEncontrado.permiso_anadir_colaborador === true || 
//             colaboradorEncontrado.permiso_anadir_colaborador === 1 || 
//             colaboradorEncontrado.permiso_anadir_colaborador === "true") {
//           tienePermiso = true;
//         }
        
//         return {
//           es_colaborador: true,
//           es_lider: !!colaboradorEncontrado.es_lider,
//           permiso_anadir_colaborador: tienePermiso,
//           collaborator_details: colaboradorEncontrado // Útil para depuración
//         };
//       }
//     }
    
//     // No es ni profesional principal ni colaborador
//     return {
//       es_colaborador: false,
//       es_lider: false,
//       permiso_anadir_colaborador: false
//     };
//   } catch (error) {
//     console.error("❌ Error en checkCaseCollaboratorPermissions:", error);
//     return {
//       es_colaborador: false,
//       es_lider: false,
//       permiso_anadir_colaborador: false,
//       error: error.message
//     };
//   }
// };


/**
 * FUNCIONES DE COLABORACIÓN CORREGIDAS
 * Ajustadas para usar schema bienestar y estructura de datos actual
 */

/**
 * Añadir un colaborador a un caso
 * @param {Object} params - Parámetros para añadir colaborador
 * @param {number} params.casoId - ID del caso
 * @param {number} params.profesionalId - ID del profesional
 * @param {string} params.personalMcId - UUID del personal_mc
 * @param {boolean} params.esLider - Si es líder del caso
 * @param {boolean} params.permisoAnadirColaborador - Si puede añadir colaboradores
 * @returns {Promise<Object>} - Resultado de la operación
 */
export const addCaseCollaborator = async ({ 
  casoId, 
  profesionalId, 
  personalMcId, 
  esLider = false,
  permisoAnadirColaborador = false 
}) => {
  try {
    // console.log("📤 Añadiendo colaborador al caso:", {
    //   casoId, profesionalId, personalMcId, esLider, permisoAnadirColaborador
    // });
    
    // Validaciones básicas
    if (!casoId || isNaN(parseInt(casoId))) {
      throw new Error("ID de caso inválido");
    }
    
    if (!profesionalId || isNaN(parseInt(profesionalId))) {
      throw new Error("ID de profesional inválido");
    }
    
    if (!personalMcId || typeof personalMcId !== 'string') {
      throw new Error("ID de personal MC inválido");
    }
    
    // Convertir a tipos adecuados
    const numCasoId = parseInt(casoId, 10);
    const numProfesionalId = parseInt(profesionalId, 10);
    const boolEsLider = Boolean(esLider);
    const boolPermisoAnadirColaborador = Boolean(permisoAnadirColaborador);
    
    // Obtener los colaboradores actuales desde el schema bienestar
    const { data: caso, error: getError } = await supabaseStudentClient
      .from("casos")
      .select("colaboradores")
      .eq("id", numCasoId)
      .single();
      
    if (getError) {
      console.error("❌ Error obteniendo caso:", getError);
      throw getError;
    }
    
    // Lista actual de colaboradores (manejar diferentes tipos de datos)
    let colaboradoresActuales = [];
    
    if (caso?.colaboradores) {
      if (Array.isArray(caso.colaboradores)) {
        colaboradoresActuales = caso.colaboradores;
      } else if (typeof caso.colaboradores === 'string') {
        try {
          colaboradoresActuales = JSON.parse(caso.colaboradores);
        } catch (e) {
          console.error("❌ Error parsing colaboradores:", e);
          colaboradoresActuales = [];
        }
      } else if (typeof caso.colaboradores === 'object') {
        colaboradoresActuales = [caso.colaboradores];
      }
    }
    
    // console.log("📊 Colaboradores actuales:", colaboradoresActuales);
    
    // Verificar si el profesional ya es colaborador (buscar por ambos campos)
    const colaboradorExistente = colaboradoresActuales.find(c => 
      c.profesional_id === numProfesionalId || 
      c.personal_mc_uuid === personalMcId
    );
      
    if (colaboradorExistente) {
      // Si existe pero está inactivo, reactivarlo
      if (colaboradorExistente.activo === false) {
        const colaboradoresActualizados = colaboradoresActuales.map(c => {
          if (c.profesional_id === numProfesionalId || c.personal_mc_uuid === personalMcId) {
            return {
              ...c,
              profesional_id: numProfesionalId, // Asegurar que tenga el ID correcto
              personal_mc_uuid: personalMcId,   // Asegurar que tenga el UUID correcto
              es_lider: boolEsLider,
              permiso_anadir_colaborador: boolPermisoAnadirColaborador,
              fecha_asignacion: new Date().toISOString(),
              fecha_reactivacion: new Date().toISOString(),
              activo: true // Reactivar
            };
          }
          return c;
        });
        
        // Guardar colaboradores actualizados
        const { data: updateResult, error: updateError } = await supabaseStudentClient
  
          .from("casos")
          .update({ colaboradores: colaboradoresActualizados })
          .eq("id", numCasoId)
          .select("colaboradores");
          
        if (updateError) {
          console.error("❌ Error reactivando colaborador:", updateError);
          throw updateError;
        }
        
        // console.log("✅ Colaborador reactivado:", updateResult);
        
        // Encontrar el colaborador reactivado
        const colaboradorReactivado = Array.isArray(updateResult?.[0]?.colaboradores) ? 
          updateResult[0].colaboradores.find(c => 
            c.profesional_id === numProfesionalId || c.personal_mc_uuid === personalMcId
          ) : null;
          
        return colaboradorReactivado || { 
          message: "Colaborador reactivado con éxito",
          profesional_id: numProfesionalId,
          personal_mc_uuid: personalMcId
        };
      }
      
      // Si ya está activo, lanzar error
      throw new Error("El profesional ya es colaborador activo en este caso");
    }
    
    // Crear nuevo colaborador
    const nuevoColaborador = {
      profesional_id: numProfesionalId,
      personal_mc_uuid: personalMcId,
      es_lider: boolEsLider,
      permiso_anadir_colaborador: boolPermisoAnadirColaborador,
      fecha_asignacion: new Date().toISOString(),
      rol: boolEsLider ? 'lider' : 'colaborador',
      activo: true
    };
    
    const nuevosColaboradores = [...colaboradoresActuales, nuevoColaborador];
    
    // console.log("📊 Nuevos colaboradores a guardar:", nuevosColaboradores);
    
    // Guardar colaboradores actualizados
    const { data: updateResult, error: updateError } = await supabaseStudentClient
      .from("casos")
      .update({ colaboradores: nuevosColaboradores })
      .eq("id", numCasoId)
      .select("colaboradores");
      
    if (updateError) {
      console.error("❌ Error añadiendo nuevo colaborador:", updateError);
      throw updateError;
    }
    
    // console.log("✅ Nuevo colaborador añadido:", updateResult);
    
    // Encontrar el colaborador recién añadido
    const colaboradorCreado = Array.isArray(updateResult?.[0]?.colaboradores) ? 
      updateResult[0].colaboradores.find(c => 
        c.profesional_id === numProfesionalId && c.personal_mc_uuid === personalMcId
      ) : null;
      
    return colaboradorCreado || nuevoColaborador;
  } catch (error) {
    console.error("❌ Error en addCaseCollaborator:", error);
    throw error;
  }
};

/**
 * Eliminar colaborador de un caso (marcar como inactivo)
 * @param {Object} params - Parámetros para eliminar colaborador 
 * @param {number} params.casoId - ID del caso
 * @param {number|string} params.profesionalId - ID del profesional o UUID a eliminar
 * @returns {Promise<Object>} - Resultado de la operación
 */
export const removeCaseCollaborator = async ({ casoId, profesionalId }) => {
  try {
    // console.log("🗑️ Eliminando colaborador:", { casoId, profesionalId });
    
    if (!casoId || !profesionalId) {
      throw new Error("Se requieren ID de caso y profesional");
    }
    
    const numCasoId = parseInt(casoId);
    
    // Obtener los colaboradores actuales desde el schema bienestar
    const { data: caso, error: getError } = await supabaseStudentClient
      .from("casos")
      .select("colaboradores")
      .eq("id", numCasoId)
      .single();
      
    if (getError) {
      console.error("❌ Error obteniendo caso:", getError);
      throw getError;
    }
    
    // Procesar colaboradores actuales
    let colaboradoresActuales = [];
    
    if (caso?.colaboradores) {
      if (Array.isArray(caso.colaboradores)) {
        colaboradoresActuales = caso.colaboradores;
      } else if (typeof caso.colaboradores === 'string') {
        try {
          colaboradoresActuales = JSON.parse(caso.colaboradores);
        } catch (e) {
          console.error("❌ Error parsing colaboradores:", e);
          colaboradoresActuales = [];
        }
      } else if (typeof caso.colaboradores === 'object') {
        colaboradoresActuales = [caso.colaboradores];
      }
    }
    
    // Detectar si profesionalId es UUID o ID numérico
    const isUuid = typeof profesionalId === 'string' && 
                  (profesionalId.includes('-') || profesionalId.length > 10);
    
    // Verificar si el profesional es colaborador
    const existeColaborador = colaboradoresActuales.some(c => {
      if (isUuid) {
        return c.personal_mc_uuid === profesionalId;
      } else {
        return c.profesional_id === parseInt(profesionalId);
      }
    });
      
    if (!existeColaborador) {
      throw new Error("El profesional no es colaborador de este caso");
    }
    
    // Marcar como inactivo el colaborador
    const colaboradoresActualizados = colaboradoresActuales.map(c => {
      let esElColaborador = false;
      
      if (isUuid) {
        esElColaborador = c.personal_mc_uuid === profesionalId;
      } else {
        esElColaborador = c.profesional_id === parseInt(profesionalId);
      }
      
      if (esElColaborador) {
        return {
          ...c,
          activo: false,
          fecha_desactivacion: new Date().toISOString()
        };
      }
      return c;
    });
    
    // Guardar colaboradores actualizados
    const { data: updateResult, error: updateError } = await supabaseStudentClient
      .from("casos")
      .update({ colaboradores: colaboradoresActualizados })
      .eq("id", numCasoId)
      .select("id, colaboradores");
      
    if (updateError) {
      console.error("❌ Error desactivando colaborador:", updateError);
      throw updateError;
    }
    
    // console.log("✅ Colaborador desactivado:", updateResult);
    return { 
      success: true, 
      message: "Colaborador eliminado con éxito",
      caso_id: numCasoId,
      profesional_id: profesionalId
    };
  } catch (error) {
    console.error("❌ Error en removeCaseCollaborator:", error);
    throw error;
  }
};

/**
 * Verifica los permisos de un profesional en un caso
 * @param {number} casoId - ID del caso
 * @param {string|number} profesionalId - ID del profesional (puede ser número o UUID)
 * @returns {Promise<Object>} - Objeto con permisos
 */
export const checkCaseCollaboratorPermissions = async (casoId, profesionalId) => {
  try {
    // console.log("🔒 Verificando permisos:", { casoId, profesionalId });
    
    if (!casoId || !profesionalId) {
      return {
        es_colaborador: false,
        es_lider: false,
        permiso_anadir_colaborador: false,
        error: "Se requieren ID de caso y profesional"
      };
    }
    
    // Convertir el casoId a número si es string
    const numericCasoId = typeof casoId === "string" ? parseInt(casoId, 10) : casoId;
    
    // Para el profesionalId, distinguimos si es un UUID o un ID numérico
    const isUuid = typeof profesionalId === "string" && 
                  (profesionalId.includes("-") || /[a-zA-Z]/.test(profesionalId));
    
    let numericProfesionalId = null;
    if (!isUuid) {
      // Solo convertir a número si NO es un UUID
      numericProfesionalId = typeof profesionalId === "string" ? 
                            parseInt(profesionalId, 10) : parseInt(profesionalId);
    }
    
    // Verificar caso desde el schema bienestar
    const { data: caso, error: casoError } = await supabaseStudentClient
      .from("casos")
      .select("profesional_principal_id, colaboradores")
      .eq("id", numericCasoId)
      .maybeSingle();
      
    if (casoError) {
      console.error("❌ Error consultando caso:", casoError);
      return {
        es_colaborador: false,
        es_lider: false,
        permiso_anadir_colaborador: false,
        error: casoError.message
      };
    }
    
    if (!caso) {
      return {
        es_colaborador: false,
        es_lider: false,
        permiso_anadir_colaborador: false,
        error: "Caso no encontrado"
      };
    }
    
    // Solo comparar como profesional principal si no es UUID
    if (!isUuid && numericProfesionalId) {
      // Si es el profesional principal del caso, tiene todos los permisos
      const profesionalPrincipalId = parseInt(caso?.profesional_principal_id);
      
      if (profesionalPrincipalId === numericProfesionalId) {
        // console.log("✅ Es el profesional principal del caso, tiene todos los permisos");
        return {
          es_colaborador: true,
          es_lider: true,
          permiso_anadir_colaborador: true,
          es_profesional_principal: true
        };
      }
    }
    
    // Procesar colaboradores
    let colaboradoresArray = [];
    
    if (caso.colaboradores) {
      if (Array.isArray(caso.colaboradores)) {
        colaboradoresArray = caso.colaboradores;
      } else if (typeof caso.colaboradores === 'string') {
        try {
          colaboradoresArray = JSON.parse(caso.colaboradores);
        } catch (e) {
          console.error("❌ Error parsing colaboradores:", e);
          colaboradoresArray = [];
        }
      } else if (typeof caso.colaboradores === 'object') {
        colaboradoresArray = [caso.colaboradores];
      }
    }
    
    // Verificar si es colaborador con permisos
    if (Array.isArray(colaboradoresArray)) {
      let colaboradorEncontrado = null;
      
      for (const c of colaboradoresArray) {
        // Verificar que el colaborador esté activo
        const isActive = c.activo !== false;
        
        if (!isActive) continue;
        
        let esElColaborador = false;
        
        if (isUuid) {
          // Comparar con personal_mc_uuid si es un UUID
          esElColaborador = c.personal_mc_uuid === profesionalId;
        } else {
          // Comparar con profesional_id si es un ID numérico
          let profId = c.profesional_id;
          
          // Asegurarse de que estamos comparando números con números
          if (typeof profId === 'object' && profId !== null) {
            profId = parseInt(profId.id || profId);
          } else {
            profId = parseInt(profId);
          }
          
          esElColaborador = profId === numericProfesionalId;
        }
        
        if (esElColaborador) {
          colaboradorEncontrado = c;
          break;
        }
      }
      
      if (colaboradorEncontrado) {
        // Verificar explícitamente el valor de permiso_anadir_colaborador
        let tienePermiso = false;
        
        if (colaboradorEncontrado.permiso_anadir_colaborador === true || 
            colaboradorEncontrado.permiso_anadir_colaborador === 1 || 
            colaboradorEncontrado.permiso_anadir_colaborador === "true") {
          tienePermiso = true;
        }
        
        return {
          es_colaborador: true,
          es_lider: !!colaboradorEncontrado.es_lider,
          permiso_anadir_colaborador: tienePermiso,
          fecha_asignacion: colaboradorEncontrado.fecha_asignacion,
          rol: colaboradorEncontrado.rol || 'colaborador',
          collaborator_details: colaboradorEncontrado // Útil para depuración
        };
      }
    }
    
    // No es ni profesional principal ni colaborador
    return {
      es_colaborador: false,
      es_lider: false,
      permiso_anadir_colaborador: false
    };
  } catch (error) {
    console.error("❌ Error en checkCaseCollaboratorPermissions:", error);
    return {
      es_colaborador: false,
      es_lider: false,
      permiso_anadir_colaborador: false,
      error: error.message
    };
  }
};

/**
 * Obtiene casos donde el usuario es colaborador activo
 * @param {string} personalMcUuid - UUID del personal MC
 * @returns {Promise<Array>} - Lista de casos colaborativos
 */
export const fetchCollaborativeCases = async (personalMcUuid) => {
  try {
    // console.log("📥 Buscando casos colaborativos para UUID:", personalMcUuid);

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

    // console.log(`📊 Total de casos activos con colaboradores: ${casos?.length || 0}`);

    // 2. Filtrar casos donde el usuario es colaborador activo
    const casosColaborativos = casos?.filter(caso => {
      if (!caso.colaboradores) {
        return false;
      }
      
      // Manejar diferentes tipos de estructura de colaboradores
      let colaboradoresArray = [];
      
      if (Array.isArray(caso.colaboradores)) {
        colaboradoresArray = caso.colaboradores;
      } else if (typeof caso.colaboradores === 'string') {
        try {
          colaboradoresArray = JSON.parse(caso.colaboradores);
        } catch (e) {
          return false;
        }
      } else if (typeof caso.colaboradores === 'object') {
        colaboradoresArray = [caso.colaboradores];
      }
      
      // Verificar si el usuario está en los colaboradores y está activo
      return colaboradoresArray.some(colaborador => {
        if (typeof colaborador === 'string') {
          try {
            colaborador = JSON.parse(colaborador);
          } catch (e) {
            return false;
          }
        }
        
        return colaborador && 
               colaborador.personal_mc_uuid === personalMcUuid && 
               colaborador.activo === true;
      });
    }).map(caso => {
      // Procesar colaboradores para encontrar información del usuario actual
      let colaboradoresArray = [];
      
      if (Array.isArray(caso.colaboradores)) {
        colaboradoresArray = caso.colaboradores;
      } else if (typeof caso.colaboradores === 'string') {
        try {
          colaboradoresArray = JSON.parse(caso.colaboradores);
        } catch (e) {
          colaboradoresArray = [];
        }
      } else if (typeof caso.colaboradores === 'object') {
        colaboradoresArray = [caso.colaboradores];
      }
      
      // Encontrar la información del colaborador actual
      const colaboradorActual = colaboradoresArray.find(c => {
        if (typeof c === 'string') {
          try {
            c = JSON.parse(c);
          } catch (e) {
            return false;
          }
        }
        return c && c.personal_mc_uuid === personalMcUuid;
      });

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
          estado_colaboracion: colaboradorActual?.activo ? 'activo' : 'inactivo',
          permiso_anadir_colaborador: colaboradorActual?.permiso_anadir_colaborador || false
        }
      };
    }) || [];

    // console.log(`✅ Casos colaborativos encontrados: ${casosColaborativos.length}`);
    return casosColaborativos;
    
  } catch (error) {
    console.error("❌ Error al obtener casos colaborativos:", error);
    throw error;
  }
};

/**
 * FUNCIÓN HELPER: Obtener estadísticas de colaboración de un caso
 * @param {number} casoId - ID del caso
 * @returns {Promise<Object>} - Estadísticas de colaboración
 */
export const getCaseCollaborationStats = async (casoId) => {
  try {
    const { data: caso, error } = await supabaseStudentClient
      .from("casos")
      .select("colaboradores, profesional_principal_id")
      .eq("id", casoId)
      .single();

    if (error) {
      console.error("Error obteniendo estadísticas:", error);
      return null;
    }

    let colaboradoresArray = [];
    
    if (caso.colaboradores) {
      if (Array.isArray(caso.colaboradores)) {
        colaboradoresArray = caso.colaboradores;
      } else if (typeof caso.colaboradores === 'string') {
        try {
          colaboradoresArray = JSON.parse(caso.colaboradores);
        } catch (e) {
          colaboradoresArray = [];
        }
      } else if (typeof caso.colaboradores === 'object') {
        colaboradoresArray = [caso.colaboradores];
      }
    }

    const colaboradoresActivos = colaboradoresArray.filter(c => c.activo === true);
    const lideres = colaboradoresActivos.filter(c => c.es_lider === true);

    return {
      total_colaboradores: colaboradoresActivos.length,
      lideres: lideres.length,
      colaboradores_regulares: colaboradoresActivos.length - lideres.length,
      tiene_profesional_principal: !!caso.profesional_principal_id,
      profesional_principal_id: caso.profesional_principal_id
    };

  } catch (error) {
    console.error("Error en getCaseCollaborationStats:", error);
    return null;
  }
};