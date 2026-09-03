import pyodbc
import os
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(BASE_DIR, '.env'))


def get_connection():
    connection_string = os.getenv('DB_CONNECTION_STRING', '').strip()

    if connection_string:
        return pyodbc.connect(connection_string)

    server = os.getenv('DB_SERVER', r'AIPLLTH655\SQLEXPRESS')
    database = os.getenv('DB_NAME', 'TalentSyncDB')

    conn_str = (
        'DRIVER={ODBC Driver 18 for SQL Server};'
        f'SERVER={server};'
        f'DATABASE={database};'
        'Trusted_Connection=yes;'
        'Persist Security Info=False;'
        'Pooling=False;'
        'MultipleActiveResultSets=False;'
        'Encrypt=no;'
        'TrustServerCertificate=no;'
        'Connection Timeout=30;'
    )

    return pyodbc.connect(conn_str)