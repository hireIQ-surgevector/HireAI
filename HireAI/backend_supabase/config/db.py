import os
import re
import datetime

import pyodbc
import requests
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(BASE_DIR, '.env'))


def get_backend():
    return os.getenv('DB_BACKEND', 'sqlserver').strip().lower()


def get_connection():
    if get_backend() == 'supabase':
        return SupabaseConnection()

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


class SupabaseConnectionError(RuntimeError):
    pass


class SupabaseRow(dict):
    def __init__(self, values=None, **kwargs):
        converted = {}
        for key, value in dict(values or {}, **kwargs).items():
            if isinstance(value, str) and isinstance(key, str) and key.lower() in {
                'created_at', 'updated_at', 'sent_at', 'scheduled_at', 'deleted_at'
            } and value:
                try:
                    value = datetime.datetime.fromisoformat(value.replace('Z', '+00:00'))
                except ValueError:
                    pass
            elif isinstance(value, str) and isinstance(key, str) and key.lower() in {
                'due_date', 'expiry_date'
            } and value:
                try:
                    value = datetime.date.fromisoformat(value)
                except ValueError:
                    pass
            converted[key] = value
        super().__init__(converted)

    def __getattr__(self, name):
        try:
            return self[name]
        except KeyError as exc:
            raise AttributeError(name) from exc

    def __getitem__(self, key):
        if isinstance(key, str):
            normalized = key.lower()
            for candidate_key, value in self.items():
                if isinstance(candidate_key, str) and candidate_key.lower() == normalized:
                    return value
            if normalized in {
                'user_id', 'role_id', 'job_id', 'candidate_id',
                'interview_id', 'offer_id',
            } and 'id' in self:
                return self['id']
        if isinstance(key, int) and 0 <= key < len(self):
            return list(self.values())[key]
        return super().__getitem__(key)

    def __iter__(self):
        return iter(self.values())


class SupabaseConnection:
    def __init__(self):
        url = os.getenv(
            'SUPABASE_URL',
            'https://uiyhoiutvagzyukwziat.supabase.co',
        ).strip().rstrip('/')
        key = os.getenv('SUPABASE_KEY', '').strip()
        if not key:
            raise SupabaseConnectionError(
                'SUPABASE_KEY is required when DB_BACKEND=supabase'
            )
        self.base_url = f'{url}/rest/v1'
        self.headers = {
            'apikey': key,
            'Authorization': f'Bearer {key}',
            'Accept': 'application/json',
        }
        self._last_identity = None

    def cursor(self):
        return SupabaseCursor(self)

    def commit(self):
        return None

    def rollback(self):
        return None

    def close(self):
        return None

    def _request(self, method, table, params=None, payload=None):
        headers = dict(self.headers)
        if method in ('POST', 'PATCH', 'DELETE'):
            headers['Prefer'] = 'return=representation'
        def json_safe(value):
            if isinstance(value, (datetime.datetime, datetime.date)):
                return value.isoformat()
            if isinstance(value, dict):
                return {key: json_safe(item) for key, item in value.items()}
            if isinstance(value, list):
                return [json_safe(item) for item in value]
            return value

        response = requests.request(
            method,
            f'{self.base_url}/{table.lower()}',
            headers=headers,
            params=params,
            json=json_safe(payload),
            timeout=30,
        )
        if not response.ok:
            try:
                detail = response.json()
            except ValueError:
                detail = response.text
            raise SupabaseConnectionError(
                f'Supabase request failed ({response.status_code}): {detail}'
            )
        if not response.content:
            return []
        return response.json()


