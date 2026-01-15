// EstadisticasEstudiantesWidget.jsx
// Widget independiente para estadísticas de la tabla estudiantes

import { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  UserCheck,
  Bus,
  Utensils,
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
  Loader2,
  AlertCircle,
  TrendingUp,
  GraduationCap,
} from 'lucide-react';
import { Card, CardHeader, CardContent, CardTitle } from '../../ui/Cards';
import { estudiantesEstadisticasApi } from '../../../services/widgets/estudiantesEstadisticasApi';

/**
 * Widget de estadísticas de estudiantes
 * Muestra indicadores de la tabla estudiantes:
 * - Clasificación (nuevos/antiguos)
 * - Servicios (ruta/restaurante)
 * - Estado de aprobación
 * - Estado de formularios
 * 
 * @param {Object} props
 * @param {string} props.variant - 'compact' | 'detailed' (default: 'detailed')
 * @param {boolean} props.showPercentages - Mostrar porcentajes (default: true)
 * @param {Function} props.onDataLoaded - Callback cuando se cargan los datos
 */
const EstadisticasEstudiantesWidget = ({
  variant = 'detailed',
  showPercentages = true,
  onDataLoaded,
}) => {
  // ============================================
  // ESTADO
  // ============================================
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ============================================
  // EFECTOS
  // ============================================
  useEffect(() => {
    cargarEstadisticas();
  }, []);

  // ============================================
  // FUNCIONES
  // ============================================
  const cargarEstadisticas = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await estudiantesEstadisticasApi.getEstadisticasCompletas();
      setEstadisticas(data);
      
      if (onDataLoaded) {
        onDataLoaded(data);
      }
    } catch (err) {
      console.error('Error al cargar estadísticas de estudiantes:', err);
      setError(err.message || 'Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // UTILIDADES
  // ============================================
  const formatearPorcentaje = (valor) => {
    return `${parseFloat(valor).toFixed(1)}%`;
  };

  // ============================================
  // COMPONENTES AUXILIARES
  // ============================================
  const StatCard = ({ titulo, valor, subtitulo, Icon, color = 'blue', porcentaje }) => (
    <Card className="hover:shadow-lg transition-all">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-gray-600 mb-1">{titulo}</p>
            <p className={`text-3xl font-bold text-${color}-default`}>
              {valor}
            </p>
            {subtitulo && (
              <p className="text-xs text-gray-500 mt-1">{subtitulo}</p>
            )}
            {showPercentages && porcentaje !== undefined && (
              <div className="mt-2 flex items-center gap-1 text-xs text-gray-600">
                <TrendingUp className="w-3 h-3" />
                <span>{formatearPorcentaje(porcentaje)}</span>
              </div>
            )}
          </div>
          {Icon && (
            <div className={`text-${color}-default opacity-20`}>
              <Icon className="w-10 h-10" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const ProgressBar = ({ porcentaje, color = 'blue', label }) => {
    const pct = Math.max(0, Math.min(Number(porcentaje) || 0, 100));

    const colorMap = {
      blue: 'bg-blue-default',
      amber: 'bg-amber-default',
      green: 'bg-green-600',
      red: 'bg-red-600',
      purple: 'bg-purple-600',
      orange: 'bg-orange-500',
    };

    const bgClass = colorMap[color] || colorMap.blue;

    return (
      <div className="w-full">
        {label && (
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">{label}</span>
            <span className="font-medium text-gray-900">{formatearPorcentaje(pct)}</span>
          </div>
        )}
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${bgClass}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    );
  };

  // ============================================
  // RENDER LOADING
  // ============================================
  if (loading) {
    return (
      <Card className="border-blue-default">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-default" />
            Estadísticas de Estudiantes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-blue-default animate-spin" />
            <span className="ml-3 text-gray-600">Cargando estadísticas...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ============================================
  // RENDER ERROR
  // ============================================
  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-800">
            <AlertCircle className="w-6 h-6" />
            Error al Cargar Estadísticas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-700">{error}</p>
          <button
            onClick={cargarEstadisticas}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Reintentar
          </button>
        </CardContent>
      </Card>
    );
  }

  // ============================================
  // RENDER COMPACT
  // ============================================
  if (variant === 'compact') {
    return (
      <Card className="border-blue-default">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-blue-default" />
            Estudiantes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-default">{estadisticas.total}</p>
              <p className="text-xs text-gray-600">Total</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{estadisticas.nuevos}</p>
              <p className="text-xs text-gray-600">Nuevos</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-default">{estadisticas.antiguos}</p>
              <p className="text-xs text-gray-600">Antiguos</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {estadisticas.matriculasAprobadas}
              </p>
              <p className="text-xs text-gray-600">Aprobadas</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ============================================
  // RENDER DETAILED
  // ============================================
  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-blue-default bg-gradient-to-r from-blue-50 to-sky-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-blue-default" />
            Estadísticas de Estudiantes
            <span className="ml-auto text-sm font-normal text-gray-600">
              Total: <span className="font-bold text-blue-default">{estadisticas.total}</span>
            </span>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* KPIs principales - Clasificación */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Users className="w-4 h-4" />
          Clasificación de Estudiantes
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StatCard
            titulo="Estudiantes Nuevos"
            valor={estadisticas.nuevos}
            Icon={UserPlus}
            color="green"
            porcentaje={estadisticas.porcentajeNuevos}
            subtitulo="Primera vez en la institución"
          />
          
          <StatCard
            titulo="Estudiantes Antiguos"
            valor={estadisticas.antiguos}
            Icon={UserCheck}
            color="blue"
            porcentaje={estadisticas.porcentajeAntiguos}
            subtitulo="Continuidad en la institución"
          />
        </div>
      </div>

      {/* Servicios Contratados */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Utensils className="w-4 h-4" />
          Servicios Adicionales
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StatCard
            titulo="Servicio de Ruta"
            valor={estadisticas.conRuta}
            Icon={Bus}
            color="amber"
            porcentaje={estadisticas.porcentajeRuta}
            subtitulo="Transporte escolar contratado"
          />
          
          <StatCard
            titulo="Servicio de Restaurante"
            valor={estadisticas.conRestaurante}
            Icon={Utensils}
            color="orange"
            porcentaje={estadisticas.porcentajeRestaurante}
            subtitulo="Alimentación escolar contratada"
          />
        </div>
      </div>

      {/* Estado de Aprobación y Formularios */}
      <Card className="border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-default">
            <CheckCircle2 className="w-5 h-5" />
            Estado de Matrículas y Formularios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Matrículas Aprobadas */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Estado de Aprobación de Matrículas
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                    <div>
                      <p className="text-2xl font-bold text-green-600">
                        {estadisticas.matriculasAprobadas}
                      </p>
                      <p className="text-sm text-gray-600">Aprobadas</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center gap-3">
                    <XCircle className="w-8 h-8 text-red-600" />
                    <div>
                      <p className="text-2xl font-bold text-red-600">
                        {estadisticas.matriculasNoAprobadas}
                      </p>
                      <p className="text-sm text-gray-600">Pendientes</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <ProgressBar
                porcentaje={estadisticas.porcentajeAprobadas}
                color="green"
                label="Porcentaje de Aprobación"
              />
            </div>

            {/* Formularios Enviados */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Estado de Formularios
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-blue-default" />
                    <div>
                      <p className="text-2xl font-bold text-blue-default">
                        {estadisticas.formulariosEnviados}
                      </p>
                      <p className="text-sm text-gray-600">Formularios Enviados</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="flex items-center gap-3">
                    <Clock className="w-8 h-8 text-amber-default" />
                    <div>
                      <p className="text-2xl font-bold text-amber-default">
                        {estadisticas.formulariosPendientes}
                      </p>
                      <p className="text-sm text-gray-600">Formularios Pendientes</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <ProgressBar
                porcentaje={estadisticas.porcentajeFormulariosEnviados}
                color="blue"
                label="Porcentaje de Formularios Completados"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumen General */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-default">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <Users className="w-8 h-8 mx-auto mb-2 text-blue-default" />
              <p className="text-2xl font-bold text-blue-default">{estadisticas.total}</p>
              <p className="text-sm text-gray-700">Total Estudiantes</p>
            </div>
            
            <div className="text-center">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <p className="text-2xl font-bold text-green-600">
                {formatearPorcentaje(estadisticas.porcentajeAprobadas)}
              </p>
              <p className="text-sm text-gray-700">Aprobación</p>
            </div>
            
            <div className="text-center">
              <Bus className="w-8 h-8 mx-auto mb-2 text-amber-default" />
              <p className="text-2xl font-bold text-amber-default">
                {formatearPorcentaje(estadisticas.porcentajeRuta)}
              </p>
              <p className="text-sm text-gray-700">Con Ruta</p>
            </div>
            
            <div className="text-center">
              <Utensils className="w-8 h-8 mx-auto mb-2 text-orange-500" />
              <p className="text-2xl font-bold text-orange-500">
                {formatearPorcentaje(estadisticas.porcentajeRestaurante)}
              </p>
              <p className="text-sm text-gray-700">Con Restaurante</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EstadisticasEstudiantesWidget;