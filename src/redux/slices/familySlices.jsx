import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchFamilyInfo, fetchStudentByCodigo } from '../../core/config/supabase/studentsFetchFunctions';
import { updateFamilyDataInDB } from '../../pages/parents/services/supabase/updateUserFetchFunctions';

// Thunk para obtener la información de la familia basado en el estudiante
export const getFamilyInfo = createAsyncThunk(
  'family/getFamilyInfo',
  async (codigoEstudiante, thunkAPI) => {
    try {
      // Primero obtenemos la información del estudiante para obtener los IDs de padre, madre y guardián
      const student = await fetchStudentByCodigo(codigoEstudiante);
      console.log("codigoEstudiante", student);
      if (!student) {
        throw new Error('No se encontró el estudiante');
      }

      const { father_id, mother_id, guardian_id } = student;
      console.log("Estudiante:", student);
      console.log("Familiares del estudiante:", { father_id, mother_id, guardian_id });
      // Verificar que los IDs existan
      // Nota: Es posible que los IDs sean null si aún no se han asignado
      // Por lo tanto, no arrojaremos un error aquí

      // Ahora, obtenemos la información de la familia
      const family = await fetchFamilyInfo(father_id, mother_id, guardian_id);
      console.log("Familia:", family);

      if (!family) {
        throw new Error("No se encontró la información de la familia");
      }

      return family;
    } catch (error) {
      console.error("Error fetching family info:", error);
      return thunkAPI.rejectWithValue('Error al obtener la información de la familia');
    }
  }
);

// Thunk para actualizar la información de la familia
export const updateFamilyInfo = createAsyncThunk(
  'family/updateFamilyInfo',
  async ({ updatedFamilyData, codigo_estudiante }, thunkAPI) => { // Aseguramos que el payload sea un objeto con ambos campos
    try {
      console.log('Payload recibido en updateFamilyInfo:', JSON.stringify({ updatedFamilyData, codigo_estudiante }, null, 2));
      const updatedData = await updateFamilyDataInDB(updatedFamilyData, codigo_estudiante);
      return updatedData; // Retorna los datos actualizados
    } catch (error) {
      console.error("Error al actualizar la información de la familia:", error);
      return thunkAPI.rejectWithValue('Error al actualizar la información de la familia');
    }
  }
);

const familySlice = createSlice({
  name: 'family',
  initialState: {
    data: {
      father: {},
      mother: {},
      guardian: {},
    }, 
    status: 'idle',
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Manejar la obtención de la información de la familia
      .addCase(getFamilyInfo.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(getFamilyInfo.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.data = action.payload || { father: {}, mother: {}, guardian: {} };
      })
      .addCase(getFamilyInfo.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      // Manejar la actualización de la información de la familia
      .addCase(updateFamilyInfo.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(updateFamilyInfo.fulfilled, (state, action) => {
        state.status = 'succeeded';
        
        state.data = {
            ...state.data,
            ...action.payload, // Actualizamos las partes necesarias (fatherId, motherId, guardianId)
          };
      })
      .addCase(updateFamilyInfo.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

export default familySlice.reducer;
