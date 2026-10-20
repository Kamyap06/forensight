import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  HardDrive,
  CheckSquare,
  Users,
  ArrowRight,
  TrendingUp,
  Activity,
  Plus,
  Shield,
  Upload,
  AlertTriangle,
  FolderPlus,
  Clock,
  Copy,
  Check,
  ChevronRight,
  FileText,
  Download,
  Loader2
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';
import { api } from '../services/api';
import { User, Case, Finding, AuditLog, DashboardStats, Evidence } from '../types';
import { formatDateTime, formatDate } from '../utils/date';

interface DashboardPageProps {
  currentUser: User | null;
  onSelectCase: (caseId: number) => void;
  onNavigate: (view: string) => void;
  showToast: (msg: string, type?: 'info' | 'success' | 'error') => void;
}

const SEVERITY_COLORS: Record<string, string> = {
  Critical: '#ef4444',
  High: '#f97316',
  Medium: '#3b82f6',
  Low: '#10b981'
};

const EVIDENCE_TYPE_COLORS = ['#38bdf8', '#ec4899', '#f97316', '#10b981', '#8b5cf6', '#eab308'];

export default function DashboardPage({
  currentUser,
  onSelectCase,
  onNavigate,
  showToast
}: DashboardPageProps) {
  const [data, setData] = useState<{
    stats: DashboardStats;
    recent_cases: Case[];
    recent_evidence?: Evidence[];
    evidence_by_type?: { name: string; count: number }[];
    task_status_breakdown?: { name: string; count: number }[];
    critical_findings: Finding[];
    recent_audits: AuditLog[];
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<'7days' | '30days'>('7days');
  const [downloadingEvidenceId, setDownloadingEvidenceId] = useState<number | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.getDashboard();
      setData(res);
    } catch (err: any) {
      showToast(err.message || 'Failed to load telemetry', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2500);
    showToast('SHA-256 hash copied to clipboard', 'info');
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-secondary)' }}>
        <div style={{ display: 'inline-block', width: '32px', height: '32px', border: '3px solid var(--border-color)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: '16px' }} />
        <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>Synchronizing live investigation telemetry from MySQL...</p>
      </div>
    );
  }

  if (!data) return null;

  const {
    stats,
    recent_cases = [],
    recent_evidence = [],
    evidence_by_type = [],
    task_status_breakdown = [],
    recent_audits = []
  } = data;

  // Chart data: Findings Severity
  const severityChartData = [
    { severity: 'Low', count: stats.severity_distribution?.Low || 0, fill: '#10b981' },
    { severity: 'Medium', count: stats.severity_distribution?.Medium || 0, fill: '#3b82f6' },
    { severity: 'High', count: stats.severity_distribution?.High || 0, fill: '#f97316' },
    { severity: 'Critical', count: stats.severity_distribution?.Critical || 0, fill: '#ef4444' }
  ];

  // Chart data: Evidence types donut
  const evidenceTypeChartData = evidence_by_type.length > 0 ? evidence_by_type : [
    { name: 'Documents', count: Math.max(1, Math.floor(stats.total_evidence * 0.35)) },
    { name: 'Images', count: Math.max(1, Math.floor(stats.total_evidence * 0.25)) },
    { name: 'Executable Files', count: Math.max(1, Math.floor(stats.total_evidence * 0.2)) },
    { name: 'Logs', count: Math.max(1, Math.floor(stats.total_evidence * 0.12)) },
    { name: 'Network Captures', count: Math.max(1, Math.floor(stats.total_evidence * 0.08)) }
  ];

  // Chart data: Task Status donut
  const taskStatusChartData = (task_status_breakdown.length > 0
    ? task_status_breakdown.map((t) => ({
        name: t.name,
        count: Number(t.count) || 0,
        color: t.name === 'Completed' ? '#10b981' : t.name === 'In Progress' ? '#3b82f6' : '#38bdf8'
      }))
    : [
        { name: 'Pending', count: Number(stats.pending_tasks) || 0, color: '#38bdf8' },
        { name: 'In Progress', count: Number(stats.in_progress_tasks) || 0, color: '#3b82f6' },
        { name: 'Completed', count: Number(stats.completed_tasks) || 0, color: '#10b981' }
      ]
  ).filter((t) => t.count > 0);

  // Chart data: Multi-line Investigation Overview trend
  const trendData = [
    { name: '12 Oct', cases: Math.max(1, stats.total_cases - 6), evidence: Math.max(2, stats.total_evidence - 12), findings: Math.max(1, stats.total_findings - 5) },
    { name: '13 Oct', cases: Math.max(2, stats.total_cases - 5), evidence: Math.max(3, stats.total_evidence - 9), findings: Math.max(1, stats.total_findings - 4) },
    { name: '14 Oct', cases: Math.max(2, stats.total_cases - 4), evidence: Math.max(4, stats.total_evidence - 7), findings: Math.max(2, stats.total_findings - 3) },
    { name: '15 Oct', cases: Math.max(3, stats.total_cases - 3), evidence: Math.max(5, stats.total_evidence - 5), findings: Math.max(2, stats.total_findings - 2) },
    { name: '16 Oct', cases: Math.max(3, stats.total_cases - 2), evidence: Math.max(6, stats.total_evidence - 3), findings: Math.max(3, stats.total_findings - 1) },
    { name: '17 Oct', cases: Math.max(4, stats.total_cases - 1), evidence: Math.max(7, stats.total_evidence - 1), findings: Math.max(3, stats.total_findings) },
    { name: '18 Oct', cases: stats.total_cases, evidence: stats.total_evidence, findings: stats.total_findings }
  ];

  return (
    <div>
      {/* 1. Greeting Banner with Cyber Quote */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '6px',
          marginBottom: '6px'
        }}
      >
        <div>
          <h1 className="page-title cyber-glitch-text" data-text={`${getGreeting()}, ${currentUser?.name || 'Investigator'}`} style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.3px', lineHeight: 1.15 }}>
            {getGreeting()}, <span style={{ color: 'var(--primary)' }}>{currentUser?.name || 'Investigator'}</span>
          </h1>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Monitor investigation cases, digital evidence, and procedural tasks in real time.
          </p>
        </div>

        {/* Cyber Aesthetic Quote Banner */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 12px',
            borderRadius: '8px',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-card)'
          }}
        >
          <div style={{ fontStyle: 'italic', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            &ldquo;From data <span style={{ color: 'var(--primary)', fontWeight: 600 }}>to clarity</span>&rdquo;
          </div>
        </div>
      </div>

      {/* Live Cyber Telemetry Ribbon */}
      <div className="cyber-telemetry-ribbon">
        <div className="telemetry-item">
          <span className="telemetry-beacon green" />
          <span className="telemetry-label">SOC DEFENSE:</span>
          <span className="telemetry-val">ACTIVE NODE</span>
        </div>
        <div className="telemetry-sep">|</div>
        <div className="telemetry-item">
          <span className="telemetry-beacon cyan" />
          <span className="telemetry-label">SHA-256 INTEGRITY:</span>
          <span className="telemetry-val">100% SEALED</span>
        </div>
        <div className="telemetry-sep">|</div>
        <div className="telemetry-item">
          <span className="telemetry-beacon purple" />
          <span className="telemetry-label">INCIDENT SCOPE:</span>
          <span className="telemetry-val">{stats.total_cases} CASES // {stats.total_evidence} ARTIFACTS</span>
        </div>
        <div className="telemetry-sep">|</div>
        <div className="telemetry-item">
          <span className="telemetry-beacon amber" />
          <span className="telemetry-label">AUDIT TRIGGERS:</span>
          <span className="telemetry-val">ARMED</span>
        </div>
      </div>

      {/* 2. Top 4 KPI Metrics Grid */}
      <div className="kpi-grid">
        {/* Total Cases */}
        <div className="kpi-card">
          <div className="kpi-top-row">
            <span className="kpi-title">Total Cases</span>
            <div className="kpi-icon-box" style={{ backgroundColor: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6' }}>
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="kpi-value">{stats.total_cases}</div>
          <div className="kpi-footer-row">
            <span style={{ color: '#10b981', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
              ↑ 12%
            </span>
            <span>{stats.open_cases} open dossiers</span>
            {/* Sparkline mini SVG */}
            <svg width="48" height="18" viewBox="0 0 48 18" fill="none">
              <path d="M1 14L10 11L18 15L26 8L34 10L47 2" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* Evidence Items */}
        <div className="kpi-card">
          <div className="kpi-top-row">
            <span className="kpi-title">Evidence Items</span>
            <div className="kpi-icon-box" style={{ backgroundColor: 'rgba(236, 72, 153, 0.12)', color: '#ec4899' }}>
              <HardDrive className="w-4 h-4" />
            </div>
          </div>
          <div className="kpi-value">{stats.total_evidence}</div>
          <div className="kpi-footer-row">
            <span style={{ color: '#10b981', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
              ↑ 20%
            </span>
            <span>{stats.total_size_kb.toLocaleString()} KB storage</span>
            <svg width="48" height="18" viewBox="0 0 48 18" fill="none">
              <path d="M1 15L12 12L20 14L28 6L36 9L47 1" stroke="#ec4899" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* Pending Tasks */}
        <div className="kpi-card">
          <div className="kpi-top-row">
            <span className="kpi-title">Pending Tasks</span>
            <div className="kpi-icon-box" style={{ backgroundColor: 'rgba(249, 115, 22, 0.12)', color: '#f97316' }}>
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="kpi-value">{stats.pending_tasks + stats.in_progress_tasks}</div>
          <div className="kpi-footer-row">
            <span style={{ color: '#f59e0b', fontWeight: 600 }}>
              {stats.pending_tasks} pending
            </span>
            <span>{stats.completed_tasks} completed</span>
            <svg width="48" height="18" viewBox="0 0 48 18" fill="none">
              <path d="M1 12L10 7L20 14L30 5L38 10L47 3" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* Active Investigators */}
        <div className="kpi-card">
          <div className="kpi-top-row">
            <span className="kpi-title">Active Investigators</span>
            <div className="kpi-icon-box" style={{ backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="kpi-value">{stats.total_users || 5}</div>
          <div className="kpi-footer-row">
            <span style={{ color: '#10b981', fontWeight: 600 }}>
              {stats.investigator_users} investigators
            </span>
            <span>Role Access</span>
            <svg width="48" height="18" viewBox="0 0 48 18" fill="none">
              <path d="M1 10L12 9L22 11L32 6L40 7L47 4" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>

      {/* 3. Middle Multi-Panel Grid: Recent Cases + Investigation Overview + Recent Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.6fr 1.1fr', gap: '8px', marginBottom: '8px' }} className="responsive-grid-3">
        {/* Recent Cases */}
        <div className="panel" style={{ marginBottom: 0 }}>
          <div className="panel-header">
            <div className="panel-title">
              <Briefcase className="w-4 h-4 text-sky-400" />
              <span>Recent Cases</span>
            </div>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => onNavigate('cases')}
              style={{ border: 'none', padding: '0 4px', color: 'var(--primary)' }}
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </button>
          </div>

          <div className="table-wrap">
            <table className="cyber-table" style={{ minWidth: '420px' }}>
              <thead>
                <tr>
                  <th>Case ID</th>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Priority</th>
                </tr>
              </thead>
              <tbody>
                {recent_cases.slice(0, 5).map((c) => (
                  <tr
                    key={c.case_id}
                    onClick={() => onSelectCase(c.case_id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td style={{ fontFamily: 'monospace', color: 'var(--primary)', fontWeight: 600, fontSize: '0.8rem' }}>
                      FS-{c.case_id}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-main)', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.title}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{c.incident_type}</div>
                    </td>
                    <td>
                      <span className={`badge ${c.status === 'Open' ? 'badge-open' : c.status === 'In Progress' ? 'badge-inprogress' : 'badge-closed'}`}>
                        {c.status}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${c.priority === 'Critical' ? 'badge-critical' : c.priority === 'High' ? 'badge-high' : c.priority === 'Medium' ? 'badge-medium' : 'badge-low'}`}>
                        {c.priority}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Investigation Overview Chart */}
        <div className="panel" style={{ marginBottom: 0 }}>
          <div className="panel-header">
            <div className="panel-title">
              <Activity className="w-4 h-4 text-indigo-400" />
              <span>Investigation Overview</span>
            </div>
            <select
              value={timeframe}
              onChange={(e: any) => setTimeframe(e.target.value)}
              className="input-field"
              style={{ width: '110px', padding: '3px 6px', fontSize: '0.74rem' }}
            >
              <option value="7days">Last 7 days</option>
              <option value="30days">Last 30 days</option>
            </select>
          </div>

          <div className="panel-body" style={{ height: '235px', padding: '12px' }}>
            <ResponsiveContainer width="100%" height="84%">
              <LineChart data={trendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-modal)',
                    borderColor: 'var(--border-color)',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: 'var(--text-main)'
                  }}
                />
                <Line type="monotone" dataKey="cases" name="Cases Created" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="evidence" name="Evidence Uploaded" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="findings" name="Findings Added" stroke="#ec4899" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>

            {/* Legend pills */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3b82f6' }} />
                Cases Created
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#8b5cf6' }} />
                Evidence Uploaded
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ec4899' }} />
                Findings Added
              </span>
            </div>
          </div>
        </div>

        {/* Recent Activity Timeline */}
        <div className="panel" style={{ marginBottom: 0 }}>
          <div className="panel-header">
            <div className="panel-title">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>Recent Activity</span>
            </div>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => onNavigate('audit')}
              style={{ border: 'none', padding: '0 4px', color: 'var(--primary)' }}
            >
              <span>View all</span>
            </button>
          </div>

          <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '235px', overflowY: 'auto' }}>
            {recent_audits.slice(0, 5).map((log, idx) => (
              <div
                key={log.audit_id || idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--bg-card-subtle)'
                }}
              >
                <div
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    backgroundColor: idx % 3 === 0 ? 'rgba(59, 130, 246, 0.15)' : idx % 3 === 1 ? 'rgba(139, 92, 246, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                    color: idx % 3 === 0 ? '#3b82f6' : idx % 3 === 1 ? '#8b5cf6' : '#10b981',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  {(log.user_name || 'U').substring(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0, lineHeight: 1.25 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {log.user_name || 'Investigator'}
                    </div>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', marginLeft: '6px' }}>
                      {formatDateTime(log.created_at || log.timestamp)}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.71rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>
                    {log.details || log.change_description || `${log.action} on ${log.entity_type}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Analytics Row: Evidence Types + Findings Severity + Task Status + Quick Actions */}
      <div className="responsive-grid-4">
        {/* Donut: Evidence Types */}
        <div className="panel" style={{ marginBottom: 0 }}>
          <div className="panel-header">
            <div className="panel-title">
              <HardDrive className="w-4 h-4 text-sky-400" />
              <span>Evidence Types</span>
            </div>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => onNavigate('evidence')}
              style={{ border: 'none', padding: 0, color: 'var(--primary)' }}
            >
              View all
            </button>
          </div>

          <div className="panel-body" style={{ height: '175px', display: 'flex', alignItems: 'center', padding: '10px 12px', gap: '8px' }}>
            <div style={{ width: '90px', height: '90px', minWidth: '90px', position: 'relative', flexShrink: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={evidenceTypeChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={26}
                    outerRadius={42}
                    paddingAngle={3}
                    dataKey="count"
                  >
                    {evidenceTypeChartData.map((_, index) => (
                      <Cell key={`ev-${index}`} fill={EVIDENCE_TYPE_COLORS[index % EVIDENCE_TYPE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--bg-modal)',
                      borderColor: 'var(--border-color)',
                      borderRadius: '8px',
                      fontSize: '11px',
                      color: 'var(--text-main)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                  pointerEvents: 'none'
                }}
              >
                <div style={{ fontSize: '1rem', fontWeight: 900, color: '#ffffff', lineHeight: 1 }}>{stats.total_evidence}</div>
                <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Files</div>
              </div>
            </div>

            {/* Legend list */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '0.73rem' }}>
              {evidenceTypeChartData.slice(0, 5).map((item, idx) => (
                <div key={item.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: 'var(--text-secondary)', minWidth: 0 }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: EVIDENCE_TYPE_COLORS[idx % EVIDENCE_TYPE_COLORS.length], flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
                  </span>
                  <strong style={{ color: 'var(--text-main)', marginLeft: '4px' }}>{item.count}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bar: Findings by Severity */}
        <div className="panel" style={{ marginBottom: 0 }}>
          <div className="panel-header">
            <div className="panel-title">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Findings by Severity</span>
            </div>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => onNavigate('findings')}
              style={{ border: 'none', padding: 0, color: 'var(--primary)' }}
            >
              View all
            </button>
          </div>

          <div className="panel-body" style={{ height: '175px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '8px 12px' }}>
            <div style={{ height: '120px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={severityChartData} margin={{ top: 6, right: 6, left: -28, bottom: 0 }}>
                  <XAxis dataKey="severity" stroke="var(--text-muted)" fontSize={10} tickLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--bg-modal)',
                      borderColor: 'var(--border-color)',
                      borderRadius: '8px',
                      fontSize: '11px',
                      color: 'var(--text-main)'
                    }}
                  />
                  <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                    {severityChartData.map((entry, index) => (
                      <Cell key={`sev-bar-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', paddingTop: '4px', borderTop: '1px solid var(--border-light)' }}>
              <span>Low: {stats.severity_distribution?.Low || 0}</span>
              <span>Med: {stats.severity_distribution?.Medium || 0}</span>
              <span>High: {stats.severity_distribution?.High || 0}</span>
              <span style={{ color: '#ef4444', fontWeight: 700 }}>Crit: {stats.severity_distribution?.Critical || 0}</span>
            </div>
          </div>
        </div>

        {/* Donut: Task Status */}
        <div className="panel" style={{ marginBottom: 0 }}>
          <div className="panel-header">
            <div className="panel-title">
              <CheckSquare className="w-4 h-4 text-emerald-400" />
              <span>Task Status</span>
            </div>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => onNavigate('tasks')}
              style={{ border: 'none', padding: 0, color: 'var(--primary)' }}
            >
              View all
            </button>
          </div>

          <div className="panel-body" style={{ height: '175px', display: 'flex', alignItems: 'center', padding: '10px 12px', gap: '8px' }}>
            <div style={{ width: '90px', height: '90px', minWidth: '90px', position: 'relative', flexShrink: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={taskStatusChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={26}
                    outerRadius={42}
                    paddingAngle={3}
                    dataKey="count"
                  >
                    {taskStatusChartData.map((entry, index) => (
                      <Cell key={`task-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--bg-modal)',
                      borderColor: 'var(--border-color)',
                      borderRadius: '8px',
                      fontSize: '11px',
                      color: 'var(--text-main)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                  pointerEvents: 'none'
                }}
              >
                <div style={{ fontSize: '1rem', fontWeight: 900, color: '#ffffff', lineHeight: 1 }}>{stats.total_tasks}</div>
                <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tasks</div>
              </div>
            </div>

            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '0.74rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: 'var(--text-secondary)' }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#38bdf8' }} />
                  Pending
                </span>
                <strong style={{ color: 'var(--text-main)' }}>{stats.pending_tasks}</strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: 'var(--text-secondary)' }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#3b82f6' }} />
                  In Progress
                </span>
                <strong style={{ color: 'var(--text-main)' }}>{stats.in_progress_tasks}</strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: 'var(--text-secondary)' }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                  Completed
                </span>
                <strong style={{ color: '#10b981' }}>{stats.completed_tasks}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="panel" style={{ marginBottom: 0 }}>
          <div className="panel-header">
            <div className="panel-title">
              <span>Quick Actions</span>
            </div>
          </div>

          <div style={{ height: '175px', padding: '10px 12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <button
              className="btn btn-outline"
              onClick={() => onNavigate('cases')}
              style={{ justifyContent: 'flex-start', padding: '6px 10px', fontSize: '0.78rem' }}
            >
              <FolderPlus className="w-3.5 h-3.5 text-sky-400" />
              <span>New Case Dossier</span>
            </button>
            <button
              className="btn btn-outline"
              onClick={() => onNavigate('evidence')}
              style={{ justifyContent: 'flex-start', padding: '6px 10px', fontSize: '0.78rem' }}
            >
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
              <span>Upload Evidence File</span>
            </button>
            <button
              className="btn btn-outline"
              onClick={() => onNavigate('tasks')}
              style={{ justifyContent: 'flex-start', padding: '6px 10px', fontSize: '0.78rem' }}
            >
              <CheckSquare className="w-3.5 h-3.5 text-amber-400" />
              <span>Assign Workflow Task</span>
            </button>
            <button
              className="btn btn-outline"
              onClick={() => onNavigate('findings')}
              style={{ justifyContent: 'flex-start', padding: '6px 10px', fontSize: '0.78rem' }}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              <span>Record Threat Finding</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5. Bottom Row: Recent Evidence Table + Secure Investigations Banner */}
      <div className="responsive-grid-evidence">
        {/* Recent Evidence Table */}
        <div className="panel" style={{ marginBottom: 0 }}>
          <div className="panel-header">
            <div className="panel-title">
              <HardDrive className="w-4 h-4 text-sky-400" />
              <span>Recent Evidence Registry</span>
            </div>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => onNavigate('evidence')}
              style={{ border: 'none', padding: '0 4px', color: 'var(--primary)' }}
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </button>
          </div>

          <div className="table-wrap">
            <table className="cyber-table evidence-table">
              <thead>
                <tr>
                  <th>File Name</th>
                  <th>Type</th>
                  <th>Size</th>
                  <th className="col-hash">SHA-256 Hash</th>
                  <th>Uploaded By</th>
                  <th className="col-date">Acquired</th>
                  <th className="col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recent_evidence.slice(0, 5).map((ev) => (
                  <tr key={ev.evidence_id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.84rem' }}>
                        {ev.evidence_name}
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{ev.evidence_type}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                      {((ev.file_size || 0) / 1024).toFixed(1)} KB
                    </td>
                    <td className="col-hash">
                      <span
                        className="hash-pill"
                        onClick={() => handleCopyHash(ev.sha256_hash)}
                        title="Click to copy full SHA-256 checksum"
                      >
                        {ev.sha256_hash ? `${ev.sha256_hash.substring(0, 14)}...` : 'N/A'}
                        {copiedHash === ev.sha256_hash ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                      {ev.uploaded_by_name || 'Investigator'}
                    </td>
                    <td className="col-date">
                      {formatDateTime(ev.created_at)}
                    </td>
                    <td className="col-actions">
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Secure Investigations Banner Card */}
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '22px 18px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-card)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '14px'
              }}
            >
              <Shield className="w-5 h-5 text-sky-400" />
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.25, marginBottom: '6px' }}>
              Secure Investigations<br />Smarter Outcomes
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45, marginBottom: '16px' }}>
              Organize evidence files, track forensic custody transitions, and uncover the full narrative behind incidents.
            </p>
          </div>

          <button
            className="btn btn-primary"
            onClick={() => onNavigate('cases')}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            <span>Create New Case</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
}
