import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';

const SelectContext = createContext();

export const Select = ({ children, onValueChange, value, disabled = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedValue, setSelectedValue] = useState(value || '');
    const [selectedLabel, setSelectedLabel] = useState('');
    const selectRef = useRef(null);
  
    // Actualizar el estado interno cuando cambia el valor externamente
    useEffect(() => {
      setSelectedValue(value || '');
      // Si el valor es resetado a 'todos' o 'todas', limpiamos también la etiqueta
      if (value === 'todos' || value === 'todas') {
        setSelectedLabel('');
      }
    }, [value]);
  
    // Manejador de clics fuera del select
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (selectRef.current && !selectRef.current.contains(event.target)) {
          setIsOpen(false);
        }
      };
  
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, []);
  
    const handleSelect = (newValue, label) => {
      setSelectedValue(newValue);
      setSelectedLabel(label);
      onValueChange?.(newValue);
      setIsOpen(false);
    };
  
    return (
      <SelectContext.Provider 
        value={{ 
          isOpen, 
          setIsOpen, 
          selectedValue,
          selectedLabel, 
          handleSelect,
          disabled 
        }}
      >
        <div className="relative w-full" ref={selectRef}>
          {children}
        </div>
      </SelectContext.Provider>
    );
  };

export const SelectTrigger = ({ children, className = '', ...props }) => {
  const { isOpen, setIsOpen, disabled } = useContext(SelectContext);

  return (
    <button
      type="button"
      className={`
        flex items-center justify-between w-full 
        px-3 py-3 
        bg-white
        border-input rounded-input
        transition-all duration-200
        text-sm text-blue-text-op2
        ${isOpen 
          ? 'border-blue-default shadow-hover' 
          : 'border-neutral-300 hover:border-blue-default'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      onClick={() => !disabled && setIsOpen(!isOpen)}
      disabled={disabled}
      {...props}
    >
      {children}
      <ChevronDown 
        className={`
          h-4 w-4 
          text-blue-text-op2
          transition-transform duration-200
          ${isOpen ? 'transform rotate-180' : ''}
        `} 
      />
    </button>
  );
};

export const SelectValue = ({ placeholder = 'Seleccionar...' }) => {
    const { selectedLabel, selectedValue } = useContext(SelectContext);
  
    return (
      <span className={`
        block truncate
        text-blue-default
      `}>
        {selectedLabel || placeholder}
      </span>
    );
  };

export const SelectContent = ({ children, className = '', ...props }) => {
  const { isOpen } = useContext(SelectContext);

  if (!isOpen) return null;

  return (
    <div
      className={`
        absolute z-50 
        w-full mt-1
        bg-white
        border-input border-neutral-300
        rounded-input
        shadow-card
        overflow-hidden
        animate-slideIn
        ${className}
      `}
      {...props}
    >
      <div className="max-h-60 overflow-y-auto scrollbar-hide">
        {children}
      </div>
    </div>
  );
};

export const SelectItem = ({ children, value, className = '', ...props }) => {
    const { handleSelect, selectedValue } = useContext(SelectContext);
    const isSelected = selectedValue === value;
  
    return (
      <div
        className={`
          relative flex items-center
          w-full px-3 py-2
          text-sm
          cursor-pointer
          transition-colors duration-200
          ${isSelected 
            ? 'bg-blue-50 text-blue-default' 
            : 'text-blue-text-op2 hover:bg-blue-50 hover:text-blue-default'
          }
          ${className}
        `}
        onClick={() => handleSelect(value, children)}
        {...props}
      >
        <div className="flex items-center gap-2">
          <span className={`
            flex-shrink-0
            w-4 h-4
            flex items-center justify-center
            ${isSelected ? 'text-blue-default' : 'text-transparent'}
          `}>
            {isSelected && <Check className="h-4 w-4" />}
          </span>
          {children}
        </div>
      </div>
    );
  };

export default Select;