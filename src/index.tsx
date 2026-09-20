import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

console.log(
  `[Drone-OpenSky] v${import.meta.env.VITE_APP_VERSION} — ${import.meta.env.VITE_APP_LAST_COMMIT}`,
);

const rootEl = document.getElementById('root');
if (rootEl) {
  const root = createRoot(rootEl);
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
