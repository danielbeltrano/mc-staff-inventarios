import { useState, useEffect } from "react";

const useScreenSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: undefined,
    height: undefined,
  });

  useEffect(() => {
    // Función para actualizar el tamaño de la ventana
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // Añadir el event listener para redimensionar la ventana
    window.addEventListener("resize", handleResize);

    // Establecer el tamaño inicial
    handleResize();

    // Cleanup: Eliminar el event listener al desmontar
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return windowSize;
};

export default useScreenSize;
