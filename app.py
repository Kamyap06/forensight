import os
import hashlib
from functools import wraps
from datetime import datetime
from flask import Flask, jsonify, request, session, send_from_directory, Response, make_response
from flask_cors import CORS
from werkzeug.utils import secure_filename
from werkzeug.security import check_password_hash, generate_password_hash

from config import Config
from db import get_db_connection
from report_generator import generate_case_pdf, generate_case_docx

app = Flask(__name__)
app.config.from_object(Config)

# Enable CORS with credentials for local Vite dev server
CORS(
    app,
    supports_credentials=True,
    origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5000", "http://127.0.0.1:5000"]
)

# Cookie session configuration
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["SESSION_COOKIE_SECURE"] = False  # Local HTTP development
app.config["SESSION_COOKIE_HTTPONLY"] = True

# Ensure upload directory exists
os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in app.config["ALLOWED_EXTENSIONS"]

def format_row(row):
    """Format datetime and decimal objects in dict for JSON serialization."""
    formatted = {}
    for k, v in row.items():
        if isinstance(v, datetime):
            formatted[k] = v.isoformat()
        elif hasattr(v, "isoformat"):
            formatted[k] = v.isoformat()
        elif isinstance(v, bytes):
            formatted[k] = v.decode("utf-8", errors="ignore")
        elif hasattr(v, "__float__") and type(v).__name__ == "Decimal":
            formatted[k] = float(v)
        else:
            formatted[k] = v
    return formatted

# =====================================================================
# AUTHENTICATION & ROLE-BASED ACCESS CONTROL HELPERS
# =====================================================================

def get_current_user():
    """Identify the currently authenticated user from session or header fallback."""
    user_id = session.get("user_id")

    # Header fallback for API testing
    if not user_id and request.headers.get("X-User-Id"):
        try:
            user_id = int(request.headers.get("X-User-Id"))
        except ValueError:
            user_id = None

    if not user_id:
        return None

    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(dictionary=True)
        cur.execute("SELECT user_id, name, email, role, created_at FROM users WHERE user_id = %s;", (user_id,))
        return cur.fetchone()
    except Exception:
        return None
    finally:
        if cur: cur.close()
        if conn and conn.is_connected(): conn.close()

def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        user = get_current_user()
        if not user:
            return jsonify({"status": "error", "message": "Authentication required. Please sign in."}), 401
        return f(*args, **kwargs)
    return decorated

def roles_required(allowed_roles):
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            user = get_current_user()
            if not user:
                return jsonify({"status": "error", "message": "Authentication required. Please sign in."}), 401
            if user["role"] not in allowed_roles:
                return jsonify({
                    "status": "error",
                    "message": f"Access forbidden. Required role: {', '.join(allowed_roles)}. Your role is '{user['role']}'."
                }), 403
            return f(*args, **kwargs)
        return decorated
    return decorator

# =====================================================================
# SYSTEM & HEALTH CHECK
# =====================================================================

FRONTEND_DIST = os.path.join(os.path.dirname(os.path.abspath(__file__)), "frontend", "dist")

@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_frontend(path):
    if path.startswith("api/"):
        return jsonify({"status": "error", "message": f"API endpoint '/{path}' not found"}), 404

    target_file = os.path.join(FRONTEND_DIST, path)
    if path != "" and os.path.exists(target_file) and not os.path.isdir(target_file):
        return send_from_directory(FRONTEND_DIST, path)

    index_file = os.path.join(FRONTEND_DIST, "index.html")
    if os.path.exists(index_file):
        resp = make_response(send_from_directory(FRONTEND_DIST, "index.html"))
        resp.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        resp.headers["Pragma"] = "no-cache"
        resp.headers["Expires"] = "0"
        return resp

    return jsonify({
        "project": "ForenSight",
        "tagline": "Every digital trace tells a story.",
        "status": "online",
        "api_prefix": "/api"
    })

@app.route("/api/db-check")
def db_check():
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(dictionary=True)
        cur.execute("SELECT DATABASE() AS db_name;")
        db_name = cur.fetchone()["db_name"]

        cur.execute("SHOW FULL TABLES WHERE Table_type = 'BASE TABLE';")
        tables = [list(r.values())[0] for r in cur.fetchall()]

        cur.execute("SHOW FULL TABLES WHERE Table_type = 'VIEW';")
        views = [list(r.values())[0] for r in cur.fetchall()]

        return jsonify({
            "status": "connected",
            "database": db_name,
            "tables_count": len(tables),
            "tables": tables,
            "views_count": len(views),
            "views": views
        })
    except Exception as e:
        app.logger.exception("DB check failed")
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if cur: cur.close()
        if conn and conn.is_connected(): conn.close()

# =====================================================================
# AUTHENTICATION API (REGISTER, LOGIN, LOGOUT, ME, SETUP-ADMIN)
# =====================================================================

@app.route("/api/auth/register", methods=["POST"])
@app.route("/api/register", methods=["POST"])
def auth_register():
    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    role = (data.get("role") or "Investigator").strip()

    if not name:
        return jsonify({"status": "error", "message": "Investigator name is required"}), 400

    if not email or "@" not in email or "." not in email:
        return jsonify({"status": "error", "message": "A valid email address is required"}), 400

    if not password or len(password) < 6:
        return jsonify({"status": "error", "message": "Password must be at least 6 characters long"}), 400

    # Security check: Public registration CANNOT create an Admin account!
    if role == "Admin":
        return jsonify({
            "status": "error",
            "message": "Administrative privileges cannot be granted via public registration. Contact a system administrator."
        }), 403

    if role not in ["Investigator", "Viewer"]:
        role = "Investigator"

    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(dictionary=True)

        # 1. Reject duplicate email addresses
        cur.execute("SELECT user_id FROM users WHERE LOWER(email) = %s;", (email,))
        if cur.fetchone():
            return jsonify({
                "status": "error",
                "message": f"An investigator account with email '{email}' is already registered."
            }), 409

        # 2. Hash password securely using werkzeug
        phash = generate_password_hash(password)

        # 3. Insert into MySQL Users table
        cur.execute("""
            INSERT INTO users (name, email, password_hash, role)
            VALUES (%s, %s, %s, %s);
        """, (name, email, phash, role))
        new_user_id = cur.lastrowid

        # 4. Record registration in AuditLogs
        cur.execute("""
            INSERT INTO auditlogs (user_id, action, entity_type, entity_id, details)
            VALUES (%s, 'REGISTER', 'User', %s, %s);
        """, (new_user_id, new_user_id, f"Registered new user {name} with role {role}"))

        conn.commit()

        # 5. Automatically establish authenticated session
        session["user_id"] = new_user_id
        session["user_role"] = role

        safe_user = {
            "user_id": new_user_id,
            "name": name,
            "email": email,
            "role": role,
            "created_at": datetime.now().isoformat()
        }

        return jsonify({
            "status": "success",
            "message": f"Account created successfully. Welcome to ForenSight, {name}!",
            "user": safe_user
        }), 201
    except Exception as e:
        if conn: conn.rollback()
        app.logger.exception("Registration error")
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if cur: cur.close()
        if conn and conn.is_connected(): conn.close()

@app.route("/api/auth/setup-admin", methods=["POST"])
def auth_setup_admin():
    """Initial Administrator initialization if no admin accounts exist."""
    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not name or not email or not password:
        return jsonify({"status": "error", "message": "Name, email, and password are required"}), 400

    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(dictionary=True)

        # Check if an admin already exists
        cur.execute("SELECT COUNT(*) AS admin_count FROM users WHERE role = 'Admin';")
        admin_count = cur.fetchone()["admin_count"]

        if admin_count > 0:
            return jsonify({
                "status": "error",
                "message": "Initial administrator setup is disabled because an Administrator account already exists."
            }), 403

        phash = generate_password_hash(password)
        cur.execute("""
            INSERT INTO users (name, email, password_hash, role)
            VALUES (%s, %s, %s, 'Admin');
        """, (name, email, phash))
        new_admin_id = cur.lastrowid

        cur.execute("""
            INSERT INTO auditlogs (user_id, action, entity_type, entity_id, details)
            VALUES (%s, 'ADMIN_SETUP', 'User', %s, 'Initial administrator setup performed');
        """, (new_admin_id, new_admin_id))

        conn.commit()

        session["user_id"] = new_admin_id
        session["user_role"] = "Admin"

        return jsonify({
            "status": "success",
            "message": "Initial administrator account created successfully.",
            "user": {
                "user_id": new_admin_id,
                "name": name,
                "email": email,
                "role": "Admin",
                "created_at": datetime.now().isoformat()
            }
        }), 201
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if cur: cur.close()
        if conn and conn.is_connected(): conn.close()


