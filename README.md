# ForenSight — Digital Evidence & Investigation Management System

> **Tagline:** *Every digital trace tells a story.*  
> **Project Type:** Cybersecurity Incident Investigation & Digital Evidence Management System (Academic DBMS Project)  
> **Design Philosophy:** Premium cybersecurity SaaS interface inspired by Linear and Vercel dark systems (`#070b14` / `#0f172a`), typed with TypeScript, styled with Tailwind CSS, visualized with Recharts, powered by Flask, and rooted in a 3NF normalized MySQL relational database.

---

## 1. Project Overview & Architecture

ForenSight is a full-stack, database-driven cybersecurity software platform designed for incident response teams, forensic specialists, and compliance auditors. It organizes cybersecurity case dossiers, manages digital evidence metadata, computes and verifies cryptographic SHA-256 hashes, maintains immutable chain-of-custody records, documents threat indicators, coordinates multi-investigator workflows, and captures database trigger-backed audit trails.

### Technology Stack
- **Database:** MySQL 8.0 (Database name: `forensight` on port 3306)
- **Database Management Tool:** MySQL Workbench
- **Backend:** Python 3.11 + Flask REST APIs (`mysql-connector-python`, `werkzeug.security` scrypt, `flask-cors`, `python-dotenv`)
- **Frontend:** React 19 + TypeScript (`.tsx`) + Vite + Tailwind CSS + Lucide React + Recharts
- **Storage:** Local secure `uploads/` directory with cryptographic SHA-256 hash tracking
- **Local Environment:** Windows (PowerShell / Command Prompt)

---

## 2. Role-Based Access Control & Test Accounts

ForenSight implements secure session cookies and three distinct operational personas with password hashes secured via Werkzeug scrypt:

| Role | Test User Email | Password | Permissions & System Scope |
|---|---|---|---|
| **Admin** | `kamya@example.com` | `Admin@123` | **Full Administrative Control:** Access to dedicated **MySQL Database Explorer** (introspecting all 10 tables, schema data types, nullability, primary/foreign keys, and live records with password masking), user role management, plus full incident management. |
| **Investigator** | `malishka@example.com`<br>`laxmi@example.com`<br>`amey@example.com` | `Investigator@123` | **Incident Operations:** Full CRUD on cases, evidence files, task assignments, findings, notes, and custody transfers. Restricted from Admin Database Explorer and User Role modification. |
| **Viewer** | `harsh@example.com` | `Viewer@123` | **Read-Only Forensic Audit:** Can inspect cases, evidence metadata, reports, and custody logs. All create, update, delete, and admin routes return `403 Forbidden`. |

*Note: The login screen features convenient **One-Click Quick-Fill Buttons** for each test persona for effortless evaluation.*

---

## 3. Relational Database Schema (10 Tables in 3NF)

The active MySQL database `forensight` conforms strictly to the relational 10-table specification with composite-key M:N junction tables:

| # | Relational Table | Academic Purpose | Primary Key | Foreign Key Constraints & Relationships |
|---|---|---|---|---|
| 1 | `users` | Investigators and system accounts | `user_id` (PK) | Referenced by Cases, Evidence, Custody, Notes, Tasks |
| 2 | `cases` | Incident investigation dossiers | `case_id` (PK) | `created_by` &rarr; `users.user_id` |
| 3 | `evidence` | Digital evidence metadata & SHA-256 | `evidence_id` (PK) | `uploaded_by` &rarr; `users.user_id` |
| 4 | `caseevidence` | **M:N Junction:** Cases & Evidence | `(case_id, evidence_id)` | FK &rarr; `cases.case_id`, FK &rarr; `evidence.evidence_id` |
| 5 | `custodylogs` | Append-only evidence custody events | `log_id` (PK) | FK &rarr; `evidence.evidence_id`, FK &rarr; `users.user_id` |
| 6 | `analysisfindings` | Threat indicators & severity ratings | `finding_id` (PK) | FK &rarr; `evidence.evidence_id` |
| 7 | `investigationtasks` | Workflow tasks linked to cases | `task_id` (PK) | FK &rarr; `cases.case_id` |
| 8 | `taskassignments` | **M:N Junction:** Tasks & Investigators | `(task_id, user_id)` | FK &rarr; `investigationtasks.task_id`, FK &rarr; `users.user_id` |
| 9 | `evidencenotes` | Technical observations & notes | `note_id` (PK) | FK &rarr; `evidence.evidence_id`, FK &rarr; `users.user_id` |
| 10 | `auditlogs` | Immutable system & trigger audit log | `audit_id` (PK) | FK &rarr; `users.user_id` (nullable for system triggers) |

