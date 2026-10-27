import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import App from './App.jsx';
import LandingPage from './pages/LandingPage.jsx';
import { ShortlistProvider } from './context/ShortlistContext.jsx';
import { ComparisonProvider } from './context/ComparisonContext.jsx';
import './index.css';
import { AuthProvider } from './context/AuthContext.jsx';


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <ShortlistProvider>
        <ComparisonProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/explore" element={<App />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </ComparisonProvider>
      </ShortlistProvider>
    </AuthProvider>
  </React.StrictMode>
);