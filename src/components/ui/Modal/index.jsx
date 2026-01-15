import { X } from "lucide-react";
import React, { useEffect } from "react";
import useScreenSize from "../../../hooks/useScreenSize";

const Modal = ({ isOpen, onClose, children, className }) => {
  const screenSize = useScreenSize();
  const isMobile = screenSize.width <= 768;
  const isTablet = screenSize.width <= 1024;

  // Bloquear el scroll del body cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className={`fixed top-[-35px] inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/50 backdrop-blur-sm ${className} `}
    >
      <div className="fixed inset-0" />
      <div
        className={`
          relative bg-white rounded-lg shadow-xl border-2 border-amber-default
          ${
            isMobile
              ? "w-[95%] max-h-[90vh] m-2"
              : isTablet
                ? "w-[85%] max-h-[85vh]"
                : "w-[90%] max-h-[95vh]"
          }
          overflow-hidden flex flex-col
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header con botón de cierre */}
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-red-100 transition-colors duration-200 group"
          >
            <X
              size={24}
              className="text-gray-500 group-hover:text-red-500 transition-colors duration-200"
            />
          </button>
        </div>

        {/* Contenido scrolleable */}
        <div
          className={`
          flex-1 overflow-y-auto  
          ${isMobile ? "py-8" : "py-10 px-6"} 
          scrollbar-thin scrollbar-thumb-amber-default scrollbar-track-amber-50
        `}
        >
          {children}
        </div>

        {/* Footer con sombra cuando hay scroll */}
        {isMobile && (
          <div className="sticky bottom-0 w-full px-6 py-4 bg-white border-t border-gray-100 shadow-top">
            <button
              onClick={onClose}
              className="w-full md:w-auto px-6 py-2 text-white bg-red-500 hover:bg-red-600 rounded-md transition-colors duration-200"
            >
              Cerrar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Agregar estilos para la sombra superior
const styles = `
  .shadow-top {
    box-shadow: 0 -4px 6px -1px rgba(0, 0, 0, 0.1), 0 -2px 4px -1px rgba(0, 0, 0, 0.06);
  }
  
  /* Estilos para el scrollbar */
  .scrollbar-thin::-webkit-scrollbar {
    width: 6px;
  }
  
  .scrollbar-thumb-amber-default::-webkit-scrollbar-thumb {
    background-color: #FBD38D;
    border-radius: 3px;
  }
  
  .scrollbar-track-amber-50::-webkit-scrollbar-track {
    background-color: #FFFBEB;
  }
`;

// Agregar estilos al head del documento
if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

export default Modal;
