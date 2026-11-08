import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    {/* HashRouter keeps deep links working on static hosts (GitHub Pages) and
        lets public share payloads live in the fragment, where they are never
        transmitted to a server. */}
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
);
