// src/pages/auth/RobustPasswordReset.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import logo2 from "../../../assets/logo2.png";
import PasswordInput from "../../../components/ui/PasswordInput";
import { AlertCircle, CheckCircle2, KeyRound, Loader2, Mail, Shield } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { supabaseStudentClient } from "../../../core/config/supabase/supabaseCampusStudentClient";

const RobustPasswordReset = () => {
  // Estados principales
  const [step, setStep] = useState('request'); // 'request', 'otp-verify', 'set-password', 'success'
  
  // Estados de formularios
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Estados de UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [verifying, setVerifying] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();

  // Verificar si llegamos desde un enlace de recovery
  useEffect(() => {
    const checkRecoveryLink = async () => {
      if (location.hash) {
        console.log("Verificando enlace de recovery...");
        
        const hashParams = new URLSearchParams(location.hash.substring(1));
        const error = hashParams.get('error');
        const errorCode = hashParams.get('error_code');
        const errorDescription = hashParams.get('error_description');
        const accessToken = hashParams.get('access_token');
        const type = hashParams.get('type');

        if (error) {
          console.log('Error en enlace:', { error, errorCode, errorDescription });
          
          if (errorCode === 'otp_expired') {
            setError('El enlace ha expirado. Te enviaremos un código de verificación seguro.');
          } else {
            setError(errorDescription || 'Error en el enlace de recuperación');
          }
          setStep('request');
        } else if (accessToken && type === 'recovery') {
          // Enlace válido
          const { data, error: sessionError } = await supabaseStudentClient.auth.setSession({
            access_token: accessToken,
            refresh_token: hashParams.get('refresh_token') || ''
          });

          if (sessionError) {
            setError('Error estableciendo sesión. Te enviaremos un código de verificación.');
            setStep('request');
          } else {
            setStep('set-password');
            setSuccess('Enlace verificado correctamente. Puedes cambiar tu contraseña.');
          }
        }
      }
      setVerifying(false);
    };

    checkRecoveryLink();
  }, [location]);

  // Solicitar reset de contraseña
  const handleRequestReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!email || !email.includes('@')) {
      setError('Ingresa una dirección de email válida.');
      setLoading(false);
      return;
    }

    try {
      // Siempre usar método OTP - Más seguro y confiable
      const { error } = await supabaseStudentClient.auth.signInWithOtp({
        email: email,
        options: { 
          shouldCreateUser: false, // Solo para usuarios existentes
          emailRedirectTo: undefined // No usar redirectTo para OTP
        }
      });
      
      if (error) {
        setError('Error enviando código: ' + error.message);
      } else {
        setStep('otp-verify');
        setSuccess('Código de 6 dígitos enviado a tu email. Revisa tu bandeja de entrada y spam.');
      }

    } catch (err) {
      setError('Error inesperado. Intenta nuevamente.');
      console.error('Error en reset:', err);
    } finally {
      setLoading(false);
    }
  };

  // Verificar código OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!otpCode || otpCode.length !== 6) {
      setError('Ingresa el código de 6 dígitos que recibiste en tu email.');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabaseStudentClient.auth.verifyOtp({
        email: email,
        token: otpCode,
        type: 'email' // Verificar como magic link para login
      });

      if (error) {
        console.error('Error OTP:', error);
        if (error.message.includes('expired')) {
          setError('El código ha expirado. Solicita uno nuevo.');
          setStep('request');
        } else if (error.message.includes('invalid')) {
          setError('Código inválido. Verifica el código de 6 dígitos e intenta nuevamente.');
        } else {
          setError('Error verificando código: ' + error.message);
        }
      } else {
        console.log('OTP verificado exitosamente:', data);
        setStep('set-password');
        setSuccess('✅ Código verificado correctamente. Ahora puedes crear tu nueva contraseña.');
      }

    } catch (err) {
      setError('Error verificando código. Intenta nuevamente.');
      console.error('Error verificando OTP:', err);
    } finally {
      setLoading(false);
    }
  };

  // Cambiar contraseña
  const handleSetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabaseStudentClient.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('Error actualizando password:', error);
        if (error.message.includes('session')) {
          setError('Sesión expirada. Inicia el proceso nuevamente.');
          setStep('request');
        } else {
          setError('Error actualizando contraseña: ' + error.message);
        }
      } else {
        console.log('Contraseña actualizada exitosamente');
        setStep('success');
        // Cerrar sesión para forzar re-login con nueva contraseña
        setTimeout(async () => {
          await supabaseStudentClient.auth.signOut();
        }, 1000);
      }

    } catch (err) {
      setError('Error inesperado actualizando contraseña.');
      console.error('Error set password:', err);
    } finally {
      setLoading(false);
    }
  };

  // Mostrar loading inicial
  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-blue-50">
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-amber-default">
          <div className="flex items-center justify-center">
            <Loader2 className="animate-spin h-8 w-8 text-blue-default mr-3" />
            <p className="text-lg text-gray-700">Verificando enlace...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-blue-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-lg transition-all border border-amber-default">
        
        {/* Header */}
        <div className="flex flex-col items-center justify-center">
          <img
            src={logo2}
            alt="Logo"
            className="w-48 mb-6 transform transition-transform duration-300 hover:scale-105"
          />
          
          <h2 className="mt-2 text-center text-2xl font-bold text-gray-900">
            {step === 'request' && 'Recuperar Contraseña'}
            {step === 'otp-verify' && 'Verificar Código'}
            {step === 'set-password' && 'Nueva Contraseña'}
            {step === 'success' && '¡Contraseña Actualizada!'}
          </h2>
          
          <p className="mt-2 text-center text-sm text-gray-600">
            {step === 'request' && 'Ingresa tu email para recibir un código de verificación seguro'}
            {step === 'otp-verify' && `Código enviado a: ${email}`}
            {step === 'set-password' && 'Crea una nueva contraseña segura para tu cuenta'}
            {step === 'success' && 'Ya puedes iniciar sesión con tu nueva contraseña'}
          </p>
        </div>

        {/* Step 1: Solicitar Reset */}
        {step === 'request' && (
          <form onSubmit={handleRequestReset} className="mt-8 space-y-6">
            
            {/* Información del método */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <Shield className="h-5 w-5 text-blue-500 mr-2" />
                <p className="text-sm text-blue-700">
                  <strong>Sistema seguro:</strong> Te enviaremos un código de 6 dígitos a tu email para verificar tu identidad.
                </p>
              </div>
            </div>

            {/* Campo de email */}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-default h-5 w-5" />
              <input
                type="email"
                placeholder="Ingresa tu dirección de email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-10 w-full py-3 px-4 border border-amber-default rounded-lg focus:ring-2 focus:ring-blue-default focus:border-transparent transition-all duration-200"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-default hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5" />
                  <span>Enviando código...</span>
                </>
              ) : (
                <>
                  <Shield className="h-5 w-5" />
                  <span>Enviar Código de Verificación</span>
                </>
              )}
            </Button>
          </form>
        )}

        {/* Step 2: Verificar OTP */}
        {step === 'otp-verify' && (
          <form onSubmit={handleVerifyOTP} className="mt-8 space-y-6">
            <div className="text-center mb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <Mail className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-sm text-gray-600">
                Revisa tu email y busca un código de 6 dígitos.<br/>
                <strong>Puede estar en spam o promociones.</strong>
              </p>
            </div>

            <div className="relative">
              <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-default h-5 w-5" />
              <input
                type="text"
                placeholder="123456"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                maxLength={6}
                className="pl-10 w-full py-4 px-4 border-2 border-green-200 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all duration-200 text-center text-3xl font-mono tracking-[0.5em] font-bold"
              />
            </div>

            <Button
              type="submit"
              disabled={loading || otpCode.length !== 6}
              className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5" />
                  <span>Verificando...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5" />
                  <span>Verificar Código</span>
                </>
              )}
            </Button>

            <div className="flex flex-col space-y-2">
              <button
                type="button"
                onClick={() => {
                  setStep('request');
                  setOtpCode('');
                  setError(null);
                }}
                className="text-sm text-blue-default hover:text-blue-700 transition-colors"
              >
                ← Solicitar nuevo código
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Set Password */}
        {step === 'set-password' && (
          <form onSubmit={handleSetPassword} className="mt-8 space-y-6">
            <div className="space-y-4">
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-default h-5 w-5" />
                <PasswordInput
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nueva Contraseña (mínimo 6 caracteres)"
                  value={newPassword}
                  required
                  className="pl-10 w-full py-3 px-4 border border-amber-default rounded-lg focus:ring-2 focus:ring-blue-default focus:border-transparent transition-all duration-200"
                />
              </div>

              <div className="relative">
                <CheckCircle2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-default h-5 w-5" />
                <PasswordInput
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirmar Nueva Contraseña"
                  value={confirmPassword}
                  required
                  className="pl-10 w-full py-3 px-4 border border-amber-default rounded-lg focus:ring-2 focus:ring-blue-default focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || newPassword.length < 6 || newPassword !== confirmPassword}
              className="w-full py-3 bg-blue-default hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5" />
                  <span>Actualizando Contraseña...</span>
                </>
              ) : (
                <>
                  <KeyRound className="h-5 w-5" />
                  <span>Actualizar Contraseña</span>
                </>
              )}
            </Button>
          </form>
        )}

        {/* Step 4: Success */}
        {step === 'success' && (
          <div className="text-center space-y-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">¡Contraseña Actualizada Exitosamente!</h3>
              <p className="text-gray-600 mt-3">
                Tu contraseña ha sido cambiada correctamente.<br/>
                Ahora puedes iniciar sesión con tu nueva contraseña.
              </p>
            </div>
            
            <Button
              onClick={() => navigate("/login")}
              className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="h-5 w-5" />
              <span>Ir a Iniciar Sesión</span>
            </Button>
          </div>
        )}

        {/* Mensajes de error y éxito */}
        {error && (
          <div className="flex items-start bg-red-50 p-4 rounded-lg border border-red-200">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-red-600 text-sm leading-relaxed">{error}</p>
          </div>
        )}

        {success && (
          <div className="flex items-start bg-green-50 p-4 rounded-lg border border-green-200">
            <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-green-600 text-sm leading-relaxed">{success}</p>
          </div>
        )}

        {/* Enlaces de navegación */}
        <div className="text-center space-y-2">
          <button
            onClick={() => navigate("/login")}
            className="text-sm text-blue-default hover:text-blue-700 transition-colors block w-full"
          >
            ← Volver al inicio de sesión
          </button>
          
          {step === 'request' && (
            <p className="text-xs text-gray-500">
              ¿Necesitas ayuda? Contacta soporte
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RobustPasswordReset;