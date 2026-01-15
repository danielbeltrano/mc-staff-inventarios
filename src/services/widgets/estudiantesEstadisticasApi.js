// estudiantesEstadisticasApi.js
// Servicio para obtener estadísticas de la tabla estudiantes

import { supabaseStudentClient } from '../../core/config/supabase/supabaseCampusStudentClient';

/**
 * API para estadísticas de estudiantes
 * Consulta directa a tabla 'estudiantes' en Supabase
 */
export const estudiantesEstadisticasApi = {
  /**
   * Obtener estadísticas completas de estudiantes
   * @returns {Promise<Object>} Estadísticas agrupadas
   */
  async getEstadisticasCompletas() {
    try {
      // Obtener TODOS los estudiantes con paginación automática
      let allEstudiantes = [];
      let from = 0;
      const BATCH_SIZE = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabaseStudentClient
          .from('estudiantes')
          .select('*')
          .eq('estado', 'Activo')
          .range(from, from + BATCH_SIZE - 1);

        if (error) {
          console.error('Error al obtener estudiantes:', error);
          throw new Error('Error al cargar estadísticas de estudiantes');
        }

        if (data && data.length > 0) {
          allEstudiantes = [...allEstudiantes, ...data];
          from += BATCH_SIZE;
          hasMore = data.length === BATCH_SIZE;
        } else {
          hasMore = false;
        }
      }

      const estudiantes = allEstudiantes;

      if (!estudiantes || estudiantes.length === 0) {
        // console.log('⚠️ No se encontraron estudiantes');
        return {
          total: 0,
          nuevos: 0,
          antiguos: 0,
          conRuta: 0,
          conRestaurante: 0,
          matriculasAprobadas: 0,
          matriculasNoAprobadas: 0,
          formulariosEnviados: 0,
          formulariosPendientes: 0,
          porcentajeNuevos: 0,
          porcentajeAntiguos: 0,
          porcentajeRuta: 0,
          porcentajeRestaurante: 0,
          porcentajeAprobadas: 0,
          porcentajeFormulariosEnviados: 0,
        };
      }

    //   console.log(`✅ Total de estudiantes ACTIVOS cargados: ${estudiantes.length}`);

      if (!estudiantes || estudiantes.length === 0) {
        return {
          total: 0,
          nuevos: 0,
          antiguos: 0,
          conRuta: 0,
          conRestaurante: 0,
          matriculasAprobadas: 0,
          matriculasNoAprobadas: 0,
          formulariosEnviados: 0,
          formulariosPendientes: 0,
          porcentajeNuevos: 0,
          porcentajeAntiguos: 0,
          porcentajeRuta: 0,
          porcentajeRestaurante: 0,
          porcentajeAprobadas: 0,
          porcentajeFormulariosEnviados: 0,
        };
      }

      const total = estudiantes.length;

      // Clasificación por tipo
      const nuevos = estudiantes.filter(
        (e) => e.estudiante_nuevo_antiguo === 'Nuevo'
      ).length;
      const antiguos = estudiantes.filter(
        (e) => e.estudiante_nuevo_antiguo === 'Antiguo'
      ).length;

      // Servicios contratados
      const conRuta = estudiantes.filter(
        (e) => e.servicio_ruta === 'SI'
      ).length;
      const conRestaurante = estudiantes.filter(
        (e) => e.servicio_restaurante === 'SI'
      ).length;

      // Estado de aprobación
      const matriculasAprobadas = estudiantes.filter(
        (e) => e.matricula_aprobada === true
      ).length;
      const matriculasNoAprobadas = estudiantes.filter(
        (e) => e.matricula_aprobada === false || e.matricula_aprobada === null
      ).length;

      // Estado de formularios
      const formulariosEnviados = estudiantes.filter(
        (e) => e.formulario_enviado === true
      ).length;
      const formulariosPendientes = estudiantes.filter(
        (e) => e.formulario_enviado === false || e.formulario_enviado === null
      ).length;

      // Calcular porcentajes
      const porcentajeNuevos = total > 0 ? (nuevos / total) * 100 : 0;
      const porcentajeAntiguos = total > 0 ? (antiguos / total) * 100 : 0;
      const porcentajeRuta = total > 0 ? (conRuta / total) * 100 : 0;
      const porcentajeRestaurante = total > 0 ? (conRestaurante / total) * 100 : 0;
      const porcentajeAprobadas = total > 0 ? (matriculasAprobadas / total) * 100 : 0;
      const porcentajeFormulariosEnviados = total > 0 ? (formulariosEnviados / total) * 100 : 0;

      return {
        total,
        nuevos,
        antiguos,
        conRuta,
        conRestaurante,
        matriculasAprobadas,
        matriculasNoAprobadas,
        formulariosEnviados,
        formulariosPendientes,
        porcentajeNuevos,
        porcentajeAntiguos,
        porcentajeRuta,
        porcentajeRestaurante,
        porcentajeAprobadas,
        porcentajeFormulariosEnviados,
      };
    } catch (error) {
      console.error('Error en getEstadisticasCompletas:', error);
      throw error;
    }
  },

  /**
   * Obtener desglose por grado
   * @returns {Promise<Array>} Estadísticas por grado
   */
  async getEstadisticasPorGrado() {
    try {
      // Obtener TODOS los estudiantes con paginación automática
      let allEstudiantes = [];
      let from = 0;
      const BATCH_SIZE = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabaseStudentClient
          .from('estudiantes')
          .select('grado, estudiante_nuevo_antiguo, servicio_ruta, servicio_restaurante, matricula_aprobada')
          .eq('estado', 'Activo')
          .range(from, from + BATCH_SIZE - 1);

        if (error) throw error;

        if (data && data.length > 0) {
          allEstudiantes = [...allEstudiantes, ...data];
          from += BATCH_SIZE;
          hasMore = data.length === BATCH_SIZE;
        } else {
          hasMore = false;
        }
      }

      const estudiantes = allEstudiantes;

      // Agrupar por grado
      const gradosMap = {};

      estudiantes.forEach((est) => {
        const grado = est.grado || 'Sin Grado';
        
        if (!gradosMap[grado]) {
          gradosMap[grado] = {
            grado,
            total: 0,
            nuevos: 0,
            antiguos: 0,
            conRuta: 0,
            conRestaurante: 0,
            aprobadas: 0,
          };
        }

        gradosMap[grado].total++;
        
        if (est.estudiante_nuevo_antiguo === 'Nuevo') gradosMap[grado].nuevos++;
        if (est.estudiante_nuevo_antiguo === 'Antiguo') gradosMap[grado].antiguos++;
        if (est.servicio_ruta === 'SI') gradosMap[grado].conRuta++;
        if (est.servicio_restaurante === 'SI') gradosMap[grado].conRestaurante++;
        if (est.matricula_aprobada === true) gradosMap[grado].aprobadas++;
      });

      return Object.values(gradosMap).sort((a, b) => b.total - a.total);
    } catch (error) {
      console.error('Error en getEstadisticasPorGrado:', error);
      throw error;
    }
  },

  /**
   * Obtener estudiantes con servicios múltiples
   * @returns {Promise<Object>} Estudiantes con múltiples servicios
   */
  async getEstudiantesConServicios() {
    try {
      // Obtener TODOS los estudiantes con paginación automática
      let allEstudiantes = [];
      let from = 0;
      const BATCH_SIZE = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabaseStudentClient
          .from('estudiantes')
          .select('servicio_ruta, servicio_restaurante')
          .eq('estado', 'Activo')
          .range(from, from + BATCH_SIZE - 1);

        if (error) throw error;

        if (data && data.length > 0) {
          allEstudiantes = [...allEstudiantes, ...data];
          from += BATCH_SIZE;
          hasMore = data.length === BATCH_SIZE;
        } else {
          hasMore = false;
        }
      }

      const estudiantes = allEstudiantes;

      const conAmbosServicios = estudiantes.filter(
        (e) => e.servicio_ruta === 'SI' && e.servicio_restaurante === 'SI'
      ).length;

      const soloRuta = estudiantes.filter(
        (e) => e.servicio_ruta === 'SI' && e.servicio_restaurante !== 'SI'
      ).length;

      const soloRestaurante = estudiantes.filter(
        (e) => e.servicio_restaurante === 'SI' && e.servicio_ruta !== 'SI'
      ).length;

      const sinServicios = estudiantes.filter(
        (e) => e.servicio_ruta !== 'SI' && e.servicio_restaurante !== 'SI'
      ).length;

      return {
        conAmbosServicios,
        soloRuta,
        soloRestaurante,
        sinServicios,
        total: estudiantes.length,
      };
    } catch (error) {
      console.error('Error en getEstudiantesConServicios:', error);
      throw error;
    }
  },
};