import { combineReducers } from '@reduxjs/toolkit';
import authReducer from '../slices/authSlice'; // Importar el reducer de autenticación

// Combinar reducers
const rootReducer = combineReducers({
  auth: authReducer,
  // Puedes agregar otros slices aquí
});

export default rootReducer;
