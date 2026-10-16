
import os
import re
import time
import pyodbc
from pathlib import Path

SERVER = "sqlserver,1433"
USERNAME = "sa"
PASSWORD = os.environ["MSSQL_SA_PASSWORD"]

INIT_DIR = Path("/database-init")


def connect_with_retry():
    connection_string = (
        "DRIVER={ODBC Driver 17 for SQL Server};"
        f"SERVER={SERVER};"
        "DATABASE=master;"
        f"UID={USERNAME};"
        f"PWD={PASSWORD};"
        "Encrypt=no;"
        "TrustServerCertificate=yes;"
        "Connection Timeout=5;"
    )

    for attempt in range(60):
        try:
            connection = pyodbc.connect(
                connection_string,
                autocommit=True,
            )
            print("Connected to SQL Server.")
            return connection
        except pyodbc.Error as exc:
            print(f"SQL Server not ready ({attempt + 1}/60).")
            if attempt == 59:
                raise
            time.sleep(5)

    raise RuntimeError("Could not connect to SQL Server.")


def execute_script(cursor, script_path):
    sql = script_path.read_text(encoding="utf-8-sig")
    batches = re.split(r"(?im)^\s*GO\s*(?:--.*)?$", sql)

    for batch in batches:
        if batch.strip():
            cursor.execute(batch)


def main():
    connection = connect_with_retry()

    try:
        cursor = connection.cursor()

        # Create the database if it doesn't exist.
        execute_script(
            cursor,
            INIT_DIR / "01-create-database.sql",
        )

        # Check whether the schema is already present.
        cursor.execute("""
            SELECT CASE
                WHEN DB_ID(N'TalentSyncDB') IS NOT NULL
                THEN OBJECT_ID(N'TalentSyncDB.dbo.Candidates', N'U')
                ELSE NULL
            END
        """)

        schema_exists = cursor.fetchone()[0] is not None

        if schema_exists:
            print("Database tables already exist; skipping schema setup.")
        else:
            print("Creating database tables...")
            execute_script(
                cursor,
                INIT_DIR / "TalentSyncDB_schema.sql",
            )
            print("Database schema created successfully.")

    finally:
        connection.close()


if __name__ == "__main__":
    main()