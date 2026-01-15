// import React, { useState, useEffect } from 'react';
// import { useSelector } from 'react-redux';
// import { selectAuth } from '../../redux/slices/authSlice';
// import { 
//   fetchAvailableServices, 
//   fetchUserAccess, 
//   updateUserAccess,
//   getUserAuditHistory 
// } from '../../core/utils/authUtils';
// import { supabaseStucenClient } from '../../core/config/supabase/supabaseCampusStudentClient';
// import { 
//   User, 
//   Settings, 
//   Save, 
//   History, 
//   Shield, 
//   AlertTriangle,
//   Search,
//   Eye,
//   EyeOff,
//   CheckCircle,
//   XCircle
// } from 'lucide-react';
// import { toast } from 'react-toastify';

// const UserAccessManager = () => {
//   const { personalData } = useSelector(selectAuth);
//   const [users, setUsers] = useState([]);
//   const [filteredUsers, setFilteredUsers] = useState([]);
//   const [services, setServices] = useState([]);
//   const [selectedUser, setSelectedUser] = useState(null);
//   const [userAccess, setUserAccess] = useState({});
//   const [originalAccess, setOriginalAccess] = useState({});
//   const [auditHistory, setAuditHistory] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [saving, setSaving] = useState(false);
//   const [showAudit, setShowAudit] = useState(false);
//   const [accessReason, setAccessReason] = useState('');
//   const [searchTerm, setSearchTerm] = useState('');
//   const [hasChanges, setHasChanges] = useState(false);

//   useEffect(() => {
//     loadInitialData();
//   }, []);

//   useEffect(() => {
//     // Filtrar usuarios basado en el término de búsqueda
//     const filtered = users.filter(user => {
//       const fullName = `${user.primer_nombre} ${user.segundo_nombre || ''} ${user.primer_apellido} ${user.segundo_apellido || ''}`.toLowerCase();
//       const email = user.correo_institucional.toLowerCase();
//       const role = (user.roles?.descripcion || user.rol || '').toLowerCase();
      
//       return fullName.includes(searchTerm.toLowerCase()) ||
//              email.includes(searchTerm.toLowerCase()) ||
//              role.includes(searchTerm.toLowerCase());
//     });
    
//     setFilteredUsers(filtered);
//   }, [users, searchTerm]);

//   useEffect(() => {
//     // Verificar si hay cambios
//     const accessChanged = JSON.stringify(userAccess) !== JSON.stringify(originalAccess);
//     setHasChanges(accessChanged);
//   }, [userAccess, originalAccess]);

//   const loadInitialData = async () => {
//     setLoading(true);
//     try {
//       await Promise.all([
//         loadUsers(),
//         loadServices()
//       ]);
//     } catch (error) {
//       console.error('Error loading initial data:', error);
//       toast.error('Error cargando datos iniciales');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const loadUsers = async () => {
//     try {
//       const { data, error } = await supabaseStucenClient
//         .from('personal_mc')
//         .select(`
//           id,
//           uuid,
//           correo_institucional,
//           primer_nombre,
//           segundo_nombre,
//           primer_apellido,
//           segundo_apellido,
//           rol,
//           estado,
//           last_login,
//           roles:rol(nombre, descripcion, nivel_jerarquico)
//         `)
//         .neq('estado', 'inactivo')
//         .order('primer_apellido');

//       if (error) throw error;
//       setUsers(data || []);
//     } catch (error) {
//       console.error('Error loading users:', error);
//       toast.error('Error cargando usuarios');
//     }
//   };

//   const loadServices = async () => {
//     try {
//       const servicesData = await fetchAvailableServices();
//       setServices(servicesData);
//     } catch (error) {
//       console.error('Error loading services:', error);
//       toast.error('Error cargando servicios');
//     }
//   };

//   const loadUserAccess = async (userUuid) => {
//     try {
//       const accessData = await fetchUserAccess(userUuid);
//       const cleanAccess = accessData || {};
      
//       // Limpiar campos no necesarios
//       delete cleanAccess.id;
//       delete cleanAccess.usuario_uuid;
//       delete cleanAccess.otorgado_por;
//       delete cleanAccess.otorgado_en;
//       delete cleanAccess.updated_at;
//       delete cleanAccess.activo;
//       delete cleanAccess.notas;

//       setUserAccess(cleanAccess);
//       setOriginalAccess(cleanAccess);
//     } catch (error) {
//       console.error('Error loading user access:', error);
//       toast.error('Error cargando accesos del usuario');
//     }
//   };

//   const loadAuditHistory = async (userUuid) => {
//     try {
//       const history = await getUserAuditHistory(userUuid, 20);
//       setAuditHistory(history);
//     } catch (error) {
//       console.error('Error loading audit history:', error);
//       toast.error('Error cargando historial de auditoría');
//     }
//   };

