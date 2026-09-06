import pyodbc
from decimal import Decimal


# ============================================================
# DATABASE CONFIGURATION
# ============================================================

SERVER = r"your server"
DATABASE = "TalentSyncDB"

CONNECTION_STRING = (
    "DRIVER={ODBC Driver 18 for SQL Server};"
    f"SERVER={SERVER};"
    f"DATABASE={DATABASE};"
    "Trusted_Connection=yes;"
    "TrustServerCertificate=yes;"
)


# ============================================================
# DATABASE CONNECTION
# ============================================================

def get_connection():
    return pyodbc.connect(CONNECTION_STRING)


# ============================================================
# DATA CONVERSION
# ============================================================

def convert_phone(phone):
    """
    Convert extracted phone number into BIGINT-compatible value.

    Examples:
        '+91 98765 43210' -> 919876543210
        '9876543210'      -> 9876543210
    """

    if not phone:
        return None

    digits = "".join(ch for ch in str(phone) if ch.isdigit())

    if not digits:
        return None

    return int(digits)


def convert_experience(experience):
    """
    Convert values such as:

        '4 years' -> 4.0
        '4.5 years' -> 4.5
        '0 years' -> 0.0
        4 -> 4.0

    Returns None when experience is unavailable.
    """

    if experience is None:
        return None

    if isinstance(experience, (int, float, Decimal)):
        return float(experience)

    text = str(experience).strip().lower()

    if not text:
        return None

    # Find the first number.
    import re

    match = re.search(r"\d+(?:\.\d+)?", text)

    if not match:
        return None

    return float(match.group())


def convert_skills(skills):
    """
    Convert parser skill list into the NVARCHAR database format.

    Example:
        ['python', 'sql', 'airflow']
        ->
        'python, sql, airflow'
    """

    if not skills:
        return None

    if isinstance(skills, list):
        cleaned = []

        for skill in skills:
            if skill is not None:
                skill = str(skill).strip()

                if skill and skill not in cleaned:
                    cleaned.append(skill)

        return ", ".join(cleaned) if cleaned else None

    return str(skills).strip() or None


# ============================================================
# INSERT CANDIDATE
# ============================================================

def insert_candidate(record):
    """
    Insert ONLY resume-extracted information into dbo.Candidates.

    Resume-derived fields:
        name
        email
        phone
        location
        experience
        current_role
        skills

    Fields deliberately left NULL:
        applied_role
        current_ctc
        notice_period
        ai_score
        job_id
        interview_notes

    current_status is set to 'New' because the DB requires it.
    """

    full_name = record.get("name")
    email = record.get("email")
    phone = convert_phone(record.get("phone"))
    location = record.get("location")
    experience_years = convert_experience(record.get("experience"))
    current_role = record.get("current_role")
    skills = convert_skills(record.get("skills"))

    query = """
        INSERT INTO dbo.Candidates
        (
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
            job_id,
            created_at,
            notice_period,
            skills,
            interview_notes
        )
        VALUES
        (
            ?,      -- full_name
            ?,      -- email
            ?,      -- phone
            ?,      -- current_role
            NULL,   -- applied_role
            ?,      -- location
            ?,      -- experience_years
            NULL,   -- current_ctc
            'New',  -- current_status
            NULL,   -- ai_score
            NULL,   -- job_id
            GETDATE(),
            NULL,   -- notice_period
            ?,      -- skills
            NULL    -- interview_notes
        )
    """

    connection = None

    try:
        connection = get_connection()

        cursor = connection.cursor()

        cursor.execute(
            query,
            (
                full_name,
                email,
                phone,
                current_role,
                location,
                experience_years,
                skills,
            ),
        )

        connection.commit()

        # Get the ID of the candidate we just inserted.
        cursor.execute("SELECT CAST(SCOPE_IDENTITY() AS INT)")
        candidate_id = cursor.fetchone()[0]

        cursor.close()

        print(f"  ✓ Inserted into database")
        print(f"  ✓ Candidate ID: {candidate_id}")

        return candidate_id

    except Exception:
        if connection:
            connection.rollback()

        raise

    finally:
        if connection:
            connection.close()


# ============================================================
# TEST DATABASE CONNECTION
# ============================================================

def test_database_connection():
    """
    Simple database connectivity test.
    """

    connection = None

    try:
        connection = get_connection()

        cursor = connection.cursor()

        cursor.execute("SELECT DB_NAME()")

        database_name = cursor.fetchone()[0]

        cursor.close()

        print("✓ Database connection successful")
        print(f"✓ Database: {database_name}")

        return True

    except Exception as e:

        print("✗ Database connection failed")
        print(f"  Error: {e}")

        return False

    finally:
        if connection:
            connection.close()


# ============================================================
# DIRECT TEST
# ============================================================

if __name__ == "__main__":

    print("Testing TalentSyncDB connection...\n")

    test_database_connection()