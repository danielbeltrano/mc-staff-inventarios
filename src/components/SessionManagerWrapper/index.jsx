// components/SessionManagerWrapper/index.jsx
import React from 'react';
import { useSelector } from 'react-redux';
import { useSessionManager } from '../../hooks/useSessionManager';
import SessionExpiryWarning from '../SessionExpiryWarning';

const SessionManagerWrapper = ({ children }) => {
  const { user } = useSelector((state) => state.auth);

  // Hook de gestión de sesiones (solo se activa si hay usuario autenticado)
  const {
    showExpiryWarning,
    extendSession,
    timeRemaining,
  } = useSessionManager();

  return (
    <>
      {children}

      {/* Advertencia de expiración de sesión */}
      {user && (
        <SessionExpiryWarning
          show={showExpiryWarning}
          timeRemaining={timeRemaining}
          onExtend={extendSession}
          onDismiss={() => {
            console.log('Usuario cerró advertencia de expiración');
          }}
        />
      )}
    </>
  );
};

export default SessionManagerWrapper;