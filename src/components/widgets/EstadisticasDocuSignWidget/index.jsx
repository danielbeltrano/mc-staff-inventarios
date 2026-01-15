// EstadisticasDocuSignWidget.jsx
// Widget independiente para estadísticas de contratos DocuSign

import { useState, useEffect } from 'react';
import {
  FileText,
  CheckCircle2,
  Clock,
  Send,
  Loader2,
  AlertCircle,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Users,
} from 'lucide-react';
import { Card, CardHeader, CardContent, CardTitle } from '../../ui/Cards';
import { docusignEstadisticasApi } from '../../../services/widgets/docusignEstadisticasApi';

/**
 * Widget de estadísticas de contratos DocuSign
 * Muestra indicadores de la tabla matriculas_envelopes:
 * - Contratos Activos (status='sent')
 * - Contratos Completados (status='completed')
 * - Contratos Pendientes (sin registro)
 * 
 * @param {Object} props
 * @param {string} props.variant - 'compact' | 'detailed' (default: 'detailed')
 * @param {boolean} props.showDetails - Mostrar detalles expandibles (default: true)
 * @param {Function} props.onDataLoaded - Callback cuando se cargan los datos
 */
const EstadisticasDocuSignWidget = ({
  variant = 'detailed',
  showDetails = true,
  onDataLoaded,
}) => {
  // ============================================
  // ESTADO
  // ============================================
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [seccionesExpandidas, setSeccionesExpandidas] = useState({
    activos: false,
    completados: false,
    pendientes: false,
  });

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
      const data = await docusignEstadisticasApi.getEstadisticasContratos();
      setEstadisticas(data);
      
      if (onDataLoaded) {
        onDataLoaded(data);
      }
    } catch (err) {
      console.error('Error al cargar estadísticas de DocuSign:', err);
      setError(err.message || 'Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  };

  const toggleSeccion = (seccion) => {
    setSeccionesExpandidas(prev => ({
      ...prev,
      [seccion]: !prev[seccion]
    }));
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
  const StatCard = ({ titulo, valor, subtitulo, Icon, color = 'blue', porcentaje, onClick }) => (
    <Card 
      className={`hover:shadow-lg transition-all ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
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
            {porcentaje !== undefined && (
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

  const DetalleContratos = ({ titulo, contratos, color }) => {
    if (!contratos || contratos.length === 0) {
      return null;
    }

    return (
      <div className="mt-3">
        <p className="text-xs font-medium text-gray-700 mb-2">
          {titulo} ({contratos.length}):
        </p>
        <div className="max-h-40 overflow-y-auto space-y-1">
          {contratos.map((contrato, idx) => (
            <div
              key={idx}
              className={`text-xs p-2 bg-${color}-50 border border-${color}-200 rounded`}
            >
              <span className="font-medium">{contrato.codigo}</span>
              {' - '}
              <span>{contrato.nombre}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ============================================
  // RENDER LOADING
  // ============================================
  if (loading) {
    return (
      <Card className="border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-6 h-6 text-purple-600" />
            Estadísticas de Contratos DocuSign
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
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
      <Card className="border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-600" />
            Contratos DocuSign
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-default">
                {estadisticas.contratosActivos.cantidad}
              </p>
              <p className="text-xs text-gray-600">Activos</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {estadisticas.contratosCompletados.cantidad}
              </p>
              <p className="text-xs text-gray-600">Completados</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-default">
                {estadisticas.contratosPendientes.cantidad}
              </p>
              <p className="text-xs text-gray-600">Pendientes</p>
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
      <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-6 h-6 text-purple-600" />
            Estadísticas de Contratos DocuSign
            <span className="ml-auto text-sm font-normal text-gray-600">
              Año Escolar: <span className="font-bold text-purple-600">{estadisticas.anoEscolar}</span>
            </span>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* KPIs principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          titulo="Contratos Activos"
          valor={estadisticas.contratosActivos.cantidad}
          Icon={Send}
          color="blue"
          porcentaje={estadisticas.contratosActivos.porcentaje}
          subtitulo="Enviados y en proceso"
          onClick={showDetails ? () => toggleSeccion('activos') : undefined}
        />
        
        <StatCard
          titulo="Contratos Completados"
          valor={estadisticas.contratosCompletados.cantidad}
          Icon={CheckCircle2}
          color="green"
          porcentaje={estadisticas.contratosCompletados.porcentaje}
          subtitulo="Firmados completamente"
          onClick={showDetails ? () => toggleSeccion('completados') : undefined}
        />
        
        <StatCard
          titulo="Contratos Pendientes"
          valor={estadisticas.contratosPendientes.cantidad}
          Icon={Clock}
          color="amber"
          porcentaje={estadisticas.contratosPendientes.porcentaje}
          subtitulo="Sin enviar o iniciar"
          onClick={showDetails ? () => toggleSeccion('pendientes') : undefined}
        />
      </div>

      {/* Detalles expandibles */}
      {showDetails && (
        <div className="space-y-4">
          {/* Contratos Activos */}
          {estadisticas.contratosActivos.cantidad > 0 && (
            <Card className="border-blue-200">
              <CardContent className="pt-4">
                <button
                  onClick={() => toggleSeccion('activos')}
                  className="w-full flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-2">
                    <Send className="w-5 h-5 text-blue-default" />
                    <span className="font-semibold text-blue-default">
                      Contratos Activos ({estadisticas.contratosActivos.cantidad})
                    </span>
                  </div>
                  {seccionesExpandidas.activos ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </button>
                
                {seccionesExpandidas.activos && (
                  <DetalleContratos
                    titulo="Estudiantes con contratos en proceso"
                    contratos={estadisticas.contratosActivos.detalle}
                    color="blue"
                  />
                )}
              </CardContent>
            </Card>
          )}

          {/* Contratos Pendientes */}
          {estadisticas.contratosPendientes.cantidad > 0 && (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="pt-4">
                <button
                  onClick={() => toggleSeccion('pendientes')}
                  className="w-full flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-default" />
                    <span className="font-semibold text-amber-default">
                      Contratos Pendientes ({estadisticas.contratosPendientes.cantidad})
                    </span>
                  </div>
                  {seccionesExpandidas.pendientes ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </button>
                
                {seccionesExpandidas.pendientes && (
                  <DetalleContratos
                    titulo="Estudiantes sin contrato registrado"
                    contratos={estadisticas.contratosPendientes.detalle}
                    color="amber"
                  />
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Progreso General */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <CheckCircle2 className="w-5 h-5" />
            Progreso de Completitud
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ProgressBar
            porcentaje={estadisticas.contratosCompletados.porcentaje}
            color="green"
            label="Porcentaje de Contratos Completados"
          />
          
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center">
              <Users className="w-6 h-6 mx-auto mb-2 text-gray-700" />
              <p className="text-2xl font-bold text-gray-900">
                {estadisticas.totalEstudiantes}
              </p>
              <p className="text-sm text-gray-600">Total Estudiantes</p>
            </div>
            
            <div className="text-center">
              <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-green-600" />
              <p className="text-2xl font-bold text-green-600">
                {estadisticas.contratosCompletados.cantidad}
              </p>
              <p className="text-sm text-gray-600">Completados</p>
            </div>
            
            <div className="text-center">
              <Clock className="w-6 h-6 mx-auto mb-2 text-amber-default" />
              <p className="text-2xl font-bold text-amber-default">
                {estadisticas.contratosActivos.cantidad + estadisticas.contratosPendientes.cantidad}
              </p>
              <p className="text-sm text-gray-600">Por Completar</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EstadisticasDocuSignWidget;