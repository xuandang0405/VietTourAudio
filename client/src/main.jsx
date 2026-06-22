import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import 'leaflet/dist/leaflet.css';
import App from './App.jsx';
import { adminQueryClient } from './admin/queryClient';
import './styles/variables.css';
import './styles/global.css';
import './styles/responsive.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={adminQueryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