@app.route("/api/auth/login", methods=["POST"])
@app.route("/api/login", methods=["POST"])
def auth_login():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return jsonify({"status": "error", "message": "Email and password are required"}), 400

    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(dictionary=True)

        cur.execute("SELECT user_id, name, email, password_hash, role, created_at FROM users WHERE LOWER(email) = %s;", (email,))
        user = cur.fetchone()

        if not user or not check_password_hash(user["password_hash"], password):
            # Log failed attempt
            cur.execute("""
                INSERT INTO auditlogs (user_id, action, entity_type, entity_id, details)
                VALUES (NULL, 'AUTH_FAILED', 'User', NULL, %s);
            """, (f"Failed login attempt for email: {email}",))
            conn.commit()
            return jsonify({"status": "error", "message": "Invalid email or password"}), 401

        # Successful login: set session
        session["user_id"] = user["user_id"]
        session["user_role"] = user["role"]

        # Log successful authentication
        cur.execute("""
            INSERT INTO auditlogs (user_id, action, entity_type, entity_id, details)
            VALUES (%s, 'LOGIN', 'User', %s, %s);
        """, (user["user_id"], user["user_id"], f"User {user['name']} ({user['role']}) signed in"))
        conn.commit()

        safe_user = {
            "user_id": user["user_id"],
            "name": user["name"],
            "email": user["email"],
            "role": user["role"],
            "created_at": user["created_at"].isoformat() if user["created_at"] else None
        }

        return jsonify({
            "status": "success",
            "message": "Signed in successfully",
            "user": safe_user
        })
    except Exception as e:
        if conn: conn.rollback()
        app.logger.exception("Login error")
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if cur: cur.close()
        if conn and conn.is_connected(): conn.close()

@app.route("/api/auth/logout", methods=["POST"])
def auth_logout():
    current_uid = session.get("user_id")
    if current_uid:
        conn = None
        cur = None
        try:
            conn = get_db_connection()
            cur = conn.cursor()
            cur.execute("""
                INSERT INTO auditlogs (user_id, action, entity_type, entity_id, details)
                VALUES (%s, 'LOGOUT', 'User', %s, 'User signed out');
            """, (current_uid, current_uid))
            conn.commit()
        except Exception:
            pass
        finally:
            if cur: cur.close()
            if conn and conn.is_connected(): conn.close()

    session.clear()
    return jsonify({"status": "success", "message": "Signed out successfully"})

@app.route("/api/auth/me", methods=["GET"])
def auth_me():
    user = get_current_user()
    if not user:
        return jsonify({"status": "error", "message": "Not authenticated"}), 401
    return jsonify({"status": "success", "user": format_row(user)})

# =====================================================================
# DASHBOARD API
# =====================================================================

@app.route("/api/dashboard")
def dashboard_stats():
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(dictionary=True)

        # 1. Total & Status Cases
        cur.execute("""
            SELECT 
                COUNT(*) AS total_cases,
                SUM(CASE WHEN status = 'Open' THEN 1 ELSE 0 END) AS open_cases,
                SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) AS in_progress_cases,
                SUM(CASE WHEN status = 'Closed' THEN 1 ELSE 0 END) AS closed_cases
            FROM cases;
        """)
        case_stats = cur.fetchone()

        # 2. Evidence Stats
        cur.execute("""
            SELECT 
                COUNT(*) AS total_evidence,
                COALESCE(SUM(file_size), 0) AS total_file_size_bytes,
                COALESCE(ROUND(SUM(file_size) / 1024, 2), 0) AS total_size_kb
            FROM evidence;
        """)
        ev_stats = cur.fetchone()

        # 3. Investigation Task Stats
        cur.execute("""
            SELECT 
                COUNT(*) AS total_tasks,
                SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) AS pending_tasks,
                SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) AS in_progress_tasks,
                SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) AS completed_tasks
            FROM investigationtasks;
        """)
        task_stats = cur.fetchone()

        # 4. Critical & High Findings
        cur.execute("""
            SELECT 
                COUNT(*) AS total_findings,
                SUM(CASE WHEN severity IN ('High', 'Critical') THEN 1 ELSE 0 END) AS critical_and_high,
                SUM(CASE WHEN severity = 'Critical' THEN 1 ELSE 0 END) AS critical_count,
                SUM(CASE WHEN severity = 'High' THEN 1 ELSE 0 END) AS high_count,
                SUM(CASE WHEN severity = 'Medium' THEN 1 ELSE 0 END) AS medium_count,
                SUM(CASE WHEN severity = 'Low' THEN 1 ELSE 0 END) AS low_count
            FROM analysisfindings;
        """)
        finding_stats = cur.fetchone()

        # 5. Recent Cases
        cur.execute("""
            SELECT 
                c.case_id, c.title, c.incident_type, c.priority, c.status,
                u.name AS created_by_name, c.created_at,
                COUNT(ce.evidence_id) AS evidence_count
            FROM cases c
            INNER JOIN users u ON c.created_by = u.user_id
            LEFT JOIN caseevidence ce ON c.case_id = ce.case_id
            GROUP BY c.case_id, c.title, c.incident_type, c.priority, c.status, u.name, c.created_at
            ORDER BY c.created_at DESC, c.case_id DESC
            LIMIT 5;
        """)
        recent_cases = [format_row(r) for r in cur.fetchall()]

        # 6. Critical Findings List
        cur.execute("""
            SELECT 
                af.finding_id, af.finding_type, af.severity, af.description,
                e.evidence_id, e.evidence_name, af.created_at
            FROM analysisfindings af
            INNER JOIN evidence e ON af.evidence_id = e.evidence_id
            WHERE af.severity IN ('High', 'Critical')
            ORDER BY FIELD(af.severity, 'Critical', 'High'), af.created_at DESC
            LIMIT 5;
        """)
        critical_findings = [format_row(r) for r in cur.fetchall()]

        # 7. Recent Audit Trail
        cur.execute("""
            SELECT 
                a.audit_id, a.audit_id AS log_id,
                a.action,
                a.entity_type, a.entity_type AS table_name,
                a.entity_id, a.entity_id AS record_id,
                a.details, a.details AS change_description,
                a.created_at, a.created_at AS timestamp,
                COALESCE(u.name, 'System / Trigger') AS user_name
            FROM auditlogs a
            LEFT JOIN users u ON a.user_id = u.user_id
            ORDER BY a.created_at DESC, a.audit_id DESC
            LIMIT 6;
        """)
        recent_audits = [format_row(r) for r in cur.fetchall()]

        # 8. User Counts by Role
        cur.execute("""
            SELECT 
                COUNT(*) AS total_users,
                SUM(CASE WHEN role = 'Admin' THEN 1 ELSE 0 END) AS admin_count,
                SUM(CASE WHEN role = 'Investigator' THEN 1 ELSE 0 END) AS investigator_count,
                SUM(CASE WHEN role = 'Viewer' THEN 1 ELSE 0 END) AS viewer_count
            FROM users;
        """)
        user_role_counts = cur.fetchone()

        # 9. Recent Evidence (for dashboard table)
        cur.execute("""
            SELECT 
                e.evidence_id, e.evidence_name, e.evidence_type, e.file_size,
                e.sha256_hash, e.status, e.created_at,
                COALESCE(u.name, 'Investigator') AS uploaded_by_name
            FROM evidence e
            LEFT JOIN users u ON e.uploaded_by = u.user_id
            ORDER BY e.created_at DESC, e.evidence_id DESC
            LIMIT 5;
        """)
        recent_evidence = [format_row(r) for r in cur.fetchall()]

        # 10. Evidence Types Distribution (for donut chart)
        cur.execute("""
            SELECT evidence_type AS name, COUNT(*) AS count
            FROM evidence
            GROUP BY evidence_type
            ORDER BY count DESC;
        """)
        evidence_by_type = [format_row(r) for r in cur.fetchall()]

        # 11. Task Status Distribution (for donut chart)
        cur.execute("""
            SELECT status AS name, COUNT(*) AS count
            FROM investigationtasks
            GROUP BY status
            ORDER BY count DESC;
        """)
        task_status_breakdown = [format_row(r) for r in cur.fetchall()]

        return jsonify({
            "status": "success",
            "stats": {
                "total_cases": int(case_stats["total_cases"] or 0),
                "open_cases": int(case_stats["open_cases"] or 0),
                "in_progress_cases": int(case_stats["in_progress_cases"] or 0),
                "closed_cases": int(case_stats["closed_cases"] or 0),
                "total_evidence": int(ev_stats["total_evidence"] or 0),
                "total_size_kb": float(ev_stats["total_size_kb"] or 0),
                "total_tasks": int(task_stats["total_tasks"] or 0),
                "pending_tasks": int(task_stats["pending_tasks"] or 0),
                "in_progress_tasks": int(task_stats["in_progress_tasks"] or 0),
                "completed_tasks": int(task_stats["completed_tasks"] or 0),
                "total_findings": int(finding_stats["total_findings"] or 0),
                "critical_findings": int(finding_stats["critical_and_high"] or 0),
                "total_users": int(user_role_counts["total_users"] or 0),
                "admin_users": int(user_role_counts["admin_count"] or 0),
                "investigator_users": int(user_role_counts["investigator_count"] or 0),
                "viewer_users": int(user_role_counts["viewer_count"] or 0),
                "severity_distribution": {
                    "Critical": int(finding_stats["critical_count"] or 0),
                    "High": int(finding_stats["high_count"] or 0),
                    "Medium": int(finding_stats["medium_count"] or 0),
                    "Low": int(finding_stats["low_count"] or 0)
                }
            },
            "recent_cases": recent_cases,
            "recent_evidence": recent_evidence,
            "evidence_by_type": evidence_by_type,
            "task_status_breakdown": task_status_breakdown,
            "critical_findings": critical_findings,
            "recent_audits": recent_audits
        })
    except Exception as e:
        app.logger.exception("Dashboard query error")
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if cur: cur.close()
        if conn and conn.is_connected(): conn.close()

