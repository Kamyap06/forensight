-- =====================================================================
-- ForenSight — Schema & Relationship Verification Script
-- Database: forensight
-- Usage: Run this script in MySQL Workbench to verify schema integrity
-- =====================================================================

USE `forensight`;

-- 1. Verify all 10 tables exist
SHOW TABLES;

-- 2. Verify row counts across all 10 tables
SELECT 'users' AS table_name, COUNT(*) AS row_count FROM users
UNION ALL
SELECT 'cases', COUNT(*) FROM cases
UNION ALL
SELECT 'evidence', COUNT(*) FROM evidence
UNION ALL
SELECT 'caseevidence', COUNT(*) FROM caseevidence
UNION ALL
SELECT 'custodylogs', COUNT(*) FROM custodylogs
UNION ALL
SELECT 'analysisfindings', COUNT(*) FROM analysisfindings
UNION ALL
SELECT 'investigationtasks', COUNT(*) FROM investigationtasks
UNION ALL
SELECT 'taskassignments', COUNT(*) FROM taskassignments
UNION ALL
SELECT 'evidencenotes', COUNT(*) FROM evidencenotes
UNION ALL
SELECT 'auditlogs', COUNT(*) FROM auditlogs;

-- 3. Verify CaseEvidence relationship backfill
SELECT 
    ce.case_id,
    c.title AS case_title,
    ce.evidence_id,
    e.evidence_name,
    e.evidence_type
FROM caseevidence ce
JOIN cases c ON ce.case_id = c.case_id
JOIN evidence e ON ce.evidence_id = e.evidence_id
ORDER BY ce.case_id, ce.evidence_id;

-- 4. Verify TaskAssignments relationship backfill
SELECT 
    ta.task_id,
    it.task_title,
    ta.user_id,
    u.name AS assigned_user,
    ta.assignment_status,
    ta.assigned_at
FROM taskassignments ta
JOIN investigationtasks it ON ta.task_id = it.task_id
JOIN users u ON ta.user_id = u.user_id
ORDER BY ta.task_id, ta.user_id;

-- 5. Check foreign key constraints
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM 
    INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE 
    TABLE_SCHEMA = 'forensight' 
    AND REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY TABLE_NAME, CONSTRAINT_NAME;
