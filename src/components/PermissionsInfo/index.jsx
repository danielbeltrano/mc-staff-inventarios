import React from 'react';
import { useSelector } from 'react-redux';
import { Shield, CheckCircle, XCircle, AlertTriangle, User, Clock } from 'lucide-react';

const PermissionsInfo = ({ showDetailed = false, className = "" }) => {
  const { permissions, status } = useSelector((state) => state.permissions);
  const { user, role } = useSelector((state) => state.auth);

  // console.log("permissions from permissionsInfo", permissions);
  if (status === 'loading') {
    return (
      <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-500 animate-pulse" />
          <span className="text-blue-700">Cargando permisos...</span>
        </div>
      </div>
    );
  }

  if (status === 'failed' || !permissions.hasPermissions) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-2">
          <XCircle className="h-5 w-5 text-red-500" />
          <span className="text-red-700">Sin permisos asignados</span>
        </div>
      </div>
    );
  }

  const getPermissionIcon = (permission) => {
    if (permission.canAccess) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    } else if (permission.hasPermission && !permission.hasHierarchy) {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    } else {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getPermissionStatus = (permission) => {
    if (permission.canAccess) {
      return "Acceso completo";
    } else if (permission.hasPermission && !permission.hasHierarchy) {
      return "Permiso otorgado, jerarquía insuficiente";
    } else if (!permission.hasPermission && permission.hasHierarchy) {
      return "Jerarquía suficiente, sin permiso específico";
    } else {
      return "Sin acceso";
    }
  };

  if (!showDetailed) {
    const accessibleServices = Object.entries(permissions.permissions)
      .filter(([_, permission]) => permission.canAccess)
      .length;

    return (
      <div className={`bg-green-50 border border-green-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-2">
          <span className="text-green-700">
            Acceso a {accessibleServices} servicio{accessibleServices !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
      {/* Header con información del usuario */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <User className="h-6 w-6 text-blue-500" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {permissions.userInfo?.nombre || 'Usuario'}
            </h3>
            <p className="text-sm text-gray-600">
              {permissions.userInfo?.correo}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Rol:</span>
            <span className="ml-2 text-gray-600">
              {permissions.userInfo?.rolInfo?.descripcion || role}
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Nivel Jerárquico:</span>
            <span className="ml-2 text-gray-600 capitalize">
              {permissions.hierarchyLevel}
            </span>
          </div>
        </div>
      </div>

      {/* Lista de permisos por servicio */}
      <div className="mb-6">
        <h4 className="text-md font-semibold text-gray-900 mb-3">
          Permisos por Servicio
        </h4>
        <div className="space-y-3">
          {Object.entries(permissions.permissions).map(([serviceKey, permission]) => (
            <div 
              key={serviceKey}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                permission.canAccess 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center gap-3">
                {getPermissionIcon(permission)}
                <div>
                  <span className="font-medium text-gray-900">
                    {permission.serviceName}
                  </span>
                  <p className="text-xs text-gray-600">
                    {getPermissionStatus(permission)}
                  </p>
                </div>
              </div>
              
              <div className="text-right text-xs text-gray-500">
                <div>Requiere: {permission.requiredLevel}</div>
                {permission.hasPermission && (
                  <div className="text-green-600">✓ Permiso otorgado</div>
                )}
                {permission.hasHierarchy && (
                  <div className="text-blue-600">✓ Jerarquía suficiente</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Información de auditoría */}
      {permissions.auditInfo && (
        <div className="border-t pt-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">
            Información de Auditoría
          </h4>
          <div className="space-y-1 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3" />
              <span>
                Permisos otorgados: {new Date(permissions.auditInfo.otorgadoEn).toLocaleDateString('es-ES')}
              </span>
            </div>
            {permissions.auditInfo.notas && (
              <div>
                <span className="font-medium">Notas:</span> {permissions.auditInfo.notas}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PermissionsInfo;