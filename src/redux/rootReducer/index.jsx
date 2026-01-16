import { combineReducers } from '@reduxjs/toolkit';
import authReducer from '../slices/authSlice'; // Importar el reducer de autenticación
import itemsReducer from '../slices/itemsSlice'; // Importar el reducer de items

// Combinar reducers
const rootReducer = combineReducers({
  auth: authReducer,
  items: itemsReducer,
  // Puedes agregar otros slices aquí
});

export default rootReducer;
