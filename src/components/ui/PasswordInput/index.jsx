import { Eye, EyeOff } from "lucide-react";
import { Button } from "../Button";
import { useState } from "react";

// Componente reutilizable para campos de contraseña
// Maneja la visibilidad de la contraseña de manera interna
const PasswordInput = ({ placeholder, value, onChange }) => {
  // Definimos los tipos de entrada para los campos de contraseña
  const inputPassType = "password";
  const inputTextType = "text";

  // Estado para manejar la visibilidad de la contraseña
  const [isVisible, setIsVisible] = useState(false);

  // Función para alternar la visibilidad de la contraseña
  const toggleVisibility = (e) => {
    e.preventDefault(); // Prevenir cualquier comportamiento predeterminado del formulario
    setIsVisible((prev) => !prev);
  };

  return (
    <div className="w-full flex items-center border border-amber-300 rounded-md">
      {/* Campo de entrada para la contraseña */}
      <input
        type={isVisible ? inputTextType : inputPassType}
        className="w-full pl-12 py-4 px-4 focus:outline-none"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault(); // Evitar que Enter dispare el evento submit
          }
        }}
      />
      {/* Botón para alternar entre mostrar/ocultar la contraseña */}
      <Button type="button" variant="clean" onClick={toggleVisibility}>
        {isVisible ? (
          <Eye size={20} strokeWidth={1} className="m-2 text-blue-default" />
        ) : (
          <EyeOff size={20} strokeWidth={1} className="m-2 text-blue-default" />
        )}
      </Button>
    </div>
  );
};

export default PasswordInput;
