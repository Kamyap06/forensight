import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Briefcase,
  Microscope,
  CheckSquare,
  AlertTriangle,
  Link2,
  Unlink,
  Plus,
  Clock,
  Shield,
  FileText,
  Copy,
  Check,
  X,
  Download,
  FileDown,
  Loader2,
  GitFork,
  UserCheck,
  Calendar,
  Layers,
  History,
  MessageSquare,
  Sliders,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';
import { User, Case, Evidence, Task, Finding, CustodyLog, EvidenceNote } from '../types';
import { formatDateTime, formatDate } from '../utils/date';

interface CaseDetailPageProps {
  caseId: number;
  currentUser: User | null;
  onBack: () => void;
  showToast: (msg: string, type?: 'info' | 'success' | 'error') => void;
}

export default function CaseDetailPage({
  caseId,
  currentUser,
  onBack,
  showToast
}: CaseDetailPageProps) {
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [evidenceList, setEvidenceList] = useState<Evidence[]>([]);
  const [tasksList, setTasksList] = useState<Task[]>([]);
  const [findingsList, setFindingsList] = useState<Finding[]>([]);
  const [custodyLogs, setCustodyLogs] = useState<any[]>([]);
  const [notesList, setNotesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'evidence' | 'findings' | 'tasks' | 'custody' | 'notes'>('overview');

  // Link Evidence Modal
  const [allEvidence, setAllEvidence] = useState<Evidence[]>([]);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [selectedToLink, setSelectedToLink] = useState<number[]>([]);
  const [linking, setLinking] = useState(false);

  // Add Task Modal
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskStatus, setTaskStatus] = useState('Pending');
  const [assignedUserIds, setAssignedUserIds] = useState<number[]>([]);
  const [creatingTask, setCreatingTask] = useState(false);

  // Add Note Modal
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteTargetEvidenceId, setNoteTargetEvidenceId] = useState<number | null>(null);
  const [noteContent, setNoteContent] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  // Case Report Generator Modal
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportSections, setReportSections] = useState({
    summary: true,
    timeline: true,
    evidence: true,
    findings: true,
    custody: true,
    tasks: true,
    notes: true,
    audit: true,
    conclusion: true,
    recommendations: true,
    certification: true
  });
  const [generatingReport, setGeneratingReport] = useState<'pdf' | 'doc' | null>(null);

  // Copied hash feedback
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [downloadingEvidenceId, setDownloadingEvidenceId] = useState<number | null>(null);

  const isViewer = currentUser?.role === 'Viewer';

  useEffect(() => {
    loadCaseDossier();
  }, [caseId]);

  const loadCaseDossier = async () => {
    try {
      setLoading(true);
      const res = await api.getCase(caseId);
      setCaseData(res.case);
      setEvidenceList(res.evidence || []);
      setTasksList(res.tasks || []);
      setFindingsList(res.findings || []);
      setCustodyLogs((res as any).custody_logs || []);
      setNotesList((res as any).notes || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to load case dossier', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenLinkModal = async () => {
    try {
      const res = await api.getEvidence();
      const linkedIds = new Set(evidenceList.map((e) => e.evidence_id));
      const unlinked = (res.evidence || []).filter((e) => !linkedIds.has(e.evidence_id));
      setAllEvidence(unlinked);
      setSelectedToLink([]);
      setShowLinkModal(true);
    } catch (err: any) {
      showToast('Failed to load evidence catalog: ' + err.message, 'error');
    }
  };

  const handleAssociateEvidence = async () => {
    if (selectedToLink.length === 0) {
      showToast('Please select at least one evidence item to link', 'error');
      return;
    }
    try {
      setLinking(true);
      const res = await api.associateEvidence(caseId, selectedToLink);
      showToast(res.message || 'Evidence files linked to case', 'success');
      setShowLinkModal(false);
      loadCaseDossier();
    } catch (err: any) {
      showToast(err.message || 'Failed to link evidence', 'error');
    } finally {
      setLinking(false);
    }
  };

  const handleUnlinkEvidence = async (evidenceId: number, evName: string) => {
    if (!window.confirm(`Unlink evidence "${evName}" from this case? The file will remain in the evidence catalog.`)) {
      return;
    }
    try {
      const res = await api.disassociateEvidence(caseId, evidenceId);
      showToast(res.message || 'Evidence disassociated from case', 'success');
      loadCaseDossier();
    } catch (err: any) {
      showToast(err.message || 'Failed to unlink evidence', 'error');
    }
  };

  const handleDownloadEvidence = async (evidenceId: number, filename: string) => {
    try {
      setDownloadingEvidenceId(evidenceId);
      showToast(`Downloading forensic artifact: ${filename}...`, 'info');
      await api.downloadEvidence(evidenceId, filename);
      showToast(`Evidence artifact ${filename} saved to disk`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to download evidence file', 'error');
    } finally {
      setDownloadingEvidenceId(null);
    }
  };

  const handleOpenTaskModal = async () => {
    try {
      const res = await api.getUsers();
      setAllUsers(res.users || []);
      setTaskTitle('');
      setTaskDesc('');
      setTaskDueDate('');
      setTaskStatus('Pending');
      setAssignedUserIds([]);
      setShowTaskModal(true);
    } catch (err: any) {
      showToast('Failed to load users for task assignment', 'error');
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) {
      showToast('Task title is required', 'error');
      return;
    }

    try {
      setCreatingTask(true);
      const res = await api.createTask({
        case_id: caseId,
        task_title: taskTitle.trim(),
        description: taskDesc,
        due_date: taskDueDate || undefined,
        status: taskStatus,
        user_ids: assignedUserIds
      });
      showToast(res.message || 'Task assigned successfully', 'success');
      setShowTaskModal(false);
      loadCaseDossier();
    } catch (err: any) {
      showToast(err.message || 'Failed to create task', 'error');
    } finally {
      setCreatingTask(false);
    }
  };

  const handleUpdateTaskStatus = async (taskId: number, newStatus: string) => {
    if (isViewer) return;
    try {
      const res = await api.updateTaskStatus(taskId, newStatus, currentUser?.user_id || 1);
      showToast(res.message || 'Task status updated via stored procedure', 'success');
      loadCaseDossier();
    } catch (err: any) {
      showToast(err.message || 'Failed to update task status', 'error');
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) {
      showToast('Note content cannot be empty', 'error');
      return;
    }
    const targetEvId = noteTargetEvidenceId || (evidenceList.length > 0 ? evidenceList[0].evidence_id : null);
    if (!targetEvId) {
      showToast('Please select an evidence artifact to attach the note to', 'error');
      return;
    }

    try {
      setSavingNote(true);
      const res = await api.addNote({
        evidence_id: targetEvId,
        user_id: currentUser?.user_id || 1,
        note_text: noteContent.trim()
      });
      showToast(res.message || 'Investigator note logged to case audit trail', 'success');
      setShowNoteModal(false);
      setNoteContent('');
      loadCaseDossier();
    } catch (err: any) {
      showToast(err.message || 'Failed to add note', 'error');
    } finally {
      setSavingNote(false);
    }
  };

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2500);
    showToast('SHA-256 hash copied to clipboard', 'info');
  };

  const getActiveSectionsList = () => {
    return Object.entries(reportSections)
      .filter(([_, active]) => active)
      .map(([key]) => key);
  };

  const handleDownloadReport = async (format: 'pdf' | 'doc') => {
    const activeList = getActiveSectionsList();
    if (activeList.length === 0) {
      showToast('Please select at least one report section to include', 'error');
      return;
    }

    try {
      setGeneratingReport(format);
      showToast(`Compiling ForenSight Case #${caseId} ${format.toUpperCase()} dossier...`, 'info');
      await api.downloadCaseReport(caseId, format, activeList);
      showToast(`Case #${caseId} ${format.toUpperCase()} report generated & downloaded`, 'success');
      setShowReportModal(false);
    } catch (err: any) {
      showToast(err.message || `Failed to generate ${format.toUpperCase()} report`, 'error');
    } finally {
      setGeneratingReport(null);
    }
  };

  const toggleAllSections = (enable: boolean) => {
    setReportSections({
      summary: enable,
      timeline: enable,
      evidence: enable,
      findings: enable,
      custody: enable,
      tasks: enable,
      notes: enable,
      audit: enable,
      conclusion: enable,
      recommendations: enable,
      certification: enable
    });
  };

  const applyExecutivePreset = () => {
    setReportSections({
      summary: true,
      timeline: true,
      evidence: false,
      findings: true,
      custody: false,
      tasks: false,
      notes: false,
      audit: false,
      conclusion: true,
      recommendations: true,
      certification: true
    });
  };

  const applyTechnicalPreset = () => {
    setReportSections({
      summary: true,
      timeline: true,
      evidence: true,
      findings: true,
      custody: true,
      tasks: true,
      notes: false,
      audit: true,
      conclusion: true,
      recommendations: true,
      certification: true
    });
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
        <div style={{ display: 'inline-block', width: '32px', height: '32px', border: '3px solid var(--border-color)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: '16px' }} />
        <p>Loading incident dossier from MySQL...</p>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <p style={{ color: '#ef4444' }}>Case not found.</p>
        <button className="btn btn-outline" onClick={onBack} style={{ marginTop: '16px' }}>
          Back to Cases
        </button>
      </div>
    );
  }

  const prioClass =
    caseData.priority === 'Critical'
      ? 'badge-critical'
      : caseData.priority === 'High'
      ? 'badge-high'
      : caseData.priority === 'Medium'
      ? 'badge-medium'
      : 'badge-low';

  const statusClass =
    caseData.status === 'Open'
      ? 'badge-open'
      : caseData.status === 'In Progress'
      ? 'badge-inprogress'
      : 'badge-closed';

  const activeSectionCount = Object.values(reportSections).filter(Boolean).length;

  return (
    <div>
      {/* Top Header & Breadcrumb */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={onBack}
            className="btn btn-outline btn-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Cases</span>
          </button>
          <span style={{ color: 'var(--text-muted)' }}>/</span>
          <span style={{ fontFamily: 'monospace', color: 'var(--primary)', fontWeight: 600, fontSize: '0.9rem' }}>
            FS-{caseData.case_id}
          </span>
        </div>

        {/* Action Controls & Badges */}
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          {/* Prominent Generate Report Button */}
          <button
            onClick={() => setShowReportModal(true)}
            className="btn btn-primary btn-sm"
            style={{
              backgroundColor: 'var(--primary)',
              borderColor: 'var(--primary)',
              fontWeight: 600,
              boxShadow: '0 2px 8px rgba(59, 130, 246, 0.25)'
            }}
          >
            <FileDown className="w-4 h-4 mr-1.5" />
            <span>Generate Case Report</span>
          </button>

          {/* Quick PDF Report */}
          <button
            onClick={() => handleDownloadReport('pdf')}
            disabled={generatingReport !== null}
            className="btn btn-outline btn-sm"
            style={{ borderColor: 'rgba(239, 68, 68, 0.4)', color: '#fca5a5' }}
            title="Download full forensic incident report in PDF format"
          >
            {generatingReport === 'pdf' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileDown className="w-3.5 h-3.5 text-red-400" />
            )}
            <span>PDF</span>
          </button>

          {/* Quick DOC Report */}
          <button
            onClick={() => handleDownloadReport('doc')}
            disabled={generatingReport !== null}
            className="btn btn-outline btn-sm"
            style={{ borderColor: 'rgba(56, 189, 248, 0.4)', color: '#7dd3fc' }}
            title="Download forensic incident report in Word DOCX format"
          >
            {generatingReport === 'doc' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileText className="w-3.5 h-3.5 text-sky-400" />
            )}
            <span>DOCX</span>
          </button>

          <span className={`badge ${prioClass}`}>{caseData.priority}</span>
          <span className={`badge ${statusClass}`}>{caseData.status}</span>
        </div>
      </div>

      {/* Case Header Card */}
      <div className="panel" style={{ marginBottom: '20px' }}>
        <div className="panel-body" style={{ padding: '22px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span className="badge" style={{ backgroundColor: 'var(--bg-badge-neutral)', color: 'var(--text-secondary)' }}>
                  {caseData.incident_type}
                </span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Opened {formatDateTime(caseData.created_at)}
                </span>
              </div>
              <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.3px', marginBottom: '8px' }}>
                {caseData.title}
              </h1>
              <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                Lead Investigator: <strong style={{ color: 'var(--text-main)' }}>{caseData.creator_name || 'Investigator'}</strong>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ padding: '8px 14px', borderRadius: '8px', backgroundColor: 'var(--bg-card-subtle)', textAlign: 'center', border: '1px solid var(--border-color)', minWidth: '70px' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#38bdf8' }}>{evidenceList.length}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Evidence</div>
              </div>
              <div style={{ padding: '8px 14px', borderRadius: '8px', backgroundColor: 'var(--bg-card-subtle)', textAlign: 'center', border: '1px solid var(--border-color)', minWidth: '70px' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ef4444' }}>{findingsList.length}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Findings</div>
              </div>
              <div style={{ padding: '8px 14px', borderRadius: '8px', backgroundColor: 'var(--bg-card-subtle)', textAlign: 'center', border: '1px solid var(--border-color)', minWidth: '70px' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#eab308' }}>{tasksList.length}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tasks</div>
              </div>
              <div style={{ padding: '8px 14px', borderRadius: '8px', backgroundColor: 'var(--bg-card-subtle)', textAlign: 'center', border: '1px solid var(--border-color)', minWidth: '70px' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10b981' }}>{custodyLogs.length}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Custody</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation Ribbon */}
        <div style={{ display: 'flex', borderTop: '1px solid var(--border-color)', padding: '0 16px', backgroundColor: 'var(--bg-card-subtle)', overflowX: 'auto' }}>
          {[
            { id: 'overview', label: 'Case Briefing', icon: Briefcase },
            { id: 'evidence', label: `Digital Evidence (${evidenceList.length})`, icon: Microscope },
            { id: 'findings', label: `Threat Findings (${findingsList.length})`, icon: AlertTriangle },
            { id: 'tasks', label: `Investigation Tasks (${tasksList.length})`, icon: CheckSquare },
            { id: 'custody', label: `Chain of Custody (${custodyLogs.length})`, icon: History },
            { id: 'notes', label: `Investigator Notes (${notesList.length})`, icon: MessageSquare }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 16px',
                  border: 'none',
                  borderBottom: `2px solid ${isActive ? 'var(--primary)' : 'transparent'}`,
                  background: 'transparent',
                  color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                  fontSize: '0.84rem',
                  fontWeight: isActive ? 600 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">
              <FileText className="w-4 h-4 text-sky-400" />
              <span>Incident Scope & Briefing Narrative</span>
            </div>
          </div>
          <div className="panel-body">
            <div style={{ fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: 1.6, backgroundColor: 'var(--bg-input)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              {caseData.description || 'No detailed scope briefing documented for this incident.'}
            </div>

            <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
              <div style={{ padding: '12px 16px', borderRadius: '8px', backgroundColor: 'var(--bg-card-subtle)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Case Identifier</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--primary)' }}>FS-{caseData.case_id}</span>
              </div>
              <div style={{ padding: '12px 16px', borderRadius: '8px', backgroundColor: 'var(--bg-card-subtle)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Created Timestamp</span>
                <span style={{ fontSize: '0.84rem', color: 'var(--text-main)' }}>{formatDateTime(caseData.created_at)}</span>
              </div>
              <div style={{ padding: '12px 16px', borderRadius: '8px', backgroundColor: 'var(--bg-card-subtle)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Lead Investigator</span>
                <span style={{ fontSize: '0.84rem', color: 'var(--text-main)' }}>{caseData.creator_name || 'Assigned Lead'}</span>
              </div>
              <div style={{ padding: '12px 16px', borderRadius: '8px', backgroundColor: 'var(--bg-card-subtle)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Incident Classification</span>
                <span style={{ fontSize: '0.84rem', color: 'var(--text-main)' }}>{caseData.incident_type}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Evidence */}
      {activeTab === 'evidence' && (
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">
              <Microscope className="w-4 h-4 text-emerald-400" />
              <span>Associated Digital Evidence ({evidenceList.length} files)</span>
            </div>
            {!isViewer && (
              <button className="btn btn-primary btn-sm" onClick={handleOpenLinkModal}>
                <Link2 className="w-3.5 h-3.5" />
                <span>Link Evidence</span>
              </button>
            )}
          </div>

          <div className="table-wrap">
            <table className="cyber-table evidence-table">
              <thead>
                <tr>
                  <th className="col-id">Evidence ID</th>
                  <th>File Name</th>
                  <th>Type</th>
                  <th className="col-hash">SHA-256 Checksum</th>
                  <th>Size</th>
                  <th>Acquired Date</th>
                  <th>Uploaded By</th>
                  <th className="col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {evidenceList.length > 0 ? (
                  evidenceList.map((ev) => (
                    <tr key={ev.evidence_id}>
                      <td className="col-id">#{ev.evidence_id}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{ev.evidence_name}</div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{ev.evidence_type}</td>
                      <td className="col-hash">
                        <span
                          className="hash-pill"
                          onClick={() => handleCopyHash(ev.sha256_hash)}
                          title="Click to copy SHA-256"
                        >
                          {ev.sha256_hash ? `${ev.sha256_hash.substring(0, 16)}...` : 'N/A'}
                          {copiedHash === ev.sha256_hash ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {((ev.file_size || 0) / 1024).toFixed(1)} KB
                      </td>
                      <td className="col-date">
                        {formatDateTime(ev.collected_at || ev.created_at)}
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{ev.uploader_name || 'Investigator'}</td>
                      <td className="col-actions">
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            onClick={() => handleDownloadEvidence(ev.evidence_id, ev.evidence_name)}
                            disabled={downloadingEvidenceId === ev.evidence_id}
                            className="btn btn-outline btn-sm"
                            style={{ padding: '3px 8px', fontSize: '0.74rem' }}
                            title="Download verified binary artifact"
                          >
                            {downloadingEvidenceId === ev.evidence_id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Download className="w-3 h-3 text-sky-400" />
                            )}
                            <span>Download</span>
                          </button>

                          {!isViewer && (
                            <button
                              onClick={() => handleUnlinkEvidence(ev.evidence_id, ev.evidence_name)}
                              className="btn btn-outline btn-sm"
                              style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.25)', padding: '3px 8px', fontSize: '0.74rem' }}
                              title="Unlink from this case"
                            >
                              <Unlink className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                      No digital evidence linked to this case dossier yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Findings */}
      {activeTab === 'findings' && (
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span>Security Threat Findings ({findingsList.length})</span>
            </div>
          </div>

          <div className="table-wrap">
            <table className="cyber-table findings-table">
              <thead>
                <tr>
                  <th className="col-id">Finding ID</th>
                  <th className="col-status">Severity</th>
                  <th>Threat Classification</th>
                  <th>Subject Evidence</th>
                  <th className="col-desc">Observation & Threat Description</th>
                  <th className="col-date">Documented Date</th>
                </tr>
              </thead>
              <tbody>
                {findingsList.length > 0 ? (
                  findingsList.map((f) => {
                    const sevClass =
                      f.severity === 'Critical'
                        ? 'badge-critical'
                        : f.severity === 'High'
                        ? 'badge-high'
                        : f.severity === 'Medium'
                        ? 'badge-medium'
                        : 'badge-low';
                    return (
                      <tr key={f.finding_id}>
                        <td className="col-id">#{f.finding_id}</td>
                        <td className="col-status">
                          <span className={`badge ${sevClass}`}>{f.severity}</span>
                        </td>
                        <td style={{ fontWeight: 600 }}>{f.finding_type}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{f.evidence_name || `#${f.evidence_id}`}</td>
                        <td className="col-desc">{f.description}</td>
                        <td className="col-date">
                          {formatDateTime(f.created_at)}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                      No threat findings recorded for this case yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Tasks */}
      {activeTab === 'tasks' && (
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">
              <CheckSquare className="w-4 h-4 text-amber-400" />
              <span>Workflow Action Items ({tasksList.length})</span>
            </div>
            {!isViewer && (
              <button className="btn btn-primary btn-sm" onClick={handleOpenTaskModal}>
                <Plus className="w-3.5 h-3.5" />
                <span>Assign Task</span>
              </button>
            )}
          </div>

          <div className="table-wrap">
            <table className="cyber-table tasks-table">
              <thead>
                <tr>
                  <th className="col-id">Task ID</th>
                  <th>Task Title</th>
                  <th className="col-status">Status</th>
                  <th className="col-date">Due Date</th>
                  <th>Assigned Investigators</th>
                  <th className="col-desc">Description</th>
                  {!isViewer && <th style={{ width: '140px' }}>Update Status</th>}
                </tr>
              </thead>
              <tbody>
                {tasksList.length > 0 ? (
                  tasksList.map((t) => (
                    <tr key={t.task_id}>
                      <td className="col-id">#{t.task_id}</td>
                      <td style={{ fontWeight: 600 }}>{t.task_title}</td>
                      <td className="col-status">
                        <span className={`badge ${t.status === 'Completed' ? 'badge-completed' : t.status === 'In Progress' ? 'badge-inprogress' : 'badge-open'}`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="col-date">
                        {formatDate(t.due_date)}
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{t.assigned_users || 'Unassigned'}</td>
                      <td className="col-desc">{t.description || '—'}</td>
                      {!isViewer && (
                        <td>
                          <select
                            value={t.status}
                            onChange={(e) => handleUpdateTaskStatus(t.task_id, e.target.value)}
                            className="input-field"
                            style={{ padding: '3px 8px', fontSize: '0.78rem', width: '130px' }}
                          >
                            <option value="Pending">Pending</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                          </select>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                      No workflow tasks assigned for this incident dossier.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: Custody */}
      {activeTab === 'custody' && (
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">
              <History className="w-4 h-4 text-emerald-400" />
              <span>Chain of Custody & Audit Trail ({custodyLogs.length} events)</span>
            </div>
          </div>

          <div className="table-wrap">
            <table className="cyber-table custody-table">
              <thead>
                <tr>
                  <th className="col-id">Log ID</th>
                  <th className="col-date">Event Timestamp</th>
                  <th>Evidence Artifact</th>
                  <th className="col-status">Action Taken</th>
                  <th>Responsible Custodian</th>
                  <th className="col-desc">Custodial Notes & Verification</th>
                </tr>
              </thead>
              <tbody>
                {custodyLogs.length > 0 ? (
                  custodyLogs.map((log: any) => (
                    <tr key={log.log_id}>
                      <td className="col-id">#{log.log_id}</td>
                      <td className="col-date">{formatDateTime(log.event_time || log.timestamp)}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{log.evidence_name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Artifact #{log.evidence_id}</div>
                      </td>
                      <td className="col-status">
                        <span className="badge badge-inprogress">{log.action}</span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{log.handler_name || log.user_name || 'Custodian'}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{log.user_role || 'Investigator'}</div>
                      </td>
                      <td className="col-desc">{log.notes || 'Routine custodial transfer verified.'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                      No custody records logged for this case's evidence artifacts yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 6: Notes */}
      {activeTab === 'notes' && (
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">
              <MessageSquare className="w-4 h-4 text-sky-400" />
              <span>Investigator Field Notes & Observations ({notesList.length})</span>
            </div>
            {!isViewer && evidenceList.length > 0 && (
              <button className="btn btn-primary btn-sm" onClick={() => setShowNoteModal(true)}>
                <Plus className="w-3.5 h-3.5" />
                <span>Add Note</span>
              </button>
            )}
          </div>

          <div className="table-wrap">
            <table className="cyber-table">
              <thead>
                <tr>
                  <th className="col-id">Note ID</th>
                  <th>Investigator</th>
                  <th className="col-desc">Observation Note</th>
                  <th className="col-date">Recorded Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {notesList.length > 0 ? (
                  notesList.map((n: any) => (
                    <tr key={n.note_id}>
                      <td className="col-id">#{n.note_id}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{n.author_name || 'Investigator'}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Evidence #{n.evidence_id}</div>
                      </td>
                      <td className="col-desc" style={{ maxWidth: '600px' }}>{n.note_text}</td>
                      <td className="col-date">{formatDateTime(n.created_at)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                      No notes logged for this incident yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CASE REPORT GENERATOR MODAL */}
      {showReportModal && (
        <div className="modal-backdrop">
          <div className="modal-box" style={{ maxWidth: '680px' }}>
            <div className="modal-head">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileDown className="w-5 h-5 text-sky-400" />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>
                    Case Report Generator
                  </h3>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    ForenSight Dossier • FS-{caseData.case_id}
                  </span>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setShowReportModal(false)}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Presets Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Included Dossier Sections ({activeSectionCount}/11)
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => toggleAllSections(true)}
                    style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={applyExecutivePreset}
                    style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                  >
                    Executive Briefing
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={applyTechnicalPreset}
                    style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                  >
                    Technical Dossier
                  </button>
                </div>
              </div>

              {/* Checkboxes Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '8px',
                  backgroundColor: 'var(--bg-card-subtle)',
                  padding: '14px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  maxHeight: '260px',
                  overflowY: 'auto'
                }}
              >
                {[
                  { key: 'summary', label: '1. Executive Summary & Incident Scope' },
                  { key: 'timeline', label: '2. Chronological Investigation Timeline' },
                  { key: 'evidence', label: `3. Digital Evidence & SHA-256 Checksums (${evidenceList.length})` },
                  { key: 'findings', label: `4. Threat Findings & Indicators (${findingsList.length})` },
                  { key: 'custody', label: `5. Chain of Custody History (${custodyLogs.length})` },
                  { key: 'tasks', label: `6. Workflow Tasks & Action Items (${tasksList.length})` },
                  { key: 'notes', label: `7. Investigator Field Notes (${notesList.length})` },
                  { key: 'audit', label: '8. Correlated System Audit Activity' },
                  { key: 'conclusion', label: '9. Forensic Conclusion' },
                  { key: 'recommendations', label: '10. Security Hardening Recommendations' },
                  { key: 'certification', label: '11. Investigator Certification & Digital Seal' }
                ].map(({ key, label }) => {
                  const isChecked = (reportSections as any)[key];
                  return (
                    <label
                      key={key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '0.8rem',
                        color: 'var(--text-main)',
                        cursor: 'pointer',
                        padding: '4px 6px',
                        borderRadius: '4px',
                        backgroundColor: isChecked ? 'rgba(59, 130, 246, 0.08)' : 'transparent'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) =>
                          setReportSections((prev) => ({ ...prev, [key]: e.target.checked }))
                        }
                        style={{ accentColor: 'var(--primary)' }}
                      />
                      <span>{label}</span>
                    </label>
                  );
                })}
              </div>

              {/* Dossier Summary Box */}
              <div
                style={{
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  fontSize: '0.8rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}
              >
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Target Case: </span>
                  <strong style={{ color: 'var(--text-main)' }}>FS-{caseData.case_id} — {caseData.title}</strong>
                </div>
                <div style={{ color: 'var(--text-secondary)' }}>
                  Classification: <span style={{ color: '#38bdf8' }}>{caseData.incident_type}</span> • Priority: <span style={{ color: '#ef4444' }}>{caseData.priority}</span>
                </div>
              </div>

              {/* Export Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '4px' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={generatingReport !== null || activeSectionCount === 0}
                  onClick={() => handleDownloadReport('pdf')}
                  style={{
                    backgroundColor: '#ef4444',
                    borderColor: '#ef4444',
                    justifyContent: 'center',
                    padding: '10px 16px'
                  }}
                >
                  {generatingReport === 'pdf' ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                  ) : (
                    <FileDown className="w-4 h-4 mr-1.5" />
                  )}
                  <span>{generatingReport === 'pdf' ? 'Generating PDF...' : 'Download PDF Dossier'}</span>
                </button>

                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={generatingReport !== null || activeSectionCount === 0}
                  onClick={() => handleDownloadReport('doc')}
                  style={{
                    backgroundColor: '#0284c7',
                    borderColor: '#0284c7',
                    justifyContent: 'center',
                    padding: '10px 16px'
                  }}
                >
                  {generatingReport === 'doc' ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                  ) : (
                    <FileText className="w-4 h-4 mr-1.5" />
                  )}
                  <span>{generatingReport === 'doc' ? 'Generating DOCX...' : 'Download Word DOCX'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Link Evidence Modal */}
      {showLinkModal && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div className="modal-head">
              <h3>Link Evidence to Case #{caseId}</h3>
              <button className="modal-close-btn" onClick={() => setShowLinkModal(false)}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div style={{ padding: '20px' }}>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                Select files from the digital evidence repository to associate with this case via M:N <code>CaseEvidence</code>.
              </p>

              <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {allEvidence.length > 0 ? (
                  allEvidence.map((ev) => {
                    const isSelected = selectedToLink.includes(ev.evidence_id);
                    return (
                      <div
                        key={ev.evidence_id}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedToLink(selectedToLink.filter((id) => id !== ev.evidence_id));
                          } else {
                            setSelectedToLink([...selectedToLink, ev.evidence_id]);
                          }
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border-color)'}`,
                          backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-input)',
                          cursor: 'pointer'
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                            {ev.evidence_name}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {ev.evidence_type} • {((ev.file_size || 0) / 1024).toFixed(1)} KB
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          readOnly
                          style={{ accentColor: 'var(--primary)' }}
                        />
                      </div>
                    );
                  })
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem' }}>
                    All available evidence files are already linked to this case.
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button className="btn btn-outline" onClick={() => setShowLinkModal(false)}>
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleAssociateEvidence}
                  disabled={linking || selectedToLink.length === 0}
                >
                  {linking ? 'Linking...' : `Link ${selectedToLink.length} Files`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {showTaskModal && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div className="modal-head">
              <h3>Assign Investigation Task</h3>
              <button className="modal-close-btn" onClick={() => setShowTaskModal(false)}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="input-label">Task Title *</label>
                <input
                  type="text"
                  placeholder="e.g., Memory Volatility Analysis & Dump Inspection"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="input-label">Initial Status</label>
                  <select
                    value={taskStatus}
                    onChange={(e) => setTaskStatus(e.target.value)}
                    className="input-field"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                  </select>
                </div>

                <div>
                  <label className="input-label">Due Date</label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="input-label">Assignee(s) from Investigator Directory</label>
                <div style={{ maxHeight: '140px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', backgroundColor: 'var(--bg-input)', padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  {allUsers.map((u) => {
                    const isChecked = assignedUserIds.includes(u.user_id);
                    return (
                      <label key={u.user_id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAssignedUserIds([...assignedUserIds, u.user_id]);
                            } else {
                              setAssignedUserIds(assignedUserIds.filter((id) => id !== u.user_id));
                            }
                          }}
                          style={{ accentColor: 'var(--primary)' }}
                        />
                        <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>{u.name}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>({u.role})</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="input-label">Task Instructions & Acceptance Criteria</label>
                <textarea
                  rows={3}
                  placeholder="Detail step-by-step instructions for assigned specialists..."
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  className="input-field"
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowTaskModal(false)}>
                  Cancel
                </button>
                <button type="submit" disabled={creatingTask} className="btn btn-primary">
                  {creatingTask ? 'Assigning Task...' : 'Assign Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Note Modal */}
      {showNoteModal && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div className="modal-head">
              <h3>Log Investigator Field Note</h3>
              <button className="modal-close-btn" onClick={() => setShowNoteModal(false)}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddNote} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="input-label">Associated Evidence Artifact *</label>
                <select
                  value={noteTargetEvidenceId || (evidenceList[0]?.evidence_id ?? '')}
                  onChange={(e) => setNoteTargetEvidenceId(Number(e.target.value))}
                  className="input-field"
                  required
                >
                  {evidenceList.map((ev) => (
                    <option key={ev.evidence_id} value={ev.evidence_id}>
                      #{ev.evidence_id} — {ev.evidence_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="input-label">Investigator Observation & Findings Note *</label>
                <textarea
                  rows={4}
                  placeholder="Document observations, forensic anomalies, or cross-case correlations..."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  className="input-field"
                  required
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowNoteModal(false)}>
                  Cancel
                </button>
                <button type="submit" disabled={savingNote} className="btn btn-primary">
                  {savingNote ? 'Logging Note...' : 'Log Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
