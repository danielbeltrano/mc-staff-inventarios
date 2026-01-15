import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchUserPermissions } from '../../redux/slices/permissionsSlice';

const DebugPermissions = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const permissions = useSelector((state) => state.permissions);

  useEffect(() => {
    console.log('🔍 Debug - Auth state:', { user });
    console.log('🔍 Debug - Permissions state:', permissions);
    
    if (user?.uuid) {
      console.log('🚀 Dispatching fetchUserPermissions for UUID:', user.uuid);
      dispatch(fetchUserPermissions(user.uuid));
    } else {
      console.warn('⚠️ No user UUID available for permissions fetch');
    }
  }, [user, dispatch]);

  useEffect(() => {
    console.log('🔄 Permissions state updated:', permissions);
  }, [permissions]);

  return (
    <div className=" top-4 right-4 bg-white border border-gray-300 rounded-lg p-4 shadow-lg z-50 max-w-md">
      <h3 className="text-lg font-bold mb-2">Debug Permisos</h3>
      
      <div className="space-y-2 text-sm">
        <div>
          <strong>Usuario UUID:</strong> {user?.uuid || 'No disponible'}
        </div>
        <div>
          <strong>Estado Auth:</strong> {user ? 'Autenticado' : 'No autenticado'}
        </div>
        <div>
          <strong>Estado Permisos:</strong> {permissions.status}
        </div>
        <div>
          <strong>Error:</strong> {permissions.error || 'Ninguno'}
        </div>
        <div>
          <strong>Tiene Permisos:</strong> {permissions.permissions.hasPermissions ? 'Sí' : 'No'}
        </div>
        <div>
          <strong>Servicios:</strong> {Object.keys(permissions.permissions.permissions || {}).length}
        </div>
      </div>

      <button
        onClick={() => {
          if (user?.uuid) {
            console.log('🔄 Manual refresh of permissions');
            dispatch(fetchUserPermissions(user.uuid));
          }
        }}
        className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-xs"
      >
        Refrescar Permisos
      </button>
    </div>
  );
};

export default DebugPermissions;