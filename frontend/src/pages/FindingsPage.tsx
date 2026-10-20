import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Plus,
  Search,
  Filter,
  Microscope,
  ShieldAlert,
  Zap,
  X,
  RefreshCw,
  Flame,
  Shield,
  FileSearch
} from 'lucide-react';
import { api } from '../services/api';
import { User, Finding, Evidence } from '../types';
import { formatDateTime } from '../utils/date';

interface FindingsPageProps {
  currentUser: User | null;
  showToast: (msg: string, type?: 'info' | 'success' | 'error') => void;
}

export default function FindingsPage({
  currentUser,
  showToast
}: FindingsPageProps) {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [evidenceList, setEvidenceList] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');

  // Add Finding Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [evidenceId, setEvidenceId] = useState<number>(1);
  const [findingType, setFindingType] = useState('Malware Detection');
  const [severity, setSeverity] = useState('High');
  const [description, setDescription] = useState('');

  const isViewer = currentUser?.role === 'Viewer';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [findingsRes, evRes] = await Promise.all([
        api.getFindings(),
        api.getEvidence()
      ]);
      setFindings(findingsRes.findings || []);
      setEvidenceList(evRes.evidence || []);
      if (evRes.evidence?.length > 0) {
        setEvidenceId(evRes.evidence[0].evidence_id);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load analysis findings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFinding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      showToast('Please enter finding details', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.createFinding({
        evidence_id: evidenceId,
        finding_type: findingType,
        severity,
        description
      });
      showToast(
        res.message || 'Finding recorded (MySQL trigger trg_after_finding_insert logged audit trail)',
        'success'
      );
      setShowAddModal(false);
      setDescription('');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to document finding', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredFindings = findings.filter((f) => {
    const matchesSearch =
      f.finding_type.toLowerCase().includes(search.toLowerCase()) ||
      f.description.toLowerCase().includes(search.toLowerCase()) ||
      (f.evidence_name && f.evidence_name.toLowerCase().includes(search.toLowerCase()));
    const matchesSeverity = !severityFilter || f.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  const criticalCount = findings.filter((f) => f.severity === 'Critical').length;
  const highCount = findings.filter((f) => f.severity === 'High').length;
  const mediumCount = findings.filter((f) => f.severity === 'Medium').length;
  const lowCount = findings.filter((f) => f.severity === 'Low').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-info">
          <div className="breadcrumb">
            <span>ForenSight</span>
            <span className="crumb-sep">/</span>
            <span>Investigations</span>
            <span className="crumb-sep">/</span>
            <span className="crumb-active">Findings</span>
          </div>
          <h1 className="page-title cyber-glitch-text" data-text="Forensic Analysis Findings">Forensic Analysis Findings</h1>
          <p className="page-subtitle">
            Catalog and analyze verified Indicators of Compromise (IOCs), threat classifications, and adversary tradecraft.
          </p>
        </div>

        <div className="page-header-actions">
          <button className="btn btn-outline" onClick={loadData} title="Refresh findings">
            <RefreshCw className="w-4 h-4 mr-1" />
            <span>Refresh</span>
          </button>
          {!isViewer && (
            <button
              className="btn btn-primary"
              onClick={() => setShowAddModal(true)}
            >
              <Plus className="w-4 h-4 mr-1" />
              <span>Document Forensic Finding</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Severity Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Total Findings</span>
            <FileSearch className="w-4 h-4 text-sky-400" />
          </div>
          <div className="kpi-value">{findings.length}</div>
          <div className="kpi-footer">Across all evidence artifacts</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Critical Threats</span>
            <Flame className="w-4 h-4 text-red-500" />
          </div>
          <div className="kpi-value" style={{ color: '#ef4444' }}>{criticalCount}</div>
          <div className="kpi-footer">Requires immediate countermeasure</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">High Threats</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="kpi-value" style={{ color: '#f59e0b' }}>{highCount}</div>
          <div className="kpi-footer">Elevated adversary activity</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Medium / Low</span>
            <Shield className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="kpi-value" style={{ color: '#10b981' }}>{mediumCount + lowCount}</div>
          <div className="kpi-footer">Informational & telemetry artifacts</div>
        </div>
      </div>

      {/* Cyber Unified Toolbar */}
      <div className="cyber-toolbar">
        <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: '420px' }}>
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
            placeholder="Search findings, IOCs, or evidence files..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field"
            style={{ paddingLeft: '36px', width: '100%' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="cyber-live-indicator">
            <span className="cyber-live-dot" />
            <span>Telemetry Active</span>
          </span>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="input-field"
            style={{ width: '140px' }}
          >
            <option value="">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* Main Findings Table Panel */}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span>Forensic Threat Indicators ({filteredFindings.length})</span>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Verified Threat Intelligence
          </span>
        </div>

        <div className="table-wrap">
          <table className="cyber-table findings-table">
            <thead>
              <tr>
                <th className="col-id">ID</th>
                <th style={{ width: '190px', minWidth: '160px' }}>Evidence Artifact</th>
                <th style={{ width: '170px', minWidth: '140px' }}>Threat Classification</th>
                <th className="col-status">Severity</th>
                <th style={{ minWidth: '260px', maxWidth: '440px' }}>Technical Description & Indicators</th>
                <th className="col-date" style={{ width: '160px' }}>Recorded Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    Loading forensic findings...
                  </td>
                </tr>
              ) : filteredFindings.length > 0 ? (
                filteredFindings.map((f) => {
                  const prioClass =
                    f.severity === 'Critical'
                      ? 'badge-critical'
                      : f.severity === 'High'
                      ? 'badge-high'
                      : f.severity === 'Medium'
                      ? 'badge-medium'
                      : 'badge-low';

                  return (
                    <tr key={f.finding_id}>
                      <td className="col-id">
                        #{f.finding_id}
                      </td>
                      <td style={{ width: '190px', minWidth: '160px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.88rem' }}>
                          {f.evidence_name || `Evidence #${f.evidence_id}`}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          Artifact ID #{f.evidence_id}
                        </div>
                      </td>
                      <td style={{ width: '170px', minWidth: '140px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                        {f.finding_type}
                      </td>
                      <td className="col-status">
                        <span className={`badge ${prioClass}`}>
                          {f.severity}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: '440px', lineHeight: 1.45, wordBreak: 'break-word' }}>
                        {f.description}
                      </td>
                      <td className="col-date" style={{ width: '160px' }}>
                        {formatDateTime(f.created_at)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No forensic findings match the active filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Finding Modal */}
      {showAddModal && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div className="modal-head">
              <h3>Document Forensic Finding</h3>
              <button className="modal-close-btn" onClick={() => setShowAddModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddFinding}>
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label className="input-label">Threat Classification</label>
                    <select
                      value={findingType}
                      onChange={(e) => setFindingType(e.target.value)}
                      className="input-field"
                      style={{ width: '100%' }}
                    >
                      <option value="Malware Detection">Malware Detection</option>
                      <option value="C2 Communication Detected">C2 Communication Detected</option>
                      <option value="Lateral Movement">Lateral Movement</option>
                      <option value="Privilege Escalation">Privilege Escalation</option>
                      <option value="Encrypted Payload">Encrypted Payload</option>
                      <option value="Data Exfiltration">Data Exfiltration</option>
                      <option value="Credential Dumping">Credential Dumping</option>
                    </select>
                  </div>

                  <div>
                    <label className="input-label">Severity Level</label>
                    <select
                      value={severity}
                      onChange={(e) => setSeverity(e.target.value)}
                      className="input-field"
                      style={{ width: '100%' }}
                    >
                      <option value="Critical">Critical</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="input-label">Technical Finding & IOC Details *</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Document technical observations, decompiled signatures, IP addresses, hashes, or payload behaviors..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
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
                  {submitting ? 'Writing to MySQL...' : 'Save & Trigger Audit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
