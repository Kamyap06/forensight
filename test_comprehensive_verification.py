import sys
import os
import hashlib
import json
import urllib.request
import urllib.parse
import http.cookiejar

BASE_URL = "http://127.0.0.1:5000"

def run_tests():
    print("=" * 70)
    print("FORENSIGHT COMPREHENSIVE VERIFICATION SUITE")
    print("=" * 70)

    cookie_jar = http.cookiejar.CookieJar()
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cookie_jar))
    urllib.request.install_opener(opener)

    # 1. Login as Admin
    print("\n[1] Testing Admin Authentication...")
    login_data = json.dumps({"email": "kamya@example.com", "password": "Admin@123"}).encode('utf-8')
    req = urllib.request.Request(f"{BASE_URL}/api/login", data=login_data, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200
        res_json = json.loads(resp.read().decode('utf-8'))
        assert res_json["status"] == "success"
        assert res_json["user"]["role"] == "Admin"
        print(f"  [OK] Admin logged in: {res_json['user']['name']} ({res_json['user']['email']})")

    # 2. Check Timestamps on Custody Logs
    print("\n[2] Verifying Custody Logs Timestamps (Eliminating 'Invalid Date')...")
    req = urllib.request.Request(f"{BASE_URL}/api/custody-logs")
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200
        data = json.loads(resp.read().decode('utf-8'))
        logs = data.get("custody_logs", [])
        print(f"  [OK] Retrieved {len(logs)} custody logs")
        for log in logs[:5]:
            ts = log.get("timestamp") or log.get("event_time")
            assert ts is not None and ts != "", f"Missing timestamp in custody log: {log}"
            print(f"    - Log #{log['log_id']}: timestamp='{ts}', action='{log.get('action')}', handler='{log.get('user_name')}'")

    # 3. Check Evidence Downloads for Seeded Files 1 to 5
    print("\n[3] Verifying Real Evidence File Downloads & SHA-256 Hashes...")
    req = urllib.request.Request(f"{BASE_URL}/api/evidence")
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        evidence_list = data.get("evidence", [])
        print(f"  [OK] Retrieved {len(evidence_list)} evidence records")

    for ev in evidence_list[:5]:
        ev_id = ev["evidence_id"]
        ev_name = ev["evidence_name"]
        expected_hash = ev["sha256_hash"]

        download_req = urllib.request.Request(f"{BASE_URL}/api/evidence/{ev_id}/download")
        with urllib.request.urlopen(download_req) as dl_resp:
            assert dl_resp.status == 200, f"Download failed for evidence #{ev_id}"
            file_bytes = dl_resp.read()
            assert len(file_bytes) > 0, f"Downloaded 0 bytes for evidence #{ev_id}"
            actual_hash = hashlib.sha256(file_bytes).hexdigest()
            assert actual_hash == expected_hash, f"Hash mismatch for {ev_name}: expected {expected_hash}, got {actual_hash}"
            cd_hdr = dl_resp.headers.get("Content-Disposition", "")
            print(f"  [OK] Evidence #{ev_id} ({ev_name}): {len(file_bytes)} bytes downloaded, SHA-256 verified ({actual_hash[:16]}...), Header='{cd_hdr}'")

    # 4. Check Case Report Generation (PDF and DOCX)
    print("\n[4] Verifying Full Case Report Generation (PDF & DOCX)...")
    for case_id in [1, 2]:
        # All sections
        pdf_url = f"{BASE_URL}/api/cases/{case_id}/report/pdf?sections=summary,timeline,evidence,findings,custody,tasks,notes,audit,conclusion,recommendations,certification"
        req = urllib.request.Request(pdf_url)
        with urllib.request.urlopen(req) as resp:
            assert resp.status == 200
            pdf_bytes = resp.read()
            assert pdf_bytes.startswith(b"%PDF-"), f"Invalid PDF header: {pdf_bytes[:10]}"
            print(f"  [OK] Case #{case_id} PDF dossier generated: {len(pdf_bytes):,} bytes (All 11 sections)")

        doc_url = f"{BASE_URL}/api/cases/{case_id}/report/doc?sections=summary,timeline,evidence,findings,custody,tasks,notes,audit,conclusion,recommendations,certification"
        req = urllib.request.Request(doc_url)
        with urllib.request.urlopen(req) as resp:
            assert resp.status == 200
            doc_bytes = resp.read()
            # DOCX is a zip file, starts with PK\x03\x04
            assert doc_bytes.startswith(b"PK\x03\x04"), f"Invalid DOCX zip header: {doc_bytes[:10]}"
            print(f"  [OK] Case #{case_id} DOCX dossier generated: {len(doc_bytes):,} bytes (All 11 sections)")

        # Custom subset sections (Executive Briefing)
        pdf_exec_url = f"{BASE_URL}/api/cases/{case_id}/report/pdf?sections=summary,findings,conclusion,recommendations"
        req = urllib.request.Request(pdf_exec_url)
        with urllib.request.urlopen(req) as resp:
            assert resp.status == 200
            pdf_exec_bytes = resp.read()
            assert pdf_exec_bytes.startswith(b"%PDF-")
            print(f"  [OK] Case #{case_id} PDF Executive Briefing generated: {len(pdf_exec_bytes):,} bytes")

    # 5. User Registration & Immediate Login Workflow
    print("\n[5] Verifying User Registration & Navigation Flow...")
    import random
    test_num = random.randint(1000, 9999)
    reg_email = f"test.inv.{test_num}@forensight.internal"
    reg_data = json.dumps({
        "name": f"Agent Specialist {test_num}",
        "email": reg_email,
        "password": "Password@123",
        "role": "Investigator"
    }).encode('utf-8')

    reg_req = urllib.request.Request(f"{BASE_URL}/api/register", data=reg_data, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(reg_req) as resp:
            print(f"  Status: {resp.status}")
            reg_res = json.loads(resp.read().decode('utf-8'))
            assert reg_res["status"] == "success"
            new_user = reg_res["user"]
            print(f"  [OK] New account registered: ID #{new_user['user_id']}, Name='{new_user['name']}', Role='{new_user['role']}'")
    except urllib.error.HTTPError as e:
        err_body = e.read().decode('utf-8')
        print(f"  Registration HTTP Error {e.code}: {err_body}")
        raise

    # Check that new user can access dashboard
    dash_req = urllib.request.Request(f"{BASE_URL}/api/dashboard")
    with urllib.request.urlopen(dash_req) as resp:
        assert resp.status == 200
        dash_res = json.loads(resp.read().decode('utf-8'))
        assert "stats" in dash_res
        print(f"  [OK] New user session verified on Dashboard telemetry: Total cases = {dash_res['stats']['total_cases']}")

    print("\n" + "=" * 70)
    print("ALL COMPREHENSIVE VERIFICATION TESTS PASSED SUCCESSFULLY!")
    print("=" * 70)

if __name__ == "__main__":
    run_tests()
