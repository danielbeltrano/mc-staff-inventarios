import { configureStore } from '@reduxjs/toolkit';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage'; 
import authReducer from '../slices/authSlice';
import matriculasReducer from '../slices/matriculasSlice';
import permissionsReducer from '../slices/permissionsSlice';

// Configuración de persistencia
const persistConfig = {
  key: 'auth', // Cambiado de 'root' a 'auth' para persistir solo el reducer de autenticación
  storage,
  whitelist: ['user', 'role'] 
};

// Configuración de persistencia para permisos (opcional - para cache)
// const permissionsPersistConfig = {
//   key: 'permissions',
//   storage,
//   whitelist: ['permissions'], // Solo persistir los permisos, no el status
//   // Agregar transformaciones si es necesario
//   transforms: [
//     // Transform para limpiar permisos si son muy antiguos
//     {
//       in: (inboundState, key) => {
//         if (key === 'permissions' && inboundState.lastChecked) {
//           const lastChecked = new Date(inboundState.lastChecked);
//           const now = new Date();
//           const hoursDiff = (now - lastChecked) / (1000 * 60 * 60);
          
//           // Si los permisos tienen más de 2 horas, limpiarlos
//           if (hoursDiff > 2) {
//             return {
//               ...inboundState,
//               permissions: {
//                 hasPermissions: false,
//                 permissions: {},
//                 hierarchyLevel: null,
//                 userInfo: null,
//                 auditInfo: null,
//                 services: []
//               },
//               status: 'idle'
//             };
//           }
//         }
//         return inboundState;
//       },
//       out: (outboundState, key) => outboundState
//     }
//   ]
// };

// Configuración de persistencia para permisos (opcional - para cache)
const permissionsPersistConfig = {
  key: 'permissions',
  storage,
  whitelist: [], // NO persistir permisos inicialmente para debug
};

// Combinar tus reducers
const rootReducer = {
  auth: persistReducer(persistConfig, authReducer),
  permissions: persistReducer(permissionsPersistConfig, permissionsReducer),
  //permissions: permissionsReducer,
  matriculas: matriculasReducer
};

// Configuración de la tienda
export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignorar acciones de redux-persist que contienen valores no serializables
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
    devTools: process.env.NODE_ENV !== 'production'
});

export const persistor = persistStore(store);

