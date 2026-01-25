import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css'; 

// Point d'entrée de l'application React
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);