import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Plus,
  Search,
  Filter,
  ArrowRight,
  Trash2,
  Edit2,
  Clock,
  UserCheck,
  X,
  FileDown,
  FileText,
  Loader2,
  CheckCircle2,
  FolderKanban
} from 'lucide-react';
import { api } from '../services/api';
import { User, Case } from '../types';
import { formatDate, formatDateTime } from '../utils/date';

interface CasesPageProps {
  currentUser: User | null;
  onSelectCase: (caseId: number) => void;
  showToast: (msg: string, type?: 'info' | 'success' | 'error') => void;
}

export default function CasesPage({
  currentUser,
  onSelectCase,
  showToast
}: CasesPageProps) {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [incidentType, setIncidentType] = useState('Ransomware Incident');
  const [priority, setPriority] = useState('High');
  const [status, setStatus] = useState('Open');
  const [description, setDescription] = useState('');

  // Edit Modal
  const [editingCase, setEditingCase] = useState<Case | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editType, setEditType] = useState('');
  const [editPriority, setEditPriority] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
  const [editStatus, setEditStatus] = useState<'Open' | 'In Progress' | 'Closed'>('Open');
  const [editDescription, setEditDescription] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Report generation state
  const [downloadingReport, setDownloadingReport] = useState<{ caseId: number; format: 'pdf' | 'doc' } | null>(null);

  const isViewer = currentUser?.role === 'Viewer';

  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async () => {
    try {
      setLoading(true);
      const res = await api.getCases();
      setCases(res.cases || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch cases', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Please provide an incident case title', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.createCase({
        title: title.trim(),
        incident_type: incidentType,
        priority: priority as any,
        status: status as any,
        description: description.trim()
      });
      showToast(res.message || 'Investigation case dossier initialized', 'success');
      setShowCreateModal(false);
      setTitle('');
      setDescription('');
      loadCases();
    } catch (err: any) {
      showToast(err.message || 'Failed to open case', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (c: Case) => {
    setEditingCase(c);
    setEditTitle(c.title);
    setEditType(c.incident_type);
    setEditPriority(c.priority);
    setEditStatus(c.status);
    setEditDescription(c.description || '');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCase || !editTitle.trim()) return;

    try {
      setSavingEdit(true);
      const res = await api.updateCase(editingCase.case_id, {
        title: editTitle.trim(),
        incident_type: editType,
        priority: editPriority,
        status: editStatus,
        description: editDescription.trim()
      });
      showToast(res.message || 'Case updated successfully', 'success');
      setEditingCase(null);
      loadCases();
    } catch (err: any) {
      showToast(err.message || 'Failed to update case', 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteCase = async (caseId: number, caseTitle: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete case "${caseTitle}"? Linked evidence associations will be removed.`)) {
      return;
    }

    try {
      const res = await api.deleteCase(caseId);
      showToast(res.message || 'Case deleted successfully', 'success');
      loadCases();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete case', 'error');
    }
  };

  const handleDownloadReport = async (caseId: number, format: 'pdf' | 'doc', caseTitle: string) => {
    try {
      setDownloadingReport({ caseId, format });
      showToast(`Generating ${format.toUpperCase()} report for "${caseTitle}"...`, 'info');
      await api.downloadCaseReport(caseId, format);
      showToast(`Case #${caseId} ${format.toUpperCase()} report downloaded`, 'success');
    } catch (err: any) {
      showToast(err.message || `Failed to generate ${format.toUpperCase()} report`, 'error');
    } finally {
      setDownloadingReport(null);
    }
  };

  const filteredCases = cases.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(search.toLowerCase())) ||
      c.incident_type.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || c.status === statusFilter;
    const matchesPriority = !priorityFilter || c.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <div>
      {/* Page Title & Primary Actions */}
      <div className="page-header">
        <div className="page-header-info">
          <div className="breadcrumb">
            <span>ForenSight</span>
            <span className="crumb-sep">/</span>
            <span>Investigations</span>
            <span className="crumb-sep">/</span>
            <span className="crumb-active">Cases</span>
          </div>
          <h1 className="page-title cyber-glitch-text" data-text="Investigation Case Files">Investigation Case Files</h1>
          <p className="page-subtitle">
            Active incident investigation dossiers, priority classifications, and investigator assignments.
          </p>
        </div>

        <div className="page-header-actions">
          {!isViewer && (
            <button
              className="btn btn-primary"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="w-4 h-4 mr-1" />
              <span>New Case Dossier</span>
            </button>
          )}
        </div>
      </div>

      {/* Cyber Unified Toolbar */}
      <div className="cyber-toolbar">
        <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: '380px' }}>
          <Search
            className="w-4 h-4"
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
          />
          <input
            type="text"
            placeholder="Search cases by title, incident type, or scope..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field"
            style={{ paddingLeft: '36px' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span className="cyber-live-indicator">
            <span className="cyber-live-dot" />
            <span>Active Cases ({cases.length})</span>
          </span>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field"
            style={{ width: '130px' }}
          >
            <option value="">All Statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Closed">Closed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="input-field"
            style={{ width: '130px' }}
          >
            <option value="">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <button className="btn btn-outline btn-sm" onClick={loadCases}>
            Refresh
          </button>
        </div>
      </div>

      {/* Main Cases Table */}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">
            <FolderKanban className="w-4 h-4 text-sky-400" />
            <span>Investigation Registry ({filteredCases.length} records)</span>
          </div>
          <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
            Synchronized with MySQL <code>cases</code>
          </span>
        </div>

        <div className="table-wrap">
          <table className="cyber-table cases-table">
            <thead>
              <tr>
                <th className="col-id">Case ID</th>
                <th style={{ width: '280px', minWidth: '220px' }}>Case Title & Scope</th>
                <th style={{ width: '150px' }}>Incident Type</th>
                <th className="col-status">Priority</th>
                <th className="col-status">Status</th>
                <th style={{ width: '150px' }}>Lead Investigator</th>
                <th className="col-date">Opened Date</th>
                <th className="col-actions" style={{ width: '180px' }}>Dossier & Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    Loading cases from MySQL directory...
                  </td>
                </tr>
              ) : filteredCases.length > 0 ? (
                filteredCases.map((c) => {
                  const prioClass =
                    c.priority === 'Critical'
                      ? 'badge-critical'
                      : c.priority === 'High'
                      ? 'badge-high'
                      : c.priority === 'Medium'
                      ? 'badge-medium'
                      : 'badge-low';

                  const statusClass =
                    c.status === 'Open'
                      ? 'badge-open'
                      : c.status === 'In Progress'
                      ? 'badge-inprogress'
                      : 'badge-closed';

                  return (
                    <tr key={c.case_id}>
                      <td className="col-id">
                        FS-{c.case_id}
                      </td>
                      <td style={{ width: '280px', minWidth: '220px' }}>
                        <div
                          onClick={() => onSelectCase(c.case_id)}
                          style={{ fontWeight: 600, color: 'var(--text-main)', cursor: 'pointer', marginBottom: '2px' }}
                          title="Open case dossier"
                        >
                          {c.title}
                        </div>
                        {c.description && (
                          <div
                            style={{
                              fontSize: '0.76rem',
                              color: 'var(--text-muted)',
                              lineHeight: 1.4,
                              maxWidth: '360px',
                              wordBreak: 'break-word'
                            }}
                          >
                            {c.description}
                          </div>
                        )}
                      </td>
                      <td style={{ width: '150px', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{c.incident_type}</td>
                      <td className="col-status">
                        <span className={`badge ${prioClass}`}>{c.priority}</span>
                      </td>
                      <td className="col-status">
                        <span className={`badge ${statusClass}`}>{c.status}</span>
                      </td>
                      <td style={{ width: '150px', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                        {c.creator_name || 'Investigator'}
                      </td>
                      <td className="col-date">
                        {formatDate(c.created_at)}
                      </td>
                      <td className="col-actions" style={{ width: '180px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                          {/* PDF Report */}
                          <button
                            onClick={() => handleDownloadReport(c.case_id, 'pdf', c.title)}
                            disabled={downloadingReport !== null}
                            className="btn btn-outline btn-sm"
                            style={{ padding: '4px 7px', fontSize: '0.72rem', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#ef4444' }}
                            title="Generate PDF Dossier"
                          >
                            {downloadingReport?.caseId === c.case_id && downloadingReport.format === 'pdf' ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <FileDown className="w-3 h-3 text-red-500" />
                            )}
                            <span>PDF</span>
                          </button>

                          {/* DOC Report */}
                          <button
                            onClick={() => handleDownloadReport(c.case_id, 'doc', c.title)}
                            disabled={downloadingReport !== null}
                            className="btn btn-outline btn-sm"
                            style={{ padding: '4px 7px', fontSize: '0.72rem', borderColor: 'rgba(56, 189, 248, 0.3)', color: '#38bdf8' }}
                            title="Generate Word DOC Dossier"
                          >
                            {downloadingReport?.caseId === c.case_id && downloadingReport.format === 'doc' ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <FileText className="w-3 h-3 text-sky-400" />
                            )}
                            <span>DOC</span>
                          </button>

                          {/* Dossier button */}
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => onSelectCase(c.case_id)}
                            style={{ padding: '4px 8px', fontSize: '0.74rem' }}
                          >
                            <span>Dossier</span>
                            <ArrowRight className="w-3 h-3 ml-1" />
                          </button>

                          {/* Edit button */}
                          {!isViewer && (
                            <button
                              onClick={() => handleOpenEdit(c)}
                              className="btn btn-outline btn-sm"
                              style={{ padding: '4px 6px' }}
                              title="Edit case details"
                            >
                              <Edit2 className="w-3 h-3 text-slate-400" />
                            </button>
                          )}

                          {/* Delete button */}
                          {!isViewer && (
                            <button
                              onClick={() => handleDeleteCase(c.case_id, c.title)}
                              className="btn btn-outline btn-sm"
                              style={{ padding: '4px 6px', borderColor: 'rgba(239, 68, 68, 0.25)', color: '#ef4444' }}
                              title="Delete case dossier"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No investigation cases match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Case Modal */}
      {showCreateModal && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div className="modal-head">
              <h3>Open New Investigation Case Dossier</h3>
              <button className="modal-close-btn" onClick={() => setShowCreateModal(false)}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCase} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="input-label">Case Title *</label>
                <input
                  type="text"
                  placeholder="e.g., Finance Server Ransomware Infection"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                <div>
                  <label className="input-label">Incident Classification</label>
                  <select
                    value={incidentType}
                    onChange={(e) => setIncidentType(e.target.value)}
                    className="input-field"
                  >
                    <option value="Ransomware Incident">Ransomware Incident</option>
                    <option value="Data Exfiltration">Data Exfiltration</option>
                    <option value="Insider Threat">Insider Threat</option>
                    <option value="Phishing Campaign">Phishing Campaign</option>
                    <option value="Unauthorized Access">Unauthorized Access</option>
                    <option value="Malware Outbreak">Malware Outbreak</option>
                  </select>
                </div>

                <div>
                  <label className="input-label">Priority Level</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="input-field"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="input-label">Initial Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="input-field"
                >
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                </select>
              </div>

              <div>
                <label className="input-label">Briefing & Technical Scope</label>
                <textarea
                  rows={4}
                  placeholder="Document initial breach indicators, affected assets, and scope boundaries..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input-field"
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '8px' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                >
                  {submitting ? 'Committing to MySQL...' : 'Create Case Dossier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Case Modal */}
      {editingCase && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div className="modal-head">
              <h3>Edit Investigation Case #{editingCase.case_id}</h3>
              <button className="modal-close-btn" onClick={() => setEditingCase(null)}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="input-label">Case Title *</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                <div>
                  <label className="input-label">Incident Classification</label>
                  <select
                    value={editType}
                    onChange={(e) => setEditType(e.target.value)}
                    className="input-field"
                  >
                    <option value="Ransomware Incident">Ransomware Incident</option>
                    <option value="Data Exfiltration">Data Exfiltration</option>
                    <option value="Insider Threat">Insider Threat</option>
                    <option value="Phishing Campaign">Phishing Campaign</option>
                    <option value="Unauthorized Access">Unauthorized Access</option>
                    <option value="Malware Outbreak">Malware Outbreak</option>
                  </select>
                </div>

                <div>
                  <label className="input-label">Priority Level</label>
                  <select
                    value={editPriority}
                    onChange={(e: any) => setEditPriority(e.target.value)}
                    className="input-field"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="input-label">Investigation Status</label>
                <select
                  value={editStatus}
                  onChange={(e: any) => setEditStatus(e.target.value)}
                  className="input-field"
                >
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <div>
                <label className="input-label">Briefing & Technical Scope</label>
                <textarea
                  rows={4}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="input-field"
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '8px' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setEditingCase(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="btn btn-primary"
                >
                  {savingEdit ? 'Saving Changes...' : 'Save Case Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
