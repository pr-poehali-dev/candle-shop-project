import json
import os
import urllib.request
import urllib.parse
from typing import Dict, Any, List
import psycopg2
from datetime import datetime
import boto3
import base64
import uuid

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Прием заказов и отправка в Telegram группу
    Args: event - dict with httpMethod, body, queryStringParameters
          context - object with attributes: request_id, function_name
    Returns: HTTP response dict
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    body_data = json.loads(event.get('body', '{}'))
    
    customer_name = body_data.get('customerName', 'Не указано')
    customer_phone = body_data.get('customerPhone', 'Не указано')
    customer_email = body_data.get('customerEmail', 'Не указано')
    items = body_data.get('items', [])
    total = body_data.get('total', 0)
    images_base64 = body_data.get('images', [])
    
    bot_token = os.environ.get('TELEGRAM_BOT_TOKEN')
    chat_id = os.environ.get('TELEGRAM_CHAT_ID')
    database_url = os.environ.get('DATABASE_URL')
    aws_access_key = os.environ.get('AWS_ACCESS_KEY_ID')
    aws_secret_key = os.environ.get('AWS_SECRET_ACCESS_KEY')
    
    if not bot_token or not chat_id:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Telegram credentials not configured'})
        }
    
    image_urls: List[str] = []
    
    if images_base64 and aws_access_key and aws_secret_key:
        try:
            s3 = boto3.client('s3',
                endpoint_url='https://bucket.poehali.dev',
                aws_access_key_id=aws_access_key,
                aws_secret_access_key=aws_secret_key
            )
            
            for idx, img_data in enumerate(images_base64):
                if img_data.startswith('data:image'):
                    header, data = img_data.split(',', 1)
                    image_bytes = base64.b64decode(data)
                    
                    ext = 'jpg'
                    if 'png' in header:
                        ext = 'png'
                    elif 'webp' in header:
                        ext = 'webp'
                    
                    file_key = f"orders/{uuid.uuid4()}.{ext}"
                    
                    s3.put_object(
                        Bucket='files',
                        Key=file_key,
                        Body=image_bytes,
                        ContentType=f'image/{ext}'
                    )
                    
                    cdn_url = f"https://cdn.poehali.dev/projects/{aws_access_key}/bucket/{file_key}"
                    image_urls.append(cdn_url)
        except Exception as s3_error:
            pass
    
    order_id = None
    if database_url:
        try:
            conn = psycopg2.connect(database_url)
            cursor = conn.cursor()
            
            cursor.execute(
                "INSERT INTO orders (customer_name, customer_phone, customer_email, total, images) VALUES (%s, %s, %s, %s, %s) RETURNING id",
                (customer_name, customer_phone, customer_email, total, image_urls)
            )
            order_id = cursor.fetchone()[0]
            
            for item in items:
                cursor.execute(
                    "INSERT INTO order_items (order_id, product_name, volume, quantity, price) VALUES (%s, %s, %s, %s, %s)",
                    (order_id, item.get('name'), item.get('volume'), item.get('quantity'), item.get('price'))
                )
            
            conn.commit()
            cursor.close()
            conn.close()
        except Exception as db_error:
            pass
    
    items_text = '\n'.join([
        f"• {item.get('name')} - {item.get('volume')} мл × {item.get('quantity', 1)} = {item.get('price', 0)} ₽"
        for item in items
    ])
    
    images_info = ''
    if image_urls:
        images_info = f"\n\n📷 Прикрепленные фото: {len(image_urls)} шт."
    
    message = f"""🕯 Новый заказ LUMIÈRE

👤 Клиент:
Имя: {customer_name}
Телефон: {customer_phone}
Email: {customer_email}

📦 Товары:
{items_text}

💰 Итого: {total} ₽{images_info}"""
    
    telegram_url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    data = {
        'chat_id': chat_id,
        'text': message,
        'parse_mode': 'HTML'
    }
    
    req = urllib.request.Request(
        telegram_url,
        data=json.dumps(data).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            telegram_response = json.loads(response.read().decode('utf-8'))
            
            if telegram_response.get('ok') and image_urls:
                media_group = []
                for img_url in image_urls[:10]:
                    media_group.append({
                        'type': 'photo',
                        'media': img_url
                    })
                
                if media_group:
                    media_url = f"https://api.telegram.org/bot{bot_token}/sendMediaGroup"
                    media_data = {
                        'chat_id': chat_id,
                        'media': media_group
                    }
                    media_req = urllib.request.Request(
                        media_url,
                        data=json.dumps(media_data).encode('utf-8'),
                        headers={'Content-Type': 'application/json'}
                    )
                    try:
                        urllib.request.urlopen(media_req)
                    except:
                        pass
            
            if telegram_response.get('ok'):
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'isBase64Encoded': False,
                    'body': json.dumps({'success': True, 'message': 'Заказ успешно отправлен'})
                }
            else:
                return {
                    'statusCode': 500,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Failed to send Telegram message'})
                }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': str(e)})
        }