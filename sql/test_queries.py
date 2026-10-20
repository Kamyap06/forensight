import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import db

def test_experiment8_queries():
    conn = db.get_db_connection()
    cur = conn.cursor(dictionary=True)
    
    with open(os.path.join(os.path.dirname(__file__), 'experiment8_queries.sql'), 'r', encoding='utf-8') as f:
        content = f.read()

    # Split into statements while skipping comments and empty lines
    statements = []
    current = []
    for line in content.splitlines():
        trimmed = line.strip()
        if not trimmed or trimmed.startswith('--'):
            continue
        current.append(line)
        if trimmed.endswith(';'):
            stmt = '\n'.join(current).strip()
            if stmt.endswith(';'):
                stmt = stmt[:-1].strip()
            if stmt:
                statements.append(stmt)
            current = []

    print(f"Extracted {len(statements)} executable SQL statements.")
    success_count = 0
    for i, stmt in enumerate(statements, 1):
        if stmt.upper().startswith("USE "):
            continue
        try:
            cur.execute(stmt)
            if cur.description:
                rows = cur.fetchall()
                first_line = stmt.split('\n')[0][:60]
                print(f"[{i}] Query OK ({len(rows)} rows): {first_line}")
            else:
                conn.commit()
                first_line = stmt.split('\n')[0][:60]
                print(f"[{i}] DML OK (affected {cur.rowcount}): {first_line}")
            success_count += 1
        except Exception as e:
            print(f"[{i}] FAILED: {stmt}\nError: {e}")
            raise e

    print(f"\nAll {success_count} queries in experiment8_queries.sql executed successfully with ZERO errors!")
    cur.close()
    conn.close()

if __name__ == '__main__':
    test_experiment8_queries()
