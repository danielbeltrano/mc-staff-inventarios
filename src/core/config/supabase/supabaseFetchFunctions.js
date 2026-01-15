// src/core/config/supabaseStudentClientFetchFunctions.js

import { supabaseStudentClient } from "./supabaseCampusStudentClient";
/**
 * Fetch profesor by institutional email.
 * @param {string} email - Email institucional del profesor.
 * @returns {Promise<Object|null>} - Objeto del profesor o null si no existe.
 */
export const fetchUsuarioByEmail = async (email) => {
  // // console.log(`Fetching usuario by email: ${email}`);
  const { data, error } = await supabaseStudentClient
    .from('personal_mc')
    .select('*')
    .eq('correo_institucional', email.trim().toLocaleLowerCase())  // Usar el nombre correcto del campo.
    .single();

  if (error) {
    console.error('Error fetching usuario by email:', error.message);
    throw error;
  }

  return data || null;
};



/**
 * Fetch profesor by codigo_profesor.
 * @param {string} rol - rol del profesor.
 * @returns {Promise<Object|null>} - Objeto del profesor o null si no existe.
 */
export const fetchUsuarioByRol = async (rol) => {
  // // console.log(`Fetching usuario by rol: ${rol}`);

  // Verifica si el rol es válido antes de realizar la consulta
  if (!rol) {
    console.error("Rol no definido");
    return null;
  }

  const { data, error } = await supabaseStudentClient
    .from('personal_mc')
    .select('*')
    .eq('rol', rol)  // Usar el nombre del rol directamente
    .maybeSingle();  // Usar maybeSingle para evitar errores si no hay filas o si hay más de una

  if (error) {
    console.error('Error fetching usuario by rol:', error.message);
    throw error;
  }

  return data || null;
};

/**
 * Fetch profesor by codigo_profesor.
 * @param {string} id - id del profesor.
 * @returns {Promise<Object|null>} - Objeto del profesor o null si no existe.
 */
export const fetchUsuarioById = async (id) => {
  // console.log(`Fetching usuario by id: ${id}`);

  // Verifica si el rol es válido antes de realizar la consulta
  if (!id) {
    console.error("id no definido");
    return null;
  }

  const { data, error } = await supabaseStudentClient
    .from('personal_mc')
    .select('*')
    .eq('id', id)  // Usar el nombre del rol directamente
    .maybeSingle();  // Usar maybeSingle para evitar errores si no hay filas o si hay más de una

  if (error) {
    console.error('Error fetching usuario by ID:', error.message);
    throw error;
  }

  return data || null;
};


// Función para obtener la lista de usuarios
export const fetchUsuariosFromDB = async () => {
  const { data, error } = await supabaseStudentClient
    .from('personal_mc')
    .select('correo_institucional, rol');  // Seleccionar solo los campos que necesitas

  if (error) {
    throw error;
  }

  return data;
};


export const fetchEstudiantesByCursoGrado = async (codigo, curso, grado, estadoFormulario) => {
  try {
    let query = supabaseStudentClient
      .from('estudiantes')
      .select('*');
    
    // console.log('Parámetros originales:', { codigo, curso, grado, estadoFormulario }); // Debug inicial

    if (codigo) {
      query = query.eq('codigo_estudiante', codigo);
    } else {
      // Aplicar grado (obligatorio)
      query = query.eq('grado', grado);
      
      // Aplicar curso solo si tiene un valor válido
      if (curso && curso !== "" && curso !== null) {
        query = query.eq('curso', curso);
      }

      // Aplicar estado del formulario solo si tiene un valor válido
      if (estadoFormulario && estadoFormulario !== "" && estadoFormulario !== null) {
        const isEnviado = estadoFormulario === "true";
        query = query.eq('formulario_enviado', isEnviado);
        // console.log('Aplicando filtro formulario:', isEnviado); // Debug filtro formulario
      }
    }

    // console.log('Query final:', query); // Debug query final

    const { data, error } = await query;

    if (error) {
      console.error('Error en la consulta:', error); // Debug error
      throw new Error(`Error al obtener estudiantes: ${error.message}`);
    }

    // console.log('Resultados obtenidos:', {
    //   cantidad: data?.length,
    //   muestra: data?.slice(0, 2)
    // }); // Debug resultados

    return data || [];
  } catch (error) {
    console.error('Error en fetchEstudiantesByCursoGrado:', error);
    throw error;
  }
};

