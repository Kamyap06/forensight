-- =====================================================================
-- FORENSIGHT — EXPERIMENT 8: ADVANCED SQL QUERIES & RELATIONAL ALGEBRA
-- Database: forensight
-- Application: ForenSight Incident Investigation & Digital Evidence Management
-- Tagline: "Every digital trace tells a story"
-- Description: Comprehensive SQL query script demonstrating:
--   Part 1: Basic DML / CRUD Operations (INSERT, SELECT, UPDATE, DELETE)
--   Part 2: Meaningful Multi-Table JOIN Queries (1:N, M:N Junctions, 3-Table)
--   Part 3: Aggregate Functions & GROUP BY
--   Part 4: HAVING Filter Clauses
--   Part 5: Nested Subqueries (Scalar, Subquery with IN, NOT IN, Correlated)
-- =====================================================================

USE `forensight`;

-- =====================================================================
-- PART 1: BASIC DML / CRUD OPERATIONS
-- =====================================================================

-- 1.1 INSERT (Create): Register a new investigation case
INSERT INTO cases (title, incident_type, description, priority, status, created_by)
VALUES (
    'Unauthorized Exfiltration via Cloud Storage', 
    'Data Exfiltration', 
    'Suspicious bulk data outbound transfer to untrusted cloud bucket detected by DLP.', 
    'High', 
    'Open', 
    1
);

-- 1.2 SELECT (Read): Query all high-priority open investigations
SELECT 
    case_id, 
    title, 
    incident_type, 
    priority, 
    status, 
    created_at 
FROM cases 
WHERE priority IN ('High', 'Critical') AND status = 'Open'
ORDER BY created_at DESC;

-- 1.3 UPDATE (Update): Escalate priority and update status for an ongoing case
UPDATE cases 
SET priority = 'Critical', status = 'In Progress'
WHERE title = 'Unauthorized Exfiltration via Cloud Storage';

-- 1.4 DELETE (Delete): Remove an experimental test record safely
-- (Inserts a temporary case and deletes it to demonstrate safe single-record deletion)
INSERT INTO cases (title, incident_type, description, priority, status, created_by)
VALUES ('Temporary Sandbox Probe Case', 'Sandbox Testing', 'Temporary record for CRUD demonstration.', 'Low', 'Closed', 1);

DELETE FROM cases 
WHERE title = 'Temporary Sandbox Probe Case' AND status = 'Closed';


-- =====================================================================
-- PART 2: MULTI-TABLE JOIN QUERIES
-- =====================================================================

-- 2.1 Display cases along with creator profile details
-- Demonstrates: INNER JOIN (1:N relationship between Users and Cases)
SELECT 
    c.case_id,
    c.title AS case_title,
    c.incident_type,
    c.priority,
    c.status,
    u.name AS created_by_name,
    u.email AS created_by_email,
    c.created_at
FROM cases c
INNER JOIN users u ON c.created_by = u.user_id
ORDER BY c.case_id ASC;

-- 2.2 Display evidence items along with registered uploader details
-- Demonstrates: INNER JOIN (1:N relationship between Users and Evidence)
SELECT 
    e.evidence_id,
    e.evidence_name,
    e.evidence_type,
    e.file_size AS file_size_bytes,
    e.sha256_hash,
    e.status AS evidence_status,
    u.name AS uploaded_by_name,
    u.email AS uploaded_by_email,
    e.created_at
FROM evidence e
INNER JOIN users u ON e.uploaded_by = u.user_id
ORDER BY e.evidence_id ASC;

-- 2.3 Display cases and their associated evidence items via CaseEvidence
-- Demonstrates: Many-to-Many JOIN using Cases, CaseEvidence (junction), and Evidence
SELECT 
    c.case_id,
    c.title AS case_title,
    c.priority AS case_priority,
    e.evidence_id,
    e.evidence_name,
    e.evidence_type,
    e.status AS evidence_status,
    e.created_at AS evidence_created_at
FROM cases c
INNER JOIN caseevidence ce ON c.case_id = ce.case_id
INNER JOIN evidence e ON ce.evidence_id = e.evidence_id
ORDER BY c.case_id ASC, e.evidence_id ASC;

-- 2.4 Display investigation tasks along with the linked case details
-- Demonstrates: INNER JOIN (1:N relationship between Cases and InvestigationTasks)
SELECT 
    t.task_id,
    t.task_title,
    t.status AS task_status,
    t.due_date,
    c.case_id,
    c.title AS case_title,
    c.priority AS case_priority
FROM investigationtasks t
INNER JOIN cases c ON t.case_id = c.case_id
ORDER BY t.task_id ASC;

