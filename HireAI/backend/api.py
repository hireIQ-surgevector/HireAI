import re
from datetime import datetime
from flask import Blueprint, request, jsonify
from config.db import get_connection
from flask_bcrypt import Bcrypt
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity

# Single API Blueprint
api = Blueprint('api', __name__)
bcrypt = Bcrypt()


# ==========================================
# HELPER FUNCTIONS
# ==========================================

def normalize_role_name(role_name):
    role_name = (role_name or '').strip().lower()
    if role_name in {'employer', 'manager'}:
        return 'manager'
    return role_name or 'candidate'


def user_permissions(role_name):
    normalized = normalize_role_name(role_name)
    is_manager = normalized in {'manager'}
    return {
        'is_manager': is_manager,
        'can_view_sensitive_info': is_manager,
        'can_manage_jobs': is_manager,
        'can_manage_candidates': is_manager,
        'can_schedule_interviews': is_manager,
        'can_view_offers': is_manager,
        'can_access_settings': is_manager,
        'can_join_interviews': True,
    }


def has_password_change_column(cursor):
    cursor.execute("""
        SELECT COUNT(*)
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'password_change_required'
    """)
    return cursor.fetchone()[0] > 0


def has_column(cursor, table_name, column_name):
    cursor.execute("""
        SELECT COUNT(*)
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = ? AND COLUMN_NAME = ?
    """, (table_name, column_name))
    return cursor.fetchone()[0] > 0


def get_candidate_select_clause(cursor):
    columns = [
        'candidate_id', 'full_name', 'email', 'phone', 'current_role', 'applied_role', 'location',
        'experience_years', 'current_ctc', 'current_status', 'ai_score', 'created_at'
    ]
    if has_column(cursor, 'Candidates', 'notice_period'):
        columns.append('notice_period')
    if has_column(cursor, 'Candidates', 'skills'):
        columns.append('skills')
    if has_column(cursor, 'Candidates', 'interview_notes'):
        columns.append('interview_notes')
    return ', '.join(columns)


def normalize_candidate_stage(stage_value):
    stage = (stage_value or '').strip()
    if not stage:
        return 'Shortlisted'
    lowered = stage.lower()
    if lowered in {'applied', 'screening', 'screened'}:
        return 'Shortlisted'
    return stage


def get_candidate_stage_transition(current_stage, action):
    normalized_stage = normalize_candidate_stage(current_stage)
    action_name = (action or '').strip().lower()

    if action_name == 'shortlist':
        return 'Shortlisted'
    if action_name == 'schedule':
        return 'L1 Interview' if normalized_stage != 'L1 Interview' else normalized_stage
    if action_name == 'l2':
        return 'L2 Interview'
    if action_name == 'client':
        return 'Client Interview'
    if action_name == 'offer':
        return 'Offer Sent'
    if action_name == 'reject':
        return 'Rejected'
    return normalized_stage


def build_candidate_payload(row):
    raw_skills = getattr(row, 'skills', None)
    if isinstance(raw_skills, (list, tuple)):
        skills = [str(item).strip() for item in raw_skills if str(item).strip()]
    elif raw_skills:
        skills = [item.strip() for item in str(raw_skills).split(';') if item.strip()]
    else:
        skills = []

    normalized_stage = normalize_candidate_stage(getattr(row, 'current_status', None))
    status_value = normalized_stage.lower().replace(' ', '-') if normalized_stage else 'active'
    if normalized_stage.lower() == 'offer sent':
        status_value = 'offered'
    elif normalized_stage.lower() == 'rejected':
        status_value = 'rejected'

    # Process notice period to append 'days' if numeric data is found, otherwise fallback to 'N/A'
    raw_notice = getattr(row, 'notice_period', None)
    notice_str = str(raw_notice).strip() if raw_notice is not None else ''
    match = re.search(r'\d+', notice_str)
    
    if match:
        notice_period = f"{match.group()} days"
    else:
        notice_period = 'N/A'

    return {
        'candidate_id': row.candidate_id,
        'name': row.full_name,
        'role': row.applied_role,
        'current_role': row.current_role,
        'location': row.location,
        'experience': f"{row.experience_years} yrs" if row.experience_years is not None else 'N/A',
        'stage': normalized_stage,
        'status': status_value,
        'score': row.ai_score or 0,
        'applied': row.created_at.strftime('%b %d') if getattr(row, 'created_at', None) else '',
        'email': row.email,
        'phone': row.phone,
        'current_ctc': row.current_ctc,
        'notice_period': notice_period,
        'skills': skills,
        'interview_notes': getattr(row, 'interview_notes', None) or '',
    }

# def ensure_schema():
#     conn = get_connection()
#     cursor = conn.cursor()

#     cursor.execute("""
#         IF OBJECT_ID('dbo.Roles', 'U') IS NULL
#         CREATE TABLE dbo.Roles (
#             role_id INT IDENTITY(1,1) PRIMARY KEY,
#             role_name NVARCHAR(50) NOT NULL UNIQUE,
#             description NVARCHAR(200) NULL,
#             created_at DATETIME2 DEFAULT GETDATE()
#         )
#     """)

