import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import db

def test_programmability():
    conn = db.get_db_connection()
    cur = conn.cursor(dictionary=True)

    print("=== 1. TESTING VIEWS ===")
    views = [
        'vw_case_evidence_summary',
        'vw_high_severity_findings',
        'vw_investigation_task_assignments'
    ]
    for v in views:
        cur.execute(f"SELECT * FROM {v};")
        rows = cur.fetchall()
        print(f"View {v}: returned {len(rows)} rows")
        if rows:
            print("  Sample row:", rows[0])

    print("\n=== 2. TESTING STORED PROCEDURES ===")
    # Test sp_add_case validation failure
    cur.execute("CALL sp_add_case('', 'Ransomware', 'Test desc', 'High', 1, @out_id, @out_msg);")
    cur.execute("SELECT @out_id AS case_id, @out_msg AS msg;")
    print("sp_add_case (invalid title test):", cur.fetchone())

    # Test sp_add_case successful execution
    cur.execute("CALL sp_add_case('Ransomware Outbreak Lab', 'Ransomware', 'Detected encrypted workstation in Finance', 'Critical', 1, @out_id, @out_msg);")
    cur.execute("SELECT @out_id AS case_id, @out_msg AS msg;")
    res = cur.fetchone()
    print("sp_add_case (successful execution):", res)
    new_case_id = res['case_id']

    # Test sp_update_task_status
    cur.execute("CALL sp_update_task_status(1, 'In Progress', 1, @out_rows, @out_msg);")
    cur.execute("SELECT @out_rows AS affected, @out_msg AS msg;")
    print("sp_update_task_status (task 1 -> In Progress):", cur.fetchone())

    print("\n=== 3. TESTING TRIGGERS ===")
    cur.execute("SELECT COUNT(*) AS cnt FROM auditlogs;")
    pre_audit = cur.fetchone()['cnt']
    print(f"Audit log count prior to trigger activation: {pre_audit}")

    # Trigger 1: Insert CustodyLog -> trg_after_custody_insert
    cur.execute("""
        INSERT INTO custodylogs (evidence_id, user_id, action, notes)
        VALUES (1, 1, 'Transferred to Forensics Lab', 'Sent to hardware lab for chip-off analysis');
    """)
    conn.commit()

    # Trigger 2: Insert AnalysisFinding -> trg_after_finding_insert
    cur.execute("""
        INSERT INTO analysisfindings (evidence_id, finding_type, severity, description)
        VALUES (1, 'Embedded Macro Payload', 'Critical', 'Found malicious VBA macro designed to drop Cobalt Strike beacon');
    """)
    conn.commit()

    cur.execute("SELECT COUNT(*) AS cnt FROM auditlogs;")
    post_audit = cur.fetchone()['cnt']
    print(f"Audit log count after triggers fired: {post_audit} (+{post_audit - pre_audit} rows)")

    cur.execute("SELECT * FROM auditlogs ORDER BY audit_id DESC LIMIT 4;")
    recent_audits = cur.fetchall()
    print("Most recent audit records generated:")
    for a in recent_audits:
        print(" ", a)

    cur.close()
    conn.close()

if __name__ == '__main__':
    test_programmability()
