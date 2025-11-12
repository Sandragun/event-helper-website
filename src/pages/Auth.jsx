import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [isAdminFlow, setIsAdminFlow] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div className="card" style={{ maxWidth: 520, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div className="brand-badge">🎫</div>
          <h2 style={{ marginTop: 0, marginBottom: 8, fontSize: 24, fontWeight: 700 }}>Event Helper</h2>
          <p style={{ color: '#a0a0b0', margin: 0 }}>{isLogin ? 'Welcome back' : 'Create your account'}</p>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <button
            onClick={() => setIsAdminFlow(false)}
            className={`btn ${!isAdminFlow ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1 }}
          >
            👤 User
          </button>
          <button
            onClick={() => setIsAdminFlow(true)}
            className={`btn ${isAdminFlow ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1 }}
          >
            🔐 Admin
          </button>
        </div>

        <form onSubmit={isLogin ? handleLogin : handleRegister}>
          {!isLogin && (
            <div className="form-group input-with-icon">
              <label>Full Name</label>
              <span className="input-icon">👤</span>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="John Doe"
                required
              />
            </div>
          )}

          <div className="form-group input-with-icon">
            <label>Email Address</label>
            <span className="input-icon">✉️</span>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
            <div style={{ fontSize: 12, color: '#a0a0b0' }}>Use your college or work email</div>
          </div>

          <div className="form-group input-with-icon">
            <label>Password</label>
            <span className="input-icon">🔒</span>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              className="input-action"
              onClick={() => setShowPassword(v => !v)}
              aria-label="Toggle password visibility"
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              <a href="#" className="muted-link">Forgot password?</a>
              <span style={{ fontSize: 12, color: '#a0a0b0' }}>Min 8 characters</span>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', marginBottom: 12 }}>
            {loading ? '⏳ Processing...' : (isLogin ? '🔓 Sign In' : '📝 Sign Up')}
          </button>

          {isLogin && (
            <button
              type="button"
              onClick={async (e) => {
                e.preventDefault();
                setMessage('✨ If that email exists, a magic link was sent.');
                await supabase.auth.signInWithOtp({ email });
              }}
              className="btn btn-secondary"
              style={{ width: '100%' }}
            >
              ✉️ Send Magic Link
            </button>
          )}
        </form>

        <div style={{ textAlign: 'center', marginTop: 20, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <button
            onClick={() => { setIsLogin(!isLogin); setMessage(null); }}
            className="btn btn-secondary"
            style={{ width: '100%' }}
          >
            {isLogin ? '✏️ Need an account? Sign up' : '🔑 Already have an account? Sign in'}
          </button>
        </div>

        {message && (
          <div className="alert alert-info" style={{ marginTop: 16 }}>
            {message}
          </div>
        )}

        <div style={{ marginTop: 16, fontSize: 12, color: '#a0a0b0', textAlign: 'center' }}>
          💡 Admin accounts must be created/assigned by an admin in the database.
        </div>
      </div>
    </div>
  );
}

