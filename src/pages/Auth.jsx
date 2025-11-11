import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [isAdminFlow, setIsAdminFlow] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();

  async function handleRegister(e) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    try {
      if (isAdminFlow) throw new Error('Admin accounts must be created by an admin in the DB.');
      const { data: authData, error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) throw signUpError;
      if (!authData.user) throw new Error('Registration failed');
      
      // Insert profile row
      const { error: insertError } = await supabase
        .from('profiles')
        .insert([{ id: authData.user.id, email, full_name: name, role: 'user' }]);
      if (insertError) throw insertError;
      navigate('/dashboard-user');
    } catch (err) {
      setMessage(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    try {
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      if (!authData.user) throw new Error('Login failed');
      
      // fetch profile
      const { data, error: profileErr } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authData.user.id)
        .single();
      if (profileErr) throw profileErr;
      if (isAdminFlow) {
        if (data.role !== 'admin') throw new Error('This account is not an admin');
        navigate('/dashboard-admin');
      } else {
        if (data.role !== 'user') throw new Error('This account is not a user');
        navigate('/dashboard-user');
      }
    } catch (err) {
      setMessage(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 520 }}>
      <div style={{ background: '#fff', padding: 24, borderRadius: 8, boxShadow: '0 6px 18px rgba(2,6,23,0.08)' }}>
        <h2 style={{ marginTop: 0 }}>Event Helper — {isLogin ? 'Sign In' : 'Sign Up'}</h2>

        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <button
            onClick={() => setIsAdminFlow(false)}
            style={{
              padding: '8px 12px',
              borderRadius: 6,
              border: '1px solid #e2e8f0',
              background: !isAdminFlow ? '#2563eb' : '#fff',
              color: !isAdminFlow ? '#fff' : '#111'
            }}
          >
            User
          </button>
          <button
            onClick={() => setIsAdminFlow(true)}
            style={{
              padding: '8px 12px',
              borderRadius: 6,
              border: '1px solid #e2e8f0',
              background: isAdminFlow ? '#7c3aed' : '#fff',
              color: isAdminFlow ? '#fff' : '#111'
            }}
          >
            Admin
          </button>
        </div>

        <div style={{ marginBottom: 12 }}>
          <button
            onClick={() => { setIsLogin(!isLogin); setMessage(null); }}
            style={{ background: 'none', border: 'none', color: '#2563eb', textDecoration: 'underline', cursor: 'pointer' }}
          >
            {isLogin ? 'Need to create an account? Sign up' : 'Already have an account? Sign in'}
          </button>
        </div>

        <form onSubmit={isLogin ? handleLogin : handleRegister}>
          {!isLogin && (
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 13 }}>Full name</label>
              <input value={name} onChange={e => setName(e.target.value)} required style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e2e8f0' }} />
            </div>
          )}

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 13 }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e2e8f0' }} />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 13 }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e2e8f0' }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button type="submit" disabled={loading} style={{ padding: '8px 16px', borderRadius: 6, background: '#10b981', color: '#fff', border: 'none' }}>
              {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Sign Up')}
            </button>

            {isLogin && (
              <button
                type="button"
                onClick={async (e) => {
                  e.preventDefault();
                  setMessage('If that email exists, a magic link was sent.');
                  await supabase.auth.signInWithOtp({ email });
                }}
                style={{ background: 'none', border: 'none', color: '#2563eb', textDecoration: 'underline', cursor: 'pointer' }}
              >
                Send magic link
              </button>
            )}
          </div>

          {message && <div style={{ marginTop: 12, color: 'crimson' }}>{message}</div>}
        </form>

        <div style={{ marginTop: 12, fontSize: 12, color: '#64748b' }}>
          Note: Admin accounts must be created/assigned by an admin in the database.
        </div>
      </div>
    </div>
  );
}
