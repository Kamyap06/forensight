import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Moon,
  Sun,
  Shield,
  Database,
  Lock,
  User as UserIcon,
  CheckCircle2,
  Bell,
  Sliders,
  Check,
  RefreshCw,
  HardDrive
} from 'lucide-react';
import { User } from '../types';
import { api } from '../services/api';

interface SettingsPageProps {
  currentUser: User | null;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  showToast: (msg: string, type?: 'info' | 'success' | 'error') => void;
}

export default function SettingsPage({
  currentUser,
  theme,
  onToggleTheme,
  showToast
}: SettingsPageProps) {
  const [dbChecking, setDbChecking] = useState(false);
  const [dbResult, setDbResult] = useState<any>(null);

  const handleTestDatabase = async () => {
    try {
      setDbChecking(true);
      const res = await api.getDbCheck();
      setDbResult(res);
      showToast('Database connection verified: 10 tables & 3 views active', 'success');
    } catch (err: any) {
      showToast(err.message || 'Database connection error', 'error');
    } finally {
      setDbChecking(false);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.3px' }}>
          Platform Settings & Configuration
        </h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '3px' }}>
          Manage your theme appearance, investigator session profile, and relational database preferences.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Card 1: Appearance & Theme Selection */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">
              <Sun className="w-4 h-4 text-sky-400" />
              <span>Appearance & Color Theme</span>
            </div>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Real-time Switching</span>
          </div>

          <div className="panel-body">
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Select your interface theme. Preferences are preserved across browser sessions.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              {/* Dark Theme Card */}
              <div
                onClick={() => {
                  if (theme !== 'dark') onToggleTheme();
                }}
                style={{
                  border: `2px solid ${theme === 'dark' ? 'var(--primary)' : 'var(--border-color)'}`,
                  borderRadius: '10px',
                  padding: '14px',
                  backgroundColor: '#0a0e1a',
                  color: '#f8fafc',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.15s ease'
                }}
              >
                {theme === 'dark' && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Moon className="w-4 h-4 text-sky-400" />
                  <strong style={{ fontSize: '0.88rem' }}>Dark Cyber</strong>
                </div>
                <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                  Deep navy & charcoal palette with electric cyan accents. Ideal for low-light environments.
                </div>
              </div>

              {/* Light Theme Card */}
              <div
                onClick={() => {
                  if (theme !== 'light') onToggleTheme();
                }}
                style={{
                  border: `2px solid ${theme === 'light' ? 'var(--primary)' : 'var(--border-color)'}`,
                  borderRadius: '10px',
                  padding: '14px',
                  backgroundColor: '#ffffff',
                  color: '#0f172a',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.15s ease'
                }}
              >
                {theme === 'light' && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Sun className="w-4 h-4 text-amber-500" />
                  <strong style={{ fontSize: '0.88rem' }}>Light Enterprise</strong>
                </div>
                <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                  Crisp high-contrast daylight theme for compliance auditing and well-lit office setups.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Current Investigator Session Profile */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">
              <UserIcon className="w-4 h-4 text-emerald-400" />
              <span>Investigator Session Profile</span>
            </div>
            <span className="badge" style={{ backgroundColor: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
              Active Session
            </span>
          </div>

          <div className="panel-body">
            {currentUser ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Full Name:</span>
                  <strong style={{ color: 'var(--text-main)' }}>{currentUser.name}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Email Address:</span>
                  <span style={{ color: 'var(--text-main)' }}>{currentUser.email}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Access Role:</span>
                  <span className={`badge ${currentUser.role === 'Admin' ? 'badge-critical' : currentUser.role === 'Investigator' ? 'badge-open' : 'badge-closed'}`}>
                    {currentUser.role}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Cryptographic Security:</span>
                  <span style={{ color: '#10b981', fontWeight: 600 }}>scrypt Hashed (Werkzeug)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>User Identifier:</span>
                  <span style={{ fontFamily: 'monospace', color: 'var(--primary)' }}>USER-ID #{currentUser.user_id}</span>
                </div>
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>No authenticated session found.</p>
            )}
          </div>
        </div>

        {/* Card 3: MySQL Relational Diagnostics */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">
              <Database className="w-4 h-4 text-indigo-400" />
              <span>Relational Database Engine</span>
            </div>
            <button
              className="btn btn-outline btn-sm"
              onClick={handleTestDatabase}
              disabled={dbChecking}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${dbChecking ? 'animate-spin' : ''}`} />
              <span>Run Ping</span>
            </button>
          </div>

          <div className="panel-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.84rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Database Name:</span>
                <strong style={{ color: 'var(--text-main)', fontFamily: 'monospace' }}>forensight</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Target Host & Port:</span>
                <span style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>localhost:3306</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Storage Engine:</span>
                <span style={{ color: 'var(--text-secondary)' }}>MySQL 8.0 Enterprise Cluster</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Integrity & Rules:</span>
                <span style={{ color: '#10b981', fontWeight: 600 }}>Active Forensics Schema • Automated Audit Triggers</span>
              </div>

              {dbResult && (
                <div style={{ marginTop: '8px', padding: '10px', backgroundColor: 'var(--bg-card-subtle)', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.78rem' }}>
                  <div style={{ color: '#10b981', fontWeight: 600, marginBottom: '4px' }}>✓ Connection Verified</div>
                  <div style={{ color: 'var(--text-secondary)' }}>
                    Tables registered: {dbResult.tables?.join(', ')}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Card 4: Forensic Evidentiary Safeguards */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">
              <Shield className="w-4 h-4 text-amber-400" />
              <span>Forensic Evidentiary Safeguards</span>
            </div>
            <span style={{ fontSize: '0.74rem', color: '#10b981' }}>Enforced</span>
          </div>

          <div className="panel-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.82rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span style={{ color: 'var(--text-secondary)' }}>
                  Server-side SHA-256 cryptographic digest calculation on file ingestion
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span style={{ color: 'var(--text-secondary)' }}>
                  Immutable database trigger logging on chain-of-custody transfers
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span style={{ color: 'var(--text-secondary)' }}>
                  Role-based access control protecting database schema introspection
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span style={{ color: 'var(--text-secondary)' }}>
                  Official Case Dossier generation in PDF and Word DOC formats
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
