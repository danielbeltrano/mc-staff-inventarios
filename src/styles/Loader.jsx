// Loader.jsx
import React, { useEffect, useRef, useState } from "react";

/**
 * Loader (Tailwind) - versión robusta con transform scaleX para evitar problemas
 * duration: ms (default 54000)
 */
export default function Loader({ duration = 54000, onComplete }) {
  const [progress, setProgress] = useState(0); // 0..100
  const rafRef = useRef(null);
  const startRef = useRef(null);

  useEffect(() => {
    if (duration <= 0) {
      setProgress(100);
      onComplete?.();
      return;
    }

    const tick = (now) => {
      if (!startRef.current) startRef.current = now;
      const elapsed = now - startRef.current;
      const ratio = Math.min(1, elapsed / duration);
      setProgress(Math.round(ratio * 10000) / 100); // 2 decimales

      if (ratio < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
        onComplete?.();
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      startRef.current = null;
    };
  }, [duration, onComplete]);

  // tiempo restante mm:ss
  const msRemaining = Math.max(0, Math.round((1 - progress / 100) * duration));
  const secs = Math.ceil(msRemaining / 1000);
  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");

  // Evitar scale 0 absoluto para que siempre se muestre una 'sugerencia' visible
  const scale = Math.max(0.01, Math.min(1, progress / 100));

  return (
    <div className="w-full max-w-3xl mx-auto p-4 box-border font-sans">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-semibold text-gray-800">Progreso:   </span>
        <div className="flex items-center gap-3 ml-0.5">
          <div className="text-sm font-bold text-gray-900" aria-hidden>
            {progress.toFixed(2)}%
          </div>
          <div className="text-xs text-gray-500">Tiempo restante: {mm}:{ss}</div>
        </div>
      </div>

      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
        aria-label="Barra de progreso de carga"
        className="w-full h-4 bg-gray-200 rounded-full overflow-hidden shadow-inner relative"
      >
        {/* Barra interna usando transform scaleX */}
        <div
          className="absolute left-0 top-0 bottom-0 h-full rounded-l-full w-full"
          style={{
            // Degradado principal (fallback color por si no carga el gradiente)
            background:
              "linear-gradient(90deg, #2563eb 0%, #06b6d4 70%)",
            transform: `scaleX(${scale})`,
            transformOrigin: "left center",
            transition: "transform 120ms linear",
            willChange: "transform",
            // small box-shadow to keep depth
            boxShadow: "0 4px 12px rgba(37,99,235,0.18)",
            // ensure border-radius clipping on the right side when near 0
            borderTopRightRadius: 1000,
            borderBottomRightRadius: 1000
          }}
        />
      </div>
    </div>
  );
}