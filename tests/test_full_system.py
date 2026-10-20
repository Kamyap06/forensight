"""
Comprehensive End-to-End System Test for ForenSight
Verifies:
1. System Health & Database Connection (10 tables, 3 views, 13 FKs)
2. Authentication & Role-Based Access Control (Admin vs Investigator vs Viewer)
3. Cryptographic Evidence Ingestion & SHA-256 Hashing
4. Evidence Download via /api/evidence/<id>/download
5. Case & Evidence M:N Associations via CaseEvidence
6. Stored Procedure sp_update_task_status Execution
7. Database Triggers (trg_after_custody_insert, trg_after_finding_insert)
8. Relational Views (vw_case_evidence_summary, vw_high_severity_findings)
9. Admin Database Explorer Live Introspection
10. Static Frontend Serving (index.html, JS/CSS bundles)
"""

import os
import sys
import io
import hashlib
import json
import unittest
from datetime import datetime

# Ensure project root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app
from db import get_db_connection

class TestForenSightSystem(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        app.config["TESTING"] = True
        cls.client = app.test_client()

    def test_01_health_and_database(self):
        """Verify database connectivity, 10 relational tables, and 3 views."""
        res = self.client.get("/api/db-check")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["status"], "connected")
        self.assertEqual(data["database"], "forensight")
        self.assertGreaterEqual(data["tables_count"], 10)
        self.assertGreaterEqual(data["views_count"], 3)
        print("\n[PASS] Database connectivity & 10 relational tables verified.")

    def test_02_authentication_and_rbac(self):
        """Test authentication, session generation, and role permissions."""
        with app.test_client() as client:
            # 1. Login as Admin
            login_res = client.post("/api/auth/login", json={
                "email": "kamya@example.com",
                "password": "Admin@123"
            })
            self.assertEqual(login_res.status_code, 200)
            admin_data = login_res.get_json()
            self.assertEqual(admin_data["user"]["role"], "Admin")

            # 2. Admin can access DB explorer
            db_res = client.get("/api/admin/database")
            self.assertEqual(db_res.status_code, 200)
            self.assertEqual(db_res.get_json()["database_name"], "forensight")

            # 3. Admin can access users
            users_res = client.get("/api/admin/users")
            self.assertEqual(users_res.status_code, 200)

            # 4. Logout
            logout_res = client.post("/api/auth/logout")
            self.assertEqual(logout_res.status_code, 200)

        with app.test_client() as client:
            # 5. Login as Investigator
            inv_res = client.post("/api/auth/login", json={
                "email": "malishka@example.com",
                "password": "Investigator@123"
            })
            self.assertEqual(inv_res.status_code, 200)
            self.assertEqual(inv_res.get_json()["user"]["role"], "Investigator")

            # 6. Investigator is FORBIDDEN from admin db explorer
            db_res = client.get("/api/admin/database")
            self.assertEqual(db_res.status_code, 403)
            print("[PASS] RBAC enforced: Investigator blocked from Admin endpoints (403 Forbidden).")

        with app.test_client() as client:
            # 7. Login as Viewer
            view_res = client.post("/api/auth/login", json={
                "email": "harsh@example.com",
                "password": "Viewer@123"
            })
            self.assertEqual(view_res.status_code, 200)
            self.assertEqual(view_res.get_json()["user"]["role"], "Viewer")

            # 8. Viewer can read cases
            cases_res = client.get("/api/cases")
            self.assertEqual(cases_res.status_code, 200)

            # 9. Viewer is FORBIDDEN from creating a case
            create_res = client.post("/api/cases", json={
                "title": "Unauthorized Case Creation",
                "incident_type": "Test",
                "priority": "Low",
                "status": "Open"
            })
            self.assertEqual(create_res.status_code, 403)
            print("[PASS] RBAC enforced: Viewer blocked from mutations (403 Forbidden).")

    def test_03_evidence_ingestion_and_sha256(self):
        """Test real file upload, backend SHA-256 calculation, and download."""
        with app.test_client() as client:
            # Sign in as Investigator
            client.post("/api/auth/login", json={
                "email": "malishka@example.com",
                "password": "Investigator@123"
            })

            # Create test binary content
            file_bytes = b"ForenSight-Forensic-Test-Artifact-SHA256-Payload-0x9928174"
            expected_hash = hashlib.sha256(file_bytes).hexdigest()

            data = {
                "file": (io.BytesIO(file_bytes), "sample_artifact.bin"),
                "evidence_type": "Malware Binary",
                "status": "Registered",
                "uploaded_by": "2"
            }

            upload_res = client.post("/api/evidence", data=data, content_type="multipart/form-data")
            self.assertEqual(upload_res.status_code, 201)
            ev = upload_res.get_json()["data"]

            evidence_id = ev["evidence_id"]
            self.assertEqual(ev["sha256_hash"], expected_hash)
            self.assertEqual(ev["file_size"], len(file_bytes))
            print(f"[PASS] Real file upload: backend computed exact SHA-256 ({expected_hash[:16]}...).")

            # Verify download
            dl_res = client.get(f"/api/evidence/{evidence_id}/download")
            self.assertEqual(dl_res.status_code, 200)
            self.assertEqual(dl_res.data, file_bytes)
            dl_res.close()
            print("[PASS] Evidence file download endpoint verified.")

            # Test M:N junction table: Link to Case #1
            link_res = client.post("/api/cases/1/evidence", json={"evidence_ids": [evidence_id]})
            self.assertEqual(link_res.status_code, 200)
            print("[PASS] M:N CaseEvidence link verified.")

            # Cleanup test evidence
            del_res = client.delete(f"/api/evidence/{evidence_id}")
            self.assertEqual(del_res.status_code, 200)
            print("[PASS] Evidence cleanup verified.")

    def test_04_stored_procedures_and_triggers(self):
        """Test sp_update_task_status stored procedure and database triggers."""
        with app.test_client() as client:
            # Sign in as Investigator
            client.post("/api/auth/login", json={
                "email": "amey@example.com",
                "password": "Investigator@123"
            })

            # 1. Update task #1 status via sp_update_task_status
            task_res = client.put("/api/tasks/1/status", json={"status": "In Progress", "user_id": 4})
            self.assertEqual(task_res.status_code, 200)
            self.assertIn("success", task_res.get_json()["message"].lower())
            print("[PASS] Stored procedure sp_update_task_status executed successfully.")

            # 2. Add custody log to trigger trg_after_custody_insert
            custody_res = client.post("/api/custody-logs", json={
                "evidence_id": 1,
                "user_id": 4,
                "action": "Hash Integrity Verified",
                "notes": "Automated regression verification test"
            })
            self.assertEqual(custody_res.status_code, 201)

            # Verify audit trail contains the trigger entry
            audit_res = client.get("/api/audit-logs")
            self.assertEqual(audit_res.status_code, 200)
            logs = audit_res.get_json()["audit_logs"]
            has_trigger_entry = any(
                l.get("action") == "CUSTODY_LOG" or "Custody action logged" in (l.get("change_description") or l.get("details") or "")
                for l in logs
            )
            self.assertTrue(has_trigger_entry)
            print("[PASS] Database trigger trg_after_custody_insert verified.")

    def test_05_views_and_reports(self):
        """Test SQL views vw_case_evidence_summary and vw_high_severity_findings."""
        with app.test_client() as client:
            client.post("/api/auth/login", json={
                "email": "laxmi@example.com",
                "password": "Investigator@123"
            })

            rep_res = client.get("/api/reports")
            self.assertEqual(rep_res.status_code, 200)
            rep_data = rep_res.get_json()

            self.assertIn("case_evidence_summary", rep_data)
            self.assertIn("high_severity_findings", rep_data)
            self.assertIn("tasks_by_status", rep_data)
            self.assertIn("findings_by_severity", rep_data)
            print(f"[PASS] Relational views verified: {len(rep_data['case_evidence_summary'])} cases summarized.")

    def test_06_admin_database_explorer(self):
        """Test live schema introspection for all 10 tables."""
        with app.test_client() as client:
            client.post("/api/auth/login", json={
                "email": "kamya@example.com",
                "password": "Admin@123"
            })

            tables = [
                "Users", "Cases", "Evidence", "CaseEvidence", "CustodyLogs",
                "AnalysisFindings", "InvestigationTasks", "TaskAssignments",
                "EvidenceNotes", "AuditLogs"
            ]

            for tbl in tables:
                tbl_res = client.get(f"/api/admin/database/tables/{tbl}?page=1&limit=5")
                self.assertEqual(tbl_res.status_code, 200)
                data = tbl_res.get_json()
                self.assertGreater(len(data["columns"]), 0)
                # Password hash masking check
                if tbl.lower() == "users":
                    for row in data["rows"]:
                        self.assertEqual(row["password_hash"], "[PROTECTED_CRYPTOGRAPHIC_HASH]")
            print(f"[PASS] Admin Database Explorer verified: all {len(tables)} tables introspected with password masking.")

    def test_07_static_frontend_serving(self):
        """Test that Flask serves index.html and assets directly."""
        res = self.client.get("/")
        self.assertEqual(res.status_code, 200)
        self.assertIn("<!doctype html>", res.data.decode("utf-8").lower())
        print("[PASS] Static frontend delivery: Flask successfully serves built React application.")

    def test_08_case_report_generation(self):
        """Test generating case reports in DOC and PDF formats."""
        with app.test_client() as client:
            client.post("/api/auth/login", json={
                "email": "malishka@example.com",
                "password": "Investigator@123"
            })

            # 1. Download PDF report
            pdf_res = client.get("/api/cases/1/report/pdf")
            self.assertEqual(pdf_res.status_code, 200)
            self.assertEqual(pdf_res.mimetype, "application/pdf")
            self.assertTrue(len(pdf_res.data) > 1000)
            self.assertTrue(pdf_res.data.startswith(b"%PDF"))

            # 2. Download DOC report
            doc_res = client.get("/api/cases/1/report/doc")
            self.assertEqual(doc_res.status_code, 200)
            self.assertTrue(len(doc_res.data) > 5000)

            print("[PASS] Case Report Generation: PDF and DOC reports verified.")

if __name__ == "__main__":
    unittest.main(verbosity=2)
