from flask import Blueprint, request, jsonify
from config.db import get_connection
from flask_bcrypt import Bcrypt
from flask_jwt_extended import create_access_token

auth = Blueprint('auth', __name__)
bcrypt = Bcrypt()


def has_password_change_column(cursor):
    cursor.execute("""
        SELECT COUNT(*)
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'password_change_required'
    """)
    return cursor.fetchone()[0] > 0


@auth.route('/api/signup', methods=['POST'])
def signup():
    try:
        data = request.get_json()
        full_name = data.get('full_name', '').strip()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        role_name = data.get('role', '').strip().lower()
        company_name = data.get('company_name', None)

        if not full_name or not email or not password or not role_name:
            return jsonify({'error': 'All fields are required'}), 400

        if role_name not in ['employer', 'candidate', 'interviewer']:
            return jsonify({'error': 'Invalid role'}), 400

        hashed = bcrypt.generate_password_hash(password).decode('utf-8')
        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute('SELECT email FROM Users WHERE email = ?', (email,))
        if cursor.fetchone():
            conn.close()
            return jsonify({'error': 'Email already registered. Please login.'}), 400

        cursor.execute('SELECT role_id FROM Roles WHERE role_name = ?', (role_name,))
        role = cursor.fetchone()
        if not role:
            conn.close()
            return jsonify({'error': 'Role not found in database'}), 400

        cursor.execute("""
            INSERT INTO Users (full_name, email, password_hash, role_id, company_name, password_change_required)
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
            'company_name': company_name or ''
        }), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@auth.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        role = data.get('role', '').strip().lower()

        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400

        conn = get_connection()
        cursor = conn.cursor()
        password_change_column_exists = has_password_change_column(cursor)

        if password_change_column_exists:
            cursor.execute("""
                SELECT u.user_id, u.full_name, u.email, u.password_hash, u.company_name,
                       u.password_change_required, r.role_name
                FROM Users u
                JOIN Roles r ON u.role_id = r.role_id
                WHERE u.email = ? AND u.is_active = 1
            """, (email,))
        else:
            cursor.execute("""
                SELECT u.user_id, u.full_name, u.email, u.password_hash, u.company_name,
                       0 AS password_change_required, r.role_name
                FROM Users u
                JOIN Roles r ON u.role_id = r.role_id
                WHERE u.email = ? AND u.is_active = 1
            """, (email,))

        user = cursor.fetchone()
        conn.close()

        if not user:
            return jsonify({'error': 'Email not found'}), 404

        if user.role_name != role:
            return jsonify({'error': f'User registered as {user.role_name}'}), 403

        if not bcrypt.check_password_hash(user.password_hash, password):
            return jsonify({'error': 'Wrong password'}), 401

        token = create_access_token(identity=str(user.user_id))
        response = {
            'message': 'Login successful',
            'token': token,
            'role': user.role_name,
            'name': user.full_name,
            'company_name': user.company_name or ''
        }

        if user.password_change_required:
            response['require_password_change'] = True
            response['message'] = 'Temporary password accepted. Please set a new password.'

        return jsonify(response), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@auth.route('/api/forgot-password', methods=['POST'])
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


@auth.route('/api/change-password', methods=['POST'])
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
