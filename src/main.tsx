import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import LandingPage from './components/LandingPage.tsx';
import './index.css';
import { AuthProvider } from './contexts/AuthContext';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import CustomerApp from './components/CustomerApp.tsx';
import { DEFAULT_CONFIG } from './data/initialData';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/clube" element={<LandingPage />} />
          <Route path="/admin/*" element={<App />} />
          <Route path="/*" element={<CustomerApp config={DEFAULT_CONFIG} />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
);
