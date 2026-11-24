import React from 'react';
import ReactDOM from 'react-dom/client';
import { PortfolioApp } from './PortfolioApp.jsx';
import './style.css';

const target =
  document.getElementById('canvas-container') || document.getElementById('root');
if (target) {
  ReactDOM.createRoot(target).render(
    <React.StrictMode>
      <PortfolioApp />
    </React.StrictMode>
  );
}