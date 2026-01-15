// components/ui/Checkbox.jsx
import React, { forwardRef } from "react";

/**
 * Componente Checkbox personalizado
 * @param {Object} props - Propiedades del componente
 * @param {string} [props.className] - Clases CSS adicionales
 * @param {boolean} props.checked - Estado del checkbox (marcado o no)
 * @param {Function} props.onCheckedChange - Función que maneja el cambio de estado
 * @param {string} props.id - ID único para el checkbox
 * @param {boolean} [props.disabled] - Indica si el checkbox está deshabilitado
 * @param {React.Ref} ref - Referencia de React
 * @returns {JSX.Element} Componente Checkbox
 */
const Checkbox = forwardRef(
  ({ className = "", checked, onCheckedChange, id, disabled = false, ...props }, ref) => {
    // Combinación de clases base y adicionales
    const baseClasses = `h-4 w-4 rounded border ${checked ? 'bg-blue-default border-blue-default' : 'border-neutral-300'} 
      focus:outline-none focus:ring-2 focus:ring-blue-default focus:ring-offset-1 
      disabled:cursor-not-allowed disabled:opacity-50
      transition-colors duration-200 ease-in-out cursor-pointer`;
    
    const allClasses = [baseClasses, className].filter(Boolean).join(" ");

    // Manejador de eventos para el cambio de estado
    const handleChange = (e) => {
      if (onCheckedChange) {
        onCheckedChange(e.target.checked);
      }
    };

    return (
      <div className="relative inline-flex items-center justify-center">
        <input
          type="checkbox"
          ref={ref}
          id={id}
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
          className={allClasses}
          {...props}
        />
        {checked && (
          <svg
            className="absolute pointer-events-none h-3 w-3 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}
      </div>
    );
  }
);

// Nombre para mostrar en DevTools
Checkbox.displayName = "Checkbox";

export { Checkbox };