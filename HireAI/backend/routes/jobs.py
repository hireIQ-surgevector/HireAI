from flask import Blueprint, request, jsonify
from config.db import get_connection
from flask_jwt_extended import jwt_required, get_jwt_identity

jobs = Blueprint('jobs', __name__)

@jobs.route('/api/jobs', methods=['POST'])
@jwt_required(optional=True)  # Set optional=False once frontend sends valid JWT on login
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
        max_exp = data.get('max_exp', 0)
        interview_mode = data.get('interview_mode', 'Video Interview (IncVid)')

        if not title or not location or not description:
            return jsonify({'error': 'Title, location, and description are required'}), 400

        conn = get_connection()
        cursor = conn.cursor()

        # Insert Job Record into SQL Server
        cursor.execute("""
            INSERT INTO Jobs (
                title, department, location, description, 
                mandatory_skills, required_skills, min_exp, max_exp, 
                interview_mode, created_by
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            title, department, location, description,
            mandatory_skills, required_skills, min_exp, max_exp,
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