import React, { forwardRef } from "react";
import { Alert, AlertTitle } from "../Alert";

// Campo Select para react-hook-form
const SelectField = forwardRef(({ label, options, register, registerName, errors, watch, required, state, placeholder, className }, ref) => {
  const inputValue = watch(registerName, "");

  return (
    <div className="space-y-1.5">
      {/* Título del campo */}
      <label className="block text-[13px] font-medium text-blue-default">
        {label} {required ? "*" : ""}
      </label>
      <select
        ref={ref}
        disabled={state != null ? state !== "pre_registro" : false}
        {...register(registerName, {
          required: { value: required, message: "Este campo es obligatorio" },
        })}
        className={`block p-[8px] border border-amber-default rounded-md text-sm w-full h-[42px] ${className} ${
          inputValue === "" || (state != null ? state !== "pre_registro" : false)
            ? "!text-gray-400 opacity-100"
            : "text-black"
        }`}
        size="1"
        value={watch(registerName)}
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
      {errors[registerName] && (
        <Alert className="mt-4">
          <AlertTitle>{errors[registerName].message}</AlertTitle>
        </Alert>
      )}
    </div>
  );
});

export default SelectField;