# =====================================================================
# USERS API
# =====================================================================

@app.route("/api/users")
def get_users():
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(dictionary=True)
        cur.execute("SELECT user_id, name, email, role, created_at FROM users ORDER BY name ASC;")
        users = [format_row(r) for r in cur.fetchall()]
        return jsonify({"status": "success", "users": users})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if cur: cur.close()
        if conn and conn.is_connected(): conn.close()

# =====================================================================
# CASES API (CRUD & RBAC)
# =====================================================================

@app.route("/api/cases", methods=["GET"])
def list_cases():
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(dictionary=True)

        query = """
            SELECT 
                c.case_id, c.title, c.incident_type, c.description, c.priority, c.status,
                c.created_by, u.name AS created_by_name, u.email AS created_by_email,
                c.created_at, c.updated_at,
                COUNT(DISTINCT ce.evidence_id) AS evidence_count,
                COUNT(DISTINCT t.task_id) AS task_count
            FROM cases c
            INNER JOIN users u ON c.created_by = u.user_id
            LEFT JOIN caseevidence ce ON c.case_id = ce.case_id
            LEFT JOIN investigationtasks t ON c.case_id = t.case_id
            GROUP BY c.case_id, c.title, c.incident_type, c.description, c.priority, c.status,
                     c.created_by, u.name, u.email, c.created_at, c.updated_at
            ORDER BY c.created_at DESC, c.case_id DESC;
        """
        cur.execute(query)
        cases = [format_row(r) for r in cur.fetchall()]
        return jsonify({"status": "success", "cases": cases})
    except Exception as e:
        app.logger.exception("List cases failed")
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if cur: cur.close()
        if conn and conn.is_connected(): conn.close()

@app.route("/api/cases", methods=["POST"])
@roles_required(["Admin", "Investigator"])
def create_case():
    data = request.get_json() or {}
    title = (data.get("title") or "").strip()
    incident_type = (data.get("incident_type") or "").strip()
    description = (data.get("description") or "").strip()
    priority = data.get("priority", "Medium")

    user = get_current_user()
    created_by = data.get("created_by") or (user["user_id"] if user else 1)

    if not title:
        return jsonify({"status": "error", "message": "Case title is required"}), 400
    if not incident_type:
        return jsonify({"status": "error", "message": "Incident type is required"}), 400

    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        # Invoke stored procedure sp_add_case!
        args = (title, incident_type, description, priority, int(created_by), 0, "")
        result_args = cur.callproc("sp_add_case", args)

        new_case_id = result_args[5]
        status_msg = result_args[6]

        conn.commit()

        if new_case_id <= 0:
            return jsonify({"status": "error", "message": status_msg}), 400

        return jsonify({
            "status": "success",
            "message": status_msg,
            "case_id": new_case_id
        }), 201
    except Exception as e:
        if conn: conn.rollback()
        app.logger.exception("Create case failed")
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if cur: cur.close()
        if conn and conn.is_connected(): conn.close()

@app.route("/api/cases/<int:case_id>", methods=["GET"])
def get_case(case_id):
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(dictionary=True)

        # Case info
        cur.execute("""
            SELECT 
                c.case_id, c.title, c.incident_type, c.description, c.priority, c.status,
                c.created_by, u.name AS created_by_name, u.name AS creator_name, u.email AS created_by_email,
                c.created_at, c.updated_at
            FROM cases c
            INNER JOIN users u ON c.created_by = u.user_id
            WHERE c.case_id = %s;
        """, (case_id,))
        case_info = cur.fetchone()
        if not case_info:
            return jsonify({"status": "error", "message": "Case not found"}), 404

        # Linked Evidence
        cur.execute("""
            SELECT 
                e.evidence_id, e.evidence_name, e.evidence_type, e.file_path,
                e.sha256_hash, e.file_size, e.collected_at, e.status, e.created_at,
                u.name AS uploaded_by_name, u.name AS uploader_name
            FROM caseevidence ce
            INNER JOIN evidence e ON ce.evidence_id = e.evidence_id
            INNER JOIN users u ON e.uploaded_by = u.user_id
            WHERE ce.case_id = %s
            ORDER BY e.created_at DESC;
        """, (case_id,))
        evidence_list = [format_row(r) for r in cur.fetchall()]

        # Tasks for this case with assigned users
        cur.execute("""
            SELECT 
                t.task_id, t.task_title, t.description, t.due_date, t.status, t.created_at,
                COALESCE(GROUP_CONCAT(u.name SEPARATOR ', '), '') AS assigned_users,
                COALESCE(GROUP_CONCAT(u.user_id), '') AS assigned_user_ids
            FROM investigationtasks t
            LEFT JOIN taskassignments ta ON t.task_id = ta.task_id
            LEFT JOIN users u ON ta.user_id = u.user_id
            WHERE t.case_id = %s
            GROUP BY t.task_id, t.task_title, t.description, t.due_date, t.status, t.created_at
            ORDER BY t.created_at DESC;
        """, (case_id,))
        tasks_raw = cur.fetchall()
        tasks_list = []
        for tr in tasks_raw:
            formatted_t = format_row(tr)
            u_names = [n.strip() for n in (formatted_t.get("assigned_users") or "").split(",") if n.strip()]
            u_ids = [int(i.strip()) for i in (formatted_t.get("assigned_user_ids") or "").split(",") if i.strip()]
            formatted_t["assignees"] = [{"user_id": uid, "name": uname} for uid, uname in zip(u_ids, u_names)]
            tasks_list.append(formatted_t)

        # Related Analysis Findings for evidence linked to this case
        cur.execute("""
            SELECT 
                af.finding_id, af.evidence_id, af.finding_type, af.severity, af.description, af.created_at,
                e.evidence_name, e.evidence_type
            FROM caseevidence ce
            INNER JOIN analysisfindings af ON ce.evidence_id = af.evidence_id
            INNER JOIN evidence e ON af.evidence_id = e.evidence_id
            WHERE ce.case_id = %s
            ORDER BY FIELD(af.severity, 'Critical', 'High', 'Medium', 'Low'), af.created_at DESC;
        """, (case_id,))
        findings_list = [format_row(r) for r in cur.fetchall()]

        # Chain of Custody logs for evidence linked to this case
        cur.execute("""
            SELECT 
                cl.log_id, cl.evidence_id, cl.action, cl.notes, cl.event_time,
                cl.event_time AS timestamp, cl.event_time AS created_at,
                e.evidence_name, u.name AS user_name, u.role AS user_role
            FROM caseevidence ce
            INNER JOIN custodylogs cl ON ce.evidence_id = cl.evidence_id
            INNER JOIN evidence e ON cl.evidence_id = e.evidence_id
            LEFT JOIN users u ON cl.user_id = u.user_id
            WHERE ce.case_id = %s
            ORDER BY cl.event_time DESC, cl.log_id DESC;
        """, (case_id,))
        custody_list = [format_row(r) for r in cur.fetchall()]

        # Technical Notes for evidence linked to this case
        cur.execute("""
            SELECT 
                en.note_id, en.evidence_id, en.note_text, en.created_at,
                e.evidence_name, u.name AS author_name, u.role AS author_role
            FROM caseevidence ce
            INNER JOIN evidencenotes en ON ce.evidence_id = en.evidence_id
            INNER JOIN evidence e ON en.evidence_id = e.evidence_id
            LEFT JOIN users u ON en.user_id = u.user_id
            WHERE ce.case_id = %s
            ORDER BY en.created_at DESC;
        """, (case_id,))
        notes_list = [format_row(r) for r in cur.fetchall()]

        # Audit logs for this case and its associated entities
        cur.execute("""
            SELECT 
                a.audit_id, a.user_id, a.action, a.entity_type, a.entity_id, a.details, a.created_at,
                a.created_at AS timestamp, COALESCE(u.name, 'System / DB Trigger') AS user_name
            FROM auditlogs a
            LEFT JOIN users u ON a.user_id = u.user_id
            WHERE (a.entity_type IN ('Case', 'Cases') AND a.entity_id = %s)
               OR (a.entity_type = 'Evidence' AND a.entity_id IN (SELECT evidence_id FROM caseevidence WHERE case_id = %s))
               OR (a.entity_type = 'Task' AND a.entity_id IN (SELECT task_id FROM investigationtasks WHERE case_id = %s))
            ORDER BY a.created_at DESC
            LIMIT 50;
        """, (case_id, case_id, case_id))
        audit_list = [format_row(r) for r in cur.fetchall()]

        return jsonify({
            "status": "success",
            "case": format_row(case_info),
            "evidence": evidence_list,
            "tasks": tasks_list,
            "findings": findings_list,
            "custody": custody_list,
            "notes": notes_list,
            "audit": audit_list
        })
    except Exception as e:
        app.logger.exception("Get case details error")
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if cur: cur.close()
        if conn and conn.is_connected(): conn.close()

