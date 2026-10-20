import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  Calendar,
  Users,
  Briefcase,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  RefreshCw,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { api } from '../services/api';
import { User, Task, Case } from '../types';
import { formatDate, formatDateTime } from '../utils/date';

interface TasksPageProps {
  currentUser: User | null;
  onNavigateCase: (caseId: number) => void;
  showToast: (msg: string, type?: 'info' | 'success' | 'error') => void;
}

export default function TasksPage({
  currentUser,
  onNavigateCase,
  showToast
}: TasksPageProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [caseFilter, setCaseFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [dueDateFilter, setDueDateFilter] = useState('');

  // Create Task Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState<number>(1);
  const [taskTitle, setTaskTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState('Pending');
  const [assignedUserIds, setAssignedUserIds] = useState<number[]>([]);

  const isViewer = currentUser?.role === 'Viewer';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tasksRes, casesRes, usersRes] = await Promise.all([
        api.getTasks(),
        api.getCases(),
        api.getUsers()
      ]);
      setTasks(tasksRes.tasks || []);
      setCases(casesRes.cases || []);
      setUsers(usersRes.users || []);
      if (casesRes.cases?.length > 0) {
        setSelectedCaseId(casesRes.cases[0].case_id);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load tasks', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) {
      showToast('Please enter a task title', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.createTask({
        case_id: selectedCaseId,
        task_title: taskTitle,
        description,
        due_date: dueDate || undefined,
        status,
        user_ids: assignedUserIds
      });
      showToast(res.message || 'Task assigned successfully', 'success');
      setShowCreateModal(false);
      setTaskTitle('');
      setDescription('');
      setAssignedUserIds([]);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to create task', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (taskId: number, newStatus: string) => {
    if (isViewer) return;
    try {
      const res = await api.updateTaskStatus(taskId, newStatus, currentUser?.user_id || 1);
      showToast(res.message || 'Workflow status updated via stored procedure', 'success');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update task status', 'error');
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.task_title.toLowerCase().includes(search.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(search.toLowerCase())) ||
      (t.case_title && t.case_title.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = !statusFilter || t.status === statusFilter;
    const matchesCase = !caseFilter || String(t.case_id) === caseFilter;

    let matchesUser = true;
    if (userFilter) {
      const userObj = users.find((u) => String(u.user_id) === userFilter);
      const uName = userObj ? userObj.name.toLowerCase() : '';
      const inAssignedNames = t.assigned_users && t.assigned_users.toLowerCase().includes(uName);
      const inAssignedIds = t.assigned_user_ids && t.assigned_user_ids.split(',').map((x) => x.trim()).includes(userFilter);
      matchesUser = Boolean(inAssignedNames || inAssignedIds);
    }

    let matchesDueDate = true;
    if (dueDateFilter === 'overdue') {
      matchesDueDate = Boolean(t.due_date && t.due_date < todayStr && t.status !== 'Completed');
    } else if (dueDateFilter === 'upcoming') {
      matchesDueDate = Boolean(t.due_date && t.due_date >= todayStr);
    }

    return matchesSearch && matchesStatus && matchesCase && matchesUser && matchesDueDate;
  });

  // Calculate quick stats
  const totalCount = tasks.length;
  const pendingCount = tasks.filter((t) => t.status === 'Pending').length;
  const inProgressCount = tasks.filter((t) => t.status === 'In Progress').length;
  const completedCount = tasks.filter((t) => t.status === 'Completed').length;
  const overdueCount = tasks.filter((t) => t.due_date && t.due_date < todayStr && t.status !== 'Completed').length;

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
            <span className="crumb-active">Tasks</span>
          </div>
          <h1 className="page-title cyber-glitch-text" data-text="Investigation Tasks">Investigation Tasks</h1>
          <p className="page-subtitle">
            Coordinate forensic milestones, investigator assignments, and analytical deliverables across active cases.
          </p>
        </div>

        <div className="page-header-actions">
          <button className="btn btn-outline" onClick={loadData} title="Refresh tasks">
            <RefreshCw className="w-4 h-4 mr-1" />
            <span>Refresh</span>
          </button>
          {!isViewer && (
            <button
              className="btn btn-primary"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="w-4 h-4 mr-1" />
              <span>Assign Workflow Task</span>
            </button>
          )}
        </div>
      </div>

      {/* Task Telemetry KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Total Tasks</span>
            <CheckSquare className="w-4 h-4 text-sky-400" />
          </div>
          <div className="kpi-value">{totalCount}</div>
          <div className="kpi-footer">Across all assigned cases</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Pending</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="kpi-value">{pendingCount}</div>
          <div className="kpi-footer">Awaiting investigation triage</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">In Progress</span>
            <RefreshCw className="w-4 h-4 text-sky-400" />
          </div>
          <div className="kpi-value">{inProgressCount}</div>
          <div className="kpi-footer">Active forensic analysis</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="kpi-value">{completedCount}</div>
          <div className="kpi-footer">Deliverables committed</div>
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
            placeholder="Search tasks, descriptions, or case titles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field"
            style={{ paddingLeft: '36px', width: '100%' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Filter by Case */}
          <select
            value={caseFilter}
            onChange={(e) => setCaseFilter(e.target.value)}
            className="input-field"
            style={{ width: '150px' }}
          >
            <option value="">All Cases</option>
            {cases.map((c) => (
              <option key={c.case_id} value={String(c.case_id)}>
                #{c.case_id} {c.title.length > 18 ? c.title.substring(0, 16) + '...' : c.title}
              </option>
            ))}
          </select>

          {/* Filter by Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field"
            style={{ width: '130px' }}
          >
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>

          {/* Filter by Assigned User */}
          <select
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            className="input-field"
            style={{ width: '150px' }}
          >
            <option value="">All Investigators</option>
            {users.map((u) => (
              <option key={u.user_id} value={String(u.user_id)}>
                {u.name} ({u.role})
              </option>
            ))}
          </select>

          {/* Filter by Due Date */}
          <select
            value={dueDateFilter}
            onChange={(e) => setDueDateFilter(e.target.value)}
            className="input-field"
            style={{ width: '130px' }}
          >
            <option value="">All Deadlines</option>
            <option value="overdue">Overdue ({overdueCount})</option>
            <option value="upcoming">Upcoming</option>
          </select>
        </div>
      </div>

      {/* Main Tasks Table Panel */}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">
            <CheckSquare className="w-4 h-4 text-sky-400" />
            <span>Workflow Tasks ({filteredTasks.length})</span>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Forensic Milestones & State Ledger
          </span>
        </div>

        <div className="table-wrap">
          <table className="cyber-table tasks-table">
            <thead>
              <tr>
                <th className="col-id">Task ID</th>
                <th style={{ width: '340px', minWidth: '280px' }}>Task Brief & Instructions</th>
                <th style={{ width: '180px', minWidth: '160px' }}>Associated Case</th>
                <th style={{ width: '180px', minWidth: '160px' }}>Assigned Investigators</th>
                <th className="col-date" style={{ width: '130px' }}>Target Due Date</th>
                <th className="col-status" style={{ width: '120px' }}>Workflow Status</th>
                {!isViewer && <th className="col-actions">Status Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    Loading workflow tasks...
                  </td>
                </tr>
              ) : filteredTasks.length > 0 ? (
                filteredTasks.map((t) => {
                  const isOverdue = t.due_date && t.due_date < todayStr && t.status !== 'Completed';
                  const statusBadgeClass =
                    t.status === 'Completed'
                      ? 'badge-completed'
                      : t.status === 'In Progress'
                      ? 'badge-inprogress'
                      : 'badge-open';

                  return (
                    <tr key={t.task_id}>
                      <td className="col-id">
                        #{t.task_id}
                      </td>
                      <td style={{ width: '340px', minWidth: '280px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.88rem' }}>
                          {t.task_title}
                        </div>
                        {t.description && (
                          <div
                            style={{
                              fontSize: '0.78rem',
                              color: 'var(--text-muted)',
                              marginTop: '4px',
                              lineHeight: 1.45,
                              wordBreak: 'break-word',
                              minWidth: '260px',
                              maxWidth: '400px'
                            }}
                          >
                            {t.description}
                          </div>
                        )}
                      </td>
                      <td style={{ width: '180px', minWidth: '160px' }}>
                        <button
                          onClick={() => onNavigateCase(t.case_id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#38bdf8',
                            cursor: 'pointer',
                            fontSize: '0.84rem',
                            fontWeight: 500,
                            textAlign: 'left',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: 0
                          }}
                        >
                          <Briefcase className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>#{t.case_id} {t.case_title || 'View Case'}</span>
                        </button>
                      </td>
                      <td style={{ width: '180px', minWidth: '160px' }}>
                        {t.assignees && t.assignees.length > 0 ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                            {t.assignees.map((a) => (
                              <span
                                key={a.user_id}
                                style={{
                                  fontSize: '0.74rem',
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  backgroundColor: 'var(--bg-card-subtle)',
                                  color: 'var(--text-secondary)',
                                  border: '1px solid var(--border-color)',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#38bdf8', flexShrink: 0 }} />
                                {a.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Unassigned</span>
                        )}
                      </td>
                      <td className="col-date" style={{ width: '130px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                          <span
                            style={{
                              fontSize: '0.82rem',
                              color: isOverdue ? '#ef4444' : 'var(--text-secondary)',
                              fontWeight: isOverdue ? 600 : 400
                            }}
                          >
                            {formatDate(t.due_date)}
                          </span>
                          {isOverdue && (
                            <span className="badge badge-critical" style={{ fontSize: '0.65rem', padding: '1px 5px' }}>
                              OVERDUE
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="col-status" style={{ width: '120px' }}>
                        <span className={`badge ${statusBadgeClass}`}>
                          {t.status}
                        </span>
                      </td>
                      {!isViewer && (
                        <td className="col-actions">
                          <select
                            value={t.status}
                            onChange={(e) => handleUpdateStatus(t.task_id, e.target.value)}
                            className="input-field"
                            style={{
                              padding: '4px 8px',
                              fontSize: '0.78rem',
                              width: '120px',
                              display: 'inline-block'
                            }}
                          >
                            <option value="Pending">Pending</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                          </select>
                        </td>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No investigation workflow tasks match the filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div className="modal-head">
              <h3>Assign Investigation Workflow Task</h3>
              <button className="modal-close-btn" onClick={() => setShowCreateModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateTask}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px' }}>
                <div>
                  <label className="input-label">Investigation Case *</label>
                  <select
                    value={selectedCaseId}
                    onChange={(e) => setSelectedCaseId(Number(e.target.value))}
                    className="input-field"
                    style={{ width: '100%' }}
                  >
                    {cases.map((c) => (
                      <option key={c.case_id} value={c.case_id}>
                        Case #{c.case_id}: {c.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="input-label">Task Objective / Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Reverse-engineer dropper shellcode and extract C2 beacon IPs"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    className="input-field"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label className="input-label">Task Instructions & Deliverables</label>
                  <textarea
                    rows={3}
                    placeholder="Provide specific technical instructions or expected forensic deliverables..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="input-field"
                    style={{ width: '100%', resize: 'vertical' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label className="input-label">Initial Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="input-field"
                      style={{ width: '100%' }}
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>

                  <div>
                    <label className="input-label">Target Completion Date</label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="input-field"
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>

                <div>
                  <label className="input-label">Assign Forensic Investigators</label>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      maxHeight: '150px',
                      overflowY: 'auto',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      padding: '10px',
                      backgroundColor: 'var(--bg-card-subtle)'
                    }}
                  >
                    {users.map((u) => {
                      const isChecked = assignedUserIds.includes(u.user_id);
                      return (
                        <label
                          key={u.user_id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '0.84rem',
                            color: 'var(--text-main)',
                            cursor: 'pointer'
                          }}
                        >
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
                          />
                          <span>{u.name} ({u.role})</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="modal-foot">
                <button type="button" className="btn btn-outline" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? 'Creating Task...' : 'Assign Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
