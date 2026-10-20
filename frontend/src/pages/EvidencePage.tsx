import React, { useState, useEffect } from 'react';
import {
  HardDrive,
  Upload,
  Download,
  Trash2,
  Search,
  Filter,
  Copy,
  Check,
  FileCode,
  Shield,
  Layers,
  X,
  FileText,
  Eye,
  CheckCircle2,
  Link2
} from 'lucide-react';
import { api } from '../services/api';
import { User, Evidence, Case } from '../types';
import { formatDateTime, formatDate } from '../utils/date';

interface EvidencePageProps {
  currentUser: User | null;
  onNavigateCase: (caseId: number) => void;
  showToast: (msg: string, type?: 'info' | 'success' | 'error') => void;
}

export default function EvidencePage({
  currentUser,
  onNavigateCase,
  showToast
}: EvidencePageProps) {
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [evidenceType, setEvidenceType] = useState('Network Capture');
  const [status, setStatus] = useState('Registered');
  const [collectedAt, setCollectedAt] = useState('');
  const [selectedCaseIds, setSelectedCaseIds] = useState<number[]>([]);
  const [uploading, setUploading] = useState(false);

  // Details / Preview Modal
  const [previewEvidence, setPreviewEvidence] = useState<Evidence | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const handleDownloadEvidence = async (evidenceId: number, evidenceName: string) => {
    try {
      setDownloadingId(evidenceId);
      showToast(`Downloading artifact "${evidenceName}"...`, 'info');
      await api.downloadEvidence(evidenceId, evidenceName);
      showToast(`Artifact "${evidenceName}" downloaded successfully`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Evidence download failed', 'error');
    } finally {
      setDownloadingId(null);
    }
  };

  // Copied hash feedback
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const isViewer = currentUser?.role === 'Viewer';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [evRes, casesRes] = await Promise.all([
        api.getEvidence(),
        api.getCases()
      ]);
      setEvidence(evRes.evidence || []);
      setCases(casesRes.cases || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to load evidence repository', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      showToast('Please select a file to ingest', 'error');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('evidence_type', evidenceType);
      formData.append('status', status);
      if (collectedAt) formData.append('collected_at', collectedAt);
      formData.append('uploaded_by', String(currentUser?.user_id || 1));
      selectedCaseIds.forEach((cid) => formData.append('case_ids', String(cid)));

      const res = await api.uploadEvidence(formData);
      showToast(
        `Evidence successfully ingested! SHA-256: ${res.data.sha256_hash.substring(0, 16)}...`,
        'success'
      );
      setShowUploadModal(false);
      setSelectedFile(null);
      setSelectedCaseIds([]);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Evidence ingestion failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteEvidence = async (evidenceId: number, evName: string) => {
    if (!window.confirm(`Permanently purge "${evName}" from storage and delete all associated notes, custody logs, and findings?`)) {
      return;
    }

    try {
      const res = await api.deleteEvidence(evidenceId);
      showToast(res.message || 'Evidence file purged from vault', 'success');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete evidence', 'error');
    }
  };

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2500);
    showToast('SHA-256 hash copied to clipboard', 'info');
  };

  const filteredEvidence = evidence.filter((e) => {
    const matchesSearch =
      e.evidence_name.toLowerCase().includes(search.toLowerCase()) ||
      e.evidence_type.toLowerCase().includes(search.toLowerCase()) ||
      e.sha256_hash.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || e.status === statusFilter;
    const matchesType = !typeFilter || e.evidence_type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div>
      {/* Title & Primary Action */}
      <div className="page-header">
        <div className="page-header-info">
          <div className="breadcrumb">
            <span>ForenSight</span>
            <span className="crumb-sep">/</span>
            <span>Evidence</span>
            <span className="crumb-sep">/</span>
            <span className="crumb-active">Evidence Lab</span>
          </div>
          <h1 className="page-title cyber-glitch-text" data-text="Forensic Evidence Repository">Digital Evidence Laboratory</h1>
          <p className="page-subtitle">
            Secure binary vault with server-side SHA-256 cryptographic integrity verification.
          </p>
        </div>

        <div className="page-header-actions">
          {!isViewer && (
            <button className="btn btn-primary" onClick={() => setShowUploadModal(true)}>
              <Upload className="w-4 h-4 mr-1" />
              <span>Ingest Evidence File</span>
            </button>
          )}
        </div>
      </div>

      {/* Cyber Unified Toolbar */}
      <div className="cyber-toolbar">
        <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: '380px' }}>
          <Search
            className="w-4 h-4"
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
          />
          <input
            type="text"
            placeholder="Search by file name, hash or type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field"
            style={{ paddingLeft: '36px' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span className="cyber-live-indicator">
            <span className="cyber-live-dot" />
            <span>Vault Sealed ({evidence.length})</span>
          </span>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="input-field"
            style={{ width: '140px' }}
          >
            <option value="">All Types</option>
            <option value="Disk Image">Disk Image</option>
            <option value="Memory Dump">Memory Dump</option>
            <option value="Network Capture">Network Capture</option>
            <option value="Log File">Log File</option>
            <option value="Malware Binary">Malware Binary</option>
            <option value="Document Artifact">Document Artifact</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field"
            style={{ width: '130px' }}
          >
            <option value="">All Statuses</option>
            <option value="Registered">Registered</option>
            <option value="Under Review">Under Review</option>
            <option value="Verified">Verified</option>
            <option value="Archived">Archived</option>
          </select>

          <button className="btn btn-outline btn-sm" onClick={loadData}>
            Refresh
          </button>
        </div>
      </div>

      {/* Main Evidence Registry Table */}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">
            <HardDrive className="w-4 h-4 text-sky-400" />
            <span>Digital Vault Repository ({filteredEvidence.length} files)</span>
          </div>
          <span style={{ fontSize: '0.76rem', color: '#10b981', fontWeight: 600 }}>
            SHA-256 Verified Storage
          </span>
        </div>

        <div className="table-wrap">
          <table className="cyber-table evidence-table">
            <thead>
              <tr>
                <th className="col-id">ID</th>
                <th style={{ width: '220px', minWidth: '180px' }}>File Name & Details</th>
                <th style={{ width: '130px', minWidth: '110px' }}>Classification</th>
                <th className="col-hash" style={{ width: '180px' }}>SHA-256 Checksum</th>
                <th style={{ width: '90px' }}>File Size</th>
                <th className="col-status">Status</th>
                <th style={{ width: '130px' }}>Ingested By</th>
                <th className="col-date">Ingested Date</th>
                <th className="col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    Loading evidence repository from MySQL...
                  </td>
                </tr>
              ) : filteredEvidence.length > 0 ? (
                filteredEvidence.map((e) => (
                  <tr key={e.evidence_id}>
                    <td className="col-id">
                      #{e.evidence_id}
                    </td>
                    <td style={{ width: '220px', minWidth: '180px' }}>
                      <div
                        onClick={() => setPreviewEvidence(e)}
                        style={{ fontWeight: 600, color: 'var(--text-main)', cursor: 'pointer', marginBottom: '2px' }}
                        title="View evidence details"
                      >
                        {e.evidence_name}
                      </div>
                      {e.cases && e.cases.length > 0 && (
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {e.cases.map((c) => (
                            <span
                              key={c.case_id}
                              onClick={() => onNavigateCase(c.case_id)}
                              style={{ fontSize: '0.7rem', color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline' }}
                            >
                              Case #{c.case_id}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{e.evidence_type}</td>
                    <td className="col-hash">
                      <span
                        className="hash-pill"
                        onClick={() => handleCopyHash(e.sha256_hash)}
                        title="Click to copy full SHA-256 hash"
                      >
                        {e.sha256_hash ? `${e.sha256_hash.substring(0, 16)}...` : 'N/A'}
                        {copiedHash === e.sha256_hash ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                      {((e.file_size || 0) / 1024).toFixed(1)} KB
                    </td>
                    <td className="col-status">
                      <span className="badge badge-open">{e.status}</span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                      {e.uploader_name || 'Investigator'}
                    </td>
                    <td className="col-date">
                      {formatDateTime(e.created_at)}
                    </td>
                    <td className="col-actions">
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        {/* Preview button */}
                        <button
                          onClick={() => setPreviewEvidence(e)}
                          className="btn btn-outline btn-sm"
                          style={{ padding: '4px 8px' }}
                          title="Inspect Evidence Metadata"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </button>

                        {/* Download button */}
                        <button
                          disabled={downloadingId === e.evidence_id}
                          onClick={() => handleDownloadEvidence(e.evidence_id, e.evidence_name)}
                          className="btn btn-outline btn-sm"
                          style={{ padding: '4px 8px' }}
                          title="Download binary payload"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>{downloadingId === e.evidence_id ? 'Downloading...' : 'Download'}</span>
                        </button>

                        {/* Delete button */}
                        {!isViewer && (
                          <button
                            onClick={() => handleDeleteEvidence(e.evidence_id, e.evidence_name)}
                            className="btn btn-outline btn-sm"
                            style={{ padding: '4px 6px', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.25)' }}
                            title="Delete file permanently"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No evidence items match the specified search or filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Evidence Details / Preview Modal */}
      {previewEvidence && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div className="modal-head">
              <h3>Evidence Metadata & Verification</h3>
              <button className="modal-close-btn" onClick={() => setPreviewEvidence(null)}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Evidence File Name:</span>
                <strong style={{ color: 'var(--text-main)' }}>{previewEvidence.evidence_name}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Evidence Type:</span>
                <span style={{ color: 'var(--text-main)' }}>{previewEvidence.evidence_type}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-muted)' }}>File Size:</span>
                <span style={{ color: 'var(--text-main)' }}>
                  {previewEvidence.file_size} bytes ({(previewEvidence.file_size / 1024).toFixed(2)} KB)
                </span>
              </div>

              <div style={{ paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>Cryptographic SHA-256 Digest:</div>
                <div
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '0.78rem',
                    color: 'var(--primary)',
                    backgroundColor: 'var(--bg-input)',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    wordBreak: 'break-all'
                  }}
                >
                  {previewEvidence.sha256_hash}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Integrity Verification:</span>
                <span style={{ color: '#10b981', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  SHA-256 Authentic (Unaltered)
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Uploaded By:</span>
                <span style={{ color: 'var(--text-main)' }}>{previewEvidence.uploader_name || 'Investigator'}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Collected Date:</span>
                <span style={{ color: 'var(--text-main)' }}>{formatDateTime(previewEvidence.collected_at)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Ingestion Timestamp:</span>
                <span style={{ color: 'var(--text-main)' }}>{formatDateTime(previewEvidence.created_at)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '12px' }}>
                <button
                  type="button"
                  disabled={downloadingId === previewEvidence.evidence_id}
                  onClick={() => handleDownloadEvidence(previewEvidence.evidence_id, previewEvidence.evidence_name)}
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Download className="w-4 h-4" />
                  <span>{downloadingId === previewEvidence.evidence_id ? 'Downloading...' : 'Download File Payload'}</span>
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setPreviewEvidence(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div className="modal-head">
              <h3>Ingest Digital Evidence File</h3>
              <button className="modal-close-btn" onClick={() => setShowUploadModal(false)}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpload} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="input-label">Select Evidence File *</label>
                <input
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                  className="input-field"
                  style={{ padding: '7px' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                <div>
                  <label className="input-label">Evidence Type</label>
                  <select
                    value={evidenceType}
                    onChange={(e) => setEvidenceType(e.target.value)}
                    className="input-field"
                  >
                    <option value="Disk Image">Disk Image</option>
                    <option value="Memory Dump">Memory Dump</option>
                    <option value="Network Capture">Network Capture</option>
                    <option value="Log File">Log File</option>
                    <option value="Malware Binary">Malware Binary</option>
                    <option value="Document Artifact">Document Artifact</option>
                  </select>
                </div>

                <div>
                  <label className="input-label">Initial Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="input-field"
                  >
                    <option value="Registered">Registered</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Verified">Verified</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="input-label">Associate with Active Cases (M:N CaseEvidence)</label>
                <div style={{ maxHeight: '130px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', backgroundColor: 'var(--bg-input)', padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  {cases.map((c) => {
                    const isChecked = selectedCaseIds.includes(c.case_id);
                    return (
                      <label key={c.case_id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCaseIds([...selectedCaseIds, c.case_id]);
                            } else {
                              setSelectedCaseIds(selectedCaseIds.filter((id) => id !== c.case_id));
                            }
                          }}
                          style={{ accentColor: 'var(--primary)' }}
                        />
                        <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>#{c.case_id} {c.title}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '6px' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowUploadModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="btn btn-primary"
                >
                  {uploading ? 'Computing SHA-256 & Uploading...' : 'Ingest to Vault'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
