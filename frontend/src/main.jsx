import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { DesaProvider } from './context/DesaContext.jsx';
import './index.css';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js').catch(() => {}); });
}

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
