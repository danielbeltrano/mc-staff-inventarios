import { forwardRef, useState } from "react";

export const InputText2 = forwardRef(({ label, error, className, ...props }, ref) => {
  return (
    <div className="flex flex-col space-y-1.5">
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-default ${className} ${
          error ? 'border-red-500' : 'border-amber-default'
        }`}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
});

const InputText = ({
  type = "text", // Tipo de input, por defecto es 'text'
  name = "", // Nombre del input
  onChange = "", // Función de cambio de valor
  placeholder = "", // Placeholder opcional
  className = "", // Clase CSS opcional
  ...props // Otras propiedades adicionales
}) => {
  const [fileName, setFileName] = useState(""); // Estado para almacenar el nombre del archivo

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileName(file.name); // Almacenar el nombre del archivo seleccionado
      if (onChange) onChange(e); // Llamar a la función onChange si existe
    }
  };

  return (
    <>
      {type === "file" ? (
        <div className="inline-block mt-4">
          <label className="cursor-pointer border border-amber-default py-2 px-4 rounded-md text-blue-default hover:bg-blue-default hover:text-blue-text">
            <input
              type="file"
              name={name}
              onChange={handleFileChange} // Usar la función local para capturar el nombre del archivo
              className="hidden" // Ocultar el input por defecto
              {...props}
            />
            Upload file / Subir archivo
          </label>
          {/* Mostrar el nombre del archivo seleccionado si existe */}
          {fileName && (
            <span className="ml-4 text-gray-600">
              {fileName}
            </span>
          )}
        </div>
      ) : (
        <input
          type={type}
          name={name}
          onChange={onChange}
          placeholder={placeholder}
          className={`px-4 py-2 w-full border border-amber-default focus:outline-blue-default rounded-md ${className}`}
          {...props}
        />
      )}
    </>
  );
};

export default InputText;
