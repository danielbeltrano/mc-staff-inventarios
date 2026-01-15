import { useEffect, useRef, useCallback } from 'react';
import { initDriver, saveTourProgress, isTourCompleted } from '../../../driverConfig';

/**
 * Hook personalizado para gestionar tours con Driver.js
 * 
 * @param {Object} options - Opciones del hook
 * @param {string} options.tourName - Nombre único del tour
 * @param {Array} options.steps - Pasos del tour
 * @param {boolean} options.autoStart - Iniciar automáticamente
 * @param {boolean} options.onlyOnce - Mostrar solo una vez
 * @param {Function} options.onComplete - Callback al completar
 * @returns {Object} { startTour, resetTour, driverInstance }
 */
export const useDriver = ({
  tourName,
  steps = [],
  autoStart = false,
  onlyOnce = true,
  onComplete = null,
  driverConfig = {}
}) => {
  const driverInstanceRef = useRef(null);
  const hasStartedRef = useRef(false);

  // Inicializar Driver.js
  useEffect(() => {
    if (!driverInstanceRef.current && steps.length > 0) {
      driverInstanceRef.current = initDriver({
        steps,
        onDestroyStarted: () => {
          if (driverInstanceRef.current?.hasNextStep() === false || 
              driverInstanceRef.current?.isLastStep()) {
            // Tour completado
            if (tourName) {
              saveTourProgress(tourName, true);
            }
            if (onComplete) {
              onComplete();
            }
          }
          driverInstanceRef.current?.destroy();
        },
        ...driverConfig
      });
    }

    return () => {
      if (driverInstanceRef.current) {
        driverInstanceRef.current.destroy();
        driverInstanceRef.current = null;
      }
    };
  }, [steps, tourName, onComplete, driverConfig]);

  // Auto-start
  useEffect(() => {
    if (autoStart && !hasStartedRef.current && driverInstanceRef.current) {
      // Verificar si ya se completó
      if (onlyOnce && tourName && isTourCompleted(tourName)) {
        return;
      }

      // Pequeño delay para asegurar que el DOM está listo
      const timer = setTimeout(() => {
        driverInstanceRef.current?.drive();
        hasStartedRef.current = true;
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [autoStart, onlyOnce, tourName]);

  // Iniciar tour manualmente
  const startTour = useCallback(() => {
    if (driverInstanceRef.current) {
      driverInstanceRef.current.drive();
    }
  }, []);

  // Resetear tour (borra progreso)
  const resetTour = useCallback(() => {
    if (tourName) {
      saveTourProgress(tourName, false);
    }
    hasStartedRef.current = false;
  }, [tourName]);

  // Mover al siguiente paso
  const nextStep = useCallback(() => {
    if (driverInstanceRef.current) {
      driverInstanceRef.current.moveNext();
    }
  }, []);

  // Mover al paso anterior
  const prevStep = useCallback(() => {
    if (driverInstanceRef.current) {
      driverInstanceRef.current.movePrevious();
    }
  }, []);

  // Ir a un paso específico
  const goToStep = useCallback((index) => {
    if (driverInstanceRef.current) {
      driverInstanceRef.current.moveTo(index);
    }
  }, []);

  // Detener el tour
  const stopTour = useCallback(() => {
    if (driverInstanceRef.current) {
      driverInstanceRef.current.destroy();
    }
  }, []);

  return {
    startTour,
    resetTour,
    nextStep,
    prevStep,
    goToStep,
    stopTour,
    driverInstance: driverInstanceRef.current
  };
};

/**
 * Hook simplificado para tours de onboarding
 * Se muestra solo la primera vez que el usuario accede
 */
export const useOnboarding = (tourName, steps, dependencies = []) => {
  const { startTour } = useDriver({
    tourName,
    steps,
    autoStart: true,
    onlyOnce: true
  });

  return { startOnboarding: startTour };
};