#     cursor.execute("""
#         IF OBJECT_ID('dbo.Users', 'U') IS NULL
#         CREATE TABLE dbo.Users (
#             user_id INT IDENTITY(1,1) PRIMARY KEY,
#             full_name NVARCHAR(150) NOT NULL,
#             email NVARCHAR(150) NOT NULL UNIQUE,
#             password_hash NVARCHAR(300) NOT NULL,
#             role_id INT NOT NULL,
#             company_name NVARCHAR(150) NULL,
#             is_active BIT NOT NULL DEFAULT 1,
#             password_change_required BIT NOT NULL DEFAULT 0,
#             created_at DATETIME2 DEFAULT GETDATE()
#         )
#     """)

#     cursor.execute("""
#         IF OBJECT_ID('dbo.Jobs', 'U') IS NULL
#         CREATE TABLE dbo.Jobs (
#             job_id INT IDENTITY(1,1) PRIMARY KEY,
#             title NVARCHAR(200) NOT NULL,
#             department NVARCHAR(150) NULL,
#             location NVARCHAR(150) NULL,
#             description NVARCHAR(MAX) NOT NULL,
#             mandatory_skills NVARCHAR(MAX) NULL,
#             required_skills NVARCHAR(MAX) NULL,
#             min_exp INT NULL,
#             min_salary DECIMAL(12,2) NULL,
#             max_salary DECIMAL(12,2) NULL,
#             due_date DATE NULL,
#             interview_mode NVARCHAR(150) NULL,
#             created_by INT NULL,
#             created_at DATETIME2 DEFAULT GETDATE()
#         )
#     """)

#     cursor.execute("""
#         IF OBJECT_ID('dbo.Candidates', 'U') IS NULL
#         CREATE TABLE dbo.Candidates (
#             candidate_id INT IDENTITY(1,1) PRIMARY KEY,
#             full_name NVARCHAR(150) NOT NULL,
#             email NVARCHAR(150) NULL,
#             phone NVARCHAR(50) NULL,
#             current_role NVARCHAR(150) NULL,
#             applied_role NVARCHAR(150) NULL,
#             location NVARCHAR(150) NULL,
#             experience_years INT NULL,
#             current_ctc NVARCHAR(50) NULL,
#             current_status NVARCHAR(50) NOT NULL DEFAULT 'Applied',
#             ai_score INT NULL,
#             job_id INT NULL,
#             created_at DATETIME2 DEFAULT GETDATE()
#         )
#     """)

#     cursor.execute("""
#         IF COL_LENGTH('dbo.Candidates', 'notice_period') IS NULL
#         ALTER TABLE dbo.Candidates ADD notice_period NVARCHAR(100) NULL
#     """)
#     cursor.execute("""
#         IF COL_LENGTH('dbo.Candidates', 'skills') IS NULL
#         ALTER TABLE dbo.Candidates ADD skills NVARCHAR(MAX) NULL
#     """)
#     cursor.execute("""
#         IF COL_LENGTH('dbo.Candidates', 'interview_notes') IS NULL
#         ALTER TABLE dbo.Candidates ADD interview_notes NVARCHAR(MAX) NULL
#     """)

#     cursor.execute("""
#         IF OBJECT_ID('dbo.Interviews', 'U') IS NULL
#         CREATE TABLE dbo.Interviews (
#             interview_id INT IDENTITY(1,1) PRIMARY KEY,
#             candidate_id INT NOT NULL,
#             job_id INT NULL,
#             interviewer_id INT NULL,
#             interview_round NVARCHAR(100) NULL,
#             scheduled_at DATETIME2 NULL,
#             status NVARCHAR(50) NOT NULL DEFAULT 'Scheduled',
#             notes NVARCHAR(MAX) NULL,
#             created_at DATETIME2 DEFAULT GETDATE()
#         )
#     """)

#     conn.commit()

#     cursor.execute('SELECT COUNT(*) FROM dbo.Roles')
#     role_count = cursor.fetchone()[0]
#     if role_count == 0:
#         cursor.execute("INSERT INTO dbo.Roles (role_name, description) VALUES (?, ?)", ('manager', 'Hiring manager'))
#         cursor.execute("INSERT INTO dbo.Roles (role_name, description) VALUES (?, ?)", ('interviewer', 'Interview panel member'))
#         cursor.execute("INSERT INTO dbo.Roles (role_name, description) VALUES (?, ?)", ('candidate', 'Candidate'))
#         conn.commit()

