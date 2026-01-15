import React from "react";
import {
  UserCheck,
  UserX,
  Users,
  Edit,
  Save,
  X,
  AlertTriangle,
  CheckCircle,
  Filter,
  Activity,
  Stethoscope,
  GraduationCap,
  RefreshCw,
  UserPlus,
  Power,
  PowerOff,
  Mail,
  Badge,
  TrendingUp
} from "lucide-react";
import UniversalSearchFilter from "../../../../components/ui/UniversalSearchFilter";
import Pagination from "../../../../components/ui/Pagination";
import { Card } from "../../../../components/ui/Cards";
import { Button } from "../../../../components/ui/Button";
import useScreenSize from "../../../../hooks/useScreenSize";
import LoadingSpinner from "../../../../components/LoadingSpinner";

/**
 * Componente de presentación para la gestión de profesionales
 * Recibe todas las props y handlers del container
 */
const ProfesionalesManagement = ({
  // Datos
  profesionales,
  personalMC,
  categorias,
  stats,
  loading,
  message,
  
  // Estados de UI
  editingProfesional,
  creatingNew,
  
  // Estados de búsqueda y filtros
  searchValue,
  filterValues,
  
  // Estados de paginación
  currentPage,
  itemsPerPage,
  
  // Datos procesados
  filteredProfesionales,
  paginatedData,
  
  // Handlers
  loadData,
  handleSearchChange,
  handleFilterChange,
  handleQuickFilterApply,
  handleClearFilters,
  handlePageChange,
  handleItemsPerPageChange,
  toggleProfesionalStatus,
  handleCreateNew,
  handleEditProfesional,
  handleInputChange,
  handleNivelesAtencionChange,
  saveProfesional,
  handleCancelEdit
}) => {
  const screenSize = useScreenSize();
  const isMobile = screenSize.width <= 768;

  // Configuraciones estáticas
  const nivelesAtencion = [
    { value: 'INICIAL', label: 'Nivel Inicial', color: 'bg-green-100 text-green-800' },
    { value: 'PRIMARIA_ALTA', label: 'Primaria Alta', color: 'bg-blue-100 text-blue-800' },
    { value: 'SECUNDARIA', label: 'Secundaria', color: 'bg-purple-100 text-purple-800' },
    { value: 'GENERAL', label: 'General (Todos)', color: 'bg-amber-100 text-amber-800' }
  ];

  // Configuración de filtros
  const filters = [
    {
      key: "categoria",
      type: "select",
      label: "Categoría",
      options: categorias
        .filter(cat => cat && cat.id && cat.nombre) // Filtrar elementos válidos
        .map((cat) => ({
          value: cat.id.toString(), // Asegurar que sea string
          label: cat.nombre,
        })),
      placeholder: "Todas las categorías",
    },
    {
      key: "estado",
      type: "select",
      label: "Estado",
      options: [
        { value: "true", label: "Activo" },
        { value: "false", label: "Inactivo" },
      ],
      placeholder: "Cualquier estado",
    },
    {
      key: "vinculo_personal",
      type: "select",
      label: "Vínculo Personal",
      options: [
        { value: "con_vinculo", label: "Vinculado a Personal MC" },
        { value: "sin_vinculo", label: "Sin vincular" },
      ],
      placeholder: "Cualquier vínculo",
    },
    {
      key: "disponibilidad",
      type: "select",
      label: "Disponibilidad",
      options: [
        { value: "true", label: "Disponible para asignación" },
        { value: "false", label: "No disponible" },
      ],
      placeholder: "Cualquier disponibilidad",
    },
    {
      key: "nivel_atencion",
      type: "select",
      label: "Nivel de Atención",
      options: nivelesAtencion.map(nivel => ({
        value: nivel.value,
        label: nivel.label
      })),
      placeholder: "Cualquier nivel",
    },
    {
      key: "carga_casos",
      type: "select",
      label: "Carga de Casos",
      options: [
        { value: "sin_casos", label: "Sin casos asignados" },
        { value: "baja", label: "Carga baja (1-10)" },
        { value: "media", label: "Carga media (11-25)" },
        { value: "alta", label: "Carga alta (26-40)" },
        { value: "muy_alta", label: "Carga muy alta (>40)" },
      ],
      placeholder: "Cualquier carga",
    },
  ];

  // Filtros rápidos
  const quickFilters = [
    {
      label: "Profesionales Inactivos",
      filters: { estado: "false" },
    },
    {
      label: "Sin Vínculo Personal",
      filters: { vinculo_personal: "sin_vinculo" },
    },
    {
      label: "Disponibles Asignación",
      filters: { disponibilidad: "true", estado: "true" },
    },
    {
      label: "Psicoorientación",
      filters: { categoria: "8" },
    },
    {
      label: "Sin Casos Asignados",
      filters: { carga_casos: "sin_casos" },
    },
    {
      label: "Atención General",
      filters: { nivel_atencion: "GENERAL" },
    },
  ];

  // Funciones auxiliares para badges y UI
  const getEstadoBadge = (profesional) => {
    if (profesional.activo) {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
          <UserCheck className="h-3 w-3 mr-1" />
          Activo
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
          <UserX className="h-3 w-3 mr-1" />
          Inactivo
        </span>
      );
    }
  };

  const getDisponibilidadBadge = (profesional) => {
    if (!profesional.activo) {
      return (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">
          N/A
        </span>
      );
    }

    if (profesional.disponible_asignacion) {
      return (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
          Disponible
        </span>
      );
    } else {
      return (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
          No Disponible
        </span>
      );
    }
  };

  const getCargaCasosBadge = (cargaActual, cargaMaxima) => {
    const percentage = cargaMaxima > 0 ? (cargaActual / cargaMaxima) * 100 : 0;
    
    let colorClass = "bg-green-100 text-green-800";
    if (percentage >= 80) {
      colorClass = "bg-red-100 text-red-800";
    } else if (percentage >= 60) {
      colorClass = "bg-yellow-100 text-yellow-800";
    }

    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${colorClass}`}>
        {cargaActual}/{cargaMaxima}
      </span>
    );
  };

  const getPersonalVinculado = (profesional) => {
    if (!profesional.personal_mc_uuid) {
      return (
        <span className="text-sm text-gray-500 italic">
          Sin vincular
        </span>
      );
    }

    const personalVinculado = personalMC.find(p => p.uuid === profesional.personal_mc_uuid);
    if (!personalVinculado) {
      return (
        <span className="text-sm text-red-500">
          Vínculo no encontrado
        </span>
      );
    }

    return (
      <div className="text-sm">
        <div className="font-medium text-neutral-text">
          {personalVinculado.primer_nombre} {personalVinculado.primer_apellido}
        </div>
        <div className="text-xs text-gray-500">
          {personalVinculado.correo_institucional}
        </div>
      </div>
    );
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className={`min-h-screen bg-white ${isMobile ? "px-2" : ""}`}>
      <div className="mx-auto py-6 px-2 sm:px-6 lg:px-8">
        {/* Header */}
        <div className={`mb-8 ${isMobile ? "pt-14" : ""}`}>
          <div className={`flex mb-4 ${isMobile ? "flex-col gap-4" : "items-center justify-between"}`}>
            <div className="flex items-center gap-3">
              <Stethoscope className="h-8 w-8 text-amber-default" />
              <h1 className="text-3xl font-bold text-blue-default">
                Gestión de Profesionales de Bienestar
              </h1>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="amber"
                onClick={loadData}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 rounded-md transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
              
              <Button
                onClick={handleCreateNew}
                className="flex items-center gap-2 px-4 py-2 rounded-md transition-colors disabled:opacity-50"
              >
                <UserPlus className="h-4 w-4" />
                Nuevo Profesional
              </Button>
            </div>
          </div>
          <p className="text-gray-600">
            Administra los profesionales de bienestar, sus especialidades, categorías y niveles de atención
          </p>
        </div>

        {/* Estadísticas principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg border-l-4 border-l-blue-default">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-8 w-8 text-blue-default" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Profesionales
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.totalProfesionales}
                    </dd>
                    <dd className="text-xs text-gray-500">
                      {stats.activeProfesionales} activos • {stats.inactiveProfesionales} inactivos
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg border-l-4 border-l-green-500">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UserCheck className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Disponibles Asignación
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.disponiblesAsignacion}
                    </dd>
                    <dd className="text-xs text-green-600">
                      {stats.activeProfesionales > 0 ? 
                        ((stats.disponiblesAsignacion / stats.activeProfesionales) * 100).toFixed(1) 
                        : 0}% de activos
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg border-l-4 border-l-amber-500">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Activity className="h-8 w-8 text-amber-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Casos Asignados
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.cargaCasosTotal}
                    </dd>
                    <dd className="text-xs text-amber-600">
                      Carga total del equipo
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg border-l-4 border-l-red-500">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Sin Vínculo Personal
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.profesionalesSinVinculo}
                    </dd>
                    <dd className="text-xs text-red-600">
                      Requieren vinculación
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Distribución por categorías */}
        {Object.keys(stats.categoriasDistribution).length > 0 && (
          <div className="mb-8">
            <Card className="p-6 border border-amber-default">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-amber-default" />
                <h3 className="text-lg font-semibold text-blue-default">
                  Distribución por Categorías
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(stats.categoriasDistribution)
                  .sort(([,a], [,b]) => b - a)
                  .map(([categoria, count]) => (
                    <div key={categoria} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-700">{categoria}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">{count}</span>
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-amber-default h-2 rounded-full" 
                            style={{ 
                              width: `${Math.max(10, (count / stats.totalProfesionales) * 100)}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </Card>
          </div>
        )}

        {/* Mensajes */}
        {message.text && (
          <div
            className={`mb-4 p-4 rounded-lg flex items-center gap-2 ${
              message.type === "success"
                ? "bg-green-50 border border-green-200 text-green-700"
                : "bg-red-50 border border-red-200 text-red-700"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle size={20} />
            ) : (
              <AlertTriangle size={20} />
            )}
            {message.text}
          </div>
        )}

        {/* Buscador y Filtros */}
        <UniversalSearchFilter
          title="Buscar y Filtrar Profesionales"
          searchPlaceholder="Buscar por nombre, especialidad o correo..."
          searchValue={searchValue}
          onSearchChange={handleSearchChange}
          filters={filters}
          filterValues={filterValues}
          onFilterChange={handleFilterChange}
          quickFilters={quickFilters}
          onQuickFilterApply={handleQuickFilterApply}
          onClearFilters={handleClearFilters}
          showSearchButton={false}
          showApplyButton={false}
          collapsible={true}
        />

        {/* Indicadores de filtros activos */}
        {(searchValue || Object.values(filterValues).some(value => value)) && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Filter className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Filtros activos:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {searchValue && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Búsqueda: "{searchValue}"
                  <button 
                    onClick={() => handleSearchChange("")}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              )}
              {Object.entries(filterValues).map(([key, value]) => 
                value && (
                  <span key={key} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {filters.find(f => f.key === key)?.label}: {value}
                    <button 
                      onClick={() => handleFilterChange(key, "")}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                )
              )}
              <button
                onClick={handleClearFilters}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 hover:bg-red-200"
              >
                Limpiar todos
              </button>
            </div>
          </div>
        )}

        {/* Estadísticas de resultados */}
        <Card className="flex justify-between items-center bg-white p-4 rounded-lg border border-amber-default my-6">
          <div className="flex items-center gap-4">
            <span className="text-sm text-neutral-text">
              Mostrando {paginatedData.paginatedProfesionales.length} de {filteredProfesionales.length} profesionales
              {paginatedData.startIndex > 0 && (
                <span className="text-xs text-gray-500">
                  {' '}(desde {paginatedData.startIndex + 1} hasta {Math.min(paginatedData.endIndex, filteredProfesionales.length)})
                </span>
              )}
            </span>
            {filteredProfesionales.length !== profesionales.length && (
              <span className="text-xs text-blue-default bg-blue-50 px-2 py-1 rounded">
                {profesionales.length - filteredProfesionales.length} filtrados de {profesionales.length} total
              </span>
            )}
            
            {filteredProfesionales.length !== profesionales.length && (
              <button
                onClick={handleClearFilters}
                className="text-xs bg-amber-default text-white px-3 py-1 rounded hover:bg-amber-600 transition-colors"
              >
                Mostrar todos ({profesionales.length})
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-neutral-text">Mostrar:</label>
            <select
              value={itemsPerPage}
              onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
              className="border border-amber-default rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-blue-default focus:border-transparent"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-sm text-neutral-text">por página</span>
          </div>
        </Card>

        {/* Lista de profesionales */}
        <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-amber-default">
          <div className="px-6 py-4 flex gap-2 items-center border-b border-amber-default">
            <Stethoscope className="h-5 w-5 text-amber-default" />
            <h2 className="text-lg font-semibold text-blue-default">
              Profesionales de Bienestar
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-default uppercase tracking-wider">
                    Profesional
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-default uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-default uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-default uppercase tracking-wider">
                    Niveles Atención
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-default uppercase tracking-wider">
                    Carga Casos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-default uppercase tracking-wider">
                    Disponibilidad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-default uppercase tracking-wider">
                    Personal Vinculado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-default uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedData.paginatedProfesionales.length > 0 ? (
                  paginatedData.paginatedProfesionales.map((profesional) => (
                    <tr
                      key={`prof-${profesional.id}`}
                      className={`hover:bg-blue-50 transition-colors ${
                        !profesional.activo ? 'bg-gray-50 opacity-75' : ''
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                              profesional.activo ? 'bg-blue-100' : 'bg-gray-100'
                            }`}>
                              <Stethoscope className={`h-5 w-5 ${
                                profesional.activo ? 'text-blue-default' : 'text-gray-400'
                              }`} />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-neutral-text">
                              {profesional.nombre}
                            </div>
                            <div className="text-sm text-gray-500">
                              {profesional.especialidad}
                            </div>
                            {profesional.correo && (
                              <div className="text-xs text-gray-400 flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {profesional.correo}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getEstadoBadge(profesional)}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                          <Badge className="h-3 w-3 mr-1" />
                          {profesional.categorias?.nombre || "Sin categoría"}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {profesional.grados_atencion?.map(nivel => {
                            const nivelInfo = nivelesAtencion.find(n => n.value === nivel);
                            return nivelInfo ? (
                              <span key={nivel} className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${nivelInfo.color}`}>
                                <GraduationCap className="h-3 w-3 mr-1" />
                                {nivelInfo.label}
                              </span>
                            ) : (
                              <span key={nivel} className="inline-flex px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
                                {nivel}
                              </span>
                            );
                          }) || (
                            <span className="text-sm text-gray-500 italic">
                              Sin niveles asignados
                            </span>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getCargaCasosBadge(
                          profesional.carga_casos_actual || 0,
                          profesional.carga_casos_maxima || 50
                        )}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getDisponibilidadBadge(profesional)}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getPersonalVinculado(profesional)}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleProfesionalStatus(profesional.id, profesional.activo)}
                            className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                              profesional.activo
                                ? 'text-red-600 hover:text-red-800 hover:bg-red-50'
                                : 'text-green-600 hover:text-green-800 hover:bg-green-50'
                            }`}
                            title={profesional.activo ? 'Desactivar profesional' : 'Activar profesional'}
                          >
                            {profesional.activo ? (
                              <PowerOff size={16} />
                            ) : (
                              <Power size={16} />
                            )}
                            {profesional.activo ? 'Desactivar' : 'Activar'}
                          </button>
                          
                          <span className="text-gray-300">|</span>
                          
                          <button
                            onClick={() => handleEditProfesional(profesional)}
                            className="flex items-center gap-1 text-blue-default hover:text-blue-hover transition-colors"
                            title="Editar profesional"
                          >
                            <Edit size={16} />
                            Editar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr key="no-profesionales">
                    <td
                      colSpan={8}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Stethoscope className="h-12 w-12 text-gray-300" />
                        <p>
                          No se encontraron profesionales con los filtros aplicados
                        </p>
                        <button
                          onClick={handleClearFilters}
                          className="text-blue-default hover:text-blue-hover text-sm"
                        >
                          Limpiar filtros
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {paginatedData.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-amber-default">
              <Pagination
                totalPages={paginatedData.totalPages}
                currentPage={currentPage}
                onPageChange={handlePageChange}
                className="justify-center"
              />
            </div>
          )}
        </div>

        {/* Modal de edición/creación */}
        {editingProfesional && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-amber-default">
              <div className="px-6 py-4 border-b border-amber-default">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-blue-default">
                      {creatingNew ? 'Crear Nuevo Profesional' : `Editar Profesional: ${editingProfesional.nombre}`}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {creatingNew 
                        ? 'Complete los datos del nuevo profesional de bienestar' 
                        : 'Modifique los datos, categoría y niveles de atención'
                      }
                    </p>
                  </div>
                  <button
                    onClick={handleCancelEdit}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              <div className="px-6 py-4 space-y-6">
                {/* Información básica */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-blue-default mb-2">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      value={editingProfesional.nombre}
                      onChange={(e) => handleInputChange('nombre', e.target.value)}
                      className="w-full border border-amber-default rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-default focus:border-transparent"
                      placeholder="Nombre completo del profesional"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-blue-default mb-2">
                      Especialidad *
                    </label>
                    <input
                      type="text"
                      value={editingProfesional.especialidad}
                      onChange={(e) => handleInputChange('especialidad', e.target.value)}
                      className="w-full border border-amber-default rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-default focus:border-transparent"
                      placeholder="Ej: Psicoorientadora, Fisioterapeuta, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-blue-default mb-2">
                      Correo Electrónico
                    </label>
                    <input
                      type="email"
                      value={editingProfesional.correo}
                      onChange={(e) => handleInputChange('correo', e.target.value)}
                      className="w-full border border-amber-default rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-default focus:border-transparent"
                      placeholder="correo@gimnasiomariecurie.edu.co"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-blue-default mb-2">
                      Categoría/Servicio
                    </label>
                    <select
                      value={editingProfesional.categoria_id}
                      onChange={(e) => handleInputChange('categoria_id', e.target.value)}
                      className="w-full border border-amber-default rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-default focus:border-transparent"
                    >
                      <option value="" key="empty-categoria">Seleccionar categoría</option>
                      {categorias
                        .filter(categoria => categoria && categoria.id && categoria.nombre) // Filtrar elementos válidos
                        .map((categoria) => (
                          <option key={`categoria-${categoria.id}`} value={categoria.id}>
                            {categoria.nombre}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                {/* Vínculo con Personal MC */}
                <div>
                  <label className="block text-sm font-medium text-blue-default mb-2">
                    Vincular con Personal MC
                  </label>
                  <select
                    value={editingProfesional.personal_mc_uuid}
                    onChange={(e) => handleInputChange('personal_mc_uuid', e.target.value)}
                    className="w-full border border-amber-default rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-default focus:border-transparent"
                  >
                    <option value="" key="empty-personal">Sin vincular</option>
                    {personalMC
                      .filter(personal => personal && personal.uuid && personal.primer_nombre && personal.primer_apellido) // Filtrar elementos válidos
                      .map((personal) => (
                        <option key={`personal-${personal.uuid}`} value={personal.uuid}>
                          {personal.primer_nombre} {personal.primer_apellido} - {personal.correo_institucional}
                        </option>
                      ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Vincule este profesional con un usuario del sistema para dar accesos
                  </p>
                </div>

                {/* Niveles de atención */}
                <div>
                  <label className="block text-sm font-medium text-blue-default mb-4">
                    Niveles de Atención
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {nivelesAtencion.map((nivel) => (
                      <div
                        key={nivel.value}
                        className="flex items-center justify-between p-3 border border-amber-default rounded-lg hover:bg-amber-50 transition-colors"
                      >
                        <div>
                          <div className="font-medium text-neutral-text">
                            {nivel.label}
                          </div>
                          <div className="text-sm text-gray-500">
                            {nivel.value === 'GENERAL' ? 'Puede atender todos los niveles' : 
                             nivel.value === 'INICIAL' ? 'Preescolar y jardín' :
                             nivel.value === 'PRIMARIA_ALTA' ? 'Grados 3° a 5°' :
                             'Grados 6° a 11°'}
                          </div>
                        </div>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={editingProfesional.grados_atencion?.includes(nivel.value) || false}
                            onChange={(e) => handleNivelesAtencionChange(nivel.value, e.target.checked)}
                            className="h-4 w-4 text-blue-default focus:ring-blue-default border-amber-default rounded"
                          />
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Configuración de carga y permisos */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-blue-default mb-2">
                      Carga Máxima de Casos
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={editingProfesional.carga_casos_maxima}
                      onChange={(e) => handleInputChange('carga_casos_maxima', parseInt(e.target.value) || 50)}
                      className="w-full border border-amber-default rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-default focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Número máximo de casos que puede manejar simultáneamente
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="disponible_asignacion"
                        checked={editingProfesional.disponible_asignacion}
                        onChange={(e) => handleInputChange('disponible_asignacion', e.target.checked)}
                        className="h-4 w-4 text-blue-default focus:ring-blue-default border-amber-default rounded"
                      />
                      <label htmlFor="disponible_asignacion" className="text-sm text-neutral-text">
                        Disponible para asignación automática de casos
                      </label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="activo"
                        checked={editingProfesional.activo}
                        onChange={(e) => handleInputChange('activo', e.target.checked)}
                        className="h-4 w-4 text-blue-default focus:ring-blue-default border-amber-default rounded"
                      />
                      <label htmlFor="activo" className="text-sm text-neutral-text">
                        Profesional activo
                      </label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="permiso_crear_casos"
                        checked={editingProfesional.permiso_crear_cualquier_caso}
                        onChange={(e) => handleInputChange('permiso_crear_cualquier_caso', e.target.checked)}
                        className="h-4 w-4 text-blue-default focus:ring-blue-default border-amber-default rounded"
                      />
                      <label htmlFor="permiso_crear_casos" className="text-sm text-neutral-text">
                        Puede crear casos de cualquier tipo
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="px-6 py-4 border-t border-amber-default bg-gray-50">
                <div className="flex justify-end gap-3">
                  <button
                    onClick={handleCancelEdit}
                    className="px-4 py-2 text-neutral-text bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={saveProfesional}
                    className="px-4 py-2 bg-blue-default text-white rounded-md hover:bg-blue-hover flex items-center gap-2 transition-colors"
                  >
                    <Save size={16} />
                    {creatingNew ? 'Crear Profesional' : 'Guardar Cambios'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfesionalesManagement;