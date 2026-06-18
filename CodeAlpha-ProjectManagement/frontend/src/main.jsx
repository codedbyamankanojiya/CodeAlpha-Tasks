import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { Toaster } from 'sonner';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: {
          background: '#1e293b',
          color: '#e2e8f0',
          border: '1px solid #334155',
          borderRadius: '12px',
        },
        className: 'toast',
      }}
    />
  </React.StrictMode>
);