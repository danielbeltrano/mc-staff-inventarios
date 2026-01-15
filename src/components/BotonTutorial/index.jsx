import React from "react";
import { GraduationCap, Play, Sparkles } from "lucide-react";
import Tooltip, { POSITIONS } from "../ui/Tooltip";
import { useDriver } from "../../hooks/useDriver";
import useScreenSize from "../../hooks/useScreenSize";

export const BotonTutorial = ({ tour, isLoading = false }) => {
  const screenSize = useScreenSize();
  const isMobile = screenSize.width < 768;
  const { startTour } = useDriver({
    tourName: "formulario_familiarizate_2026",
    steps: tour,
    autoStart: false,
    onlyOnce: true,
    onComplete: () => {
      //console.log('Tour completado');
    },
  });

  if (isLoading) {
    return null;
  }

  if(isMobile){
    return <BotonTutorialCompacto tour={tour} isLoading={isLoading}/>
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <Tooltip
        text="Iniciar tutorial paso a paso"
        position={POSITIONS.LEFT}
        variant="amber"
        className="font-semibold"
      >
        {/* Contenedor extra para el badge sin overflow-hidden */}
        <div className="relative">
          <button
            onClick={startTour}
            type="button"
            aria-label="Iniciar tutorial guiado"
            className="group relative flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 rounded-full shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-amber-500/50 border-2 border-amber-300/50 overflow-hidden"
          >
          {/* Efecto de brillo animado en el fondo */}
          <span className="absolute inset-0 -z-10 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer-slow pointer-events-none" />

          {/* Pulsos sutiles detrás */}
          <span className="absolute inset-0 rounded-full bg-amber-400 opacity-30 animate-ping -z-20 pointer-events-none" />

          {/* Ícono de gorra de graduación */}
          <div className="relative flex items-center justify-center">
            <GraduationCap
              size={24}
              className="text-white transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 drop-shadow-lg"
            />
            
            {/* Estrellita decorativa */}
            <Sparkles
              size={12}
              className="absolute -top-1 -right-1 text-yellow-200 animate-pulse"
            />
          </div>

          {/* Texto */}
          <span className="text-white font-bold text-sm tracking-wide drop-shadow-md whitespace-nowrap">
            Tutorial Guiado
          </span>

          {/* Ícono de play */}
          <div className="flex items-center justify-center w-6 h-6 bg-white/20 rounded-full backdrop-blur-sm">
            <Play
              size={14}
              className="text-white fill-white transition-transform duration-300 group-hover:translate-x-0.5"
            />
          </div>

          {/* Efecto de hover brillante */}
          <span
            className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-40 transition-opacity duration-300 pointer-events-none"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,255,255,0), rgba(255,255,255,0.5), rgba(255,255,255,0))",
              mixBlendMode: "overlay",
            }}
          />
        </button>

        {/* Badge "NUEVO" fuera del botón para evitar overflow-hidden */}
        <span className="absolute -top-2 -right-2 flex items-center justify-center px-2 py-0.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-[10px] font-bold rounded-full animate-bounce border-2 border-white shadow-lg pointer-events-none z-10">
          NUEVO
        </span>
      </div>
      </Tooltip>

      <style>{`
        @keyframes shimmer-slow {
          0% { 
            transform: translateX(-150%) skewX(-20deg); 
          }
          100% { 
            transform: translateX(250%) skewX(-20deg); 
          }
        }
        
        .animate-shimmer-slow {
          animation: shimmer-slow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

// Versión alternativa más compacta (circular con texto en hover)
export const BotonTutorialCompacto = ({ tour, isLoading = false }) => {
  const { startTour } = useDriver({
    tourName: "formulario_familiarizate_2026",
    steps: tour,
    autoStart: false,
    onlyOnce: true,
    onComplete: () => {
      //console.log('Tour completado');
    },
  });

  if (isLoading) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <Tooltip
        text="Iniciar tutorial paso a paso"
        position={POSITIONS.LEFT}
        variant="amber"
        className="font-semibold"
      >
        {/* Contenedor extra para el badge azul */}
        <div className="relative">
          <button
            onClick={startTour}
            type="button"
            aria-label="Iniciar tutorial guiado"
            className="group relative w-16 h-16 flex items-center justify-center bg-gradient-to-br from-amber-500 via-amber-600 to-orange-500 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 hover:shadow-amber-500/50 border-2 border-amber-300/50 overflow-hidden"
          >
            {/* Pulsos detrás */}
            <span className="absolute inset-0 rounded-full bg-amber-400 opacity-40 animate-ping -z-10 pointer-events-none" />
            <span className="absolute inset-0 rounded-full bg-amber-500 opacity-25 animate-pulse -z-10 pointer-events-none" />

            {/* Ícono principal */}
            <div className="relative z-10">
              <GraduationCap
                size={32}
                className="text-white transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12 drop-shadow-lg"
              />
              
              {/* Play pequeño */}
              <div className="absolute -bottom-1 -right-1 flex items-center justify-center w-5 h-5 bg-green-500 rounded-full border-2 border-white shadow-lg">
                <Play size={10} className="text-white fill-white ml-0.5" />
              </div>
            </div>

            {/* Brillo al hover */}
            <span
              className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-40 transition-opacity duration-300 pointer-events-none"
              style={{
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0), rgba(255,255,255,0.6), rgba(255,255,255,0))",
                mixBlendMode: "overlay",
              }}
            />
          </button>

          {/* Badge azul con Sparkles - fuera del botón para evitar overflow */}
          <span className="absolute -top-1 -right-1 flex items-center justify-center w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xs font-bold rounded-full animate-bounce border-2 border-white shadow-lg pointer-events-none z-10">
            <Sparkles size={14} />
          </span>
        </div>
      </Tooltip>
    </div>
  );
};