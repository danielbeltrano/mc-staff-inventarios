// hooks/useSessionManager/index.jsx
import { useEffect, useRef, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logoutUser, setSessionId } from '../../redux/slices/authSlice';
import {
  SESSION_CONFIG,
  createSession,
  getActiveSessions,
  deleteOldestSession,
  updateSessionActivity,
  deleteSession,
  cleanupExpiredSessions,
  getCurrentSession,
} from '../../core/auth/sessionService';
import { toast } from 'react-toastify';
import { supabaseStudentClient } from '../../core/config/supabase/supabaseCampusStudentClient';

export const useSessionManager = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, accessToken, sessionId } = useSelector((state) => state.auth);
  
  const [currentSession, setCurrentSession] = useState(null);
  const [sessionExpiry, setSessionExpiry] = useState(null);
  const [showExpiryWarning, setShowExpiryWarning] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const heartbeatIntervalRef = useRef(null);
  const expiryCheckIntervalRef = useRef(null);
  const warningShownRef = useRef(false);

  /**
   * Inicializar sesión cuando el usuario se autentica
   */
  const initializeSession = useCallback(async () => {
    if (!user?.id || !accessToken || isInitialized) return;

    try {
    //   console.log('🔄 Inicializando sistema de sesiones...');

      // PASO 1: Verificar si YA EXISTE una sesión para este token
    //   console.log('🔍 Verificando si ya existe sesión para este token...');
      const existingSession = await getCurrentSession(user.id, accessToken);

      if (existingSession) {
        // console.log('✅ Sesión existente encontrada, reutilizando:', existingSession.id);
        
        setCurrentSession(existingSession);
        setSessionExpiry(new Date(existingSession.expires_at));
        
        if (!sessionId || sessionId !== existingSession.id) {
          dispatch(setSessionId(existingSession.id));
        }

        const timeUntilExpiry = new Date(existingSession.expires_at) - new Date();
        if (timeUntilExpiry <= SESSION_CONFIG.WARNING_BEFORE_EXPIRY_MS) {
        //   console.log('⚠️ Sesión existente está por expirar');
          setShowExpiryWarning(true);
        }

        startHeartbeat(existingSession.id);
        startExpiryCheck(new Date(existingSession.expires_at));
        
        setIsInitialized(true);
        return;
      }

    //   console.log('ℹ️ No existe sesión para este token, creando nueva...');

      // PASO 2: Limpiar sesiones expiradas
      await cleanupExpiredSessions();

      // PASO 3: Verificar cuántas sesiones activas tiene el usuario
      const activeSessions = await getActiveSessions(user.id);
    //   console.log(`📊 Sesiones activas: ${activeSessions.length}/${SESSION_CONFIG.MAX_DEVICES}`);

      // PASO 4: Si alcanzó el límite, cerrar la sesión más antigua
      if (activeSessions.length >= SESSION_CONFIG.MAX_DEVICES) {
        // console.log('⚠️ Límite de dispositivos alcanzado, cerrando sesión más antigua...');
        const oldestSession = await deleteOldestSession(user.id);
        
        toast.warning(
          `Se cerró tu sesión en ${oldestSession?.device_info?.browser || 'otro dispositivo'} (${oldestSession?.device_info?.os || 'desconocido'}) para permitir este inicio de sesión.`,
          { autoClose: 8000 }
        );
      }

      // PASO 5: Crear nueva sesión
      const newSession = await createSession(user.id, accessToken);
      setCurrentSession(newSession);
      setSessionExpiry(new Date(newSession.expires_at));
      
      dispatch(setSessionId(newSession.id));

    //   console.log('✅ Sesión inicializada correctamente');
    //   console.log(`⏰ La sesión expirará a las: ${new Date(newSession.expires_at).toLocaleString('es-CO')}`);

      startHeartbeat(newSession.id);
      startExpiryCheck(new Date(newSession.expires_at));
      
      setIsInitialized(true);

    } catch (error) {
      console.error('❌ Error inicializando sesión:', error);
      
      // Manejo específico del error de duplicado
      if (error.code === '23505' && error.message.includes('active_sessions_session_token_hash_key')) {
        console.warn('⚠️ Sesión duplicada detectada, intentando recuperar sesión existente...');
        
        try {
          const existingSession = await getCurrentSession(user.id, accessToken);
          
          if (existingSession) {
            // console.log('✅ Sesión recuperada exitosamente');
            setCurrentSession(existingSession);
            setSessionExpiry(new Date(existingSession.expires_at));
            dispatch(setSessionId(existingSession.id));
            
            startHeartbeat(existingSession.id);
            startExpiryCheck(new Date(existingSession.expires_at));
            setIsInitialized(true);
            
            return;
          }
        } catch (recoveryError) {
          console.error('Error recuperando sesión existente:', recoveryError);
        }
      }
      
      if (!isInitialized) {
        toast.error('Error al inicializar sesión. Por favor, intenta cerrar sesión y volver a iniciar.');
      }
    }
  }, [user?.id, accessToken, isInitialized, sessionId, dispatch]);

  /**
   * Iniciar heartbeat para mantener sesión activa
   */
  const startHeartbeat = useCallback((sessionIdParam) => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

    // console.log('💓 Iniciando heartbeat de sesión');

    heartbeatIntervalRef.current = setInterval(async () => {
      if (sessionIdParam) {
        // console.log('Actualizando actividad de sesión');
        const success = await updateSessionActivity(sessionIdParam);
        
        if (!success) {
          console.error('❌ Error en heartbeat - Sesión podría haber sido eliminada');
          await verifySessionExists(sessionIdParam);
        }
      }
    }, SESSION_CONFIG.HEARTBEAT_INTERVAL_MS);
  }, []);

  /**
   * Verificar si la sesión todavía existe en la BD
   */
  const verifySessionExists = async (sessionIdParam) => {
    try {
      const { data, error } = await supabaseStudentClient
        .from('active_sessions')
        .select('id')
        .eq('id', sessionIdParam)
        .maybeSingle();

      if (error || !data) {
        console.error('❌ Sesión no encontrada en BD - Fue cerrada en otro dispositivo');
        toast.error('Tu sesión fue cerrada desde otro dispositivo');
        await handleSessionExpired();
      }
    } catch (error) {
      console.error('Error verificando existencia de sesión:', error);
    }
  };

  /**
   * Iniciar verificación de expiración de sesión
   */
  const startExpiryCheck = useCallback((expiryDate) => {
    if (expiryCheckIntervalRef.current) {
      clearInterval(expiryCheckIntervalRef.current);
    }

    // console.log('⏰ Iniciando verificación de expiración de sesión');

    expiryCheckIntervalRef.current = setInterval(() => {
      const now = new Date();
      const timeRemaining = expiryDate - now;

      if (timeRemaining > 0 && 
          timeRemaining <= SESSION_CONFIG.WARNING_BEFORE_EXPIRY_MS && 
          !warningShownRef.current) {
        
        warningShownRef.current = true;
        setShowExpiryWarning(true);
        
        const minutesRemaining = Math.ceil(timeRemaining / 60000);
        
        toast.warning(
          `⚠️ Tu sesión expirará en ${minutesRemaining} minuto${minutesRemaining !== 1 ? 's' : ''}. Guarda tu trabajo.`,
          { 
            autoClose: false, 
            closeButton: true,
            toastId: 'session-expiry-warning'
          }
        );
      }

      if (timeRemaining <= 0) {
        // console.log('⏰ Sesión expirada (12 horas) - Cerrando sesión automáticamente');
        handleSessionExpired();
      }
    }, 60000);
  }, []);

  /**
   * Manejar sesión expirada
   */
  const handleSessionExpired = useCallback(async () => {
    // console.log('🚪 Manejando sesión expirada...');
    
    cleanup();

    if (sessionId || currentSession?.id) {
      try {
        await deleteSession(sessionId || currentSession.id);
        // console.log('✅ Sesión eliminada de BD');
      } catch (error) {
        console.error('❌ Error eliminando sesión:', error);
      }
    }

    toast.info('Tu sesión ha expirado después de 12 horas. Por favor, inicia sesión nuevamente.', {
      autoClose: 5000,
      closeButton: true,
    });

    setTimeout(async () => {
      await dispatch(logoutUser(sessionId || currentSession?.id));
      navigate('/', { replace: true });
    }, 500);

  }, [sessionId, currentSession, dispatch, navigate]);

  /**
   * Limpiar intervalos
   */
  const cleanup = useCallback(() => {
    // console.log('🧹 Limpiando intervalos de sesión');
    
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
    if (expiryCheckIntervalRef.current) {
      clearInterval(expiryCheckIntervalRef.current);
      expiryCheckIntervalRef.current = null;
    }
    
    warningShownRef.current = false;
    setShowExpiryWarning(false);
  }, []);

  /**
   * Extender sesión (reiniciar el timer de 12 horas)
   */
  const extendSession = useCallback(async () => {
    if (!currentSession?.id) {
      console.warn('No hay sesión actual para extender');
      return;
    }

    try {
    //   console.log('🔄 Extendiendo sesión...');
      
      const newExpiry = new Date();
      newExpiry.setHours(newExpiry.getHours() + SESSION_CONFIG.SESSION_DURATION_HOURS);

      const { error } = await supabaseStudentClient
        .from('active_sessions')
        .update({ expires_at: newExpiry.toISOString() })
        .eq('id', currentSession.id);

      if (error) throw error;

      setSessionExpiry(newExpiry);
      setShowExpiryWarning(false);
      warningShownRef.current = false;
      
      startExpiryCheck(newExpiry);

      toast.dismiss('session-expiry-warning');
      
      toast.success(`✅ Sesión extendida por ${SESSION_CONFIG.SESSION_DURATION_HOURS} horas más`);
      
    //   console.log(`✅ Sesión extendida hasta: ${newExpiry.toLocaleString('es-CO')}`);
    } catch (error) {
      console.error('❌ Error extendiendo sesión:', error);
      toast.error('No se pudo extender la sesión');
    }
  }, [currentSession, startExpiryCheck]);

  // Inicializar sesión cuando el usuario se autentica
  useEffect(() => {
    if (user?.id && accessToken && !isInitialized) {
      initializeSession();
    }

    return () => {
      if (!user?.id) {
        cleanup();
        setIsInitialized(false);
      }
    };
  }, [user?.id, accessToken, isInitialized, initializeSession, cleanup]);

  return {
    currentSession,
    sessionExpiry,
    showExpiryWarning,
    extendSession,
    handleSessionExpired,
    timeRemaining: sessionExpiry ? Math.max(0, sessionExpiry - new Date()) : 0,
  };
};