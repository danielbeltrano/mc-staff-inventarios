// src/components/Button.js
import React from "react";

const Button = ({
  type = "button",   // Tipo de botón (por defecto es 'button')
  onClick,           // Función a ejecutar al hacer clic
  children,          // Contenido del botón
  className = "",    // Clase CSS para estilos personalizados
  disabled = false,  // Deshabilitar el botón
  ...props           // Otras propiedades adicionales
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      className={` rounded-md ${className} ${
        disabled ? "bg-gray-400 cursor-not-allowed" : "p-2"
      }`} // Estilos por defecto y personalizados
      disabled={disabled}
      {...props} // Permite pasar cualquier otra propiedad adicional
    >
      {children}
    </button>
  );
};

export default Button;