#     cursor.execute('SELECT COUNT(*) FROM dbo.Users')
#     user_count = cursor.fetchone()[0]
#     if user_count == 0:
#         manager_role_id = cursor.execute("SELECT role_id FROM dbo.Roles WHERE role_name = ?", ('manager',)).fetchone()[0]
#         interviewer_role_id = cursor.execute("SELECT role_id FROM dbo.Roles WHERE role_name = ?", ('interviewer',)).fetchone()[0]
#         manager_password = bcrypt.generate_password_hash('Test@1234').decode('utf-8')
#         interviewer_password = bcrypt.generate_password_hash('Test@1234').decode('utf-8')
#         cursor.execute(
#             "INSERT INTO dbo.Users (full_name, email, password_hash, role_id, company_name, is_active, password_change_required) VALUES (?, ?, ?, ?, ?, 1, 0)",
#             ('James Anderson', 'james@gmail.com', manager_password, manager_role_id, 'TalentSync')
#         )
#         cursor.execute(
#             "INSERT INTO dbo.Users (full_name, email, password_hash, role_id, company_name, is_active, password_change_required) VALUES (?, ?, ?, ?, ?, 1, 0)",
#             ('Mina Rao', 'interviewer@hireai.com', interviewer_password, interviewer_role_id, 'TalentSync')
#         )
#         conn.commit()

#     cursor.execute('SELECT COUNT(*) FROM dbo.Jobs')
#     if cursor.fetchone()[0] == 0:
#         cursor.execute("""
#             INSERT INTO dbo.Jobs (title, department, location, description, mandatory_skills, required_skills, min_exp, min_salary, max_salary, due_date, interview_mode, created_by)
#             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
#         """, ('Senior Frontend Developer', 'Engineering', 'Bangalore', 'Build reusable frontend experiences for the product team.', 'React, TypeScript, UI design', 'Next.js, Node.js', 4, 2400000, 3200000, '2026-09-15', 'Video Interview (IncVid)', 1))
#         cursor.execute("""
#             INSERT INTO dbo.Jobs (title, department, location, description, mandatory_skills, required_skills, min_exp, min_salary, max_salary, due_date, interview_mode, created_by)
#             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
#         """, ('Data Scientist', 'Data', 'Hyderabad', 'Drive experimentation and insight reporting for hiring analytics.', 'Python, SQL, ML', 'Statistics, A/B testing', 3, 2200000, 2800000, '2026-09-20', 'Video Interview (IncVid)', 1))
#         conn.commit()

#     cursor.execute('SELECT COUNT(*) FROM dbo.Candidates')
#     if cursor.fetchone()[0] == 0:
#         cursor.execute("""
#             INSERT INTO dbo.Candidates (full_name, email, phone, current_role, applied_role, location, experience_years, current_ctc, current_status, ai_score, job_id)
#             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
#         """, ('Priya Sharma', 'priya@example.com', '+91 98765 43210', 'Frontend Engineer', 'Senior Frontend Developer', 'Bangalore', 4, '₹12 LPA', 'L2 Interview', 87, 1))
#         cursor.execute("""
#             INSERT INTO dbo.Candidates (full_name, email, phone, current_role, applied_role, location, experience_years, current_ctc, current_status, ai_score, job_id)
#             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
#         """, ('Rahul Kumar', 'rahul@example.com', '+91 91234 56789', 'DevOps Engineer', 'Data Scientist', 'Hyderabad', 6, '₹18 LPA', 'Offer Sent', 91, 2))
#         cursor.execute("""
#             INSERT INTO dbo.Candidates (full_name, email, phone, current_role, applied_role, location, experience_years, current_ctc, current_status, ai_score, job_id)
#             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
#         """, ('Amit Singh', 'amit@example.com', '+91 99887 77665', 'Backend Engineer', 'Senior Frontend Developer', 'Pune', 3, '₹9 LPA', 'Screening', 73, 1))
#         conn.commit()

#     cursor.execute('SELECT COUNT(*) FROM dbo.Interviews')
#     if cursor.fetchone()[0] == 0:
#         cursor.execute("""
#             INSERT INTO dbo.Interviews (candidate_id, job_id, interviewer_id, interview_round, scheduled_at, status, notes)
#             VALUES (?, ?, ?, ?, ?, ?, ?)
#         """, (1, 1, 2, 'L2 Technical', datetime(2026, 8, 6, 10, 0, 0), 'Scheduled', 'Focus on system design and frontend architecture.'))
#         cursor.execute("""
#             INSERT INTO dbo.Interviews (candidate_id, job_id, interviewer_id, interview_round, scheduled_at, status, notes)
#             VALUES (?, ?, ?, ?, ?, ?, ?)
#         """, (2, 2, 2, 'L1 Technical', datetime(2026, 8, 7, 11, 30, 0), 'Scheduled', 'Discuss experimentation and SQL fluency.'))
#         conn.commit()

#     conn.close()

