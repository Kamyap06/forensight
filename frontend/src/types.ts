export interface User {
  user_id: number;
  name: string;
  email: string;
  role: 'Admin' | 'Investigator' | 'Viewer';
  created_at?: string;
  cases_created_count?: number;
  tasks_assigned_count?: number;
  custody_actions_count?: number;
}

export interface Case {
  case_id: number;
  title: string;
  incident_type: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Open' | 'In Progress' | 'Closed';
  created_by: number;
  creator_name?: string;
  created_by_name?: string;
  created_by_email?: string;
  created_at: string;
  updated_at?: string;
  evidence_count?: number;
  task_count?: number;
}

export interface Evidence {
  evidence_id: number;
  evidence_name: string;
  evidence_type: string;
  file_path: string;
  sha256_hash: string;
  file_size: number;
  collected_at?: string;
  status: string;
  uploaded_by: number;
  uploader_name?: string;
  uploaded_by_name?: string;
  created_at: string;
  associated_cases?: string;
  cases?: { case_id: number; title?: string }[];
}

export interface Task {
  task_id: number;
  case_id: number;
  case_title: string;
  task_title: string;
  description: string;
  due_date?: string;
  status: string;
  created_at: string;
  assigned_users?: string;
  assigned_user_ids?: string;
  assignees?: { user_id: number; name: string }[];
}

export interface Finding {
  finding_id: number;
  evidence_id: number;
  evidence_name: string;
  evidence_type?: string;
  finding_type: string;
  severity: string;
  description: string;
  created_at: string;
  case_context?: string;
}

export interface CustodyLog {
  log_id: number;
  evidence_id: number;
  evidence_name: string;
  evidence_type?: string;
  sha256_hash?: string;
  user_id: number;
  user_name?: string;
  responsible_user_name?: string;
  user_role: string;
  action: string;
  notes?: string;
  event_time?: string;
  timestamp: string;
}

export interface EvidenceNote {
  note_id: number;
  evidence_id: number;
  evidence_name: string;
  user_id: number;
  user_name?: string;
  user_role?: string;
  author_name?: string;
  author_role?: string;
  note_text: string;
  created_at: string;
}

export interface AuditLog {
  log_id?: number;
  audit_id: number;
  user_id?: number | null;
  user_name: string;
  user_role?: string;
  action: string;
  table_name?: string;
  record_id?: number | null;
  change_description?: string;
  entity_type: string;
  entity_id?: number | null;
  details: string;
  created_at: string;
  timestamp: string;
}

export interface DatabaseTable {
  name: string;
  table_name?: string;
  row_count: number;
  exact_rows?: number;
  size_kb?: number;
  data_size_kb?: number;
  engine?: string;
  collation?: string;
}

export interface ColumnMeta {
  name: string;
  type: string;
  nullable: string;
  key: string;
  default: any;
  extra: string;
  column_name?: string;
  data_type?: string;
  is_nullable?: string;
  column_key?: string;
  default_value?: any;
}

export interface ForeignKeyMeta {
  column_name: string;
  constraint_name: string;
  referenced_table?: string;
  referenced_column?: string;
  referenced_table_name?: string;
  referenced_column_name?: string;
}

export interface DashboardStats {
  total_cases: number;
  open_cases: number;
  in_progress_cases: number;
  closed_cases: number;
  total_evidence: number;
  total_size_kb: number;
  total_tasks: number;
  pending_tasks: number;
  in_progress_tasks: number;
  completed_tasks: number;
  total_findings: number;
  critical_findings: number;
  total_users: number;
  admin_users: number;
  investigator_users: number;
  viewer_users: number;
  severity_distribution: {
    Critical: number;
    High: number;
    Medium: number;
    Low: number;
  };
}
