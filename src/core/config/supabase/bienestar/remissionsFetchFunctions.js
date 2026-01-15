import { supabaseStudentClient } from "../supabaseCampusStudentClient";
/******************************
******** REMISSIONS *********
*******************************/
export const createRemision = async (remisionData) => {
    try {
      console.log("Datos recibidos en createRemision:", remisionData);
  
      // Determinar el tipo de remitente basado en el origen
      let remitente_tipo;
      switch (remisionData.remitente_origen) {
        case "padres":
          remitente_tipo = "padre";
          break;
        case "profesionales":
          remitente_tipo = "profesor";
          break;
        case "personal_mc":
          remitente_tipo = "personal";
          break;
        default:
          throw new Error("Origen de remitente no válido");
      }
  
      const remision = {
        codigo_estudiante: remisionData.codigo_estudiante,
        remitente_id: remisionData.remitente_id,
        remitente_origen: remisionData.remitente_origen,
        remitente_tipo: remitente_tipo,
        descripcion: remisionData.descripcion,
        categoria_id: remisionData.categoria_id,
        tipologia_id: remisionData.tipologia_id,
        cargo_personal_mc: remisionData.remitente_cargo,
        estado: "pendiente",
        caso_creado: "pendiente",
      };
  
      console.log("Intentando crear remisión con:", remision);
  
      const { data, error } = await supabaseStudentClient
        .from("remisiones")
        .insert([remision])
        .select();
  
      if (error) {
        console.error("Error creating remision:", error);
        throw error;
      }
  
      console.log("Remisión creada exitosamente:", data);
      return data;
    } catch (err) {
      console.error("Error en createRemision:", err);
      throw err;
    }
  };
  
  /**
   * Actualiza o crea una remisión para un caso específico basado en el código de estudiante
   * @param {Object} remissionData - Datos de la remisión que incluye el objeto caso completo
   * @returns {Promise<Object>} - Datos de la remisión actualizada o creada
   */
  export const createRemissionFromCase = async (remissionData) => {
    try {
      // Validar que exista la información del caso
      if (!remissionData.caso || !remissionData.caso.id || !remissionData.caso.codigo_estudiante) {
        throw new Error('Información del caso incompleta');
      }
      
      const casoId = remissionData.caso.id;
      const codigoEstudiante = remissionData.caso.codigo_estudiante;
      
      console.log("Buscando remisión para:", { casoId, codigoEstudiante });
      
      // Primero, verificar si existe una remisión para este estudiante
      const { data: existingRemision, error: queryError } = await supabaseStudentClient
        .from('remisiones')
        .select('id')
        .eq('codigo_estudiante', codigoEstudiante)
        .single();
        
      if (queryError && queryError.code !== 'PGRST116') { // Ignoramos el error "no rows returned"
        throw new Error(`Error al buscar remisión: ${queryError.message}`);
      }
      
      // Preparar los campos a actualizar
      const updateFields = {
        remision_externa: remissionData.remision_externa || false,
        remision_a_otro_servicio: remissionData.remision_a_otro_servicio || false,
        fecha_nueva_remision: new Date(),
      };
      
      // Añadir los detalles específicos según el tipo de remisión
      if (remissionData.remision_externa) {
        updateFields.detalle_remision_externa = remissionData.detalle_remision_externa;
        updateFields.detalle_otro_servicio = null; // Resetear el otro tipo
      } else if (remissionData.remision_a_otro_servicio) {
        updateFields.detalle_otro_servicio = remissionData.detalle_otro_servicio;
        updateFields.detalle_remision_externa = null; // Resetear el otro tipo
      }
      
      let result;
      
      if (existingRemision) {
        console.log("Actualizando remisión existente:", existingRemision.id);
        
        // Actualizar remisión existente
        const { data, error } = await supabaseStudentClient
          .from('remisiones')
          .update(updateFields)
          .eq('id', existingRemision.id)
          .select()
          .single();
          
        if (error) throw new Error(`Error al actualizar remisión: ${error.message}`);
        result = data;
      } else {
        console.log("Creando nueva remisión para el estudiante");
        
        // Crear nueva remisión
        const newRemision = {
          ...updateFields,
          caso_id: casoId,
          codigo_estudiante: codigoEstudiante,
          fecha_creacion: new Date()
        };
        
        const { data, error } = await supabaseStudentClient
          .from('remisiones')
          .insert([newRemision])
          .select()
          .single();
          
        if (error) throw new Error(`Error al crear remisión: ${error.message}`);
        result = data;
      }
      
      // Si se debe cerrar el caso, actualizar el estado del caso
      if (remissionData.cerrar_caso) {
        console.log("Cerrando el caso:", casoId);
        
        const { error: updateError } = await supabaseStudentClient
          .from('casos')
          .update({ 
            estado: 'cerrado',
            fecha_cierre: new Date()
          })
          .eq('id', casoId);
          
        if (updateError) throw new Error(`Error al cerrar caso: ${updateError.message}`);
      }
      
      return result;
    } catch (error) {
      console.error('Error en createRemissionForCase:', error);
      throw error;
    }
  };
  
  export const getRemissionByStudentCode = async (codigoEstudiante) => {
    try {
      if (!codigoEstudiante) {
        throw new Error('Código de estudiante requerido');
      }
      
      // Consultar las remisiones (modificado para devolver todas las remisiones, no solo una)
      const { data, error } = await supabaseStudentClient
        .from('remisiones')
        .select(`*`)
        .eq('codigo_estudiante', codigoEstudiante); // Eliminado .maybeSingle()
      
      if (error) {
        throw error;
      }
      
      // Si no hay datos, devolver un array vacío
      if (!data || data.length === 0) {
        return [];
      }
      
      // Enriquecer los datos con información adicional
      return data.map(item => {
        // Determinar si es remisión externa o a otro servicio
        const tipo = item.remision_externa ? 'remision_externa' : 'remision_a_otro_servicio';
        
        // Verificar si el caso está cerrado
        const caso_cerrado = item.casos?.estado === 'cerrado';
        
        // Determinar detalles según el tipo
        const detalles = item.remision_externa 
          ? item.detalle_remision_externa 
          : item.detalle_otro_servicio;
          
        // Enriquecer los datos con información adicional
        return {
          ...item,
          tipo,
          caso_cerrado,
          // Incluir servicio_id y descripción si están disponibles en los detalles
          servicioId: detalles?.servicio_id,
          descripcion: detalles?.descripcion
        };
      });
    } catch (error) {
      console.error('Error al obtener remisiones por código de estudiante:', error);
      throw error;
    }
  };
  // export const updateRemisionEstado = async (remisionId, caso_creado) => {
  //   const { error } = await supabaseStudentClient
  //     .from("remisiones")
  //     .update({ caso_creado: caso_creado })
  //     .eq("id", remisionId);
  
  //   if (error) throw error;
  // };
  
  export const updateRemisionEstado = async (remisionId, caso_creado) => {
    const updateData = {
      caso_creado: caso_creado,
      // Add rejection date only when the status is "rechazado"
      ...(caso_creado === "rechazado" && {
        fecha_rechazo_remision: new Date().toISOString()
      })
    };
  
    const { error } = await supabaseStudentClient
      .from("remisiones")
      .update(updateData)
      .eq("id", remisionId);
  
    if (error) throw error;
  };
  
  export async function fetchRemisionesByEstado(estado) {
    const { data, error } = await supabaseStudentClient
      .from("remisiones")
      .select("*")
      .eq("estado", estado)
      .order("fecha_creacion", { ascending: false });
  
    if (error) {
      console.error("Error obteniendo remisiones:", error);
      return [];
    }
  
    return data;
  }
  
  export async function asignarRemision(remisionId, asignadoA, categoriaId) {
    const { data, error } = await supabaseStudentClient
      .from("remisiones")
      .update({
        estado: "asignado",
        asignado_a: asignadoA,
        categoria_id: categoriaId,
      })
      .eq("id", remisionId);
  
    if (error) {
      console.error("Error asignando remisión:", error);
      return null;
    }
  
    return data;
  }
  
  // export const fetchRemisiones = async () => {
  //   try {
  //     // Primero, obtener las remisiones con sus relaciones básicas
  //     const { data: remisiones, error: remisionesError } = await supabaseStudentClient
  //       .from('remisiones')
  //       .select(`
  //         *,
  //         estudiantes (
  //           codigo_estudiante,
  //           primer_nombre,
  //           primer_apellido,
  //           grado
  //         ),
  //         categorias (
  //           id,
  //           nombre
  //         )
  //       `)
  //       .eq('caso_creado', 'pendiente')
  //       .order('fecha_creacion', { ascending: false });
  
  //     if (remisionesError) throw remisionesError;
  
  //     // Obtener los IDs únicos de remitentes por tipo
  //     const remitentesIds = {
  //       padres: [...new Set(remisiones
  //         .filter(r => r.remitente_origen === 'padres')
  //         .map(r => r.remitente_id))],
  //       profesionales: [...new Set(remisiones
  //         .filter(r => r.remitente_origen === 'profesionales')
  //         .map(r => r.remitente_id))],
  //       personal_mc: [...new Set(remisiones
  //         .filter(r => r.remitente_origen === 'personal_mc')
  //         .map(r => r.remitente_id))]
  //     };
  
  //     // Obtener datos de los remitentes
  //     const [padresData, profesionalesData, personalData] = await Promise.all([
  //       remitentesIds.padres.length > 0 ?
  //         supabaseStudentClient
  //           .from('padres')
  //           .select('id, primer_nombre, primer_apellido')
  //           .in('id', remitentesIds.padres) : Promise.resolve({ data: [] }),
  
  //       remitentesIds.profesionales.length > 0 ?
  //         supabaseStudentClient
  //           .from('profesionales')
  //           .select('id, nombre')
  //           .in('id', remitentesIds.profesionales) : Promise.resolve({ data: [] }),
  
  //       remitentesIds.personal_mc.length > 0 ?
  //         supabaseStudentClient
  //           .from('personal_mc')
  //           .select('id, primer_nombre, primer_apellido')
  //           .in('id', remitentesIds.personal_mc) : Promise.resolve({ data: [] })
  //     ]);
  
  //     // Crear mapas para búsqueda rápida
  //     const padresMap = Object.fromEntries(
  //       (padresData.data || []).map(p => [p.id, p])
  //     );
  //     const profesionalesMap = Object.fromEntries(
  //       (profesionalesData.data || []).map(p => [p.id, p])
  //     );
  //     const personalMap = Object.fromEntries(
  //       (personalData.data || []).map(p => [p.id, p])
  //     );
  
  //     // Transformar los datos con la información del remitente
  //     const transformedData = remisiones.map(remision => ({
  //       ...remision,
  //       remitente_nombre: (() => {
  //         switch(remision.remitente_origen) {
  //           case 'padres': {
  //             const padre = padresMap[remision.remitente_id];
  //             return padre
  //               ? `${padre.primer_nombre} ${padre.primer_apellido}`
  //               : 'Padre/Madre no encontrado';
  //           }
  //           case 'profesionales': {
  //             const profesional = profesionalesMap[remision.remitente_id];
  //             return profesional
  //               ? profesional.nombre
  //               : 'Profesional no encontrado';
  //           }
  //           case 'personal_mc': {
  //             const personal = personalMap[remision.remitente_id];
  //             return personal
  //               ? `${personal.primer_nombre} ${personal.primer_apellido}`
  //               : 'Personal no encontrado';
  //           }
  //           default:
  //             return 'Remitente no especificado';
  //         }
  //       })()
  //     }));
  
  //     console.log('Remisiones transformadas:', transformedData);
  //     return transformedData;
  //   } catch (error) {
  //     console.error('Error en fetchRemisiones:', error);
  //     throw error;
  //   }
  // };
  
  export const fetchAllRemisiones = async () => {
    try {
      //console.log("Iniciando fetchRemisiones...");
  
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
            grado,
            curso
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
          .order("fecha_creacion", { ascending: false });
  
      if (remisionesError) {
        console.error("Error al obtener remisiones:", remisionesError);
        throw remisionesError;
      }
  
      //console.log("Remisiones raw:", remisiones);
  
      // Fetch casos for each remision
      const remisionesWithCases = await Promise.all(
        remisiones.map(async (remision) => {
          const { data: casos } = await supabaseStudentClient
            .from("casos")
            .select("*")
            .eq("codigo_estudiante", remision.codigo_estudiante)
            .eq("categoria_id", remision.categoria_id)
            .eq("estado", "por iniciar");
  
         // console.log(`Casos para remisión ${remision.id}:`, casos);
  
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
  
      //console.log("IDs remitentes:", remitentesIds);
  
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
  
  export const fetchRemisionesRejected = async () => {
    try {
      const { data: remisiones, error: remisionesError } =
        await supabaseStudentClient
          .from("remisiones")
          .select(
            `*
          `
          )
          .order("fecha_creacion", { ascending: false });
  
      if (remisionesError) throw remisionesError;
  
      const transformedData = remisiones.map((remision) => ({
        ...remision,
        asignado_a_prof: remision.profesional || null,
      }));
  
      console.log("Datos finales:", transformedData);
      return transformedData;
    } catch (error) {
      console.error("Error en fetchRemisiones:", error);
      throw error;
    }
  };
  
  export const fetchProfesionales = async () => {
    const { data, error } = await supabaseStudentClient
      .from("profesionales")
      .select("*")
      .eq("activo", true);
  
    if (error) throw error;
    return data;
  };
  
  export const actualizarRemision = async (id, updates) => {
    const { data, error } = await supabaseStudentClient
      .from("remisiones")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
  
    if (error) throw error;
    return data;
  };
  
  export const fetchTipologiaRemisiones = async () => {
    const { data, error } = await supabaseStudentClient
      .from("tipologia_remision")
      .select("id, title");
  
    if (error) throw error;
    return data;
  };


  /**
 * Crea una remisión para un caso
 * @param {Object} remissionData - Datos de la remisión
 * @returns {Promise<Object>} - Remisión creada
 */
export const createRemissionForCase = async (remissionData) => {
  try {
    // Validar que exista la información del caso
    if (!remissionData.caso || !remissionData.caso.id || !remissionData.caso.codigo_estudiante) {
      throw new Error('Información del caso incompleta');
    }
    
    const casoId = remissionData.caso.id;
    const codigoEstudiante = remissionData.caso.codigo_estudiante;
    
    // Primero, verificar si existe una remisión para este estudiante
    const { data: existingRemision, error: queryError } = await supabaseStudentClient
      .from('remisiones')
      .select('id')
      .eq('codigo_estudiante', codigoEstudiante)
      .single();
      
    if (queryError && queryError.code !== 'PGRST116') { // Ignoramos el error "no rows returned"
      throw new Error(`Error al buscar remisión: ${queryError.message}`);
    }
    
    // Preparar los campos a actualizar
    const updateFields = {
      remision_externa: remissionData.remision_externa || false,
      remision_a_otro_servicio: remissionData.remision_a_otro_servicio || false,
      fecha_nueva_remision: new Date(),
    };
    
    // Añadir los detalles específicos según el tipo de remisión
    if (remissionData.remision_externa) {
      updateFields.detalle_remision_externa = remissionData.detalle_remision_externa;
      updateFields.detalle_otro_servicio = null; // Resetear el otro tipo
    } else if (remissionData.remision_a_otro_servicio) {
      updateFields.detalle_otro_servicio = remissionData.detalle_otro_servicio;
      updateFields.detalle_remision_externa = null; // Resetear el otro tipo
    }
    
    let result;
    
    if (existingRemision) {
      // Actualizar remisión existente
      const { data, error } = await supabaseStudentClient
        .from('remisiones')
        .update(updateFields)
        .eq('id', existingRemision.id)
        .select()
        .single();
        
      if (error) throw new Error(`Error al actualizar remisión: ${error.message}`);
      result = data;
    } else {
      // Crear nueva remisión
      const newRemision = {
        ...updateFields,
        caso_id: casoId,
        codigo_estudiante: codigoEstudiante,
        fecha_creacion: new Date()
      };
      
      const { data, error } = await supabaseStudentClient
        .from('remisiones')
        .insert([newRemision])
        .select()
        .single();
        
      if (error) throw new Error(`Error al crear remisión: ${error.message}`);
      result = data;
    }
    
    // Si se debe cerrar el caso, actualizar el estado del caso
    if (remissionData.cerrar_caso) {
      const { error: updateError } = await supabaseStudentClient
        .from('casos')
        .update({ 
          estado: 'cerrado',
          fecha_cierre: new Date()
        })
        .eq('id', casoId);
        
      if (updateError) throw new Error(`Error al cerrar caso: ${updateError.message}`);
    }
    
    return result;
  } catch (error) {
    console.error('Error en createRemissionForCase:', error);
    throw error;
  }
};