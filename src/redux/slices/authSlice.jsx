// redux/slices/authSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabaseStudentClient } from '../../core/config/supabase/supabaseCampusStudentClient';
import { fetchUsuarioByEmail } from '../../core/config/supabase/supabaseFetchFunctions';
import { fetchUserPermissions, clearPermissions } from './permissionsSlice';
import {
  getCurrentSession,
  deleteSession,
  deleteAllUserSessions,
} from '../../core/auth/sessionService';

// Acción para restaurar la sesión desde el LocalStorage
export const restoreSession = createAsyncThunk(
  'auth/restoreSession', 
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const { data, error } = await supabaseStudentClient.auth.getSession();

      if (error) {
        throw error;
      }

      if (!data || !data.session) {
        console.error('No se pudo obtener la sesión:', data);
        return rejectWithValue('No hay sesión activa.');
      }

      const { session } = data;

      if (!session.user) {
        console.error('No se pudo obtener el usuario de la sesión:', session);
        return rejectWithValue('Usuario no encontrado en la sesión.');
      }

      const { user } = session;

      // Verificar si la sesión todavía existe en la BD
      const currentSession = await getCurrentSession(user.id, session.access_token);
      
      if (!currentSession) {
        console.warn('⚠️ Sesión no encontrada en BD');
        return rejectWithValue('Sesión inválida o expirada');
      }

      const usuario = await fetchUsuarioByEmail(user.email);
      if (!usuario) {
        throw new Error('Usuario no encontrado en la base de datos.');
      }

      if (usuario.estado !== 'activo') {
        throw new Error('Usuario inactivo.');
      }

      const role = usuario.rol || 'authenticated';
      const userWithRole = { 
        ...user, 
        role, 
        uuid: usuario.uuid,
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        session_id: currentSession?.id,
      };

      if (usuario.uuid) {
        dispatch(fetchUserPermissions(usuario.uuid));
      }

      return userWithRole;
    } catch (error) {
      console.error('Error restaurando sesión:', error.message);
      dispatch(clearPermissions());
      return rejectWithValue('Error restaurando la sesión. Intenta iniciar sesión nuevamente.');
    }
  }
);

// Acción para registrar un usuario
export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async ({ email, password, rol }, { rejectWithValue }) => {
    try {
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

      const { data: authData, error: signUpError } = await supabaseStudentClient.auth.signUp({
        email,
        password,
        email_confirm: true
      });

      if (signUpError) {
        throw signUpError;
      }

      const user = authData.user;

      const { error: updateError } = await supabaseStudentClient
        .from('personal_mc')
        .update({ uuid: user.id, rol })
        .eq('correo_institucional', email.toLowerCase());

      if (updateError) {
        throw updateError;
      }

      return { success: true };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Acción para obtener la lista de usuarios creados
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
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Login de usuario con creación de sesión
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ email, password }, { rejectWithValue, dispatch }) => {
    try {
      console.log('🔑 Iniciando sesión...');
      
      const { data, error } = await supabaseStudentClient.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      const { session, user } = data;

      if (!session) {
        throw new Error('No se pudo obtener la sesión.');
      }

      localStorage.setItem('accessToken', session.access_token);
      localStorage.setItem('refreshToken', session.refresh_token);

      const usuario = await fetchUsuarioByEmail(user.email);
      if (!usuario) {
        throw new Error('Usuario no encontrado');
      }

      if (usuario.estado !== 'activo') {
        throw new Error('Usuario inactivo');
      }

      const role = usuario.rol || 'authenticated';
      const userWithRole = { 
        ...user, 
        role, 
        uuid: usuario.uuid,
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      };

      if (usuario.uuid) {
        dispatch(fetchUserPermissions(usuario.uuid));
      }

      console.log('✅ Login exitoso');

      return userWithRole;
    } catch (error) {
      console.error('❌ Error en loginUser:', error);
      dispatch(clearPermissions());
      return rejectWithValue(error.message);
    }
  }
);