-- 2.5 Display tasks with their assigned investigators via TaskAssignments
-- Demonstrates: Many-to-Many JOIN using InvestigationTasks, TaskAssignments (junction), and Users
SELECT 
    t.task_id,
    t.task_title,
    t.status AS task_status,
    u.user_id,
    u.name AS assigned_investigator,
    u.role AS user_role,
    ta.assignment_status,
    ta.assigned_at
FROM investigationtasks t
INNER JOIN taskassignments ta ON t.task_id = ta.task_id
INNER JOIN users u ON ta.user_id = u.user_id
ORDER BY t.task_id ASC, u.user_id ASC;

-- 2.6 Display custody log records with evidence metadata and responsible users
-- Demonstrates: Three-table JOIN between CustodyLogs, Evidence, and Users
SELECT 
    cl.log_id,
    cl.event_time,
    cl.action,
    e.evidence_id,
    e.evidence_name,
    u.user_id,
    u.name AS responsible_officer,
    cl.notes
FROM custodylogs cl
INNER JOIN evidence e ON cl.evidence_id = e.evidence_id
INNER JOIN users u ON cl.user_id = u.user_id
ORDER BY cl.event_time DESC, cl.log_id DESC;

-- 2.7 Display analysis findings with linked evidence details
-- Demonstrates: INNER JOIN between AnalysisFindings and Evidence
SELECT 
    af.finding_id,
    af.finding_type,
    af.severity,
    af.description,
    e.evidence_id,
    e.evidence_name,
    e.evidence_type,
    af.created_at
FROM analysisfindings af
INNER JOIN evidence e ON af.evidence_id = e.evidence_id
ORDER BY FIELD(af.severity, 'Critical', 'High', 'Medium', 'Low'), af.finding_id ASC;

-- 2.8 Display evidence notes with author profiles
-- Demonstrates: Three-table JOIN between EvidenceNotes, Evidence, and Users
SELECT 
    en.note_id,
    en.note_text,
    en.created_at,
    e.evidence_id,
    e.evidence_name,
    u.user_id,
    u.name AS author_name,
    u.role AS author_role
FROM evidencenotes en
INNER JOIN evidence e ON en.evidence_id = e.evidence_id
INNER JOIN users u ON en.user_id = u.user_id
ORDER BY en.created_at DESC, en.note_id DESC;


-- =====================================================================
-- PART 3: AGGREGATE FUNCTIONS & GROUP BY
-- =====================================================================

-- 3.1 Count total investigation cases in the system
-- Demonstrates: COUNT() aggregate function
SELECT 
    COUNT(*) AS total_cases,
    SUM(CASE WHEN status = 'Open' THEN 1 ELSE 0 END) AS open_cases,
    SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) AS in_progress_cases,
    SUM(CASE WHEN status = 'Closed' THEN 1 ELSE 0 END) AS closed_cases
FROM cases;

-- 3.2 Count evidence items associated with each case
-- Demonstrates: COUNT() with LEFT JOIN to include cases with 0 evidence items
SELECT 
    c.case_id,
    c.title AS case_title,
    c.status AS case_status,
    COUNT(ce.evidence_id) AS total_evidence_items
FROM cases c
LEFT JOIN caseevidence ce ON c.case_id = ce.case_id
GROUP BY c.case_id, c.title, c.status
ORDER BY c.case_id ASC;

-- 3.3 Count investigation tasks grouped by status
-- Demonstrates: COUNT() aggregate with GROUP BY
SELECT 
    status AS task_status,
    COUNT(*) AS total_tasks
FROM investigationtasks
GROUP BY status
ORDER BY total_tasks DESC;

-- 3.4 Count analysis findings categorized by severity level
-- Demonstrates: COUNT() aggregate with ordered severity classification
SELECT 
    severity,
    COUNT(*) AS finding_count
FROM analysisfindings
GROUP BY severity
ORDER BY FIELD(severity, 'Critical', 'High', 'Medium', 'Low');

-- 3.5 Count chain of custody actions performed by each user
-- Demonstrates: COUNT() with LEFT JOIN across Users and CustodyLogs
SELECT 
    u.user_id,
    u.name AS user_name,
    u.role AS user_role,
    COUNT(cl.log_id) AS custody_action_count
FROM users u
LEFT JOIN custodylogs cl ON u.user_id = cl.user_id
GROUP BY u.user_id, u.name, u.role
ORDER BY custody_action_count DESC, u.user_id ASC;

-- 3.6 Calculate summary statistics for evidence digital assets
-- Demonstrates: SUM(), AVG(), MIN(), MAX() aggregate functions
SELECT 
    COUNT(*) AS total_evidence_files,
    SUM(file_size) AS total_file_size_bytes,
    ROUND(SUM(file_size) / 1024, 2) AS total_file_size_kb,
    ROUND(AVG(file_size), 2) AS avg_file_size_bytes,
    MIN(file_size) AS min_file_size_bytes,
    MAX(file_size) AS max_file_size_bytes
