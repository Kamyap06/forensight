import React, { useState, useEffect } from 'react';
import { api } from './services/api';
import { User } from './types';

// Shell & Navigation Components
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CasesPage from './pages/CasesPage';
import CaseDetailPage from './pages/CaseDetailPage';
import EvidencePage from './pages/EvidencePage';
import TasksPage from './pages/TasksPage';
import FindingsPage from './pages/FindingsPage';
import CustodyPage from './pages/CustodyPage';
import NotesPage from './pages/NotesPage';
import AuditPage from './pages/AuditPage';
import ReportsPage from './pages/ReportsPage';
import AdminExplorerPage from './pages/AdminExplorerPage';
import AdminUsersPage from './pages/AdminUsersPage';
import SettingsPage from './pages/SettingsPage';
import CyberTerminal from './components/CyberTerminal';

interface Toast {
  id: number;
  message: string;
  type: 'info' | 'success' | 'error';
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<string>('landing');
  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null);
  const [dbInfo, setDbInfo] = useState<any>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [initializing, setInitializing] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [terminalOpen, setTerminalOpen] = useState(false);

  // Light / Dark Theme State
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('forensight_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('forensight_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  useEffect(() => {
    initApp();
    const timer = setTimeout(() => {
      setInitializing(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  // Global Ctrl + K and Ctrl + ~ listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('.global-search-input') as HTMLInputElement | null;
        if (searchInput) {
          searchInput.focus();
        }
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === '`' || e.key === '~')) {
        e.preventDefault();
        setTerminalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const initApp = async () => {
    try {
      // 1. Fetch system health
      const dbRes = await api.getDbCheck();
      setDbInfo(dbRes);
    } catch (err: any) {
      console.warn('Database health check warning:', err.message);
    }

    try {
      // 2. Fetch authenticated user session if exists
      const meRes = await api.getMe();
      if (meRes.user) {
        setCurrentUser(meRes.user);
        setCurrentView('dashboard');
      }
    } catch {
      // Unauthenticated - remain on landing page
    } finally {
      setInitializing(false);
    }
  };

  const showToast = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setCurrentView('dashboard');
  };

  const handleLogout = async () => {
    try {
      await api.logout();
      showToast('Logged out of ForenSight session', 'info');
    } catch (err: any) {
      console.warn('Logout error:', err.message);
    } finally {
      setCurrentUser(null);
      setCurrentView('landing');
    }
  };

  const handleSelectCase = (caseId: number) => {
    setSelectedCaseId(caseId);
    setCurrentView('case_detail');
  };

  const handleBackToCases = () => {
    setSelectedCaseId(null);
    setCurrentView('cases');
  };

  const handleSelectView = (viewId: string) => {
    setSelectedCaseId(null);
    setCurrentView(viewId);
  };

  const handleGlobalSearch = (query: string) => {
    if (!query) return;
    // Optional navigation on search
  };

  if (initializing) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#070b14',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#94a3b8'
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            border: '3px solid #1e293b',
            borderTopColor: '#38bdf8',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '16px'
          }}
        />
        <div style={{ fontSize: '0.9rem', letterSpacing: '0.5px' }}>
          Initializing ForenSight Security Core...
        </div>
      </div>
    );
  }

  // View 1: Public SaaS Landing Page
  if (currentView === 'landing') {
    return (
      <>
        <LandingPage
          currentUser={currentUser}
          onNavigateLogin={() => setCurrentView('login')}
          onNavigateDashboard={() => setCurrentView('dashboard')}
        />
        <CyberTerminal
        isOpen={terminalOpen}
        onClose={() => setTerminalOpen(false)}
        currentUser={currentUser}
        onNavigate={handleSelectView}
        onSelectCase={handleSelectCase}
      />

      <ToastContainer toasts={toasts} />
      </>
    );
  }

  // View 2: Authentication Portal
  if (currentView === 'login') {
    return (
      <>
        <LoginPage
          onLoginSuccess={handleLoginSuccess}
          onNavigateLanding={() => setCurrentView('landing')}
          showToast={showToast}
        />
        <CyberTerminal
        isOpen={terminalOpen}
        onClose={() => setTerminalOpen(false)}
        currentUser={currentUser}
        onNavigate={handleSelectView}
        onSelectCase={handleSelectCase}
      />

      <ToastContainer toasts={toasts} />
      </>
    );
  }

  // Authenticated Investigation Workspace Shell
  return (
    <div className="app-layout">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Role-Aware Left Sidebar */}
      <Sidebar
        currentView={currentView}
        onSelectView={(v) => {
          handleSelectView(v);
          setSidebarOpen(false);
        }}
        currentUser={currentUser}
        onLogout={handleLogout}
        dbInfo={dbInfo}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Workspace Stage */}
      <div className="app-main">
        <div className="cyber-ambient-beam" />
        <Topbar
          currentView={currentView}
          currentUser={currentUser}
          dbInfo={dbInfo}
          theme={theme}
          onToggleTheme={toggleTheme}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onNavigate={handleSelectView}
          onLogout={handleLogout}
          onGlobalSearch={handleGlobalSearch}
          onToggleTerminal={() => setTerminalOpen((prev) => !prev)}
        />

        <main className="page-container">
          {currentView === 'dashboard' && (
            <DashboardPage
              currentUser={currentUser}
              onSelectCase={handleSelectCase}
              onNavigate={handleSelectView}
              showToast={showToast}
            />
          )}

          {currentView === 'cases' && (
            <CasesPage
              currentUser={currentUser}
              onSelectCase={handleSelectCase}
              showToast={showToast}
            />
          )}

          {currentView === 'case_detail' && selectedCaseId && (
            <CaseDetailPage
              caseId={selectedCaseId}
              currentUser={currentUser}
              onBack={handleBackToCases}
              showToast={showToast}
            />
          )}

          {currentView === 'evidence' && (
            <EvidencePage
              currentUser={currentUser}
              onNavigateCase={handleSelectCase}
              showToast={showToast}
            />
          )}

          {currentView === 'tasks' && (
            <TasksPage
              currentUser={currentUser}
              onNavigateCase={handleSelectCase}
              showToast={showToast}
            />
          )}

          {currentView === 'findings' && (
            <FindingsPage
              currentUser={currentUser}
              showToast={showToast}
            />
          )}

          {currentView === 'custody' && (
            <CustodyPage
              currentUser={currentUser}
              showToast={showToast}
            />
          )}

          {currentView === 'notes' && (
            <NotesPage
              currentUser={currentUser}
              showToast={showToast}
            />
          )}

          {currentView === 'audit' && (
            <AuditPage
              currentUser={currentUser}
              showToast={showToast}
            />
          )}

          {currentView === 'reports' && (
            <ReportsPage
              currentUser={currentUser}
              onSelectCase={handleSelectCase}
              showToast={showToast}
            />
          )}

          {currentView === 'admin_database' && (
            <AdminExplorerPage
              currentUser={currentUser}
              showToast={showToast}
            />
          )}

          {currentView === 'admin_users' && (
            <AdminUsersPage
              currentUser={currentUser}
              showToast={showToast}
            />
          )}

          {currentView === 'settings' && (
            <SettingsPage
              currentUser={currentUser}
              theme={theme}
              onToggleTheme={toggleTheme}
              showToast={showToast}
            />
          )}
        </main>
      </div>

      <CyberTerminal
        isOpen={terminalOpen}
        onClose={() => setTerminalOpen(false)}
        currentUser={currentUser}
        onNavigate={handleSelectView}
        onSelectCase={handleSelectCase}
      />

      <ToastContainer toasts={toasts} />
    </div>
  );
}

function ToastContainer({ toasts }: { toasts: Toast[] }) {
  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        zIndex: 9999,
        maxWidth: '420px',
        pointerEvents: 'none'
      }}
    >
      {toasts.map((t) => {
        const bg =
          t.type === 'success'
            ? 'rgba(16, 185, 129, 0.95)'
            : t.type === 'error'
            ? 'rgba(239, 68, 68, 0.95)'
            : 'rgba(15, 23, 42, 0.95)';

        const border =
          t.type === 'success'
            ? '#10b981'
            : t.type === 'error'
            ? '#ef4444'
            : '#38bdf8';

        return (
          <div
            key={t.id}
            style={{
              padding: '12px 18px',
              backgroundColor: bg,
              color: '#ffffff',
              borderRadius: '8px',
              border: `1px solid ${border}`,
              boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
              fontSize: '0.86rem',
              fontWeight: 500,
              backdropFilter: 'blur(8px)',
              pointerEvents: 'auto',
              animation: 'slideIn 0.2s ease-out'
            }}
          >
            {t.message}
          </div>
        );
      })}
    </div>
  );
}