// Logout de usuario con eliminación de sesión
export const logoutUser = createAsyncThunk(
  'auth/logoutUser', 
  async (sessionId, { dispatch, getState }) => {
    try {
      console.log('🚪 Iniciando proceso de logout...');
      
      const state = getState();
      const userId = state.auth.user?.id;
      
      const { data: { session }, error: sessionError } = await supabaseStudentClient.auth.getSession();
      
      if (sessionError) {
        console.warn('⚠️ Error verificando sesión:', sessionError.message);
      }

      // Eliminar sesión de la BD
      if (sessionId) {
        console.log('🗑️ Eliminando sesión de la BD:', sessionId);
        try {
          const { error: deleteError } = await supabaseStudentClient
            .from('active_sessions')
            .delete()
            .eq('id', sessionId);
          
          if (deleteError) {
            console.error('❌ Error eliminando sesión:', deleteError);
          } else {
            console.log('✅ Sesión eliminada de BD');
          }
        } catch (dbError) {
          console.error('❌ Error en eliminación de sesión:', dbError);
        }
      } else if (userId) {
        console.log('🗑️ Eliminando todas las sesiones del usuario');
        try {
          await deleteAllUserSessions(userId);
        } catch (dbError) {
          console.error('❌ Error eliminando sesiones del usuario:', dbError);
        }
      }

      // Solo intentar signOut si hay sesión activa
      if (session) {
        console.log('✅ Sesión activa encontrada, cerrando...');
        const { error: signOutError } = await supabaseStudentClient.auth.signOut();
        
        if (signOutError) {
          if (signOutError.message.includes('session missing') || 
              signOutError.message.includes('Auth session missing')) {
            console.warn('⚠️ Sesión ya cerrada o inexistente:', signOutError.message);
          } else {
            console.error('❌ Error cerrando sesión:', signOutError);
          }
        } else {
          console.log('✅ Sesión cerrada exitosamente en Supabase');
        }
      } else {
        console.log('ℹ️ No hay sesión activa en Supabase, procediendo con limpieza local');
      }

      // Limpiar permisos y localStorage
      dispatch(clearPermissions());
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('persist:auth');

      console.log('✅ Logout completado');
      return { success: true };

    } catch (error) {
      console.error('❌ Error en logoutUser:', error);
      console.warn('⚠️ Logout con errores, pero limpiando estado local');
      return { success: true, hadErrors: true, error: error.message };
    }
  }
);

// Slice de autenticación
const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    role: null,
    accessToken: null,
    refreshToken: null,
    sessionId: null, // NUEVO
    usuarios: [],
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
    },
    // NUEVO: Actualizar sessionId después de crear la sesión
    setSessionId: (state, action) => {
      state.sessionId = action.payload;
    },
    // NUEVO: Acción de emergencia para forzar limpieza total
    forceLogout: (state) => {
      console.log('🚨 LOGOUT FORZADO - Limpiando todo');
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.sessionId = null;
      state.status = 'idle';
      state.error = null;
      state.role = 'authenticated';
      
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {
        console.error('Error limpiando storage:', e);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Restaurar sesión
      .addCase(restoreSession.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(restoreSession.fulfilled, (state, action) => {
        state.status = 'succeeded';
        if (action.payload) {
          state.user = action.payload;
          state.role = action.payload.role || 'authenticated';
          state.accessToken = action.payload.access_token;
          state.refreshToken = action.payload.refresh_token;
          state.sessionId = action.payload.session_id;
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
        state.sessionId = null;
      })
      
      // Registro
      .addCase(registerUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      // Fetch usuarios
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

      // Login
      .addCase(loginUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload;
        state.role = action.payload.role || 'authenticated';
        state.accessToken = action.payload.access_token;
        state.refreshToken = action.payload.refresh_token;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
        state.user = null;
        state.role = 'authenticated';
      })

      // Logout
      .addCase(logoutUser.pending, (state) => {
        console.log('🔄 Logout en proceso...');
        state.status = 'loading';
      })
      .addCase(logoutUser.fulfilled, (state, action) => {
        console.log('✅ Logout exitoso');
        state.status = 'idle';
        state.user = null;
        state.role = 'authenticated';
        state.accessToken = null;
        state.refreshToken = null;
        state.sessionId = null;
        state.error = null;
        
        if (action.payload?.hadErrors) {
          console.warn('⚠️ Logout completado con errores:', action.payload.error);
        }
      })
      .addCase(logoutUser.rejected, (state, action) => {
        console.log('⚠️ Logout rechazado, limpiando estado de todas formas');
        state.status = 'idle';
        state.user = null;
        state.role = 'authenticated';
        state.accessToken = null;
        state.refreshToken = null;
        state.sessionId = null;
        state.error = action.payload || action.error.message;
      });
  },
});

export const { clearAuthError, updateUserLastLogin, setSessionId, forceLogout } = authSlice.actions;
export default authSlice.reducer;