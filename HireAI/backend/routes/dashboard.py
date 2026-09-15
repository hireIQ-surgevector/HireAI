from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from config.db import get_connection

from utils.schema import ensure_schema

from utils.auth_helpers import (
    normalize_role_name,
    user_permissions,
)


dashboard = Blueprint('dashboard', __name__)


@dashboard.route('/api/dashboard-summary', methods=['GET'])
@jwt_required(optional=False)
def dashboard_summary():

    try:
        ensure_schema()

        user_id = get_jwt_identity()

        role_name = 'manager'

        # ==========================================
        # GET USER ROLE
        # ==========================================

        if user_id:

            conn = get_connection()
            cursor = conn.cursor()

            cursor.execute("""
                SELECT r.role_name
                FROM dbo.Users u
                JOIN dbo.Roles r
                    ON u.role_id = r.role_id
                WHERE u.user_id = ?
            """, (int(user_id),))

            row = cursor.fetchone()

            conn.close()

            if row:
                role_name = normalize_role_name(
                    row.role_name
                )

        permissions = user_permissions(role_name)

        # ==========================================
        # DATABASE
        # ==========================================

        conn = get_connection()
        cursor = conn.cursor()

        # ==========================================
        # COUNTS
        # ==========================================

        cursor.execute("""
            SELECT COUNT(*)
            FROM dbo.Jobs
        """)

        open_jobs = cursor.fetchone()[0]

        cursor.execute("""
            SELECT COUNT(*)
            FROM dbo.Candidates
        """)

        candidates_count = cursor.fetchone()[0]

        cursor.execute("""
            SELECT COUNT(*)
            FROM dbo.Interviews
            WHERE CAST(scheduled_at AS DATE)
                = CAST(GETDATE() AS DATE)
        """)

        interviews_today = cursor.fetchone()[0]

        cursor.execute("""
            SELECT COUNT(*)
            FROM dbo.Candidates
            WHERE current_status = 'Offer Sent'
        """)

        offers_pending = cursor.fetchone()[0]

        # ==========================================
        # RECENT CANDIDATES
        # ==========================================

        cursor.execute("""
            SELECT TOP 3
                c.full_name,
                c.applied_role,
                c.current_status,
                c.ai_score
            FROM dbo.Candidates c
            ORDER BY c.created_at DESC
        """)

        recent_candidates = []

        for row in cursor.fetchall():

            recent_candidates.append({
                'name': row.full_name,
                'role': row.applied_role,
                'status': row.current_status,
                'score': row.ai_score,
            })

        # ==========================================
        # UPCOMING INTERVIEWS
        # ==========================================

        cursor.execute("""
            SELECT TOP 3
                i.interview_id,
                c.full_name AS candidate_name,
                c.applied_role AS role_name,
                i.interview_round,
                i.scheduled_at,
                i.notes
            FROM dbo.Interviews i
            JOIN dbo.Candidates c
                ON c.candidate_id = i.candidate_id
            WHERE i.scheduled_at IS NOT NULL
            ORDER BY i.scheduled_at ASC
        """)

        upcoming_interviews = []

        for row in cursor.fetchall():

            upcoming_interviews.append({
                'id': row.interview_id,
                'candidate_name': row.candidate_name,
                'role_name': row.role_name,
                'round': row.interview_round,
                'scheduled_at': (
                    row.scheduled_at.isoformat()
                    if getattr(row, 'scheduled_at', None)
                    else None
                ),
                'notes': row.notes,
            })

        conn.close()

        # ==========================================
        # RESPONSE
        # ==========================================

        return jsonify({

            'counts': {
                'open_jobs': open_jobs,
                'candidates': candidates_count,
                'interviews_today': interviews_today,
                'offers_pending': offers_pending,
            },

            'pipeline': [
                {
                    'label': 'Applied',
                    'value': candidates_count
                },
                {
                    'label': 'Screened',
                    'value': max(
                        1,
                        int(candidates_count * 0.6)
                    )
                },
                {
                    'label': 'Technical Round',
                    'value': max(
                        1,
                        int(candidates_count * 0.3)
                    )
                },
                {
                    'label': 'Offer Sent',
                    'value': offers_pending
                },
            ],

            'upcoming_interviews': upcoming_interviews,

            'recent_candidates': recent_candidates,

            'user_role': role_name,

            'permissions': permissions,

        }), 200

    except Exception as e:

        return jsonify({
            'error': str(e)
        }), 500