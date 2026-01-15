import React from "react";
import { Route } from "react-router-dom";
import ProtectedRoute from "../../components/ProtectedRoute";
import EmployeePortalContainer from "../../features/recursosHumanos/portalEmpleado/containers/EmployeePortalContainer";
import AttendanceContainer from "../../features/recursosHumanos/portalEmpleado/containers/AttendanceContainer";
import RequestsContainer from "../../features/recursosHumanos/portalEmpleado/containers/RequestsContainer";
import DocumentsContainer from "../../features/recursosHumanos/portalEmpleado/containers/DocumentsContainer";
import ProfileContainer from "../../features/recursosHumanos/portalEmpleado/containers/ProfileContainer";
import SettingsContainer from "../../features/recursosHumanos/portalEmpleado/containers/SettingsContainer";

const RecursosHumanosRoutes = () => {
  return (
    <>
      {/* RECURSOS HUMANOS - Portal Empleados */}
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
    </>
  );
};

export default RecursosHumanosRoutes;