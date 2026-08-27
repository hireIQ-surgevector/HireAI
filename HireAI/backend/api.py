import re
from flask import Blueprint, request, jsonify
from config.db import get_connection
from flask_bcrypt import Bcrypt
from flask_jwt_extended import jwt_required, get_jwt_identity

from utils.schema import ensure_schema
from utils.auth_helpers import (
    normalize_role_name,
    user_permissions,
)


# Single API Blueprint
api = Blueprint('api', __name__)
bcrypt = Bcrypt()


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