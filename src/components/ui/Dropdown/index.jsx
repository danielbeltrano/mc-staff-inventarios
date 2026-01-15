const Dropdown = ({
  name,
  options = [],        // Lista de opciones
  value,                // Valor seleccionado
  onChange,             // Función de cambio de valor
  className = "",       // Clase CSS opcional
  disabled = false,     // Deshabilitar el dropdown
  placeholder = "Selecciona una opción...", // Placeholder opcional
  ...props              // Otras propiedades adicionales
}) => {
  return (
    <select
      name={name}
      value={value}
      onChange={onChange}
      className={`px-4 py-2 border border-amber-default rounded-md ${className}`} // Estilos por defecto y personalizados
      disabled={disabled}
      {...props} // Permite pasar cualquier otra propiedad adicional
    >
      <option value="" disabled>
        {placeholder}
      </option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

export default Dropdown;
