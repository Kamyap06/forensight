import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Layers,
  Database,
  Briefcase,
  AlertTriangle,
  Microscope,
  HardDrive,
  TrendingUp,
  FileCheck2,
  FileDown,
  FileText,
  Loader2,
  CheckCircle2,
  FileCode,
  ShieldCheck,
  Calendar,
  Sparkles,
  Download,
  Eye,
  Filter,
  CheckSquare,
  History,
  MessageSquare
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { api } from '../services/api';
import { User, Case } from '../types';
import { formatDateTime, formatDate } from '../utils/date';

interface ReportsPageProps {
  currentUser: User | null;
  onSelectCase: (caseId: number) => void;
  showToast: (msg: string, type?: 'info' | 'success' | 'error') => void;
}

const SEVERITY_COLORS: Record<string, string> = {
  Critical: '#ef4444',
  High: '#f97316',
  Medium: '#38bdf8',
  Low: '#10b981'
};

export default function ReportsPage({
  currentUser,
  onSelectCase,
  showToast
}: ReportsPageProps) {
  const [activeTab, setActiveTab] = useState<'generator' | 'analytics'>('generator');
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<number>(1);
  const [selectedCaseDetails, setSelectedCaseDetails] = useState<any>(null);
  const [loadingCaseDetails, setLoadingCaseDetails] = useState(false);

  // Configurable Sections for Report Generator
  const [sections, setSections] = useState({
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

  // Download state
  const [generatingFormat, setGeneratingFormat] = useState<'pdf' | 'doc' | null>(null);

  // Analytics view data
  const [analyticsData, setAnalyticsData] = useState<{
    case_evidence_summary: any[];
    high_severity_findings: any[];
    tasks_by_status: { status: string; count: number }[];
    findings_by_severity: { severity: string; count: number }[];
    custody_by_user: { user_id: number; user_name: string; role: string; activity_count: number }[];
    storage_stats: {
      total_evidence_items: number;
      total_file_size_bytes: number;
      total_size_kb: number;
      avg_file_size_bytes: number;
    };
  } | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedCaseId) {
      loadCasePreview(selectedCaseId);
    }
  }, [selectedCaseId]);

  const loadInitialData = async () => {
    try {
      setLoadingAnalytics(true);
      const [reportsRes, casesRes] = await Promise.all([
        api.getReports(),
        api.getCases()
      ]);
      setAnalyticsData(reportsRes);
      const loadedCases = casesRes.cases || [];
      setCases(loadedCases);
      if (loadedCases.length > 0) {
        setSelectedCaseId(loadedCases[0].case_id);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch report telemetry', 'error');
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const loadCasePreview = async (caseId: number) => {
    try {
      setLoadingCaseDetails(true);
      const res = await api.getCase(caseId);
      setSelectedCaseDetails(res);
    } catch (err: any) {
      console.warn('Failed to load case preview:', err.message);
    } finally {
      setLoadingCaseDetails(false);
    }
  };

  const getActiveSectionsList = () => {
    return Object.entries(sections)
      .filter(([_, active]) => active)
      .map(([key]) => key);
  };

  const handleDownloadReport = async (caseId: number, format: 'pdf' | 'doc', caseTitle?: string) => {
    const activeList = getActiveSectionsList();
    if (activeList.length === 0) {
      showToast('Please select at least one report section to include', 'error');
      return;
    }

    try {
      setGeneratingFormat(format);
      const title = caseTitle || selectedCaseDetails?.case?.title || `Case #${caseId}`;
      showToast(`Generating official ${format.toUpperCase()} dossier for "${title}"...`, 'info');
      await api.downloadCaseReport(caseId, format, activeList);
      showToast(`Dossier #${caseId} ${format.toUpperCase()} downloaded successfully`, 'success');
    } catch (err: any) {
      showToast(err.message || `Failed to generate ${format.toUpperCase()} report`, 'error');
    } finally {
      setGeneratingFormat(null);
    }
  };

  const currentCase = selectedCaseDetails?.case || cases.find((c) => c.case_id === selectedCaseId);
  const evidenceCount = selectedCaseDetails?.evidence?.length || 0;
  const findingsCount = selectedCaseDetails?.findings?.length || 0;
  const tasksCount = selectedCaseDetails?.tasks?.length || 0;

  // Chart data
  const caseEvidenceChart = (analyticsData?.case_evidence_summary || []).map((c) => ({
    name: (c.case_title || '').length > 16 ? (c.case_title || '').substring(0, 14) + '...' : (c.case_title || `Case #${c.case_id}`),
    fullName: c.case_title || `Case #${c.case_id}`,
    evidenceCount: Number(c.evidence_count ?? c.total_evidence_items ?? 0),
    tasksCount: Number(c.active_tasks_count || 0),
    findingsCount: Number(c.high_findings_count || 0)
  }));

  const findingsPieData = (analyticsData?.findings_by_severity || []).map((f) => ({
    name: f.severity,
    value: Number(f.count),
    color: SEVERITY_COLORS[f.severity] || '#64748b'
  }));

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
            <span className="crumb-active">Reports</span>
          </div>
          <h1 className="page-title cyber-glitch-text" data-text="Case Report Generator & Analytics">Case Reports & Dossier Generator</h1>
          <p className="page-subtitle">
            Generate court-admissible forensic dossiers in PDF and Word DOCX formats with configurable sections.
          </p>
        </div>

        {/* Tab switchers */}
        <div
          style={{
            display: 'flex',
            gap: '6px',
            backgroundColor: 'var(--bg-card-subtle)',
            padding: '4px',
            borderRadius: '10px',
            border: '1px solid var(--border-color)'
          }}
        >
          <button
            onClick={() => setActiveTab('generator')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: activeTab === 'generator' ? 'var(--bg-card)' : 'transparent',
              color: activeTab === 'generator' ? 'var(--text-main)' : 'var(--text-muted)',
              fontSize: '0.84rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: activeTab === 'generator' ? 'var(--shadow-card)' : 'none',
              transition: 'all 0.15s'
            }}
          >
            <FileDown className="w-4 h-4 text-sky-400" />
            <span>Case Report Generator</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: activeTab === 'analytics' ? 'var(--bg-card)' : 'transparent',
              color: activeTab === 'analytics' ? 'var(--text-main)' : 'var(--text-muted)',
              fontSize: '0.84rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: activeTab === 'analytics' ? 'var(--shadow-card)' : 'none',
              transition: 'all 0.15s'
            }}
          >
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <span>Relational SQL Views</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Case Report Generator */}
      {activeTab === 'generator' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '20px' }} className="report-generator-grid">
          {/* Left Column: Configuration Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="panel">
              <div className="panel-header">
                <div className="panel-title">
                  <FileText className="w-4 h-4 text-sky-400" />
                  <span>Configure Forensic Dossier</span>
                </div>
              </div>

              <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* 1. Case Selection */}
                <div>
                  <label className="input-label" style={{ marginBottom: '6px' }}>Select Investigation Case</label>
                  <select
                    value={selectedCaseId}
                    onChange={(e) => setSelectedCaseId(Number(e.target.value))}
                    className="input-field"
                    style={{ width: '100%', fontSize: '0.88rem' }}
                  >
                    {cases.map((c) => (
                      <option key={c.case_id} value={c.case_id}>
                        Case #{c.case_id}: {c.title} ({c.status} • {c.priority})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Configurable Dossier Sections */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                    <label className="input-label" style={{ margin: 0 }}>
                      Dossier Sections ({Object.values(sections).filter(Boolean).length}/11)
                    </label>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() =>
                          setSections({
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
                          })
                        }
                        style={{ padding: '2px 6px', fontSize: '0.7rem' }}
                      >
                        All
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() =>
                          setSections({
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
                          })
                        }
                        style={{ padding: '2px 6px', fontSize: '0.7rem' }}
                      >
                        Executive
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() =>
                          setSections({
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
                          })
                        }
                        style={{ padding: '2px 6px', fontSize: '0.7rem' }}
                      >
                        Technical
                      </button>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      backgroundColor: 'var(--bg-card-subtle)',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      maxHeight: '260px',
                      overflowY: 'auto'
                    }}
                  >
                    {[
                      { key: 'summary', label: '1. Executive Summary & Incident Scope' },
                      { key: 'timeline', label: '2. Chronological Investigation Timeline' },
                      { key: 'evidence', label: '3. Digital Evidence Inventory & SHA-256 Hashes' },
                      { key: 'findings', label: '4. Forensic Threat Findings & Adversary Indicators' },
                      { key: 'custody', label: '5. Chain of Custody & Court Admissibility Trail' },
                      { key: 'tasks', label: '6. Investigation Workflow Tasks & Deliverables' },
                      { key: 'notes', label: '7. Investigator Notes & Field Log' },
                      { key: 'audit', label: '8. Correlated System Audit Activity' },
                      { key: 'conclusion', label: '9. Forensic Conclusion' },
                      { key: 'recommendations', label: '10. Security Hardening Recommendations' },
                      { key: 'certification', label: '11. Investigator Certification & Digital Seal' }
                    ].map(({ key, label }) => {
                      const isChecked = (sections as any)[key];
                      return (
                        <label
                          key={key}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '0.82rem',
                            color: 'var(--text-main)',
                            cursor: 'pointer',
                            padding: '3px 4px',
                            borderRadius: '4px',
                            backgroundColor: isChecked ? 'rgba(59, 130, 246, 0.08)' : 'transparent'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) =>
                              setSections((prev) => ({ ...prev, [key]: e.target.checked }))
                            }
                            style={{ accentColor: 'var(--primary)' }}
                          />
                          <span>{label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Export Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingTop: '10px', borderTop: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Export formatted dossier with cryptographic header and SHA-256 validation stamps:
                  </span>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    <button
                      className="btn btn-primary"
                      disabled={generatingFormat !== null}
                      onClick={() => handleDownloadReport(selectedCaseId, 'pdf')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        backgroundColor: '#ef4444',
                        borderColor: '#ef4444'
                      }}
                    >
                      {generatingFormat === 'pdf' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <FileDown className="w-4 h-4" />
                      )}
                      <span>Export PDF Report</span>
                    </button>

                    <button
                      className="btn btn-primary"
                      disabled={generatingFormat !== null}
                      onClick={() => handleDownloadReport(selectedCaseId, 'doc')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        backgroundColor: '#0284c7',
                        borderColor: '#0284c7'
                      }}
                    >
                      {generatingFormat === 'doc' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <FileText className="w-4 h-4" />
                      )}
                      <span>Export Word DOCX</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Case Overview Pill */}
            {currentCase && (
              <div
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Selected Case Metadata</span>
                  <span
                    className={`badge ${
                      currentCase.priority === 'Critical'
                        ? 'badge-critical'
                        : currentCase.priority === 'High'
                        ? 'badge-high'
                        : currentCase.priority === 'Medium'
                        ? 'badge-medium'
                        : 'badge-low'
                    }`}
                  >
                    {currentCase.priority}
                  </span>
                </div>

                <div style={{ fontSize: '0.96rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Case #{currentCase.case_id}: {currentCase.title}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', paddingTop: '10px', borderTop: '1px solid var(--border-color)' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#38bdf8' }}>{evidenceCount}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Evidence Items</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ef4444' }}>{findingsCount}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Threat Findings</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#eab308' }}>{tasksCount}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Workflow Tasks</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Live Document Preview */}
          <div className="panel" style={{ height: 'fit-content' }}>
            <div className="panel-header">
              <div className="panel-title">
                <Eye className="w-4 h-4 text-emerald-400" />
                <span>Document Layout Preview</span>
              </div>
              <span style={{ fontSize: '0.76rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Court-Admissible Dossier Format</span>
              </span>
            </div>

            <div
              className="panel-body"
              style={{
                backgroundColor: 'var(--bg-card-subtle)',
                borderRadius: '8px',
                padding: '24px',
                margin: '16px',
                border: '1px dashed var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.2)'
              }}
            >
              {/* Header section in preview */}
              <div style={{ borderBottom: '2px solid #38bdf8', paddingBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '0.5px' }}>
                      FORENSIGHT CYBERSECURITY
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Official Incident Forensics Dossier & Chain of Custody
                    </div>
                  </div>
                  <span
                    style={{
                      fontFamily: 'monospace',
                      fontSize: '0.72rem',
                      color: '#38bdf8',
                      border: '1px solid #38bdf8',
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}
                  >
                    CONFIDENTIAL
                  </span>
                </div>
              </div>

              {/* Case details header */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '0.82rem', backgroundColor: 'var(--bg-card)', padding: '12px', borderRadius: '6px' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Case Number: </span>
                  <strong style={{ color: 'var(--text-main)' }}>#{currentCase?.case_id || selectedCaseId}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Classification: </span>
                  <strong style={{ color: 'var(--text-main)' }}>{currentCase?.incident_type || 'Forensic Analysis'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Case Title: </span>
                  <strong style={{ color: 'var(--text-main)' }}>{currentCase?.title || 'Loading title...'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Generated Date: </span>
                  <strong style={{ color: 'var(--text-main)' }}>{new Date().toLocaleDateString()}</strong>
                </div>
              </div>

              {/* Document Outline Preview */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.84rem' }}>
                <strong style={{ color: 'var(--text-main)', fontSize: '0.88rem' }}>
                  Dossier Narrative Sections & Evidentiary Manifests:
                </strong>

                {sections.summary && (
                  <div style={{ padding: '8px 12px', backgroundColor: 'var(--bg-card)', borderRadius: '6px', borderLeft: '3px solid #38bdf8' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>1. Executive Incident Summary & Scope</div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {currentCase?.description ? `${currentCase.description.substring(0, 110)}...` : 'Comprehensive incident scope and operational overview.'}
                    </div>
                  </div>
                )}

                {sections.timeline && (
                  <div style={{ padding: '8px 12px', backgroundColor: 'var(--bg-card)', borderRadius: '6px', borderLeft: '3px solid #0284c7' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>2. Initial Detection & Investigation Objectives</div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Detection telemetry, pass-the-hash indicators, and formal investigative charter.
                    </div>
                  </div>
                )}

                {sections.evidence && (
                  <div style={{ padding: '8px 12px', backgroundColor: 'var(--bg-card)', borderRadius: '6px', borderLeft: '3px solid #10b981' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>3. Evidence Acquisition & Integrity Verification ({evidenceCount} artifacts)</div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Order of volatility, RAM capture, write-blocking, and SHA-256 baselines.
                    </div>
                  </div>
                )}

                {sections.findings && (
                  <div style={{ padding: '8px 12px', backgroundColor: 'var(--bg-card)', borderRadius: '6px', borderLeft: '3px solid #ef4444' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>4. Detailed Technical Analysis & Findings ({findingsCount} findings)</div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      LSASS reflective injection mechanics, Volatility 3 procedures, what findings prove vs limitations.
                    </div>
                  </div>
                )}

                {sections.timeline && (
                  <div style={{ padding: '8px 12px', backgroundColor: 'var(--bg-card)', borderRadius: '6px', borderLeft: '3px solid #f59e0b' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>5. Reconstructed Timeline & Milestones</div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Immutable chronology of confirmed events and forensic milestones.
                    </div>
                  </div>
                )}

                {sections.findings && (
                  <div style={{ padding: '8px 12px', backgroundColor: 'var(--bg-card)', borderRadius: '6px', borderLeft: '3px solid #8b5cf6' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>6. Suspected Attack Progression (MITRE ATT&CK Mapping)</div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Kill chain mapping distinguishing confirmed evidence from hypotheses.
                    </div>
                  </div>
                )}

                {sections.conclusion && (
                  <div style={{ padding: '8px 12px', backgroundColor: 'var(--bg-card)', borderRadius: '6px', borderLeft: '3px solid #ec4899' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>7. Impact Assessment, Evidence Gaps & Conclusions</div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Confidentiality/integrity impact, missing telemetry protocols, and legal disposition.
                    </div>
                  </div>
                )}

                {sections.recommendations && (
                  <div style={{ padding: '8px 12px', backgroundColor: 'var(--bg-card)', borderRadius: '6px', borderLeft: '3px solid #14b8a6' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>8. Prioritized Directives (P0 Containment to P3 Hardening)</div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Dual KRBTGT resets, Credential Guard enforcement, and network isolation.
                    </div>
                  </div>
                )}

                {sections.certification && (
                  <div style={{ padding: '8px 12px', backgroundColor: 'var(--bg-card)', borderRadius: '6px', borderLeft: '3px solid #64748b' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>9. Appendices: Evidence Manifests & Certification</div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      SHA-256 hashes, custody ledger, task records, and digital signature seal.
                    </div>
                  </div>
                )}
              </div>

              {/* Watermark badge */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid var(--border-color)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                <span>ForenSight Cryptographic Engine • Python ReportLab & Docx</span>
                <span>SHA-256 Verified Seal</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Relational SQL Views & Analytics */}
      {activeTab === 'analytics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Telemetry Metrics */}
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-header">
                <span className="kpi-title">Total Evidence Files</span>
                <Microscope className="w-4 h-4 text-sky-400" />
              </div>
              <div className="kpi-value">{analyticsData?.storage_stats?.total_evidence_items || 0}</div>
              <div className="kpi-footer">Tracked across all incident dossiers</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-header">
                <span className="kpi-title">Aggregated Storage</span>
                <HardDrive className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="kpi-value">{(analyticsData?.storage_stats?.total_size_kb || 0).toLocaleString()} KB</div>
              <div className="kpi-footer">
                Avg: {Math.round((analyticsData?.storage_stats?.avg_file_size_bytes || 0) / 1024)} KB / file
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-header">
                <span className="kpi-title">Critical / High Threats</span>
                <AlertTriangle className="w-4 h-4 text-red-500" />
              </div>
              <div className="kpi-value" style={{ color: '#ef4444' }}>{analyticsData?.high_severity_findings?.length || 0}</div>
              <div className="kpi-footer">High priority forensic alerts</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-header">
                <span className="kpi-title">Telemetry Pipelines</span>
                <Database className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="kpi-value">Active</div>
              <div className="kpi-footer">Real-time analytical streaming</div>
            </div>
          </div>

          {/* Visual Analytics Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }} className="responsive-grid-2">
            {/* Case Metrics Bar Chart */}
            <div className="panel">
              <div className="panel-header">
                <div className="panel-title">
                  <BarChart3 className="w-4 h-4 text-sky-400" />
                  <span>Evidence & Tasks per Investigation Case</span>
                </div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Consolidated Case Metrics</span>
              </div>
              <div className="panel-body" style={{ height: '260px' }}>
                {caseEvidenceChart.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={caseEvidenceChart} margin={{ top: 10, right: 20, left: -20, bottom: 20 }}>
                      <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} angle={-15} textAnchor="end" tickLine={false} />
                      <YAxis stroke="var(--text-muted)" fontSize={11} allowDecimals={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--bg-modal)',
                          borderColor: 'var(--border-color)',
                          borderRadius: '8px',
                          color: 'var(--text-main)',
                          fontSize: '12px'
                        }}
                      />
                      <Bar dataKey="evidenceCount" name="Evidence Files" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="tasksCount" name="Active Tasks" fill="#eab308" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                    No case data available.
                  </div>
                )}
              </div>
            </div>

            {/* Threat Severity Breakdown */}
            <div className="panel">
              <div className="panel-header">
                <div className="panel-title">
                  <TrendingUp className="w-4 h-4 text-amber-400" />
                  <span>Findings Severity Breakdown</span>
                </div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>GROUP BY severity</span>
              </div>
              <div className="panel-body" style={{ height: '260px', display: 'flex', alignItems: 'center' }}>
                {findingsPieData.length > 0 ? (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
                    <ResponsiveContainer width="60%" height="100%">
                      <PieChart>
                        <Pie
                          data={findingsPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={75}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {findingsPieData.map((entry, index) => (
                            <Cell key={`pie-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'var(--bg-modal)',
                            borderColor: 'var(--border-color)',
                            borderRadius: '8px',
                            color: 'var(--text-main)',
                            fontSize: '12px'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ width: '40%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {findingsPieData.map((item) => (
                        <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
                          <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: item.color }} />
                          <span style={{ color: 'var(--text-muted)' }}>{item.name}:</span>
                          <strong style={{ color: 'var(--text-main)' }}>{item.value}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No findings recorded</p>
                )}
              </div>
            </div>
          </div>

          {/* Relational View 1: vw_case_evidence_summary Table */}
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">
                <Database className="w-4 h-4 text-sky-400" />
                <span>Case Evidence & Deliverables Breakdown</span>
              </div>
              <span style={{ fontSize: '0.8rem', color: '#38bdf8', fontFamily: 'monospace' }}>
                Multi-Artifact Telemetry Correlation
              </span>
            </div>

            <div className="table-wrap">
              <table className="cyber-table reports-table">
                <thead>
                  <tr>
                    <th className="col-id">Case ID</th>
                    <th>Case Title</th>
                    <th>Incident Type</th>
                    <th className="col-status">Priority</th>
                    <th className="col-status">Status</th>
                    <th>Evidence Count</th>
                    <th>Storage (KB)</th>
                    <th>Active Tasks</th>
                    <th>High/Crit Threats</th>
                    <th className="col-actions">Download Dossier</th>
                  </tr>
                </thead>
                <tbody>
                  {analyticsData?.case_evidence_summary && analyticsData.case_evidence_summary.length > 0 ? (
                    analyticsData.case_evidence_summary.map((row) => (
                      <tr key={row.case_id}>
                        <td className="col-id">#{row.case_id}</td>
                        <td>
                          <span
                            onClick={() => onSelectCase(row.case_id)}
                            style={{ fontWeight: 600, color: 'var(--text-main)', cursor: 'pointer' }}
                            title="Open Case Dossier"
                          >
                            {row.case_title}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-secondary)' }}>{row.incident_type}</td>
                        <td className="col-status">
                          <span
                            className={`badge ${
                              row.priority === 'Critical'
                                ? 'badge-critical'
                                : row.priority === 'High'
                                ? 'badge-high'
                                : row.priority === 'Medium'
                                ? 'badge-medium'
                                : 'badge-low'
                            }`}
                          >
                            {row.priority}
                          </span>
                        </td>
                        <td className="col-status">
                          <span
                            className={`badge ${
                              (row.status || row.case_status) === 'Open'
                                ? 'badge-open'
                                : (row.status || row.case_status) === 'In Progress'
                                ? 'badge-inprogress'
                                : 'badge-completed'
                            }`}
                          >
                            {row.status || row.case_status}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600, color: '#38bdf8' }}>
                          {row.evidence_count ?? row.total_evidence_items ?? 0}
                        </td>
                        <td style={{ color: 'var(--text-muted)' }}>{Number(row.total_evidence_size_kb || 0).toLocaleString()} KB</td>
                        <td>{row.active_tasks_count ?? 0}</td>
                        <td style={{ color: Number(row.high_findings_count) > 0 ? '#ef4444' : 'var(--text-muted)', fontWeight: 600 }}>
                          {row.high_findings_count ?? 0}
                        </td>
                        <td className="col-actions">
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <button
                              onClick={() => handleDownloadReport(row.case_id, 'pdf', row.case_title)}
                              disabled={generatingFormat !== null}
                              style={{
                                background: 'transparent',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                borderRadius: '6px',
                                padding: '4px 8px',
                                color: '#ef4444',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.74rem'
                              }}
                              title="Generate PDF Case Report"
                            >
                              <FileDown className="w-3.5 h-3.5" />
                              <span>PDF</span>
                            </button>

                            <button
                              onClick={() => handleDownloadReport(row.case_id, 'doc', row.case_title)}
                              disabled={generatingFormat !== null}
                              style={{
                                background: 'transparent',
                                border: '1px solid rgba(56, 189, 248, 0.3)',
                                borderRadius: '6px',
                                padding: '4px 8px',
                                color: '#38bdf8',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.74rem'
                              }}
                              title="Generate Word DOC Case Report"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>DOC</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={10} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        No records returned by view.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Relational View 2: vw_high_severity_findings Table */}
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span>High & Critical Incident Threat Indicators</span>
              </div>
              <span style={{ fontSize: '0.8rem', color: '#ef4444', fontFamily: 'monospace' }}>
                Prioritized Incident Scope
              </span>
            </div>

            <div className="table-wrap">
              <table className="cyber-table reports-table">
                <thead>
                  <tr>
                    <th className="col-id">Finding ID</th>
                    <th>Target Evidence Artifact</th>
                    <th>Threat Classification</th>
                    <th className="col-status">Severity</th>
                    <th className="col-desc">Technical Analysis & Indicators</th>
                    <th>Associated Case</th>
                    <th className="col-date">Documented</th>
                  </tr>
                </thead>
                <tbody>
                  {analyticsData?.high_severity_findings && analyticsData.high_severity_findings.length > 0 ? (
                    analyticsData.high_severity_findings.map((f) => (
                      <tr key={f.finding_id}>
                        <td className="col-id">#{f.finding_id}</td>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{f.evidence_name}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Artifact ID #{f.evidence_id}</div>
                        </td>
                        <td style={{ color: 'var(--text-secondary)' }}>{f.finding_type}</td>
                        <td className="col-status">
                          <span className={`badge ${f.severity === 'Critical' ? 'badge-critical' : 'badge-high'}`}>
                            {f.severity}
                          </span>
                        </td>
                        <td className="col-desc">
                          {f.finding_description || f.description || 'Threat indicator recorded'}
                        </td>
                        <td style={{ color: '#38bdf8' }}>
                          {f.case_title ? `#${f.case_id} ${f.case_title}` : (f.associated_cases_count ? `${f.associated_cases_count} cases` : 'Unassigned')}
                        </td>
                        <td className="col-date">
                          {formatDateTime(f.finding_created_at || f.created_at)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        No high or critical findings detected in database.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
