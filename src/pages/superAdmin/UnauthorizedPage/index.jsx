// src/pages/superAdmin/UserManagementPage.js
import React from 'react';
import Unauthorized from '../../../features/Superadmin/PersonalCreation/components/Unauthorized';

const UnauthorizedPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Unauthorized />
      </div>
    </div>
  );
};

export default UnauthorizedPage;