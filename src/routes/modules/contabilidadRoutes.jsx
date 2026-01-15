import React from "react";
import { Route } from "react-router-dom";
import ProtectedRoute from "../../components/ProtectedRoute";

const ContabilidadRoutes = () => {
  return (
    <>
      {/* CONTABILIDAD - Futuras rutas */}
      <Route
        element={
          <ProtectedRoute
            allowedRoles={["coordinador_contabilidad", "superadministrador"]}
            requiredService="contabilidad"
          />
        }
      >
        {/* TODO: Descomentar cuando implementes estas rutas */}
        {/* <Route path="/contabilidad/reportes" element={<ReportesContables />} /> */}
        {/* <Route path="/contabilidad/presupuestos" element={<Presupuestos />} /> */}
        {/* <Route path="/contabilidad/facturacion" element={<Facturacion />} /> */}
        {/* <Route path="/contabilidad/cuentas-por-pagar" element={<CuentasPorPagar />} /> */}
        {/* <Route path="/contabilidad/cuentas-por-cobrar" element={<CuentasPorCobrar />} /> */}
      </Route>
    </>
  );
};

export default ContabilidadRoutes;