FROM evidence;


-- =====================================================================
-- PART 4: GROUP BY AND HAVING CLAUSES
-- =====================================================================

-- 4.1 Identify cases associated with more than one evidence item
-- Demonstrates: GROUP BY with HAVING COUNT() > 1 filter
SELECT 
    c.case_id,
    c.title AS case_title,
    COUNT(ce.evidence_id) AS evidence_count
FROM cases c
INNER JOIN caseevidence ce ON c.case_id = ce.case_id
GROUP BY c.case_id, c.title
HAVING COUNT(ce.evidence_id) > 1
ORDER BY evidence_count DESC;

-- 4.2 Identify investigators assigned to multiple tasks
-- Demonstrates: GROUP BY with HAVING filter on junction table TaskAssignments
SELECT 
    u.user_id,
    u.name AS investigator_name,
    u.role,
    COUNT(ta.task_id) AS assigned_task_count
FROM users u
INNER JOIN taskassignments ta ON u.user_id = ta.user_id
GROUP BY u.user_id, u.name, u.role
HAVING COUNT(ta.task_id) > 1
ORDER BY assigned_task_count DESC;

-- 4.3 Identify cases with high-severity or critical findings
-- Demonstrates: Multi-table GROUP BY with WHERE and HAVING filters
SELECT 
    c.case_id,
    c.title AS case_title,
    c.priority AS case_priority,
    COUNT(af.finding_id) AS critical_or_high_findings
FROM cases c
INNER JOIN caseevidence ce ON c.case_id = ce.case_id
INNER JOIN evidence e ON ce.evidence_id = e.evidence_id
INNER JOIN analysisfindings af ON e.evidence_id = af.evidence_id
WHERE af.severity IN ('High', 'Critical')
GROUP BY c.case_id, c.title, c.priority
HAVING COUNT(af.finding_id) >= 1
ORDER BY critical_or_high_findings DESC;


-- =====================================================================
-- PART 5: NESTED SUBQUERIES
-- =====================================================================

-- 5.1 Find cases associated with 'Critical' threat findings
-- Demonstrates: Subquery with IN operator connecting Cases to AnalysisFindings
SELECT 
    c.case_id,
    c.title AS case_title,
    c.incident_type,
    c.priority,
    c.status
FROM cases c
WHERE c.case_id IN (
    SELECT ce.case_id
    FROM caseevidence ce
    INNER JOIN analysisfindings af ON ce.evidence_id = af.evidence_id
    WHERE af.severity = 'Critical'
)
ORDER BY c.case_id ASC;

-- 5.2 Find evidence items with a file size strictly greater than average
-- Demonstrates: Scalar subquery in WHERE clause using AVG()
SELECT 
    e.evidence_id,
    e.evidence_name,
    e.evidence_type,
    e.file_size AS file_size_bytes,
    (SELECT ROUND(AVG(file_size), 2) FROM evidence) AS overall_avg_file_size
FROM evidence e
WHERE e.file_size > (
    SELECT AVG(file_size) FROM evidence
)
ORDER BY e.file_size DESC;

-- 5.3 Find users who have not yet been assigned any tasks
-- Demonstrates: Subquery with NOT IN on TaskAssignments
SELECT 
    u.user_id,
    u.name,
    u.email,
    u.role
FROM users u
WHERE u.user_id NOT IN (
    SELECT DISTINCT ta.user_id
    FROM taskassignments ta
    WHERE ta.user_id IS NOT NULL
)
ORDER BY u.user_id ASC;

-- 5.4 Find cases that have no evidence linked yet
-- Demonstrates: Subquery with NOT IN to detect cases lacking evidence links
SELECT 
    c.case_id,
    c.title AS case_title,
    c.incident_type,
    c.priority,
    c.status
FROM cases c
WHERE c.case_id NOT IN (
    SELECT DISTINCT ce.case_id
    FROM caseevidence ce
    WHERE ce.case_id IS NOT NULL
)
ORDER BY c.case_id ASC;

-- 5.5 Find evidence items where findings count exceeds the average per evidence item
-- Demonstrates: Correlated / Aggregated subquery comparison
SELECT 
    e.evidence_id,
    e.evidence_name,
    COUNT(af.finding_id) AS finding_count
FROM evidence e
LEFT JOIN analysisfindings af ON e.evidence_id = af.evidence_id
GROUP BY e.evidence_id, e.evidence_name
HAVING finding_count > (
    SELECT AVG(finding_count)
    FROM (
        SELECT COUNT(finding_id) AS finding_count
        FROM analysisfindings
        GROUP BY evidence_id
    ) AS sub
);