export const fetchPadres = async (fatherIds, motherIds) => {
  const { data: fathersData, error: fathersError } = await supabaseStudentClient
    .from('padres')
    .select('*')
    .in('id', fatherIds);

  const { data: mothersData, error: mothersError } = await supabaseStudentClient
    .from('padres')
    .select('*')
    .in('id', motherIds);

  if (fathersError || mothersError) {
    throw new Error('Error al obtener padres');
  }

  return { fathersData, mothersData };
};

export const fetchPadresAcudientes = async (fatherIds, motherIds) => {
  const { data: fathersData, error: fathersError } = await supabaseStudentClient
    .from('padres')
    .select('es_acudiente')
    .in('id', fatherIds);

  const { data: mothersData, error: mothersError } = await supabaseStudentClient
    .from('es_acudiente')
    .select('*')
    .in('id', motherIds);

  if (fathersError || mothersError) {
    throw new Error('Error al obtener padres');
  }

  return { fathersData, mothersData };
};



export const fetchGuardianes = async (guardianIds) => {
  const { data, error } = await supabaseStudentClient
    .from('guardianes')
    .select('*')
    .in('id', guardianIds);

  if (error) {
    throw new Error(`Error al obtener guardianes: ${error.message}`);
  }

  return data;
};

export const fetchCursos = async () => {
  const { data, error } = await supabaseStudentClient
    .from('cursos')
    .select('curso')
    .order('curso');

  // console.log("Data cursos:", data);

  if (error) {
    throw new Error(`Error al obtener los cursos: ${error.message}`);
  }

  const cursosUnicos = [...new Set(data.map((item) => item.curso))];
  return cursosUnicos;
};

export const fetchGrados = async () => {
  const { data, error } = await supabaseStudentClient
    .from('grados')
    .select('grado')
    .order('id');

  // console.log("Data grados:", data);

  if (error) {
    throw new Error(`Error al obtener los grados: ${error.message}`);
  }

  const gradosUnicos = [...new Set(data.map((item) => item.grado))];
  return gradosUnicos;
};

export const fetchFormEnviado = async () => {
  const { data, error } = await supabaseStudentClient
    .from('estudaintes')
    .select('formulario_enviado')
    .order('id');

  // console.log("Data form enviado:", data); 
  // console.log("Error form enviado:", error); 

  if (error) {
    throw new Error(`Error al obtener el estado del formulario: ${error.message}`);
  }

  const estadoFormulario = [...new Set(data.map((item) => item.grado))];
  return estadoFormulario;
};


export const descargarArchivo = async (codigoEstudiante, nombreArchivo) => {
  try {

    const listarBuckets = async () => {
      const { data, error } = await supabaseStudentClient.storage.listBuckets();
    
      if (error) {
        console.error('Error al listar los buckets:', error);
      } else {
        // console.log('Buckets disponibles:', data);
      }
    };
    
    // console.log(listarBuckets())
    
    // Obtener la URL pública del archivo
    const { data, error } = await supabaseStudentClient.storage
      .from('documentos_estudiantes')
      .getPublicUrl(`${codigoEstudiante}/${nombreArchivo}`);

    if (error) {
      throw error;
    }

    // Abrir el archivo en una nueva pestaña
    window.open(data.publicUrl, '_blank');
  } catch (error) {
    console.error('Error al descargar el archivo:', error.message);
    alert('Error al descargar el archivo.');
  }
};


/**
 * Obtiene la URL firmada de la foto de perfil de un estudiante.
 * @param {string} codigoEstudiante - El código del estudiante.
 * @returns {Promise<string|null>} - La URL firmada de la foto o null si no se encuentra.
 */
export const getProfilePhotoUrl = async (codigoEstudiante) => {
  try {
    // Listar archivos en la carpeta 'perfil' del estudiante
    const { data: archivos, error } = await supabaseStudentClient
      .storage
      .from('documentos_estudiantes')
      .list(`${codigoEstudiante}/foto_perfil/`, { limit: 1 });

    if (error) {
      throw error;
    }

    if (!archivos || archivos.length === 0) {
      return null; // No se encontró la foto de perfil
    }

    // Asumimos que solo hay un archivo en la carpeta 'perfil'
    const archivo = archivos[0];
    const filePath = `${codigoEstudiante}/foto_perfil/${archivo.name}`;

    // Crear una URL firmada válida por 1 hora
    const { data: signedUrlData, error: signedUrlError } = await supabaseStudentClient
      .storage
      .from('documentos_estudiantes')
      .createSignedUrl(filePath, 60 * 60); // 60 minutos * 60 segundos

    if (signedUrlError) {
      throw signedUrlError;
    }

    return signedUrlData.signedUrl;
  } catch (error) {
    console.error('Error obteniendo la foto de perfil:', error.message);
    return null;
  }
};


