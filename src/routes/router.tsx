import {
  Navigate,
  Outlet,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';
import { MapView } from '../components/Map/MapView';

const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => <Navigate to="/map" />,
});

const mapRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/map',
  component: () => (
    <div className="h-screen w-screen">
      <MapView />
    </div>
  ),
});

const routeTree = rootRoute.addChildren([indexRoute, mapRoute]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
