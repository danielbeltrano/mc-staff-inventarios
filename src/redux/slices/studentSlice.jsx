import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  fetchStudentByCodigo
} from '../../pages/parents/services/supabase/userFetchFunctions';

// Acción para obtener estudiantes relacionados con un padre o guardián
export const fetchStudents = createAsyncThunk(
  'students/fetchStudents',
  async (_, { getState, rejectWithValue }) => {
    const { user } = getState().auth; // Obtener el usuario autenticado desde el estado

    try {
      let studentsData = null;

      if (user.role === 'parent') {
        // Obtener el ID numérico del padre basado en su UUID
        const parentId = await fetchParentNumericIdByUuid(user.id);
        if (!parentId) {
          return rejectWithValue('No se encontró el ID del padre/madre.');
        }

        // Obtener estudiantes relacionados con el padre
        studentsData = await fetchStudentsByParentNumericId(parentId);

      } else if (user.role === 'guardian') {
        // Obtener estudiantes relacionados con el guardián
        studentsData = await fetchStudentsByGuardianId(user.id);
      }

      return studentsData; // Retornar los estudiantes obtenidos

    } catch (error) {
      return rejectWithValue('Error al obtener los estudiantes');
    }
  }
);

// Slice para manejar el estado de los estudiantes
const studentSlice = createSlice({
  name: 'students',
  initialState: {
    students: [],
    status: 'idle',
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchStudents.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchStudents.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.students = action.payload; // Almacenar los estudiantes obtenidos
      })
      .addCase(fetchStudents.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

export default studentSlice.reducer;
