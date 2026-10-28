import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import App from './App.jsx';
import LandingPage from './pages/LandingPage.jsx';
import { ShortlistProvider } from './context/ShortlistContext.jsx';
import { ComparisonProvider } from './context/ComparisonContext.jsx';
import './index.css';
import { AuthProvider } from './context/AuthContext.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <ShortlistProvider>
        <ComparisonProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              {/* App is the layout for both pages, so switching between them
                  keeps the loaded cities, search and drawers. Browsing
                  cities is public; itineraries need an account (B4, #143). */}
              <Route element={<App />}>
                <Route path="/explore" element={null} />
                <Route element={<ProtectedRoute />}>
                  <Route path="/itineraries" element={null} />
                </Route>
              </Route>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </ComparisonProvider>
      </ShortlistProvider>
    </AuthProvider>
  </React.StrictMode>
);