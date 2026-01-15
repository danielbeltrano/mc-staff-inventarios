import React from "react";
import { Alert, AlertTitle } from "../Alert";

// Campo de entrada de texto para react-hook-form
const InputRubricas = ({
  label,
  name,
  placeholder,
  register,
  errors,
  size,
  type,
}) => {
  return (
    <div className="space-y-1.5 w-full">
      {/* Nombre del campo */}
      <label className="flex text-sm font-medium text-blue-default">
        {label}
      </label>

      {/* Ingresar Texto del campo */}
      <div className={`relative`}>
        {type === "textarea" ? (
          <textarea
            placeholder={placeholder}
            {...register(name)}
            style={{ height: size }}
            className={`pl-2 text-sm w-full h-full py-1 border border-amber-default rounded-md focus:outline-none text-gray-700 resize-none`}
          ></textarea>
        ) : (
          <input
            type="text"
            placeholder={placeholder}
            {...register(name)}
            className={`px-4 py-2 text-sm w-full h-full border border-amber-default rounded-md focus:outline-none text-gray-700 resize-none`}
          />
        )}

        {/* Alerta de campo requerido */}
        {errors[name] && (
          <Alert className="mt-[7px]">
            <AlertTitle>{errors[name].message}</AlertTitle>
          </Alert>
        )}
      </div>
    </div>
  );
};

export default InputRubricas;
