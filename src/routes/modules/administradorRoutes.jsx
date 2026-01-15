import React from "react";
import { Route } from "react-router-dom";
import ProtectedRoute from "../../components/ProtectedRoute";
import CreatePersonalPage from "../../pages/superAdmin/CreatePersonalPage";
import PermissionsPage from "../../pages/superAdmin/PermissionsPage";
import SequenceAdminPanel from "../../features/Superadmin/SequenceAdminPanel";
import ProfesionalesContainer from "../../features/Superadmin/ProfesionalesManagement/container/ProfesionalesContainer";

const AdministradorRoutes = () => {
  return (
    <>
      {/* ADMINISTRADOR - Solo superadministrador */}
      <Route
        element={<ProtectedRoute allowedRoles={["superadministrador"]} />}
      >
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
    </>
  );
};

export default AdministradorRoutes;