import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Routes, Route, Navigate } from "react-router-dom";
import Home from "../pages/home";
import Login from "../components/LoginContainer/Login";
import PasswordResetRequest from "../pages/PasswordResetRequest";
import useScreenSize from "../hooks/useScreenSize";
import ProtectedRoute from "../components/ProtectedRoute";
import { restoreSession } from "../redux/slices/authSlice";
import ProtectedLayout from "../components/ProtectedLayout";
import LoadingSpinner from "../components/LoadingSpinner";
import GakuFooter from "../components/GakuFooter";

// Importar las páginas por rol
import DirectorGrupoDashboard from "../pages/directorGrupo";
import SuperAdminDashboard from "../pages/superAdmin";
import Bienestar from "../features/bienestar";
import CasesSection from "../features/bienestar/cases";
import RemisionManagementPage from "../pages/bienestar/RemisionManagementPage";
import BienestarDashboard from "../features/bienestar/dashboard";
import AdminNotesView from "../features/bienestar/componentsDeprecated/notesView";
import PasswordResetConfirm from "../pages/PasswordResetConfirm";
import CaseDetailContainer from "../features/bienestar/cases/containers/CaseDetailContainer";
import RemisionSection from "../features/bienestar/remissions";
import CreateRemissionPage from "../features/bienestar/remissions";
import CreateGroups from "../pages/bienestar/groups/CreateGroups";
import CreatePersonalPage from "../pages/superAdmin/CreatePersonalPage";
import AdminGroupsContainer from "../features/bienestar/groups/containers/AdminGroupsContainer";
import GroupDetailView from "../features/bienestar/groups/components/groupsComponents/GroupDetailView";

// RECURSOS HUMANOS - Portal Empleados
import EmployeePortalContainer from "../features/recursosHumanos/portalEmpleado/containers/EmployeePortalContainer";
import AttendanceContainer from "../features/recursosHumanos/portalEmpleado/containers/AttendanceContainer";
import RequestsContainer from "../features/recursosHumanos/portalEmpleado/containers/RequestsContainer";
import DocumentsContainer from "../features/recursosHumanos/portalEmpleado/containers/DocumentsContainer";
import ProfileContainer from "../features/recursosHumanos/portalEmpleado/containers/ProfileContainer";
import SettingsContainer from "../features/recursosHumanos/portalEmpleado/containers/SettingsContainer";

// Página de no autorizado
import UnauthorizedPage from "../pages/superAdmin/UnauthorizedPage";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PermissionsPage from "../pages/superAdmin/PermissionsPage";
import DebugPermissions from "../components/DebugPermissions";

//Admiciones
import RubricasPage from "../pages/admisiones/RubricasPage";
import ListaRubricasPage from "../pages/admisiones/ListaRubricasPage";
import GruposPage from "../pages/admisiones/GruposPage";
import EvaluacionPage from "../pages/admisiones/EvaluacionPage";
import GruposAsignadosPage from "../pages/admisiones/GruposAsignadosPage";
import ConfigEntrevistasPage from "../pages/admisiones/ConfigEntrevistasPage";
import ActasPage from "../pages/admisiones/ActasPage";
import DashboardPage from "../pages/admisiones/DashboardPage";
import FiltersPage from "../pages/admisiones/FilterPage";
import SetCupos from "../pages/admisiones/SetCupos";
import RobustPasswordReset from "../pages/auth/robustPasswordReset";
import SequenceAdminPanel from "../features/Superadmin/SequenceAdminPanel";
import ProfesionalesManagement from "../features/Superadmin/ProfesionalesManagement";
import ProfesionalesContainer from "../features/Superadmin/ProfesionalesManagement/container/ProfesionalesContainer";
import SupervisionBienestarContainer from "../features/bienestar/admin/container/SupervisionBienestarContainer";

//Matrículas
import MatriculasPage from "../pages/matriculas";
import CierreMatriculasPage from "../pages/matriculas/CierreMatriculasPage";
import ConfigAtencionVirtualPage from "../pages/matriculas/ConfigAtencionVirtualPage";
import VistaProfesorPage from "../pages/matriculas/VistaProfesorPage";

// import MatriculasPage from "../pages/matriculasOld";
// import CierreMatriculasPage from "../pages/matriculasOld/CierreMatriculasPage";

//Inventarios
import Items from "../pages/Inventario/Items/Items";

