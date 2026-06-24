import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import 'leaflet/dist/leaflet.css';
import './i18n';
import App from './App.jsx';
import { adminQueryClient } from './admin/queryClient';
import './styles/variables.css';
import './styles/global.css';
import './styles/responsive.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={adminQueryClient}>
      <Suspense fallback={<div className="flex h-screen items-center justify-center bg-slate-50 text-slate-500 font-medium">Loading translations...</div>}>
        <App />
      </Suspense>
    </QueryClientProvider>
  </React.StrictMode>
);
