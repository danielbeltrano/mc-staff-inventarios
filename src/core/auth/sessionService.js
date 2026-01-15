// services/sessionService.js
import { supabaseStudentClient } from '../config/supabase/supabaseCampusStudentClient';
import CryptoJS from 'crypto-js'; // npm install crypto-js

// Configuración de sesiones
export const SESSION_CONFIG = {
  MAX_DEVICES: 2,
  SESSION_DURATION_HOURS: 24,
  HEARTBEAT_INTERVAL_MS: 5 * 60 * 1000, // 5 minutos
  WARNING_BEFORE_EXPIRY_MS: 5 * 60 * 1000, // Avisar 5 minutos antes
};

/**
 * Genera un hash único para el token de sesión
 */
const hashToken = (token) => {
  return CryptoJS.SHA256(token).toString();
};

/**
 * Obtiene información del dispositivo actual
 */
export const getDeviceInfo = () => {
  const userAgent = navigator.userAgent;
  let browser = 'Unknown';
  let os = 'Unknown';
  let deviceType = 'desktop';

  // Detectar navegador
  if (userAgent.indexOf('Chrome') > -1) browser = 'Chrome';
  else if (userAgent.indexOf('Firefox') > -1) browser = 'Firefox';
  else if (userAgent.indexOf('Safari') > -1) browser = 'Safari';
  else if (userAgent.indexOf('Edge') > -1) browser = 'Edge';
  else if (userAgent.indexOf('Opera') > -1) browser = 'Opera';

  // Detectar sistema operativo
  if (userAgent.indexOf('Win') > -1) os = 'Windows';
  else if (userAgent.indexOf('Mac') > -1) os = 'MacOS';
  else if (userAgent.indexOf('Linux') > -1) os = 'Linux';
  else if (userAgent.indexOf('Android') > -1) os = 'Android';
  else if (userAgent.indexOf('iOS') > -1) os = 'iOS';

  // Detectar tipo de dispositivo
  if (/Mobi|Android/i.test(userAgent)) deviceType = 'mobile';
  else if (/Tablet|iPad/i.test(userAgent)) deviceType = 'tablet';

  return {
    browser,
    os,
    deviceType,
    userAgent: userAgent.substring(0, 200),
    timestamp: new Date().toISOString(),
  };
};

/**
 * Obtiene todas las sesiones activas de un usuario
 */
export const getActiveSessions = async (userId) => {
  try {
    const { data, error } = await supabaseStudentClient
      .from('active_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error obteniendo sesiones activas:', error);
    throw error;
  }
};

/**
 * Crea una nueva sesión en la base de datos
 */
export const createSession = async (userId, accessToken) => {
  try {
    const deviceInfo = getDeviceInfo();
    const tokenHash = hashToken(accessToken);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + SESSION_CONFIG.SESSION_DURATION_HOURS);

    const { data, error } = await supabaseStudentClient
      .from('active_sessions')
      .insert({
        user_id: userId,
        session_token_hash: tokenHash,
        device_info: deviceInfo,
        expires_at: expiresAt.toISOString(),
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Sesión creada:', data);
    return data;
  } catch (error) {
    console.error('❌ Error creando sesión:', error);
    throw error;
  }
};

/**
 * Actualiza la última actividad de una sesión
 */
export const updateSessionActivity = async (sessionId) => {
  try {
    const { error } = await supabaseStudentClient
      .from('active_sessions')
      .update({ 
        last_activity: new Date().toISOString() 
      })
      .eq('id', sessionId);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Error actualizando actividad de sesión:', error);
    return false;
  }
};

/**
 * Elimina una sesión específica
 */
export const deleteSession = async (sessionId) => {
  try {
    const { error } = await supabaseStudentClient
      .from('active_sessions')
      .delete()
      .eq('id', sessionId);

    if (error) throw error;

    console.log('✅ Sesión eliminada:', sessionId);
    return true;
  } catch (error) {
    console.error('❌ Error eliminando sesión:', error);
    throw error;
  }
};

/**
 * Elimina todas las sesiones de un usuario
 */
export const deleteAllUserSessions = async (userId) => {
  try {
    const { error } = await supabaseStudentClient
      .from('active_sessions')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;

    console.log('✅ Todas las sesiones del usuario eliminadas');
    return true;
  } catch (error) {
    console.error('❌ Error eliminando sesiones:', error);
    throw error;
  }
};

/**
 * Elimina la sesión más antigua de un usuario
 */
export const deleteOldestSession = async (userId) => {
  try {
    const sessions = await getActiveSessions(userId);
    
    if (sessions.length === 0) {
      console.log('No hay sesiones para eliminar');
      return null;
    }

    const oldestSession = sessions[sessions.length - 1];

    await deleteSession(oldestSession.id);

    return oldestSession;
  } catch (error) {
    console.error('Error eliminando sesión más antigua:', error);
    throw error;
  }
};

/**
 * Limpia sesiones expiradas
 */
export const cleanupExpiredSessions = async () => {
  try {
    const { error } = await supabaseStudentClient
      .from('active_sessions')
      .delete()
      .lt('expires_at', new Date().toISOString());

    if (error) throw error;

    console.log('✅ Sesiones expiradas limpiadas');
    return true;
  } catch (error) {
    console.error('❌ Error limpiando sesiones expiradas:', error);
    return false;
  }
};

/**
 * Obtiene la sesión actual del usuario
 */
export const getCurrentSession = async (userId, accessToken) => {
  try {
    const tokenHash = hashToken(accessToken);

    const { data, error } = await supabaseStudentClient
      .from('active_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('session_token_hash', tokenHash)
      .maybeSingle();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error obteniendo sesión actual:', error);
    return null;
  }
};