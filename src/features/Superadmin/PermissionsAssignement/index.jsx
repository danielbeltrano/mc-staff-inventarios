import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import PermissionsManagement from './components/PermissionsManagement';
import PermissionsInfo from '../../../components/PermissionsInfo';
import usePermissions from '../../../hooks/usePermissions';
import useAdminPermissionsStats from '../../../hooks/useAdminPermissionsStats';
import { 
  Shield, 
  Users, 
  Settings, 
  RefreshCw, 
  UserCheck, 
  UserX, 
  AlertTriangle,
  TrendingUp,
  Activity
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import useScreenSize from '../../../hooks/useScreenSize';

const PermissionsAssignment = () => {
  const screenSize = useScreenSize();
  const isMobile = screenSize.width <= 768;
  const { user, role } = useSelector((state) => state.auth);
  const { permissions, accessibleServices } = usePermissions();
  
  // Hook específico para estadísticas administrativas mejoradas
  const { 
    totalUsers,
    activeUsers,
    inactiveUsers,
    usersWithPermissions,
    usersWithoutPermissions,
    totalServices, 
    serviceUsage,
    usersByRole,
    inactiveUsersByRole,
    usersByHierarchy,
    loading: statsLoading,
    error: statsError,
    refresh: refreshStats,
    lastUpdated
  } = useAdminPermissionsStats();

  console.log("📊 Enhanced Admin stats:", { 
    totalUsers,
    activeUsers,
    inactiveUsers,
    usersWithPermissions,
    usersWithoutPermissions,
    totalServices, 
    serviceUsage,
    usersByRole,
    inactiveUsersByRole
  });

  // Solo superadministradores pueden acceder a esta página
  if (role !== 'superadministrador') {
    return <Navigate to="/unauthorized" replace />;
  }

  const LoadingCard = () => (
    <div className="animate-pulse bg-gray-200 h-20 w-full rounded"></div>
  );

  return (
    <div className={`min-h-screen bg-white ${isMobile ? "px-2" : ""}`}>
      <div className="mx-auto py-6 px-2 sm:px-6 lg:px-8">
        {/* Header */}
        <div className={`mb-8 ${isMobile ? "pt-14" : ""}`}>
          <div className={`flex mb-4 ${isMobile ? "flex-col gap-4" : "items-center justify-between"}`}>
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-amber-default" />
              <h1 className="text-3xl font-bold text-blue-default">
                Administración de Usuarios y Permisos
              </h1>
            </div>
            
            {/* Botón de refrescar estadísticas */}
            <Button
              onClick={refreshStats}
              disabled={statsLoading}
              className={`flex items-center gap-2 px-4 py-2 rounded-md disabled:opacity-50`}
            >
              <RefreshCw className={`h-4 w-4 ${statsLoading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>
          <p className="text-gray-600">
            Gestiona el estado de los usuarios y sus permisos de acceso a servicios del sistema
          </p>
          
          {/* Mostrar última actualización */}
          {lastUpdated && (
            <p className="text-xs text-gray-500 mt-1">
              Última actualización: {new Date(lastUpdated).toLocaleString('es-ES')}
            </p>
          )}
        </div>

        {/* Error en estadísticas */}
        {statsError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <p className="text-red-700">Error cargando estadísticas: {statsError}</p>
            </div>
          </div>
        )}

        {/* Estadísticas principales mejoradas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total de usuarios */}
          <div className="bg-white overflow-hidden shadow rounded-lg border-l-4 border-l-blue-default">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-8 w-8 text-blue-default" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Usuarios
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {statsLoading ? <LoadingCard /> : totalUsers}
                    </dd>
                    {!statsLoading && (
                      <dd className="text-xs text-gray-500">
                        {activeUsers} activos • {inactiveUsers} inactivos
                      </dd>
                    )}
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Usuarios activos */}
          <div className="bg-white overflow-hidden shadow rounded-lg border-l-4 border-l-green-500">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UserCheck className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Usuarios Activos
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {statsLoading ? <LoadingCard /> : activeUsers}
                    </dd>
                    {!statsLoading && totalUsers > 0 && (
                      <dd className="text-xs text-green-600">
                        {((activeUsers / totalUsers) * 100).toFixed(1)}% del total
                      </dd>
                    )}
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Usuarios con permisos */}
          <div className="bg-white overflow-hidden shadow rounded-lg border-l-4 border-l-sky-500">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Shield className="h-8 w-8 text-sky-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Con Permisos Activos
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {statsLoading ? <LoadingCard /> : usersWithPermissions}
                    </dd>
                    {!statsLoading && activeUsers > 0 && (
                      <dd className="text-xs text-sky-600">
                        {((usersWithPermissions / activeUsers) * 100).toFixed(1)}% de activos
                      </dd>
                    )}
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Usuarios inactivos */}
          <div className="bg-white overflow-hidden shadow rounded-lg border-l-4 border-l-red-500">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UserX className="h-8 w-8 text-red-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Usuarios Inactivos
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {statsLoading ? <LoadingCard /> : inactiveUsers}
                    </dd>
                    {!statsLoading && totalUsers > 0 && (
                      <dd className="text-xs text-red-600">
                        {((inactiveUsers / totalUsers) * 100).toFixed(1)}% del total
                      </dd>
                    )}
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Estadísticas detalladas */}
        {!statsLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Distribución por roles (activos) */}
            <div className="bg-white shadow rounded-lg p-6 border-l-4 border-l-blue-default">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="h-5 w-5 text-blue-default" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Usuarios Activos por Rol
                </h3>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {Object.entries(usersByRole).length > 0 ? (
                  Object.entries(usersByRole)
                    .sort(([,a], [,b]) => b - a)
                    .map(([role, count]) => (
                      <div key={role} className="flex justify-between items-center py-1">
                        <span className="text-sm text-gray-600 truncate">{role}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">{count}</span>
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-default h-2 rounded-full" 
                              style={{ 
                                width: `${Math.max(10, (count / activeUsers) * 100)}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))
                ) : (
                  <p className="text-sm text-gray-500">No hay datos disponibles</p>
                )}
              </div>
            </div>

            {/* Usuarios inactivos por rol */}
            <div className="bg-white shadow rounded-lg p-6 border-l-4 border-l-red-400">
              <div className="flex items-center gap-2 mb-4">
                <UserX className="h-5 w-5 text-red-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Usuarios Inactivos por Rol
                </h3>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {Object.entries(inactiveUsersByRole).length > 0 ? (
                  Object.entries(inactiveUsersByRole)
                    .sort(([,a], [,b]) => b - a)
                    .map(([role, count]) => (
                      <div key={role} className="flex justify-between items-center py-1">
                        <span className="text-sm text-gray-600 truncate">{role}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">{count}</span>
                          {inactiveUsers > 0 && (
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-red-500 h-2 rounded-full" 
                                style={{ 
                                  width: `${Math.max(10, (count / inactiveUsers) * 100)}%` 
                                }}
                              ></div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="flex items-center justify-center h-20">
                    <div className="text-center">
                      <UserCheck className="h-8 w-8 text-green-500 mx-auto mb-2" />
                      <p className="text-sm text-green-600">¡Todos los usuarios están activos!</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Uso de servicios */}
            <div className="bg-white shadow rounded-lg p-6 border-l-4 border-l-amber-default">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-amber-default" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Uso de Servicios
                </h3>
              </div>
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {Object.entries(serviceUsage).length > 0 ? (
                  Object.entries(serviceUsage)
                    .sort(([,a], [,b]) => b.count - a.count)
                    .map(([serviceKey, data]) => (
                      <div key={serviceKey} className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 truncate">{data.name}</span>
                          <div className="text-right">
                            <span className="text-sm font-medium text-gray-900">
                              {data.count}
                            </span>
                            <div className="text-xs text-gray-500">
                              {data.percentage}%
                            </div>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-amber-default h-2 rounded-full" 
                            style={{ width: `${Math.max(5, data.percentage)}%` }}
                          ></div>
                        </div>
                      </div>
                    ))
                ) : (
                  <p className="text-sm text-gray-500">No hay datos de servicios disponibles</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Alerta de usuarios sin permisos */}
        {!statsLoading && usersWithoutPermissions > 0 && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-yellow-800 font-medium">
                  Usuarios activos sin permisos asignados
                </p>
                <p className="text-yellow-700 text-sm">
                  Hay {usersWithoutPermissions} usuarios activos que no tienen permisos asignados a ningún servicio.
                  Considera revisar y asignar los permisos necesarios.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tu información de permisos */}
        <div className="mb-8 border border-amber-default p-4 rounded-md">
          <h2 className="text-lg font-semibold text-blue-default mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-amber-default" />
            Tus Permisos Actuales
          </h2>
          <PermissionsInfo showDetailed={false} />
        </div>

        {/* Gestión de permisos */}
        <PermissionsManagement />
        
        {/* Toast Container */}
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
          toastStyle={{
            fontSize: '14px',
            fontFamily: 'inherit'
          }}
        />
      </div>
    </div>
  );
};

export default PermissionsAssignment;