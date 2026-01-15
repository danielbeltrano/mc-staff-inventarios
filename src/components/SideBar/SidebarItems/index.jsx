import React, { useState, useContext } from "react";
import {
  ClipboardPlus,
  Home,
  Notebook,
  UserPlus,
  ChevronDown,
  Users,
  Calendar,
  FileText,
  MessageCircle,
  LayoutDashboard,
  Component,
  NotebookPen,
  List,
  MessageCircleWarning,
  GraduationCap,
  BookOpen,
  DollarSign,
  Building,
  Loader2,
  AlertTriangle,
  Shield,
  User,
  CalendarCog,
  ChartColumn,
  ListChecks,
  Search,
  Settings,
  Webcam,
  ShieldPlus,
  ShieldPlusIcon,
  ClipboardList,
  BarChart3,
  Activity,
  Video,
  FileCheck,
  SearchIcon,
} from "lucide-react";
import SidebarItem from "../SidebarItem";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { useSidebarContext } from "../SidebarContext.jsx";
import { ThemeContext } from "../index.jsx";
import Tooltip, { POSITIONS } from "../../../components/ui/Tooltip";
import usePermissions from "../../../hooks/usePermissions";
import { use } from "react";

const SidebarItems = ({ onItemClick }) => {
  const { user } = useSelector((state) => state.auth);
  const userRole = user?.role;
  const userUuid = user?.id;
  const location = useLocation();
  const { expanded } = useSidebarContext();
  const { isDarkMode } = useContext(ThemeContext);
  const [expandedMenus, setExpandedMenus] = useState({});

  // Usar el hook de permisos
  const {
    hasServiceAccess,
    isReady: permissionsReady,
    status: permissionsStatus,
    error: permissionsError,
    accessibleServices,
  } = usePermissions();

  // Función para verificar acceso basado en rol Y servicio
  const hasRoleAndServiceAccess = (allowedRoles, service) => {
    const hasRole = allowedRoles.includes(userRole);
    const hasUuid = allowedRoles.includes(userUuid);
    const hasService = hasServiceAccess(service);
    return (hasRole || hasUuid) && hasService;
  };

  // Función para manejar la expansión de submenús
  const toggleSubmenu = (menuId) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menuId]: !prev[menuId],
    }));
  };

  // Función para verificar si algún submenú está activo
  const hasActiveSubmenu = (basePath) => {
    return location.pathname.startsWith(basePath);
  };

  // Verifica si una ruta está activa (incluyendo subrutas)
  const isRouteActive = (path) => {
    return location.pathname.startsWith(path);
  };

  // Auto-expandir menú de matrículas si estamos en una ruta de matrículas
  React.useEffect(() => {
    if (hasActiveSubmenu("/matriculas")) {
      setExpandedMenus((prev) => ({
        ...prev,
        matriculas: true,
      }));
    }
  }, [location.pathname]);

  // Mostrar loading mientras los permisos se cargan
  if (permissionsStatus === "loading" || !permissionsReady) {
    return (
      <div className="flex justify-center items-center p-4">
        <Loader2
          className={`animate-spin h-6 w-6 ${isDarkMode ? "text-white" : "text-blue-default"}`}
        />
        <span
          className={`ml-2 ${isDarkMode ? "text-white" : "text-blue-default"}`}
        >
          Cargando permisos...
        </span>
      </div>
    );
  }

  // Mostrar error si falló la carga de permisos
  if (permissionsStatus === "failed") {
    return (
      <div className="flex flex-col items-center p-4 space-y-2">
        <AlertTriangle
          className={`h-6 w-6 ${isDarkMode ? "text-red-400" : "text-red-500"}`}
        />
        <span
          className={`text-sm text-center ${isDarkMode ? "text-red-400" : "text-red-500"}`}
        >
          Error cargando permisos
        </span>
        {expanded && (
          <span
            className={`text-xs text-center ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
          >
            {permissionsError || "Intenta refrescar la página"}
          </span>
        )}
      </div>
    );
  }

  // ==================== CONFIGURACIÓN DE SUBMENÚS ====================


  /***************************************************************************
  *************** INICIP CONFIGURACIÓN DE SUBMENÚS MATRÍCULAS ****************
  ***************************************************************************/

  // Configuración de submenús de Matrículas
  const matriculasSubmenus = [];

 
   if (
      hasRoleAndServiceAccess(
        ["superadministrador", "docente", "directivo", "jefe_nivel", "admin_bienestar"],
        "matriculas"
      )
    ) {
      matriculasSubmenus.push(
        {
          icon: <Search size={20} />,
          text: "Buscador de estudiantes",
          to: "/matriculas/buscador",
        }
        );
    }

    if (
      hasRoleAndServiceAccess(
        ["bc0d5767-16f6-49c5-88df-fc89a54622cd", "contabilidad"],
        "matriculas"
      )
    ) {
      matriculasSubmenus.push(
        
        
        // Descomentar si se necesita monitoreo
        // {
        //   icon: <Activity size={20} />,
        //   text: "Monitoreo",
        //   to: "/matriculas/monitoreo",
        // },
        {
          icon: <ClipboardList size={20} />,
          text: "Reportes",
          to: "/matriculas/reportes",
        }
      );
    } 
    
    
    if (hasRoleAndServiceAccess(["superadministrador", "contabilidad"], "matriculas")) {
      matriculasSubmenus.push(
        {
          icon: <BarChart3 size={20} />,
          text: "Administrador de pagos",
          to: "/matriculas/listado",
        }
      )
    }

    // Acceso adicional para docentes
    if (
      hasRoleAndServiceAccess(
        ["superadministrador", "docente", "directivo", "jefe_nivel", "admin_bienestar"],
        "matriculas"
      )
    ) {
      matriculasSubmenus.push(
        {
          icon: <FileCheck size={20} />,
          text: "Gestión de Cierre de Matrículas",
          to: "/matriculas/atencion-virtual",
        },
        );
    }

     if (hasServiceAccess("matriculas")) {
    // Acceso para superadministrador y contabilidad
    if (
      hasRoleAndServiceAccess(
        ["superadministrador", "directivo"],
        "matriculas"
      )
    ) {
      matriculasSubmenus.push(
        
      
        {
          icon: <Video size={20} />,
          text: "Configuración de Horarios de atención virtual",
          to: "/matriculas/configuraracion-sesiones-virtuales",
        },
        {
        icon: <Calendar size={20} />,
        text: "Atención Virtual",
        to: "/matriculas/calendario-atencion-virtual/docentes",
      }
      );
    } 
  }

  
  ///////////////////////////////////////////////////////////////////////////
  ////////////// FIN CONFIGURACIÓN DE SUBMENÚS MATRÍCULAS ///////////////////
  ///////////////////////////////////////////////////////////////////////////



  // Función helper para renderizar submenú con icono
  const renderSubmenuWithIcon = (menuKey, icon, title, submenus, basePath) => {
    if (submenus.length === 0) return null;

    return (
      <div className="relative" key={menuKey}>
        {!expanded ? (
          <Tooltip
            text={title}
            position={POSITIONS.RIGHT}
            variant={isDarkMode ? "amber" : "default"}
          >
            <div
              className={`
                relative flex items-center w-full p-3 cursor-pointer my-2 group
                rounded-lg transition-colors duration-200
                ${
                  hasActiveSubmenu(basePath)
                    ? isDarkMode
                      ? "bg-amber-default text-white"
                      : "bg-blue-default hover:bg-blue-700"
                    : isDarkMode
                      ? "hover:bg-amber-default text-white"
                      : "hover:bg-sky-200"
                }
              `}
              onClick={() => toggleSubmenu(menuKey)}
            >
              <span
                className={`transition-colors duration-200 ${
                  isDarkMode
                    ? "text-white"
                    : hasActiveSubmenu(basePath)
                      ? "text-white group-hover:text-white"
                      : "text-blue-default group-hover:text-blue-default"
                }`}
              >
                {icon}
              </span>
            </div>
          </Tooltip>
        ) : (
          <div
            className={`
              relative flex items-center w-full p-3 cursor-pointer my-2 group
              rounded-lg transition-colors duration-200
              ${
                hasActiveSubmenu(basePath)
                  ? isDarkMode
                    ? "bg-amber-default text-white"
                    : "bg-blue-default hover:bg-blue-700"
                  : isDarkMode
                    ? "hover:bg-amber-default text-white"
                    : "hover:bg-sky-200"
              }
            `}
            onClick={() => toggleSubmenu(menuKey)}
          >
            <span
              className={`transition-colors duration-200 ${
                isDarkMode
                  ? "text-white"
                  : hasActiveSubmenu(basePath)
                    ? "text-white group-hover:text-white"
                    : "text-blue-default group-hover:text-blue-default"
              }`}
            >
              {icon}
            </span>
            <span
              className={`
                ml-3 flex-1 transition-colors duration-200
                ${
                  isDarkMode
                    ? "text-white"
                    : hasActiveSubmenu(basePath)
                      ? "text-white group-hover:text-white"
                      : "text-blue-default group-hover:text-blue-default"
                }
              `}
            >
              {title}
            </span>
            <ChevronDown
              size={25}
              className={`
                transition-all duration-200 
                ${expandedMenus[menuKey] ? "rotate-180" : ""}
                ${
                  isDarkMode
                    ? "text-white"
                    : hasActiveSubmenu(basePath)
                      ? "text-white group-hover:text-white"
                      : "text-blue-default group-hover:text-blue-default"
                }
              `}
            />
          </div>
        )}

        {/* Submenús */}
        <div
          className={`
            overflow-hidden transition-all duration-200 ease-in-out
            ${expandedMenus[menuKey] ? "max-h-[1000px]" : "max-h-0"}
          `}
        >
          <div className={`${!expanded ? "space-y-2" : "pl-8 mt-2 space-y-2"}`}>
            {submenus.map((submenu) => (
              <SidebarItem
                key={submenu.to}
                icon={submenu.icon}
                text={submenu.text}
                to={submenu.to}
                onClick={onItemClick}
                active={location.pathname === submenu.to}
                className={`
                  text-base ${!expanded ? "justify-center" : ""}
                  ${isDarkMode ? "text-gray-200" : ""}
                `}
              />
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <ul
      className={`flex-1 w-full mb-4 border-b pb-4 text-l my-2 overflow-y-auto ${
        isDarkMode ? "border-white" : "border-amber-default"
      }`}
    >

      {userRole === "superadministrador" && (
        <SidebarItem
          icon={
            <Home
              size={25}
              className={isDarkMode ? "text-white" : "text-blue-default"}
            />
          }
          text="Home"
          to="/superadmin"
          onClick={onItemClick}
          active={location.pathname === "/superadmin"}
          className={`mb-2 ${isDarkMode ? "text-white" : "text-blue-default"}`}
        />
      )}

      {/* Matrículas con submenús */}
      {/* {renderSubmenuWithIcon(
        "matriculas",
        <Notebook size={25} />,
        "Matrículas",
        matriculasSubmenus,
        "/matriculas"
      )} */}
    </ul>
  );
};

export default SidebarItems;