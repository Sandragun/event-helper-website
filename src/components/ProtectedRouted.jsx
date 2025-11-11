import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function ProtectedRoute({ children, requiredRole }) {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    async function check() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setAllowed(false);
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

      if (data && data.role === requiredRole) setAllowed(true);
      setLoading(false);
    }
    check();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      check();
    });

    return () => subscription.unsubscribe();
  }, [requiredRole]);

  if (loading) return <div className="container" style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>;
  if (!allowed) return <Navigate to="/auth" replace />;
  return children;
}
