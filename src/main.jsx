import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { ShortlistProvider } from './context/ShortlistContext.jsx';
import { ComparisonProvider } from './context/ComparisonContext.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ShortlistProvider>
      <ComparisonProvider>
        <App />
      </ComparisonProvider>
    </ShortlistProvider>
  </React.StrictMode>
);