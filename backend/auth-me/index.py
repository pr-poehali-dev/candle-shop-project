import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Проверяет сессию и возвращает данные текущего пользователя.
    Принимает session token в заголовке X-Session-Id.
    """
    cors_headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Session-Id',
        'Content-Type': 'application/json',
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors_headers, 'body': ''}

    headers = event.get('headers', {})
    session_token = headers.get('X-Session-Id') or headers.get('x-session-id')

    if not session_token:
        return {'statusCode': 401, 'headers': cors_headers, 'body': json.dumps({'error': 'No session token'})}

    database_url = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(database_url)
    cursor = conn.cursor()

    cursor.execute(
        """SELECT u.id, u.telegram_id, u.first_name, u.last_name, u.username, u.photo_url
           FROM sessions s
           JOIN users u ON u.id = s.user_id
           WHERE s.id = %s AND s.expires_at > NOW()""",
        (session_token,)
    )
    row = cursor.fetchone()
    cursor.close()
    conn.close()

    if not row:
        return {'statusCode': 401, 'headers': cors_headers, 'body': json.dumps({'error': 'Invalid or expired session'})}

    return {
        'statusCode': 200,
        'headers': cors_headers,
        'body': json.dumps({
            'user': {
                'id': row[0],
                'telegramId': row[1],
                'firstName': row[2],
                'lastName': row[3],
                'username': row[4],
                'photoUrl': row[5],
            }
        })
    }
