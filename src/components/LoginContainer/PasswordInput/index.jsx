import { Eye, EyeOff } from "lucide-react";
import {Button} from "../../Button";
import { useState } from "react";

// Componente reutilizable para campos de contraseña
// Maneja la visibilidad de la contraseña de manera interna
const PasswordField = ({ placeholder, value, onChange }) => {
  // Definimos los tipos de entrada para los campos de contraseña
  const inputPassType = "password";
  const inputTextType = "text";

  // Estado para manejar la visibilidad de la contraseña
  const [isVisible, setIsVisible] = useState(false);

  // Función para alternar la visibilidad de la contraseña
  const toggleVisibility = (e) => {
    e.preventDefault();
    setIsVisible((prev) => !prev);
  };

  return (
    <div className="w-3/4 flex items-center border-b border-amber-300">
      {/* Campo de entrada para la contraseña */}
      <input
        type={isVisible ? inputTextType : inputPassType}
        className="w-full py-2 px-4 focus:outline-none"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
      {/* Botón para alternar entre mostrar/ocultar la contraseña */}
      <Button variant="clean" onClick={toggleVisibility}>
        {isVisible ? <Eye size={20} strokeWidth={1} className="m-2" /> : <EyeOff size={20} strokeWidth={1} className="m-2" />}
      </Button>
    </div>
  );
};

export default PasswordField;