//   const handleUserSelect = async (user) => {
//     if (hasChanges) {
//       const confirmDiscard = window.confirm(
//         'Tienes cambios sin guardar. ¿Estás seguro de que quieres cambiar de usuario sin guardar?'
//       );
//       if (!confirmDiscard) return;
//     }

//     setSelectedUser(user);
//     setShowAudit(false);
//     setAccessReason('');
//     setHasChanges(false);
    
//     if (user.uuid) {
//       await loadUserAccess(user.uuid);
//     }
//   };

//   const handleAccessChange = (serviceName, hasAccess) => {
//     setUserAccess(prev => ({
//       ...prev,
//       [serviceName]: hasAccess
//     }));
//   };

//   const handleSaveAccess = async () => {
//     if (!selectedUser || !selectedUser.uuid) {
//       toast.error('No hay usuario seleccionado');
//       return;
//     }

//     if (!accessReason.trim()) {
//       toast.error('Debe proporcionar una razón para el cambio');
//       return;
//     }

//     setSaving(true);
//     try {
//       const success = await updateUserAccess(
//         selectedUser.uuid,
//         userAccess,
//         personalData.uuid,
//         accessReason.trim()
//       );

//       if (success) {
//         toast.success('Accesos actualizados correctamente');
//         setAccessReason('');
//         setHasChanges(false);
//         // Recargar datos del usuario
//         await loadUserAccess(selectedUser.uuid);
//       } else {
//         toast.error('Error actualizando accesos');
//       }
//     } catch (error) {
//       console.error('Error saving access:', error);
//       toast.error('Error guardando cambios');
//     } finally {
//       setSaving(false);
//     }
//   };

//   const handleDiscardChanges = () => {
//     setUserAccess(originalAccess);
//     setAccessReason('');
//     setHasChanges(false);
//   };

//   const handleShowAudit = async () => {
//     if (!selectedUser?.uuid) return;
    
//     setShowAudit(true);
//     await loadAuditHistory(selectedUser.uuid);
//   };

//   const getServiceIcon = (serviceName) => {
//     const icons = {
//       bienestar: '👥',
//       admisiones: '📝',
//       matriculas: '📋',
//       academico: '📚',
//       recursos_humanos: '💼',
//       financiero: '💰'
//     };
//     return icons[serviceName] || '⚙️';
//   };

//   const formatDate = (dateString) => {
//     return new Date(dateString).toLocaleString('es-CO', {
//       year: 'numeric',
//       month: '2-digit',
//       day: '2-digit',
//       hour: '2-digit',
//       minute: '2-digit'
//     });
//   };

//   const getActionColor = (action) => {
//     const colors = {
//       CREATE: 'text-green-600',
//       UPDATE: 'text-blue-600',
//       DEACTIVATE: 'text-red-600',
//       REACTIVATE: 'text-emerald-600'
//     };
//     return colors[action] || 'text-gray-600';
//   };

//   const getActionIcon = (action) => {
//     const icons = {
//       CREATE: CheckCircle,
//       UPDATE: Settings,
//       DEACTIVATE: XCircle,
//       REACTIVATE: CheckCircle
//     };
//     const Icon = icons[action] || Settings;
//     return <Icon className="h-4 w-4" />;
//   };

//   const getHierarchyColor = (level) => {
//     const colors = {
//       estrategico: 'text-purple-600 bg-purple-50',
//       tactico: 'text-blue-600 bg-blue-50',
//       operativo: 'text-green-600 bg-green-50'
//     };
//     return colors[level] || 'text-gray-600 bg-gray-50';
//   };

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center h-64">
//         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
//         <span className="ml-2">Cargando datos del sistema...</span>
//       </div>
//     );
//   }

//   return (
//     <div className="bg-white rounded-lg shadow-md p-6">
//       <div className="flex items-center gap-3 mb-6">
//         <Shield className="h-6 w-6 text-blue-600" />
//         <h2 className="text-xl font-semibold text-gray-800">
//           Gestión de Accesos de Usuarios
//         </h2>
//         {personalData?.rol === 'superadministrador' && (
//           <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
//             Superadministrador
//           </span>
//         )}
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//         {/* Lista de Usuarios */}
//         <div className="lg:col-span-1">
//           <div className="flex items-center justify-between mb-4">
//             <h3 className="text-lg font-medium flex items-center gap-2">
//               <User className="h-5 w-5" />
//               Usuarios ({filteredUsers.length})
//             </h3>
//           </div>

//           {/* Buscador */}
//           <div className="relative mb-4">
//             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
//             <input
//               type="text"
//               placeholder="Buscar por nombre, email o rol..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//             />
//           </div>
          
