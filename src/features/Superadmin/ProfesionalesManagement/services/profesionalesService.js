// services/profesionalesService.js
import { supabaseStudentClient } from "../../../../core/config/supabase/supabaseCampusStudentClient";

/**
 * Servicio para gestión de profesionales de bienestar
 * Contiene todas las operaciones de base de datos relacionadas con profesionales
 */
export class ProfesionalesService {
  
  /**
   * Obtiene todos los profesionales con sus categorías relacionadas
   * @returns {Promise<Object>} Datos de profesionales
   */
  static async getAllProfesionales() {
    try {
      const { data: profesionalesData, error: profesionalesError } = await supabaseStudentClient
        .from("profesionales")
        .select(`
          *,
          categorias!profesionales_categoria_id_fkey ( id, nombre )
        `)
        .order("nombre", { ascending: true });

      if (profesionalesError) throw profesionalesError;

      return {
        success: true,
        data: profesionalesData || [],
        error: null
      };
    } catch (error) {
      console.error("Error loading profesionales:", error);
      return {
        success: false,
        data: [],
        error: error.message
      };
    }
  }

  /**
   * Obtiene el personal MC activo para vincular
   * @returns {Promise<Object>} Lista de personal MC
   */
  static async getPersonalMC() {
    try {
      const { data: personalData, error: personalError } =
        await supabaseStudentClient
          .from("personal_mc")
          .select(
            "uuid, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, correo_institucional, rol, estado"
          )
          .eq("estado", "activo")
          .order("primer_apellido", { ascending: true });

      if (personalError) throw personalError;

      return {
        success: true,
        data: personalData || [],
        error: null
      };
    } catch (error) {
      console.error("Error loading personal MC:", error);
      return {
        success: false,
        data: [],
        error: error.message
      };
    }
  }

  /**
   * Obtiene todas las categorías de profesionales
   * @returns {Promise<Object>} Lista de categorías
   */
  static async getCategorias() {
    try {
      const { data: categoriasData, error: categoriasError } =
        await supabaseStudentClient
          .from("categorias")
          .select("*")
          .order("nombre", { ascending: true });

      if (categoriasError) throw categoriasError;

      return {
        success: true,
        data: categoriasData || [],
        error: null
      };
    } catch (error) {
      console.error("Error loading categorias:", error);
      return {
        success: false,
        data: [],
        error: error.message
      };
    }
  }

  /**
   * Crea un nuevo profesional
   * @param {Object} profesionalData - Datos del profesional
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async createProfesional(profesionalData) {
    try {
      const { data, error } = await supabaseStudentClient
        .from("profesionales")
        .insert([profesionalData])
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data,
        error: null
      };
    } catch (error) {
      console.error("Error creating profesional:", error);
      return {
        success: false,
        data: null,
        error: error.message
      };
    }
  }

  /**
   * Actualiza un profesional existente
   * @param {number} profesionalId - ID del profesional
   * @param {Object} profesionalData - Datos actualizados
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async updateProfesional(profesionalId, profesionalData) {
    try {
      const { data, error } = await supabaseStudentClient
        .from("profesionales")
        .update(profesionalData)
        .eq("id", profesionalId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data,
        error: null
      };
    } catch (error) {
      console.error("Error updating profesional:", error);
      return {
        success: false,
        data: null,
        error: error.message
      };
    }
  }

  /**
   * Cambia el estado activo/inactivo de un profesional
   * @param {number} profesionalId - ID del profesional
   * @param {boolean} nuevoEstado - Nuevo estado (true/false)
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async toggleProfesionalStatus(profesionalId, nuevoEstado) {
    try {
      const { data, error } = await supabaseStudentClient
        .from("profesionales")
        .update({ activo: nuevoEstado })
        .eq("id", profesionalId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data,
        error: null
      };
    } catch (error) {
      console.error("Error toggling profesional status:", error);
      return {
        success: false,
        data: null,
        error: error.message
      };
    }
  }

  /**
   * Calcula las estadísticas de profesionales
   * @param {Array} profesionales - Lista de profesionales
   * @returns {Object} Estadísticas calculadas
   */
  static calculateStats(profesionales) {
    const totalProfesionales = profesionales.length;
    const activeProfesionales = profesionales.filter(p => p.activo).length;
    const inactiveProfesionales = totalProfesionales - activeProfesionales;
    const profesionalesSinVinculo = profesionales.filter(p => !p.personal_mc_uuid).length;
    const cargaCasosTotal = profesionales.reduce((sum, p) => sum + (p.carga_casos_actual || 0), 0);
    const disponiblesAsignacion = profesionales.filter(p => p.disponible_asignacion && p.activo).length;

    // Distribución por categorías
    const categoriasDistribution = {};
    profesionales.forEach(p => {
      if (p.categorias?.nombre) {
        categoriasDistribution[p.categorias.nombre] = (categoriasDistribution[p.categorias.nombre] || 0) + 1;
      }
    });

    return {
      totalProfesionales,
      activeProfesionales,
      inactiveProfesionales,
      profesionalesSinVinculo,
      cargaCasosTotal,
      disponiblesAsignacion,
      categoriasDistribution
    };
  }

