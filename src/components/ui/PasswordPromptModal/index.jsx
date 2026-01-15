// components/ui/PasswordPromptModal.jsx
import React, { useState, useRef, useEffect } from "react";
import { Lock, Eye, EyeOff, AlertTriangle, CheckCircle } from "lucide-react";
import Modal from "../Modal";
import { Button } from "../Button";
import { Card, CardContent, CardHeader, CardTitle } from "../Cards";
import useScreenSize from "../../../hooks/useScreenSize";

/**
 * 🔐 MODAL PARA SOLICITAR CONTRASEÑA DE DOCUMENTO
 * - Interfaz segura para ingreso de contraseñas
 * - Validación en tiempo real
 * - Manejo de intentos fallidos
 * - Auto-focus y manejo de teclado
 */

const PasswordPromptModal = ({
  isOpen,
  onClose,
  onSubmit,
  document,
  isValidating = false,
  error = null,
  attemptCount = 0,
  maxAttempts = 3,
}) => {
  const screenSize = useScreenSize();
  const isMobile = screenSize.width < 768;
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState("");
  const passwordInputRef = useRef(null);

  // Auto-focus cuando se abre el modal
  useEffect(() => {
    if (isOpen && passwordInputRef.current) {
      setTimeout(() => {
        passwordInputRef.current.focus();
      }, 100);
    }
  }, [isOpen]);

  // Limpiar estado cuando se abre/cierra el modal
  useEffect(() => {
    if (isOpen) {
      setPassword("");
      setLocalError("");
      setShowPassword(false);
    }
  }, [isOpen]);

  // Manejar errores externos
  useEffect(() => {
    setLocalError(error || "");
  }, [error]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!password.trim()) {
      setLocalError("Ingrese la contraseña del documento");
      return;
    }

    if (password.length < 8) {
      setLocalError("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    setLocalError("");
    onSubmit(password);
  };

  const handleClose = () => {
    setPassword("");
    setLocalError("");
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSubmit(e);
    } else if (e.key === "Escape") {
      handleClose();
    }
  };

  const remainingAttempts = maxAttempts - attemptCount;
  const isLocked = attemptCount >= maxAttempts;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="sm">
      <Card className="border-0 shadow-none">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 p-3 bg-amber-100 rounded-full w-fit">
            <Lock className="w-8 h-8 text-amber-600" />
          </div>
          <CardTitle className="text-xl font-semibold ">
            Documento Protegido
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            Este documento requiere contraseña para acceder
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Información del documento */}
          {document && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <h4 className="font-medium text-gray-900 text-sm truncate">
                {document.nombre_archivo}
              </h4>
              <p className="text-xs text-gray-600 mt-1">
                Nivel de seguridad:{" "}
                <span className="font-medium capitalize">
                  {document.security_level}
                </span>
              </p>
            </div>
          )}

          {/* Alertas de seguridad */}
          {isLocked ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-900">
                  Acceso bloqueado temporalmente
                </p>
                <p className="text-xs text-red-700 mt-1">
                  Se han excedido los intentos máximos. Intente más tarde o
                  contacte al autor del documento.
                </p>
              </div>
            </div>
          ) : (
            attemptCount > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-900">
                    Contraseña incorrecta
                  </p>
                  <p className="text-xs text-amber-700 mt-1">
                    Intentos restantes: {remainingAttempts}
                  </p>
                </div>
              </div>
            )
          )}

          {/* Formulario de contraseña */}
          {!isLocked && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="document-password"
                  className="block text-sm font-medium text-blue-default"
                >
                  Contraseña del documento
                </label>
                <div className="relative">
                  <input
                    ref={passwordInputRef}
                    id="document-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isValidating}
                    placeholder="Ingrese la contraseña"
                    className={`w-full px-3 py-2 pr-10 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      localError
                        ? "border-red-300 bg-red-50"
                        : "border-gray-300"
                    } ${isValidating ? "opacity-50 cursor-not-allowed" : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isValidating}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showPassword ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {localError && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {localError}
                  </p>
                )}
              </div>

              {/* Información de seguridad */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-blue-800">
                    <p className="font-medium mb-1">
                      Protección de seguridad activa
                    </p>
                    <ul className="space-y-1 text-blue-700">
                      <li>• Las contraseñas no se almacenan en el navegador</li>
                      <li>
                        • El acceso se registra en el sistema de auditoría
                      </li>
                      <li>• La sesión expira automáticamente</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Botones de acción */}
              <div className={`flex gap-3 pt-2 ${isMobile ? "flex-col" : ""}`}>
                <Button
                  type="button"
                  variant="amber"
                  onClick={handleClose}
                  disabled={isValidating}
                  className="flex-1 px-2 py-4 rounded-md"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="default"
                  disabled={isValidating || !password.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-2 py-4 rounded-md"
                >
                  {isValidating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      Acceder
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}

          {/* Información adicional para documentos bloqueados */}
          {isLocked && (
            <div className={`flex gap-3 pt-2 ${isMobile ? "flex-col" : ""}`}>
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  ¿Necesita acceso a este documento?
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="amber"
                  onClick={handleClose}
                  className="flex-1 px-2 py-4 rounded-md"
                >
                  Cerrar
                </Button>
                <Button
                  variant="default"
                  onClick={() => {
                    // Aquí podrías implementar funcionalidad para contactar al autor
                    console.log("Contactar autor del documento");
                  }}
                  className="flex-1 px-2 py-4 rounded-md"
                >
                  Contactar Autor
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </Modal>
  );
};

export default PasswordPromptModal;
