import React, { useRef, useEffect, useState, useMemo } from "react";
import PropTypes from "prop-types";
import {
  Search,
  X,
  Lock,
  Tag,
  Info,
} from "lucide-react";
import { useSimpleSearch } from "../SimpleSearchInput";

/**
 * Componente simple de búsqueda y selección
 * Al hacer clic muestra todas las opciones, permite filtrar escribiendo
 * 
 * @component
 * @example
 * // Uso básico
 * <HybridSelector
 *   items={tipologias}
 *   selectedValue={selectedTipologia}
 *   onSelectionChange={setSelectedTipologia}
 *   displayField="title"
 *   valueField="id"
 *   placeholder="Buscar tipología..."
 * />
 */
const HybridSelector = ({
  // Datos
  items = [],
  selectedValue = "",
  onSelectionChange,
  
  // Configuración de campos
  displayField = "name",
  valueField = "id", 
  searchFields = null, // Si es null, usará [displayField]
  categoryField = null, // Campo para mostrar categoría
  descriptionField = null, // Campo de descripción
  
  // Configuración de UI
  label = "",
  placeholder = "Buscar o seleccionar...",
  required = false,
  disabled = false,
  size = "default", // "sm", "default", "lg"
  
  // Comportamiento
  clearable = true,
  autoFocus = false,
  showAllOnFocus = true, // Mostrar todas las opciones al hacer focus
  
  // Personalización visual
  showCategoryInList = true,
  showDescriptionInList = true,
  showDetailsCard = true,
  className = "",
  
  // Configuración avanzada
  emptyMessage = "No se encontraron resultados",
  maxHeight = "16rem", // max-h-64 equivale a 16rem
  
  // Funciones personalizadas
  customRenderer = null, // Función para renderizar items personalizados
  customDetailsRenderer = null, // Función para renderizar detalles personalizados
  
  // Callbacks adicionales
  onOpen = null,
  onClose = null,
  onSearchChange = null,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItemData, setSelectedItemData] = useState(null);
  const searchRef = useRef(null);
  const inputRef = useRef(null);

  // Configurar campos de búsqueda automáticamente
  const effectiveSearchFields = useMemo(() => {
    if (searchFields) return searchFields;
    
    const fields = [displayField];
    if (descriptionField) fields.push(descriptionField);
    if (categoryField) fields.push(categoryField);
    
    return fields;
  }, [searchFields, displayField, descriptionField, categoryField]);

  // Filtrar items basado en el término de búsqueda
  const filteredItems = useSimpleSearch(items, searchTerm, effectiveSearchFields);

  // Organizar items por categorías si hay categoryField
  const organizedItems = useMemo(() => {
    const itemsToShow = searchTerm.trim() ? filteredItems : items;
    
    if (!categoryField) {
      return { uncategorized: itemsToShow };
    }
    
    const grouped = itemsToShow.reduce((acc, item) => {
      const category = getNestedValue(item, categoryField) || 'Sin categoría';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {});

    // Si solo hay una categoría, usar lista simple
    const categories = Object.keys(grouped);
    if (categories.length === 1 && categories[0] === 'Sin categoría') {
      return { uncategorized: itemsToShow };
    }

    return grouped;
  }, [items, filteredItems, searchTerm, categoryField]);

  // Encontrar el item seleccionado actual
  useEffect(() => {
    if (selectedValue && items.length > 0) {
      const item = items.find(item => 
        getNestedValue(item, valueField)?.toString() === selectedValue.toString()
      );
      setSelectedItemData(item);
      
      // Solo establecer el texto si no está enfocado el input
      if (item && !isOpen) {
        setSearchTerm(getNestedValue(item, displayField) || "");
      }
    } else {
      setSelectedItemData(null);
      if (!isOpen) {
        setSearchTerm("");
      }
    }
  }, [selectedValue, items, valueField, displayField, isOpen]);

  // Manejar clics fuera del componente
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        handleClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [selectedItemData]);

  // Manejar apertura
  const handleOpen = () => {
    if (disabled) return;
    setIsOpen(true);
    onOpen?.();
  };

  // Manejar cierre
  const handleClose = () => {
    setIsOpen(false);
    onClose?.();
    
    // Restaurar el texto de la selección actual
    if (selectedItemData) {
      setSearchTerm(getNestedValue(selectedItemData, displayField) || "");
    } else {
      setSearchTerm("");
    }
  };

  // Manejar cambios en la búsqueda
  const handleSearchChange = (value) => {
    setSearchTerm(value);
    onSearchChange?.(value);
    
    // Abrir si no está abierto
    if (!isOpen) {
      handleOpen();
    }
    
    // Si se limpia completamente el texto, limpiar la selección
    if (!value.trim()) {
      setSelectedItemData(null);
      onSelectionChange?.("", null);
    }
  };

  // Manejar selección de item
  const handleSelection = (item) => {
    if (item) {
      setSelectedItemData(item);
      setSearchTerm(getNestedValue(item, displayField) || "");
      
      const value = getNestedValue(item, valueField);
      onSelectionChange?.(value, item);
    } else {
      // Limpiar selección completamente
      setSelectedItemData(null);
      setSearchTerm("");
      onSelectionChange?.("", null);
    }
    
    handleClose();
  };

  // Manejar limpiar selección
  const handleClear = (e) => {
    e?.stopPropagation();
    e?.preventDefault();
    
    // Limpiar completamente la selección
    setSelectedItemData(null);
    setSearchTerm("");
    onSelectionChange?.("", null);
    
    // Enfocar el input y abrir el dropdown para nueva selección
    setTimeout(() => {
      inputRef.current?.focus();
      handleOpen();
    }, 50);
  };

  // Manejar focus en el input
  const handleFocus = () => {
    if (showAllOnFocus) {
      handleOpen();
    }
    
    // Si hay una selección, mostrar el texto para editar
    if (selectedItemData && !searchTerm) {
      setSearchTerm(getNestedValue(selectedItemData, displayField) || "");
    }
  };

  // Manejar click en el input
  const handleInputClick = () => {
    handleOpen();
  };

  // Obtener clases de tamaño
  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return {
          input: "py-1.5 px-3 pl-8 text-sm",
          icon: "h-3.5 w-3.5 left-2.5",
          dropdown: "text-sm"
        };
      case "lg":
        return {
          input: "py-3 px-4 pl-12 text-lg",
          icon: "h-5 w-5 left-4",
          dropdown: "text-base"
        };
      default:
        return {
          input: "py-2.5 px-3 pl-10",
          icon: "h-4 w-4 left-3",
          dropdown: "text-sm"
        };
    }
  };

  const sizeClasses = getSizeClasses();

  // Renderizar item individual
  const renderItem = (item, isSelected = false) => {
    if (customRenderer) {
      return customRenderer(item, isSelected, handleSelection);
    }

    const displayValue = getNestedValue(item, displayField);
    const description = descriptionField ? getNestedValue(item, descriptionField) : null;
    const category = categoryField ? getNestedValue(item, categoryField) : null;

    return (
      <div
        key={getNestedValue(item, valueField)}
        className={`
          p-3 cursor-pointer hover:bg-blue-50 transition-colors border-b border-neutral-200 last:border-0
          ${isSelected ? 'bg-blue-100' : ''}
        `}
        onClick={() => handleSelection(item)}
      >
        <div className="font-medium text-blue-default">
          {displayValue}
        </div>
        {showDescriptionInList && description && (
          <div className="text-sm text-blue-text-op2 mt-1 line-clamp-2">
            {description}
          </div>
        )}
        {showCategoryInList && category && (
          <div className="text-xs text-amber-hover mt-1 font-medium flex items-center gap-1">
            <Tag className="h-3 w-3" />
            {category}
          </div>
        )}
      </div>
    );
  };

  // Renderizar lista de resultados
  const renderResults = () => {
    const categories = Object.keys(organizedItems);
    const hasCategories = categories.length > 1 || categories[0] !== 'uncategorized';
    
    if (!hasCategories) {
      // Lista simple sin categorías
      const items = organizedItems.uncategorized || [];
      
      if (items.length === 0) {
        return (
          <div className="p-3 text-gray-500 text-center">
            {searchTerm ? emptyMessage : "No hay opciones disponibles"}
          </div>
        );
      }
      
      return items.map((item) =>
        renderItem(item, selectedItemData && 
          getNestedValue(selectedItemData, valueField) === getNestedValue(item, valueField))
      );
    }

    // Lista con categorías
    return categories.map((category) => (
      <div key={category}>
        <div className="px-3 py-2 bg-gray-50 border-b border-neutral-200 text-sm font-semibold text-gray-700 sticky top-0">
          {category}
        </div>
        {organizedItems[category].map((item) =>
          renderItem(item, selectedItemData && 
            getNestedValue(selectedItemData, valueField) === getNestedValue(item, valueField))
        )}
      </div>
    ));
  };

  return (
    <div className={`space-y-2 relative ${className}`} ref={searchRef}>
      {/* Label */}
      {label && (
        <label className="text-sm font-medium text-blue-default mb-2 flex items-center">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
          {disabled && <Lock className="ml-2 h-3.5 w-3.5 text-amber-hover" />}
        </label>
      )}
      
      <div className="relative">
        <Search className={`absolute top-1/2 transform -translate-y-1/2 text-amber-default z-10 ${sizeClasses.icon}`} />
        <input
          ref={inputRef}
          type="text"
          className={`
            w-full border-2 border-neutral-300 rounded-input 
            focus:border-blue-default focus:ring-1 focus:ring-blue-default transition-colors
            placeholder:text-blue-text-op2
            ${disabled ? "bg-gray-100 cursor-not-allowed" : "cursor-text"}
            ${selectedItemData && clearable ? "pr-10" : ""}
            ${sizeClasses.input}
          `}
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          onFocus={handleFocus}
          onClick={handleInputClick}
          disabled={disabled}
          autoFocus={autoFocus}
        />
        
        {/* Botón para limpiar */}
        {selectedItemData && clearable && !disabled && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors z-10 hover:bg-red-50 rounded-full p-1"
            aria-label="Limpiar selección"
            title="Limpiar selección"
          >
            <X className={sizeClasses.icon.replace('left-', '').replace('absolute', '')} />
          </button>
        )}
      </div>

      {/* Lista desplegable */}
      {isOpen && !disabled && (
        <div 
          className="absolute z-50 w-full mt-1 bg-white border border-neutral-300 rounded-input shadow-lg overflow-y-auto animate-slideIn"
          style={{ maxHeight: maxHeight }}
        >
          {renderResults()}
        </div>
      )}

      {/* Card de detalles */}
      {showDetailsCard && selectedItemData && (
        <div className="text-xs text-blue-text-op2 bg-blue-50 p-3 rounded border border-blue-200">
          {customDetailsRenderer ? (
            customDetailsRenderer(selectedItemData)
          ) : (
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {descriptionField && getNestedValue(selectedItemData, descriptionField) && (
                  <>
                    <div className="flex items-center gap-1 text-blue-default font-medium mb-1">
                      <Info className="h-3 w-3" />
                      Descripción:
                    </div>
                    <p className="mb-2">{getNestedValue(selectedItemData, descriptionField)}</p>
                  </>
                )}
                {categoryField && getNestedValue(selectedItemData, categoryField) && (
                  <div className="flex items-center gap-1 text-amber-hover font-medium">
                    <Tag className="h-3 w-3" />
                    Categoría: {getNestedValue(selectedItemData, categoryField)}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Indicador de resultados */}
      {isOpen && searchTerm && (
        <div className="text-xs text-gray-500 text-right">
          {filteredItems.length} de {items.length} resultados
        </div>
      )}
    </div>
  );
};

/**
 * Función auxiliar para obtener valores anidados de un objeto
 */
const getNestedValue = (obj, path) => {
  if (!obj || !path) return null;
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : null;
  }, obj);
};

// PropTypes
HybridSelector.propTypes = {
  // Datos
  items: PropTypes.array.isRequired,
  selectedValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onSelectionChange: PropTypes.func.isRequired,
  
  // Configuración de campos
  displayField: PropTypes.string,
  valueField: PropTypes.string,
  searchFields: PropTypes.arrayOf(PropTypes.string),
  categoryField: PropTypes.string,
  descriptionField: PropTypes.string,
  
  // Configuración de UI
  label: PropTypes.string,
  placeholder: PropTypes.string,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  size: PropTypes.oneOf(["sm", "default", "lg"]),
  
  // Comportamiento
  clearable: PropTypes.bool,
  autoFocus: PropTypes.bool,
  showAllOnFocus: PropTypes.bool,
  
  // Personalización visual
  showCategoryInList: PropTypes.bool,
  showDescriptionInList: PropTypes.bool,
  showDetailsCard: PropTypes.bool,
  className: PropTypes.string,
  
  // Configuración avanzada
  emptyMessage: PropTypes.string,
  maxHeight: PropTypes.string,
  
  // Funciones personalizadas
  customRenderer: PropTypes.func,
  customDetailsRenderer: PropTypes.func,
  
  // Callbacks adicionales
  onOpen: PropTypes.func,
  onClose: PropTypes.func,
  onSearchChange: PropTypes.func,
};

export default HybridSelector;