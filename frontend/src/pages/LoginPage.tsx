import React, { useState } from 'react';
import {
  Fingerprint,
  Lock,
  Mail,
  User as UserIcon,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  FileSearch,
  ArrowLeft,
  UserPlus,
  LogIn,
  Home
} from 'lucide-react';
import { api } from '../services/api';
import { User } from '../types';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
  onNavigateLanding: () => void;
  showToast: (msg: string, type?: 'info' | 'success' | 'error') => void;
}

export default function LoginPage({
  onLoginSuccess,
  onNavigateLanding,
  showToast
}: LoginPageProps) {
  const [authMode, setAuthMode] = useState<'signin' | 'register'>('signin');

  // Sign In state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register state
  const [name, setName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'Investigator' | 'Viewer'>('Investigator');
  const [showRegPassword, setShowRegPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      const res = await api.login({ email, password });
      showToast(`Welcome back, ${res.user.name} (${res.user.role})`, 'success');
      onLoginSuccess(res.user);
    } catch (err: any) {
      const msg = err.message || 'Authentication failed. Please verify credentials.';
      setErrorMsg(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!regEmail || !regEmail.includes('@') || !regEmail.includes('.')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (regPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }
    if (regPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please verify your password confirmation.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.register({
        name: name.trim(),
        email: regEmail.trim(),
        password: regPassword,
        role
      });
      showToast(`Account registered successfully! Welcome, ${res.user.name}`, 'success');
      onLoginSuccess(res.user);
    } catch (err: any) {
      const msg = err.message || 'Registration failed. Please check your inputs.';
      setErrorMsg(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = (demoEmail: string, demoPass: string) => {
    setAuthMode('signin');
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMsg('');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-app)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '32px 16px',
        color: 'var(--text-main)'
      }}
    >
      {/* Top Navigation Bar: Return to Home */}
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }}
      >
        <button
          onClick={onNavigateLanding}
          className="btn btn-outline btn-sm"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--primary)',
            borderColor: 'var(--border-color)',
            backgroundColor: 'var(--bg-card)'
          }}
        >
          <Home className="w-4 h-4" />
          <span>Back to Home</span>
        </button>

        <div
          onClick={onNavigateLanding}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            color: 'var(--text-secondary)',
            fontSize: '0.85rem',
            fontWeight: 700
          }}
          title="Return to ForenSight Home"
        >
          <Fingerprint className="w-4 h-4 text-sky-400" />
          <span>ForenSight Security</span>
        </div>
      </div>

      {/* Main Auth Card */}
      <div
        className="panel"
        style={{
          width: '100%',
          maxWidth: '460px',
          borderRadius: '16px',
          padding: '32px 28px',
          boxShadow: 'var(--shadow-modal)',
          marginBottom: 0
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '22px' }}>
          <div
            onClick={onNavigateLanding}
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #2563eb, #38bdf8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
              cursor: 'pointer',
              boxShadow: '0 0 16px rgba(56, 189, 248, 0.35)'
            }}
            title="Click to return to Home"
          >
            <Fingerprint className="w-6 h-6 text-white" />
          </div>
          <h2
            onClick={onNavigateLanding}
            style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.4px', cursor: 'pointer' }}
          >
            ForenSight Access Portal
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {authMode === 'signin'
              ? 'Authenticate with verified cryptographic credentials.'
              : 'Create a new investigator account in the directory.'}
          </p>
        </div>

        {/* Tab Switcher: Sign In vs Register */}
        <div
          style={{
            display: 'flex',
            backgroundColor: 'var(--bg-input)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '3px',
            marginBottom: '20px',
            gap: '3px'
          }}
        >
          <button
            type="button"
            onClick={() => {
              setAuthMode('signin');
              setErrorMsg('');
            }}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '7px 12px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: authMode === 'signin' ? 'var(--primary)' : 'transparent',
              color: authMode === 'signin' ? '#ffffff' : 'var(--text-secondary)',
              fontSize: '0.84rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAuthMode('register');
              setErrorMsg('');
            }}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '7px 12px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: authMode === 'register' ? 'var(--primary)' : 'transparent',
              color: authMode === 'register' ? '#ffffff' : 'var(--text-secondary)',
              fontSize: '0.84rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Create Account</span>
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#ef4444',
              borderRadius: '8px',
              padding: '10px 14px',
              fontSize: '0.82rem',
              marginBottom: '16px'
            }}
          >
            {errorMsg}
          </div>
        )}

        {/* Sign In Form */}
        {authMode === 'signin' ? (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label className="input-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail className="w-4 h-4" style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  placeholder="investigator@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: '36px' }}
                  required
                />
              </div>
            </div>

            <div>
              <label className="input-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock className="w-4 h-4" style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: '36px', paddingRight: '36px' }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '6px', padding: '10px' }}
            >
              {loading ? (
                <span>Authenticating with scrypt...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </form>
        ) : (
          /* Register Form */
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label className="input-label">Full Name</label>
              <div style={{ position: 'relative' }}>
                <UserIcon className="w-4 h-4" style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Kamya Pawar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: '36px' }}
                  required
                />
              </div>
            </div>

            <div>
              <label className="input-label">Work Email</label>
              <div style={{ position: 'relative' }}>
                <Mail className="w-4 h-4" style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  placeholder="kamya@example.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: '36px' }}
                  required
                />
              </div>
            </div>

            <div>
              <label className="input-label">Password (minimum 6 characters)</label>
              <div style={{ position: 'relative' }}>
                <Lock className="w-4 h-4" style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: '36px', paddingRight: '36px' }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="input-label">Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <Lock className="w-4 h-4" style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: '36px' }}
                  required
                />
              </div>
            </div>

            <div>
              <label className="input-label">Requested Role</label>
              <select
                value={role}
                onChange={(e: any) => setRole(e.target.value)}
                className="input-field"
              >
                <option value="Investigator">Investigator (Full CRUD operations)</option>
                <option value="Viewer">Viewer (Read-only forensic audit)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '6px', padding: '10px' }}
            >
              {loading ? (
                <span>Creating Account...</span>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Demo Fast-Login Personas (Sign In Mode Only) */}
        {authMode === 'signin' && (
          <div style={{ marginTop: '22px', paddingTop: '18px', borderTop: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px', textAlign: 'center' }}>
              One-Click Quick Evaluation Credentials
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* Admin */}
              <button
                type="button"
                onClick={() => handleFillDemo('kamya@example.com', 'Admin@123')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '7px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'border-color 0.15s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <ShieldCheck className="w-4 h-4 text-red-400" />
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>Kamya (Admin)</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>kamya@example.com</div>
                  </div>
                </div>
                <span className="badge badge-critical" style={{ fontSize: '0.66rem' }}>Admin</span>
              </button>

              {/* Investigator */}
              <button
                type="button"
                onClick={() => handleFillDemo('malishka@example.com', 'Investigator@123')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '7px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'border-color 0.15s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <UserCheck className="w-4 h-4 text-sky-400" />
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>Malishka (Investigator)</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>malishka@example.com</div>
                  </div>
                </div>
                <span className="badge badge-open" style={{ fontSize: '0.66rem' }}>Investigator</span>
              </button>

              {/* Viewer */}
              <button
                type="button"
                onClick={() => handleFillDemo('harsh@example.com', 'Viewer@123')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '7px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'border-color 0.15s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FileSearch className="w-4 h-4 text-amber-400" />
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>Harsh (Viewer)</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>harsh@example.com</div>
                  </div>
                </div>
                <span className="badge badge-inprogress" style={{ fontSize: '0.66rem' }}>Read-Only</span>
              </button>
            </div>
          </div>
        )}

        {/* Bottom Link: Return to Home */}
        <div style={{ textAlign: 'center', marginTop: '20px', paddingTop: '14px', borderTop: '1px solid var(--border-color)' }}>
          <button
            type="button"
            onClick={onNavigateLanding}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '0.82rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              transition: 'color 0.15s'
            }}
          >
            <ArrowLeft className="w-3.5 h-3.5 text-sky-400" />
            <span>Return to ForenSight Home</span>
          </button>
        </div>
      </div>
    </div>
  );
}
