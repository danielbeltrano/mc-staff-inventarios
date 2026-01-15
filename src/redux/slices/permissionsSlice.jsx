//src/redux/slices/permissionsSlice.jsx

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabaseStudentClient } from '../../core/config/supabase/supabaseCampusStudentClient';

// Acción para obtener los permisos del usuario
export const fetchUserPermissions = createAsyncThunk(
  'permissions/fetchUserPermissions',
  async (userUuid, { rejectWithValue }) => {
    try {
      // console.log('🔍 fetchUserPermissions started for UUID:', userUuid);
      
      if (!userUuid) {
        throw new Error('UUID de usuario requerido');
      }

      // 1. Consultar permisos en accesos_usuario
      // console.log('📡 Consultando accesos_usuario...');
      const { data: accesos, error: accesosError } = await supabaseStudentClient
        .from('accesos_usuario')
        .select(`*
        `)
        .eq('usuario_uuid', userUuid)
        .eq('activo', true)
        .single();

      // console.log('📊 Resultado accesos_usuario:', { accesos, accesosError });

      // Si no hay registro en accesos_usuario, el usuario no tiene permisos
      if (accesosError || !accesos) {
        // console.log('⚠️ Usuario sin permisos en accesos_usuario');
        return {
          hasPermissions: false,
          permissions: {},
          hierarchyLevel: null,
          message: 'Usuario sin permisos asignados'
        };
      }

      // 2. Consultar información del usuario y su rol
      // console.log('📡 Consultando personal_mc...');
      const { data: usuario, error: usuarioError } = await supabaseStudentClient
        .from('personal_mc')
        .select(`
          rol,
          estado,
          correo_institucional,
          primer_nombre,
          primer_apellido
        `)
        .eq('uuid', userUuid)
        .eq('estado', 'activo')
        .single();

      // console.log('👤 Resultado personal_mc:', { usuario, usuarioError });

      if (usuarioError || !usuario) {
        throw new Error('Usuario no encontrado o inactivo');
      }

      // 3. Consultar información del rol (opcional, para validaciones adicionales)
      // console.log('📡 Consultando roles...');
      let rolInfo = null;
      if (usuario.rol) {
        const { data: rol, error: rolError } = await supabaseStudentClient
          .from('roles')
          .select('nombre, descripcion, nivel_jerarquico')
          .eq('nombre', usuario.rol)
          .single();

        // console.log('🎭 Resultado roles:', { rol, rolError });

        if (!rolError && rol) {
          rolInfo = rol;
        }
      }

      // 4. Consultar servicios disponibles con sus niveles mínimos
      // console.log('📡 Consultando servicios...');
      const { data: servicios, error: serviciosError } = await supabaseStudentClient
        .from('servicios')
        .select('clave_servicio, nombre_servicio, nivel_minimo_requerido, activo')
        .eq('activo', true);

      // console.log('🛠️ Resultado servicios:', { servicios, serviciosError });

      if (serviciosError) {
        console.warn('⚠️ Error consultando servicios:', serviciosError);
      }

      // 5. Construir el objeto de permisos con validación jerárquica
      const permissions = {
        bienestar: accesos.bienestar || false,
        admisiones: accesos.admisiones || false,
        matriculas: accesos.matriculas || false,
        academico: accesos.academico || false,
        recursos_humanos: accesos.recursos_humanos || false,
        financiero: accesos.financiero || false,
        administrador: accesos.administrador || false,
      };

      // console.log('🔑 Permisos base:', permissions);

      // 6. Validar jerarquía para cada servicio
      const validatedPermissions = {};
      const hierarchyOrder = { 'estrategico': 1, 'tactico': 2, 'operativo': 3 };
      const userHierarchyLevel = accesos.nivel_jerarquico;
      const userHierarchyOrder = hierarchyOrder[userHierarchyLevel] || 999;

      // console.log('🏗️ Validando jerarquía:', { userHierarchyLevel, userHierarchyOrder });

      if (servicios) {
        servicios.forEach(servicio => {
          const serviceKey = servicio.clave_servicio;
          const requiredLevel = servicio.nivel_minimo_requerido;
          const requiredOrder = hierarchyOrder[requiredLevel] || 1;
          
          // El usuario puede acceder si:
          // 1. Tiene el permiso específico activado
          // 2. Su nivel jerárquico es suficiente (menor o igual orden)
          validatedPermissions[serviceKey] = {
            hasPermission: permissions[serviceKey],
            hasHierarchy: userHierarchyOrder <= requiredOrder,
            canAccess: permissions[serviceKey] && (userHierarchyOrder <= requiredOrder),
            serviceName: servicio.nombre_servicio,
            requiredLevel: requiredLevel
          };
        });
      }

      // console.log('✅ Permisos validados:', validatedPermissions);

      const result = {
        hasPermissions: true,
        permissions: validatedPermissions,
        rawPermissions: permissions,
        hierarchyLevel: userHierarchyLevel,
        userInfo: {
          rol: usuario.rol,
          correo: usuario.correo_institucional,
          nombre: `${usuario.primer_nombre} ${usuario.primer_apellido}`,
          rolInfo: rolInfo
        },
        auditInfo: {
          otorgadoPor: accesos.otorgado_por,
          otorgadoEn: accesos.otorgado_en,
          notas: accesos.notas
        },
        services: servicios || []
      };

      // console.log('🎉 fetchUserPermissions SUCCESS:', result);
      return result;

    } catch (error) {
      console.error('❌ Error in fetchUserPermissions:', error);
      console.error('❌ Error stack:', error.stack);
      return rejectWithValue(error.message);
    }
  }
);

