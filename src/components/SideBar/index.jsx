import React, { useEffect, useState, createContext } from "react";
import { ChevronLeft, Menu, X, Moon, Sun } from "lucide-react";
import Switch from "react-switch"; // Importamos react-switch
import { Button } from "../ui/Button/index.jsx";
import SidebarUser from "./SidebarUser/index.jsx";
import Logout from "../LoginContainer/Logout/index.jsx";
import SidebarItems from "./SidebarItems/index.jsx";
import logo from "../../assets/gbcmc-logo.png";
import logoDark from "../../assets/gbcmc-logo-dm.png";
import { SidebarProvider } from "./SidebarContext.jsx/index.jsx";
import useScreenSize from "../../hooks/useScreenSize/index.jsx";

// Crear un contexto para el tema oscuro
export const ThemeContext = createContext({
  isDarkMode: true, // Cambiar default a true
  toggleDarkMode: () => {},
});

const SideBar = () => {
  const [expanded, setExpanded] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  // Cambiar inicialización para que dark mode sea por defecto
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedDarkMode = localStorage.getItem("darkMode");
    // Si no hay preferencia guardada, usar dark mode por defecto
    return savedDarkMode !== null ? savedDarkMode === "true" : true;
  });
  const screenSize = useScreenSize();
  const isMobile = screenSize.width <= 768;
  const [scrollPosition, setScrollPosition] = useState(0);

  // Aplicar el tema oscuro al cuerpo del documento cuando cambia isDarkMode
  useEffect(() => {
    // Aplicar clases al elemento raíz del documento
    if (isDarkMode) {
      document.documentElement.classList.add("dark-mode");
    } else {
      document.documentElement.classList.remove("dark-mode");
    }

    // También podemos guardar la preferencia en localStorage
    localStorage.setItem("darkMode", isDarkMode ? "true" : "false");
  }, [isDarkMode]);

  useEffect(() => {
    const handleScroll = () => {
      const currentPosition = window.pageYOffset;
      setScrollPosition(currentPosition);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Función para cerrar el sidebar en móvil cuando se hace clic en una opción
  const handleSidebarItemClick = () => {
    if (isMobile) {
      setIsMobileOpen(false); // Cerrar el sidebar en modo móvil
    }
  };

  const MobileMenuButton = () => (
    <Button
      variant="clean"
      className={`
        fixed z-50 transition-all duration-300 ease-in-out
        ${
          isDarkMode
            ? "!bg-blue-default !text-white border border-blue-default"
            : "!bg-white text-blue-default"
        }
        ${
          isMobileOpen
            ? "border-0 p-2"
            : `${
                scrollPosition > 0
                  ? `shadow-md ${isDarkMode ? "border border-amber-default" : "border border-amber-default"}`
                  : "shadow-none"
              } p-2`
        }
        rounded-lg 
        ${
          isDarkMode
            ? "hover:bg-gray-700 active:scale-95"
            : "hover:bg-amber-50 active:scale-95"
        }
      `}
      onClick={() => setIsMobileOpen(!isMobileOpen)}
    >
      {isMobileOpen ? (
        <X
          size={30}
          className="transition-transform duration-200 hover:rotate-90 hover:text-red-500"
        />
      ) : (
        <Menu
          size={scrollPosition > 0 ? 30 : 30}
          className="transition-transform duration-200 hover:scale-110"
        />
      )}
    </Button>
  );

  // Componente de botón tipo switch usando react-switch
  const ThemeSwitch = () => (
    <div
      className={`
        flex items-center justify-between 
        ${expanded ? "mx-2 mb-3" : "mb-3 justify-center"}
        ${isMobile ? "mx-2 mb-3" : ""}
      `}
    >
      {expanded && (
        <span
          className={`font-medium ${isDarkMode ? "text-white" : "text-gray-600"}`}
        >
          Modo oscuro
        </span>
      )}
      <Switch
        checked={isDarkMode}
        onChange={() => setIsDarkMode(!isDarkMode)}
        onColor="#fcd34d" // Color de fondo cuando está activado (blue-default)
        offColor="#0284c7" // Color de fondo cuando está desactivado (gray-300)
        onHandleColor="#FFFFFF" // Color del handle cuando está activado
        offHandleColor="#FFFFFF" // Color del handle cuando está desactivado
        handleDiameter={18}
        uncheckedIcon={false}
        checkedIcon={false}
        boxShadow="0px 1px 5px rgba(0, 0, 0, 0.2)"
        activeBoxShadow="0px 0px 1px 10px rgba(0, 0, 0, 0.2)"
        height={24}
        width={48}
        className="react-switch"
        id="theme-switch"
        checkedHandleIcon={
          <div className="flex items-center justify-center h-full">
            <Moon size={12} color="#f59e0b" />
          </div>
        }
        uncheckedHandleIcon={
          <div className="flex items-center justify-center h-full">
            <Sun size={12} color="#0284c7" />
          </div>
        }
      />
    </div>
  );

  return (
    <>
      {isMobile && <MobileMenuButton />}

      {/* Sidebar - Flotante en móviles y expandible en pantallas grandes */}
      <div
        className={`
          ${
            isMobile
              ? isMobileOpen
                ? "fixed inset-y-0 left-0 w-[85%] max-w-[320px]"
                : "hidden"
              : "sticky top-0 " + (expanded ? "w-[20rem]" : "w-[5.5rem]")
          }
          flex flex-col h-screen 
          ${isDarkMode ? "bg-blue-default text-white" : "bg-white"} 
          p-4
          ${isMobile ? "rounded-r-2xl shadow-2xl" : "rounded-e-md shadow-md"}
          ${
            isDarkMode
              ? "border-r border-y border-blue-default"
              : "border-r border-y border-amber-default"
          }
          z-40 transition-all duration-300 ease-in-out
        `}
      >
        <div
          className={`
          ${isMobile ? "p-6" : "pb-4"} 
          flex items-center justify-between
          border-b ${isDarkMode ? "border-white" : "border-amber-default"}
        `}
        >
          {/* Cambiamos el logo según el modo - ahora dark es por defecto */}
          <img
            src={isDarkMode ? logoDark : logo}
            className={`overflow-hidden transition-all duration-300 ${expanded ? "w-auto" : "w-0"} ${isMobile ? "w-[80%]" : "w-0"}`}
            alt="Logo"
          />

          {!isMobile && (
            <Button
              variant="clean"
              className={`bg-transparent ${isDarkMode ? "text-white" : "text-blue-default"}`}
              onClick={() => {
                if (isMobile) {
                  setIsMobileOpen(false); // Cerrar en móviles al hacer clic en el botón
                } else {
                  setExpanded(!expanded); // Alternar expansión en pantallas grandes
                }
              }}
            >
              <ChevronLeft
                size={expanded ? 30 : 50}
                strokeWidth={3}
                className={`${!expanded ? "rotate-180" : ""}  transition-all duration-400`}
              />
            </Button>
          )}
        </div>

        {/* Proveer el contexto del estado de expansión y tema */}
        <SidebarProvider value={{ expanded }}>
          <ThemeContext.Provider
            value={{
              isDarkMode,
              toggleDarkMode: () => setIsDarkMode(!isDarkMode),
            }}
          >
            {/* Pasamos la función handleSidebarItemClick para cerrar el sidebar en móvil al hacer clic */}
            <SidebarItems onItemClick={handleSidebarItemClick} />
          </ThemeContext.Provider>
        </SidebarProvider>

        <div className="mt-auto">
          {/* Switch de tema justo encima del usuario */}
          <ThemeSwitch />

          <div className={`flex flex-col ${expanded ? "mb-4 mx-2" : ""}`}>
            <ThemeContext.Provider
              value={{
                isDarkMode,
                toggleDarkMode: () => setIsDarkMode(!isDarkMode),
              }}
            >
              <SidebarUser expanded={expanded} />
              <Logout expanded={expanded} />
            </ThemeContext.Provider>
          </div>
        </div>
      </div>

      {/* Overlay en móvil para cerrar el menú al hacer clic fuera */}
      {isMobileOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30 transition-opacity duration-300"
          onClick={() => setIsMobileOpen(false)}
        ></div>
      )}
    </>
  );
};

export default SideBar;