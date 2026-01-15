import React from "react";
import { Alert, AlertTitle } from "../Alert";
import useScreenSize from "../../../hooks/useScreenSize";

// Campo de entrada de texto para react-hook-form
const InputContainer = ({ label, value, required, placeholder, type="text", setValue, error, setError, disabled, className}) => {
  const screenSize = useScreenSize();
  const isMobile = screenSize.width <= 768;
 
  return (
    <div className={`space-y-0.5 ${isMobile?"w-full":type==="email"?"w-[300px]":"w-full"} ${className}`}>
      {/* Título del campo */}
      <label className="block text-[13px] font-medium text-blue-default">
        {label}{required?"*":""}
      </label>
      <div className="relative">
        {/* Campo */}
        <div className="flex items-center space-x-1.5">
          <input
            type={type}
            placeholder={placeholder}
            value={value}
            readOnly={disabled}
            onChange={(e) => {
              setError(null);
							setValue(e.target.value);
            }}
            className={`pl-2 py-2.5 border border-amber-default w-full rounded-md focus:outline-none text-sm appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none text-black`}
          />
        </div>
        {/* Errores */}
        {error && (
          <Alert className="mt-1">
            <AlertTitle>{error}</AlertTitle>
          </Alert>
        )}
      </div>
    </div>
  );
};

export default InputContainer;