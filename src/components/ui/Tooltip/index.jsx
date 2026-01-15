import React, { useState, useRef } from "react";
import { createPortal } from "react-dom";

// Utilidad para combinar clases
const cn = (...classes) => {
  return classes.filter(Boolean).join(" ");
};

// Posiciones disponibles para el tooltip
const POSITIONS = {
  TOP: "top",
  BOTTOM: "bottom",
  LEFT: "left",
  RIGHT: "right"
};

// Estilos base para cada variante de tooltip
const baseStyles = {
  default: "bg-black text-white border border-blue-default text-xs rounded py-1 px-2 z-[9999]",
  amber: "bg-white text-blue-default border border-amber-default text-xs rounded py-2 px-2 shadow-sm z-[9999]",
};

// Animaciones para cada posición
const animationStyles = {
  [POSITIONS.TOP]: "opacity-0 translate-y-1 data-[show=true]:opacity-100 data-[show=true]:translate-y-0",
  [POSITIONS.BOTTOM]: "opacity-0 -translate-y-1 data-[show=true]:opacity-100 data-[show=true]:translate-y-0",
  [POSITIONS.LEFT]: "opacity-0 translate-x-1 data-[show=true]:opacity-100 data-[show=true]:translate-x-0",
  [POSITIONS.RIGHT]: "opacity-0 -translate-x-1 data-[show=true]:opacity-100 data-[show=true]:translate-x-0",
};

// Componente de portal para renderizar fuera del DOM
const TooltipPortal = ({ children }) => {
  if (typeof document === 'undefined') return null;
  return createPortal(children, document.body);
};

const Tooltip = ({ 
  children, 
  text, 
  variant = "default",
  position = POSITIONS.TOP,
  className = "" 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const triggerRef = useRef(null);
  
  // Obtener el estilo base según la variante
  const baseStyle = baseStyles[variant] || baseStyles.default;
  const animationStyle = animationStyles[position] || animationStyles[POSITIONS.TOP];
  
  // Usar un efecto para animar la entrada
  React.useEffect(() => {
    let timeout;
    if (isHovered) {
      // Pequeño retraso para mostrar el tooltip para evitar parpadeos
      timeout = setTimeout(() => setIsVisible(true), 50);
    } else {
      setIsVisible(false);
    }
    return () => clearTimeout(timeout);
  }, [isHovered]);

  const calculatePosition = () => {
    if (!triggerRef.current) return { top: 0, left: 0 };
    
    const rect = triggerRef.current.getBoundingClientRect();
    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;
    
    // Ajustar la distancia para mejorar la apariencia
    const offset = 12; // Distancia del tooltip al elemento
    
    // Calcular posición según la dirección elegida
    switch (position) {
      case POSITIONS.TOP:
        return {
          top: rect.top - offset + scrollY,
          left: rect.left + rect.width / 2 + scrollX,
          transform: 'translate(-50%, -100%)',
        };
      case POSITIONS.BOTTOM:
        return {
          top: rect.bottom + offset + scrollY,
          left: rect.left + rect.width / 2 + scrollX,
          transform: 'translateX(-50%)',
        };
      case POSITIONS.LEFT:
        return {
          top: rect.top + rect.height / 2 + scrollY,
          left: rect.left - offset + scrollX,
          transform: 'translate(-100%, -50%)',
        };
      case POSITIONS.RIGHT:
        return {
          top: rect.top + rect.height / 2 + scrollY,
          left: rect.right + offset + scrollX,
          transform: 'translateY(-50%)',
        };
      default:
        return {
          top: rect.top - offset + scrollY,
          left: rect.left + rect.width / 2 + scrollX,
          transform: 'translate(-50%, -100%)',
        };
    }
  };

  return (
    <>
      <div 
        ref={triggerRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocus={() => setIsHovered(true)}
        onBlur={() => setIsHovered(false)}
        className="inline-block"
      >
        {children}
      </div>
      
      {isHovered && (
        <TooltipPortal>
          <div
            data-show={isVisible}
            className={cn(
              baseStyle,
              animationStyle,
              "transition-all duration-200 ease-in-out",
              className
            )}
            style={{
              position: 'absolute',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              ...calculatePosition()
            }}
            aria-hidden={!isVisible}
          >
            {text}
          </div>
        </TooltipPortal>
      )}
    </>
  );
};

// Exportar el componente y las constantes
export { POSITIONS };
export default Tooltip;