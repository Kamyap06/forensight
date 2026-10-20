-- =====================================================================
-- FORENSIGHT — EXPERIMENT 9: ADVANCED DATABASE PROGRAMMING
-- Database: forensight
-- Description:
--   Part A: Views (vw_case_evidence_summary, vw_high_severity_findings, vw_investigation_task_assignments)
--   Part B: Stored Procedures (sp_add_case, sp_update_task_status)
--   Part C: Triggers (trg_after_custody_insert, trg_after_finding_insert)
--   Part D: Verification & Validation Queries
-- =====================================================================

USE `forensight`;

-- =====================================================================
-- PART A: VIEWS
-- =====================================================================

-- View 1: vw_case_evidence_summary
-- Purpose: Aggregates case metadata with associated evidence counts and total size in KB
CREATE OR REPLACE VIEW vw_case_evidence_summary AS
SELECT 
    c.case_id,
    c.title AS case_title,
    c.incident_type,
    c.priority,
    c.status AS case_status,
    u.name AS creator_name,
    COUNT(ce.evidence_id) AS total_evidence_items,
    COALESCE(ROUND(SUM(e.file_size) / 1024, 2), 0.00) AS total_evidence_size_kb,
    c.created_at
FROM cases c
INNER JOIN users u ON c.created_by = u.user_id
LEFT JOIN caseevidence ce ON c.case_id = ce.case_id
LEFT JOIN evidence e ON ce.evidence_id = e.evidence_id
GROUP BY c.case_id, c.title, c.incident_type, c.priority, c.status, u.name, c.created_at;

-- View 2: vw_high_severity_findings
-- Purpose: Filters critical and high severity findings with evidence and case details
CREATE OR REPLACE VIEW vw_high_severity_findings AS
SELECT 
    af.finding_id,
    af.finding_type,
    af.severity,
    af.description AS finding_description,
    e.evidence_id,
    e.evidence_name,
    e.evidence_type,
    c.case_id,
    c.title AS case_title,
    af.created_at AS finding_created_at
FROM analysisfindings af
INNER JOIN evidence e ON af.evidence_id = e.evidence_id
LEFT JOIN caseevidence ce ON e.evidence_id = ce.evidence_id
LEFT JOIN cases c ON ce.case_id = c.case_id
WHERE af.severity IN ('High', 'Critical');

-- View 3: vw_investigation_task_assignments
-- Purpose: Displays task workflow status alongside assigned investigators
CREATE OR REPLACE VIEW vw_investigation_task_assignments AS
SELECT 
    t.task_id,
    t.task_title,
    t.description AS task_description,
    t.status AS task_status,
    t.due_date,
    c.case_id,
    c.title AS case_title,
    u.user_id,
    u.name AS assigned_user_name,
    u.role AS assigned_user_role,
    ta.assignment_status,
    ta.assigned_at
FROM investigationtasks t
INNER JOIN cases c ON t.case_id = c.case_id
LEFT JOIN taskassignments ta ON t.task_id = ta.task_id
LEFT JOIN users u ON ta.user_id = u.user_id;


-- =====================================================================
-- PART B: STORED PROCEDURES
-- =====================================================================

DROP PROCEDURE IF EXISTS sp_add_case;

DELIMITER $$
-- Stored Procedure: sp_add_case
-- Purpose: Creates a new case with strict input validation, sets status to 'Open',
--          returns new case_id and status message, and writes to audit log.
CREATE PROCEDURE sp_add_case(
    IN p_title VARCHAR(200),
    IN p_incident_type VARCHAR(100),
    IN p_description TEXT,
    IN p_priority VARCHAR(20),
    IN p_created_by INT,
    OUT p_case_id INT,
    OUT p_status_message VARCHAR(255)
)
BEGIN
    DECLARE user_exists INT DEFAULT 0;
    
    -- Validation 1: Title must not be empty
    IF p_title IS NULL OR TRIM(p_title) = '' THEN
        SET p_case_id = -1;
        SET p_status_message = 'ERROR: Case title cannot be empty.';
    -- Validation 2: Priority must be valid
    ELSEIF p_priority NOT IN ('Low', 'Medium', 'High', 'Critical') THEN
        SET p_case_id = -1;
        SET p_status_message = 'ERROR: Invalid priority value.';
    ELSE
        -- Validation 3: User must exist
        SELECT COUNT(*) INTO user_exists FROM users WHERE user_id = p_created_by;
        IF user_exists = 0 THEN
            SET p_case_id = -1;
            SET p_status_message = 'ERROR: User ID does not exist.';
        ELSE
            -- Insert the case
            INSERT INTO cases (title, incident_type, description, priority, status, created_by)
            VALUES (TRIM(p_title), TRIM(p_incident_type), p_description, p_priority, 'Open', p_created_by);
            
            SET p_case_id = LAST_INSERT_ID();
            
            -- Record activity in AuditLogs
            INSERT INTO auditlogs (user_id, action, entity_type, entity_id, details)
            VALUES (p_created_by, 'CREATE', 'Case', p_case_id, CONCAT('Created case via procedure: ', TRIM(p_title)));
            
            SET p_status_message = 'SUCCESS: Case created successfully.';
        END IF;
    END IF;