---

## 4. Experiment Implementation Summary

### Experiment 7 — Requirement Analysis & Relational Design
- Fully normalized 10-table schema in Third Normal Form (3NF).
- Elimination of transitive dependencies and duplicate foreign keys.
- Verified referential integrity across 13 foreign key constraints.

### Experiment 8 — Advanced SQL Queries (`sql/experiment8_queries.sql`)
- Multi-table `INNER JOIN` and `LEFT JOIN` operations across cases, evidence, custody, and users.
- Aggregate metrics: `COUNT()`, `SUM()`, `AVG()`, `ROUND()`.
- Grouping with `GROUP BY` and filtered aggregates via `HAVING`.
- Correlated subqueries and nested subqueries calculating evidence volume and threat ratios.

### Experiment 9 — Database Programmability (`sql/experiment9_programmability.sql`)
- **Views:**
  1. `vw_case_evidence_summary`: Aggregates case metadata, linked evidence count, storage in KB, active tasks, and critical findings.
  2. `vw_high_severity_findings`: Filters high and critical severity threats and joins evidence and associated cases.
  3. `vw_investigation_task_assignments`: Resolves tasks, case titles, and multi-user investigator assignees.
- **Stored Procedures:**
  1. `sp_add_case`: Transaction-safe case creation with validation and audit logging.
  2. `sp_update_task_status`: Updates task status and logs user attribution.
- **Database Triggers:**
  1. `trg_after_custody_insert`: Automatically commits an audit trail record into `auditlogs` whenever a chain-of-custody transfer is logged.
  2. `trg_after_finding_insert`: Automatically commits an audit trail record into `auditlogs` whenever a security finding is documented.

### Experiment 10 — Full-Stack Application & Admin Control Center
- Public SaaS Landing Page with security architecture diagrams and workflow showcases.
- Role-based investigation workspace with real-time MySQL synchronization.
- Real file uploads with server-side SHA-256 calculation and evidence file download.
- Recharts visualizations for threat severity distribution and workflow allocations.
- **Admin Control Center:** Live MySQL Database Explorer browsing all 10 tables, column data types, keys, and paginated records with password masking.

---

## 5. How to Run Locally on Windows

### Prerequisites
1. **Python 3.10+** installed.
2. **Node.js 18+** installed.
3. **MySQL Server 8.0** running locally on port 3306 with database `forensight`.

---

### Step 1: Verify Environment Configuration (`.env`)
Make sure your root `.env` file contains your local MySQL password:
```ini
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=forensight
DB_PORT=3306
SECRET_KEY=forensight_secure_session_key_2026
UPLOAD_FOLDER=uploads
MAX_CONTENT_LENGTH=52428800
```

---

### Step 2: Running the Application (Choose Option A or Option B)

#### Option A — Single Server Mode (Flask serves built React app):
The React frontend is pre-built into `frontend/dist/`. You can run the entire application on **a single port**:
```powershell
# Open Terminal in C:\Users\DELL\ForenSight
.\venv\Scripts\python.exe app.py
```
Open your browser and navigate to:
```
http://localhost:5000
```

#### Option B — Dual Dev Mode (Flask API + React Vite Hot-Reload):
If you want to edit React code with instant hot-reloading:

