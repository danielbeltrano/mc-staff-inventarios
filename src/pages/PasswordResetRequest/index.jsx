import React, { useState } from "react";
import logo2 from "../../assets/logo2.png";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "../../components/ui/Button";
import InputText from "../../components/ui/InputText";
import { supabaseStudentClient } from "../../core/config/supabase/supabaseCampusStudentClient";

const validateEmailWithDomain = (email) => {
  const re = /^[^\s@]+@gimnasiomariecurie\.edu\.co$/;
  return re.test(email);
};

const PasswordResetRequest = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!email) {
      setError("Por favor ingresa un correo válido");
      return;
    }

    const isValidEmail = validateEmailWithDomain(email);

    if (!isValidEmail) {
      setError("El correo debe ser del dominio @gimnasiomariecurie.edu.co");
      return;
    }

    setIsValidating(true);

    setLoading(true);

    try {
      const { error } = await supabaseStudentClient.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/password-reset-confirmation`,
      });

      setIsValidating(false);

      if (error) {
        console.error("Error al enviar el correo de restablecimiento:", error);
        setError(
          `Hubo un error al intentar enviar el correo: ${error.message}`
        );
      } else {
        setMessage(
          "Correo de restablecimiento enviado con éxito. Por favor revisa tu bandeja de entrada."
        );
      }
    } catch (err) {
      console.error("Error inesperado:", err);
      setError("Ocurrió un error inesperado. Inténtalo de nuevo más tarde.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-blue-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-lg transform transition-all duration-300 hover:shadow-xl border border-amber-default">
        {/* Logo Section */}
        <div className="flex flex-col items-center justify-center">
          <img
            src={logo2}
            alt="Logo"
            className="w-48 mb-6 transform transition-transform duration-300 hover:scale-105"
          />
          <h2 className="mt-2 text-center text-2xl font-bold text-gray-900">
            Restablecer contraseña
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Ingresa tu correo electrónico y te enviaremos las instrucciones
          </p>
        </div>

        {/* Form Section */}
        <form onSubmit={handleResetPassword} className="mt-8 space-y-6">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-default h-5 w-5" />
            <InputText
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Correo electrónico"
              required
              className="pl-10 w-full py-3 px-4 border border-amber-default rounded-lg focus:ring-2 focus:ring-blue-default focus:border-transparent transition-all duration-200"
            />
          </div>

          {/* Error and Success Messages */}
          {error && (
            <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-200 flex items-center">
              <span className="ml-2">{error}</span>
            </div>
          )}

          {message && (
            <div className="text-green-500 text-sm bg-green-50 p-3 rounded-lg border border-green-200 flex items-center">
              <span className="ml-2">{message}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-default hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5" />
                  <span>Enviando...</span>
                </>
              ) : (
                "Enviar instrucciones"
              )}
            </Button>

            <Link
              to="/password-reset-confirmation"
              className="w-full inline-flex items-center justify-center py-3 px-4 border border-amber-default rounded-lg text-blue-default bg-white hover:bg-amber-50 transition-colors duration-200 gap-2"
            >
              <ArrowLeft className="h-5 w-5" />
              Volver al inicio
            </Link>
          </div>
        </form>

        {/* Additional Help Text */}
        <p className="mt-4 text-center text-sm text-gray-600">
          ¿Necesitas ayuda?{' '}
          <a href="ingeniero@gimnasiomariecurie.edu.co" className="text-blue-default hover:text-blue-700">
            Contacta a soporte
          </a>
        </p>
      </div>
    </div>
  );
};

export default PasswordResetRequest;
