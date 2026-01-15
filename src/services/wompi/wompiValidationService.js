// src/services/wompiValidationService.js

/**
 * Servicio de Validación de Pagos Wompi - VERSIÓN GLOBAL
 * Soporta múltiples entornos: producción, pruebas (sandbox), desarrollo
 */

const ENTORNO = {
  PRODUCCION: 'produccion',
  PRUEBAS: 'pruebas',
  DESARROLLO: 'desarrollo'
};

const ENTORNO_ACTUAL = import.meta.env.VITE_WOMPI_ENVIRONMENT || ENTORNO.PRUEBAS;

const WOMPI_CONFIG = {
  [ENTORNO.PRODUCCION]: {
    apiUrl: 'https://production.wompi.co/v1',
    publicKey: import.meta.env.VITE_APP_WOMPI_PUBLIC_KEY,
    descripcion: 'Entorno de PRODUCCIÓN - Validación de pagos reales',
  },
  [ENTORNO.PRUEBAS]: {
    apiUrl: 'https://sandbox.wompi.co/v1',
    publicKey: import.meta.env.VITE_APP_WOMPI_PUBLIC_KEY_TEST,
    descripcion: 'Entorno de PRUEBAS (Sandbox) - Validación de transacciones de prueba',
  },
  [ENTORNO.DESARROLLO]: {
    apiUrl: 'https://sandbox.wompi.co/v1',
    publicKey: import.meta.env.VITE_APP_WOMPI_PUBLIC_KEY_TEST,
    descripcion: 'Entorno de DESARROLLO - Validación de pruebas con logs extendidos',
  }
};

const getConfig = () => {
  const config = WOMPI_CONFIG[ENTORNO_ACTUAL];
  
  if (!config) {
    console.error(`Entorno "${ENTORNO_ACTUAL}" no válido. Usando entorno de pruebas.`);
    return WOMPI_CONFIG[ENTORNO.PRUEBAS];
  }
  
  if (!config.publicKey) {
    console.error(`No se encontró la clave pública para el entorno "${ENTORNO_ACTUAL}".`);
    console.error('Verifica que las variables de entorno estén configuradas correctamente.');
  }
  
  return config;
};

/**
 * Consulta una transacción específica en Wompi por su ID
 * @param {string} transactionId - ID de la transacción (ej: "1279282-1755801974-40947")
 * @returns {Promise<Object>} Datos de la transacción
 */
export const getTransactionById = async (transactionId) => {
  try {
    const config = getConfig();
    
    if (ENTORNO_ACTUAL === ENTORNO.DESARROLLO) {
      console.log('='.repeat(60));
      console.log(`WOMPI VALIDACIÓN - ${config.descripcion}`);
      console.log('='.repeat(60));
      console.log(`Consultando transacción: ${transactionId}`);
      console.log(`Endpoint: ${config.apiUrl}/transactions/${transactionId}`);
    }
    
    const response = await fetch(
      `${config.apiUrl}/transactions/${transactionId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.publicKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      if (ENTORNO_ACTUAL === ENTORNO.DESARROLLO) {
        console.error('Error en respuesta:', errorData);
      }
      
      throw new Error(
        errorData.error?.reason || 
        `Error HTTP ${response.status}: No se pudo consultar la transacción`
      );
    }

    const data = await response.json();
    
    if (!data.data) {
      throw new Error('La respuesta de Wompi no contiene datos de transacción');
    }

    if (ENTORNO_ACTUAL === ENTORNO.DESARROLLO) {
      console.log('Transacción encontrada:');
      console.log(`ID: ${data.data.id}`);
      console.log(`Estado: ${data.data.status}`);
      console.log(`Monto: ${data.data.amount_in_cents / 100} ${data.data.currency}`);
      console.log(`Payment Link ID: ${data.data.payment_link_id}`);
    }

    return {
      success: true,
      transaction: data.data,
      entorno: ENTORNO_ACTUAL,
    };
  } catch (error) {
    console.error(`Error en getTransactionById (${ENTORNO_ACTUAL}):`, error);
    return {
      success: false,
      error: error.message,
      entorno: ENTORNO_ACTUAL,
    };
  }
};

/**
 * Retorna el entorno actual configurado
 */
export const obtenerEntornoActual = () => ENTORNO_ACTUAL;

/**
 * Verifica si está en modo producción
 */
export const esModoProduccion = () => ENTORNO_ACTUAL === ENTORNO.PRODUCCION;

/**
 * Verifica si está en modo pruebas
 */
export const esModoPruebas = () => ENTORNO_ACTUAL === ENTORNO.PRUEBAS || ENTORNO_ACTUAL === ENTORNO.DESARROLLO;

/**
 * Retorna la configuración actual de Wompi
 */
export const getWompiValidationConfig = getConfig;