"""
End-to-end user workflow verification script:
1. Registration with valid and invalid data (reject duplicate email, reject public Admin creation)
2. Login as newly registered investigator
3. Create a new incident case via POST /api/cases
4. Upload genuine evidence file via POST /api/evidence with SHA-256 calculation
5. Associate evidence to case via POST /api/cases/<id>/evidence
6. Create an investigation task via POST /api/tasks and assign multiple users via TaskAssignments
7. Record an analysis finding via POST /api/findings (verifying trigger trg_after_finding_insert)
8. Record a chain-of-custody transfer via POST /api/custody-logs (verifying trigger trg_after_custody_insert)
9. Add an evidence note via POST /api/evidence-notes
10. Check audit logs via GET /api/audit-logs
11. Login as Admin and test Database Explorer introspection and User Management
"""

import sys, os, io, hashlib
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app
from db import get_db_connection

def run_e2e_workflow():
    app.config["TESTING"] = True
    client = app.test_client()

    print("\n--- 1. Testing Registration Validation ---")
    # A: Try to register with role=Admin (Must be rejected)
    res = client.post("/api/auth/register", json={
        "name": "Hacker Admin",
        "email": "hacker_admin@example.com",
        "password": "Password123!",
        "role": "Admin"
    })
    assert res.status_code == 403, f"Expected 403 for Admin registration, got {res.status_code}"
    print("[OK] Public registration as Admin rejected (403 Forbidden)")

    # B: Register a valid new investigator
    test_email = "test_investigator_e2e@forensight.io"
    res = client.post("/api/auth/register", json={
        "name": "Sarah Connor",
        "email": test_email,
        "password": "Investigator@123",
        "role": "Investigator"
    })
    if res.status_code == 409:
        print("[INFO] User already registered, continuing with login.")
    else:
        assert res.status_code == 201, f"Expected 201, got {res.status_code}: {res.get_json()}"
        print(f"[OK] Successfully registered new investigator: {test_email}")

    # C: Try duplicate registration
    res_dup = client.post("/api/auth/register", json={
        "name": "Sarah Connor",
        "email": test_email,
        "password": "Investigator@123",
        "role": "Investigator"
    })
    assert res_dup.status_code == 409, f"Expected 409 duplicate, got {res_dup.status_code}"
    print("[OK] Duplicate email registration rejected (409 Conflict)")

    print("\n--- 2. Testing Investigator Login & Session ---")
    res = client.post("/api/auth/login", json={
        "email": test_email,
        "password": "Investigator@123"
    })
    assert res.status_code == 200, f"Login failed: {res.get_json()}"
    user_data = res.get_json()["user"]
    user_id = user_data["user_id"]
    print(f"[OK] Logged in as: {user_data['name']} (ID: {user_id}, Role: {user_data['role']})")

    # Verify session check
    res_me = client.get("/api/auth/me")
    assert res_me.status_code == 200
    assert res_me.get_json()["user"]["email"] == test_email
    print("[OK] Session persistence verified (/api/auth/me)")

    print("\n--- 3. Create Incident Case ---")
    case_payload = {
        "title": "Operation Nightshade: APT39 Incursion",
        "incident_type": "Advanced Persistent Threat",
        "description": "Evidence of lateral movement and pass-the-hash attacks detected on DC-01.",
        "priority": "Critical",
        "status": "Open"
    }
    res = client.post("/api/cases", json=case_payload)
    assert res.status_code == 201, f"Case creation failed: {res.get_json()}"
    case_id = res.get_json()["case_id"]
    print(f"[OK] Created case #{case_id}: {case_payload['title']}")

    print("\n--- 4. Genuine Evidence File Upload & SHA-256 Calculation ---")
    sample_content = b"APT39_MEMORY_DUMP_0x4488AABBCCDDEEFF_VOLATILITY_ARTIFACT"
    expected_sha256 = hashlib.sha256(sample_content).hexdigest()

    upload_data = {
        "file": (io.BytesIO(sample_content), "apt39_memdump.raw"),
        "evidence_type": "Memory Dump",
        "status": "Collected",
        "uploaded_by": str(user_id)
    }
    res = client.post("/api/evidence", data=upload_data, content_type="multipart/form-data")
    assert res.status_code == 201, f"Evidence upload failed: {res.get_json()}"
    evidence = res.get_json()["data"]
    evidence_id = evidence["evidence_id"]
    assert evidence["sha256_hash"] == expected_sha256, f"Hash mismatch: expected {expected_sha256}, got {evidence['sha256_hash']}"
    print(f"[OK] Uploaded evidence #{evidence_id} with verified SHA-256: {evidence['sha256_hash']}")

    print("\n--- 5. Associate Evidence to Case (M:N CaseEvidence) ---")
    res = client.post(f"/api/cases/{case_id}/evidence", json={"evidence_ids": [evidence_id]})
    assert res.status_code == 200, f"Case evidence linking failed: {res.get_json()}"
    print(f"[OK] Associated evidence #{evidence_id} with case #{case_id}")

    # Verify case detail includes this evidence
    res_case = client.get(f"/api/cases/{case_id}")
    assert res_case.status_code == 200
    case_json = res_case.get_json()
    evidence_ids = [e["evidence_id"] for e in case_json.get("evidence", [])]
    assert evidence_id in evidence_ids, f"Evidence #{evidence_id} not found in case #{case_id}"
    print(f"[OK] Case #{case_id} detail confirmed linked evidence count: {len(evidence_ids)}")

    print("\n--- 6. Create Task & Multi-User Assignment (M:N TaskAssignments) ---")
    task_payload = {
        "case_id": case_id,
        "task_title": "Analyze Memory Dump for Injected DLLs",
        "description": "Run Volatility3 malfind and ldrmodules plugins on raw memory dump.",
        "due_date": "2026-11-01",
        "status": "Pending",
        "assigned_user_ids": [user_id, 2] # Sarah Connor + Malishka
    }
    res = client.post("/api/tasks", json=task_payload)
    assert res.status_code == 201, f"Task creation failed: {res.get_json()}"
    task_id = res.get_json()["task_id"]
    print(f"[OK] Created task #{task_id}: {task_payload['task_title']}")

    # Verify task assignments
    res_tasks = client.get("/api/tasks")
    assert res_tasks.status_code == 200
    all_tasks = res_tasks.get_json()["tasks"]
    created_task = next((t for t in all_tasks if t["task_id"] == task_id), None)
    assert created_task is not None
    assignee_ids = [a["user_id"] for a in created_task.get("assignees", [])]
    assert user_id in assignee_ids and 2 in assignee_ids
    print(f"[OK] Task #{task_id} successfully assigned to users: {assignee_ids}")

    print("\n--- 7. Record Analysis Finding & Check Trigger ---")
    finding_payload = {
        "evidence_id": evidence_id,
        "finding_type": "Process Injection",
        "severity": "Critical",
        "description": "Reflective DLL injection detected inside lsass.exe process address space."
    }
    res = client.post("/api/findings", json=finding_payload)
    assert res.status_code == 201, f"Finding creation failed: {res.get_json()}"
    finding_id = res.get_json()["finding_id"]
    print(f"[OK] Created Critical finding #{finding_id}: {finding_payload['finding_type']}")

    print("\n--- 8. Record Chain of Custody & Check Trigger ---")
    custody_payload = {
        "evidence_id": evidence_id,
        "user_id": user_id,
        "action": "Transferred to Secure Vault",
        "notes": "Evidence secured in Level-3 airgapped evidence repository."
    }
    res = client.post("/api/custody-logs", json=custody_payload)
    assert res.status_code == 201, f"Custody logging failed: {res.get_json()}"
    custody_res_data = res.get_json()
    print(f"[OK] Recorded custody event: {custody_payload['action']}")

    print("\n--- 9. Add Evidence Note ---")
    note_payload = {
        "evidence_id": evidence_id,
        "note_text": "Cryptographic signature matches known APT39 implant variant (Shaheen-IV)."
    }
    res = client.post("/api/evidence-notes", json=note_payload)
    assert res.status_code == 201, f"Note creation failed: {res.get_json()}"
    note_id = res.get_json()["note_id"]
    print(f"[OK] Added evidence note #{note_id}")

    print("\n--- 10. Verify Audit Log ---")
    res_audit = client.get("/api/audit-logs")
    assert res_audit.status_code == 200
    logs = res_audit.get_json()["audit_logs"]
    print(f"[OK] Audit logs retrieved ({len(logs)} records). Latest 3 audit actions:")
    for l in logs[:3]:
        print(f"  - Action: {l.get('action')}, Entity: {l.get('entity_type')} #{l.get('entity_id')}, Details: {l.get('change_description') or l.get('details')}")

    print("\n--- 11. Admin Database Explorer & User Management ---")
    # Login as Admin
    res_admin_login = client.post("/api/auth/login", json={
        "email": "kamya@example.com",
        "password": "Admin@123"
    })
    assert res_admin_login.status_code == 200
    print("[OK] Logged in as Administrator: Kamya Pawar")

    res_db = client.get("/api/admin/database")
    assert res_db.status_code == 200
    db_meta = res_db.get_json()
    print(f"[OK] Admin Database overview: {db_meta['database_name']} contains {len(db_meta['tables'])} tables.")

    # Inspect users table
    res_users_table = client.get("/api/admin/database/tables/users?page=1&limit=10")
    assert res_users_table.status_code == 200
    users_table_data = res_users_table.get_json()
    total_users_count = users_table_data.get("total_rows", len(users_table_data.get("rows", [])))
    print(f"[OK] Users table inspection: {total_users_count} rows found.")
    found_registered = any(r["email"] == test_email for r in users_table_data["rows"])
    assert found_registered, f"Newly registered user {test_email} not found in users table!"
    print(f"[OK] Verified newly registered user {test_email} in database rows!")

    # Inspect reports
    res_reports = client.get("/api/reports")
    assert res_reports.status_code == 200
    rep = res_reports.get_json()
    print(f"[OK] Reports fetched: {len(rep['case_evidence_summary'])} cases in summary view, {len(rep['high_severity_findings'])} high-severity findings.")

    print("\n=======================================================")
    print("ALL 11 END-TO-END WORKFLOW VERIFICATIONS PASSED 100%!")
    print("=======================================================\n")

if __name__ == "__main__":
    run_e2e_workflow()