const AppRoutes = () => {
  const screenSize = useScreenSize();
  const isMobile = screenSize.width <= 768;

  const dispatch = useDispatch();
  const { user, status } = useSelector((state) => state.auth);

  // Restaurar sesión al cargar la aplicación
  useEffect(() => {
    dispatch(restoreSession());
  }, [dispatch]);

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
        {/* Rutas públicas */}
        <Route path="/" element={<Home />} />
        <Route path="/password-reset" element={<RobustPasswordReset />} />
        <Route
          path="/password-reset-confirmation"
          element={<RobustPasswordReset />}
        />
        <Route path="/forgot-password" element={<RobustPasswordReset />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="/items" element={<Items />} />

        {/* Rutas protegidas */}
        <Route element={<ProtectedLayout />}>
          {/* MATRÍCULAS - Requiere rol Y acceso al servicio */}
          <Route
            element={
              <ProtectedRoute
                allowedRoles={["director_grupo", "superadministrador"]}
                requiredService="matriculas"
              />
            }
          >
            {/* <Route path="/matriculas" element={<MatriculasPage />} />
            <Route
              path="/matriculas/atencion-virtual"
              element={<CierreMatriculasPage />}
            /> */}

            {/* Rutas del módulo de matrículas */}
            <Route path="/matriculas/" element={<MatriculasPage />}>
              {/* Sub-rutas con índice por defecto */}
              <Route index element={<Navigate to="listado" replace />} />
              <Route path="buscador" element={<MatriculasPage />} />
              <Route path="listado" element={<MatriculasPage />} />
              <Route path="detalle/:id" element={<MatriculasPage />} />
              <Route path="reportes" element={<MatriculasPage />} />
              <Route path="monitoreo" element={<MatriculasPage />} />
            </Route>

            <Route
              path="/matriculas/atencion-virtual"
              element={<CierreMatriculasPage />}
            />
            <Route
              path="/matriculas/configuraracion-sesiones-virtuales"
              element={<ConfigAtencionVirtualPage />}
            />
          </Route>

          {/* Rutas protegidas */}
          <Route
              element={
                <ProtectedRoute
                  allowedRoles={["superadministrador", "docente"]}
                  requiredService="matriculas"
                />
              }
            >
              <Route
                path="/matriculas/calendario-atencion-virtual/docentes"
                element={<VistaProfesorPage />}
              />
            </Route>

          {/* BIENESTAR - Crear remisiones */}
          <Route
            element={
              <ProtectedRoute
                allowedRoles={[
                  "jefe_nivel",
                  "coordinador_general",
                  "superadministrador",
                  "admin_bienestar",
                  "profesional_bienestar",
                ]}
                requiredService="bienestar"
              />
            }
          >
            <Route
              path="/bienestar/crear_remisiones"
              element={<CreateRemissionPage />}
            />
          </Route>

          {/* BIENESTAR - Dashboard, gestión de casos y grupos */}
          <Route
            element={
              <ProtectedRoute
                allowedRoles={[
                  "profesional_bienestar",
                  "admin_bienestar",
                  "superadministrador",
                ]}
                requiredService="bienestar"
              />
            }
          >
            <Route
              path="/bienestar/dashboard"
              element={<BienestarDashboard />}
            />
            <Route path="/bienestar/estudiantes" element={<Bienestar />} />
            <Route path="/bienestar/casos" element={<CasesSection />} />
            <Route
              path="/bienestar/casos/:categoria_nombre/detalle-caso/:codigo_estudiante/:caso_id"
              element={<CaseDetailContainer />}
            />
            <Route
              path="/bienestar/casos/colaborativo/detalle-caso/:codigo_estudiante/:caso_id"
              element={<CaseDetailContainer />}
            />
            <Route
              path="/bienestar/crear-grupos"
              element={<CreateGroups currentProfessional={user} />}
            />
            <Route
              path="/bienestar/grupos"
              element={<AdminGroupsContainer currentProfessional={user} />}
            />
            <Route
              path="/bienestar/grupos/:grupoId"
              element={<GroupDetailView currentProfessional={user} />}
            />
          </Route>

          {/* BIENESTAR - Gestionar remisiones */}
          <Route
            element={
              <ProtectedRoute
                allowedRoles={["superadministrador"]}
                requiredService="bienestar"
              />
            }
          >
            <Route
              path="/bienestar/gestionar_remisiones"
              element={<RemisionManagementPage />}
            />
          </Route>

          {/* BIENESTAR - GESTION ADMINISTRATIVA */}
          <Route
            element={
              <ProtectedRoute
                allowedRoles={["superadministrador"]}
                requiredService="bienestar"
              />
            }
          >
            <Route
              path="/bienestar/gestion_administrativa"
              element={<SupervisionBienestarContainer />}
            />
          </Route>

          {/* BIENESTAR - Vista de notas */}
          <Route
            element={
              <ProtectedRoute
                allowedRoles={[
                  "administrativo",
                  "superadministrador",
                  "jefe_nivel",
                ]}
                requiredService="bienestar"
              />
            }
          >
            <Route path="/bienestar/vista-notas" element={<AdminNotesView />} />
          </Route>

          {/* ADMISIONES - Acceso para evaluaciones */}

          <Route
            element={
              <ProtectedRoute
                allowedRoles={[
                  "admin_bienestar",
                  "profesional_bienestar",
                  "docente_general",
                  "superadministrador",
                  "administrativo",
                ]}
                requiredService="admisiones"
              />
            }
          >
            <Route
              path="/admisiones/evaluacion/:id_evaluacion"
              element={<EvaluacionPage />}
            />

            <Route
              path="/admisiones/grupos-asignados"
              element={<GruposAsignadosPage />}
            />

            <Route
              path="/admisiones/gestionar-entrevistas"
              element={<ConfigEntrevistasPage />}
            />

            <Route path="/admisiones/buscador" element={<FiltersPage />} />
          </Route>

          {/* ADMISIONES Acceso a administradores */}
          <Route
            element={
              <ProtectedRoute
                allowedRoles={["superadministrador"]}
                requiredService="admisiones"
              />
            }
          >
            {/* Descomentar cuando implementes estas rutas */}
            {/* <Route path="/admisiones/crear-rubricas" element={<CrearRubricas />} />
            <Route path="/admisiones/gestionar-rubricas" element={<GestionarRubricas />} />
            <Route path="/admisiones/candidatos" element={<Candidatos />} /> */}
            <Route path="/admisiones/dashboard" element={<DashboardPage />} />
            <Route path="/admisiones/buscador" element={<FiltersPage />} />
            <Route
              path="/admisiones/crear-rubricas"
              element={<RubricasPage />}
            />
            <Route
              path="/admisiones/gestionar-rubricas"
              element={<ListaRubricasPage />}
            />
            <Route
              path="/admisiones/configuracion-cupos"
              element={<SetCupos />}
            />
            <Route
              path="/admisiones/:grado/:titulo_area/grupos"
              element={<GruposPage />}
            />
            <Route
              path="/admisiones/grupos-asignados"
              element={<GruposAsignadosPage />}
            />
            <Route
              path="/admisiones/configEntrevistas"
              element={<ConfigEntrevistasPage />}
            />
            <Route path="/admisiones/actas" element={<ActasPage />} />
          </Route>

          {/* ACADÉMICO - Futuras rutas */}
          <Route
            element={
              <ProtectedRoute
                allowedRoles={[
                  "profesor",
                  "coordinador_academico",
                  "superadministrador",
                ]}
                requiredService="academico"
              />
            }
          >
            {/* Descomentar cuando implementes estas rutas */}
            {/* <Route path="/academico/notas" element={<NotasAcademicas />} />
            <Route path="/academico/planificacion" element={<Planificacion />} /> */}
          </Route>

          {/* RECURSOS HUMANOS - Empleados */}
          <Route
            element={
              <ProtectedRoute
                allowedRoles={["empleado_mc", "superadministrador"]}
                requiredService="recursos_humanos"
              />
            }
          >
            <Route
              path="/recursos-humanos/portal"
              element={<EmployeePortalContainer />}
            />
            <Route
              path="/recursos-humanos/portal/asistencia"
              element={<AttendanceContainer />}
            />
            <Route
              path="/recursos-humanos/portal/solicitudes"
              element={<RequestsContainer />}
            />
            <Route
              path="/recursos-humanos/portal/solicitudes/nueva"
              element={<RequestsContainer />}
            />
            <Route
              path="/recursos-humanos/portal/documentos"
              element={<DocumentsContainer />}
            />
            <Route
              path="/recursos-humanos/portal/perfil"
              element={<ProfileContainer />}
            />
            <Route
              path="/recursos-humanos/portal/configuracion"
              element={<SettingsContainer />}
            />
          </Route>

          {/* FINANCIERO - Futuras rutas */}
          <Route
            element={
              <ProtectedRoute
                allowedRoles={["coordinador_financiero", "superadministrador"]}
                requiredService="financiero"
              />
            }
          >
            {/* Descomentar cuando implementes estas rutas */}
            {/* <Route path="/financiero/reportes" element={<ReportesFinancieros />} />
            <Route path="/financiero/presupuestos" element={<Presupuestos />} /> */}
          </Route>

          {/* Rutas para Director de Grupo - Sin servicio específico requerido */}
          <Route
            element={
              <ProtectedRoute allowedRoles={["director_grupo", "jefe_nivel"]} />
            }
          >
            <Route path="/directorgrupo" element={<DirectorGrupoDashboard />} />
          </Route>

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
          </Route>
        </Route>

        {/* Ruta para redirigir cualquier ruta no existente al Home */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>

      <ToastContainer />
    </div>
  );
};

export default AppRoutes;