# =====================================================================
# CASE FORENSIC REPORT GENERATION (PDF & DOCX)
# =====================================================================

@app.route("/api/cases/<int:case_id>/report/pdf", methods=["GET"])
def get_case_report_pdf(case_id):
    try:
        sections_param = request.args.get("sections")
        sections_list = [s.strip() for s in sections_param.split(",") if s.strip()] if sections_param else None
        pdf_bytes = generate_case_pdf(case_id, sections=sections_list)
        filename = f"ForenSight_Case_{case_id}_Report.pdf"
        return Response(
            pdf_bytes,
            mimetype="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=\"{filename}\"",
                "Content-Type": "application/pdf"
            }
        )
    except ValueError as ve:
        return jsonify({"status": "error", "message": str(ve)}), 404
    except Exception as e:
        app.logger.exception("Case PDF report generation error")
        return jsonify({"status": "error", "message": f"PDF report error: {str(e)}"}), 500

@app.route("/api/cases/<int:case_id>/report/doc", methods=["GET"])
@app.route("/api/cases/<int:case_id>/report/docx", methods=["GET"])
def get_case_report_doc(case_id):
    try:
        sections_param = request.args.get("sections")
        sections_list = [s.strip() for s in sections_param.split(",") if s.strip()] if sections_param else None
        docx_bytes = generate_case_docx(case_id, sections=sections_list)
        filename = f"ForenSight_Case_{case_id}_Report.docx"
        return Response(
            docx_bytes,
            mimetype="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={
                "Content-Disposition": f"attachment; filename=\"{filename}\"",
                "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            }
        )
    except ValueError as ve:
        return jsonify({"status": "error", "message": str(ve)}), 404
    except Exception as e:
        app.logger.exception("Case DOCX report generation error")
        return jsonify({"status": "error", "message": f"DOCX report error: {str(e)}"}), 500

@app.route("/api/cases/<int:case_id>", methods=["PUT"])
@roles_required(["Admin", "Investigator"])
def update_case(case_id):
    data = request.get_json() or {}
    title = (data.get("title") or "").strip()
    incident_type = (data.get("incident_type") or "").strip()
    description = data.get("description", "")
    priority = data.get("priority", "Medium")
    status = data.get("status", "Open")

    if not title or not incident_type:
        return jsonify({"status": "error", "message": "Title and incident type are required"}), 400

    user = get_current_user()
    current_uid = user["user_id"] if user else 1

    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("""
            UPDATE cases 
            SET title = %s, incident_type = %s, description = %s, priority = %s, status = %s
            WHERE case_id = %s;
        """, (title, incident_type, description, priority, status, case_id))

        if cur.rowcount == 0:
            return jsonify({"status": "error", "message": "Case not found or unchanged"}), 404

        # Record audit log
        cur.execute("""
            INSERT INTO auditlogs (user_id, action, entity_type, entity_id, details)
            VALUES (%s, 'UPDATE', 'Case', %s, %s);
        """, (current_uid, case_id, f"Updated case: {title} ({status})"))

        conn.commit()
        return jsonify({"status": "success", "message": "Case updated successfully"})
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if cur: cur.close()
        if conn and conn.is_connected(): conn.close()

@app.route("/api/cases/<int:case_id>", methods=["DELETE"])
@roles_required(["Admin"])
def delete_case(case_id):
    user = get_current_user()
    current_uid = user["user_id"] if user else 1

    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(dictionary=True)

        cur.execute("SELECT title FROM cases WHERE case_id = %s;", (case_id,))
        case = cur.fetchone()
        if not case:
            return jsonify({"status": "error", "message": "Case not found"}), 404

        # 1. Dissociate evidence from caseevidence
        cur.execute("DELETE FROM caseevidence WHERE case_id = %s;", (case_id,))

        # 2. Find and delete tasks & task assignments
        cur.execute("SELECT task_id FROM investigationtasks WHERE case_id = %s;", (case_id,))
        tasks = cur.fetchall()
        for t in tasks:
            cur.execute("DELETE FROM taskassignments WHERE task_id = %s;", (t["task_id"],))
        cur.execute("DELETE FROM investigationtasks WHERE case_id = %s;", (case_id,))

        # 3. Delete case record
        cur.execute("DELETE FROM cases WHERE case_id = %s;", (case_id,))

        # 4. Audit Log
        cur.execute("""
            INSERT INTO auditlogs (user_id, action, entity_type, entity_id, details)
            VALUES (%s, 'DELETE', 'Case', %s, %s);
        """, (current_uid, case_id, f"Deleted case #{case_id}: {case['title']}"))

        conn.commit()
        return jsonify({"status": "success", "message": f"Case #{case_id} deleted successfully"})
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if cur: cur.close()
        if conn and conn.is_connected(): conn.close()

@app.route("/api/cases/<int:case_id>/evidence", methods=["POST"])
@roles_required(["Admin", "Investigator"])
def associate_evidence(case_id):
    data = request.get_json() or {}
    evidence_ids = data.get("evidence_ids", [])
    if isinstance(evidence_ids, int):
        evidence_ids = [evidence_ids]

    if not evidence_ids:
        return jsonify({"status": "error", "message": "No evidence IDs provided"}), 400

    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        linked_count = 0
        for ev_id in evidence_ids:
            cur.execute("""
                INSERT IGNORE INTO caseevidence (case_id, evidence_id)
                VALUES (%s, %s);
            """, (case_id, ev_id))
            linked_count += cur.rowcount

        conn.commit()
        return jsonify({
            "status": "success",
            "message": f"Associated {linked_count} evidence item(s) with case #{case_id}"
        })
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if cur: cur.close()
        if conn and conn.is_connected(): conn.close()

