-- =====================================================================
-- ForenSight Database Migration: Phase A - Step 2 (DESTRUCTIVE - PENDING APPROVAL)
-- Target Database: forensight
-- Purpose:
--   Remove obsolete 1:N columns and foreign key constraints now that
--   associations have been safely migrated into CaseEvidence and TaskAssignments.
--
-- NOTE: DO NOT EXECUTE WITHOUT EXPLICIT USER APPROVAL.
-- =====================================================================

USE `forensight`;

-- 1. Remove obsolete case_id from evidence
ALTER TABLE `evidence` DROP FOREIGN KEY `evidence_ibfk_1`;
ALTER TABLE `evidence` DROP COLUMN `case_id`;

-- 2. Remove obsolete assigned_to from investigationtasks
ALTER TABLE `investigationtasks` DROP FOREIGN KEY `investigationtasks_ibfk_2`;
ALTER TABLE `investigationtasks` DROP COLUMN `assigned_to`;
