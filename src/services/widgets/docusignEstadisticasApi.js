// docusignEstadisticasApi.js
// Servicio para obtener estadísticas de contratos DocuSign

import { supabaseStudentClient } from '../../core/config/supabase/supabaseCampusStudentClient';

/**
 * API para estadísticas de contratos DocuSign
 * Consulta tabla 'matriculas_envelopes' y 'estudiantes' en Supabase
 */
export const docusignEstadisticasApi = {
  /**
   * Construir nombre completo del estudiante
   * @param {Object} estudiante - Objeto con primer_nombre, segundo_nombre, primer_apellido, segundo_apellido
   * @returns {string} Nombre completo
   */
  construirNombreCompleto(estudiante) {
    const nombres = [
      estudiante.primer_nombre,
      estudiante.segundo_nombre
    ].filter(Boolean).join(' ');
    
    const apellidos = [
      estudiante.primer_apellido,
      estudiante.segundo_apellido
    ].filter(Boolean).join(' ');
    
    return `${nombres} ${apellidos}`.trim();
  },

  /**
   * Obtener el año escolar actual (año actual + 1)
   * @returns {number} Año escolar
   */
  getAnoEscolarActual() {
    const fechaActual = new Date();
    const anoActual = fechaActual.getFullYear();
    return anoActual + 1;
  },

  /**
   * Obtener estadísticas completas de contratos DocuSign
   * @returns {Promise<Object>} Estadísticas de contratos
   */
  async getEstadisticasContratos() {
    try {
      const anoEscolar = this.getAnoEscolarActual();

      // Obtener TODOS los estudiantes con paginación automática
      let allEstudiantes = [];
      let from = 0;
      const BATCH_SIZE = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error: errorEstudiantes } = await supabaseStudentClient
          .from('estudiantes')
          .select('codigo_estudiante, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido')
          .eq('estado', 'Activo')
          .range(from, from + BATCH_SIZE - 1);

        if (errorEstudiantes) {
          console.error('Error al obtener estudiantes:', errorEstudiantes);
          throw new Error('Error al cargar estudiantes');
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
    //   console.log(`✅ Total de estudiantes ACTIVOS cargados para DocuSign: ${estudiantes.length}`);

      // Obtener TODOS los envelopes con paginación automática
      let allEnvelopes = [];
      from = 0;
      hasMore = true;

      while (hasMore) {
        const { data, error: errorEnvelopes } = await supabaseStudentClient
          .from('matriculas_envelopes')
          .select('*')
          .eq('ano_escolar', anoEscolar)
          .range(from, from + BATCH_SIZE - 1);

        if (errorEnvelopes) {
          console.error('Error al obtener envelopes:', errorEnvelopes);
          throw new Error('Error al cargar contratos DocuSign');
        }

        if (data && data.length > 0) {
          allEnvelopes = [...allEnvelopes, ...data];
          from += BATCH_SIZE;
          hasMore = data.length === BATCH_SIZE;
        } else {
          hasMore = false;
        }
      }

      const envelopes = allEnvelopes;

      const totalEstudiantes = estudiantes.length;

      // Crear mapa de envelopes por student_code
      const envelopesMap = {};
      (envelopes || []).forEach((env) => {
        envelopesMap[env.student_code] = env;
      });

      // Clasificar estudiantes
      const contratosActivos = [];
      const contratosCompletados = [];
      const contratosPendientes = [];

      estudiantes.forEach((est) => {
        const envelope = envelopesMap[est.codigo_estudiante];
        
        if (!envelope) {
          // No tiene registro de envelope
          contratosPendientes.push({
            codigo: est.codigo_estudiante,
            nombre: this.construirNombreCompleto(est),
            estado: 'sin_registro',
          });
        } else if (envelope.status === 'sent') {
          // Contrato activo (enviado pero no completado)
          contratosActivos.push({
            codigo: est.codigo_estudiante,
            nombre: this.construirNombreCompleto(est),
            envelopeId: envelope.envelope_id,
            fechaEnvio: envelope.created_at,
          });
        } else if (envelope.status === 'completed') {
          // Contrato completado
          contratosCompletados.push({
            codigo: est.codigo_estudiante,
            nombre: this.construirNombreCompleto(est),
            envelopeId: envelope.envelope_id,
            fechaCompletado: envelope.updated_at,
          });
        } else {
          // Otros estados considerados como pendientes
          contratosPendientes.push({
            codigo: est.codigo_estudiante,
            nombre: this.construirNombreCompleto(est),
            estado: envelope.status || 'sin_estado',
            envelopeId: envelope.envelope_id,
          });
        }
      });

      // Calcular porcentajes
      const porcentajeActivos = totalEstudiantes > 0 
        ? (contratosActivos.length / totalEstudiantes) * 100 
        : 0;
      const porcentajeCompletados = totalEstudiantes > 0 
        ? (contratosCompletados.length / totalEstudiantes) * 100 
        : 0;
      const porcentajePendientes = totalEstudiantes > 0 
        ? (contratosPendientes.length / totalEstudiantes) * 100 
        : 0;

      return {
        anoEscolar,
        totalEstudiantes,
        contratosActivos: {
          cantidad: contratosActivos.length,
          porcentaje: porcentajeActivos,
          detalle: contratosActivos,
        },
        contratosCompletados: {
          cantidad: contratosCompletados.length,
          porcentaje: porcentajeCompletados,
          detalle: contratosCompletados,
        },
        contratosPendientes: {
          cantidad: contratosPendientes.length,
          porcentaje: porcentajePendientes,
          detalle: contratosPendientes,
        },
      };
    } catch (error) {
      console.error('Error en getEstadisticasContratos:', error);
      throw error;
    }
  },

  /**
   * Obtener contratos por estado específico
   * @param {string} estado - Estado del contrato ('sent', 'completed', etc.)
   * @returns {Promise<Array>} Lista de contratos con ese estado
   */
  async getContratosPorEstado(estado) {
    try {
      const anoEscolar = this.getAnoEscolarActual();

      const { data: envelopes, error } = await supabaseStudentClient
        .from('matriculas_envelopes')
        .select(`
          *,
          estudiantes!inner(codigo_estudiante, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, estado)
        `)
        .eq('ano_escolar', anoEscolar)
        .eq('status', estado)
        .eq('estudiantes.estado', 'Activo')
        .limit(10000);

      if (error) throw error;

      return (envelopes || []).map((env) => ({
        codigo: env.student_code,
        nombre: this.construirNombreCompleto(env.estudiantes),
        envelopeId: env.envelope_id,
        estado: env.status,
        fechaCreacion: env.created_at,
        fechaActualizacion: env.updated_at,
      }));
    } catch (error) {
      console.error('Error en getContratosPorEstado:', error);
      throw error;
    }
  },

  /**
   * Obtener estudiantes sin contrato registrado
   * @returns {Promise<Array>} Estudiantes sin envelope
   */
  async getEstudiantesSinContrato() {
    try {
      const anoEscolar = this.getAnoEscolarActual();

      // Obtener TODOS los estudiantes con paginación automática
      let allEstudiantes = [];
      let from = 0;
      const BATCH_SIZE = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error: errorEstudiantes } = await supabaseStudentClient
          .from('estudiantes')
          .select('codigo_estudiante, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, grado')
          .eq('estado', 'Activo')
          .range(from, from + BATCH_SIZE - 1);

        if (errorEstudiantes) throw errorEstudiantes;

        if (data && data.length > 0) {
          allEstudiantes = [...allEstudiantes, ...data];
          from += BATCH_SIZE;
          hasMore = data.length === BATCH_SIZE;
        } else {
          hasMore = false;
        }
      }

      const estudiantes = allEstudiantes;

      // Obtener códigos de estudiantes con envelope (con paginación)
      let allEnvelopes = [];
      from = 0;
      hasMore = true;

      while (hasMore) {
        const { data, error: errorEnvelopes } = await supabaseStudentClient
          .from('matriculas_envelopes')
          .select('student_code')
          .eq('ano_escolar', anoEscolar)
          .range(from, from + BATCH_SIZE - 1);

        if (errorEnvelopes) throw errorEnvelopes;

        if (data && data.length > 0) {
          allEnvelopes = [...allEnvelopes, ...data];
          from += BATCH_SIZE;
          hasMore = data.length === BATCH_SIZE;
        } else {
          hasMore = false;
        }
      }

      const envelopes = allEnvelopes;

      const codigosConEnvelope = new Set(
        (envelopes || []).map((env) => env.student_code)
      );

      // Filtrar estudiantes sin envelope
      const estudiantesSinContrato = estudiantes.filter(
        (est) => !codigosConEnvelope.has(est.codigo_estudiante)
      );

      return estudiantesSinContrato.map((est) => ({
        codigo: est.codigo_estudiante,
        nombre: this.construirNombreCompleto(est),
        grado: est.grado,
      }));
    } catch (error) {
      console.error('Error en getEstudiantesSinContrato:', error);
      throw error;
    }
  },

  /**
   * Obtener estadísticas de contratos por grado
   * @returns {Promise<Array>} Estadísticas agrupadas por grado
   */
  async getEstadisticasPorGrado() {
    try {
      const anoEscolar = this.getAnoEscolarActual();

      // Obtener TODOS los estudiantes con paginación automática
      let allEstudiantes = [];
      let from = 0;
      const BATCH_SIZE = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error: errorEstudiantes } = await supabaseStudentClient
          .from('estudiantes')
          .select('codigo_estudiante, grado')
          .eq('estado', 'Activo')
          .range(from, from + BATCH_SIZE - 1);

        if (errorEstudiantes) throw errorEstudiantes;

        if (data && data.length > 0) {
          allEstudiantes = [...allEstudiantes, ...data];
          from += BATCH_SIZE;
          hasMore = data.length === BATCH_SIZE;
        } else {
          hasMore = false;
        }
      }

      const estudiantes = allEstudiantes;

      // Obtener envelopes con paginación automática
      let allEnvelopes = [];
      from = 0;
      hasMore = true;

      while (hasMore) {
        const { data, error: errorEnvelopes } = await supabaseStudentClient
          .from('matriculas_envelopes')
          .select('student_code, status')
          .eq('ano_escolar', anoEscolar)
          .range(from, from + BATCH_SIZE - 1);

        if (errorEnvelopes) throw errorEnvelopes;

        if (data && data.length > 0) {
          allEnvelopes = [...allEnvelopes, ...data];
          from += BATCH_SIZE;
          hasMore = data.length === BATCH_SIZE;
        } else {
          hasMore = false;
        }
      }

      const envelopes = allEnvelopes;

      // Crear mapa de envelopes
      const envelopesMap = {};
      (envelopes || []).forEach((env) => {
        envelopesMap[env.student_code] = env.status;
      });

      // Agrupar por grado
      const gradosMap = {};

      estudiantes.forEach((est) => {
        const grado = est.grado || 'Sin Grado';
        const status = envelopesMap[est.codigo_estudiante];

        if (!gradosMap[grado]) {
          gradosMap[grado] = {
            grado,
            total: 0,
            activos: 0,
            completados: 0,
            pendientes: 0,
          };
        }

        gradosMap[grado].total++;

        if (status === 'sent') {
          gradosMap[grado].activos++;
        } else if (status === 'completed') {
          gradosMap[grado].completados++;
        } else {
          gradosMap[grado].pendientes++;
        }
      });

      return Object.values(gradosMap).sort((a, b) => b.total - a.total);
    } catch (error) {
      console.error('Error en getEstadisticasPorGrado:', error);
      throw error;
    }
  },
};