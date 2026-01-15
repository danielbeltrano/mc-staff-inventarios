import React from "react";
import { Route, Navigate } from "react-router-dom";
import ProtectedRoute from "../../components/ProtectedRoute";
import MatriculasPage from "../../pages/matriculas";
import CierreMatriculasPage from "../../pages/matriculas/CierreMatriculasPage";
import ConfigAtencionVirtualPage from "../../pages/matriculas/ConfigAtencionVirtualPage";
import VistaProfesorPage from "../../pages/matriculas/VistaProfesorPage";

const MatriculasRoutes = () => {
  return (
    <>
      {/* MATRÍCULAS - Superadmin, Director de Grupo y Contabilidad */}
      <Route
        element={
          <ProtectedRoute
            allowedRoles={[
              "director_grupo",
              "superadministrador",
              "contabilidad",
            ]}
            requiredService="matriculas"
          />
        }
      >
        {/* Rutas del módulo de matrículas con sub-navegación */}
        <Route path="/matriculas/" element={<MatriculasPage />}>
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

      {/* MATRÍCULAS - Docentes */}
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
    </>
  );
};

export default MatriculasRoutes;