//           <div className="space-y-2 max-h-96 overflow-y-auto border rounded-md p-2">
//             {filteredUsers.length > 0 ? (
//               filteredUsers.map((user) => (
//                 <div
//                   key={user.id}
//                   onClick={() => handleUserSelect(user)}
//                   className={`p-3 rounded-md cursor-pointer transition-colors ${
//                     selectedUser?.id === user.id
//                       ? 'bg-blue-50 border-blue-200 border'
//                       : 'hover:bg-gray-50 border border-transparent'
//                   }`}
//                 >
//                   <div className="font-medium text-sm">
//                     {user.primer_nombre} {user.primer_apellido}
//                   </div>
//                   <div className="text-xs text-gray-500 truncate">{user.correo_institucional}</div>
//                   <div className={`text-xs mt-1 px-2 py-1 rounded-full inline-block ${getHierarchyColor(user.roles?.nivel_jerarquico)}`}>
//                     {user.roles?.descripcion || user.rol}
//                   </div>
//                   {user.last_login && (
//                     <div className="text-xs text-gray-400 mt-1">
//                       Último login: {formatDate(user.last_login)}
//                     </div>
//                   )}
//                 </div>
//               ))
//             ) : (
//               <div className="text-center text-gray-500 py-8">
//                 No se encontraron usuarios
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Panel de Accesos */}
//         <div className="lg:col-span-2">
//           {selectedUser ? (
//             <div>
//               <div className="flex items-center justify-between mb-4">
//                 <h3 className="text-lg font-medium flex items-center gap-2">
//                   <Settings className="h-5 w-5" />
//                   Accesos para {selectedUser.primer_nombre} {selectedUser.primer_apellido}
//                 </h3>
//                 <div className="flex gap-2">
//                   <button
//                     onClick={handleShowAudit}
//                     className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
//                   >
//                     <History className="h-4 w-4" />
//                     Historial
//                   </button>
//                   {showAudit && (
//                     <button
//                       onClick={() => setShowAudit(false)}
//                       className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md transition-colors"
//                     >
//                       <EyeOff className="h-4 w-4" />
//                       Ocultar
//                     </button>
//                   )}
//                 </div>
//               </div>

//               {!showAudit ? (
//                 <div className="space-y-6">
//                   {/* Información del Usuario */}
//                   <div className="bg-gray-50 p-4 rounded-md">
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
//                       <div>
//                         <span className="font-medium">Email:</span> 
//                         <span className="ml-1">{selectedUser.correo_institucional}</span>
//                       </div>
//                       <div>
//                         <span className="font-medium">Rol:</span> 
//                         <span className="ml-1">{selectedUser.roles?.descripcion || selectedUser.rol}</span>
//                       </div>
//                       <div>
//                         <span className="font-medium">Nivel Jerárquico:</span> 
//                         <span className={`ml-1 px-2 py-1 rounded text-xs ${getHierarchyColor(selectedUser.roles?.nivel_jerarquico)}`}>
//                           {selectedUser.roles?.nivel_jerarquico || 'No definido'}
//                         </span>
//                       </div>
//                       <div>
//                         <span className="font-medium">Estado:</span> 
//                         <span className={`ml-1 ${selectedUser.estado === 'activo' ? 'text-green-600' : 'text-red-600'}`}>
//                           {selectedUser.estado}
//                         </span>
//                       </div>
//                     </div>
//                   </div>

//                   {/* Alerta de cambios */}
//                   {hasChanges && (
//                     <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
//                       <div className="flex items-center gap-2">
//                         <AlertTriangle className="h-5 w-5 text-amber-600" />
//                         <span className="text-amber-800 font-medium">
//                           Tienes cambios sin guardar
//                         </span>
//                       </div>
//                     </div>
//                   )}

//                   {/* Servicios */}
//                   <div>
//                     <h4 className="font-medium mb-3">Acceso a Servicios</h4>
//                     <div className="grid grid-cols-1 gap-4">
//                       {services.map((service) => {
//                         const hasAccess = userAccess[service.clave_servicio] || false;
//                         const hasChanged = hasAccess !== (originalAccess[service.clave_servicio] || false);
                        
