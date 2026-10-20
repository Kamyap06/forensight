import React from 'react';
import { Shield, ArrowRight, User as UserIcon, Lock } from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  currentUser: User | null;
  onNavigateLanding: () => void;
  onNavigateLogin: () => void;
  onNavigateDashboard: () => void;
}

export default function Navbar({
  currentUser,
  onNavigateLanding,
  onNavigateLogin,
  onNavigateDashboard
}: NavbarProps) {
  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: 'rgba(8, 12, 22, 0.92)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '0 28px',
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}
    >
      <div
        style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
        onClick={onNavigateLanding}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #2563eb, #38bdf8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px rgba(56, 189, 248, 0.4)'
          }}
        >
          <Shield className="w-4 h-4 text-white" />
        </div>
        <div>
          <div
            style={{
              fontWeight: 900,
              fontSize: '1.15rem',
              letterSpacing: '-0.3px',
              background: 'linear-gradient(135deg, #ffffff 0%, #38bdf8 65%, #a78bfa 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              lineHeight: 1.1
            }}
          >
            ForenSight
          </div>
          <div
            style={{
              fontFamily: 'ui-monospace, monospace',
              fontSize: '0.6rem',
              color: '#38bdf8',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              marginTop: '1px'
            }}
          >
            INCIDENT INVESTIGATION PLATFORM
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '24px', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
        <a
          href="#features"
          onClick={onNavigateLanding}
          style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.15s ease' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#38bdf8')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'inherit')}
        >
          Platform Capabilities
        </a>
        <a
          href="#preview"
          onClick={onNavigateLanding}
          style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.15s ease' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#38bdf8')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'inherit')}
        >
          Console Preview
        </a>
        <a
          href="#workflow"
          onClick={onNavigateLanding}
          style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.15s ease' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#38bdf8')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'inherit')}
        >
          Investigation Lifecycle
        </a>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {currentUser ? (
          <button className="btn btn-primary" onClick={onNavigateDashboard}>
            <UserIcon className="w-4 h-4" />
            <span>Console ({currentUser.name})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button className="btn btn-primary" onClick={onNavigateLogin}>
            <Lock className="w-3.5 h-3.5 mr-1" />
            <span>Access Platform</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </button>
        )}
      </div>
    </nav>
  );
}
