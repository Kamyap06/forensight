import React from 'react';
import {
  LayoutDashboard,
  Home,
  Briefcase,
  Microscope,
  CheckSquare,
  AlertTriangle,
  Link2,
  FileText,
  History,
  BarChart3,
  Database,
  Users,
  Settings,
  LogOut,
  Fingerprint,
  ChevronDown,
  ChevronRight,
  X
} from 'lucide-react';
import { User } from '../types';

interface SidebarProps {
  currentView: string;
  onSelectView: (view: string) => void;
  currentUser: User | null;
  onLogout: () => void;
  dbInfo: any;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({
  currentView,
  onSelectView,
  currentUser,
  onLogout,
  dbInfo,
  isOpen = false,
  onClose
}: SidebarProps) {
  const role = currentUser?.role || 'Viewer';
  const [reportsOpen, setReportsOpen] = React.useState(true);

  const handleItemClick = (viewId: string) => {
    onSelectView(viewId);
    if (onClose) onClose();
  };

  const investigationItems = [
    { id: 'cases', label: 'Cases', icon: Briefcase },
    { id: 'evidence', label: 'Evidence Lab', icon: Microscope },
    { id: 'tasks', label: 'Investigation Tasks', icon: CheckSquare },
    { id: 'findings', label: 'Analysis Findings', icon: AlertTriangle },
    { id: 'custody', label: 'Chain of Custody', icon: Link2 },
    { id: 'notes', label: 'Evidence Notes', icon: FileText }
  ];

  const adminItems = [
    { id: 'admin_database', label: 'Database Explorer', icon: Database },
    { id: 'admin_users', label: 'User Management', icon: Users }
  ];

  return (
    <aside className={`app-sidebar ${isOpen ? 'open' : ''}`}>
      {/* Brand Header */}
      <div className="brand-header">
        <div className="brand-flex" style={{ justifyContent: 'space-between' }}>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
            onClick={() => handleItemClick('landing')}
            title="Go to ForenSight Home / Public Portal"
          >
            <div className="brand-icon-loop">
              <Fingerprint className="w-5 h-5 text-white" />
            </div>
            <div className="brand-title-wrap">
              <span className="brand-name">ForenSight</span>
              <span className="brand-sub">DFIR SOC PLATFORM</span>
            </div>
          </div>
          <button
            className="sidebar-close-btn"
            onClick={onClose}
            title="Close navigation"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Navigation Groups */}
      <div style={{ flex: 1, padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {/* Home / Public Portal Button */}
        <button
          className={`nav-btn ${currentView === 'landing' ? 'active' : ''}`}
          onClick={() => handleItemClick('landing')}
          style={{
            borderLeft: currentView === 'landing' ? '3px solid #38bdf8' : '3px solid transparent',
            marginBottom: '3px',
            backgroundColor: currentView === 'landing' ? 'rgba(56, 189, 248, 0.15)' : 'transparent'
          }}
        >
          <Home className="w-4 h-4 text-sky-400" />
          <span style={{ fontWeight: 600 }}>Home / Public Site</span>
        </button>

        {/* Dashboard Main Button */}
        <button
          className={`nav-btn ${currentView === 'dashboard' ? 'active' : ''}`}
          onClick={() => handleItemClick('dashboard')}
          style={{
            borderLeft: currentView === 'dashboard' ? '3px solid #38bdf8' : '3px solid transparent'
          }}
        >
          <LayoutDashboard className="w-4 h-4 text-indigo-400" />
          <span style={{ fontWeight: 600 }}>SOC Dashboard</span>
        </button>

        {/* Investigation Section */}
        <div className="sidebar-section-title">Investigation</div>
        {investigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              className={`nav-btn ${isActive ? 'active' : ''}`}
              onClick={() => handleItemClick(item.id)}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}

        {/* Administration Section */}
        <div className="sidebar-section-title">Administration</div>
        
        {/* Audit Logs */}
        <button
          className={`nav-btn ${currentView === 'audit' ? 'active' : ''}`}
          onClick={() => handleItemClick('audit')}
        >
          <History className="w-4 h-4" />
          <span>Audit Logs</span>
        </button>

        {/* Reports with Sub-items */}
        <div>
          <button
            className={`nav-btn ${currentView === 'reports' ? 'active' : ''}`}
            onClick={() => handleItemClick('reports')}
            style={{ justifyContent: 'space-between' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <BarChart3 className="w-4 h-4" />
              <span>Reports</span>
            </div>
            <span
              onClick={(e) => {
                e.stopPropagation();
                setReportsOpen(!reportsOpen);
              }}
              style={{ padding: '2px' }}
            >
              {reportsOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </span>
          </button>

          {reportsOpen && (
            <div style={{ paddingLeft: '8px', marginTop: '2px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <button
                className={`nav-sub-btn ${currentView === 'reports' ? 'active' : ''}`}
                onClick={() => handleItemClick('reports')}
              >
                <span>• Analytics</span>
              </button>
              <button
                className={`nav-sub-btn ${currentView === 'reports' ? 'active' : ''}`}
                onClick={() => handleItemClick('reports')}
              >
                <span>• Case Reports</span>
              </button>
              <button
                className={`nav-sub-btn ${currentView === 'reports' ? 'active' : ''}`}
                onClick={() => handleItemClick('reports')}
              >
                <span>• Report Generator</span>
              </button>
            </div>
          )}
        </div>

        {/* Database Explorer & User Management (Role Protected) */}
        {role === 'Admin' && (
          adminItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                className={`nav-btn ${isActive ? 'active' : ''}`}
                onClick={() => handleItemClick(item.id)}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })
        )}

        {/* Settings */}
        <button
          className={`nav-btn ${currentView === 'settings' ? 'active' : ''}`}
          onClick={() => handleItemClick('settings')}
        >
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </button>
      </div>

      {/* Fingerprint Identity Bottom Card */}
      <div className="sidebar-fingerprint-card">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div>
            <div className="fingerprint-text">
              Every<br />
              digital trace<br />
              tells a story.
            </div>
            <div className="fingerprint-subtext">
              Investigate • Analyse<br />Connect • Secure
            </div>
          </div>
          <Fingerprint className="w-12 h-12 text-sky-400 opacity-25" style={{ transform: 'rotate(-10deg)', marginTop: '-4px' }} />
        </div>

        {currentUser && (
          <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              MySQL 8.0: <span style={{ color: '#10b981', fontWeight: 600 }}>Active</span>
            </div>
            <button
              onClick={onLogout}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#ef4444',
                fontSize: '0.72rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer',
                padding: '2px 4px'
              }}
              title="Sign Out"
            >
              <LogOut className="w-3 h-3" />
              <span>Exit</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
