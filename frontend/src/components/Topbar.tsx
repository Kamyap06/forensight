import React, { useState } from 'react';
import {
  Search,
  Bell,
  Sun,
  Moon,
  Database,
  Menu,
  User as UserIcon,
  LogOut,
  Settings,
  Shield,
  CheckCircle2,
  Home
} from 'lucide-react';
import { User } from '../types';

interface TopbarProps {
  currentView: string;
  currentUser: User | null;
  dbInfo: any;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onToggleSidebar?: () => void;
  onNavigate: (view: string) => void;
  onLogout: () => void;
  onGlobalSearch?: (query: string) => void;
  onToggleTerminal?: () => void;
}

export default function Topbar({
  currentView,
  currentUser,
  dbInfo,
  theme,
  onToggleTheme,
  onToggleSidebar,
  onNavigate,
  onLogout,
  onGlobalSearch,
  onToggleTerminal
}: TopbarProps) {
  const [searchVal, setSearchVal] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onGlobalSearch && searchVal.trim()) {
      onGlobalSearch(searchVal.trim());
    }
  };

  return (
    <header className="app-topbar">
      {/* 1. Left: Mobile menu & Global Search Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '0 1 340px', minWidth: '180px' }}>
        <button
          className="mobile-menu-btn"
          onClick={onToggleSidebar}
          title="Open Navigation"
        >
          <Menu className="w-4 h-4" />
        </button>

        <form onSubmit={handleSearchSubmit} className="global-search-bar" style={{ width: '100%', maxWidth: '320px' }}>
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            className="global-search-input"
            placeholder="Search cases, evidence, tasks..."
            value={searchVal}
            onChange={(e) => {
              setSearchVal(e.target.value);
              if (onGlobalSearch) onGlobalSearch(e.target.value);
            }}
          />
          <span className="kbd-shortcut">Ctrl K</span>
        </form>
      </div>

      {/* 2. Center: Live Cyber Security Status HUD & Terminal Trigger */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, minWidth: 0, padding: '0 8px' }}>
        <div
          className="cyber-hud-badge"
          onClick={onToggleTerminal}
          style={{ cursor: 'pointer' }}
          title="Click or press Ctrl + ~ to open interactive DFIR SOC Terminal"
        >
          <span className="cyber-live-dot" />
          <span className="hud-title">SHA-256 ACTIVE</span>
          <span className="hud-divider">//</span>
          <span className="hud-sub">SECURE NODE</span>
          <span className="hud-terminal-pill">
            ⚡ SOC TERMINAL
          </span>
        </div>
      </div>

      {/* 3. Right: Home Button, Theme Toggle, Notifications, User Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        {/* Home / Landing Page Button */}
        <button
          type="button"
          className="topbar-action-btn"
          onClick={() => onNavigate('landing')}
          title="Return to ForenSight Home / Public Portal"
        >
          <Home className="w-3.5 h-3.5 text-sky-400" />
          <span>Home</span>
        </button>

        {/* Light / Dark Theme Toggle Switch */}
        <button
          className="topbar-icon-btn"
          onClick={onToggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-700" />
          )}
        </button>

        {/* Notifications Popover */}
        <div style={{ position: 'relative' }}>
          <button
            className="topbar-icon-btn"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            title="System Notifications"
          >
            <Bell className="w-4 h-4" />
            <span
              style={{
                position: 'absolute',
                top: '5px',
                right: '5px',
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: '#38bdf8'
              }}
            />
          </button>

          {showNotifications && (
            <div
              style={{
                position: 'absolute',
                top: '42px',
                right: 0,
                width: '290px',
                backgroundColor: 'var(--bg-modal)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                boxShadow: 'var(--shadow-modal)',
                padding: '12px',
                zIndex: 200,
                animation: 'slideIn 0.15s ease-out'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <strong style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>Notifications</strong>
                <span style={{ fontSize: '0.72rem', color: '#10b981' }}>Live Feed</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem' }}>
                <div style={{ padding: '8px', backgroundColor: 'var(--bg-card-subtle)', borderRadius: '6px' }}>
                  <div style={{ color: 'var(--text-main)', fontWeight: 600 }}>Database Triggers Active</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>All custody transfers and findings logged in audit ledger.</div>
                </div>
                <div style={{ padding: '8px', backgroundColor: 'var(--bg-card-subtle)', borderRadius: '6px' }}>
                  <div style={{ color: 'var(--text-main)', fontWeight: 600 }}>SHA-256 Engine Online</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Cryptographic integrity verification ready.</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Badge with Dropdown */}
        {currentUser && (
          <div style={{ position: 'relative' }}>
            <div
              className="user-profile-badge"
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowNotifications(false);
              }}
            >
              <div className="user-avatar-circle">
                {getInitials(currentUser.name)}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: 1.15 }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {currentUser.name}
                </span>
                <span style={{ fontSize: '0.67rem', color: 'var(--text-muted)' }}>
                  {currentUser.role}
                </span>
              </div>
            </div>

            {showProfileMenu && (
              <div
                style={{
                  position: 'absolute',
                  top: '42px',
                  right: 0,
                  width: '200px',
                  backgroundColor: 'var(--bg-modal)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  boxShadow: 'var(--shadow-modal)',
                  padding: '6px',
                  zIndex: 200,
                  animation: 'slideIn 0.15s ease-out'
                }}
              >
                <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border-color)', marginBottom: '4px' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>{currentUser.name}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {currentUser.email}
                  </div>
                </div>

                <button
                  className="nav-btn"
                  onClick={() => {
                    onNavigate('landing');
                    setShowProfileMenu(false);
                  }}
                  style={{ fontSize: '0.82rem', padding: '6px 10px', color: '#38bdf8' }}
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>Home / Public Portal</span>
                </button>

                <button
                  className="nav-btn"
                  onClick={() => {
                    onNavigate('settings');
                    setShowProfileMenu(false);
                  }}
                  style={{ fontSize: '0.82rem', padding: '6px 10px' }}
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Platform Settings</span>
                </button>

                <button
                  className="nav-btn"
                  onClick={() => {
                    onLogout();
                    setShowProfileMenu(false);
                  }}
                  style={{ fontSize: '0.82rem', padding: '6px 10px', color: '#ef4444' }}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
