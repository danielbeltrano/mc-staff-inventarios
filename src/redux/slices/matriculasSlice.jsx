import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { 
  fetchEstudiantesByCursoGrado, 
  fetchPadres, 
  fetchGuardianes 
} from '../../core/config/supabase/studentsFetchFunctions';

// Acción asíncrona para obtener las matrículas
export const fetchMatriculas = createAsyncThunk(
  'matriculas/fetchMatriculas',
  async ({ codigo, nombre, curso, grado, estadoFormulario, tipoEstudiante }, { rejectWithValue }) => {
    try {
      console.log('📦 Slice - Valores recibidos:', {
        codigo,
        nombre,
        curso,
        grado,
        estadoFormulario,
        tipoEstudiante
      });
      
      let estudiantes;

      // CASO 1: Búsqueda por código (prioridad máxima)
      if (codigo) {
        console.log('🔍 Slice - Búsqueda por código');
        estudiantes = await fetchEstudiantesByCursoGrado(codigo);
      } 
      // CASO 2: Búsqueda por nombre
      else if (nombre) {
        console.log('🔍 Slice - Búsqueda por nombre');
        estudiantes = await fetchEstudiantesByCursoGrado(null, nombre);
      }
      // CASO 3: Búsqueda por filtros
      else {
        console.log('🔍 Slice - Búsqueda por filtros');
        // Validación: al menos debe haber un filtro
        if (!grado && !curso && !estadoFormulario && !tipoEstudiante) {
          throw new Error('Se requiere al menos un criterio de búsqueda');
        }
        
        estudiantes = await fetchEstudiantesByCursoGrado(
          null,
          null, 
          curso, 
          grado, 
          estadoFormulario,
          tipoEstudiante
        );
      }

      // Si no hay estudiantes, retornamos array vacío
      if (!estudiantes || estudiantes.length === 0) {
        console.log('⚠️ Slice - No se encontraron estudiantes');
        return [];
      }

      console.log(`✅ Slice - ${estudiantes.length} estudiantes encontrados`);

      // Extraer los IDs de padres y guardianes
      const fatherIds = estudiantes.map(e => e.father_id).filter(Boolean);
      const motherIds = estudiantes.map(e => e.mother_id).filter(Boolean);
      const guardianIds = estudiantes.map(e => e.guardian_id).filter(Boolean);

      console.log('👨‍👩‍👧 Slice - Obteniendo información familiar...');

      // Obtener padres
      const { fathersData, mothersData } = await fetchPadres(fatherIds, motherIds);

      // Obtener guardianes individualmente
      const guardianesPromises = guardianIds.map(id => fetchGuardianes(id));
      const guardianesData = await Promise.all(guardianesPromises);
      
      // Combinar toda la información
      const estudiantesConInfo = estudiantes.map(estudiante => ({
        ...estudiante,
        padre: fathersData.find(p => p.id === estudiante.father_id) || null,
        madre: mothersData.find(m => m.id === estudiante.mother_id) || null,
        guardian: guardianesData.find(g => g.id === estudiante.guardian_id) || null,
      }));

      console.log('✅ Slice - Datos completos procesados');
      return estudiantesConInfo;
    } catch (error) {
      console.error('❌ Slice - Error:', error);
      if (error.message.includes('Se requiere al menos')) {
        return rejectWithValue('Por favor selecciona al menos un criterio de búsqueda');
      }
      return rejectWithValue(error.message || 'Error al cargar las matrículas');
    }
  }
);

// Slice de matrículas
const matriculasSlice = createSlice({
  name: 'matriculas',
  initialState: {
    estudiantes: [],
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
    lastSearch: null, // Para almacenar la última búsqueda realizada
  },
  reducers: {
    // Reducer para limpiar los datos
    clearMatriculas: (state) => {
      state.estudiantes = [];
      state.status = 'idle';
      state.error = null;
    },
    // Reducer para actualizar un estudiante específico
    updateEstudiante: (state, action) => {
      const index = state.estudiantes.findIndex(
        e => e.codigo_estudiante === action.payload.codigo_estudiante
      );
      if (index !== -1) {
        state.estudiantes[index] = {
          ...state.estudiantes[index],
          ...action.payload
        };
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMatriculas.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchMatriculas.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.estudiantes = action.payload;
        state.error = null;
        // Guardar los parámetros de búsqueda
        state.lastSearch = action.meta.arg;
      })
      .addCase(fetchMatriculas.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Error inesperado al cargar las matrículas';
        state.estudiantes = [];
      });
  }
});

// Exportar acciones y reducer
export const { clearMatriculas, updateEstudiante } = matriculasSlice.actions;

// Selectores
export const selectAllEstudiantes = state => state.matriculas.estudiantes;
export const selectMatriculasStatus = state => state.matriculas.status;
export const selectMatriculasError = state => state.matriculas.error;
export const selectLastSearch = state => state.matriculas.lastSearch;

export default matriculasSlice.reducer;