//                         return (
//                           <div 
//                             key={service.id} 
//                             className={`border rounded-md p-4 transition-colors ${
//                               hasChanged ? 'border-blue-300 bg-blue-50' : ''
//                             }`}
//                           >
//                             <div className="flex items-center justify-between">
//                               <div className="flex items-center gap-3 flex-1">
//                                 <span className="text-2xl">{getServiceIcon(service.clave_servicio)}</span>
//                                 <div className="flex-1">
//                                   <div className="font-medium flex items-center gap-2">
//                                     {service.nombre_servicio}
//                                     {hasChanged && (
//                                       <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
//                                         Modificado
//                                       </span>
//                                     )}
//                                   </div>
//                                   <div className="text-sm text-gray-500">{service.descripcion}</div>
//                                   <div className="text-xs text-blue-600 mt-1">
//                                     Nivel mínimo requerido: {service.nivel_minimo_requerido}
//                                   </div>
//                                 </div>
//                               </div>
//                               <label className="relative inline-flex items-center cursor-pointer">
//                                 <input
//                                   type="checkbox"
//                                   checked={hasAccess}
//                                   onChange={(e) => handleAccessChange(service.clave_servicio, e.target.checked)}
//                                   className="sr-only peer"
//                                 />
//                                 <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
//                               </label>
//                             </div>
//                           </div>
//                         );
//                       })}
//                     </div>
//                   </div>

//                   {/* Razón del Cambio */}
//                   {hasChanges && (
//                     <div>
//                       <label className="block text-sm font-medium mb-2">
//                         Razón del cambio <span className="text-red-500">*</span>
//                       </label>
//                       <textarea
//                         value={accessReason}
//                         onChange={(e) => setAccessReason(e.target.value)}
//                         placeholder="Describe la razón para modificar estos accesos..."
//                         className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                         rows={3}
//                       />
//                     </div>
//                   )}

//                   {/* Botones de Acción */}
//                   {hasChanges && (
//                     <div className="flex justify-between">
//                       <button
//                         onClick={handleDiscardChanges}
//                         className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
//                       >
//                         Descartar Cambios
//                       </button>
//                       <button
//                         onClick={handleSaveAccess}
//                         disabled={saving || !accessReason.trim()}
//                         className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
//                       >
//                         {saving ? (
//                           <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
//                         ) : (
//                           <Save className="h-4 w-4" />
//                         )}
//                         {saving ? 'Guardando...' : 'Guardar Cambios'}
//                       </button>
//                     </div>
//                   )}
//                 </div>
//               ) : (
//                 /* Historial de Auditoría */
//                 <div>
//                   <h4 className="font-medium mb-3">Historial de Cambios</h4>
//                   <div className="space-y-3 max-h-96 overflow-y-auto">
//                     {auditHistory.length > 0 ? (
//                       auditHistory.map((entry) => (
//                         <div key={entry.id} className="border rounded-md p-4">
//                           <div className="flex items-center justify-between mb-2">
//                             <div className={`flex items-center gap-2 font-medium ${getActionColor(entry.accion)}`}>
//                               {getActionIcon(entry.accion)}
//                               <span>{entry.accion}</span>
//                             </div>
//                             <span className="text-sm text-gray-500">
//                               {formatDate(entry.fecha_cambio)}
//                             </span>
//                           </div>
                          
//                           {entry.usuario_modificador && (
//                             <div className="text-sm text-gray-600 mb-2">
//                               <span className="font-medium">Modificado por:</span> {entry.usuario_modificador.primer_nombre} {entry.usuario_modificador.primer_apellido}
//                               <span className="text-gray-500 ml-1">({entry.usuario_modificador.correo_institucional})</span>
//                             </div>
//                           )}
                          
//                           {entry.razon && (
//                             <div className="text-sm text-gray-700 mb-2">
//                               <span className="font-medium">Razón:</span> {entry.razon}
//                             </div>
//                           )}
                          
//                           {entry.direccion_ip && (
//                             <div className="text-xs text-gray-500">
//                               IP: {entry.direccion_ip}
//                             </div>
//                           )}

//                           {/* Mostrar cambios específicos si están disponibles */}
//                           {entry.valores_nuevos && Object.keys(entry.valores_nuevos).length > 0 && (
//                             <div className="mt-3 p-3 bg-gray-50 rounded text-xs">
//                               <div className="font-medium mb-2">Cambios realizados:</div>
//                               {Object.entries(entry.valores_nuevos).map(([key, value]) => (
//                                 <div key={key} className="flex justify-between">
//                                   <span>{key}:</span>
//                                   <span className={value ? 'text-green-600' : 'text-red-600'}>
//                                     {value ? 'Activado' : 'Desactivado'}
//                                   </span>
//                                 </div>
//                               ))}
//                             </div>
//                           )}
//                         </div>
//                       ))
//                     ) : (
//                       <div className="text-center text-gray-500 py-8">
//                         <History className="h-12 w-12 mx-auto mb-4 text-gray-300" />
//                         <p>No hay historial de cambios para este usuario</p>
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               )}
//             </div>
//           ) : (
//             <div className="flex items-center justify-center h-64 text-gray-500">
//               <div className="text-center">
//                 <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
//                 <p className="text-lg font-medium mb-2">Selecciona un usuario</p>
//                 <p className="text-sm">Escoge un usuario de la lista para gestionar sus accesos al sistema</p>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default UserAccessManager;