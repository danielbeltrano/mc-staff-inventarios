import React from "react";
import { Alert, AlertTitle } from "../Alert";
import useScreenSize from "../../../hooks/useScreenSize";

// Campo de entrada de texto para react-hook-form
const InputField = ({ label, name, placeholder, register, errors, type = "text", required, validate, state, porcentaje = false, className}) => {
  const screenSize = useScreenSize();
  const isMobile = screenSize.width <= 768;
 
  return (
    <div className={`space-y-1.5 ${isMobile?"w-full":type==="email"?"w-[300px]":"w-fit"} ${className}`}>
      {/* Título del campo */}
      <label className="block text-[13px] font-medium text-blue-default">
        {label}{required?"*":""}
      </label>
      <div className="relative">
        {/* Campo */}
        <div className="flex items-center space-x-1.5">
          <input
            readOnly={state!="pre_registro" || false}
            type={type}
            placeholder={state==="pre_registro"?placeholder:""}
            {...register(name, {
              required: {
                value: required,
                message: "Este campo es obligatorio",
              },
              validate: validate
            })}
            className={`pl-2 py-2.5 border border-amber-default rounded-md focus:outline-none text-sm appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${(state!="pre_registro")? "text-gray-400":"text-black"} ${porcentaje?"w-[70px]":"w-full"}`}
          />
          {porcentaje && <span className="font-bold"> % </span>}
        </div>
        {/* Errores */}
        {errors[name] && (
          <Alert className="mt-[7px]">
            <AlertTitle>{errors[name].message}</AlertTitle>
          </Alert>
        )}
      </div>
    </div>
  );
};

export default InputField;
