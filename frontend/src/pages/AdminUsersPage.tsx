import React, { useState, useEffect } from 'react';
import {
  Users,
  ShieldCheck,
  UserCheck,
  Eye,
  ShieldAlert,
  Search,
  CheckCircle2,
  Calendar,
  Lock,
  RefreshCw,
  Shield
} from 'lucide-react';
import { api } from '../services/api';
import { User } from '../types';
import { formatDateTime, formatDate } from '../utils/date';

interface AdminUsersPageProps {
  currentUser: User | null;
  showToast: (msg: string, type?: 'info' | 'success' | 'error') => void;
}

export default function AdminUsersPage({
  currentUser,
  showToast
}: AdminUsersPageProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminUsers();
      setUsers(res.users || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to load user registry', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: number, newRole: 'Admin' | 'Investigator' | 'Viewer') => {
    if (userId === currentUser?.user_id && newRole !== 'Admin') {
      if (!window.confirm('Warning: Demoting your own account will remove administrative privileges. Proceed?')) {
        return;
      }
    }

    try {
      setUpdatingId(userId);
      const res = await api.updateUserRole(userId, newRole);
      showToast(res.message || 'User role successfully updated in MySQL', 'success');
      loadUsers();
    } catch (err: any) {
      showToast(err.message || 'Failed to update user role', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  if (currentUser?.role !== 'Admin') {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center' }}>
        <ShieldAlert className="w-12 h-12 text-red-500" style={{ margin: '0 auto 16px' }} />
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)' }}>
          Access Prohibited
        </h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
          User Role Administration is strictly restricted to Administrators.
        </p>
      </div>
    );
  }

  const filteredUsers = users.filter((u) => {
    const term = search.toLowerCase();
    return u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term) || u.role.toLowerCase().includes(term);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-info">
          <div className="breadcrumb">
            <span>ForenSight</span>
            <span className="crumb-sep">/</span>
            <span>Administration</span>
            <span className="crumb-sep">/</span>
            <span className="crumb-active">User Management</span>
          </div>
          <h1 className="page-title cyber-glitch-text" data-text="Investigator & User Management">Investigator Accounts & RBAC</h1>
          <p className="page-subtitle">
            Manage authenticated investigators, security roles, and system authorizations across the platform.
          </p>
        </div>

        <div className="page-header-actions">
          <button className="btn btn-outline" onClick={loadUsers} title="Refresh investigator list">
            <RefreshCw className="w-4 h-4 mr-1" />
            <span>Refresh Users</span>
          </button>
        </div>
      </div>

      {/* RBAC Info Banner */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px'
        }}
      >
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontWeight: 600, fontSize: '0.9rem', marginBottom: '6px' }}>
            <ShieldAlert className="w-4 h-4" />
            <span>Admin Role</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Full system control, schema introspection, database explorer, user role modification, and complete incident workflow execution.
          </p>
        </div>

        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8', fontWeight: 600, fontSize: '0.9rem', marginBottom: '6px' }}>
            <UserCheck className="w-4 h-4" />
            <span>Investigator Role</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Case lifecycle management, cryptographic evidence ingestion, task assignment, finding documentation, notes, and custody transfers.
          </p>
        </div>

        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#eab308', fontWeight: 600, fontSize: '0.9rem', marginBottom: '6px' }}>
            <Eye className="w-4 h-4" />
            <span>Viewer Role</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Read-only examination of investigation cases, digital evidence metadata, forensic reports, and immutable audit logs.
          </p>
        </div>
      </div>

      {/* Control Bar */}
      <div className="filter-bar-group">
        <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: '420px' }}>
          <Search
            className="w-4 h-4"
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)'
            }}
          />
          <input
            type="text"
            placeholder="Search investigators by name, email, or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field"
            style={{ paddingLeft: '38px', width: '100%' }}
          />
        </div>
      </div>

      {/* Main Users Table */}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">
            <Users className="w-4 h-4 text-sky-400" />
            <span>Investigator Accounts & Roles ({filteredUsers.length})</span>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Table: forensight.Users</span>
        </div>

        <div className="table-wrap">
          <table className="cyber-table admin-table">
            <thead>
              <tr>
                <th className="col-id">User ID</th>
                <th>Investigator Name</th>
                <th>Email Address</th>
                <th className="col-status">Current Role</th>
                <th className="col-date">Registered Timestamp</th>
                <th className="col-actions">Modify Security Role (RBAC)</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    Loading investigator directory from MySQL...
                  </td>
                </tr>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((u) => {
                  const isCurrent = u.user_id === currentUser?.user_id;
                  const roleBadgeClass =
                    u.role === 'Admin'
                      ? 'badge-critical'
                      : u.role === 'Investigator'
                      ? 'badge-inprogress'
                      : 'badge-open';

                  return (
                    <tr key={u.user_id}>
                      <td className="col-id">
                        #{u.user_id}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.88rem' }}>
                          {u.name}
                          {isCurrent && (
                            <span
                              style={{
                                marginLeft: '8px',
                                fontSize: '0.68rem',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                                color: '#38bdf8',
                                fontWeight: 700
                              }}
                            >
                              YOU
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                      <td className="col-status">
                        <span className={`badge ${roleBadgeClass}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="col-date">
                        {formatDateTime(u.created_at)}
                      </td>
                      <td className="col-actions">
                        <select
                          disabled={updatingId === u.user_id}
                          value={u.role}
                          onChange={(e) =>
                            handleRoleChange(u.user_id, e.target.value as 'Admin' | 'Investigator' | 'Viewer')
                          }
                          className="input-field"
                          style={{
                            padding: '4px 10px',
                            fontSize: '0.82rem',
                            width: '140px',
                            display: 'inline-block'
                          }}
                        >
                          <option value="Admin">Admin</option>
                          <option value="Investigator">Investigator</option>
                          <option value="Viewer">Viewer</option>
                        </select>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No users found matching search query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
