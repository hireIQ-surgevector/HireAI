import pyodbc
import os
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(BASE_DIR, '.env'))


def get_connection():
    connection_string = os.getenv('DB_CONNECTION_STRING', '').strip()
    if connection_string:
        return pyodbc.connect(connection_string)

    server = os.getenv('DB_SERVER', 'AIPLLTH441\\SQLEXPRESS_2019')
    database = os.getenv('DB_NAME', 'TalentSyncDB')
    username = os.getenv('DB_USER', 'sa')
    password = os.getenv('DB_PASSWORD', 'sa@12345')

    conn_str = (
        'DRIVER={ODBC Driver 17 for SQL Server};'
        f'SERVER={server};'
        f'DATABASE={database};'
        f'UID={username};'
        f'PWD={password};'
        'Encrypt=no;'
        'TrustServerCertificate=yes;'
        'Connection Timeout=30;'
    )

    return pyodbc.connect(conn_str)
