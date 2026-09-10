import re


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
        WHERE TABLE_NAME = 'Users'
        AND COLUMN_NAME = 'password_change_required'
    """)

    return cursor.fetchone()[0] > 0


def has_column(cursor, table_name, column_name):
    cursor.execute("""
        SELECT COUNT(*)
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = ?
        AND COLUMN_NAME = ?
    """, (table_name, column_name))

    return cursor.fetchone()[0] > 0


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
        return (
            'L1 Interview'
            if normalized_stage != 'L1 Interview'
            else normalized_stage
        )

    if action_name == 'l2':
        return 'L2 Interview'

    if action_name == 'client':
        return 'Client Interview'

    if action_name == 'offer':
        return 'Offer Sent'

    if action_name == 'reject':
        return 'Rejected'

    return normalized_stage


def get_candidate_select_clause(cursor):
    columns = [
        'candidate_id',
        'full_name',
        'email',
        'phone',
        'current_role',
        'applied_role',
        'location',
        'experience_years',
        'current_ctc',
        'current_status',
        'ai_score',
        'created_at'
    ]

    if has_column(cursor, 'Candidates', 'notice_period'):
        columns.append('notice_period')

    if has_column(cursor, 'Candidates', 'skills'):
        columns.append('skills')

    if has_column(cursor, 'Candidates', 'interview_notes'):
        columns.append('interview_notes')

    return ', '.join(columns)


def build_candidate_payload(row):
    raw_skills = getattr(row, 'skills', None)

    if isinstance(raw_skills, (list, tuple)):
        skills = [
            str(item).strip()
            for item in raw_skills
            if str(item).strip()
        ]

    elif raw_skills:
        skills = [
            item.strip()
            for item in str(raw_skills).split(';')
            if item.strip()
        ]

    else:
        skills = []

    normalized_stage = normalize_candidate_stage(
        getattr(row, 'current_status', None)
    )

    status_value = (
        normalized_stage.lower().replace(' ', '-')
        if normalized_stage
        else 'active'
    )

    if normalized_stage.lower() == 'offer sent':
        status_value = 'offered'

    elif normalized_stage.lower() == 'rejected':
        status_value = 'rejected'

    raw_notice = getattr(row, 'notice_period', None)

    notice_str = (
        str(raw_notice).strip()
        if raw_notice is not None
        else ''
    )

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
        'experience': (
            f"{row.experience_years} yrs"
            if row.experience_years is not None
            else 'N/A'
        ),
        'stage': normalized_stage,
        'status': status_value,
        'ai_score': row.ai_score,
        'score': row.ai_score or 0,
        'applied': (
            row.created_at.strftime('%b %d')
            if getattr(row, 'created_at', None)
            else ''
        ),
        'email': row.email,
        'phone': row.phone,
        'current_ctc': row.current_ctc,
        'notice_period': notice_period,
        'skills': skills,
        'interview_notes': (
            getattr(row, 'interview_notes', None) or ''
        ),
    }