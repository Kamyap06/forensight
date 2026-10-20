import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Microscope,
  UserCheck,
  Clock,
  X,
  RefreshCw,
  BookOpen,
  MessageSquare,
  ShieldCheck
} from 'lucide-react';
import { api } from '../services/api';
import { User, EvidenceNote, Evidence } from '../types';
import { formatDateTime } from '../utils/date';

interface NotesPageProps {
  currentUser: User | null;
  showToast: (msg: string, type?: 'info' | 'success' | 'error') => void;
}

export default function NotesPage({
  currentUser,
  showToast
}: NotesPageProps) {
  const [notes, setNotes] = useState<EvidenceNote[]>([]);
  const [evidenceList, setEvidenceList] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');

  // Add Note Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [evidenceId, setEvidenceId] = useState<number>(1);
  const [noteText, setNoteText] = useState('');

  const isViewer = currentUser?.role === 'Viewer';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [notesRes, evRes] = await Promise.all([
        api.getNotes(),
        api.getEvidence()
      ]);
      setNotes(notesRes.notes || []);
      setEvidenceList(evRes.evidence || []);
      if (evRes.evidence?.length > 0) {
        setEvidenceId(evRes.evidence[0].evidence_id);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load evidence annotations', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) {
      showToast('Please enter note text', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.addNote({
        evidence_id: evidenceId,
        user_id: currentUser?.user_id || 1,
        note_text: noteText
      });
      showToast(res.message || 'Investigator note added to evidence', 'success');
      setShowAddModal(false);
      setNoteText('');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to add note', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredNotes = notes.filter((n) => {
    const term = search.toLowerCase();
    const matchesSearch =
      (n.note_text && n.note_text.toLowerCase().includes(term)) ||
      (n.evidence_name && n.evidence_name.toLowerCase().includes(term)) ||
      (n.author_name && n.author_name.toLowerCase().includes(term)) ||
      (n.user_name && n.user_name.toLowerCase().includes(term));
    return matchesSearch;
  });

  const uniqueEvidenceCount = new Set(notes.map((n) => n.evidence_id)).size;
  const uniqueAuthorsCount = new Set(notes.map((n) => n.author_name || n.user_name)).size;

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
            <span className="crumb-active">Notes</span>
          </div>
          <h1 className="page-title cyber-glitch-text" data-text="Investigator Evidence Notes">Evidence Analysis Notes</h1>
          <p className="page-subtitle">
            Technical forensic annotations, memory offsets, reverse-engineering commentary, and analytical deductions.
          </p>
        </div>

        <div className="page-header-actions">
          <button className="btn btn-outline" onClick={loadData} title="Refresh notes">
            <RefreshCw className="w-4 h-4 mr-1" />
            <span>Refresh</span>
          </button>
          {!isViewer && (
            <button
              className="btn btn-primary"
              onClick={() => setShowAddModal(true)}
            >
              <Plus className="w-4 h-4 mr-1" />
              <span>Add Technical Note</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Technical Notes</span>
            <MessageSquare className="w-4 h-4 text-sky-400" />
          </div>
          <div className="kpi-value">{notes.length}</div>
          <div className="kpi-footer">Investigative annotations recorded</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Annotated Artifacts</span>
            <Microscope className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="kpi-value">{uniqueEvidenceCount}</div>
          <div className="kpi-footer">Digital evidence files with notes</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Contributing Analysts</span>
            <UserCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="kpi-value">{uniqueAuthorsCount}</div>
          <div className="kpi-footer">Certified investigators & specialists</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Intelligence Status</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="kpi-value" style={{ color: '#10b981' }}>Active</div>
          <div className="kpi-footer">Peer-reviewed forensic deductions</div>
        </div>
      </div>

      {/* Cyber Unified Toolbar */}
      <div className="cyber-toolbar">
        <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: '440px' }}>
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
            placeholder="Search investigator notes, evidence, or authors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field"
            style={{ paddingLeft: '36px', width: '100%' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="cyber-live-indicator">
            <span className="cyber-live-dot" />
            <span>Annotations Linked</span>
          </span>
        </div>
      </div>

      {/* Main Notes Table Panel */}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">
            <FileText className="w-4 h-4 text-sky-400" />
            <span>Investigator Analysis Annotations ({filteredNotes.length})</span>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Preserved Forensic Annotations
          </span>
        </div>

        <div className="table-wrap">
          <table className="cyber-table notes-table">
            <thead>
              <tr>
                <th className="col-id">Note ID</th>
                <th style={{ width: '200px', minWidth: '170px' }}>Target Artifact</th>
                <th style={{ width: '160px', minWidth: '140px' }}>Contributing Analyst</th>
                <th style={{ minWidth: '280px', maxWidth: '500px' }}>Technical Note & Hypothesis</th>
                <th className="col-date" style={{ width: '160px' }}>Recorded Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    Loading technical notes...
                  </td>
                </tr>
              ) : filteredNotes.length > 0 ? (
                filteredNotes.map((n) => (
                  <tr key={n.note_id}>
                    <td className="col-id">
                      #{n.note_id}
                    </td>
                    <td style={{ width: '200px', minWidth: '170px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.88rem' }}>
                        {n.evidence_name || `Evidence #${n.evidence_id}`}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        Artifact ID #{n.evidence_id}
                      </div>
                    </td>
                    <td style={{ width: '160px', minWidth: '140px' }}>
                      <div style={{ fontWeight: 500, color: 'var(--text-main)', fontSize: '0.85rem' }}>
                        {n.author_name || n.user_name || 'Investigator'}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {n.author_role || n.user_role || 'Specialist'}
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', maxWidth: '500px', lineHeight: 1.45, wordBreak: 'break-word' }}>
                      {n.note_text}
                    </td>
                    <td className="col-date" style={{ width: '160px' }}>
                      {formatDateTime(n.created_at)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No technical notes recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Note Modal */}
      {showAddModal && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div className="modal-head">
              <h3>Annotate Digital Evidence</h3>
              <button className="modal-close-btn" onClick={() => setShowAddModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddNote}>
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
                  <label className="input-label">Investigator Technical Note *</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Enter forensic hypothesis, disassembly offsets, correlation notes, or analytical deductions..."
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
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
                  {submitting ? 'Writing to MySQL...' : 'Commit Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
