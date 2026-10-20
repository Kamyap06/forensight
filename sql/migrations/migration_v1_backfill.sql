-- =====================================================================
-- ForenSight Database Migration: Phase A - Safe Relationship Backfill
-- Target Database: forensight
-- Purpose:
--   1. Migrate legacy 1:N associations from evidence.case_id to caseevidence.
--   2. Migrate legacy 1:N associations from investigationtasks.assigned_to to taskassignments.
--   3. Preserve all existing records without introducing artificial associations.
--   4. Obsolete foreign keys and columns are NOT dropped here (pending verification & approval).
-- =====================================================================

USE `forensight`;

-- ---------------------------------------------------------------------
-- Step 1: Backfill CaseEvidence from Evidence (case_id -> caseevidence)
-- ---------------------------------------------------------------------
INSERT INTO caseevidence (case_id, evidence_id)
SELECT e.case_id, e.evidence_id
FROM evidence e
LEFT JOIN caseevidence ce 
    ON ce.case_id = e.case_id AND ce.evidence_id = e.evidence_id
WHERE e.case_id IS NOT NULL 
  AND ce.case_id IS NULL;

-- ---------------------------------------------------------------------
-- Step 2: Backfill TaskAssignments from InvestigationTasks (assigned_to -> taskassignments)
-- ---------------------------------------------------------------------
INSERT INTO taskassignments (task_id, user_id, assigned_at, assignment_status)
SELECT t.task_id, t.assigned_to, t.created_at, 'Assigned'
FROM investigationtasks t
LEFT JOIN taskassignments ta 
    ON ta.task_id = t.task_id AND ta.user_id = t.assigned_to
WHERE t.assigned_to IS NOT NULL 
  AND ta.task_id IS NULL;

-- ---------------------------------------------------------------------
-- Step 3: Verification Queries
-- ---------------------------------------------------------------------
SELECT 
    (SELECT COUNT(*) FROM evidence WHERE case_id IS NOT NULL) AS evidence_source_count,
    (SELECT COUNT(*) FROM caseevidence) AS caseevidence_migrated_count;

SELECT 
    (SELECT COUNT(*) FROM investigationtasks WHERE assigned_to IS NOT NULL) AS tasks_source_count,
    (SELECT COUNT(*) FROM taskassignments) AS taskassignments_migrated_count;
