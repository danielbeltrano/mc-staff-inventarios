import React, { useState, useEffect } from "react";
import logo2 from "../../assets/logo2.png";
import { useLocation, useNavigate } from "react-router-dom";
import PasswordInput from "../../components/ui/PasswordInput";
import { AlertCircle, CheckCircle2, KeyRound, Loader2 } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { supabaseStudentClient } from "../../core/config/supabase/supabaseCampusStudentClient";

const PasswordResetConfirm = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState(null);
  const [verifying, setVerifying] = useState(true);
  const [userEmail, setUserEmail] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const handlePasswordReset = async () => {
      try {
        console.log("=== INICIANDO VERIFICACIÓN ===");
        console.log("URL completa:", window.location.href);
        console.log("Query:", window.location.search);
        console.log("Hash:", window.location.hash);

        // Intentar obtener sesión automáticamente (Supabase puede haberla establecido)
        const { data: sessionData, error: sessionError } = await supabaseStudentClient.auth.getSession();
        
        console.log("Sesión automática:", sessionData);
        console.log("Error sesión:", sessionError);

        if (sessionData?.session?.access_token) {
          console.log("✅ Sesión encontrada automáticamente");
          setResetToken(sessionData.session.access_token);
          setUserEmail(sessionData.session.user?.email || "");
        } else {
          // Verificar si hay parámetros en la URL
          const urlParams = new URLSearchParams(window.location.search);
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          
          const access_token = urlParams.get("access_token") || hashParams.get("access_token");
          const refresh_token = urlParams.get("refresh_token") || hashParams.get("refresh_token");
          const type = urlParams.get("type") || hashParams.get("type");
          
          console.log("Parámetros URL:", { access_token: !!access_token, refresh_token: !!refresh_token, type });

          if (access_token && type === "recovery") {
            try {
              const { data, error } = await supabaseStudentClient.auth.setSession({
                access_token,
                refresh_token: refresh_token || "",
              });

              if (!error && data.session) {
                console.log("✅ Sesión establecida desde URL");
                setResetToken(data.session.access_token);
                setUserEmail(data.session.user?.email || "");
              } else {
                console.log("Error estableciendo sesión:", error);
                throw new Error("No se pudo establecer sesión desde URL");
              }
            } catch (sessionError) {
              console.log("Error con tokens de URL:", sessionError);
              // Si todo falla, permitir reset manual
              setError("El enlace puede haber expirado. Puedes intentar cambiar la contraseña manualmente o solicitar un nuevo enlace.");
            }
          } else {
            console.log("❌ No se encontraron tokens válidos");
            setError("Enlace de recuperación inválido. Para probar manualmente, ingresa tu email y nueva contraseña.");
          }
        }

      } catch (err) {
        console.error("Error general:", err);
        setError("Error al verificar el enlace. Puedes intentar el cambio manual.");
      } finally {
        setVerifying(false);
      }
    };

    handlePasswordReset();
  }, []);

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    // Validaciones básicas
    if (newPassword.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      setLoading(false);
      return;
    }

    try {
      if (resetToken) {
        // MÉTODO 1: Usar sesión existente
        console.log("Intentando actualizar con sesión existente...");
        const { error } = await supabaseStudentClient.auth.updateUser({
          password: newPassword,
        });

        if (error) {
          console.log("Error método 1:", error);
          throw error;
        }
        
        console.log("✅ Contraseña actualizada con sesión");
      } else if (userEmail) {
        // MÉTODO 2: Reset directo con email (si tenemos el email)
        console.log("Intentando reset directo con email...");
        
        // Primero enviar nuevo enlace de reset
        const { error: resetError } = await supabaseStudentClient.auth.resetPasswordForEmail(userEmail, {
          redirectTo: `${window.location.origin}/password-reset-confirmation`,
        });

        if (resetError) {
          throw new Error("No se pudo enviar el enlace de reset. Verifica el email.");
        }

        setMessage("Se ha enviado un nuevo enlace a tu email. Revisa tu bandeja de entrada.");
        setLoading(false);
        return;
      } else {
        // MÉTODO 3: Solicitar email para reset manual
        const email = prompt("Ingresa tu email para enviar un nuevo enlace de recuperación:");
        
        if (!email) {
          setError("Email requerido para el reset de contraseña.");
          setLoading(false);
          return;
        }

        const { error: resetError } = await supabaseStudentClient.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/password-reset-confirmation`,
        });

        if (resetError) {
          throw new Error("No se pudo enviar el enlace. Verifica que el email sea correcto.");
        }

        setMessage("Se ha enviado un nuevo enlace de recuperación a tu email.");
        setLoading(false);
        return;
      }

      setMessage("¡Contraseña actualizada exitosamente! Redirigiendo al inicio de sesión...");
      
      // Cerrar sesión
      await supabaseStudentClient.auth.signOut();
      
      // Redirigir
      setTimeout(() => navigate("/login", { replace: true }), 3000);
      
    } catch (err) {
      console.error("Error al actualizar contraseña:", err);
      
      if (err.message?.includes("Same password")) {
        setError("La nueva contraseña debe ser diferente a la actual.");
      } else if (err.message?.includes("session")) {
        setError("Sesión expirada. Se enviará un nuevo enlace a tu email.");
        // Auto-reenvío si tenemos el email
        if (userEmail) {
          try {
            await supabaseStudentClient.auth.resetPasswordForEmail(userEmail, {
              redirectTo: `${window.location.origin}/password-reset-confirmation`,
            });
            setMessage("Nuevo enlace enviado a tu email.");
          } catch (resendError) {
            setError("Error al reenviar enlace. Solicita uno nuevo desde la página de login.");
          }
        }
      } else {
        setError("Error al actualizar contraseña: " + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Mostrar estado de verificación
  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-blue-50">
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-amber-default">
          <div className="flex items-center justify-center">
            <Loader2 className="animate-spin h-8 w-8 text-blue-default mr-3" />
            <p className="text-lg text-gray-700">Verificando enlace de recuperación...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-blue-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-lg transition-all border border-amber-default">
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
            {resetToken ? "Ingresa tu nueva contraseña" : "Enlace expirado - se enviará nuevo enlace"}
          </p>
          {userEmail && (
            <p className="mt-1 text-center text-xs text-blue-600">
              Para: {userEmail}
            </p>
          )}
        </div>

        <form onSubmit={handleUpdatePassword} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-default h-5 w-5" />
              <PasswordInput
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nueva Contraseña"
                value={newPassword}
                required
                className="pl-10 w-full py-3 px-4 border border-amber-default rounded-lg focus:ring-2 focus:ring-blue-default focus:border-transparent transition-all duration-200"
              />
            </div>

            <div className="relative">
              <CheckCircle2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-default h-5 w-5" />
              <PasswordInput
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirmar Contraseña"
                value={confirmPassword}
                required
                className="pl-10 w-full py-3 px-4 border border-amber-default rounded-lg focus:ring-2 focus:ring-blue-default focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>

          {message && (
            <div className="flex items-center bg-green-50 p-4 rounded-lg border border-green-200">
              <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
              <p className="text-green-500 text-sm">{message}</p>
            </div>
          )}

          {error && (
            <div className="flex items-center bg-red-50 p-4 rounded-lg border border-red-200">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-default hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin h-5 w-5" />
                <span>
                  {resetToken ? "Actualizando..." : "Enviando nuevo enlace..."}
                </span>
              </>
            ) : (
              resetToken ? "Actualizar Contraseña" : "Enviar Nuevo Enlace"
            )}
          </Button>
        </form>

        <div className="text-center space-y-2">
          <button
            onClick={() => navigate("/login")}
            className="text-sm text-blue-default hover:text-blue-700 transition-colors block w-full"
          >
            Volver al inicio de sesión
          </button>
          
          <button
            onClick={() => navigate("/forgot-password")}
            className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
          >
            Solicitar nuevo enlace de recuperación
          </button>
        </div>
      </div>
    </div>
  );
};

export default PasswordResetConfirm;