import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  Filter,
  ShieldAlert,
  Database,
  ArrowRight,
  Layers,
  Zap,
  RefreshCw,
  FileText,
  Activity,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { api } from '../services/api';
import { User, AuditLog } from '../types';
import { formatDateTime } from '../utils/date';

interface AuditPageProps {
  currentUser: User | null;
  showToast: (msg: string, type?: 'info' | 'success' | 'error') => void;
}

export default function AuditPage({
  currentUser,
  showToast
}: AuditPageProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [tableFilter, setTableFilter] = useState('');

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      const res = await api.getAuditLogs();
      setLogs(res.audit_logs || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to load audit logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((l) => {
    const tbl = (l.table_name || l.entity_type || '').toLowerCase();
    const desc = (l.change_description || l.details || '').toLowerCase();
    const uName = (l.user_name || '').toLowerCase();
    const recId = String(l.record_id ?? l.entity_id ?? '');
    const term = search.toLowerCase();

    const matchesSearch =
      tbl.includes(term) || desc.includes(term) || uName.includes(term) || recId.includes(term);

    const matchesAction = !actionFilter || l.action.toLowerCase() === actionFilter.toLowerCase();
    const matchesTable = !tableFilter || tbl === tableFilter.toLowerCase();
    return matchesSearch && matchesAction && matchesTable;
  });

  const insertCount = logs.filter((l) => l.action?.toUpperCase().includes('INSERT') || l.action?.toUpperCase().includes('CREATE')).length;
  const updateCount = logs.filter((l) => l.action?.toUpperCase().includes('UPDATE')).length;
  const triggerEventsCount = logs.filter((l) => l.action?.toUpperCase().includes('CUSTODY') || l.action?.toUpperCase().includes('FINDING')).length;

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
            <span className="crumb-active">Audit Logs</span>
          </div>
          <h1 className="page-title cyber-glitch-text" data-text="System Audit & Trigger Ledger">System & Forensic Audit Trail</h1>
          <p className="page-subtitle">
            Immutable cryptographic ledger recording system security events, investigator actions, and administrative activities.
          </p>
        </div>

        <div className="page-header-actions">
          <button className="btn btn-outline" onClick={loadAuditLogs} title="Refresh audit log stream">
            <RefreshCw className="w-4 h-4 mr-1" />
            <span>Refresh Audit Logs</span>
          </button>
        </div>
      </div>

      {/* Audit KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Total Audit Records</span>
            <History className="w-4 h-4 text-sky-400" />
          </div>
          <div className="kpi-value">{logs.length}</div>
          <div className="kpi-footer">Sequentially numbered audit entries</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Automated Security Events</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="kpi-value">{triggerEventsCount}</div>
          <div className="kpi-footer">Fired via internal integrity triggers</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Creation Events</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="kpi-value">{insertCount}</div>
          <div className="kpi-footer">New records committed</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Modification Events</span>
            <Database className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="kpi-value">{updateCount}</div>
          <div className="kpi-footer">State transitions and updates</div>
        </div>
      </div>

      {/* Cyber Unified Toolbar */}
      <div className="cyber-toolbar">
        <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: '380px' }}>
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
            placeholder="Search audit trail by table, record ID, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field"
            style={{ paddingLeft: '36px', width: '100%' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span className="cyber-live-indicator">
            <span className="cyber-live-dot" />
            <span>Auditing Live</span>
          </span>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="input-field"
            style={{ width: '150px' }}
          >
            <option value="">All Actions</option>
            <option value="CREATE">CREATE / INSERT</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
            <option value="REGISTER">REGISTER</option>
            <option value="LOGIN">LOGIN</option>
            <option value="LOGOUT">LOGOUT</option>
            <option value="CUSTODY_LOG">CUSTODY_LOG</option>
            <option value="NEW_FINDING">NEW_FINDING</option>
            <option value="ADD_NOTE">ADD_NOTE</option>
            <option value="ROLE_CHANGE">ROLE_CHANGE</option>
          </select>

          <select
            value={tableFilter}
            onChange={(e) => setTableFilter(e.target.value)}
            className="input-field"
            style={{ width: '160px' }}
          >
            <option value="">All Entities</option>
            <option value="Case">Cases</option>
            <option value="Evidence">Evidence</option>
            <option value="Task">InvestigationTasks</option>
            <option value="User">Users</option>
            <option value="EvidenceNotes">EvidenceNotes</option>
            <option value="CustodyLogs">CustodyLogs</option>
            <option value="AnalysisFindings">AnalysisFindings</option>
          </select>
        </div>
      </div>

      {/* Main Audit Table Panel */}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">
            <History className="w-4 h-4 text-emerald-400" />
            <span>Recorded Security & Investigation Events ({filteredLogs.length})</span>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Immutable Audit Ledger
          </span>
        </div>

        <div className="table-wrap">
          <table className="cyber-table audit-table">
            <thead>
              <tr>
                <th className="col-id">Audit ID</th>
                <th style={{ width: '110px' }}>Operation</th>
                <th style={{ width: '150px' }}>Target Entity</th>
                <th style={{ width: '85px' }}>Record ID</th>
                <th style={{ minWidth: '240px', maxWidth: '420px' }}>Change Description / Payload</th>
                <th style={{ width: '150px' }}>Actor Attribution</th>
                <th className="col-date" style={{ width: '160px' }}>Execution Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    Loading audit trail...
                  </td>
                </tr>
              ) : filteredLogs.length > 0 ? (
                filteredLogs.map((log) => {
                  const act = (log.action || '').toUpperCase();
                  const isInsert = act.includes('INSERT') || act.includes('CREATE') || act.includes('REGISTER');
                  const isUpdate = act.includes('UPDATE') || act.includes('ROLE_CHANGE');
                  const isDelete = act.includes('DELETE');

                  const actionColor = isInsert ? '#10b981' : isUpdate ? '#38bdf8' : isDelete ? '#ef4444' : '#eab308';

                  return (
                    <tr key={log.log_id}>
                      <td className="col-id">
                        #{log.log_id}
                      </td>
                      <td style={{ width: '110px' }}>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '4px',
                            backgroundColor: `${actionColor}18`,
                            color: actionColor,
                            border: `1px solid ${actionColor}40`,
                            display: 'inline-block'
                          }}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td style={{ width: '150px' }}>
                        <span style={{ fontFamily: 'monospace', color: 'var(--text-main)', fontWeight: 600 }}>
                          {log.table_name || log.entity_type}
                        </span>
                      </td>
                      <td style={{ width: '85px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                        #{log.record_id ?? log.entity_id ?? '-'}
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', maxWidth: '420px', lineHeight: 1.45, wordBreak: 'break-word' }}>
                        {log.change_description || log.details || 'Direct database operation'}
                      </td>
                      <td style={{ width: '150px' }}>
                        <div style={{ color: 'var(--text-main)', fontWeight: 500, fontSize: '0.82rem' }}>
                          {log.user_name || 'System / Trigger'}
                        </div>
                        {log.user_id && (
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                            User ID #{log.user_id}
                          </div>
                        )}
                      </td>
                      <td className="col-date" style={{ width: '160px' }}>
                        {formatDateTime(log.created_at || log.timestamp)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No audit records match the selected filter.
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
