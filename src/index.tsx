import { bootstrap } from '@/bootstrap';

console.log(
  `[Drone-OpenSky] v${import.meta.env.VITE_APP_VERSION} — ${import.meta.env.VITE_APP_LAST_COMMIT}`,
);

const rootEl = document.getElementById('root');
if (rootEl) {
  bootstrap(rootEl);
}
