import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import './driver-custom.css';

/**
 * Configuración personalizada de Driver.js
 * Documentación: https://driverjs.com/docs/configuration
 */

// Configuración base por defecto
export const driverConfig = {
  // Animaciones suaves
  animate: true,
  
  // Opacidad del overlay
  opacity: 0.75,
  
  // Padding alrededor del elemento resaltado
  padding: 10,
  
  // Permitir cerrar haciendo clic fuera
  allowClose: true,
  
  // Overlay clicable
  overlayClickNext: false,
  
  // Configuración del popover
  popoverClass: 'driverjs-theme',
  
  // Progreso del tour
  showProgress: true,
  
  // Botones personalizados
  nextBtnText: 'Siguiente →',
  prevBtnText: '← Anterior',
  doneBtnText: '✓ Finalizar',
  
  // Callbacks globales
  onDestroyStarted: () => {
    console.log('Tour finalizado');
  },
  
  onHighlightStarted: (element) => {
    //console.log('Resaltando elemento:', element);
  }
};

/**
 * Inicializa una instancia de Driver.js con configuración personalizada
 */
export const initDriver = (customConfig = {}) => {
  return driver({
    ...driverConfig,
    ...customConfig
  });
};

/**
 * Tema personalizado para Driver.js
 * Puedes ajustar estos estilos en tu archivo CSS global
 */

/**
 * Helper para guardar progreso del tour en localStorage
 */
export const saveTourProgress = (tourName, completed = false) => {
  const tours = JSON.parse(localStorage.getItem('completed_tours') || '{}');
  tours[tourName] = {
    completed,
    lastShown: new Date().toISOString()
  };
  localStorage.setItem('completed_tours', JSON.stringify(tours));
};

/**
 * Helper para verificar si un tour ya fue completado
 */
export const isTourCompleted = (tourName) => {
  const tours = JSON.parse(localStorage.getItem('completed_tours') || '{}');
  return tours[tourName]?.completed || false;
};

/**
 * Helper para resetear todos los tours
 */
export const resetAllTours = () => {
  localStorage.removeItem('completed_tours');
};