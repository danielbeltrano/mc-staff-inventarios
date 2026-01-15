import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { registerUser } from "../../../redux/slices/authSlice";
import Button2 from "../../ui/Button2";
import InputForm from "../../ui/InputForm";
import PasswordInput from "../../ui/PasswordInput";
import { Mail, KeyRound, CheckCircle, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const SignUp = () => {
  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { error, status } = useSelector((state) => state.auth);

  const passwordRegex = new RegExp(
    "^" +
      "(?=.*[a-z])" + // al menos una minúscula
      "(?=.*[A-Z])" + // al menos una mayúscula
      "(?=.*\\d)" + // al menos un número
      "(?=.*[!@#$%^&*\\-+_:.])" + // al menos un caracter especial
      "[A-Za-z\\d!@#$%^&*\\-+_:.]{8,}" + // mínimo 8 caracteres
      "$"
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null); // Limpiar cualquier error previo

    // Validar que los campos no estén vacíos
    if (!userEmail || !userPassword || !confirmPassword) {
      setLocalError("Por favor complete todos los campos.");
      return;
    }

    // Validar que las contraseñas coincidan
    if (userPassword !== confirmPassword) {
      setLocalError("Las contraseñas no coinciden.");
      return;
    }

    if (!passwordRegex.test(userPassword)) {
      setLocalError(
        "La contraseña debe tener al menos 8 caracteres, incluyendo una mayúscula, una minúscula, un número y un carácter especial."
      );
      return;
    }
    try {
      const result = await dispatch(
        registerUser({
          email: userEmail,
          password: userPassword,
        })
      ).unwrap();

      if (result.success) {
        // Guardar en localStorage que el registro fue exitoso
        localStorage.setItem("registrationSuccess", "true");
        navigate("/login");
      }
    } catch (err) {
      setLocalError(err.message);
    }
  };

  if (showSuccess) {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-green-50 rounded-lg border border-green-200">
        <CheckCircle className="text-green-500 w-16 h-16 mb-4" />
        <h2 className="text-xl font-semibold text-green-700 mb-2">
          ¡Registro Exitoso!
        </h2>
        <p className="text-center text-green-600 mb-4">
          Tu cuenta ha sido creada correctamente.
        </p>
        <p className="text-center text-green-600 mb-6">
          Serás redirigido a la página de inicio de sesión en unos segundos...
        </p>
        <Button2
          onClick={() => navigate("/login")}
          className="bg-green-500 text-white hover:bg-green-600 transition-colors"
        >
          Ir al inicio de sesión
        </Button2>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      <div className="p-4 text-amber-800 bg-amber-50 border border-amber-200">
        Ingrese el correo institucional asignado para crear la cuenta
      </div>

      <div className="space-y-4">
        {/* Email Input */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-blue-default">
            Correo electrónico
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-default h-5 w-5" />
            <InputForm
              type="email"
              onChange={(e) => setUserEmail(e.target.value)}
              placeholder="Ingresa tu correo electrónico"
              value={userEmail}
              className="pl-10 w-full py-2.5 border border-amber-default rounded-lg focus:ring-2 focus:ring-blue-default focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>

        {/* Password Input */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-blue-default">
            Contraseña
          </label>
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-default h-5 w-5" />
            <PasswordInput
              onChange={(e) => setUserPassword(e.target.value)}
              placeholder="Ingresa tu contraseña"
              value={userPassword}
              className=" w-full py-2.5 border border-amber-default rounded-lg focus:ring-2 focus:ring-blue-default focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>

        {/* Confirm Password Input */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-blue-default">
            Confirmar contraseña
          </label>
          <div className="relative">
            <CheckCircle2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-default h-5 w-5" />
            <PasswordInput
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirma tu contraseña"
              value={confirmPassword}
              className="pl-10 w-full py-2.5 border border-amber-default rounded-lg focus:ring-2 focus:ring-blue-default focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>
      </div>

      {localError && (
        <div className="text-red-500 text-sm p-2 bg-red-50 rounded-md w-full text-center">
          {localError}
        </div>
      )}

     {/* Submit Button */}
      <Button2
        type="submit"
        disabled={status === 'loading'}
        className="w-full py-2.5 bg-blue-default hover:bg-blue-hover text-white rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
      >
        {status === 'loading' ? (
          <>
            <Loader2 className="animate-spin h-5 w-5" />
            <span>Registrando...</span>
          </>
        ) : (
          "Crear cuenta"
        )}
      </Button2>
    </form>
  );
};

export default SignUp;