**Terminal 1 (Flask REST API):**
```powershell
cd C:\Users\DELL\ForenSight
.\venv\Scripts\python.exe app.py
```

**Terminal 2 (React Vite Dev Server):**
```powershell
cd C:\Users\DELL\ForenSight\frontend
npm run dev
```
Open your browser and navigate to:
```
http://localhost:5173
```

---

## 6. Automated Test Suite Execution

Run the comprehensive end-to-end regression test suite verifying all 10 tables, views, procedures, triggers, RBAC, file hashing, and static delivery:

```powershell
# 1. Run full end-to-end regression tests (Flask API + DB + RBAC + Static files)
.\venv\Scripts\python.exe tests/test_full_system.py

# 2. Run live multi-stage user workflow test (Registration, Ingestion, Triggers, DB Explorer)
.\venv\Scripts\python.exe tests/test_live_workflow.py

# 3. Test all Experiment 8 SQL queries against MySQL
.\venv\Scripts\python.exe sql/test_queries.py

# 4. Test Experiment 9 views, procedures, and triggers against MySQL
.\venv\Scripts\python.exe sql/test_programmability.py
```
Expected output:
```
Ran 7 tests in 1.871s

OK
[PASS] Database connectivity & 10 relational tables verified.
[PASS] RBAC enforced: Investigator blocked from Admin endpoints (403 Forbidden).
[PASS] RBAC enforced: Viewer blocked from mutations (403 Forbidden).
[PASS] Real file upload: backend computed exact SHA-256.
[PASS] Evidence file download endpoint verified.
[PASS] M:N CaseEvidence link verified.
[PASS] Evidence cleanup verified.
[PASS] Stored procedure sp_update_task_status executed successfully.
[PASS] Database trigger trg_after_custody_insert verified.
[PASS] Relational views verified: 6 cases summarized.
[PASS] Admin Database Explorer verified: all 10 tables introspected with password masking.
[PASS] Static frontend delivery: Flask successfully serves built React application.
```

---

## 7. Academic Screenshot Capture Checklist

Capture these screenshots for your project report and lab evaluation:

| Screenshot # | View / Feature | Suggested Action |
|---|---|---|
| **SS-01** | **MySQL Workbench** | Table list showing all 10 tables in `forensight` and schema description. |
| **SS-02** | **Public Landing Page** | `http://localhost:5000` showing hero banner, security architecture, and features. |
| **SS-03** | **Authentication Portal** | `/login` showing the card login and quick-fill role test personas. |
| **SS-04** | **Security Operations Overview** | `/dashboard` showing KPI metrics, Recharts threat severity bar chart, and live audit feed. |
| **SS-05** | **Investigation Cases Registry** | `/cases` showing filtered case files and status pills. |
| **SS-06** | **Incident Case Dossier** | Case detail view displaying linked digital evidence (`CaseEvidence` M:N) and assigned tasks. |
| **SS-07** | **Digital Evidence Lab** | `/evidence` showing uploaded files, SHA-256 checksum pills, and Download buttons. |
| **SS-08** | **File Ingestion Modal** | Modal showing evidence file selection, artifact classification, and case association. |
| **SS-09** | **Investigation Tasks** | `/tasks` showing tasks assigned across multiple investigators (`TaskAssignments`). |
| **SS-10** | **Forensic Findings** | `/findings` showing threat indicators with trigger-backed audit log badge. |
| **SS-11** | **Chain of Custody Ledger** | `/custody` showing chronological transfer timeline and court admissibility status. |
| **SS-12** | **Relational Reports & Views** | `/reports` showing data querying `vw_case_evidence_summary` and `vw_high_severity_findings`. |
| **SS-13** | **Admin Database Explorer** | `/admin_database` showing the live MySQL Table Inspector with schema and paginated rows. |
| **SS-14** | **RBAC User Management** | `/admin_users` showing user directory and role modification dropdown. |
| **SS-15** | **Viewer Read-Only Enforcement** | Logging in as Harsh (Viewer) showing the amber read-only badge and disabled creation controls. |
