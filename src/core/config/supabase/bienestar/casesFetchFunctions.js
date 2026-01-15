import { supabaseStudentClient } from "../supabaseCampusStudentClient";

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
  
  export async function createCaseNote(caseId, noteData) {
    try {
      if (!caseId || !noteData.profesional_id || !noteData.texto) {
        console.error("Datos incompletos para crear la nota:", noteData);
        return null;
      }
  
      // Primero obtener las notas actuales del caso
      const { data: casoData, error: casoError } = await supabaseStudentClient
        .from("casos")
        .select("notas_casos")
        .eq("id", caseId)
        .single();
  
      if (casoError) {
        console.error("Error al obtener el caso:", casoError);
        return null;
      }
  
      // Inicializar el array de notas si no existe
      let notasCasos = casoData.notas_casos || [];
      
      if (!Array.isArray(notasCasos)) {
        notasCasos = [];
      }
  
      // Agregar la nueva nota al array de notas
      notasCasos.unshift(noteData); // Agregar la nueva nota al principio del array
  
      // Actualizar el caso con el array de notas actualizado
      const { data, error } = await supabaseStudentClient
        .from("casos")
        .update({ notas_casos: notasCasos })
        .eq("id", caseId)
        .select();
  
      if (error) {
        console.error("Error al actualizar notas del caso:", error);
        return null;
      }
  
      console.log("Nota creada exitosamente");
      return noteData;
    } catch (err) {
      console.error("Error inesperado al crear nota:", err);
      return null;
    }
  }
  
  export async function updateCaseNote(caseId, updatedNote) {
    try {
      if (!caseId || !updatedNote.id) {
        console.error("Datos incompletos para actualizar la nota:", { caseId, updatedNote });
        return null;
      }
  
      // Obtener las notas actuales del caso
      const { data: casoData, error: casoError } = await supabaseStudentClient
        .from("casos")
        .select("notas_casos")
        .eq("id", caseId)
        .single();
  
      if (casoError) {
        console.error("Error al obtener el caso:", casoError);
        return null;
      }
  
      // Verificar que el array de notas exista
      if (!casoData.notas_casos || !Array.isArray(casoData.notas_casos)) {
        console.error("No hay notas en el caso o el formato no es válido");
        return null;
      }
  
      // Encontrar el índice de la nota a actualizar
      const noteIndex = casoData.notas_casos.findIndex(note => note.id === updatedNote.id);
  
      if (noteIndex === -1) {
        console.error("Nota no encontrada en el caso");
        return null;
      }
  
      // Actualizar la nota en el array
      const updatedNotes = [...casoData.notas_casos];
      updatedNotes[noteIndex] = {
        ...updatedNotes[noteIndex],
        ...updatedNote
      };
  
      // Actualizar el caso con el array de notas actualizado
      const { data, error } = await supabaseStudentClient
        .from("casos")
        .update({ notas_casos: updatedNotes })
        .eq("id", caseId)
        .select();
  
      if (error) {
        console.error("Error al actualizar nota:", error);
        return null;
      }
  
      console.log("Nota actualizada exitosamente");
      return updatedNote;
    } catch (err) {
      console.error("Error inesperado al actualizar nota:", err);
      return null;
    }
  }
  
 // Función para obtener colaboradores del caso (usando la estructura JSON)
export async function fetchCurrentCollaborators(caseId) {
    try {
      // Obtener el caso con sus colaboradores almacenados en JSON
      const { data: casoData, error: casoError } = await supabaseStudentClient
        .from("casos")
        .select("colaboradores")
        .eq("id", caseId)
        .single();
  
      if (casoError) {
        console.error("Error fetching case collaborators:", casoError);
        return [];
      }
  
      // Si no hay colaboradores, devolver array vacío
      if (!casoData || !casoData.colaboradores || !Array.isArray(casoData.colaboradores)) {
        return [];
      }
  
      // Filtrar sólo colaboradores activos
      let colaboradores = casoData.colaboradores.filter(collab => collab.activo === true);
  
      // Si necesitamos información adicional del profesional, podemos obtenerla en un segundo paso
      if (colaboradores.length > 0) {
        // Obtener IDs únicos de profesionales
        const profesionalIds = [...new Set(colaboradores.map(c => c.profesional_id))];
        
        // Obtener información de los profesionales
        const { data: profesionalesData, error: profesionalesError } = await supabaseStudentClient
          .from("profesionales")
          .select("id, nombre, especialidad, categoria:categorias(id, nombre)")
          .in("id", profesionalIds);
          
        if (profesionalesError) {
          console.error("Error fetching professionals:", profesionalesError);
        } else if (profesionalesData) {
          // Crear un mapa de profesionales para acceso rápido
          const profesionalesMap = profesionalesData.reduce((map, prof) => {
            map[prof.id] = prof;
            return map;
          }, {});
          
          // Enriquecer los datos de colaboradores con la información del profesional
          colaboradores = colaboradores.map(collab => {
            const profesional = profesionalesMap[collab.profesional_id] || {};
            return {
              ...collab,
              profesional: {
                id: profesional.id,
                nombre: profesional.nombre,
                especialidad: profesional.especialidad,
                categoria: profesional.categoria
              }
            };
          });
        }
      }
  
      return colaboradores;
    } catch (err) {
      console.error("Unexpected error fetching collaborators:", err);
      return [];
    }
  }