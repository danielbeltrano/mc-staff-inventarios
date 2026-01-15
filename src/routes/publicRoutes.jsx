import React from "react";
import { Route } from "react-router-dom";
import Home from "../pages/home";
import UnauthorizedPage from "../pages/superAdmin/UnauthorizedPage";
import RobustPasswordReset from "../pages/auth/robustPasswordReset";

const PublicRoutes = () => {
  return (
    <React.Fragment>
      <Route path="/" element={<Home />} />
      <Route path="/password-reset" element={<RobustPasswordReset />} />
      <Route path="/password-reset-confirmation" element={<RobustPasswordReset />} />
      <Route path="/forgot-password" element={<RobustPasswordReset />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
    </React.Fragment>
  );
};

export default PublicRoutes;