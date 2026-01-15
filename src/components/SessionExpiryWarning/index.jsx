// components/SessionExpiryWarning/index.jsx
import React, { useEffect, useState } from 'react';
import { AlertCircle, Clock, RefreshCw, X } from 'lucide-react';
import Button from '../ui/Button2'; // Usa tu componente Button existente

const SessionExpiryWarning = ({ 
  show, 
  timeRemaining, 
  onExtend, 
  onDismiss 
}) => {
  const [minutesLeft, setMinutesLeft] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (timeRemaining > 0) {
      const minutes = Math.floor(timeRemaining / 60000);
      const seconds = Math.floor((timeRemaining % 60000) / 1000);
      setMinutesLeft(minutes);
      setSecondsLeft(seconds);
    }
  }, [timeRemaining]);

  if (!show || timeRemaining <= 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] max-w-md animate-slide-in-right">
      <div className="bg-white rounded-xl shadow-2xl border-2 border-amber-400 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-white animate-pulse" />
            <h3 className="text-white font-bold text-sm">
              Sesión por Expirar
            </h3>
          </div>
          <button
            onClick={onDismiss}
            className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-4 space-y-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-700">
              Tu sesión expirará en{' '}
              <span className="font-bold text-amber-600">
                {minutesLeft}:{secondsLeft.toString().padStart(2, '0')}
              </span>
              {' '}minutos por seguridad.
            </p>
          </div>

          {/* Barra de progreso */}
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-amber-500 to-orange-600 h-full transition-all duration-1000 ease-linear"
              style={{ 
                width: `${Math.max(0, Math.min(100, (timeRemaining / (5 * 60 * 1000)) * 100))}%` 
              }}
            />
          </div>

          {/* Botones */}
          <div className="flex gap-2">
            <Button
              onClick={onExtend}
              variant="default"
              size="submit"
              className="flex-1 bg-blue-default hover:bg-blue-hover text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium"
            >
              <RefreshCw className="h-4 w-4" />
              Extender Sesión
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            Al extender, tu sesión continuará por 12 horas más
          </p>
        </div>
      </div>
    </div>
  );
};

export default SessionExpiryWarning;