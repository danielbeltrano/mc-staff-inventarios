// components/Logout/index.jsx
import React, { useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../../../redux/slices/authSlice';
import Button from '../../ui/Button2';
import { Navigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { ThemeContext } from '../../SideBar';
import Tooltip, { POSITIONS } from '../../ui/Tooltip';
import useScreenSize from '../../../hooks/useScreenSize';
import { toast } from 'react-toastify';

const Logout = ({ expanded }) => {
  const screenSize = useScreenSize();
  const isMobile = screenSize.width < 768;
  const { isDarkMode } = useContext(ThemeContext); 
  const dispatch = useDispatch();
  const { user, status, sessionId } = useSelector((state) => state.auth);

  const handleLogout = async () => {
    try {
      console.log('👋 Usuario solicitó cerrar sesión');
      console.log('🔑 Session ID:', sessionId);
      
      // Dispatch del logout con sessionId
      const result = await dispatch(logoutUser(sessionId)).unwrap();
      
      if (result.hadErrors) {
        console.warn('⚠️ Sesión cerrada con advertencias');
        toast.info('Sesión cerrada correctamente');
      } else {
        console.log('✅ Sesión cerrada exitosamente');
        toast.success('Sesión cerrada exitosamente');
      }

      // Forzar recarga para limpiar estado
      setTimeout(() => {
        window.location.href = '/';
      }, 500);

    } catch (error) {
      console.error('❌ Error en handleLogout:', error);
      
      toast.warning('Sesión cerrada (con errores técnicos)');
      
      setTimeout(() => {
        window.location.href = '/';
      }, 500);
    }
  };

  if (!user && status !== 'loading') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className={`w-full flex flex-col mt-8 items-start justify-center ${expanded ? '' : 'bg-transparent rounded-md items-center'} ${isMobile ? 'pb-10' : ''}`}>
      {!expanded ? (
        <Tooltip 
          text="Cerrar sesión" 
          position={POSITIONS.RIGHT}
          variant={isDarkMode ? "default" : "amber"}
        >
          <Button
            onClick={handleLogout}
            variant="default"
            size="submit"
            className={`
              text-button1-text text-l m-0 p-0
              bg-transparent
            `}
            disabled={status === 'loading'}
          >
            <LogOut 
              size={30} 
              strokeWidth={2} 
              className={isDarkMode ? "text-white" : "text-amber-default"} 
            />
          </Button>
        </Tooltip>
      ) : (
        <Button
          onClick={handleLogout}
          variant="default"
          size="submit"
          className={`
            text-button1-text text-l m-0 p-0
            ${isDarkMode
              ? 'bg-amber-default hover:bg-amber-400 px-4 text-white'
              : 'bg-blue-default hover:bg-blue-hover px-4 text-white'
            }
          `}
          disabled={status === 'loading'}
        >
          {status === 'loading' ? 'Cerrando sesión...' : 'Cerrar sesión'}
        </Button>
      )}
    </div>
  );
};

export default Logout;