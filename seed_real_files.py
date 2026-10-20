import os
import hashlib
from db import get_db_connection
from app import app

upload_dir = app.config['UPLOAD_FOLDER']
os.makedirs(upload_dir, exist_ok=True)

files_data = {
    1: ('email1.eml', 'suspicious_email.eml', '''From: security-alert@secure-corp-auth.com
To: cfo@organization.com
Subject: URGENT: Wire Transfer Authorization & Security Token Reset
Date: Mon, 15 Oct 2026 09:14:22 -0400
Message-ID: <20261015091422.883910.sec@secure-corp-auth.com>
MIME-Version: 1.0
Content-Type: multipart/mixed; boundary="BOUNDARY_CYBER_FORENSIGHT"

--BOUNDARY_CYBER_FORENSIGHT
Content-Type: text/plain; charset=UTF-8

Dear Finance Executive,

An unauthorized login attempt was intercepted targeting corporate treasury systems.
Please review the attached invoice manifest and re-authenticate via the emergency gateway:
http://198.51.100.45/auth/emergency-token-refresh.php

Security Incident Response Team
--BOUNDARY_CYBER_FORENSIGHT--
'''.encode('utf-8')),

    2: ('access_log.txt', 'access_log.txt', '''198.51.100.45 - - [15/Oct/2026:09:12:01 +0000] "GET /admin/login.php HTTP/1.1" 200 4821 "-" "Mozilla/5.0 ThreatActor/4.1"
198.51.100.45 - - [15/Oct/2026:09:12:05 +0000] "POST /api/v1/auth/login HTTP/1.1" 401 245 "-" "curl/7.68.0"
198.51.100.45 - - [15/Oct/2026:09:12:18 +0000] "POST /api/v1/auth/login HTTP/1.1" 200 891 "-" "curl/7.68.0"
198.51.100.45 - - [15/Oct/2026:09:13:42 +0000] "GET /api/v1/users/export?format=csv HTTP/1.1" 200 528912 "-" "ThreatActor/4.1"
203.0.113.88 - - [15/Oct/2026:09:15:30 +0000] "GET /payloads/stage2.bin HTTP/1.1" 200 1048576 "-" "Powershell/5.1"
'''.encode('utf-8')),

    3: ('login_report.csv', 'login_report.csv', '''timestamp,user_id,username,ip_address,auth_status,user_agent,failure_reason
2026-10-15 08:30:12,1,kamya@example.com,192.168.1.105,SUCCESS,Mozilla/5.0 Windows,NONE
2026-10-15 09:12:05,2,rahul.verma@example.com,198.51.100.45,FAILURE,curl/7.68.0,BAD_PASSWORD
2026-10-15 09:12:18,2,rahul.verma@example.com,198.51.100.45,SUCCESS,curl/7.68.0,NONE
2026-10-15 09:14:02,3,ananya.iyer@example.com,10.0.4.12,SUCCESS,Mozilla/5.0 Linux,NONE
2026-10-15 09:17:45,4,harsh.rane@example.com,192.168.1.110,SUCCESS,Mozilla/5.0 MacOS,NONE
'''.encode('utf-8')),

    4: ('suspicious_file.exe', 'suspicious_file.exe', b'MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00\xff\xff\x00\x00\xb8\x00\x00\x00\x00\x00\x00\x00@\x00\x00\x00This program cannot be run in DOS mode.\r\r\n$\x00\x00\x00\x00\x00\x00\x00PE\x00\x00L\x01\x03\x00FORENSIGHT_EMBEDDED_MALWARE_SIMULATION_PAYLOAD_C2_BEACON_45.33.32.156'),

    5: ('identity_report.pdf', 'identity_report.pdf', b'''%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >> endobj
4 0 obj << /Length 85 >> stream
BT /F1 12 Tf 50 700 Td (ForenSight Identity Security Audit Dossier - Certified Exhibit) Tj ET
endstream endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000214 00000 n 
trailer << /Size 5 /Root 1 0 R >>
startxref
350
%%EOF
''')
}

conn = get_db_connection()
cur = conn.cursor(dictionary=True)

for eid, (fname, ename, content) in files_data.items():
    disk_path = os.path.join(upload_dir, fname)
    with open(disk_path, 'wb') as f:
        f.write(content)
    
    fsize = len(content)
    sha = hashlib.sha256(content).hexdigest()
    rel_path = f'/uploads/{fname}'
    
    cur.execute('''
        UPDATE evidence 
        SET file_path = %s, sha256_hash = %s, file_size = %s, evidence_name = %s
        WHERE evidence_id = %s;
    ''', (rel_path, sha, fsize, ename, eid))
    print(f'Evidence #{eid} created on disk: {disk_path} ({fsize} bytes, sha256: {sha[:16]}...)')

conn.commit()
cur.close()
conn.close()
print("All initial evidence files successfully materialized on disk!")
