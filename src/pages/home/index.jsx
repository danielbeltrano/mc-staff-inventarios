import React, { useState } from "react";
import { Button } from "../../components/ui/Button";
import logo2 from "../../assets/logo2.png";
import Login from "../../components/LoginContainer/Login";
import SignUp from "../../components/LoginContainer/SignUp";
import useScreenSize from "../../hooks/useScreenSize";
import { AlertCircle, LogIn, UserPlus } from 'lucide-react';

const Home = () => {
  const screenSize = useScreenSize();
  const isMobile = screenSize.width <= 768;
  
  const [view, setView] = useState({
    isLogin: true,
  });

  const handleLoginView = (e) => {
    e.preventDefault();
    setView({
      isLogin: true,
    });
  };

  const handleSignUpView = (e) => {
    e.preventDefault();
    setView({
      isLogin: false,
    });
  };

  return (
    <div className={`flex flex-col gap-6 w-full justify-center items-center min-h-screen bg-gradient-to-br from-amber-50 to-blue-50 p-4`}>
      {/* Mensaje de Ayuda */}
      {/* <div className="w-full max-w-md bg-white rounded-xl shadow-md overflow-hidden border border-amber-default transition-all duration-300 hover:shadow-lg">
        <div className="p-6 flex items-start space-x-4">
          <AlertCircle className="h-6 w-6 text-amber-default flex-shrink-0" />
          <div className="space-y-1">
            <p className="text-sm text-gray-600">
              Personal del Gimnasio Marie Curie. En caso de tener problemas para acceder, 
              por favor escribir al correo{' '}
              <a 
                href="mailto:soporte@gimnasiomariecurie.edu.co" 
                className="text-blue-default font-semibold hover:underline"
              >
                soporte@gimnasiomariecurie.edu.co
              </a>
            </p>
          </div>
        </div>
      </div> */}

      {/* Contenedor Principal */}
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg overflow-hidden border border-amber-default">
        {/* Logo y Título */}
        <div className="p-8 pb-0 space-y-4">
          <div className="flex justify-center transform transition-transform duration-300 hover:scale-105">
            <img src={logo2} alt="logo2" className="w-[80%]" />
          </div>
          <h1 className="text-xl font-bold text-center text-blue-default">
            Personal GBCMC
          </h1>
        </div>

        {/* Tabs de Navegación */}
        <div className="px-8 pt-6 w-full">
          <div className="flex justify-center space-x-6">
            <button
              onClick={handleLoginView}
              className={`group relative flex items-center gap-2 px-4 py-3 font-medium transition-all duration-200 
                ${view.isLogin 
                  ? "text-blue-default" 
                  : "text-gray-500 hover:text-blue-default"
                }`}
            >
              <LogIn className={`h-5 w-5 transition-colors
                ${view.isLogin ? "text-blue-default" : "text-gray-400 group-hover:text-blue-default"}
              `} />
              <span>Inicio de sesión</span>
              {/* Indicador activo */}
              {view.isLogin && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-default" />
              )}
            </button>

            <button
              onClick={handleSignUpView}
              className={`group relative flex items-center gap-2 px-4 py-3 font-medium transition-all duration-200
                ${!view.isLogin 
                  ? "text-blue-default" 
                  : "text-gray-500 hover:text-blue-default"
                }`}
            >
              <UserPlus className={`h-5 w-5 transition-colors
                ${!view.isLogin ? "text-blue-default" : "text-gray-400 group-hover:text-blue-default"}
              `} />
              <span>Registrarse</span>
              {/* Indicador activo */}
              {!view.isLogin && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-default" />
              )}
            </button>
          </div>
        </div>

        {/* Contenedor del Formulario */}
        <div className="p-8">
          <div className="transition-all duration-300 transform">
            {view.isLogin ? <Login /> : <SignUp />}
          </div>
        </div>
      </div>

      {/* Footer con información adicional */}
      <div className="w-full max-w-md text-center text-sm text-gray-500">
        <p>
          Plataforma exclusiva para el personal del{' '}
          <span className="text-blue-default font-medium">
            Gimnasio Marie Curie
          </span>
        </p>
      </div>
    </div>
  );
};

export default Home;