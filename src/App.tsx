import { RouterProvider } from '@tanstack/react-router';
import './App.css';
import { router } from './routes/router';

const App = () => <RouterProvider router={router} />;

export default App;
