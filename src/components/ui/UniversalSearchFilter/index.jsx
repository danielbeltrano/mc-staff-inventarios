import React, { useState, useCallback, useMemo } from "react";
import {
  Search,
  X,
  Filter,
  RotateCcw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Card } from "../Cards";
import { Button } from "../Button";

// Componente principal del buscador universal
const UniversalSearchFilter = ({
  // Configuración básica
  title = "Búsqueda y Filtros",
  searchPlaceholder = "Buscar...",
  searchValue = "",
  onSearchChange,
  onSearch,

  // Configuración de filtros
  filters = [],
  filterValues = {},
  onFilterChange,

  // Filtros rápidos
  quickFilters = [],
  onQuickFilterApply,

  // Botones de acción
  onApplyFilters,
  onClearFilters,

  // Estados
  isSearching = false,
  isCollapsed = true,

  // Personalización
  className = "",
  searchButtonText = "Buscar",
  applyButtonText = "Aplicar Filtros",
  clearButtonText = "Limpiar",

  // Funcionalidades opcionales
  showSearchButton = true,
  showApplyButton = true,
  showClearButton = true,
  showActiveFilters = true,
  showQuickFilters = true,
  collapsible = false,

  // Validaciones
  searchValidation,
  filterValidation,
}) => {
  const [collapsed, setCollapsed] = useState(isCollapsed);

  // Manejar la búsqueda
  const handleSearch = useCallback(() => {
    if (searchValidation && !searchValidation(searchValue)) {
      return;
    }
    onSearch?.(searchValue);
  }, [searchValue, onSearch, searchValidation]);

  // Manejar aplicación de filtros
  const handleApplyFilters = useCallback(() => {
    if (filterValidation && !filterValidation(filterValues)) {
      return;
    }
    onApplyFilters?.(filterValues);
  }, [filterValues, onApplyFilters, filterValidation]);

  // Manejar limpiar filtros
  const handleClearFilters = useCallback(() => {
    onClearFilters?.();
  }, [onClearFilters]);

  // Manejar cambio de filtros individuales
  const handleFilterChange = useCallback(
    (filterKey, value) => {
      onFilterChange?.(filterKey, value);
    },
    [onFilterChange]
  );

  // Manejar aplicación de filtros rápidos
  const handleQuickFilterApply = useCallback(
    (quickFilterData) => {
      onQuickFilterApply?.(quickFilterData);
    },
    [onQuickFilterApply]
  );

  // Calcular filtros activos
  const activeFilters = useMemo(() => {
    return Object.entries(filterValues)
      .filter(
        ([_, value]) => value !== "" && value !== null && value !== undefined
      )
      .map(([key, value]) => {
        const filter = filters.find((f) => f.key === key);
        return {
          key,
          value,
          label: filter?.label || key,
          displayValue: filter?.getDisplayValue?.(value) || value,
        };
      });
  }, [filterValues, filters]);

  // Renderizar campo de filtro individual
  const renderFilterField = (filter) => {
    const {
      key,
      type,
      label,
      options,
      placeholder,
      validation,
      getDisplayValue,
      ...domProps
    } = filter;
    const value = filterValues[key] || "";

    switch (type) {
      case "select":
        return (
          <select
            value={value}
            onChange={(e) => handleFilterChange(key, e.target.value)}
            className="w-full border border-amber-default rounded-md py-2 px-3 focus:ring-2 focus:ring-blue-default focus:border-transparent"
            {...domProps}
          >
            <option value="">
              {placeholder || `Seleccione ${label.toLowerCase()}`}
            </option>
            {options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case "text":
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleFilterChange(key, e.target.value)}
            placeholder={placeholder || `Ingrese ${label.toLowerCase()}`}
            className="w-full border border-amber-default rounded-md py-2 px-3 focus:ring-2 focus:ring-blue-default focus:border-transparent"
            {...domProps}
          />
        );

      case "number":
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleFilterChange(key, e.target.value)}
            placeholder={placeholder || `Ingrese ${label.toLowerCase()}`}
            className="w-full border border-amber-default rounded-md py-2 px-3 focus:ring-2 focus:ring-blue-default focus:border-transparent"
            {...domProps}
          />
        );

      case "date":
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleFilterChange(key, e.target.value)}
            className="w-full border border-amber-default rounded-md py-2 px-3 focus:ring-2 focus:ring-blue-default focus:border-transparent"
            {...domProps}
          />
        );

      case "checkbox":
        return (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={value}
              onChange={(e) => handleFilterChange(key, e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              {...domProps}
            />
            <label className="text-sm text-gray-700">{label}</label>
          </div>
        );

      case "multiselect":
        return (
          <select
            multiple
            value={Array.isArray(value) ? value : []}
            onChange={(e) => {
              const selectedValues = Array.from(
                e.target.selectedOptions,
                (option) => option.value
              );
              handleFilterChange(key, selectedValues);
            }}
            className="w-full border border-amber-default rounded-md py-2 px-3 focus:ring-2 focus:ring-blue-default focus:border-transparent"
            {...domProps}
          >
            {options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      default:
        return null;
    }
  };

  // Toggle del collapsed
  const toggleCollapsed = () => {
    if (collapsible) {
      setCollapsed(!collapsed);
    }
  };

  return (
    <Card className={`bg-white rounded-md ${className}`}>
      {/* Header - AHORA COMPLETAMENTE CLICKEABLE */}
      <div
        className={`p-6 ${!collapsed ? "border-b" : ""} border-amber-default ${
          collapsible ? "cursor-pointer hover:bg-gray-50 transition-colors" : ""
        }`}
        onClick={toggleCollapsed}
      >
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-blue-default flex items-center gap-2">
            <Filter className="h-5 w-5 text-amber-default" />
            {title}
          </h2>
          {collapsible && (
            <div className="text-blue-default transition-transform">
              {collapsed ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronUp className="h-5 w-5" />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div
        className={`transition-all duration-300 ${collapsed ? "hidden" : "block"}`}
      >
        <div className="p-6 space-y-6">
          {/* Barra de búsqueda */}
          {onSearchChange && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-blue-default">
                Búsqueda
              </label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchValue}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder={searchPlaceholder}
                    className="w-full pl-10 pr-4 py-2 border border-amber-default rounded-md focus:ring-2 focus:ring-blue-default focus:border-transparent"
                    onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  />
                </div>
                {showSearchButton && (
                  <button
                    onClick={handleSearch}
                    disabled={isSearching}
                    className="px-4 py-2 bg-blue-default hover:bg-blue-hover text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSearching ? "..." : searchButtonText}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Filtros */}
          {filters.length > 0 && (
            <div className="space-y-4">
              <label className="text-sm font-medium text-blue-default">
                Filtros
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filters.map((filter) => (
                  <div key={filter.key} className="space-y-1">
                    <label className="text-xs font-medium text-gray-500">
                      {filter.label}
                      {filter.required && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </label>
                    {renderFilterField(filter)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filtros rápidos */}
          {showQuickFilters && quickFilters.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-blue-default">
                Filtros Rápidos
              </label>
              <div className="flex flex-wrap gap-2">
                {quickFilters.map((quickFilter) => (
                  <Button
                    key={quickFilter.label}
                    onClick={() => handleQuickFilterApply(quickFilter.filters)}
                    className="px-3 py-1 text-sm rounded-full bg-gray-100 hover:bg-amber-50 hover:border-amber-default transition-colors duration-200 border border-gray-300"
                  >
                    {quickFilter.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex flex-wrap gap-2 justify-end pt-4 border-t border-gray-200">
            {showClearButton && (
              <Button
                variant="amber"
                onClick={handleClearFilters}
                className="px-4 py-2 bg-transparent rounded-md transition-colors flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                {clearButtonText}
              </Button>
            )}
            {showApplyButton && (
              <Button
                onClick={handleApplyFilters}
                disabled={isSearching}
                className="px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSearching ? "..." : applyButtonText}
              </Button>
            )}
          </div>
        </div>

        {/* Filtros activos */}
        {showActiveFilters && activeFilters.length > 0 && (
          <div className="px-6 pb-4 border-t border-amber-default pt-4">
            <div className="flex flex-wrap gap-2">
              {activeFilters.map((filter) => (
                <span
                  key={filter.key}
                  className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm border border-blue-200"
                >
                  {filter.label}: {filter.displayValue}
                  <Button
                    onClick={() => handleFilterChange(filter.key, "")}
                    className="ml-2 hover:text-red-500 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default UniversalSearchFilter;