END$$

DROP PROCEDURE IF EXISTS sp_update_task_status;

-- Stored Procedure: sp_update_task_status
-- Purpose: Updates status of a task with validation, synchronizes TaskAssignments,
--          and writes an audit log entry.
CREATE PROCEDURE sp_update_task_status(
    IN p_task_id INT,
    IN p_new_status VARCHAR(50),
    IN p_updated_by_user_id INT,
    OUT p_rows_affected INT,
    OUT p_status_message VARCHAR(255)
)
BEGIN
    DECLARE task_exists INT DEFAULT 0;
    
    IF p_new_status NOT IN ('Pending', 'In Progress', 'Completed') THEN
        SET p_rows_affected = 0;
        SET p_status_message = 'ERROR: Invalid status value. Must be Pending, In Progress, or Completed.';
    ELSE
        SELECT COUNT(*) INTO task_exists FROM investigationtasks WHERE task_id = p_task_id;
        IF task_exists = 0 THEN
            SET p_rows_affected = 0;
            SET p_status_message = 'ERROR: Task ID does not exist.';
        ELSE
            -- Update task status
            UPDATE investigationtasks 
            SET status = p_new_status 
            WHERE task_id = p_task_id;
            
            SET p_rows_affected = ROW_COUNT();
            
            -- Synchronize assignment status
            IF p_new_status = 'Completed' THEN
                UPDATE taskassignments 
                SET assignment_status = 'Completed' 
                WHERE task_id = p_task_id;
            ELSEIF p_new_status = 'In Progress' THEN
                UPDATE taskassignments 
                SET assignment_status = 'In Progress' 
                WHERE task_id = p_task_id AND assignment_status != 'Completed';
            END IF;
            
            -- Record audit entry
            INSERT INTO auditlogs (user_id, action, entity_type, entity_id, details)
            VALUES (p_updated_by_user_id, 'UPDATE_TASK', 'Task', p_task_id, CONCAT('Updated status to: ', p_new_status));
            
            SET p_status_message = 'SUCCESS: Task status updated successfully.';
        END IF;
    END IF;
END$$
DELIMITER ;


-- =====================================================================
-- PART C: TRIGGERS
-- =====================================================================

DROP TRIGGER IF EXISTS trg_after_custody_insert;

DELIMITER $$
-- Trigger 1: trg_after_custody_insert
-- Purpose: Automatically inserts an audit record whenever custody activity is logged
CREATE TRIGGER trg_after_custody_insert
AFTER INSERT ON custodylogs
FOR EACH ROW
BEGIN
    INSERT INTO auditlogs (user_id, action, entity_type, entity_id, details, created_at)
    VALUES (
        NEW.user_id,
        'CUSTODY_LOG',
        'Evidence',
        NEW.evidence_id,
        CONCAT('Custody action logged: ', NEW.action, COALESCE(CONCAT(' - ', NEW.notes), '')),
        NEW.event_time
    );
END$$

DROP TRIGGER IF EXISTS trg_after_finding_insert;

-- Trigger 2: trg_after_finding_insert
-- Purpose: Automatically records analysis findings in AuditLogs to guarantee audit trail
CREATE TRIGGER trg_after_finding_insert
AFTER INSERT ON analysisfindings
FOR EACH ROW
BEGIN
    INSERT INTO auditlogs (user_id, action, entity_type, entity_id, details, created_at)
    VALUES (
        NULL,
        'NEW_FINDING',
        'Evidence',
        NEW.evidence_id,
        CONCAT('Recorded ', NEW.severity, ' finding: ', NEW.finding_type, ' - ', SUBSTRING(NEW.description, 1, 100)),
        NEW.created_at
    );
END$$
DELIMITER ;


-- =====================================================================
-- PART D: VALIDATION & EXECUTION TESTS
-- =====================================================================

-- 1. Test Views
SELECT * FROM vw_case_evidence_summary;
SELECT * FROM vw_high_severity_findings;
SELECT * FROM vw_investigation_task_assignments;

-- 2. Test Stored Procedure: sp_add_case
CALL sp_add_case('Test Phishing Campaign', 'Phishing', 'Investigating email lures', 'Medium', 1, @new_id, @msg);
SELECT @new_id AS generated_case_id, @msg AS result_message;

-- 3. Test Stored Procedure: sp_update_task_status
CALL sp_update_task_status(1, 'Completed', 1, @affected, @msg);
SELECT @affected AS rows_updated, @msg AS result_message;

-- 4. Verify Trigger Activations in AuditLogs
SELECT * FROM auditlogs ORDER BY audit_id DESC LIMIT 10;
