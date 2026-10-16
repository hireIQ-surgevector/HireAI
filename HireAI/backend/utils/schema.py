from config.db import get_connection


def ensure_schema():
    conn = get_connection()
    cursor = conn.cursor()

    # ==========================================
    # ROLES
    # ==========================================

    cursor.execute("""
        IF OBJECT_ID('dbo.Roles', 'U') IS NULL
        CREATE TABLE dbo.Roles (
            role_id INT IDENTITY(1,1) PRIMARY KEY,
            role_name NVARCHAR(50) NOT NULL UNIQUE,
            description NVARCHAR(200) NULL,
            created_at DATETIME2 DEFAULT GETDATE()
        )
    """)

    # ==========================================
    # USERS
    # ==========================================

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

    # ==========================================
    # JOBS
    # ==========================================

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

    # ==========================================
    # CANDIDATES
    # ==========================================

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

    # ==========================================
    # CANDIDATE EXTRA COLUMNS
    # ==========================================

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

    cursor.execute("""
        IF COL_LENGTH('dbo.Candidates', 'resume_storage_name') IS NULL
        ALTER TABLE dbo.Candidates
        ADD resume_storage_name NVARCHAR(260) NULL
    """)

    cursor.execute("""
        IF COL_LENGTH('dbo.Candidates', 'resume_original_name') IS NULL
        ALTER TABLE dbo.Candidates
        ADD resume_original_name NVARCHAR(260) NULL
    """)

    # ==========================================
    # INTERVIEWS
    # ==========================================

    cursor.execute("""
        IF OBJECT_ID('dbo.Interviews', 'U') IS NULL
        CREATE TABLE dbo.Interviews (
            interview_id INT IDENTITY(1,1) PRIMARY KEY,
            candidate_id INT NOT NULL,
            job_id INT NULL,
            interview_round NVARCHAR(100) NULL,
            scheduled_at DATETIME2 NULL,
            notes NVARCHAR(MAX) NULL,
            is_completed BIT NOT NULL CONSTRAINT DF_Interviews_is_completed DEFAULT 0,
            created_at DATETIME2 DEFAULT GETDATE()
        )
    """)

    cursor.execute("""
        IF COL_LENGTH('dbo.Interviews', 'is_completed') IS NULL
        ALTER TABLE dbo.Interviews
        ADD is_completed BIT NOT NULL
            CONSTRAINT DF_Interviews_is_completed DEFAULT 0 WITH VALUES
    """)

    # ==========================================
    # OFFERS
    # ==========================================

    cursor.execute("""
        IF OBJECT_ID('dbo.Offers', 'U') IS NULL
        CREATE TABLE dbo.Offers (
            offer_id INT IDENTITY(1,1) PRIMARY KEY,
            candidate_id INT NOT NULL,
            job_id INT NULL,
            ctc DECIMAL(12,2) NOT NULL,
            currency NVARCHAR(3) NOT NULL
                CONSTRAINT DF_Offers_currency DEFAULT 'INR',
            expiry_date DATE NOT NULL,
            status NVARCHAR(20) NOT NULL
                CONSTRAINT DF_Offers_status DEFAULT 'Pending',
            sent_at DATETIME2 NOT NULL
                CONSTRAINT DF_Offers_sent_at DEFAULT GETDATE(),
            updated_at DATETIME2 NOT NULL
                CONSTRAINT DF_Offers_updated_at DEFAULT GETDATE(),
            CONSTRAINT FK_Offers_Candidates
                FOREIGN KEY (candidate_id)
                REFERENCES dbo.Candidates(candidate_id),
            CONSTRAINT FK_Offers_Jobs
                FOREIGN KEY (job_id)
                REFERENCES dbo.Jobs(job_id),
            CONSTRAINT CK_Offers_ctc CHECK (ctc > 0),
            CONSTRAINT CK_Offers_status CHECK (
                status IN ('Pending', 'Accepted', 'Declined', 'Expired')
            )
        )
    """)

    cursor.execute("""
        IF NOT EXISTS (
            SELECT 1
            FROM sys.indexes
            WHERE name = 'IX_Offers_candidate_id_sent_at'
                AND object_id = OBJECT_ID('dbo.Offers')
        )
        CREATE INDEX IX_Offers_candidate_id_sent_at
        ON dbo.Offers(candidate_id, sent_at DESC)
    """)

    cursor.execute("""
        UPDATE i
        SET is_completed = 1
        FROM dbo.Interviews i
        INNER JOIN dbo.Candidates c
            ON c.candidate_id = i.candidate_id
        WHERE i.is_completed = 0
            AND (
                (i.interview_round = 'L1 Interview'
                    AND c.current_status IN (
                        'L2 Interview', 'Client Interview', 'Offer Sent', 'Onboarded'
                    ))
                OR (i.interview_round = 'L2 Interview'
                    AND c.current_status IN (
                        'Client Interview', 'Offer Sent', 'Onboarded'
                    ))
                OR (
                    c.current_status = 'Rejected'
                    AND i.interview_id = (
                        SELECT TOP 1 latest.interview_id
                        FROM dbo.Interviews latest
                        WHERE latest.candidate_id = c.candidate_id
                            AND latest.scheduled_at IS NOT NULL
                        ORDER BY latest.scheduled_at DESC
                    )
                )
            )
    """)

    conn.commit()

    cursor.close()
    conn.close()