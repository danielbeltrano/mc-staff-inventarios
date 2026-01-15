import React from "react";
import { Route } from "react-router-dom";
import ProtectedRoute from "../../components/ProtectedRoute";

const AcademicoRoutes = () => {
  return (
    <>
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
        {/* TODO: Descomentar cuando implementes estas rutas */}
        {/* <Route path="/academico/notas" element={<NotasAcademicas />} /> */}
        {/* <Route path="/academico/planificacion" element={<Planificacion />} /> */}
      </Route>
    </>
  );
};

export default AcademicoRoutes;