/**
 * Aprobar la matrícula de un estudiante.
 * @param {string} codigoEstudiante - El código del estudiante.
 * @param {string} usuario - El nombre del usuario que aprueba la matrícula.
 * @returns {Promise<{ data: any, error: any }>} - Resultado de la operación.
 */
export const approveMatricula = async (codigoEstudiante, usuario) => {
  try {
    // console.log("usuario approved",usuario)
    const { data, error } = await supabaseStudentClient
      .from('estudiantes')
      .update({
        matricula_aprobada: true,
        fecha_matricula_aprobada: new Date().toISOString(),
        usuario_aprueba_matricula: usuario,
      })
      .eq('codigo_estudiante', codigoEstudiante);

    return { data, error };
  } catch (error) {
    console.error('Error al aprobar la matrícula:', error.message);
    return { data: null, error };
  }
};

/**
 * Obtiene el nombre del usuario autenticado.
 * @returns {Promise<string|null>} - Nombre del usuario o null si no está autenticado.
 */
export const getCurrentUserEmail = async () => {
  try {
    const { data, error } = await supabaseStudentClient.auth.getUser();
    // console.log("Username data: ", data.user.email);
    if (error || !data.user) {
      console.error('Error obteniendo el usuario:', error ? error.message : 'Usuario no autenticado');
      return null;
    }

    return data.user ? data.user.email : null;
  } catch (error) {
    console.error('Error inesperado al obtener el usuario:', error.message);
    return null;
  }
};


/**
 * Obtener los datos de un estudiante por su código de estudiante
 * @param {string} codigoEstudiante - Código del estudiante
 * @returns {Promise<Object|null>} - Datos del estudiante o null si no existe
 */
export const fetchStudentByCodigo = async (codigoEstudiante) => {
  const { data, error } = await supabaseStudentClient
    .from('estudiantes')
    .select('*')
    .eq('codigo_estudiante', codigoEstudiante)
    .single();

  if (error) {
    console.error('Error fetching student data:', error.message);
    throw error;
  }

  return data || null;
};


//POLICIES ACCESS
/**
 * Obtiene el subrol de un usuario específico de bienestar
 * @param {string} userId - ID del usuario
 * @returns {Promise<Object|null>} - Objeto con información del subrol
 */
export const fetchUserSubrole = async (userId) => {
  try {
    const { data, error } = await supabaseStudentClient
      .from('subroles_bienestar')
      .select('*')
      .eq('usuario_id', userId)
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching user subrole:', error);
    return null;
  }
};

/**
 * Verifica si un usuario tiene permiso para un servicio específico
 * @param {string} userId - ID del usuario
 * @param {string} serviceName - Nombre del servicio (bienestar, matriculas, etc.)
 * @param {string} permissionType - Tipo de permiso (read, create, update, delete)
 * @returns {Promise<boolean>} - True si tiene permiso, false si no
 */
export const checkServicePermission = async (userId, serviceName, permissionType) => {
  try {
    const { data, error } = await supabaseStudentClient
      .rpc('check_service_permission', {
        user_id: userId,
        service_name: serviceName,
        permission_type: permissionType
      });
      
    if (error) throw error;
    return !!data;
  } catch (error) {
    console.error('Error checking service permission:', error);
    return false;
  }
};

/**
 * Asigna un subrol a un usuario de bienestar
 * @param {string} userId - ID del usuario
 * @param {string} subrol - Nombre del subrol
 * @param {string} accesoTipo - Tipo de acceso (todos, asignados)
 * @param {string} especialidad - Especialidad del profesional
 * @returns {Promise<Object|null>} - Objeto con información del subrol creado
 */
export const assignUserSubrole = async (userId, subrol, accesoTipo = 'asignados', especialidad = null) => {
  try {
    const { data, error } = await supabaseStudentClient
      .from('subroles_bienestar')
      .upsert({
        usuario_id: userId,
        subrol,
        acceso_tipo: accesoTipo,
        especialidad
      }, { onConflict: 'usuario_id, subrol' })
      .select()
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error assigning user subrole:', error);
    return null;
  }
};

/**
 * Obtiene los permisos de un rol para todos los servicios
 * @param {string} roleName - Nombre del rol
 * @returns {Promise<Array|null>} - Array con los permisos por servicio
 */
export const fetchRolePermissions = async (roleName) => {
  try {
    const { data, error } = await supabaseStudentClient
      .from('permisos_servicio')
      .select('*')
      .eq('rol', roleName);
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching role permissions:', error);
    return null;
  }
};