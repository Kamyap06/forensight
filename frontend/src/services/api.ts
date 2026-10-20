import {
  User, Case, Evidence, Task, Finding, CustodyLog, EvidenceNote,
  AuditLog, DatabaseTable, ColumnMeta, ForeignKeyMeta, DashboardStats
} from '../types';

const BASE_URL = '/api';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const headers: Record<string, string> = { ...(options.headers as Record<string, string>) };

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  // Include credentials for session cookies
  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include'
  });

  const contentType = response.headers.get('content-type') || '';
  let data: any;
  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    const text = await response.text();
    data = { message: text };
  }

  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }
  return data as T;
}

export const api = {
  // System Health
  getDbCheck: () => request<{
    status: string;
    database: string;
    tables_count: number;
    tables: string[];
    views_count: number;
    views: string[];
  }>('/db-check'),

  // Authentication
  login: (credentials: { email: string; password: string }) =>
    request<{ status: string; message: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    }),

  register: (userData: { name: string; email: string; password: string; role?: string }) =>
    request<{ status: string; message: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    }),

  setupAdmin: (adminData: { name: string; email: string; password: string }) =>
    request<{ status: string; message: string; user: User }>('/auth/setup-admin', {
      method: 'POST',
      body: JSON.stringify(adminData)
    }),

  logout: () => request<{ status: string; message: string }>('/auth/logout', { method: 'POST' }),

  getMe: () => request<{ status: string; user: User }>('/auth/me'),

  // Dashboard
  getDashboard: () => request<{
    status: string;
    stats: DashboardStats;
    recent_cases: Case[];
    recent_evidence?: Evidence[];
    evidence_by_type?: { name: string; count: number }[];
    task_status_breakdown?: { name: string; count: number }[];
    critical_findings: Finding[];
    recent_audits: AuditLog[];
  }>('/dashboard'),

  // Users catalog
  getUsers: () => request<{ status: string; users: User[] }>('/users'),

  // Cases CRUD
  getCases: () => request<{ status: string; cases: Case[] }>('/cases'),

  getCase: (id: number) => request<{
    status: string;
    case: Case;
    evidence: Evidence[];
    tasks: Task[];
    findings: Finding[];
    custody?: CustodyLog[];
    notes?: EvidenceNote[];
    audit?: AuditLog[];
  }>(`/cases/${id}`),

  createCase: (data: Partial<Case>) =>
    request<{ status: string; message: string; case_id: number }>('/cases', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  updateCase: (id: number, data: Partial<Case>) =>
    request<{ status: string; message: string }>(`/cases/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  deleteCase: (id: number) =>
    request<{ status: string; message: string }>(`/cases/${id}`, { method: 'DELETE' }),

  downloadCaseReport: async (caseId: number, format: 'pdf' | 'doc', sections?: string[]) => {
    let url = `${BASE_URL}/cases/${caseId}/report/${format}`;
    if (sections && sections.length > 0) {
      url += `?sections=${encodeURIComponent(sections.join(','))}`;
    }
    const res = await fetch(url, {
      credentials: 'include'
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Failed to download ${format.toUpperCase()} report`);
    }
    const blob = await res.blob();
    const ext = format === 'doc' ? 'docx' : 'pdf';
    const urlObj = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = urlObj;
    a.download = `ForenSight_Case_${caseId}_Report.${ext}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(urlObj);
    document.body.removeChild(a);
  },

  getCaseReportUrl: (caseId: number, format: 'pdf' | 'doc') =>
    `${BASE_URL}/cases/${caseId}/report/${format}`,

  associateEvidence: (caseId: number, evidenceIds: number[]) =>
    request<{ status: string; message: string }>(`/cases/${caseId}/evidence`, {
      method: 'POST',
      body: JSON.stringify({ evidence_ids: evidenceIds })
    }),

  disassociateEvidence: (caseId: number, evidenceId: number) =>
    request<{ status: string; message: string }>(`/cases/${caseId}/evidence/${evidenceId}`, {
      method: 'DELETE'
    }),

  // Evidence Lab
  getEvidence: () => request<{ status: string; evidence: Evidence[] }>('/evidence'),

  uploadEvidence: (formData: FormData) =>
    request<{ status: string; message: string; data: Evidence }>('/evidence', {
      method: 'POST',
      body: formData
    }),

  deleteEvidence: (id: number) =>
    request<{ status: string; message: string }>(`/evidence/${id}`, { method: 'DELETE' }),

  downloadEvidence: async (evidenceId: number, fallbackName?: string) => {
    const res = await fetch(`${BASE_URL}/evidence/${evidenceId}/download`, {
      credentials: 'include'
    });
    if (!res.ok) {
      let errMsg = 'Failed to download evidence artifact';
      try {
        const errJson = await res.json();
        errMsg = errJson.message || errMsg;
      } catch {}
      throw new Error(errMsg);
    }
    const blob = await res.blob();
    const disposition = res.headers.get('content-disposition');
    let filename = fallbackName || `evidence_${evidenceId}.bin`;
    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (match && match[1]) {
        filename = match[1].replace(/['"]/g, '').trim();
      }
    }
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  downloadEvidenceUrl: (id: number) => `${BASE_URL}/evidence/${id}/download`,

  // Investigation Tasks
  getTasks: () => request<{ status: string; tasks: Task[] }>('/tasks'),

  createTask: (data: {
    case_id: number;
    task_title: string;
    description: string;
    due_date?: string;
    status: string;
    user_ids: number[];
  }) => request<{ status: string; message: string; task_id: number }>('/tasks', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  updateTaskStatus: (taskId: number, status: string, userId: number = 1) =>
    request<{ status: string; message: string }>(`/tasks/${taskId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, user_id: userId })
    }),

  // Analysis Findings
  getFindings: () => request<{ status: string; findings: Finding[] }>('/findings'),

  createFinding: (data: {
    evidence_id: number;
    finding_type: string;
    severity: string;
    description: string;
  }) => request<{ status: string; message: string; finding_id: number }>('/findings', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  // Chain of Custody
  getCustodyLogs: () => request<{ status: string; custody_logs: CustodyLog[] }>('/custody-logs'),

  addCustodyLog: (data: {
    evidence_id: number;
    user_id?: number;
    action: string;
    notes: string;
  }) => request<{ status: string; message: string; log_id: number }>('/custody-logs', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  // Evidence Notes
  getNotes: () => request<{ status: string; notes: EvidenceNote[] }>('/evidence-notes'),

  addNote: (data: {
    evidence_id: number;
    user_id?: number;
    note_text: string;
  }) => request<{ status: string; message: string; note_id: number }>('/evidence-notes', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  // System Audit Logs
  getAuditLogs: () => request<{ status: string; audit_logs: AuditLog[] }>('/audit-logs'),

  // Reports
  getReports: () => request<{
    status: string;
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
  }>('/reports'),

  // Admin Control Center
  getDatabaseOverview: () => request<{
    status: string;
    database_name: string;
    tables_count: number;
    tables: DatabaseTable[];
    views_count: number;
    views: string[];
    foreign_keys_count: number;
    foreign_keys: ForeignKeyMeta[];
  }>('/admin/database'),

  getTableDetails: (tableName: string, page: number = 1, limit: number = 25) =>
    request<{
      status: string;
      table_name: string;
      columns: ColumnMeta[];
      foreign_keys: ForeignKeyMeta[];
      total_rows: number;
      page: number;
      limit: number;
      rows: Record<string, any>[];
    }>(`/admin/database/tables/${tableName}?page=${page}&limit=${limit}`),

  getAdminUsers: () => request<{ status: string; users: User[] }>('/admin/users'),

  updateUserRole: (userId: number, role: 'Admin' | 'Investigator' | 'Viewer') =>
    request<{ status: string; message: string }>(`/admin/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role })
    })
};
