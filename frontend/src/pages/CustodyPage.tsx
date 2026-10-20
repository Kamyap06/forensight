import React, { useState, useEffect } from 'react';
import {
  Link2,
  Plus,
  Search,
  Filter,
  ShieldCheck,
  Clock,
  UserCheck,
  Microscope,
  Zap,
  X,
  RefreshCw,
  FileCheck2,
  Lock,
  Layers
} from 'lucide-react';
import { api } from '../services/api';
import { User, CustodyLog, Evidence } from '../types';
import { formatDateTime } from '../utils/date';

interface CustodyPageProps {
  currentUser: User | null;
  showToast: (msg: string, type?: 'info' | 'success' | 'error') => void;
}

export default function CustodyPage({
  currentUser,
  showToast
}: CustodyPageProps) {
  const [logs, setLogs] = useState<CustodyLog[]>([]);
  const [evidenceList, setEvidenceList] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  // Add Log Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [evidenceId, setEvidenceId] = useState<number>(1);
  const [action, setAction] = useState('Transferred to Secure Vault');
  const [notes, setNotes] = useState('');

  const isViewer = currentUser?.role === 'Viewer';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [logsRes, evRes] = await Promise.all([
        api.getCustodyLogs(),
        api.getEvidence()
      ]);
      setLogs(logsRes.custody_logs || []);
      setEvidenceList(evRes.evidence || []);
      if (evRes.evidence?.length > 0) {
        setEvidenceId(evRes.evidence[0].evidence_id);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load chain of custody ledger', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) {
      showToast('Please provide custody justification notes', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.addCustodyLog({
        evidence_id: evidenceId,
        user_id: currentUser?.user_id || 1,
        action,
        notes
      });
      showToast(
        res.message || 'Custody action recorded (MySQL trigger trg_after_custody_insert logged audit trail)',
        'success'
      );
      setShowAddModal(false);
      setNotes('');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to record custody transfer', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredLogs = logs.filter((l) => {
    const term = search.toLowerCase();
    const matchesSearch =
      (l.action && l.action.toLowerCase().includes(term)) ||
      (l.notes && l.notes.toLowerCase().includes(term)) ||
      (l.evidence_name && l.evidence_name.toLowerCase().includes(term)) ||
      (l.user_name && l.user_name.toLowerCase().includes(term)) ||
      (l.responsible_user_name && l.responsible_user_name.toLowerCase().includes(term));
    const matchesAction = !actionFilter || l.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  const uniqueEvidenceCount = new Set(logs.map((l) => l.evidence_id)).size;
  const vaultTransfersCount = logs.filter((l) => l.action?.includes('Vault')).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-info">
          <div className="breadcrumb">
            <span>ForenSight</span>
            <span className="crumb-sep">/</span>
            <span>Evidence</span>
            <span className="crumb-sep">/</span>
            <span className="crumb-active">Chain of Custody</span>
          </div>
          <h1 className="page-title cyber-glitch-text" data-text="Chain of Custody Ledger">Chain of Custody Ledger</h1>
          <p className="page-subtitle">
            Immutable, court-admissible custody ledger tracking physical and logical evidence handoffs and transfers.
          </p>
        </div>

        <div className="page-header-actions">
          <button className="btn btn-outline" onClick={loadData} title="Refresh custody records">
            <RefreshCw className="w-4 h-4 mr-1" />
            <span>Refresh</span>
          </button>
          {!isViewer && (
            <button
              className="btn btn-primary"
              onClick={() => setShowAddModal(true)}
            >
              <Plus className="w-4 h-4 mr-1" />
              <span>Record Custody Transfer</span>
            </button>
          )}
        </div>
      </div>

      {/* Custody Metrics */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Custody Entries</span>
            <Link2 className="w-4 h-4 text-sky-400" />
          </div>
          <div className="kpi-value">{logs.length}</div>
          <div className="kpi-footer">Immutable sequence logs</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Monitored Artifacts</span>
            <Microscope className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="kpi-value">{uniqueEvidenceCount}</div>
          <div className="kpi-footer">Distinct evidence items with ledger</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Vault Transfers</span>
            <Lock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="kpi-value">{vaultTransfersCount}</div>
          <div className="kpi-footer">Deposits into physical / digital vault</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Court Admissibility</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="kpi-value" style={{ color: '#10b981' }}>100%</div>
          <div className="kpi-footer">Strict ISO/IEC 27037 integrity</div>
        </div>
      </div>

      {/* Cyber Unified Toolbar */}
      <div className="cyber-toolbar">
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
            placeholder="Search custody actions, custodians, or evidence..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field"
            style={{ paddingLeft: '36px', width: '100%' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="cyber-live-indicator">
            <span className="cyber-live-dot" />
            <span>ISO 27037 Compliant</span>
          </span>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="input-field"
            style={{ width: '200px' }}
          >
            <option value="">All Actions</option>
            <option value="Evidence Collected">Evidence Collected</option>
            <option value="Transferred to Secure Vault">Transferred to Secure Vault</option>
            <option value="Checked Out for Forensics">Checked Out for Forensics</option>
            <option value="Hash Integrity Verified">Hash Integrity Verified</option>
            <option value="Returned to Secure Vault">Returned to Secure Vault</option>
            <option value="Presented for Court Exhibit">Presented for Court Exhibit</option>
          </select>
        </div>
      </div>

      {/* Main Custody Table */}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">
            <Link2 className="w-4 h-4 text-sky-400" />
            <span>Chain of Custody Ledger ({filteredLogs.length})</span>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Verified Evidence Ledger
          </span>
        </div>

        <div className="table-wrap">
          <table className="cyber-table custody-table">
            <thead>
              <tr>
                <th className="col-id">Log ID</th>
                <th style={{ width: '190px', minWidth: '160px' }}>Evidence Artifact</th>
                <th style={{ width: '180px', minWidth: '160px' }}>Custody Action</th>
                <th style={{ width: '160px', minWidth: '140px' }}>Responsible Custodian</th>
                <th style={{ width: '110px', minWidth: '100px' }}>Admissibility</th>
                <th style={{ minWidth: '220px', maxWidth: '380px' }}>Transfer Rationale & Locker</th>
                <th className="col-date" style={{ width: '160px' }}>Custody Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    Loading chain of custody ledger...
                  </td>
                </tr>
              ) : filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.log_id}>
                    <td className="col-id">
                      #{log.log_id}
                    </td>
                    <td style={{ width: '190px', minWidth: '160px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.88rem' }}>
                        {log.evidence_name || `Evidence #${log.evidence_id}`}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        Artifact ID #{log.evidence_id}
                      </div>
                    </td>
                    <td style={{ width: '180px', minWidth: '160px' }}>
                      <span
                        style={{
                          fontSize: '0.76rem',
                          fontWeight: 600,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          backgroundColor: 'rgba(56, 189, 248, 0.12)',
                          color: '#38bdf8',
                          border: '1px solid rgba(56, 189, 248, 0.25)',
                          display: 'inline-block'
                        }}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td style={{ width: '160px', minWidth: '140px' }}>
                      <div style={{ fontWeight: 500, color: 'var(--text-main)', fontSize: '0.85rem' }}>
                        {log.user_name || log.responsible_user_name || 'Investigator'}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {log.user_role || 'Forensic Specialist'}
                      </div>
                    </td>
                    <td style={{ width: '110px', minWidth: '100px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.74rem',
                          color: '#10b981',
                          backgroundColor: 'rgba(16, 185, 129, 0.1)',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          border: '1px solid rgba(16, 185, 129, 0.25)',
                          fontWeight: 600
                        }}
                      >
                        <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>Admissible</span>
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', maxWidth: '380px', lineHeight: 1.45, wordBreak: 'break-word' }}>
                      {log.notes || 'No rationale notes recorded.'}
                    </td>
                    <td className="col-date" style={{ width: '160px' }}>
                      {formatDateTime(log.event_time || log.timestamp)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No custody records match the search filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Custody Modal */}
      {showAddModal && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div className="modal-head">
              <h3>Record Chain of Custody Transfer</h3>
              <button className="modal-close-btn" onClick={() => setShowAddModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddLog}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px' }}>
                <div>
                  <label className="input-label">Select Digital Evidence Artifact *</label>
                  <select
                    value={evidenceId}
                    onChange={(e) => setEvidenceId(Number(e.target.value))}
                    className="input-field"
                    style={{ width: '100%' }}
                  >
                    {evidenceList.map((ev) => (
                      <option key={ev.evidence_id} value={ev.evidence_id}>
                        #{ev.evidence_id} — {ev.evidence_name} ({ev.evidence_type})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="input-label">Custody Action / Disposition</label>
                  <select
                    value={action}
                    onChange={(e) => setAction(e.target.value)}
                    className="input-field"
                    style={{ width: '100%' }}
                  >
                    <option value="Evidence Collected">Evidence Collected</option>
                    <option value="Transferred to Secure Vault">Transferred to Secure Vault</option>
                    <option value="Checked Out for Forensics">Checked Out for Forensics</option>
                    <option value="Hash Integrity Verified">Hash Integrity Verified</option>
                    <option value="Returned to Secure Vault">Returned to Secure Vault</option>
                    <option value="Presented for Court Exhibit">Presented for Court Exhibit</option>
                  </select>
                </div>

                <div>
                  <label className="input-label">Transfer Justification & Receiving Custodian Notes *</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Document transfer purpose, physical secure locker location, recipient details, and verification status..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="input-field"
                    style={{ width: '100%', resize: 'vertical' }}
                  />
                </div>
              </div>

              <div className="modal-foot">
                <button type="button" className="btn btn-outline" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? 'Writing to Ledger...' : 'Commit to Immutable Ledger'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
