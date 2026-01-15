// ConfirmationModal.jsx
import React from 'react';
import { X, AlertTriangle, AlertCircle, Info, CheckCircle, HelpCircle } from 'lucide-react';
import { Button } from '../Button';

/**
 * Modal de confirmación reutilizable
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Controla si el modal está abierto
 * @param {Function} props.onClose - Callback al cerrar el modal
 * @param {Function} props.onConfirm - Callback al confirmar la acción
 * @param {string} props.title - Título del modal
 * @param {string} props.message - Mensaje principal
 * @param {string} props.confirmText - Texto del botón de confirmación (default: "Confirmar")
 * @param {string} props.cancelText - Texto del botón de cancelar (default: "Cancelar")
 * @param {string} props.variant - Variante visual: 'danger', 'warning', 'info', 'success' (default: 'warning')
 * @param {React.ReactNode} props.icon - Ícono personalizado (opcional)
 * @param {React.ReactNode} props.children - Contenido adicional del modal
 * @param {Array} props.details - Array de detalles a mostrar como lista
 * @param {Object} props.entityInfo - Información de la entidad afectada
 * @param {boolean} props.showCloseButton - Mostrar botón X en la esquina (default: true)
 * @param {boolean} props.closeOnOverlayClick - Cerrar al hacer clic en el overlay (default: true)
 * @param {boolean} props.isLoading - Estado de carga en el botón de confirmación
 */
const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirmar Acción",
  message = "¿Estás seguro de que deseas continuar?",
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "warning",
  icon = null,
  children = null,
  details = [],
  entityInfo = null,
  showCloseButton = true,
  closeOnOverlayClick = true,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  // Configuración de variantes (colores y estilos)
  const variantConfig = {
    danger: {
      headerBg: 'bg-red-50',
      headerBorder: 'border-red-200',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      titleColor: 'text-red-900',
      icon: <AlertCircle className="w-6 h-6" />,
      detailsBg: 'bg-red-50',
      detailsBorder: 'border-red-200',
      detailsTextColor: 'text-red-800',
      confirmButtonVariant: 'danger',
    },
    warning: {
      headerBg: 'bg-amber-50',
      headerBorder: 'border-amber-200',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      titleColor: 'text-amber-900',
      icon: <AlertTriangle className="w-6 h-6" />,
      detailsBg: 'bg-amber-50',
      detailsBorder: 'border-amber-200',
      detailsTextColor: 'text-amber-800',
      confirmButtonVariant: 'amber',
    },
    info: {
      headerBg: 'bg-blue-50',
      headerBorder: 'border-blue-200',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      titleColor: 'text-blue-900',
      icon: <Info className="w-6 h-6" />,
      detailsBg: 'bg-blue-50',
      detailsBorder: 'border-blue-200',
      detailsTextColor: 'text-blue-800',
      confirmButtonVariant: 'default',
    },
    success: {
      headerBg: 'bg-green-50',
      headerBorder: 'border-green-200',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      titleColor: 'text-green-900',
      icon: <CheckCircle className="w-6 h-6" />,
      detailsBg: 'bg-green-50',
      detailsBorder: 'border-green-200',
      detailsTextColor: 'text-green-800',
      confirmButtonVariant: 'default',
    },
    question: {
      headerBg: 'bg-gray-50',
      headerBorder: 'border-gray-200',
      iconBg: 'bg-gray-100',
      iconColor: 'text-gray-600',
      titleColor: 'text-gray-900',
      icon: <HelpCircle className="w-6 h-6" />,
      detailsBg: 'bg-gray-50',
      detailsBorder: 'border-gray-200',
      detailsTextColor: 'text-gray-800',
      confirmButtonVariant: 'default',
    },
  };

  const config = variantConfig[variant] || variantConfig.warning;
  const displayIcon = icon || config.icon;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && closeOnOverlayClick) {
      onClose();
    }
  };

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full animate-fadeIn">
        {/* Header */}
        <div className={`${config.headerBg} border-b ${config.headerBorder} px-6 py-4 rounded-t-lg relative`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 ${config.iconBg} rounded-full`}>
              <div className={config.iconColor}>
                {displayIcon}
              </div>
            </div>
            <h3 className={`text-lg font-semibold ${config.titleColor} flex-1`}>
              {title}
            </h3>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4">
          {/* Mensaje principal */}
          <p className="text-gray-700">
            {message}
          </p>

          {/* Lista de detalles */}
          {details.length > 0 && (
            <div className={`${config.detailsBg} border ${config.detailsBorder} rounded-md p-4`}>
              <div className="flex items-start gap-2">
                <Info className={`w-5 h-5 ${config.iconColor} flex-shrink-0 mt-0.5`} />
                <div className={`text-sm ${config.detailsTextColor}`}>
                  <p className="font-medium mb-2">Esta acción:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    {details.map((detail, index) => (
                      <li key={index}>{detail}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Información de la entidad */}
          {entityInfo && (
            <div className="bg-gray-50 rounded-md p-3 border border-gray-200">
              {entityInfo.title && (
                <p className="text-xs text-gray-500 mb-2 font-medium uppercase">
                  {entityInfo.title}
                </p>
              )}
              <div className="space-y-1 text-sm">
                {Object.entries(entityInfo.data || {}).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-gray-600">{key}:</span>
                    <span className="font-medium text-gray-900">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contenido personalizado */}
          {children}
        </div>

        {/* Footer con botones */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex gap-3 justify-end border-t border-gray-200">
          <Button
            onClick={onClose}
            variant="clean"
            disabled={isLoading}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-md transition-colors"
          >
            {cancelText}
          </Button>
          <Button
            onClick={handleConfirm}
            variant={config.confirmButtonVariant}
            disabled={isLoading}
            className="px-4 py-2 rounded-md flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Procesando...
              </>
            ) : (
              confirmText
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;