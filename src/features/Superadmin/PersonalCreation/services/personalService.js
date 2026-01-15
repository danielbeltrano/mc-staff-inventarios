import { supabaseStudentClient } from "../../../../core/config/supabase/supabaseCampusStudentClient";


/**
 * Servicio para manejar operaciones relacionadas con personal_mc
 */
export const personalService = {
  /**
   * Obtener todos los roles disponibles
   * @returns {Promise<Array>} Lista de roles
   */
  async getRoles() {
    try {
      const { data, error } = await supabaseStudentClient
        .from('roles')
        .select('nombre, descripcion')
        .order('descripcion');
      
        console.log("data from getRoles", data);
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error obteniendo roles:', error);
      throw new Error('No se pudieron cargar los roles');
    }
  },

  /**
   * Verificar si un correo ya existe en personal_mc
   * @param {string} email - Correo a verificar
   * @returns {Promise<boolean>} true si existe, false si no
   */
  async checkEmailExists(email) {
    try {
      const { data, error } = await supabaseStudentClient
        .from('personal_mc')
        .select('id')
        .eq('correo_institucional', email.toLowerCase())
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        throw error;
      }
      
      return !!data;
    } catch (error) {
      console.error('Error verificando correo:', error);
      throw new Error('Error al verificar el correo');
    }
  },

  /**
   * Crear nuevo personal en la base de datos
   * @param {Object} personalData - Datos del personal
   * @returns {Promise<Object>} Datos del personal creado
   */
  async createPersonal(personalData) {
    try {
      const { data, error } = await supabaseStudentClient
        .from('personal_mc')
        .insert([{
          correo_institucional: personalData.correoInstitucional.toLowerCase(),
          primer_nombre: personalData.primerNombre.trim(),
          segundo_nombre: personalData.segundoNombre?.trim() || null,
          primer_apellido: personalData.primerApellido.trim(),
          segundo_apellido: personalData.segundoApellido?.trim() || null,
          rol: personalData.rol,
          cargo: personalData.cargo?.trim() || null,
          // Permisos de servicios
          admisiones: personalData.permisos.admisiones,
          matriculas: personalData.permisos.matriculas,
          bienestar: personalData.permisos.bienestar,
          recursos_humanos: personalData.permisos.recursosHumanos,
          academico: personalData.permisos.academico,
          administrador: personalData.permisos.administrador,
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creando personal:', error);
      
      // Manejar errores específicos
      if (error.code === '23505') { // Unique constraint violation
        throw new Error('Ya existe un registro con este correo institucional');
      }
      
      throw new Error('No se pudo crear el registro del personal');
    }
  },

  /**
   * Verificar permisos de usuario actual
   * @returns {Promise<Object>} Datos del usuario con permisos
   */
  async checkUserPermissions() {
    try {
      const { data: { user }, error: authError } = await supabaseStudentClient.auth.getUser();
      
      //console.log("user from checkUserPermissions", user);
      if (authError || !user) {
        throw new Error('Usuario no autenticado');
      }

      const { data: userData, error: userError } = await supabaseStudentClient
        .from('personal_mc')
        .select('rol, administrador')
        .eq('uuid', user.id)
        .single();

        //console.log("userData from checkUserPermissions", userData);
      if (userError) {
        throw new Error('Usuario no encontrado en el sistema');
      }

      return userData;
    } catch (error) {
      console.error('Error verificando permisos:', error);
      throw error;
    }
  }
};




