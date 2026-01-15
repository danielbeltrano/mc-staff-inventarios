import React from "react";
import { Route } from "react-router-dom";
import ProtectedRoute from "../../components/ProtectedRoute";
import RubricasPage from "../../pages/admisiones/RubricasPage";
import ListaRubricasPage from "../../pages/admisiones/ListaRubricasPage";
import GruposPage from "../../pages/admisiones/GruposPage";
import EvaluacionPage from "../../pages/admisiones/EvaluacionPage";
import GruposAsignadosPage from "../../pages/admisiones/GruposAsignadosPage";
import ConfigEntrevistasPage from "../../pages/admisiones/ConfigEntrevistasPage";
import ActasPage from "../../pages/admisiones/ActasPage";
import DashboardPage from "../../pages/admisiones/DashboardPage";
import FiltersPage from "../../pages/admisiones/FilterPage";
import SetCupos from "../../pages/admisiones/SetCupos";

const AdmisionesRoutes = () => {
  return (
    <>
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

      {/* ADMISIONES - Acceso a administradores */}
      <Route
        element={
          <ProtectedRoute
            allowedRoles={["superadministrador"]}
            requiredService="admisiones"
          />
        }
      >
        <Route path="/admisiones/dashboard" element={<DashboardPage />} />
        <Route path="/admisiones/buscador" element={<FiltersPage />} />
        <Route path="/admisiones/crear-rubricas" element={<RubricasPage />} />
        <Route
          path="/admisiones/gestionar-rubricas"
          element={<ListaRubricasPage />}
        />
        <Route path="/admisiones/configuracion-cupos" element={<SetCupos />} />
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
    </>
  );
};

export default AdmisionesRoutes;