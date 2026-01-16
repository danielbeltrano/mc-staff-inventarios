// Routes/index.jsx
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Routes, Route, Navigate } from "react-router-dom";
import Home from "../pages/home";
import Login from "../components/LoginContainer/Login";
import PasswordResetRequest from "../pages/PasswordResetRequest";
import useScreenSize from "../hooks/useScreenSize";
import ProtectedRoute from "../components/ProtectedRoute";
import { clearAuthError } from "../redux/slices/authSlice"; // ⭐ Solo importar clearAuthError
import ProtectedLayout from "../components/ProtectedLayout";
import LoadingSpinner from "../components/LoadingSpinner";
import GakuFooter from "../components/GakuFooter";

// Importar las páginas por rol
import SuperAdminDashboard from "../pages/superAdmin";

// Página de no autorizado
import UnauthorizedPage from "../pages/superAdmin/UnauthorizedPage";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PermissionsPage from "../pages/superAdmin/PermissionsPage";
import DebugPermissions from "../components/DebugPermissions";

// Matrículas
// import MatriculasPage from "../pages/matriculas";
// import CierreMatriculasPage from "../pages/matriculas/CierreMatriculasPage";
// import ConfigAtencionVirtualPage from "../pages/matriculas/ConfigAtencionVirtualPage";
// import VistaProfesorPage from "../pages/matriculas/VistaProfesorPage";

import { supabaseStudentClient } from "../core/config/supabase/supabaseCampusStudentClient";
import RobustPasswordReset from "../pages/auth/robustPasswordReset";
import CreatePersonalPage from "../pages/superAdmin/CreatePersonalPage";
import SequenceAdminPanel from "../features/Superadmin/SequenceAdminPanel";
import ProfesionalesContainer from "../features/Superadmin/ProfesionalesManagement/container/ProfesionalesContainer";

// Importar páginas de Inventario
import Items from "../pages/Inventario/Items/Items";
import DetalleItem from "../pages/Inventario/Items/DetalleItem";
import RegistrarItem from "../pages/Inventario/Items/RegistrarItem";

const AppRoutes = () => {
  const screenSize = useScreenSize();
  const isMobile = screenSize.width <= 768;

  const dispatch = useDispatch();
  const { user, status } = useSelector((state) => state.auth);

  // ✅ OPTIMIZADO: Listener de auth state con dependencias correctas
  // Ya NO restauramos sesión aquí, eso se hace en App.jsx
  useEffect(() => {
    // Solo configurar listener si hay usuario autenticado
    if (!user?.id) {
      return;
    }

    // console.log('🔔 Configurando listener de auth state para usuario:', user.email);

    // Configurar el listener de cambios en el estado de autenticación
    const { data: authListener } = supabaseStudentClient.auth.onAuthStateChange(
      (event, session) => {
        // console.log('🔔 Auth state event:', event);
        
        if (event === "SIGNED_OUT") {
          // console.log('🚪 Usuario cerró sesión - Limpiando datos locales');
          
          // Limpiar tokens del localStorage
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("persist:auth");
          
          // Limpiar estado de Redux
          dispatch(clearAuthError());
        }
        
        if (event === "TOKEN_REFRESHED") {
          // console.log('🔄 Token refrescado automáticamente');
        }
        
        if (event === "USER_UPDATED") {
          // console.log('👤 Información de usuario actualizada');
        }
      }
    );

    // ✅ Cleanup: Remover listener al desmontar o cuando cambie el usuario
    return () => {
      // console.log('🔕 Removiendo listener de auth state');
      authListener.subscription.unsubscribe();
    };
  }, [user?.id, dispatch]); // ⭐ CRÍTICO: Solo depende de user.id, no del objeto completo

  // Mostrar un loader mientras la sesión se restaura
  if (status === "loading") {
    return (
      <div className="w-full mt-4 p-4 flex justify-center items-center bg-white">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className={`w-full pt-2 pr-2`}>
      {/* {process.env.NODE_ENV === 'development' && <DebugPermissions />} */}
      <Routes>
        {/* ========== Rutas Públicas ========== */}
        <Route path="/" element={<Home />} />
        <Route path="/password-reset" element={<RobustPasswordReset />} />
        <Route
          path="/password-reset-confirmation"
          element={<RobustPasswordReset />}
        />
        <Route path="/forgot-password" element={<RobustPasswordReset />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* ========== Rutas Protegidas ========== */}
        <Route element={<ProtectedLayout />}>
          {/* MATRÍCULAS - Requiere rol Y acceso al servicio */}
          {/* <Route
            element={
              <ProtectedRoute
                allowedRoles={["directivo", "superadministrador"]}
                requiredService="matriculas"
              />
            }
          >
            <Route path="/matriculas/" element={<MatriculasPage />}>
              <Route index element={<Navigate to="listado" replace />} />
              <Route path="monitoreo" element={<MatriculasPage />} />
            </Route>

            <Route
              path="/matriculas/configuraracion-sesiones-virtuales"
              element={<ConfigAtencionVirtualPage />}
            />
          </Route> */}

          {/* Rutas contabilidad */}
          {/* <Route
            element={
              <ProtectedRoute
                allowedRoles={["superadministrador", "contabilidad"]}
                requiredService="matriculas"
              />
            }
          >
            <Route path="/matriculas/" element={<MatriculasPage />}>
              <Route index element={<Navigate to="listado" replace />} />
              <Route path="listado" element={<MatriculasPage />} />
              <Route path="detalle/:id" element={<MatriculasPage />} />
              <Route path="reportes" element={<MatriculasPage />} />
            </Route>
          </Route> */}

          {/* Rutas docentes */}
          {/* <Route
            element={
              <ProtectedRoute
                allowedRoles={["superadministrador", "docente", "directivo", "jefe_nivel", "admin_bienestar"]}
                requiredService="matriculas"
              />
            }
          >
            <Route path="/matriculas/" element={<MatriculasPage />}>
              <Route index element={<Navigate to="listado" replace />} />
              <Route path="buscador" element={<MatriculasPage />} />
            </Route>
            
            <Route
              path="/matriculas/atencion-virtual"
              element={<CierreMatriculasPage />}
            />
            <Route
              path="/matriculas/calendario-atencion-virtual/docentes"
              element={<VistaProfesorPage />}
            />
          </Route> */}


{/* Rutas para Super Administradores - Sin servicio específico requerido */}
          <Route
            element={<ProtectedRoute allowedRoles={["superadministrador"]} />}
          >
            <Route path="/superadmin" element={<SuperAdminDashboard />} />
            <Route
              path="/administrador/crear-usuarios"
              element={<CreatePersonalPage />}
            />
            <Route
              path="/administrador/gestion-permisos"
              element={<PermissionsPage />}
            />
            <Route
              path="/administrador/configuracion-admisiones"
              element={<SequenceAdminPanel />}
            />
            <Route
              path="/administrador/configuracion-bienestar"
              element={<ProfesionalesContainer />}
            />
            <Route path="/Items" element={<Items />} />
            <Route path="/item/:id" element={<DetalleItem />} />
            <Route path="/registro-item" element={<RegistrarItem />} />
          </Route>
          
        </Route>

        {/* ========== Ruta Catch-All ========== */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <ToastContainer />
    </div>
  );
};

export default AppRoutes;