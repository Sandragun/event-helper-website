import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './pages/Auth';
import ProtectedRoute from './components/ProtectedRouted';
import { DashboardUser } from './pages/DashboardUser';
import { DashboardAdmin } from './pages/DashboardAdmin';
import Events from './pages/Events';
import { supabase } from './supabaseClient';

export default function App() {
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth event', event);
    });
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Events />} />
        <Route path="/events" element={<Events />} />
        <Route path="/auth" element={<Auth />} />
        <Route
          path="/dashboard-user"
          element={
            <ProtectedRoute requiredRole={'user'}>
              <DashboardUser />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard-admin"
          element={
            <ProtectedRoute requiredRole={'admin'}>
              <DashboardAdmin />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<div className="container">404 - Not found</div>} />
      </Routes>
    </BrowserRouter>
  );
}
