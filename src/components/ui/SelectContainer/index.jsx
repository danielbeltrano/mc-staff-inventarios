import React, { forwardRef } from "react";
import { Alert, AlertTitle } from "../Alert";

// Campo Select para react-hook-form
const SelectContainer =({ label, value, options, required, placeholder, setValue, error, setError, className }) => {

  return (
    <div className="space-y-0.5 w-full">
      {/* Título del campo */}
      <div className="flex items-start space-x-1">
        <label className="block text-[13px] font-medium text-blue-default">
          {label} {required ? "*" : ""}
        </label>
      </div>
      <select
				value={value}
				onChange={e => {
          setError(null);
          setValue(e.target.value);
        }}
        className={`block p-[8px] border border-amber-default rounded-md text-sm w-full h-[42px] ${className} ${value===""?"text-gray-400":""} text-black`}
        size="1"
      >
        {/* Opciones */}
        <option value="" hidden className="text-gray-400">
          {placeholder || `Seleccione ${label.toLowerCase()}`}
        </option>
        {options.map((option) => (
          <option key={option} value={option} className="text-black">
            {option}
          </option>
        ))}
      </select>
      {/* Errores */}
      { error && (
        <div>
          <Alert className="mt-1">
            <AlertTitle>{error}</AlertTitle>
          </Alert>
        </div>
      )}
    </div>
  );
};

export default SelectContainer;