def ensure_schema():
    conn = get_connection()
    cursor = conn.cursor()

    # -----------------------------
    # Roles Table
    # -----------------------------
    cursor.execute("""
        IF OBJECT_ID('dbo.Roles', 'U') IS NULL
        CREATE TABLE dbo.Roles (
            role_id INT IDENTITY(1,1) PRIMARY KEY,
            role_name NVARCHAR(50) NOT NULL UNIQUE,
            description NVARCHAR(200) NULL,
            created_at DATETIME2 DEFAULT GETDATE()
        )
    """)

    # -----------------------------
    # Users Table
    # -----------------------------
    cursor.execute("""
        IF OBJECT_ID('dbo.Users', 'U') IS NULL
        CREATE TABLE dbo.Users (
            user_id INT IDENTITY(1,1) PRIMARY KEY,
            full_name NVARCHAR(150) NOT NULL,
            email NVARCHAR(150) NOT NULL UNIQUE,
            password_hash NVARCHAR(300) NOT NULL,
            role_id INT NOT NULL,
            company_name NVARCHAR(150) NULL,
            is_active BIT NOT NULL DEFAULT 1,
            password_change_required BIT NOT NULL DEFAULT 0,
            created_at DATETIME2 DEFAULT GETDATE()
        )
    """)

    # -----------------------------
    # Jobs Table
    # -----------------------------
    cursor.execute("""
        IF OBJECT_ID('dbo.Jobs', 'U') IS NULL
        CREATE TABLE dbo.Jobs (
            job_id INT IDENTITY(1,1) PRIMARY KEY,
            title NVARCHAR(200) NOT NULL,
            department NVARCHAR(150) NULL,
            location NVARCHAR(150) NULL,
            description NVARCHAR(MAX) NOT NULL,
            mandatory_skills NVARCHAR(MAX) NULL,
            required_skills NVARCHAR(MAX) NULL,
            min_exp INT NULL,
            min_salary DECIMAL(12,2) NULL,
            max_salary DECIMAL(12,2) NULL,
            due_date DATE NULL,
            interview_mode NVARCHAR(150) NULL,
            created_by INT NULL,
            created_at DATETIME2 DEFAULT GETDATE()
        )
    """)

    # -----------------------------
    # Candidates Table
    # -----------------------------
    cursor.execute("""
        IF OBJECT_ID('dbo.Candidates', 'U') IS NULL
        CREATE TABLE dbo.Candidates (
            candidate_id INT IDENTITY(1,1) PRIMARY KEY,
            full_name NVARCHAR(150) NOT NULL,
            email NVARCHAR(150) NULL,
            phone NVARCHAR(50) NULL,
            current_role NVARCHAR(150) NULL,
            applied_role NVARCHAR(150) NULL,
            location NVARCHAR(150) NULL,
            experience_years INT NULL,
            current_ctc NVARCHAR(50) NULL,
            current_status NVARCHAR(50) NOT NULL DEFAULT 'Applied',
            ai_score INT NULL,
            job_id INT NULL,
            created_at DATETIME2 DEFAULT GETDATE()
        )
    """)

    # -----------------------------
    # Add Missing Candidate Columns
    # -----------------------------
    cursor.execute("""
        IF COL_LENGTH('dbo.Candidates', 'notice_period') IS NULL
        ALTER TABLE dbo.Candidates
        ADD notice_period NVARCHAR(100) NULL
    """)

    cursor.execute("""
        IF COL_LENGTH('dbo.Candidates', 'skills') IS NULL
        ALTER TABLE dbo.Candidates
        ADD skills NVARCHAR(MAX) NULL
    """)

    cursor.execute("""
        IF COL_LENGTH('dbo.Candidates', 'interview_notes') IS NULL
        ALTER TABLE dbo.Candidates
        ADD interview_notes NVARCHAR(MAX) NULL
    """)

    # -----------------------------
    # Interviews Table
    # -----------------------------
    cursor.execute("""
        IF OBJECT_ID('dbo.Interviews', 'U') IS NULL
        CREATE TABLE dbo.Interviews (
            interview_id INT IDENTITY(1,1) PRIMARY KEY,
            candidate_id INT NOT NULL,
            job_id INT NULL,
            interviewer_id INT NULL,
            interview_round NVARCHAR(100) NULL,
            scheduled_at DATETIME2 NULL,
            status NVARCHAR(50) NOT NULL DEFAULT 'Scheduled',
            notes NVARCHAR(MAX) NULL,
            created_at DATETIME2 DEFAULT GETDATE()
        )
    """)

    # Save schema changes
    conn.commit()

    cursor.close()
    conn.close()

# ==========================================
# AUTHENTICATION ENDPOINTS
# ==========================================

@api.route('/api/signup', methods=['POST'])
def signup():
    try:
        ensure_schema()
        data = request.get_json()
        full_name = data.get('full_name', '').strip()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        role_name = normalize_role_name(data.get('role', ''))
        company_name = data.get('company_name', None)

        if not full_name or not email or not password or not role_name:
            return jsonify({'error': 'All fields are required'}), 400

        if role_name not in ['manager', 'candidate', 'interviewer']:
            return jsonify({'error': 'Invalid role'}), 400

        hashed = bcrypt.generate_password_hash(password).decode('utf-8')
        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute('SELECT email FROM dbo.Users WHERE email = ?', (email,))
        if cursor.fetchone():
            conn.close()
            return jsonify({'error': 'Email already registered. Please login.'}), 400

        cursor.execute('SELECT role_id FROM dbo.Roles WHERE role_name = ?', (role_name,))
        role = cursor.fetchone()
        if not role:
            conn.close()
            return jsonify({'error': 'Role not found in database'}), 400

        cursor.execute("""
            INSERT INTO dbo.Users (full_name, email, password_hash, role_id, company_name, password_change_required)
            VALUES (?, ?, ?, ?, ?, 1)
        """, (full_name, email, hashed, role.role_id, company_name))
        conn.commit()
        cursor.execute('SELECT @@IDENTITY')
        user_id = cursor.fetchone()[0]
        conn.close()

        token = create_access_token(identity=str(user_id))
        return jsonify({
            'message': 'Account created successfully!',
            'token': token,
            'role': role_name,
            'name': full_name,
            'company_name': company_name or '',
            'permissions': user_permissions(role_name)
        }), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@api.route('/api/login', methods=['POST'])
