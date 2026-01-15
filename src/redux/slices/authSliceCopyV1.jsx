import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabaseStudentClient } from '../../core/config/supabase/supabaseCampusStudentClient';
import { fetchUsuarioByEmail } from '../../core/config/supabase/supabaseFetchFunctions';
import { fetchUserPermissions, clearPermissions } from './permissionsSlice';

// Acción para restaurar la sesión desde el LocalStorage
export const restoreSession = createAsyncThunk(
  'auth/restoreSession', 
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const { data, error } = await supabaseStudentClient.auth.getSession();

      if (error) {
        throw error;
      }

      // Verificar si data y session existen
      if (!data || !data.session) {
        console.error('No se pudo obtener la sesión:', data);
        return rejectWithValue('No hay sesión activa.');
      }

      const { session } = data;

      // Verificar si el usuario existe en la sesión
      if (!session.user) {
        console.error('No se pudo obtener el usuario de la sesión:', session);
        return rejectWithValue('Usuario no encontrado en la sesión.');
      }

      const { user } = session;

      // Obtener información básica del usuario
      const usuario = await fetchUsuarioByEmail(user.email);
      if (!usuario) {
        throw new Error('Usuario no encontrado en la base de datos.');
      }

      // Verificar que el usuario esté activo
      if (usuario.estado !== 'activo') {
        throw new Error('Usuario inactivo.');
      }

      const role = usuario.rol || 'authenticated';
      const userWithRole = { ...user, role, uuid: usuario.uuid };

      // Cargar permisos del usuario de forma asíncrona
      if (usuario.uuid) {
        dispatch(fetchUserPermissions(usuario.uuid));
      }

      // Retornar los detalles del usuario con su rol
      return userWithRole;
    } catch (error) {
      console.error('Error restaurando sesión:', error.message);
      dispatch(clearPermissions());
      return rejectWithValue('Error restaurando la sesión. Intenta iniciar sesión nuevamente.');
    }
  }
);

// Acción para registrar un usuario en supabaseStudentClient Auth y actualizar personal_mc
export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async ({ email, password, rol }, { rejectWithValue }) => {
    try {
      // 1. Verificar si el correo existe en la tabla personal_mc
      const { data: existingUser, error: fetchError } = await supabaseStudentClient
        .from('personal_mc')
        .select('*')
        .eq('correo_institucional', email.toLowerCase())
        .single();

      if (fetchError) {
        return rejectWithValue('El correo no está registrado en la base de datos de personal.');
      }

      if (!existingUser) {
        return rejectWithValue('El correo no está registrado en la base de datos de personal.');
      }

      // 2. Si el usuario existe, registrarlo en supabaseStudentClient Auth
      const { data: authData, error: signUpError } = await supabaseStudentClient.auth.signUp({
        email,
        password,
        email_confirm: true
      });

      if (signUpError) {
        throw signUpError;
      }

      const user = authData.user;

      // 3. Actualizar la tabla personal_mc con el UUID y el rol
      const { error: updateError } = await supabaseStudentClient
        .from('personal_mc')
        .update({ uuid: user.id, rol })
        .eq('correo_institucional', email.toLowerCase());

      if (updateError) {
        throw updateError;
      }

      // No retornamos el usuario ni modificamos el estado global.
      return { success: true };  // Devolvemos solo un indicador de éxito
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Acción para obtener la lista de usuarios creados (solo superadministrador)
export const fetchUsuarios = createAsyncThunk(
  'auth/fetchUsuarios',
  async (_, { rejectWithValue }) => {
    try {
      const { data, error } = await supabaseStudentClient
        .from('personal_mc')
        .select('correo_institucional, rol');

      if (error) {
        throw error;
      }

      console.log("Usuarios:", data);
      return data;  // Devuelve la lista de usuarios
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Login de usuario
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ email, password }, { rejectWithValue, dispatch }) => {
    try {
      const { data, error } = await supabaseStudentClient.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      const { session, user } = data;

      // Verificar si la sesión existe
      if (!session) {
        throw new Error('No se pudo obtener la sesión.');
      }

      // Almacenar los tokens en localStorage
      localStorage.setItem('accessToken', session.access_token);
      localStorage.setItem('refreshToken', session.refresh_token);

      // Obtener información del usuario
      const usuario = await fetchUsuarioByEmail(user.email);
      if (!usuario) {
        throw new Error('Usuario no encontrado');
      }

      // Verificar que el usuario esté activo
      if (usuario.estado !== 'activo') {
        throw new Error('Usuario inactivo');
      }

      const role = usuario.rol || 'authenticated';
      const userWithRole = { ...user, role, uuid: usuario.uuid };

      // Cargar permisos del usuario
      if (usuario.uuid) {
        dispatch(fetchUserPermissions(usuario.uuid));
      }

      // Retornar los detalles del usuario con su rol
      return userWithRole;
    } catch (error) {
      dispatch(clearPermissions());
      return rejectWithValue(error.message);
    }
  }
);

// Logout de usuario
export const logoutUser = createAsyncThunk(
  'auth/logoutUser', 
  async (_, { dispatch }) => {
    const { error } = await supabaseStudentClient.auth.signOut();
    if (error) throw error;

    // Limpiar permisos y localStorage
    dispatch(clearPermissions());
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('persist:auth');
  }
);

// Slice de autenticación
const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    role: null,  // Añadimos el rol al estado
    usuarios: [],  // Añadimos la lista de usuarios para la gestión por superadministrador
    status: 'idle',
    error: null,
  },
  reducers: {
    clearAuthError: (state) => {
      state.error = null;
    },
    updateUserLastLogin: (state) => {
      if (state.user) {
        state.user.last_login = new Date().toISOString();
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Manejar restauración de sesión
      .addCase(restoreSession.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(restoreSession.fulfilled, (state, action) => {
        state.status = 'succeeded';
        if (action.payload) {
          state.user = action.payload;
          state.role = action.payload.role || 'authenticated';
        } else {
          state.user = null;
          state.role = 'authenticated';
        }
        state.error = null;
      })
      .addCase(restoreSession.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
        state.user = null;
        state.role = 'authenticated';
      })
      
      // Manejar registro de usuario
      .addCase(registerUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        // No modificamos user en registro exitoso
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      // Manejar la obtención de usuarios (superadministrador)
      .addCase(fetchUsuarios.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchUsuarios.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.usuarios = action.payload;
      })
      .addCase(fetchUsuarios.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      // Manejar inicio de sesión
      .addCase(loginUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload;
        state.role = action.payload.role || 'authenticated';
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
        state.user = null;
        state.role = 'authenticated';
      })

      // Manejar logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.status = 'idle';
        state.user = null;
        state.role = 'authenticated';
        state.error = null;
      });
  },
});

export const { clearAuthError, updateUserLastLogin } = authSlice.actions;
export default authSlice.reducer;