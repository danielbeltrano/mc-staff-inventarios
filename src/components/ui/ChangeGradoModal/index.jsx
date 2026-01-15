import React, { useEffect, useState } from "react";
import { AlertTriangle, X, Check, AlertCircle, ArrowRightLeft } from "lucide-react";
import InputContainer from "../InputContainer";
import useScreenSize from "../../../hooks/useScreenSize";
import SelectContainer from "../SelectContainer";

const grados = ["Escuela inicial", "Prekinder", "Kinder", "Transición", "Primero", "Segundo", "Tercero", "Cuarto", "Quinto", "Sexto", "Séptimo", "Octavo", "Noveno", "Décimo", "UnDécimo"];

// Modal de confirmación mejorado
const ChangeGradoModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  gradoActual, 
  type = "default", // default, warning, danger, success
  confirmText = "Aceptar",
  cancelText = "Cancelar",
  showIcon = true,
}) => {
  // Responsive
  const screenSize = useScreenSize();
  const isMobile = screenSize.width <= 768;

  // Estado para animaciones
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  // Configuración de tipos de modal
  const modalTypes = {
    default: {
      icon: AlertCircle,
      iconColor: "text-blue-default",
      iconBg: "bg-blue-light2",
      borderColor: "border-blue-default",
      confirmBg: "bg-blue-default hover:bg-blue-hover",
      confirmText: "text-white"
    },
    warning: {
      icon: AlertTriangle,
      iconColor: "text-amber-default",
      iconBg: "bg-amber-50",
      borderColor: "border-amber-default",
      confirmBg: "bg-amber-default hover:bg-amber-hover",
      confirmText: "text-white"
    },
    danger: {
      icon: AlertTriangle,
      iconColor: "text-error-bold",
      iconBg: "bg-error-light",
      borderColor: "border-error-border",
      confirmBg: "bg-error-bold hover:bg-error-hover",
      confirmText: "text-white"
    },
    success: {
      icon: Check,
      iconColor: "text-success-text",
      iconBg: "bg-success-light",
      borderColor: "border-success-border",
      confirmBg: "bg-green-600 hover:bg-green-700",
      confirmText: "text-white"
    }
  };

  const currentType = modalTypes[type] || modalTypes.default;
  const IconComponent = currentType.icon;

	const [nuevoGrado, setNuevoGrado] = useState("");
	const [gradoError, setGradoError] = useState(null);

  // Manejar animaciones de apertura/cierre
  useEffect(() => {
		setNuevoGrado("");
		setGradoError(null);
    if (isOpen) {
      setShouldRender(true);
      // Pequeño delay para permitir que el DOM se actualice antes de la animación
      const timer = setTimeout(() => setIsAnimating(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
      // Esperar a que termine la animación antes de desmontar
      const timer = setTimeout(() => setShouldRender(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Cerrar con tecla Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevenir scroll del body
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Manejar confirmación
  const handleConfirm = () => {
		if(nuevoGrado===""){
			setGradoError("Debes seleccionar el nuevo grado");
			return;
		}
    onConfirm(nuevoGrado);
    onClose();
  };

  // Manejar cierre con backdrop
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Si no debe renderizarse, no mostrar nada
  if (!shouldRender) return null;

  return (
    <div
      className={`
        fixed inset-0 z-50 flex items-center justify-center p-4
        bg-black transition-all duration-200 ease-out
        ${isAnimating ? 'bg-opacity-50' : 'bg-opacity-0'}
      `}
      onClick={handleBackdropClick}
    >
      {/* Modal Container */}
      <div
        className={`
          relative bg-white rounded-xl shadow-2xl border-2 ${currentType.borderColor}
          transform transition-all duration-200 ease-out
          ${isMobile ? 'w-full max-w-sm mx-4' : 'w-full max-w-md'}
          ${isAnimating 
            ? 'translate-y-0 opacity-100 scale-100' 
            : 'translate-y-4 opacity-0 scale-95'
          }
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors duration-150"
          aria-label="Cerrar modal"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-start gap-4">
            {/* Icon */}
            {showIcon && (
              <div className={`p-3 rounded-full ${currentType.iconBg} flex-shrink-0`}>
                <IconComponent 
                  size={24} 
                  className={currentType.iconColor}
                />
              </div>
            )}
            
            {/* Title and Message */}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-gray-900 mb-2 pr-8">
                Modificar Grado Aspirante
              </h3>
              
              <div className="flex text-sm text-gray-600 leading-relaxed items-end gap-2">
								<InputContainer label={"Grado Actual"} value={gradoActual} required={false} placeholder={""} type="text" setValue={()=>{}} error={""} setError={()=>{}} className={""} disabled={true}/>
								<ArrowRightLeft size={50} className="text-blue-default -mb-1"/>
								<SelectContainer label={"Nuevo grado"} value={nuevoGrado} options={grados.filter((a)=>a!==gradoActual)} required={false} placeholder={"Seleccionar grado"} setValue={setNuevoGrado} error={gradoError} setError={setGradoError} className={""}/>
              </div>      
                      
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 mx-6"></div>

        {/* Actions */}
        <div className="p-6 pt-4">
          <div className={`flex gap-3 ${isMobile ? 'flex-col-reverse' : 'flex-row justify-end'}`}>
            {/* Cancel Button */}
            <button
              onClick={onClose}
              className={`
                px-4 py-2.5 rounded-lg font-medium transition-all duration-150
                bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300
                ${isMobile ? 'w-full' : 'min-w-[100px]'}
              `}
            >
              {cancelText}
            </button>

            {/* Confirm Button */}
            <button
              onClick={handleConfirm}
              className={`
                px-4 py-2.5 rounded-lg font-medium transition-all duration-150
                ${currentType.confirmBg} ${currentType.confirmText}
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                shadow-sm hover:shadow-md transform hover:-translate-y-0.5
                ${isMobile ? 'w-full' : 'min-w-[100px]'}
              `}
            >
              {confirmText}
            </button>
          </div>
        </div>

        {/* Accessibility: Focus trap helper */}
        <div className="sr-only">
          Presione Escape para cerrar este modal
        </div>
      </div>
    </div>
  );
};

export default ChangeGradoModal;