@app.route("/api/cases/<int:case_id>/evidence/<int:evidence_id>", methods=["DELETE"])
@roles_required(["Admin", "Investigator"])
def disassociate_evidence(case_id, evidence_id):
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("DELETE FROM caseevidence WHERE case_id = %s AND evidence_id = %s;", (case_id, evidence_id))
        conn.commit()
        return jsonify({"status": "success", "message": "Evidence disassociated from case"})
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if cur: cur.close()
        if conn and conn.is_connected(): conn.close()

# =====================================================================
# EVIDENCE LAB API (UPLOAD, DOWNLOAD, SHA-256)
# =====================================================================

@app.route("/api/evidence", methods=["GET"])
def list_evidence():
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(dictionary=True)

        query = """
            SELECT 
                e.evidence_id, e.evidence_name, e.evidence_type, e.file_path,
                e.sha256_hash, e.file_size, e.collected_at, e.status, e.uploaded_by,
                u.name AS uploaded_by_name, e.created_at,
                GROUP_CONCAT(CONCAT('#', c.case_id, ' ', c.title) SEPARATOR ', ') AS associated_cases
            FROM evidence e
            INNER JOIN users u ON e.uploaded_by = u.user_id
            LEFT JOIN caseevidence ce ON e.evidence_id = ce.evidence_id
            LEFT JOIN cases c ON ce.case_id = c.case_id
            GROUP BY e.evidence_id, e.evidence_name, e.evidence_type, e.file_path,
                     e.sha256_hash, e.file_size, e.collected_at, e.status, e.uploaded_by,
                     u.name, e.created_at
            ORDER BY e.created_at DESC, e.evidence_id DESC;
        """
        cur.execute(query)
        evidence_list = [format_row(r) for r in cur.fetchall()]
        return jsonify({"status": "success", "evidence": evidence_list})
    except Exception as e:
        app.logger.exception("List evidence error")
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if cur: cur.close()
        if conn and conn.is_connected(): conn.close()

@app.route("/api/evidence", methods=["POST"])
@roles_required(["Admin", "Investigator"])
def upload_evidence():
    if "file" not in request.files:
        return jsonify({"status": "error", "message": "No file uploaded"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"status": "error", "message": "Empty file name"}), 400

    if not allowed_file(file.filename):
        return jsonify({"status": "error", "message": "File format not permitted"}), 400

    evidence_type = request.form.get("evidence_type", "Other")
    status = request.form.get("status", "Registered")
    valid_statuses = {"Registered", "Under Review", "Verified", "Archived"}
    if status not in valid_statuses:
        status_map = {
            "Under Analysis": "Under Review",
            "In Progress": "Under Review",
            "Processed": "Verified",
            "Collected": "Registered"
        }
        status = status_map.get(status, "Registered")
    collected_at = request.form.get("collected_at") or None
    case_ids = request.form.getlist("case_ids")

    user = get_current_user()
    uploaded_by = request.form.get("uploaded_by") or (user["user_id"] if user else 1)

    # Secure file save & SHA-256 computation
    original_filename = secure_filename(file.filename)
    timestamp_prefix = datetime.now().strftime("%Y%m%d_%H%M%S_")
    saved_filename = f"{timestamp_prefix}{original_filename}"
    file_path = os.path.join(app.config["UPLOAD_FOLDER"], saved_filename)
    rel_path = f"/uploads/{saved_filename}"

    file_bytes = file.read()
    file_size = len(file_bytes)
    sha256_hash = hashlib.sha256(file_bytes).hexdigest()

    # Save to disk
    with open(file_path, "wb") as f:
        f.write(file_bytes)

    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        # Insert into evidence
        insert_sql = """
            INSERT INTO evidence 
            (evidence_name, evidence_type, file_path, sha256_hash, file_size, collected_at, status, uploaded_by)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s);
        """
        cur.execute(insert_sql, (
            original_filename, evidence_type, rel_path, sha256_hash, file_size, collected_at, status, uploaded_by
        ))
        evidence_id = cur.lastrowid

        # Associate with cases in CaseEvidence
        for cid in case_ids:
            if cid:
                cur.execute("""
                    INSERT IGNORE INTO caseevidence (case_id, evidence_id)
                    VALUES (%s, %s);
                """, (int(cid), evidence_id))

        # Initial Custody Log entry (fires trg_after_custody_insert!)
        cur.execute("""
            INSERT INTO custodylogs (evidence_id, user_id, action, notes)
            VALUES (%s, %s, 'Evidence Ingested', %s);
        """, (evidence_id, uploaded_by, f"Uploaded {original_filename} (SHA-256: {sha256_hash[:16]}...)"))

        conn.commit()

        return jsonify({
            "status": "success",
            "message": "Evidence file uploaded and SHA-256 hash verified",
            "data": {
                "evidence_id": evidence_id,
                "evidence_name": original_filename,
                "sha256_hash": sha256_hash,
                "file_size": file_size,
                "file_path": rel_path
            }
        }), 201
    except Exception as e:
        if conn: conn.rollback()
        # Clean up file on failure
        if os.path.exists(file_path):
            try: os.remove(file_path)
            except Exception: pass
        app.logger.exception("Evidence upload DB error")
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if cur: cur.close()
        if conn and conn.is_connected(): conn.close()

@app.route("/api/evidence/<int:evidence_id>/download")
@login_required
def download_evidence(evidence_id):
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(dictionary=True)
        cur.execute("SELECT evidence_id, evidence_name, evidence_type, file_path, sha256_hash FROM evidence WHERE evidence_id = %s;", (evidence_id,))
        ev = cur.fetchone()
        if not ev:
            return jsonify({"status": "error", "message": "Evidence not found"}), 404

        # Extract filename from stored file_path
        filename = os.path.basename(ev["file_path"])
        full_disk_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)

        if not os.path.exists(full_disk_path):
            # Check by original evidence_name as fallback
            alt_path = os.path.join(app.config["UPLOAD_FOLDER"], ev["evidence_name"])
            if os.path.exists(alt_path):
                full_disk_path = alt_path
                filename = ev["evidence_name"]
            else:
                return jsonify({
                    "status": "error",
                    "message": f"Evidence artifact '{ev['evidence_name']}' is not available in local storage"
                }), 404

        return send_from_directory(
            os.path.dirname(full_disk_path),
            os.path.basename(full_disk_path),
            as_attachment=True,
            download_name=ev["evidence_name"]
        )
    except Exception as e:
        app.logger.exception("Evidence download error")
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if cur: cur.close()
        if conn and conn.is_connected(): conn.close()

@app.route("/api/evidence/<int:evidence_id>", methods=["DELETE"])
@roles_required(["Admin", "Investigator"])
def delete_evidence(evidence_id):
    user = get_current_user()
    current_uid = user["user_id"] if user else 1

    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(dictionary=True)

        cur.execute("SELECT evidence_name, file_path FROM evidence WHERE evidence_id = %s;", (evidence_id,))
        ev = cur.fetchone()
        if not ev:
            return jsonify({"status": "error", "message": "Evidence not found"}), 404

        # Clean up related records
        cur.execute("DELETE FROM caseevidence WHERE evidence_id = %s;", (evidence_id,))
        cur.execute("DELETE FROM custodylogs WHERE evidence_id = %s;", (evidence_id,))
        cur.execute("DELETE FROM analysisfindings WHERE evidence_id = %s;", (evidence_id,))
        cur.execute("DELETE FROM evidencenotes WHERE evidence_id = %s;", (evidence_id,))
        cur.execute("DELETE FROM evidence WHERE evidence_id = %s;", (evidence_id,))

        # Remove file from disk
        filename = os.path.basename(ev["file_path"])
        full_disk_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
        if os.path.exists(full_disk_path):
            try: os.remove(full_disk_path)
            except Exception: pass

        # Audit Log
        cur.execute("""
            INSERT INTO auditlogs (user_id, action, entity_type, entity_id, details)
            VALUES (%s, 'DELETE', 'Evidence', %s, %s);
        """, (current_uid, evidence_id, f"Deleted evidence #{evidence_id}: {ev['evidence_name']}"))

        conn.commit()
        return jsonify({"status": "success", "message": f"Evidence #{evidence_id} deleted successfully"})
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if cur: cur.close()
        if conn and conn.is_connected(): conn.close()