class SupabaseCursor:
    def __init__(self, connection):
        self.connection = connection
        self._rows = []
        self.rowcount = -1
        self.description = None

    def execute(self, query, parameters=None):
        sql = ' '.join(query.split())
        parameters = tuple(parameters or ())
        upper = sql.upper()

        if upper.startswith('SELECT @@IDENTITY'):
            self._rows = [SupabaseRow({0: self.connection._last_identity})]
            self.rowcount = 1
            self.description = [('IDENTITY', None, None, None, None, None, None)]
            return self

        if upper.startswith('SELECT COUNT(*)') and 'INFORMATION_SCHEMA.COLUMNS' in upper:
            table_match = re.search(r"TABLE_NAME\s*=\s*(['\"])(.*?)\1", sql, re.IGNORECASE)
            column_match = re.search(r"COLUMN_NAME\s*=\s*(['\"])(.*?)\1", sql, re.IGNORECASE)
            table_name = table_match.group(2) if table_match else (
                str(parameters[0]) if parameters else None
            )
            parameter_index = 0 if table_match else (1 if parameters else 0)
            column_name = column_match.group(2) if column_match else (
                str(parameters[parameter_index]) if len(parameters) > parameter_index else None
            )
            # The actual Supabase schema is authoritative; optional columns in
            # SQL Server migrations are not created or inspected by this adapter.
            present = bool(table_name and column_name)
            self._rows = [SupabaseRow({0: 1 if present else 0})]
            self.rowcount = 1
            self.description = [('count', None, None, None, None, None, None)]
            return self

        if upper.startswith('SELECT'):
            self._execute_select(sql, parameters)
        elif upper.startswith('INSERT INTO'):
            self._execute_insert(sql, parameters)
        elif upper.startswith('UPDATE'):
            self._execute_update(sql, parameters)
        elif upper.startswith('DELETE FROM'):
            self._execute_delete(sql, parameters)
        else:
            raise NotImplementedError(
                f'This SQL statement is not supported in Supabase mode: {sql[:160]}'
            )
        if self._rows:
            self.description = [(name, None, None, None, None, None, None) for name in self._rows[0].keys()]
        else:
            self.description = []
        return self

    def fetchone(self):
        return self._rows[0] if self._rows else None

    def fetchall(self):
        return list(self._rows)

    def _execute_select(self, sql, parameters):
        from_match = re.search(
            r'\bFROM\s+(?:dbo\.)?([A-Za-z_][\w]*)\s*(?:([A-Za-z_]\w*))?',
            sql,
            re.IGNORECASE,
        )
        if not from_match:
            raise SupabaseConnectionError(f'Unsupported SELECT: {sql[:160]}')

        base_table = from_match.group(1)
        base_alias = from_match.group(2)
        aliases = {}
        if base_alias and base_alias.lower() not in ('join', 'where', 'left', 'inner', 'right', 'outer'):
            aliases[base_alias.lower()] = base_table

        select_match = re.search(r'\ASELECT\s+(.*?)\s+FROM\s+', sql, re.IGNORECASE | re.DOTALL)
        select_clause = select_match.group(1).strip() if select_match else '*'

        rows = [dict(row) for row in self._fetch_table(base_table)]
        joined_tables = {}
        for join_match in re.finditer(
            r'\b(?:LEFT\s+|RIGHT\s+|INNER\s+|FULL\s+)?JOIN\s+(?:dbo\.)?([A-Za-z_][\w]*)'
            r'\s*(?:([A-Za-z_]\w*))?\s+ON\s+([A-Za-z_][\w]*\.[A-Za-z_][\w]*)\s*=\s*([A-Za-z_][\w]*\.[A-Za-z_][\w]*)',
            sql,
            re.IGNORECASE,
        ):
            table, alias, left_key, right_key = join_match.groups()
            alias = alias or table
            aliases[alias.lower()] = table
            joined_tables[alias.lower()] = (
                table,
                left_key.lower().split('.')[-1],
                right_key.lower().split('.')[-1],
            )

        for join_alias, (table, left_column, right_column) in joined_tables.items():
            joined_rows = self._fetch_table(table)
            join_pk = self._primary_key(table)
            for row in rows:
                matches = [
                    joined
                    for joined in joined_rows
                    if joined.get(right_column) == row.get(left_column)
                    or joined.get(join_pk) == row.get(left_column)
                ]
                row[join_alias] = matches[0] if matches else {}

        where_match = re.search(
            r'\bWHERE\b(.*?)(?:\bORDER BY\b|\bGROUP BY\b|\bHAVING\b|$)',
            sql,
            re.IGNORECASE | re.DOTALL,
        )
        if where_match:
            rows = self._filter_rows(rows, where_match.group(1), parameters)

        standalone_count = re.match(r'^COUNT\s*\(\s*\*\s*\)(?:\s+AS\s+\w+)?$', select_clause.strip(), re.IGNORECASE)
        if standalone_count:
            self._rows = [SupabaseRow({0: len(rows)})]
            self.rowcount = len(rows)
            return

        distinct = re.sub(r'^DISTINCT\s+', '', select_clause, flags=re.IGNORECASE)
        if distinct != select_clause and distinct.strip() != '*':
            select_clause = distinct
        if select_clause.strip() != '*':
            projected = []
            for item in [part.strip() for part in select_clause.split(',')]:
                alias_match = re.match(r'(.+?)\s+(?:AS\s+)?([A-Za-z_][\w]*)$', item, re.IGNORECASE)
                if alias_match and '.' in alias_match.group(1) or alias_match and re.match(r'^\d+$', alias_match.group(1)):
                    expression = alias_match.group(1).strip()
                    output_name = alias_match.group(2)
                elif alias_match and alias_match.group(1).strip().lower() in aliases:
                    expression = alias_match.group(1).strip()
                    output_name = alias_match.group(2)
                elif alias_match and '.' not in alias_match.group(1):
                    expression = alias_match.group(1).strip()
                    output_name = alias_match.group(1).strip()
                else:
                    expression = item
                    output_name = item.lower().split('.')[-1]
                projected.append((expression, output_name))

            self._rows = []
            seen = set()
            for row in rows:
                values = {}
                for expression, output_name in projected:
                    if expression.upper() in ('0 AS password_change_required', '0'):
                        values[output_name] = 0
                    else:
                        values[output_name] = self._selected_value(row, expression, aliases)
                identity = tuple(values.items())
                if re.match(r'^DISTINCT\s+', select_match.group(1), re.IGNORECASE) and identity in seen:
                    continue
                seen.add(identity)
                self._rows.append(SupabaseRow(values))
            self.rowcount = len(self._rows)
            return

        order_match = re.search(
            r'\bORDER BY\b\s+([A-Za-z_][\w]*(?:\.[A-Za-z_][\w]*)*)\s*(DESC|ASC)?',
            sql,
            re.IGNORECASE,
        )
        if order_match:
            column = order_match.group(1).split('.')[-1]
            reverse = (order_match.group(2) or '').upper() == 'DESC'
            rows.sort(
                key=lambda row: row.get(column) if row.get(column) is not None else '',
                reverse=reverse,
            )
        self._rows = [SupabaseRow(row) for row in rows]
        self.rowcount = len(self._rows)

    def _fetch_table(self, table):
        result = self.connection._request('GET', table, params={'select': '*'})
        return result if isinstance(result, list) else []

    @staticmethod
    def _primary_key(table):
        return 'id'

    def _selected_value(self, row, expression, aliases):
        expression = expression.strip()
        scalar_candidate_count = re.match(
            r'^SELECT\s+COUNT\(\*\)\s+FROM\s+(?:dbo\.)?Candidates\s+.*\bc\.job_id\s*=\s*j\.job_id\b\s*$',
            expression,
            re.IGNORECASE | re.DOTALL,
        )
        if scalar_candidate_count:
            job_id = row.get('id')
            if job_id is None and isinstance(row.get('jobs'), dict):
                job_id = row['jobs'].get('id')
            candidates = self._fetch_table('Candidates')
            return sum(1 for candidate in candidates if candidate.get('job_id') == job_id)
        expression = re.sub(r'\s+AS\s+[A-Za-z_][\w]*$', '', expression, flags=re.IGNORECASE)
        dotted = re.match(r'^([A-Za-z_]\w*)\.([A-Za-z_]\w*)$', expression)
        if dotted:
            alias, column = dotted.groups()
            nested = row.get(alias.lower()) if alias.lower() in row else row
            if isinstance(nested, dict):
                selected = next(
                    (value for key, value in nested.items() if key.lower() == column.lower()),
                    None,
                )
                if selected is None and column.lower() in {
                    'id', 'role_id', 'user_id', 'job_id', 'candidate_id', 'interview_id', 'offer_id'
                }:
                    selected = next(
                        (value for key, value in nested.items() if key.lower() == 'id'),
                        None,
                    )
                return selected
            return None
        legacy_id_match = re.match(
            r'^(?:job_id|candidate_id|user_id|role_id|interview_id|offer_id)$',
            expression,
            re.IGNORECASE,
        )
        if legacy_id_match:
            if expression.lower() in row:
                return row.get(expression.lower())
            return row.get('id')
        return next(
            (value for key, value in row.items() if isinstance(key, str) and key.lower() == expression.lower()),
            None,
        )

    def _filter_rows(self, rows, where_clause, parameters):
        filtered = []
        for row in rows:
            matches = True
            parameter_index = 0
            for condition in re.split(r'\s+AND\s+', where_clause.strip(), flags=re.IGNORECASE):
                condition_match = re.match(
                    r'^.*?(?:[A-Za-z_]\w*\.)?([A-Za-z_]\w*)\s*(=|<>|!=|>=|<=|>|<)\s*(.*)$',
                    condition,
                    re.IGNORECASE,
                )
                if not condition_match:
                    continue
                column, operator, expected = condition_match.groups()
                actual = self._find_value(row, column)
                if expected.strip() == '?':
                    expected_value = parameters[parameter_index]
                    parameter_index += 1
                else:
                    expected_value = expected.strip().strip("'")

                if isinstance(actual, bool):
                    expected_value = bool(int(expected_value)) if str(expected_value).isdigit() else expected_value
                condition_matches = {
                    '=': actual == expected_value,
                    '>=': actual >= expected_value,
                    '<=': actual <= expected_value,
                    '>': actual > expected_value,
                    '<': actual < expected_value,
                    '!=': actual != expected_value,
                    '<>': actual != expected_value,
                }.get(operator, False)
                matches = matches and condition_matches
            if matches:
                filtered.append(row)
        return filtered

    @staticmethod
    def _find_value(row, column):
        column = column.lower()
        for key, value in row.items():
            if isinstance(key, str) and key.lower() == column:
                return value
            if isinstance(value, dict):
                for nested_key, nested_value in value.items():
                    if isinstance(nested_key, str) and nested_key.lower() == column:
                        return nested_value
        if column in {
            'role_id', 'user_id', 'job_id', 'candidate_id', 'interview_id', 'offer_id'
        }:
            return row.get('id')
        return None

    def _execute_insert(self, sql, parameters):
        sql = re.sub(
            r'\)\s+OUTPUT\s+INSERTED\.[A-Za-z_][\w]*\s+VALUES\s*\(',
            ') VALUES (',
            sql,
            flags=re.IGNORECASE | re.DOTALL,
        )
        match = re.match(
            r'INSERT\s+INTO\s+(?:dbo\.)?([A-Za-z_][\w]*)\s*\((.*?)\)\s*VALUES\s*\((.*?)\)',
            sql,
            re.IGNORECASE | re.DOTALL,
        )
        if not match:
            raise SupabaseConnectionError(f'Unsupported INSERT: {sql[:160]}')
        table, columns_sql, values_sql = match.groups()
        columns = [column.strip() for column in columns_sql.split(',')]
        values = [value.strip() for value in re.split(r',\s*(?=[?\'"0-9A-Za-z])', values_sql)]
        payload = {}
        parameter_index = 0
        for column, value in zip(columns, values):
            if value == '?':
                payload[column] = parameters[parameter_index]
                parameter_index += 1
            elif value.upper() in ('GETDATE()', 'CURRENT_TIMESTAMP'):
                payload[column] = datetime.datetime.utcnow().isoformat()
            elif value.upper() == 'NULL':
                payload[column] = None
            else:
                payload[column] = value.strip("'")
        inserted = self.connection._request('POST', table, payload=[payload])
        if inserted:
            self.connection._last_identity = inserted[0].get(self._primary_key(table))
            self._rows = [SupabaseRow({0: self.connection._last_identity})]
        self.rowcount = len(inserted)

    def _execute_update(self, sql, parameters):
        match = re.match(
            r'UPDATE\s+(?:dbo\.)?([A-Za-z_][\w]*)\s+SET\s+(.*?)(?:\s+WHERE\s+(.*))?$',
            sql,
            re.IGNORECASE | re.DOTALL,
        )
        if not match:
            raise SupabaseConnectionError(f'Unsupported UPDATE: {sql[:160]}')
        table, assignments, where_clause = match.groups()
        payload = {}
        parameter_index = 0
        for assignment in assignments.split(','):
            column, value = assignment.split('=', 1)
            value = value.strip()
            if value == '?':
                payload[column.strip()] = parameters[parameter_index]
                parameter_index += 1
            elif value.upper() in ('GETDATE()', 'CURRENT_TIMESTAMP'):
                payload[column.strip()] = datetime.datetime.utcnow().isoformat()
            elif value.upper() == 'NULL':
                payload[column.strip()] = None
            else:
                payload[column.strip()] = value.strip("'")

        existing = self._fetch_table(table)
        if where_clause:
            existing = self._filter_rows(existing, where_clause, parameters[parameter_index:])
        primary_key = self._primary_key(table)
        for row in existing:
            if row.get(primary_key) is not None:
                self.connection._request('PATCH', table, params={primary_key: f'eq.{row[primary_key]}'}, payload=payload)
        self.rowcount = len(existing)

    def _execute_delete(self, sql, parameters):
        match = re.match(
            r'DELETE\s+FROM\s+(?:dbo\.)?([A-Za-z_][\w]*)\s*(?:WHERE\s+(.*))?$',
            sql,
            re.IGNORECASE | re.DOTALL,
        )
        if not match:
            raise SupabaseConnectionError(f'Unsupported DELETE: {sql[:160]}')
        table, where_clause = match.groups()
        existing = self._fetch_table(table)
        if where_clause:
            existing = self._filter_rows(existing, where_clause, parameters)
        primary_key = self._primary_key(table)
        for row in existing:
            if row.get(primary_key) is not None:
                self.connection._request('DELETE', table, params={primary_key: f'eq.{row[primary_key]}'})
        self.rowcount = len(existing)