  /**
   * Obtiene todos los datos necesarios para la gestión de profesionales
   * @returns {Promise<Object>} Todos los datos combinados
   */
  static async loadAllData() {
    try {
      // Ejecutar todas las consultas en paralelo
      const [
        profesionalesResult,
        personalResult,
        categoriasResult
      ] = await Promise.all([
        this.getAllProfesionales(),
        this.getPersonalMC(),
        this.getCategorias()
      ]);

      // Verificar errores
      if (!profesionalesResult.success) {
        throw new Error(`Error cargando profesionales: ${profesionalesResult.error}`);
      }
      if (!personalResult.success) {
        throw new Error(`Error cargando personal MC: ${personalResult.error}`);
      }
      if (!categoriasResult.success) {
        throw new Error(`Error cargando categorías: ${categoriasResult.error}`);
      }

      // Calcular estadísticas
      const stats = this.calculateStats(profesionalesResult.data);

      console.log('📊 Data loaded successfully:', {
        profesionales: profesionalesResult.data.length,
        personal: personalResult.data.length,
        categorias: categoriasResult.data.length,
        stats
      });

      return {
        success: true,
        data: {
          profesionales: profesionalesResult.data,
          personalMC: personalResult.data,
          categorias: categoriasResult.data,
          stats
        },
        error: null
      };
    } catch (error) {
      console.error("Error loading all data:", error);
      return {
        success: false,
        data: null,
        error: error.message
      };
    }
  }

  /**
   * Valida los datos de un profesional antes de guardar
   * @param {Object} profesionalData - Datos a validar
   * @returns {Object} Resultado de la validación
   */
  static validateProfesionalData(profesionalData) {
    const errors = [];

    if (!profesionalData.nombre || !profesionalData.nombre.trim()) {
      errors.push("El nombre es requerido");
    }

    if (!profesionalData.especialidad || !profesionalData.especialidad.trim()) {
      errors.push("La especialidad es requerida");
    }

    if (profesionalData.correo && profesionalData.correo.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(profesionalData.correo.trim())) {
        errors.push("El formato del correo electrónico no es válido");
      }
    }

    if (profesionalData.carga_casos_maxima < 1 || profesionalData.carga_casos_maxima > 100) {
      errors.push("La carga máxima de casos debe estar entre 1 y 100");
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Prepara los datos del profesional para guardar
   * @param {Object} rawData - Datos sin procesar del formulario
   * @returns {Object} Datos procesados y limpios
   */
  static prepareProfesionalData(rawData) {
    return {
      nombre: rawData.nombre?.trim() || "",
      especialidad: rawData.especialidad?.trim() || "",
      categoria_id: rawData.categoria_id || null,
      correo: rawData.correo?.trim() || null,
      personal_mc_uuid: rawData.personal_mc_uuid || null,
      grados_atencion: rawData.grados_atencion || ["GENERAL"],
      carga_casos_maxima: parseInt(rawData.carga_casos_maxima) || 50,
      disponible_asignacion: Boolean(rawData.disponible_asignacion),
      activo: Boolean(rawData.activo),
      permiso_crear_cualquier_caso: Boolean(rawData.permiso_crear_cualquier_caso)
    };
  }
}