# =====================================================================
# INVESTIGATION TASKS API
# =====================================================================

@app.route("/api/tasks", methods=["GET"])
def list_tasks():
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(dictionary=True)

        query = """
            SELECT 
                t.task_id, t.case_id, c.title AS case_title,
                t.task_title, t.description, t.due_date, t.status, t.created_at,
                GROUP_CONCAT(u.name SEPARATOR ', ') AS assigned_users,
                GROUP_CONCAT(u.user_id) AS assigned_user_ids
            FROM investigationtasks t
            INNER JOIN cases c ON t.case_id = c.case_id
            LEFT JOIN taskassignments ta ON t.task_id = ta.task_id
            LEFT JOIN users u ON ta.user_id = u.user_id
            GROUP BY t.task_id, t.case_id, c.title, t.task_title, t.description, t.due_date, t.status, t.created_at
            ORDER BY t.created_at DESC, t.task_id DESC;
        """
        cur.execute(query)
        raw_tasks = cur.fetchall()
        tasks = []
        for tr in raw_tasks:
            formatted_t = format_row(tr)
            u_names = [n.strip() for n in (formatted_t.get("assigned_users") or "").split(",") if n.strip()]
            u_ids = [int(i.strip()) for i in (formatted_t.get("assigned_user_ids") or "").split(",") if i.strip()]
            formatted_t["assignees"] = [{"user_id": uid, "name": uname} for uid, uname in zip(u_ids, u_names)]
            tasks.append(formatted_t)
        return jsonify({"status": "success", "tasks": tasks})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if cur: cur.close()
        if conn and conn.is_connected(): conn.close()

@app.route("/api/tasks", methods=["POST"])
@roles_required(["Admin", "Investigator"])
def create_task():
    data = request.get_json() or {}
    case_id = data.get("case_id")
    task_title = (data.get("task_title") or "").strip()
    description = data.get("description", "")
    due_date = data.get("due_date") or None
    status = data.get("status", "Pending")
    user_ids = data.get("user_ids") or data.get("assigned_user_ids") or []
    if isinstance(user_ids, (int, str)):
        user_ids = [user_ids]

    user = get_current_user()
    current_uid = user["user_id"] if user else 1

    if not case_id or not task_title:
        return jsonify({"status": "error", "message": "Case ID and Task Title are required"}), 400

    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        # Insert Task
        cur.execute("""
            INSERT INTO investigationtasks (case_id, task_title, description, due_date, status)
            VALUES (%s, %s, %s, %s, %s);
        """, (case_id, task_title, description, due_date, status))
        task_id = cur.lastrowid

        # Insert User Assignments (M:N TaskAssignments)
        for uid in user_ids:
            cur.execute("""
                INSERT IGNORE INTO taskassignments (task_id, user_id, assigned_at, assignment_status)
                VALUES (%s, %s, NOW(), 'Assigned');
            """, (task_id, int(uid)))

        # Audit Log
        cur.execute("""
            INSERT INTO auditlogs (user_id, action, entity_type, entity_id, details)
            VALUES (%s, 'CREATE', 'Task', %s, %s);
        """, (current_uid, task_id, f"Created task: {task_title}"))

        conn.commit()
        return jsonify({"status": "success", "message": "Task created successfully", "task_id": task_id}), 201
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if cur: cur.close()
        if conn and conn.is_connected(): conn.close()

@app.route("/api/tasks/<int:task_id>/status", methods=["PUT"])
@roles_required(["Admin", "Investigator"])
def update_task_status_endpoint(task_id):
    data = request.get_json() or {}
    new_status = data.get("status")

    user = get_current_user()
    user_id = user["user_id"] if user else (data.get("user_id") or 1)

    if not new_status:
        return jsonify({"status": "error", "message": "New status is required"}), 400

    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        # Call stored procedure sp_update_task_status!
        args = (task_id, new_status, int(user_id), 0, "")
        result_args = cur.callproc("sp_update_task_status", args)
        rows_affected = result_args[3]
        status_msg = result_args[4]

        conn.commit()

        if rows_affected == 0 and "ERROR" in status_msg:
            return jsonify({"status": "error", "message": status_msg}), 400

        return jsonify({"status": "success", "message": status_msg})
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if cur: cur.close()
        if conn and conn.is_connected(): conn.close()

# =====================================================================
# ANALYSIS FINDINGS API
# =====================================================================

@app.route("/api/findings", methods=["GET"])
def list_findings():
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(dictionary=True)

        query = """
            SELECT 
                af.finding_id, af.evidence_id, af.finding_type, af.severity, af.description, af.created_at,
                e.evidence_name, e.evidence_type,
                GROUP_CONCAT(DISTINCT CONCAT('#', c.case_id, ' ', c.title) SEPARATOR ', ') AS case_context
            FROM analysisfindings af
            INNER JOIN evidence e ON af.evidence_id = e.evidence_id
            LEFT JOIN caseevidence ce ON e.evidence_id = ce.evidence_id
            LEFT JOIN cases c ON ce.case_id = c.case_id
            GROUP BY af.finding_id, af.evidence_id, af.finding_type, af.severity, af.description, af.created_at,
                     e.evidence_name, e.evidence_type
            ORDER BY FIELD(af.severity, 'Critical', 'High', 'Medium', 'Low'), af.created_at DESC;
        """
        cur.execute(query)
        findings = [format_row(r) for r in cur.fetchall()]
        return jsonify({"status": "success", "findings": findings})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if cur: cur.close()
        if conn and conn.is_connected(): conn.close()

@app.route("/api/findings", methods=["POST"])
@roles_required(["Admin", "Investigator"])
def create_finding():
    data = request.get_json() or {}
    evidence_id = data.get("evidence_id")
    finding_type = (data.get("finding_type") or "").strip()
    severity = data.get("severity", "Low")
    description = (data.get("description") or "").strip()

    if not evidence_id or not finding_type or not description:
        return jsonify({"status": "error", "message": "Evidence ID, Finding Type, and Description are required"}), 400

    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        # Insert Finding (Fires database trigger trg_after_finding_insert automatically!)
        cur.execute("""
            INSERT INTO analysisfindings (evidence_id, finding_type, severity, description)
            VALUES (%s, %s, %s, %s);
        """, (int(evidence_id), finding_type, severity, description))
        finding_id = cur.lastrowid
        conn.commit()

        return jsonify({
            "status": "success",
            "message": "Analysis finding recorded (audit logged via trigger)",
            "finding_id": finding_id
        }), 201
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if cur: cur.close()
        if conn and conn.is_connected(): conn.close()

# =====================================================================
# CHAIN OF CUSTODY API
# =====================================================================

@app.route("/api/custody-logs", methods=["GET"])
def list_custody_logs():
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(dictionary=True)

        query = """
            SELECT 
                cl.log_id, cl.evidence_id, cl.user_id, cl.action, cl.notes,
                cl.event_time, cl.event_time AS timestamp, cl.event_time AS created_at,
                e.evidence_name, e.evidence_type, e.sha256_hash,
                u.name AS responsible_user_name, u.name AS user_name, u.role AS user_role
            FROM custodylogs cl
            INNER JOIN evidence e ON cl.evidence_id = e.evidence_id
            INNER JOIN users u ON cl.user_id = u.user_id
            ORDER BY cl.event_time DESC, cl.log_id DESC;
        """
        cur.execute(query)
        logs = [format_row(r) for r in cur.fetchall()]
        return jsonify({"status": "success", "custody_logs": logs})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if cur: cur.close()
        if conn and conn.is_connected(): conn.close()

