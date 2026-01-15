import React, { useContext } from 'react'
import { useSidebarContext } from '../SidebarContext.jsx/index.jsx'; 
import { Link } from 'react-router-dom';
import { ThemeContext } from '../index.jsx'; 
import Tooltip, { POSITIONS } from '../../../components/ui/Tooltip'; 

const SidebarItem = ({ icon, text, to, onClick, active, className = "" }) => {
  const { expanded } = useSidebarContext();
  const { isDarkMode } = useContext(ThemeContext);
  
  return (
    <li className="relative flex items-center my-1 font-medium rounded-md cursor-pointer transition-colors group">
      {!expanded ? (
        <Tooltip 
          text={text} 
          position={POSITIONS.RIGHT}
          variant={isDarkMode ? "amber" : "default"}
        >
          <Link 
            to={to} 
            className={`
              flex items-center w-full p-2 gap-2
              rounded-lg transition-colors duration-200
              ${active 
                ? isDarkMode
                  ? `text-white bg-amber-default hover:bg-amber-400` // Activo en modo oscuro sin expandir
                  : `bg-blue-default hover:bg-blue-700 group` // Activo en modo claro
                : isDarkMode
                  ? `text-white hover:bg-sky-700` // No activo en modo oscuro
                  : `hover:bg-sky-200 group` // No activo en modo claro
              }
              ${className}
            `} 
            onClick={onClick}
          >
            <span className={`p-1 min-w-[40px] flex justify-center transition-colors duration-200 ${
              isDarkMode 
                ? active ? "text-white" : "text-white" 
                : active 
                  ? "text-white group-hover:text-white" 
                  : "text-blue-default group-hover:text-blue-default"
            }`}>
              {icon}
            </span>
            {/* Texto oculto cuando está contraído pero incluido para accesibilidad */}
            <span className="sr-only">{text}</span>
          </Link>
        </Tooltip>
      ) : (
        <Link 
          to={to} 
          className={`
            flex items-center w-full p-2 gap-2
            rounded-lg transition-colors duration-200 group
            ${active 
              ? isDarkMode
                ? `text-white bg-amber-default hover:bg-amber-400` // Activo en modo oscuro
                : `bg-blue-default hover:bg-blue-700` // Activo en modo claro
              : isDarkMode
                ? `text-white hover:bg-sky-700` // No activo en modo oscuro
                : `hover:bg-sky-200` // No activo en modo claro
            }
            ${className}
          `} 
          onClick={onClick}
        >
          <span className={`p-1 min-w-[40px] flex justify-center transition-colors duration-200 ${
            isDarkMode 
              ? active ? "text-white" : "text-white" 
              : active 
                ? "text-white group-hover:text-white" 
                : "text-blue-default group-hover:text-blue-default"
          }`}>
            {icon}
          </span>
          {/* Texto visible cuando está expandido */}
          <span className={`transition-colors duration-200 ${
            isDarkMode 
              ? active ? "text-white" : "text-white"
              : active 
                ? "text-white group-hover:text-white" 
                : "text-blue-default group-hover:text-blue-default"
          }`}>
            {text}
          </span>
        </Link>
      )}
    </li>
  );
}

export default SidebarItem;