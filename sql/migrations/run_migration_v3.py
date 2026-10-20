import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
import db
from werkzeug.security import generate_password_hash, check_password_hash

conn = db.get_db_connection()
cur = conn.cursor(dictionary=True)

user_passwords = {
    1: 'Admin@123',
    2: 'Investigator@123',
    3: 'Investigator@123',
    4: 'Viewer@123',
    5: 'Investigator@123'
}

sql_lines = [
    "-- =====================================================================",
    "-- ForenSight Database Migration: Phase 3 - Secure Password Hashing",
    "-- Target Database: forensight",
    "-- =====================================================================",
    "USE `forensight`;\n"
]

print("=== MIGRATING PASSWORD HASHES ===")
for uid, raw_pass in user_passwords.items():
    phash = generate_password_hash(raw_pass)
    cur.execute("UPDATE users SET password_hash = %s WHERE user_id = %s;", (phash, uid))
    sql_lines.append(f"UPDATE users SET password_hash = '{phash}' WHERE user_id = {uid};")
    print(f"User #{uid}: updated with secure hash (matches: {check_password_hash(phash, raw_pass)})")

conn.commit()

migration_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "migration_v3_passwords.sql")
with open(migration_file, "w", encoding="utf-8") as f:
    f.write("\n".join(sql_lines) + "\n")

print(f"\nSaved SQL migration to {migration_file}")

# Verify live in DB
cur.execute("SELECT user_id, name, email, role, password_hash FROM users;")
for u in cur.fetchall():
    raw_p = user_passwords[u['user_id']]
    verified = check_password_hash(u['password_hash'], raw_p)
    print(f"Verified in DB: {u['email']} ({u['role']}) -> verified: {verified}")

cur.close()
conn.close()
