import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles/tailwind.css'; // Import Tailwind CSS
import App from './App';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
