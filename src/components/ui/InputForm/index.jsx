const InputForm = ({
  label, // Etiqueta opcional para el input
  type, // Tipo de input (text, email, password, etc.)
  value, // Valor del input
  onChange, // Función para manejar cambios en el input
  placeholder = "", // Placeholder opcional
  required = false, // Indica si el campo es obligatorio
  className = "", // Clases CSS opcionales
  icon, // Ícono opcional para mostrar dentro del input
}) => {
  return (
    <div className={` p-0 m-0 flex flex-col gap-2 ${className}`}>
      {label && <label className=" p-0 m-0 text-sm font-medium">{label}</label>}
      <div className="p-0 m-0 flex items-center">
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={"w-full py-2 pr-4 pl-2 focus:outline-none"}
        />
        {icon && <span className="">{icon}</span>}
      </div>
    </div>
  );
};

export default InputForm;
