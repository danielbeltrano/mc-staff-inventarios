import React, { useState, useCallback, useMemo } from "react";
import { Search, X } from "lucide-react";
import PropTypes from "prop-types";

/**
 * Componente de búsqueda simple para filtrar listas en tiempo real
 * Perfecto para casos de uso donde necesitas filtrar por palabras clave
 */
const SimpleSearchInput = ({
  placeholder = "Buscar...",
  value = "",
  onChange,
  onClear,
  className = "",
  debounceMs = 300,
  showClearButton = true,
  disabled = false,
  autoFocus = false,
  size = "default", // "sm", "default", "lg"
}) => {
  const [internalValue, setInternalValue] = useState(value);

  // Debounce para optimizar la búsqueda
  const [debounceTimer, setDebounceTimer] = useState(null);

  // Manejar cambios en el input con debounce opcional
  const handleInputChange = useCallback(
    (event) => {
      const newValue = event.target.value;
      setInternalValue(newValue);

      // Limpiar timer anterior
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      // Si hay debounce, usar timer, sino llamar inmediatamente
      if (debounceMs > 0) {
        const timer = setTimeout(() => {
          onChange?.(newValue);
        }, debounceMs);
        setDebounceTimer(timer);
      } else {
        onChange?.(newValue);
      }
    },
    [onChange, debounceMs, debounceTimer]
  );

  // Manejar limpiar búsqueda
  const handleClear = useCallback(() => {
    setInternalValue("");
    onChange?.("");
    onClear?.();
    
    // Limpiar timer si existe
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      setDebounceTimer(null);
    }
  }, [onChange, onClear, debounceTimer]);

  // Manejar tecla Enter y Escape
  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === "Escape") {
        handleClear();
      }
      // Enter no hace nada especial, pero se puede extender
    },
    [handleClear]
  );

  // Clases de tamaño
  const sizeClasses = useMemo(() => {
    switch (size) {
      case "sm":
        return "py-1.5 px-3 pl-8 text-sm";
      case "lg":
        return "py-3 px-4 pl-12 text-lg";
      default:
        return "py-2 px-3 pl-10";
    }
  }, [size]);

  // Clases de iconos según el tamaño
  const iconSizeClasses = useMemo(() => {
    switch (size) {
      case "sm":
        return "h-3.5 w-3.5 left-2.5";
      case "lg":
        return "h-5 w-5 left-4";
      default:
        return "h-4 w-4 left-3";
    }
  }, [size]);

  return (
    <div className={`relative ${className}`}>
      {/* Icono de búsqueda */}
      <Search 
        className={`absolute top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none ${iconSizeClasses}`}
      />
      
      {/* Input de búsqueda */}
      <input
        type="text"
        value={internalValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        className={`
          w-full border border-amber-default rounded-md 
          focus:ring-2 focus:ring-blue-default focus:border-transparent
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all duration-200
          ${sizeClasses}
          ${internalValue ? 'pr-10' : ''}
        `}
      />
      
      {/* Botón para limpiar */}
      {showClearButton && internalValue && (
        <button
          onClick={handleClear}
          disabled={disabled}
          className={`
            absolute top-1/2 right-3 transform -translate-y-1/2
            text-gray-400 hover:text-gray-600 transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed
            ${size === 'sm' ? 'right-2' : size === 'lg' ? 'right-4' : 'right-3'}
          `}
          aria-label="Limpiar búsqueda"
        >
          <X className={size === 'sm' ? 'h-3.5 w-3.5' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} />
        </button>
      )}
    </div>
  );
};

/**
 * Hook personalizado para filtrar listas basado en términos de búsqueda
 * Útil para usar junto con SimpleSearchInput
 */
export const useSimpleSearch = (items, searchTerm, searchFields) => {
  return useMemo(() => {
    if (!searchTerm || !searchTerm.trim()) {
      return items;
    }

    const normalizedSearchTerm = searchTerm.toLowerCase().trim();
    
    return items.filter((item) => {
      // Si se especifican campos específicos, buscar solo en esos
      if (searchFields && Array.isArray(searchFields)) {
        return searchFields.some(field => {
          const fieldValue = getNestedValue(item, field);
          return fieldValue && 
                 fieldValue.toString().toLowerCase().includes(normalizedSearchTerm);
        });
      }
      
      // Si no se especifican campos, buscar en todos los valores string del objeto
      return Object.values(item).some(value => {
        if (typeof value === 'string') {
          return value.toLowerCase().includes(normalizedSearchTerm);
        }
        if (typeof value === 'number') {
          return value.toString().includes(normalizedSearchTerm);
        }
        return false;
      });
    });
  }, [items, searchTerm, searchFields]);
};

/**
 * Función auxiliar para obtener valores anidados de un objeto
 * Ejemplo: getNestedValue(obj, "estudiante.nombre") 
 */
const getNestedValue = (obj, path) => {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : null;
  }, obj);
};

// PropTypes
SimpleSearchInput.propTypes = {
  placeholder: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func,
  onClear: PropTypes.func,
  className: PropTypes.string,
  debounceMs: PropTypes.number,
  showClearButton: PropTypes.bool,
  disabled: PropTypes.bool,
  autoFocus: PropTypes.bool,
  size: PropTypes.oneOf(["sm", "default", "lg"]),
};

export default SimpleSearchInput;