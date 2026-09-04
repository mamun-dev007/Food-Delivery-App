import { StrictMode } from 'react'
import './index.css'
import { RouterProvider } from "react-router-dom";
import { router } from './routes/Routes.jsx';
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Toaster } from 'react-hot-toast';
import { createRoot } from 'react-dom/client';
import { initAuthListener } from './store/authStore';

// Start listening to Firebase auth state so the session/role is restored
// or cleared on refresh / sign-out. Must run before the router renders.
initAuthListener();

createRoot(document.getElementById('root')).render(
  <StrictMode>

  <RouterProvider router={router} />
  <ToastContainer position="top-right" autoClose={2000} />
  <Toaster position="top-right" toastOptions={{ duration: 2500 }} />

  </StrictMode>,
)



