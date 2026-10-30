import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { DesaProvider } from './context/DesaContext.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <DesaProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </DesaProvider>
    </BrowserRouter>
  </React.StrictMode>
);