@app.route("/api/custody-logs", methods=["POST"])
@roles_required(["Admin", "Investigator"])
def add_custody_log():
    data = request.get_json() or {}
    evidence_id = data.get("evidence_id")
    action = (data.get("action") or "").strip()
    notes = data.get("notes", "")

    user = get_current_user()
    user_id = data.get("user_id") or (user["user_id"] if user else 1)

    if not evidence_id or not action:
        return jsonify({"status": "error", "message": "Evidence ID and Action are required"}), 400

    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        # Insert CustodyLog (Fires database trigger trg_after_custody_insert automatically!)
        cur.execute("""
            INSERT INTO custodylogs (evidence_id, user_id, action, notes)
            VALUES (%s, %s, %s, %s);
        """, (int(evidence_id), int(user_id), action, notes))
        log_id = cur.lastrowid
        conn.commit()

        return jsonify({
            "status": "success",
            "message": "Custody activity logged (audit logged via trigger)",
            "log_id": log_id
        }), 201
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if cur: cur.close()
        if conn and conn.is_connected(): conn.close()

# =====================================================================
# EVIDENCE NOTES API
# =====================================================================

@app.route("/api/evidence-notes", methods=["GET"])
def list_notes():
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(dictionary=True)

        query = """
            SELECT 
                en.note_id, en.evidence_id, en.user_id, en.note_text, en.created_at,
                e.evidence_name,
                u.name AS author_name, u.name AS user_name,
                u.role AS author_role, u.role AS user_role
            FROM evidencenotes en
            INNER JOIN evidence e ON en.evidence_id = e.evidence_id
            INNER JOIN users u ON en.user_id = u.user_id
            ORDER BY en.created_at DESC, en.note_id DESC;
        """
        cur.execute(query)
        notes = [format_row(r) for r in cur.fetchall()]
        return jsonify({"status": "success", "notes": notes})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if cur: cur.close()
        if conn and conn.is_connected(): conn.close()

@app.route("/api/evidence-notes", methods=["POST"])
@roles_required(["Admin", "Investigator"])
def add_note():
    data = request.get_json() or {}
    evidence_id = data.get("evidence_id")
    note_text = (data.get("note_text") or "").strip()

    user = get_current_user()
    user_id = data.get("user_id") or (user["user_id"] if user else 1)

    if not evidence_id or not note_text:
        return jsonify({"status": "error", "message": "Evidence ID and Note Text are required"}), 400

    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("""
            INSERT INTO evidencenotes (evidence_id, user_id, note_text)
            VALUES (%s, %s, %s);
        """, (int(evidence_id), int(user_id), note_text))
        note_id = cur.lastrowid

        # Audit log
        cur.execute("""
            INSERT INTO auditlogs (user_id, action, entity_type, entity_id, details)
            VALUES (%s, 'ADD_NOTE', 'Evidence', %s, 'Added technical evidence note');
        """, (int(user_id), int(evidence_id)))

        conn.commit()
        return jsonify({"status": "success", "message": "Note added successfully", "note_id": note_id}), 201
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if cur: cur.close()
        if conn and conn.is_connected(): conn.close()

# =====================================================================
# AUDIT LOGS API
# =====================================================================

@app.route("/api/audit-logs", methods=["GET"])
def list_audit_logs():
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(dictionary=True)

        query = """
            SELECT 
                a.audit_id, a.audit_id AS log_id,
                a.user_id, a.action,
                a.entity_type, a.entity_type AS table_name,
                a.entity_id, a.entity_id AS record_id,
                a.details, a.details AS change_description,
                a.created_at, a.created_at AS timestamp,
                COALESCE(u.name, 'System / DB Trigger') AS user_name,
                COALESCE(u.role, 'System') AS user_role
            FROM auditlogs a
            LEFT JOIN users u ON a.user_id = u.user_id
            ORDER BY a.created_at DESC, a.audit_id DESC;
        """
        cur.execute(query)
        logs = [format_row(r) for r in cur.fetchall()]
        return jsonify({"status": "success", "audit_logs": logs})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if cur: cur.close()
        if conn and conn.is_connected(): conn.close()

# =====================================================================
# REPORTS API (RELATIONAL VIEWS & AGGREGATES)
# =====================================================================

@app.route("/api/reports", methods=["GET"])
def get_reports():
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(dictionary=True)

        # 1. Query View: vw_case_evidence_summary enriched with task and finding metrics
        cur.execute("""
            SELECT 
                v.case_id,
                v.case_title,
                v.incident_type,
                v.priority,
                v.case_status,
                v.case_status AS status,
                v.creator_name,
                v.total_evidence_items,
                v.total_evidence_items AS evidence_count,
                v.total_evidence_size_kb,
                v.created_at,
                COUNT(DISTINCT t.task_id) AS active_tasks_count,
                COUNT(DISTINCT CASE WHEN af.severity IN ('High', 'Critical') THEN af.finding_id END) AS high_findings_count
            FROM vw_case_evidence_summary v
            LEFT JOIN investigationtasks t ON v.case_id = t.case_id AND t.status != 'Completed'
            LEFT JOIN caseevidence ce ON v.case_id = ce.case_id
            LEFT JOIN analysisfindings af ON ce.evidence_id = af.evidence_id
            GROUP BY v.case_id, v.case_title, v.incident_type, v.priority, v.case_status, v.creator_name, v.total_evidence_items, v.total_evidence_size_kb, v.created_at
            ORDER BY v.case_id ASC;
        """)
        case_summary = [format_row(r) for r in cur.fetchall()]

        # 2. Query View: vw_high_severity_findings
        cur.execute("SELECT * FROM vw_high_severity_findings ORDER BY FIELD(severity, 'Critical', 'High');")
        high_findings = [format_row(r) for r in cur.fetchall()]

        # 3. Query View: vw_investigation_task_assignments
        cur.execute("SELECT * FROM vw_investigation_task_assignments ORDER BY task_id ASC;")
        task_assignments_view = [format_row(r) for r in cur.fetchall()]

        # 4. Tasks distribution by status
        cur.execute("""
            SELECT status, COUNT(*) AS count
            FROM investigationtasks
            GROUP BY status
            ORDER BY count DESC;
        """)
        tasks_by_status = [format_row(r) for r in cur.fetchall()]

        # 5. Findings count by severity
        cur.execute("""
            SELECT severity, COUNT(*) AS count
            FROM analysisfindings
            GROUP BY severity
            ORDER BY FIELD(severity, 'Critical', 'High', 'Medium', 'Low');
        """)
        findings_by_severity = [format_row(r) for r in cur.fetchall()]

        # 6. Custody activity by user
        cur.execute("""
            SELECT 
                u.user_id, u.name AS user_name, u.role,
                COUNT(cl.log_id) AS activity_count
            FROM users u
            LEFT JOIN custodylogs cl ON u.user_id = cl.user_id
            GROUP BY u.user_id, u.name, u.role
            ORDER BY activity_count DESC;
        """)
        custody_by_user = [format_row(r) for r in cur.fetchall()]

        # 7. Overall storage aggregate
        cur.execute("""
            SELECT 
                COUNT(*) AS total_evidence_items,
                COALESCE(SUM(file_size), 0) AS total_file_size_bytes,
                COALESCE(ROUND(SUM(file_size) / 1024, 2), 0) AS total_size_kb,
                COALESCE(ROUND(AVG(file_size), 2), 0) AS avg_file_size_bytes
            FROM evidence;
        """)
        storage_stats = format_row(cur.fetchone())

        return jsonify({
            "status": "success",
            "case_evidence_summary": case_summary,
            "high_severity_findings": high_findings,
            "task_assignments_view": task_assignments_view,
            "tasks_by_status": tasks_by_status,
            "findings_by_severity": findings_by_severity,
            "custody_by_user": custody_by_user,
            "storage_stats": storage_stats
        })
    except Exception as e:
        app.logger.exception("Reports generation error")
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if cur: cur.close()
        if conn and conn.is_connected(): conn.close()

# =====================================================================
# ADMIN CONTROL CENTER & DATABASE EXPLORER API
# =====================================================================

ALLOWED_ADMIN_TABLES = [
    "users", "cases", "evidence", "caseevidence", "custodylogs",
    "analysisfindings", "investigationtasks", "taskassignments",
    "evidencenotes", "auditlogs"
]

