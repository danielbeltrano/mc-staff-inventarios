// src/pages/superAdmin/UserManagementPage.js
import React from 'react';
import PermissionsAssignement from '../../../features/Superadmin/PermissionsAssignement';

const PermissionsPage = () => {
  return (
    <div className="min-h-screen">
      <div className="mx-auto ">
        <PermissionsAssignement />
      </div>
    </div>
  );
};

export default PermissionsPage;