// Acción para verificar un permiso específico
export const checkPermission = createAsyncThunk(
  'permissions/checkPermission',
  async ({ userUuid, service }, { getState, rejectWithValue }) => {
    try {
      // console.log('🔍 checkPermission started:', { userUuid, service });
      
      const state = getState();
      const { permissions } = state.permissions;

      // Si ya tenemos los permisos cargados, usar esos
      if (permissions.hasPermissions && permissions.permissions[service]) {
        return {
          service,
          canAccess: permissions.permissions[service].canAccess,
          reason: permissions.permissions[service].canAccess ? 'Acceso autorizado' : 'Acceso denegado'
        };
      }

      // Si no tenemos los permisos, hacer consulta específica
      const { data: accesos, error } = await supabaseStudentClient
        .from('accesos_usuario')
        .select(`${service}, nivel_jerarquico, activo`)
        .eq('usuario_uuid', userUuid)
        .eq('activo', true)
        .single();

      if (error || !accesos) {
        return rejectWithValue(`Sin permisos para el servicio ${service}`);
      }

      // Consultar nivel mínimo requerido del servicio
      const { data: servicio, error: servicioError } = await supabaseStudentClient
        .from('servicios')
        .select('nivel_minimo_requerido')
        .eq('clave_servicio', service)
        .eq('activo', true)
        .single();

      if (servicioError || !servicio) {
        return rejectWithValue(`Servicio ${service} no encontrado`);
      }

      const hierarchyOrder = { 'estrategico': 1, 'tactico': 2, 'operativo': 3 };
      const userOrder = hierarchyOrder[accesos.nivel_jerarquico] || 999;
      const requiredOrder = hierarchyOrder[servicio.nivel_minimo_requerido] || 1;

      const hasPermission = accesos[service] || false;
      const hasHierarchy = userOrder <= requiredOrder;
      const canAccess = hasPermission && hasHierarchy;

      return {
        service,
        canAccess,
        hasPermission,
        hasHierarchy,
        reason: canAccess ? 'Acceso autorizado' : 
                !hasPermission ? 'Sin permiso específico' : 
                'Nivel jerárquico insuficiente'
      };

    } catch (error) {
      console.error('❌ Error in checkPermission:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Slice de permisos
const permissionsSlice = createSlice({
  name: 'permissions',
  initialState: {
    permissions: {
      hasPermissions: false,
      permissions: {},
      hierarchyLevel: null,
      userInfo: null,
      auditInfo: null,
      services: []
    },
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
    lastChecked: null
  },
  reducers: {
    clearPermissions: (state) => {
      // console.log('🧹 Clearing permissions');
      state.permissions = {
        hasPermissions: false,
        permissions: {},
        hierarchyLevel: null,
        userInfo: null,
        auditInfo: null,
        services: []
      };
      state.status = 'idle';
      state.error = null;
      state.lastChecked = null;
    },
    setPermissionsStatus: (state, action) => {
      // console.log('📊 Setting permissions status:', action.payload);
      state.status = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Manejar fetchUserPermissions
      .addCase(fetchUserPermissions.pending, (state) => {
        // console.log('⏳ fetchUserPermissions.pending');
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchUserPermissions.fulfilled, (state, action) => {
        // console.log('✅ fetchUserPermissions.fulfilled:', action.payload);
        state.status = 'succeeded';
        state.permissions = action.payload;
        state.lastChecked = new Date().toISOString();
        state.error = null;
      })
      .addCase(fetchUserPermissions.rejected, (state, action) => {
        // console.log('❌ fetchUserPermissions.rejected:', action.payload);
        state.status = 'failed';
        state.error = action.payload;
        state.permissions = {
          hasPermissions: false,
          permissions: {},
          hierarchyLevel: null,
          userInfo: null,
          auditInfo: null,
          services: []
        };
      })
      // Manejar checkPermission
      .addCase(checkPermission.pending, (state) => {
        // console.log('⏳ checkPermission.pending');
      })
      .addCase(checkPermission.fulfilled, (state, action) => {
        // console.log('✅ checkPermission.fulfilled:', action.payload);
      })
      .addCase(checkPermission.rejected, (state, action) => {
        // console.log('❌ checkPermission.rejected:', action.payload);
        console.error('Error en verificación de permiso:', action.payload);
      });
  },
});

export const { clearPermissions, setPermissionsStatus } = permissionsSlice.actions;

// Agregar log de confirmación
// console.log('✅ PermissionsSlice loaded successfully');

export default permissionsSlice.reducer;