@app.route("/api/admin/database", methods=["GET"])
@roles_required(["Admin"])
def admin_database_overview():
    """Retrieve full database metadata, base tables, views, and row statistics."""
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(dictionary=True)

        # Introspect table sizes and row counts
        cur.execute("""
            SELECT 
                TABLE_NAME AS table_name,
                TABLE_ROWS AS est_rows,
                ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024, 2) AS size_kb,
                ENGINE AS engine,
                TABLE_COLLATION AS collation
            FROM information_schema.TABLES
            WHERE TABLE_SCHEMA = 'forensight' AND TABLE_TYPE = 'BASE TABLE'
            ORDER BY TABLE_NAME ASC;
        """)
        raw_tables = cur.fetchall()

        tables_data = []
        for t in raw_tables:
            t_name = t["table_name"]
            # Exact count
            cur.execute(f"SELECT COUNT(*) AS exact_cnt FROM `{t_name}`;")
            exact_cnt = cur.fetchone()["exact_cnt"]
            tables_data.append({
                "name": t_name,
                "table_name": t_name,
                "row_count": exact_cnt,
                "exact_rows": exact_cnt,
                "size_kb": float(t["size_kb"] or 0),
                "engine": t["engine"],
                "collation": t["collation"]
            })

        # Views
        cur.execute("""
            SELECT TABLE_NAME AS view_name
            FROM information_schema.VIEWS
            WHERE TABLE_SCHEMA = 'forensight'
            ORDER BY TABLE_NAME ASC;
        """)
        views_data = [r["view_name"] for r in cur.fetchall()]

        # Foreign Key summary
        cur.execute("""
            SELECT 
                TABLE_NAME AS table_name,
                COLUMN_NAME AS column_name,
                CONSTRAINT_NAME AS constraint_name,
                REFERENCED_TABLE_NAME AS referenced_table,
                REFERENCED_COLUMN_NAME AS referenced_column
            FROM information_schema.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = 'forensight' AND REFERENCED_TABLE_NAME IS NOT NULL
            ORDER BY TABLE_NAME, CONSTRAINT_NAME;
        """)
        fks_raw = cur.fetchall()
        fks_formatted = []
        for fk in fks_raw:
            fks_formatted.append({
                "table_name": fk["table_name"],
                "column_name": fk["column_name"],
                "constraint_name": fk["constraint_name"],
                "referenced_table": fk["referenced_table"],
                "referenced_table_name": fk["referenced_table"],
                "referenced_column": fk["referenced_column"],
                "referenced_column_name": fk["referenced_column"]
            })

        return jsonify({
            "status": "success",
            "database_name": "forensight",
            "tables_count": len(tables_data),
            "tables": tables_data,
            "views_count": len(views_data),
            "views": views_data,
            "foreign_keys_count": len(fks_formatted),
            "foreign_keys": fks_formatted
        })
    except Exception as e:
        app.logger.exception("Admin DB overview error")
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if cur: cur.close()
        if conn and conn.is_connected(): conn.close()

@app.route("/api/admin/database/tables/<table_name>", methods=["GET"])
@roles_required(["Admin"])
def admin_table_details(table_name):
    """Retrieve column schema, foreign keys, and paginated rows for a specific table."""
    table_name = table_name.lower().strip()
    if table_name not in ALLOWED_ADMIN_TABLES:
        return jsonify({"status": "error", "message": f"Table '{table_name}' is not in permitted catalog"}), 400

    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(dictionary=True)

        # Columns
        cur.execute("""
            SELECT 
                COLUMN_NAME AS column_name,
                COLUMN_TYPE AS data_type,
                IS_NULLABLE AS is_nullable,
                COLUMN_KEY AS column_key,
                COLUMN_DEFAULT AS default_value,
                EXTRA AS extra
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = 'forensight' AND TABLE_NAME = %s
            ORDER BY ORDINAL_POSITION ASC;
        """, (table_name,))
        columns_raw = cur.fetchall()
        columns_formatted = []
        for c in columns_raw:
            columns_formatted.append({
                "name": c["column_name"],
                "column_name": c["column_name"],
                "type": c["data_type"],
                "data_type": c["data_type"],
                "nullable": c["is_nullable"],
                "is_nullable": c["is_nullable"],
                "key": c["column_key"],
                "column_key": c["column_key"],
                "default": c["default_value"],
                "default_value": c["default_value"],
                "extra": c["extra"]
            })

        # Foreign keys for this table
        cur.execute("""
            SELECT 
                COLUMN_NAME AS column_name,
                CONSTRAINT_NAME AS constraint_name,
                REFERENCED_TABLE_NAME AS referenced_table,
                REFERENCED_COLUMN_NAME AS referenced_column
            FROM information_schema.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = 'forensight' AND TABLE_NAME = %s AND REFERENCED_TABLE_NAME IS NOT NULL;
        """, (table_name,))
        fks_raw = cur.fetchall()
        fks_formatted = []
        for fk in fks_raw:
            fks_formatted.append({
                "column_name": fk["column_name"],
                "constraint_name": fk["constraint_name"],
                "referenced_table": fk["referenced_table"],
                "referenced_table_name": fk["referenced_table"],
                "referenced_column": fk["referenced_column"],
                "referenced_column_name": fk["referenced_column"]
            })

        # Total rows
        cur.execute(f"SELECT COUNT(*) AS total FROM `{table_name}`;")
        total_rows = cur.fetchone()["total"]

        # Paginated rows
        page = max(1, int(request.args.get("page", 1)))
        limit = min(100, max(1, int(request.args.get("limit", 25))))
        offset = (page - 1) * limit

        cur.execute(f"SELECT * FROM `{table_name}` LIMIT %s OFFSET %s;", (limit, offset))
        raw_rows = cur.fetchall()

        sanitized_rows = []
        for r in raw_rows:
            formatted = format_row(r)
            if "password_hash" in formatted:
                formatted["password_hash"] = "[PROTECTED_CRYPTOGRAPHIC_HASH]"
            sanitized_rows.append(formatted)

        return jsonify({
            "status": "success",
            "table_name": table_name,
            "columns": columns_formatted,
            "foreign_keys": fks_formatted,
            "total_rows": total_rows,
            "page": page,
            "limit": limit,
            "rows": sanitized_rows
        })
    except Exception as e:
        app.logger.exception(f"Admin table details error for {table_name}")
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if cur: cur.close()
        if conn and conn.is_connected(): conn.close()

@app.route("/api/admin/users", methods=["GET"])
@roles_required(["Admin"])
def admin_list_users():
    """Admin user management with activity telemetry."""
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(dictionary=True)

        query = """
            SELECT 
                u.user_id, u.name, u.email, u.role, u.created_at,
                COUNT(DISTINCT c.case_id) AS cases_created_count,
                COUNT(DISTINCT ta.task_id) AS tasks_assigned_count,
                COUNT(DISTINCT cl.log_id) AS custody_actions_count
            FROM users u
            LEFT JOIN cases c ON u.user_id = c.created_by
            LEFT JOIN taskassignments ta ON u.user_id = ta.user_id
            LEFT JOIN custodylogs cl ON u.user_id = cl.user_id
            GROUP BY u.user_id, u.name, u.email, u.role, u.created_at
            ORDER BY u.user_id ASC;
        """
        cur.execute(query)
        users = [format_row(r) for r in cur.fetchall()]
        return jsonify({"status": "success", "users": users})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if cur: cur.close()
        if conn and conn.is_connected(): conn.close()

@app.route("/api/admin/users/<int:user_id>/role", methods=["PUT"])
@roles_required(["Admin"])
def admin_update_user_role(user_id):
    data = request.get_json() or {}
    new_role = data.get("role")

    if new_role not in ["Admin", "Investigator", "Viewer"]:
        return jsonify({"status": "error", "message": "Invalid role value. Must be Admin, Investigator, or Viewer"}), 400

    admin = get_current_user()
    admin_uid = admin["user_id"] if admin else 1

    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("UPDATE users SET role = %s WHERE user_id = %s;", (new_role, user_id))
        if cur.rowcount == 0:
            return jsonify({"status": "error", "message": "User not found or unchanged"}), 404

        cur.execute("""
            INSERT INTO auditlogs (user_id, action, entity_type, entity_id, details)
            VALUES (%s, 'ROLE_CHANGE', 'User', %s, %s);
        """, (admin_uid, user_id, f"Changed user #{user_id} role to '{new_role}'"))

        conn.commit()
        return jsonify({"status": "success", "message": f"User role updated to '{new_role}'"})
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if cur: cur.close()
        if conn and conn.is_connected(): conn.close()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
