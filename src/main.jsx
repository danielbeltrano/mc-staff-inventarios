import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { store, persistor } from './redux/store';
import App from './App';
import { PersistGate } from 'redux-persist/integration/react';
import { createRoot } from 'react-dom/client';

createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    {/* PersistGate retrasa el renderizado de tu app hasta que se haya restaurado el estado */}
    <PersistGate loading={<div>Cargando...</div>} persistor={persistor}>
      <App />
    </PersistGate>
  </Provider>
);