def login():
    try:
        ensure_schema()
        data = request.get_json()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')

        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400

        conn = get_connection()
        cursor = conn.cursor()
        password_change_column_exists = has_password_change_column(cursor)

        if password_change_column_exists:
            cursor.execute("""
                SELECT u.user_id, u.full_name, u.email, u.password_hash, u.company_name,
                       u.password_change_required, r.role_name
                FROM dbo.Users u
                JOIN dbo.Roles r ON u.role_id = r.role_id
                WHERE u.email = ? AND u.is_active = 1
            """, (email,))
        else:
            cursor.execute("""
                SELECT u.user_id, u.full_name, u.email, u.password_hash, u.company_name,
                       0 AS password_change_required, r.role_name
                FROM dbo.Users u
                JOIN dbo.Roles r ON u.role_id = r.role_id
                WHERE u.email = ? AND u.is_active = 1
            """, (email,))

        user = cursor.fetchone()
        conn.close()

        if not user:
            return jsonify({'error': 'Email not found'}), 404

        if not bcrypt.check_password_hash(user.password_hash, password):
            return jsonify({'error': 'Wrong password'}), 401

        normalized_role = normalize_role_name(user.role_name)
        token = create_access_token(identity=str(user.user_id))
        response = {
            'message': 'Login successful',
            'token': token,
            'role': normalized_role,
            'name': user.full_name,
            'company_name': user.company_name or '',
            'permissions': user_permissions(normalized_role)
        }

        if user.password_change_required:
            response['require_password_change'] = True
            response['message'] = 'Temporary password accepted. Please set a new password.'

        return jsonify(response), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@api.route('/api/forgot-password', methods=['POST'])
