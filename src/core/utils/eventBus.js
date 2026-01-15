// src/core/utils/eventBus.js

/**
 * Event Bus simple para comunicación entre componentes
 * Compatible con la estructura Redux existente
 */
class EventBus {
    constructor() {
      this.events = {};
    }
  
    /**
     * Suscribe una función a un evento
     * @param {string} event - Nombre del evento
     * @param {function} callback - Función a ejecutar cuando ocurra el evento
     * @returns {function} - Función para cancelar la suscripción
     */
    on(event, callback) {
      if (!this.events[event]) {
        this.events[event] = [];
      }
      this.events[event].push(callback);
  
      // Retornar función para cancelar la suscripción
      return () => {
        this.events[event] = this.events[event].filter(cb => cb !== callback);
      };
    }
  
    /**
     * Emite un evento con los datos proporcionados
     * @param {string} event - Nombre del evento
     * @param {any} data - Datos a pasar a los callbacks
     */
    emit(event, data) {
      if (this.events[event]) {
        this.events[event].forEach(callback => {
          callback(data);
        });
      }
    }
  }
  
  // Exportar una única instancia para toda la aplicación
  export const eventBus = new EventBus();
  
  // Constantes para los nombres de eventos
  export const EVENTS = {
    CASE_STATUS_UPDATED: 'case-status-updated',
  };