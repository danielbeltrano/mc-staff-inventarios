import React from "react";
import { Route } from "react-router-dom";
import { useSelector } from "react-redux";
import ProtectedRoute from "../../components/ProtectedRoute";
import Bienestar from "../../features/bienestar";
import CasesSection from "../../features/bienestar/cases";
import RemisionManagementPage from "../../pages/bienestar/RemisionManagementPage";
import BienestarDashboard from "../../features/bienestar/dashboard";
import AdminNotesView from "../../features/bienestar/componentsDeprecated/notesView";
import CaseDetailContainer from "../../features/bienestar/cases/containers/CaseDetailContainer";
import CreateRemissionPage from "../../features/bienestar/remissions";
import CreateGroups from "../../pages/bienestar/groups/CreateGroups";
import AdminGroupsContainer from "../../features/bienestar/groups/containers/AdminGroupsContainer";
import GroupDetailView from "../../features/bienestar/groups/components/groupsComponents/GroupDetailView";
import SupervisionBienestarContainer from "../../features/bienestar/admin/container/SupervisionBienestarContainer";

const BienestarRoutes = () => {
  const { user } = useSelector((state) => state.auth);

  return (
    <>
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
        <Route path="/bienestar/dashboard" element={<BienestarDashboard />} />
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

      {/* BIENESTAR - Gestión Administrativa */}
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
    </>
  );
};

export default BienestarRoutes;