def forgot_password():
    try:
        data = request.get_json()
        email = data.get('email', '').strip().lower()

        if not email:
            return jsonify({'error': 'Email is required'}), 400

        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT user_id FROM Users WHERE email = ?', (email,))
        user = cursor.fetchone()
        conn.close()

        return jsonify({'message': 'If this email exists, a reset link has been sent.'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@api.route('/api/change-password', methods=['POST'])
def change_password():
    try:
        data = request.get_json()
        email = data.get('email', '').strip().lower()
        current_password = data.get('current_password', '')
        new_password = data.get('new_password', '')

        if not email or not current_password or not new_password:
            return jsonify({'error': 'Email, current password and new password are required'}), 400

        if len(new_password) < 8:
            return jsonify({'error': 'New password must be at least 8 characters'}), 400

        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute('SELECT user_id, password_hash, full_name FROM Users WHERE email = ? AND is_active = 1', (email,))
        user = cursor.fetchone()
        if not user:
            conn.close()
            return jsonify({'error': 'User not found'}), 404

        if not bcrypt.check_password_hash(user.password_hash, current_password):
            conn.close()
            return jsonify({'error': 'Temporary password is incorrect'}), 401

        hashed = bcrypt.generate_password_hash(new_password).decode('utf-8')
        if has_password_change_column(cursor):
            cursor.execute('UPDATE Users SET password_hash = ?, password_change_required = 0 WHERE user_id = ?', (hashed, user.user_id))
        else:
            cursor.execute('UPDATE Users SET password_hash = ? WHERE user_id = ?', (hashed, user.user_id))
        conn.commit()
        conn.close()

        return jsonify({'message': 'Password updated successfully', 'name': user.full_name}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==========================================
# JOBS ENDPOINTS
# ==========================================

@api.route('/api/me', methods=['GET'])
@jwt_required(optional=True)
def get_current_user():
    try:
        ensure_schema()
        user_id = get_jwt_identity()
        if not user_id:
            return jsonify({'error': 'Authentication required'}), 401

        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT u.user_id, u.full_name, u.email, u.company_name, r.role_name
            FROM dbo.Users u
            JOIN dbo.Roles r ON u.role_id = r.role_id
            WHERE u.user_id = ?
        """, (int(user_id),))
        user = cursor.fetchone()
        conn.close()

        if not user:
            return jsonify({'error': 'User not found'}), 404

        role_name = normalize_role_name(user.role_name)
        return jsonify({
            'user': {
                'id': user.user_id,
                'name': user.full_name,
                'email': user.email,
                'role': role_name,
                'company_name': user.company_name or ''
            },
            'permissions': user_permissions(role_name)
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@api.route('/api/dashboard-summary', methods=['GET'])
@jwt_required(optional=True)
def dashboard_summary():
    try:
        ensure_schema()
        user_id = get_jwt_identity()
        role_name = 'manager'
        if user_id:
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute("""
                SELECT r.role_name
                FROM dbo.Users u
                JOIN dbo.Roles r ON u.role_id = r.role_id
                WHERE u.user_id = ?
            """, (int(user_id),))
            row = cursor.fetchone()
            conn.close()
            if row:
                role_name = normalize_role_name(row.role_name)

        permissions = user_permissions(role_name)
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT COUNT(*) FROM dbo.Jobs')
        open_jobs = cursor.fetchone()[0]
        cursor.execute('SELECT COUNT(*) FROM dbo.Candidates')
        candidates_count = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM dbo.Interviews WHERE CAST(scheduled_at AS DATE) = CAST(GETDATE() AS DATE)")
        interviews_today = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM dbo.Candidates WHERE current_status = 'Offer Sent'")
        offers_pending = cursor.fetchone()[0]

        cursor.execute("""
            SELECT TOP 3 c.full_name, c.applied_role, c.current_status, c.ai_score
            FROM dbo.Candidates c
            ORDER BY c.created_at DESC
        """)
        recent_candidates = []
        for row in cursor.fetchall():
            item = {
                'name': row.full_name,
                'role': row.applied_role,
                'status': row.current_status,
                'score': row.ai_score,
            }
            if not permissions['can_view_sensitive_info']:
                item['status'] = row.current_status
            recent_candidates.append(item)

        cursor.execute("""
            SELECT TOP 3 i.interview_id, c.full_name AS candidate_name, c.applied_role AS role_name,
                   i.interview_round, i.scheduled_at, i.status
            FROM dbo.Interviews i
            JOIN dbo.Candidates c ON c.candidate_id = i.candidate_id
            ORDER BY i.scheduled_at ASC
        """)
        upcoming_interviews = []
        for row in cursor.fetchall():
            upcoming_interviews.append({
                'id': row.interview_id,
                'candidate_name': row.candidate_name,
                'role_name': row.role_name,
                'round': row.interview_round,
                'scheduled_at': row.scheduled_at.isoformat() if getattr(row, 'scheduled_at', None) else None,
                'status': row.status,
            })
        conn.close()

        return jsonify({
            'counts': {
                'open_jobs': open_jobs,
                'candidates': candidates_count,
                'interviews_today': interviews_today,
                'offers_pending': offers_pending,
            },
            'pipeline': [
                {'label': 'Applied', 'value': candidates_count},
                {'label': 'Screened', 'value': max(1, int(candidates_count * 0.6))},
                {'label': 'Technical Round', 'value': max(1, int(candidates_count * 0.3))},
                {'label': 'Offer Sent', 'value': offers_pending},
            ],
            'upcoming_interviews': upcoming_interviews,
            'recent_candidates': recent_candidates,
            'user_role': role_name,
            'permissions': permissions,
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@api.route('/api/candidates', methods=['GET'])
@jwt_required(optional=True)
def get_candidates():
    try:
        ensure_schema()
        conn = get_connection()
        cursor = conn.cursor()
        select_clause = get_candidate_select_clause(cursor)
        cursor.execute(f"""
            SELECT {select_clause}
            FROM dbo.Candidates
            ORDER BY created_at DESC
        """)
        rows = cursor.fetchall()
        conn.close()

        candidates = [build_candidate_payload(row) for row in rows]
        return jsonify(candidates), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@api.route('/api/candidates/<int:candidate_id>', methods=['GET'])
@jwt_required(optional=True)
def get_candidate_detail(candidate_id):
    try:
        ensure_schema()
        conn = get_connection()
        cursor = conn.cursor()
        select_clause = get_candidate_select_clause(cursor)
        cursor.execute(f"""
            SELECT {select_clause}
            FROM dbo.Candidates
            WHERE candidate_id = ?
        """, (candidate_id,))
        row = cursor.fetchone()
        conn.close()

        if not row:
            return jsonify({'error': 'Candidate not found'}), 404

        return jsonify(build_candidate_payload(row)), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@api.route('/api/candidates/<int:candidate_id>/stage', methods=['PATCH'])
@jwt_required(optional=True)
def update_candidate_stage(candidate_id):
    try:
        ensure_schema()
        data = request.get_json(silent=True) or {}
        action = (data.get('action') or '').strip().lower()
        requested_stage = (data.get('stage') or '').strip()

        if not action and not requested_stage:
            return jsonify({'error': 'A stage action is required'}), 400

        target_stage = requested_stage or get_candidate_stage_transition(None, action)
        if action:
            target_stage = get_candidate_stage_transition(requested_stage, action)

        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE dbo.Candidates
            SET current_status = ?
            WHERE candidate_id = ?
        """, (target_stage, candidate_id))
        conn.commit()

        select_clause = get_candidate_select_clause(cursor)
        cursor.execute(f"""
            SELECT {select_clause}
            FROM dbo.Candidates
            WHERE candidate_id = ?
        """, (candidate_id,))
        row = cursor.fetchone()
        conn.close()

        if not row:
            return jsonify({'error': 'Candidate not found'}), 404

        return jsonify(build_candidate_payload(row)), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@api.route('/api/interviews', methods=['GET'])
@jwt_required(optional=True)
def get_interviews():
    try:
        ensure_schema()
        user_id = get_jwt_identity()
        role_name = 'manager'
        interviewer_id = None
        if user_id:
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute("""
                SELECT r.role_name, u.user_id
                FROM dbo.Users u
                JOIN dbo.Roles r ON u.role_id = r.role_id
                WHERE u.user_id = ?
            """, (int(user_id),))
            row = cursor.fetchone()
            conn.close()
            if row:
                role_name = normalize_role_name(row.role_name)
                interviewer_id = int(user_id) if role_name == 'interviewer' else None

        conn = get_connection()
        cursor = conn.cursor()
        if interviewer_id:
            cursor.execute("""
                SELECT i.interview_id, c.full_name AS candidate_name, c.applied_role AS role_name,
                       i.interview_round, i.scheduled_at, i.status, i.notes,
                       u.full_name AS interviewer_name
                FROM dbo.Interviews i
                JOIN dbo.Candidates c ON c.candidate_id = i.candidate_id
                LEFT JOIN dbo.Users u ON u.user_id = i.interviewer_id
                WHERE i.interviewer_id = ?
                ORDER BY i.scheduled_at ASC
            """, (interviewer_id,))
        else:
            cursor.execute("""
                SELECT i.interview_id, c.full_name AS candidate_name, c.applied_role AS role_name,
                       i.interview_round, i.scheduled_at, i.status, i.notes,
                       u.full_name AS interviewer_name
                FROM dbo.Interviews i
                JOIN dbo.Candidates c ON c.candidate_id = i.candidate_id
                LEFT JOIN dbo.Users u ON u.user_id = i.interviewer_id
                ORDER BY i.scheduled_at ASC
            """)
        rows = cursor.fetchall()
        conn.close()

        interviews = []
        for row in rows:
            interviews.append({
                'id': row.interview_id,
                'candidate_name': row.candidate_name,
                'role_name': row.role_name,
                'round': row.interview_round,
                'scheduled_at': row.scheduled_at.isoformat() if getattr(row, 'scheduled_at', None) else None,
                'status': row.status,
                'notes': row.notes,
                'interviewer_name': row.interviewer_name,
            })

        return jsonify(interviews), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@api.route('/api/jobs', methods=['POST'])
@jwt_required(optional=True)
def create_job():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()

        title = data.get('title', '').strip()
        department = data.get('department', '').strip()
        location = data.get('location', '').strip()
        description = data.get('description', '').strip()
        mandatory_skills = data.get('mandatory_skills', '').strip()
        required_skills = data.get('required_skills', '').strip()
        min_exp = data.get('min_exp', 0)
        min_salary = data.get('min_salary') or None
        max_salary = data.get('max_salary') or None
        due_date = data.get('due_date') or None
        interview_mode = data.get('interview_mode', 'Video Interview (IncVid)')

        if not title or not location or not description:
            return jsonify({'error': 'Title, location, and description are required'}), 400

        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO Jobs (
                title, department, location, description, 
                mandatory_skills, required_skills, min_exp, 
                min_salary, max_salary, due_date,
                interview_mode, created_by
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            title, department, location, description,
            mandatory_skills, required_skills, min_exp,
            min_salary, max_salary, due_date,
            interview_mode, user_id
        ))

        conn.commit()
        cursor.execute('SELECT @@IDENTITY')
        job_id = cursor.fetchone()[0]
        conn.close()

        return jsonify({
            'message': 'Job posted successfully!',
            'job_id': job_id
        }), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@api.route('/api/jobs', methods=['GET'])
def get_jobs():
    try:
        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT 
                job_id,
                title,
                department,
                location,
                description,
                mandatory_skills,
                required_skills,
                min_exp,
                min_salary,
                max_salary,
                due_date,
                interview_mode,
                created_at,
                'Active' AS status,              -- Default status placeholder
                0 AS candidate_count             -- Candidate count placeholder
            FROM Jobs
            ORDER BY created_at DESC
        """)

        columns = [column[0] for column in cursor.description]
        rows = cursor.fetchall()
        conn.close()

        jobs = []
        for row in rows:
            job_dict = dict(zip(columns, row))
            if job_dict.get('created_at'):
                job_dict['created_at'] = job_dict['created_at'].isoformat()
            if job_dict.get('due_date'):
                job_dict['due_date'] = str(job_dict['due_date'])
            jobs.append(job_dict)

        return jsonify(jobs), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==========================================
# GET ALL JOBS (With Active Candidate Count)
# ==========================================
# @api.route('/api/jobs', methods=['GET'])
# def get_jobs():
#     try:
#         conn = get_connection()
#         cursor = conn.cursor()

#         cursor.execute("""
#             SELECT 
#                 j.job_id,
#                 j.title,
#                 j.department,
#                 j.location,
#                 j.description,
#                 j.mandatory_skills,
#                 j.required_skills,
#                 j.min_exp,
#                 j.min_salary,
#                 j.max_salary,
#                 j.due_date,
#                 j.interview_mode,
#                 j.created_at,
#                 'Active' AS status,
#                 COUNT(CASE WHEN c.current_status != 'Rejected' THEN 1 END) AS candidate_count
#             FROM Jobs j
#             LEFT JOIN Candidates c ON j.title = c.applied_role
#             GROUP BY 
#                 j.job_id, j.title, j.department, j.location, j.description,
#                 j.mandatory_skills, j.required_skills, j.min_exp, j.min_salary,
#                 j.max_salary, j.due_date, j.interview_mode, j.created_at
#             ORDER BY j.created_at DESC
#         """)

#         columns = [column[0] for column in cursor.description]
#         rows = cursor.fetchall()
#         conn.close()

#         jobs = []
#         for row in rows:
#             job_dict = dict(zip(columns, row))
#             if job_dict.get('created_at'):
#                 job_dict['created_at'] = job_dict['created_at'].isoformat()
#             if job_dict.get('due_date'):
#                 job_dict['due_date'] = str(job_dict['due_date'])
#             jobs.append(job_dict)

#         return jsonify(jobs), 200

#     except Exception as e:
#         return jsonify({'error': str(e)}), 500

# ==========================================
# GET CANDIDATES FOR A SPECIFIC JOB
# ==========================================
@api.route('/api/jobs/<int:job_id>/candidates', methods=['GET'])
def get_job_candidates(job_id):
    try:
        conn = get_connection()
        cursor = conn.cursor()

        # Get job title first to filter candidates by applied_role
        cursor.execute("SELECT job_id, title FROM Jobs WHERE job_id = ?", (job_id,))
        job = cursor.fetchone()
        
        if not job:
            conn.close()
            return jsonify({'error': 'Job not found'}), 404

        job_title = job[1]

        # Fetch candidates matching the exact candidate schema
        cursor.execute("""
            SELECT 
                candidate_id,
                full_name,
                email,
                phone,
                current_role,
                applied_role,
                location,
                experience_years,
                current_ctc,
                current_status,
                ai_score,
                created_at
            FROM Candidates
            WHERE applied_role = ?
            ORDER BY created_at DESC
        """, (job_title,))

        columns = [column[0] for column in cursor.description]
        rows = cursor.fetchall()
        conn.close()

        candidates = []
        for row in rows:
            c_dict = dict(zip(columns, row))
            if c_dict.get('created_at'):
                c_dict['created_at'] = c_dict['created_at'].isoformat()
            candidates.append(c_dict)

        return jsonify({
            'job_id': job[0],
            'job_title': job_title,
            'candidates': candidates
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==========================================
# GET SINGLE JOB BY ID
# ==========================================
@api.route('/api/jobs/<int:job_id>', methods=['GET'])
def get_job_by_id(job_id):
    try:
        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT 
                job_id, title, department, location, description, 
                mandatory_skills, required_skills, min_exp, 
                min_salary, max_salary, due_date,
                interview_mode, created_at, created_by
            FROM Jobs
            WHERE job_id = ?
        """, (job_id,))

        row = cursor.fetchone()
        conn.close()

        if not row:
            return jsonify({'error': 'Job not found'}), 404

        columns = [column[0] for column in cursor.description]
        job = dict(zip(columns, row))

        if job.get('created_at'):
            job['created_at'] = job['created_at'].isoformat()
        if job.get('due_date'):
            job['due_date'] = str(job['due_date'])

        return jsonify(job), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==========================================
# UPDATE JOB BY ID
# ==========================================
@api.route('/api/jobs/<int:job_id>', methods=['PUT'])
@jwt_required(optional=True)
def update_job(job_id):
    try:
        data = request.get_json()

        title = data.get('title', '').strip()
        department = data.get('department', '').strip()
        location = data.get('location', '').strip()
        description = data.get('description', '').strip()
        mandatory_skills = data.get('mandatory_skills', '').strip()
        required_skills = data.get('required_skills', '').strip()
        min_exp = data.get('min_exp', 0)
        min_salary = data.get('min_salary') or None
        max_salary = data.get('max_salary') or None
        due_date = data.get('due_date') or None
        interview_mode = data.get('interview_mode', 'Video Interview (IncVid)')

        if not title or not location or not description:
            return jsonify({'error': 'Title, location, and description are required'}), 400

        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute('SELECT job_id FROM Jobs WHERE job_id = ?', (job_id,))
        if not cursor.fetchone():
            conn.close()
            return jsonify({'error': 'Job not found'}), 404

        cursor.execute("""
            UPDATE Jobs
            SET title = ?,
                department = ?,
                location = ?,
                description = ?,
                mandatory_skills = ?,
                required_skills = ?,
                min_exp = ?,
                min_salary = ?,
                max_salary = ?,
                due_date = ?,
                interview_mode = ?
            WHERE job_id = ?
        """, (
            title, department, location, description,
            mandatory_skills, required_skills, min_exp,
            min_salary, max_salary, due_date,
            interview_mode, job_id
        ))

        conn.commit()
        conn.close()

        return jsonify({'message': 'Job updated successfully!'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500