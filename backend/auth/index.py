import json
import os
import hashlib
import hmac
import time
import psycopg2
from typing import Dict, Any

def verify_telegram_data(data: dict, bot_token: str) -> bool:
    """Проверяет подпись данных от Telegram Login Widget"""
    check_hash = data.get('hash', '')
    data_to_check = {k: v for k, v in data.items() if k != 'hash'}
    data_check_string = '\n'.join(
        f"{k}={v}" for k, v in sorted(data_to_check.items())
    )
    secret_key = hashlib.sha256(bot_token.encode()).digest()
    computed_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()
    return hmac.compare_digest(computed_hash, check_hash)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Авторизация через Telegram Login Widget.
    Принимает данные пользователя от виджета, проверяет подпись,
    создаёт/обновляет пользователя в БД и возвращает session token.
    """
    cors_headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json',
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors_headers, 'body': ''}

    if event.get('httpMethod') != 'POST':
        return {'statusCode': 405, 'headers': cors_headers, 'body': json.dumps({'error': 'Method not allowed'})}

    bot_token = os.environ.get('TELEGRAM_AUTH_BOT_TOKEN') or os.environ.get('TELEGRAM_BOT_TOKEN')
    database_url = os.environ.get('DATABASE_URL')

    if not bot_token:
        return {'statusCode': 500, 'headers': cors_headers, 'body': json.dumps({'error': 'Bot token not configured'})}

    raw_body = event.get('body') or '{}'
    body = json.loads(raw_body) if raw_body.strip() else {}
    tg_data = body.get('telegramData', {})

    if not tg_data or not tg_data.get('hash'):
        return {'statusCode': 400, 'headers': cors_headers, 'body': json.dumps({'error': 'No Telegram data provided'})}

    # Проверяем давность данных (не старше 1 суток)
    auth_date = int(tg_data.get('auth_date', 0))
    if time.time() - auth_date > 86400:
        return {'statusCode': 401, 'headers': cors_headers, 'body': json.dumps({'error': 'Telegram data expired'})}

    if not verify_telegram_data(tg_data, bot_token):
        return {'statusCode': 401, 'headers': cors_headers, 'body': json.dumps({'error': 'Invalid Telegram signature'})}

    telegram_id = int(tg_data['id'])
    first_name = tg_data.get('first_name', '')
    last_name = tg_data.get('last_name')
    username = tg_data.get('username')
    photo_url = tg_data.get('photo_url')

    conn = psycopg2.connect(database_url)
    cursor = conn.cursor()

    cursor.execute(
        """INSERT INTO users (telegram_id, first_name, last_name, username, photo_url, updated_at)
           VALUES (%s, %s, %s, %s, %s, NOW())
           ON CONFLICT (telegram_id) DO UPDATE SET
               first_name = EXCLUDED.first_name,
               last_name = EXCLUDED.last_name,
               username = EXCLUDED.username,
               photo_url = EXCLUDED.photo_url,
               updated_at = NOW()
           RETURNING id, telegram_id, first_name, last_name, username, photo_url""",
        (telegram_id, first_name, last_name, username, photo_url)
    )
    user = cursor.fetchone()
    user_id = user[0]

    cursor.execute(
        "INSERT INTO sessions (user_id) VALUES (%s) RETURNING id::text",
        (user_id,)
    )
    session_id = cursor.fetchone()[0]

    conn.commit()
    cursor.close()
    conn.close()

    return {
        'statusCode': 200,
        'headers': cors_headers,
        'body': json.dumps({
            'sessionToken': session_id,
            'user': {
                'id': user[0],
                'telegramId': user[1],
                'firstName': user[2],
                'lastName': user[3],
                'username': user[4],
                'photoUrl': user[5],
            }
        })
    }