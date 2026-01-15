// config/supabase/bienestar/dashboardFetchFunctions.js

import { supabaseStudentClient } from "../supabaseCampusStudentClient";


/**
 * Obtener colaboradores de un caso
 * @param {number} casoId - ID del caso
 * @returns {Promise<Array>} Lista de colaboradores
 */
export const fetchColaboradoresCaso = async (casoId) => {
  try {
    // Obtener el caso con sus colaboradores
    const { data, error } = await supabaseStudentClient
      .from('casos')
      .select('colaboradores')
      .eq('id', casoId)
      .single();

    if (error) throw error;

    // Si no hay colaboradores, retornar array vacío
    if (!data?.colaboradores || !Array.isArray(data.colaboradores)) {
      return [];
    }

    // Obtener IDs de profesionales y personal_mc
    const profesionalIds = data.colaboradores
      .map(c => c.profesional_id)
      .filter(Boolean);
    
    const personalMcIds = data.colaboradores
      .map(c => c.personal_mc_uuid)
      .filter(Boolean);

    // Consultas paralelas para obtener datos relacionados
    const [profesionalesData, personalData] = await Promise.all([
      profesionalIds.length > 0 
        ? supabaseStudentClient
            .from('profesionales')
            .select(`
              id, nombre, especialidad,
              categoria:categorias(id, nombre)
            `)
            .in('id', profesionalIds)
        : Promise.resolve({ data: [] }),
      
      personalMcIds.length > 0
        ? supabaseStudentClient
            .from('personal_mc')
            .select('uuid, primer_nombre, primer_apellido')
            .in('uuid', personalMcIds)
        : Promise.resolve({ data: [] })
    ]);

    // Crear mapas para lookups rápidos
    const profesionalesMap = (profesionalesData.data || []).reduce((acc, prof) => {
      acc[prof.id] = prof;
      return acc;
    }, {});

    const personalMap = (personalData.data || []).reduce((acc, person) => {
      acc[person.uuid] = person;
      return acc;
    }, {});

    // Combinar datos
    return data.colaboradores.map(colaborador => ({
      ...colaborador,
      profesional: profesionalesMap[colaborador.profesional_id] || null,
      personal_mc: personalMap[colaborador.personal_mc_uuid] || null
    }));

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
  
  
  /**
   * Obtener colaboradores de un grupo
   * @param {number} grupoId - ID del grupo
   * @returns {Promise<Array>} Lista de colaboradores
   */
export const fetchColaboradoresGrupo = async (grupoId) => {
  try {
    console.log("📥 Iniciando fetchColaboradoresGrupo para grupoId:", grupoId);
    
    // Obtener el grupo con sus colaboradores
    const { data, error } = await supabaseStudentClient
      .from('grupos_bienestar')
      .select('colaboradores')
      .eq('id', grupoId)
      .single();

    if (error) throw error;

    // Si no hay colaboradores, retornar array vacío
    if (!data?.colaboradores || !Array.isArray(data.colaboradores)) {
      console.log("ℹ️ No hay colaboradores para este grupo");
      return [];
    }

    // Obtener IDs únicos
    const profesionalIds = data.colaboradores
      .map(c => c.profesional_id)
      .filter(Boolean);
    
    const personalMcIds = data.colaboradores
      .map(c => c.personal_mc_uuid)
      .filter(Boolean);

    // Consultas paralelas
    const [profesionalesData, personalData] = await Promise.all([
      profesionalIds.length > 0 
        ? supabaseStudentClient
            .from('profesionales')
            .select(`
              id, nombre, especialidad,
              categoria:categorias(id, nombre)
            `)
            .in('id', profesionalIds)
        : Promise.resolve({ data: [] }),
      
      personalMcIds.length > 0
        ? supabaseStudentClient
            .from('personal_mc')
            .select('uuid, primer_nombre, primer_apellido')
            .in('uuid', personalMcIds)
        : Promise.resolve({ data: [] })
    ]);

    // Crear mapas
    const profesionalesMap = (profesionalesData.data || []).reduce((acc, prof) => {
      acc[prof.id] = prof;
      return acc;
    }, {});

    const personalMap = (personalData.data || []).reduce((acc, person) => {
      acc[person.uuid] = person;
      return acc;
    }, {});

    // Combinar datos
    const colaboradoresCompletos = data.colaboradores.map(colaborador => ({
      ...colaborador,
      profesional: profesionalesMap[colaborador.profesional_id] || null,
      personal_mc: personalMap[colaborador.personal_mc_uuid] || null
    }));

    console.log("✅ Datos combinados de colaboradores:", colaboradoresCompletos);
    return colaboradoresCompletos;

  } catch (error) {
    console.error('❌ Error al obtener colaboradores del grupo:', error);
    throw error;
  }
};





// export const fetchAllRemisiones = async () => {
//     try {
//       //console.log("Iniciando fetchRemisiones...");
  
//       const { data: remisiones, error: remisionesError } =
//         await supabaseStudentClient
//           .from("remisiones")
//           .select(
//             `
//           *,
//           estudiantes (
//             codigo_estudiante,
//             primer_nombre,
//             primer_apellido,
//             grado
//           ),
//           categorias (
//             id,
//             nombre
//           ),
//           tipologia_remision (
//             id,
//             title
//           )
//         `
//           )
//           .order("fecha_creacion", { ascending: false });
  
//       if (remisionesError) {
//         console.error("Error al obtener remisiones:", remisionesError);
//         throw remisionesError;
//       }
  
//       //console.log("Remisiones raw:", remisiones);
  
//       // Fetch casos for each remision
//       const remisionesWithCases = await Promise.all(
//         remisiones.map(async (remision) => {
//           const { data: casos } = await supabaseStudentClient
//             .from("casos")
//             .select("*")
//             .eq("codigo_estudiante", remision.codigo_estudiante)
//             .eq("categoria_id", remision.categoria_id)
//             .eq("estado", "por iniciar");
  
//          // console.log(`Casos para remisión ${remision.id}:`, casos);
  
//           return {
//             ...remision,
//             tiene_caso_abierto: casos && casos.length > 0,
//           };
//         })
//       );
  
//       const remitentesIds = {
//         padres: [
//           ...new Set(
//             remisionesWithCases
//               .filter((r) => r.remitente_origen === "padres")
//               .map((r) => r.remitente_id)
//           ),
//         ],
//         profesionales: [
//           ...new Set(
//             remisionesWithCases
//               .filter((r) => r.remitente_origen === "profesionales")
//               .map((r) => r.remitente_id)
//           ),
//         ],
//         personal_mc: [
//           ...new Set(
//             remisionesWithCases
//               .filter((r) => r.remitente_origen === "personal_mc")
//               .map((r) => r.remitente_id)
//           ),
//         ],
//       };
  
//       //console.log("IDs remitentes:", remitentesIds);
  
//       const [padresData, profesionalesData, personalData] = await Promise.all([
//         remitentesIds.padres.length > 0
//           ? supabaseStudentClient
//               .from("padres")
//               .select("id, primer_nombre, primer_apellido")
//               .in("id", remitentesIds.padres)
//           : Promise.resolve({ data: [] }),
  
//         remitentesIds.profesionales.length > 0
//           ? supabaseStudentClient
//               .from("profesionales")
//               .select("id, nombre")
//               .in("id", remitentesIds.profesionales)
//           : Promise.resolve({ data: [] }),
  
//         remitentesIds.personal_mc.length > 0
//           ? supabaseStudentClient
//               .from("personal_mc")
//               .select("id, primer_nombre, primer_apellido")
//               .in("id", remitentesIds.personal_mc)
//           : Promise.resolve({ data: [] }),
//       ]);
  
//       const padresMap = Object.fromEntries(
//         (padresData.data || []).map((p) => [p.id, p])
//       );
//       const profesionalesMap = Object.fromEntries(
//         (profesionalesData.data || []).map((p) => [p.id, p])
//       );
//       const personalMap = Object.fromEntries(
//         (personalData.data || []).map((p) => [p.id, p])
//       );
  
//       console.log("Data maps:", {
//         padres: padresMap,
//         profesionales: profesionalesMap,
//         personal: personalMap,
//       });
  
//       const transformedData = remisionesWithCases.map((remision) => ({
//         ...remision,
//         remitente_nombre: (() => {
//           switch (remision.remitente_origen) {
//             case "padres": {
//               const padre = padresMap[remision.remitente_id];
//               return padre
//                 ? `${padre.primer_nombre} ${padre.primer_apellido}`
//                 : "Padre/Madre no encontrado";
//             }
//             case "profesionales": {
//               const profesional = profesionalesMap[remision.remitente_id];
//               return profesional
//                 ? profesional.nombre
//                 : "Profesional no encontrado";
//             }
//             case "personal_mc": {
//               const personal = personalMap[remision.remitente_id];
//               return personal
//                 ? `${personal.primer_nombre} ${personal.primer_apellido}`
//                 : "Personal no encontrado";
//             }
//             default:
//               return "Remitente no especificado";
//           }
//         })(),
//       }));
  
//       console.log("Datos finales:", transformedData);
//       return transformedData;
//     } catch (error) {
//       console.error("Error en fetchRemisiones:", error);
//       throw error;
//     }
//   };
  

// ✅ CORRECCIÓN: fetchAllRemisiones
export const fetchAllRemisiones = async () => {
  try {
    const { data: remisiones, error: remisionesError } = await supabaseStudentClient
      .from("remisiones")
      .select(`
        *,
        estudiantes (
          codigo_estudiante,
          primer_nombre,
          primer_apellido,
          grado
        ),
        categorias (
          id,
          nombre
        ),
        tipologia_remision (
          id,
          title
        )
      `)
      .order("fecha_creacion", { ascending: false });

    if (remisionesError) {
      console.error("Error al obtener remisiones:", remisionesError);
      throw remisionesError;
    }

    // Verificar casos existentes
    const remisionesWithCases = await Promise.all(
      remisiones.map(async (remision) => {
        const { data: casos } = await supabaseStudentClient
          .from("casos")
          .select("*")
          .eq("codigo_estudiante", remision.codigo_estudiante)
          .eq("categoria_id", remision.categoria_id)
          .eq("estado", "por iniciar");

        return {
          ...remision,
          tiene_caso_abierto: casos && casos.length > 0,
        };
      })
    );

    // Agrupar IDs por origen
    const remitentesIds = {
      padres: [...new Set(
        remisionesWithCases
          .filter(r => r.remitente_origen === "padres")
          .map(r => r.remitente_id)
      )],
      profesionales: [...new Set(
        remisionesWithCases
          .filter(r => r.remitente_origen === "profesionales")
          .map(r => r.remitente_id)
      )],
      personal_mc: [...new Set(
        remisionesWithCases
          .filter(r => r.remitente_origen === "personal_mc")
          .map(r => r.remitente_id)
      )],
    };

    // Consultas paralelas optimizadas
    const [padresData, profesionalesData, personalData] = await Promise.all([
      remitentesIds.padres.length > 0
        ? supabaseStudentClient
            .from("padres")
            .select("id, primer_nombre, primer_apellido")
            .in("id", remitentesIds.padres)
        : Promise.resolve({ data: [] }),

      remitentesIds.profesionales.length > 0
        ? supabaseStudentClient
            .from("profesionales")
            .select("id, nombre")
            .in("id", remitentesIds.profesionales)
        : Promise.resolve({ data: [] }),

      remitentesIds.personal_mc.length > 0
        ? supabaseStudentClient
            .from("personal_mc")
            .select("id, primer_nombre, primer_apellido") // ✅ Corregido: usar id, no uuid
            .in("id", remitentesIds.personal_mc)
        : Promise.resolve({ data: [] }),
    ]);

    // Crear mapas de lookup
    const padresMap = Object.fromEntries(
      (padresData.data || []).map(p => [p.id, p])
    );
    const profesionalesMap = Object.fromEntries(
      (profesionalesData.data || []).map(p => [p.id, p])
    );
    const personalMap = Object.fromEntries(
      (personalData.data || []).map(p => [p.id, p])
    );

    // Transformar datos finales
    return remisionesWithCases.map(remision => ({
      ...remision,
      remitente_nombre: (() => {
        switch (remision.remitente_origen) {
          case "padres": {
            const padre = padresMap[remision.remitente_id];
            return padre
              ? `${padre.primer_nombre} ${padre.primer_apellido}`
              : "Padre/Madre no encontrado";
          }
          case "profesionales": {
            const profesional = profesionalesMap[remision.remitente_id];
            return profesional?.nombre || "Profesional no encontrado";
          }
          case "personal_mc": {
            const personal = personalMap[remision.remitente_id];
            return personal
              ? `${personal.primer_nombre} ${personal.primer_apellido}`
              : "Personal no encontrado";
          }
          default:
            return "Remitente no especificado";
        }
      })(),
    }));

  } catch (error) {
    console.error("Error en fetchAllRemisiones:", error);
    throw error;
  }
};


  export const fetchRemisiones = async () => {
    try {
      console.log("Iniciando fetchRemisiones...");
  
      const { data: remisiones, error: remisionesError } =
        await supabaseStudentClient
          .from("remisiones")
          .select(
            `
          *,
          estudiantes (
            codigo_estudiante,
            primer_nombre,
            primer_apellido,
            grado
          ),
          categorias (
            id,
            nombre
          ),
           tipologia_remision (
            id,
            title
          )
        `
          )
          .eq("caso_creado", "pendiente")
          .order("fecha_creacion", { ascending: false });
  
      if (remisionesError) {
        console.error("Error al obtener remisiones:", remisionesError);
        throw remisionesError;
      }
  
      console.log("Remisiones raw:", remisiones);
  
      // Fetch casos for each remision
      const remisionesWithCases = await Promise.all(
        remisiones.map(async (remision) => {
          const { data: casos } = await supabaseStudentClient
            .from("casos")
            .select("*")
            .eq("codigo_estudiante", remision.codigo_estudiante)
            .eq("categoria_id", remision.categoria_id)
            .eq("estado", "por iniciar");
  
          //console.log(`Casos para remisión ${remision.id}:`, casos);
  
          return {
            ...remision,
            tiene_caso_abierto: casos && casos.length > 0,
          };
        })
      );
  
      const remitentesIds = {
        padres: [
          ...new Set(
            remisionesWithCases
              .filter((r) => r.remitente_origen === "padres")
              .map((r) => r.remitente_id)
          ),
        ],
        profesionales: [
          ...new Set(
            remisionesWithCases
              .filter((r) => r.remitente_origen === "profesionales")
              .map((r) => r.remitente_id)
          ),
        ],
        personal_mc: [
          ...new Set(
            remisionesWithCases
              .filter((r) => r.remitente_origen === "personal_mc")
              .map((r) => r.remitente_id)
          ),
        ],
      };
  
      console.log("IDs remitentes:", remitentesIds);
  
      const [padresData, profesionalesData, personalData] = await Promise.all([
        remitentesIds.padres.length > 0
          ? supabaseStudentClient
              .from("padres")
              .select("id, primer_nombre, primer_apellido")
              .in("id", remitentesIds.padres)
          : Promise.resolve({ data: [] }),
  
        remitentesIds.profesionales.length > 0
          ? supabaseStudentClient
              .from("profesionales")
              .select("id, nombre")
              .in("id", remitentesIds.profesionales)
          : Promise.resolve({ data: [] }),
  
        remitentesIds.personal_mc.length > 0
          ? supabaseStudentClient
              .from("personal_mc")
              .select("id, primer_nombre, primer_apellido")
              .in("id", remitentesIds.personal_mc)
          : Promise.resolve({ data: [] }),
      ]);
  
      const padresMap = Object.fromEntries(
        (padresData.data || []).map((p) => [p.id, p])
      );
      const profesionalesMap = Object.fromEntries(
        (profesionalesData.data || []).map((p) => [p.id, p])
      );
      const personalMap = Object.fromEntries(
        (personalData.data || []).map((p) => [p.id, p])
      );
  
      console.log("Data maps:", {
        padres: padresMap,
        profesionales: profesionalesMap,
        personal: personalMap,
      });
  
      const transformedData = remisionesWithCases.map((remision) => ({
        ...remision,
        remitente_nombre: (() => {
          switch (remision.remitente_origen) {
            case "padres": {
              const padre = padresMap[remision.remitente_id];
              return padre
                ? `${padre.primer_nombre} ${padre.primer_apellido}`
                : "Padre/Madre no encontrado";
            }
            case "profesionales": {
              const profesional = profesionalesMap[remision.remitente_id];
              return profesional
                ? profesional.nombre
                : "Profesional no encontrado";
            }
            case "personal_mc": {
              const personal = personalMap[remision.remitente_id];
              return personal
                ? `${personal.primer_nombre} ${personal.primer_apellido}`
                : "Personal no encontrado";
            }
            default:
              return "Remitente no especificado";
          }
        })(),
      }));
  
      console.log("Datos finales:", transformedData);
      return transformedData;
    } catch (error) {
      console.error("Error en fetchRemisiones:", error);
      throw error;
    }
  };
  
  // export const fetchRemisionesRejected = async () => {
  //   try {
  //     const { data: remisiones, error: remisionesError } =
  //       await supabaseStudentClient
  //         .from("remisiones")
  //         .select(
  //           `
  //           *,
  //           estudiantes (
  //             codigo_estudiante,
  //             primer_nombre,
  //             primer_apellido,
  //             grado
  //           ),
  //           categorias (
  //             id,
  //             nombre
  //           ),
  //           profesional:profesionales!fk_asignado_a(
  //             id,
  //             nombre,
  //             especialidad
  //           )
  //         `
  //         )
  //         .order("fecha_creacion", { ascending: false });
  
  //     if (remisionesError) throw remisionesError;
  
  //     const transformedData = remisiones.map((remision) => ({
  //       ...remision,
  //       asignado_a_prof: remision.profesional || null,
  //     }));
  
  //     console.log("Datos finales:", transformedData);
  //     return transformedData;
  //   } catch (error) {
  //     console.error("Error en fetchRemisiones:", error);
  //     throw error;
  //   }
  // };

  // ✅ CORRECCIÓN: fetchRemisionesRejected
export const fetchRemisionesRejected = async () => {
  try {
    const { data: remisiones, error: remisionesError } = await supabaseStudentClient
      .from("remisiones")
      .select(`
        *,
        estudiantes (
          codigo_estudiante,
          primer_nombre,
          primer_apellido,
          grado
        ),
        categorias (
          id,
          nombre
        ),
        profesional_asignado:profesionales!remisiones_asignado_a_fkey(
          id,
          nombre,
          especialidad
        )
      `)
      .eq("estado", "rechazado") // ✅ Agregar filtro por estado
      .order("fecha_creacion", { ascending: false });

    if (remisionesError) throw remisionesError;

    return remisiones.map(remision => ({
      ...remision,
      asignado_a_prof: remision.profesional_asignado || null,
    }));

  } catch (error) {
    console.error("Error en fetchRemisionesRejected:", error);
    throw error;
  }
};

  export const getRemissionByStudentCode = async (codigoEstudiante) => {
    try {
      if (!codigoEstudiante) {
        throw new Error('Código de estudiante requerido');
      }
      
      // Consultar la remisión
      const { data, error } = await supabaseStudentClient
        .from('remisiones')
        .select(`
          *
        `)
        .eq('codigo_estudiante', codigoEstudiante)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      // Si encontramos una remisión, agregar información adicional
      if (data) {
        // Determinar si es remisión externa o a otro servicio
        const tipo = data.remision_externa ? 'remision_externa' : 'remision_a_otro_servicio';
        
        // Verificar si el caso está cerrado
        const caso_cerrado = data.casos?.estado === 'cerrado';
        
        // Determinar detalles según el tipo
        const detalles = data.remision_externa 
          ? data.detalle_remision_externa 
          : data.detalle_otro_servicio;
          
        // Enriquecer los datos con información adicional
        return {
          ...data,
          tipo,
          caso_cerrado,
          // Incluir servicio_id y descripción si están disponibles en los detalles
          servicioId: detalles?.servicio_id,
          descripcion: detalles?.descripcion
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error al obtener remisión por código de estudiante:', error);
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

  



//   /**
//  * Obtener grupos compartidos con un usuario
//  * @param {string} personalMcId - UUID del personal_mc con quien se comparten los grupos
//  * @returns {Promise<Array>} Lista de grupos compartidos con el usuario
//  */
// export const fetchGruposCompartidos = async (personalMcId) => {
//     try {
//       console.log("📥 Buscando grupos compartidos con:", personalMcId);
  
//       // Paso 1: Obtener las colaboraciones de tipo 'grupo' para el usuario
//       const { data: colaboraciones, error: errorColaboraciones } =
//         await supabaseStudentClient
//           .from("grupos_bienestar")
//           .select("colaboradores")
//           .eq("personal_mc_uuid", personalMcId)
//           .eq("estado", "activo");
  
//       if (errorColaboraciones) {
//         console.error("❌ Error al obtener colaboraciones:", errorColaboraciones);
//         throw errorColaboraciones;
//       }
  
//       // Si no hay colaboraciones, devolver array vacío
//       if (!colaboraciones || colaboraciones.length === 0) {
//         console.log("ℹ️ No hay grupos compartidos con este usuario");
//         return [];
//       }
  
//       // Paso 2: Extraer los IDs de los grupos
//       const grupoIds = colaboraciones.map((c) => c.entidad_id);
//       console.log(`🔍 IDs de grupos compartidos: [${grupoIds.join(", ")}]`);
  
//       // Paso 3: Obtener la información completa de esos grupos
//       const { data: grupos, error: errorGrupos } = await supabaseStudentClient
//         .from("grupos_info")
//         .select("*")
//         .in("id", grupoIds)
//         .order("fecha_creacion", { ascending: false });
  
//       if (errorGrupos) {
//         console.error(
//           "❌ Error al obtener detalles de grupos compartidos:",
//           errorGrupos
//         );
//         throw errorGrupos;
//       }
  
//       console.log(`✅ Grupos compartidos encontrados: ${grupos?.length || 0}`);
//       return grupos || [];
//     } catch (error) {
//       console.error("Error al obtener grupos compartidos:", error);
//       throw error;
//     }
//   };
  

  
/**
 * Obtener grupos compartidos con un usuario (versión final)
 * @param {string} personalMcUuid - UUID del personal_mc con quien se comparten los grupos
 * @returns {Promise<Array>} Lista de grupos compartidos con el usuario
 */
export const fetchGruposCompartidos = async (personalMcUuid) => {
  try {
    console.log("📥 Buscando grupos compartidos con UUID:", personalMcUuid);

    // Obtener TODOS los grupos activos que tienen colaboradores
    const { data: grupos, error } = await supabaseStudentClient
      .from("grupos_bienestar")
      .select("*")
      .eq('activo', true) // Solo grupos activos
      .not('colaboradores', 'is', null) // Solo grupos que tienen colaboradores
      .order("fecha_creacion", { ascending: false });

    if (error) {
      console.error("❌ Error al obtener grupos:", error);
      throw error;
    }

    console.log(`📊 Total de grupos activos con colaboradores: ${grupos?.length || 0}`);

    // Filtrar en JavaScript los grupos donde el usuario es colaborador activo
    const gruposCompartidos = grupos?.filter(grupo => {
      if (!grupo.colaboradores || !Array.isArray(grupo.colaboradores)) {
        return false;
      }
      
      // Verificar si el usuario está en los colaboradores y está activo
      return grupo.colaboradores.some(colaborador => 
        colaborador.personal_mc_uuid === personalMcUuid && 
        colaborador.activo === true
      );
    }) || [];

    console.log(`✅ Grupos compartidos activos encontrados: ${gruposCompartidos.length}`);
    return gruposCompartidos;
    
  } catch (error) {
    console.error("❌ Error al obtener grupos compartidos:", error);
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
 * Obtiene la lista de estudiantes de un grupo específico
 * @param {number} grupoId - ID del grupo
 * @returns {Promise<Array>} - Lista de estudiantes
 */
export const fetchEstudiantesGrupo = async (grupoId) => {

    //estudiante_id es el codigo de estudiante
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
  
  // Modificar la función fetchCases para filtrar por profesional
  // export const fetchCases = async (profesionalId) => {
  //   console.log("currentProfessionalFrom fetchCases", profesionalId);
  //   try {
  //     const { data, error } = await supabaseStudentClient
  //       .from("casos")
  //       .select(
  //         `
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
  //       `
  //       )
  //       .eq("profesional_principal_id", profesionalId)
  //       .order("fecha_apertura", { ascending: false });
  
  //     if (error) {
  //       console.error("Error fetching cases:", error);
  //       return [];
  //     }
  
  //     // Transformar los datos para manejar casos donde no exista información del estudiante
  //     const transformedData = data.map((caso) => ({
  //       ...caso,
  //       estudiante: caso.estudiantes || {
  //         primer_nombre: "No disponible",
  //         primer_apellido: "",
  //         curso: "N/A",
  //         grado: "N/A",
  //       },
  //     }));
  
  //     return transformedData;
  //   } catch (err) {
  //     console.error("Unexpected error:", err);
  //     return [];
  //   }
  // };

  export const fetchCaseCollaborators = async (caseId) => {
    const { data, error } = await supabaseStudentClient
      .from("profesionales")
      .select("*")
      .eq("caso_id", caseId);
  
    if (error) {
      console.error("Error fetching case collaborators:", error);
      return [];
    }
  
    return data;
  };


// export async function fetchCaseNotes(casoId, currentProfessional, isParent = false, isCollaborator = false) {
//   try {
//     // Obtener el caso con sus notas
//     const { data, error } = await supabaseStudentClient
//       .from("casos")
//       .select("notas_casos")
//       .eq("id", casoId)
//       .single();

//     if (error) throw error;

//     // Si no hay notas, retornar array vacío
//     if (!data?.notas_casos || !Array.isArray(data.notas_casos)) {
//       return [];
//     }

//     let notasFiltered = data.notas_casos;

//     // Aplicar filtros según el tipo de usuario
//     if (isParent) {
//       notasFiltered = notasFiltered.filter(nota => nota.visible_padres === true);
//     } else if (isCollaborator) {
//       notasFiltered = notasFiltered.filter(nota => 
//         nota.visible_colaboradores === true || 
//         nota.autor_id === currentProfessional?.id
//       );
//     } else if (currentProfessional?.id) {
//       notasFiltered = notasFiltered.filter(nota => 
//         nota.autor_id === currentProfessional.id || 
//         nota.visible_colaboradores === true
//       );
//     }

//     // Obtener datos de profesionales
//     const profesionalIds = [...new Set(
//       notasFiltered
//         .filter(nota => nota.autor_tipo === "profesional")
//         .map(nota => nota.autor_id)
//     )];

//     let profesionales = {};
//     if (profesionalIds.length > 0) {
//       const { data: profsData } = await supabaseStudentClient
//         .from("profesionales")
//         .select(`
//           id, nombre, especialidad,
//           categoria:categorias(nombre)
//         `)
//         .in("id", profesionalIds);

//       if (profsData) {
//         profesionales = profsData.reduce((acc, prof) => ({
//           ...acc,
//           [prof.id]: {
//             nombre: prof.nombre,
//             especialidad: prof.especialidad,
//             categoria: prof.categoria?.nombre,
//           },
//         }), {});
//       }
//     }

//     // Transformar y ordenar por fecha
//     return notasFiltered
//       .map(nota => ({
//         ...nota,
//         autor_nombre: nota.autor_tipo === "profesional"
//           ? profesionales[nota.autor_id]?.nombre || "Profesional no encontrado"
//           : "Sistema",
//         autor_especialidad: profesionales[nota.autor_id]?.especialidad || "",
//         autor_categoria: profesionales[nota.autor_id]?.categoria || "",
//       }))
//       .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

//   } catch (err) {
//     console.error("Error al obtener notas del caso:", err);
//     return [];
//   }
// }


// ✅ VERSIÓN OPTIMIZADA usando vista_casos_completos



export async function fetchCaseNotes(casoId, currentProfessional, isParent = false, isCollaborator = false) {
  try {
    const { data, error } = await supabaseStudentClient
      .from("vista_casos_completos")
      .select("notas_casos")
      .eq("id", casoId)
      .single();

    if (error) throw error;

    if (!data?.notas_casos || !Array.isArray(data.notas_casos)) {
      return [];
    }

    let notasFiltered = data.notas_casos.filter(nota => !nota.nota_anulada);

    // Aplicar filtros según el tipo de usuario
    if (isParent) {
      notasFiltered = notasFiltered.filter(nota => nota.visible_padres === true);
    } else if (isCollaborator) {
      notasFiltered = notasFiltered.filter(nota => 
        nota.visible_colaboradores === true || 
        nota.profesional_id === currentProfessional?.id
      );
    } else if (currentProfessional?.id) {
      notasFiltered = notasFiltered.filter(nota => 
        nota.profesional_id === currentProfessional.id || 
        nota.visible_colaboradores === true
      );
    }

    // Las notas ya incluyen nombre_profesional, solo ordenar por fecha
    return notasFiltered
      .sort((a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion))
      .map(nota => ({
        ...nota,
        autor_nombre: nota.nombre_profesional || "Sistema",
        fecha: nota.fecha_creacion
      }));

  } catch (err) {
    console.error("Error al obtener notas del caso:", err);
    return [];
  }
}


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

// ✅ VERSIÓN OPTIMIZADA usando vista_colaboradores_casos
export const fetchCurrentCollaborators = async (casoId) => {
  try {
    const { data, error } = await supabaseStudentClient
      .from("vista_colaboradores_casos")
      .select("*")
      .eq("caso_id", casoId)
      .eq("estado", "activo")
      .order("fecha_asignacion", { ascending: false });

    if (error) {
      console.error("Error fetching collaborators:", error);
      return [];
    }

    return data.map(collab => ({
      caso_id: collab.caso_id,
      es_lider: collab.es_lider,
      estado: collab.estado,
      fecha_asignacion: collab.fecha_asignacion,
      rol_colaboracion: collab.rol_colaboracion,
      profesional: {
        id: collab.profesional_id,
        nombre: collab.profesional_nombre,
        especialidad: collab.profesional_especialidad,
        correo: collab.profesional_correo,
        categoria: {
          id: collab.categoria_id,
          nombre: collab.categoria_nombre,
        },
      },
      personal_mc: {
        uuid: collab.professional_uuid,
        primer_nombre: collab.personal_primer_nombre,
        primer_apellido: collab.personal_primer_apellido,
        correo: collab.personal_correo
      },
      caso: {
        estado: collab.estado_caso,
        descripcion: collab.descripcion_caso,
      },
      estudiante: {
        codigo: collab.codigo_estudiante,
        nombre: collab.estudiante_nombre,
        apellido: collab.estudiante_apellido,
        grado: collab.estudiante_grado,
        curso: collab.estudiante_curso
      },
    }));

  } catch (err) {
    console.error("Unexpected error fetching collaborators:", err);
    return [];
  }
};


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

  // ✅ VERSIÓN OPTIMIZADA usando vista_casos_completos
export const fetchCases = async (profesionalId) => {
  try {
    const { data, error } = await supabaseStudentClient
      .from("vista_casos_completos")
      .select("*")
      .eq("profesional_principal_id", profesionalId)
      .order("fecha_apertura", { ascending: false });

    if (error) {
      console.error("Error fetching cases:", error);
      return [];
    }

    return data.map(caso => ({
      ...caso,
      estudiante: {
        primer_nombre: caso.primer_nombre || "No disponible",
        primer_apellido: caso.primer_apellido || "",
        curso: caso.curso || "N/A",
        grado: caso.grado || "N/A",
      },
      tipologia: {
        id: caso.tipologia_id,
        title: caso.tipologia_title,
        descripcion: caso.tipologia_descripcion
      }
    }));

  } catch (err) {
    console.error("Unexpected error:", err);
    return [];
  }
};

// ✅ VERSIÓN OPTIMIZADA de fetchCollaborativeCases
export const fetchCollaborativeCases = async (personalMcUuid) => {
  try {
    console.log("📥 Buscando casos colaborativos para UUID:", personalMcUuid);

    const { data, error } = await supabaseStudentClient
      .from("vista_colaboradores_casos")
      .select("*")
      .eq("professional_uuid", personalMcUuid)
      .eq("estado", "activo")
      .in("estado_caso", ["por iniciar", "en proceso"])
      .order("fecha_apertura", { ascending: false });

    if (error) {
      console.error("❌ Error al obtener casos colaborativos:", error);
      throw error;
    }

    console.log(`✅ Casos colaborativos encontrados: ${data?.length || 0}`);
    
    return data?.map(caso => ({
      id: caso.caso_id,
      codigo_estudiante: caso.codigo_estudiante,
      estado: caso.estado_caso,
      descripcion: caso.descripcion_caso,
      fecha_apertura: caso.fecha_apertura,
      es_colaborador: true,
      es_lider: caso.es_lider,
      rol_colaboracion: caso.rol_colaboracion,
      estudiante: {
        primer_nombre: caso.estudiante_nombre || "No disponible",
        primer_apellido: caso.estudiante_apellido || "",
        curso: caso.estudiante_curso || "N/A",
        grado: caso.estudiante_grado || "N/A",
      },
      profesional: {
        id: caso.profesional_id,
        nombre: caso.profesional_nombre,
        especialidad: caso.profesional_especialidad,
        correo: caso.profesional_correo
      },
      categoria: {
        id: caso.categoria_id,
        nombre: caso.categoria_nombre
      }
    })) || [];

  } catch (error) {
    console.error("❌ Error al obtener casos colaborativos:", error);
    throw error;
  }
};