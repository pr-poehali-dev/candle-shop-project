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
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

def send_confirmation_email(
    customer_email: str,
    customer_name: str,
    items: List[Dict],
    total: float,
    order_id: Any
) -> None:
    '''Отправляет письмо-подтверждение заказа покупателю'''
    smtp_host = os.environ.get('SMTP_HOST')
    smtp_port = int(os.environ.get('SMTP_PORT', '465'))
    smtp_user = os.environ.get('SMTP_USER')
    smtp_password = os.environ.get('SMTP_PASSWORD')

    if not all([smtp_host, smtp_user, smtp_password, customer_email]):
        return

    if customer_email == 'Не указано':
        return

    order_id_str = f"#{order_id}" if order_id else ""

    items_rows = ''.join([
        f"""<tr>
            <td style="padding:8px 12px;border-bottom:1px solid #f0e8d8;">{item.get('name', '')}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #f0e8d8;text-align:center;">{item.get('volume', '')} мл</td>
            <td style="padding:8px 12px;border-bottom:1px solid #f0e8d8;text-align:center;">{item.get('quantity', 1)}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #f0e8d8;text-align:right;">{item.get('price', 0)} ₽</td>
        </tr>"""
        for item in items
    ])

    html_body = f"""<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#faf7f2;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#faf7f2;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.07);">
          <!-- Header -->
          <tr>
            <td style="background:#1a1a1a;padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#f5e6c8;font-size:28px;letter-spacing:4px;font-weight:400;">LUMIÈRE</h1>
              <p style="margin:8px 0 0;color:#a09070;font-size:12px;letter-spacing:2px;">СВЕЧИ РУЧНОЙ РАБОТЫ</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 24px;">
              <p style="margin:0 0 8px;color:#6b5b3e;font-size:14px;letter-spacing:1px;">ПОДТВЕРЖДЕНИЕ ЗАКАЗА</p>
              <h2 style="margin:0 0 24px;color:#1a1a1a;font-size:22px;font-weight:400;">Спасибо за ваш заказ, {customer_name}!</h2>
              <p style="margin:0 0 24px;color:#555;font-size:15px;line-height:1.7;">
                Мы получили ваш заказ {order_id_str} и уже приступаем к его обработке.
                В ближайшее время наш менеджер свяжется с вами для подтверждения деталей.
              </p>

              <!-- Items table -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:24px;">
                <thead>
                  <tr style="background:#f5f0e8;">
                    <th style="padding:10px 12px;text-align:left;font-size:12px;color:#8a7560;font-weight:400;letter-spacing:1px;border-bottom:2px solid #e8dcc8;">ТОВАР</th>
                    <th style="padding:10px 12px;text-align:center;font-size:12px;color:#8a7560;font-weight:400;letter-spacing:1px;border-bottom:2px solid #e8dcc8;">ОБЪЁМ</th>
                    <th style="padding:10px 12px;text-align:center;font-size:12px;color:#8a7560;font-weight:400;letter-spacing:1px;border-bottom:2px solid #e8dcc8;">КОЛ-ВО</th>
                    <th style="padding:10px 12px;text-align:right;font-size:12px;color:#8a7560;font-weight:400;letter-spacing:1px;border-bottom:2px solid #e8dcc8;">СУММА</th>
                  </tr>
                </thead>
                <tbody>
                  {items_rows}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="3" style="padding:12px;text-align:right;font-size:14px;color:#555;letter-spacing:1px;">ИТОГО:</td>
                    <td style="padding:12px;text-align:right;font-size:18px;font-weight:700;color:#1a1a1a;">{total} ₽</td>
                  </tr>
                </tfoot>
              </table>

              <p style="margin:0 0 0;color:#888;font-size:13px;line-height:1.7;">
                Если у вас возникли вопросы, просто ответьте на это письмо — мы всегда рады помочь.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f5f0e8;padding:24px 40px;text-align:center;border-top:1px solid #e8dcc8;">
              <p style="margin:0;color:#a09070;font-size:12px;letter-spacing:1px;">С теплом, команда LUMIÈRE</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""

    text_body = f"""Подтверждение заказа LUMIÈRE {order_id_str}

Здравствуйте, {customer_name}!

Спасибо за ваш заказ. Мы получили его и уже приступаем к обработке.

Состав заказа:
""" + '\n'.join([
        f"  • {item.get('name')} — {item.get('volume')} мл × {item.get('quantity', 1)} = {item.get('price', 0)} ₽"
        for item in items
    ]) + f"""

Итого: {total} ₽

В ближайшее время наш менеджер свяжется с вами.

С теплом, команда LUMIÈRE"""

    msg = MIMEMultipart('alternative')
    msg['Subject'] = f"Подтверждение заказа LUMIÈRE {order_id_str}"
    msg['From'] = smtp_user
    msg['To'] = customer_email

    msg.attach(MIMEText(text_body, 'plain', 'utf-8'))
    msg.attach(MIMEText(html_body, 'html', 'utf-8'))

    try:
        if smtp_port == 465:
            with smtplib.SMTP_SSL(smtp_host, smtp_port) as server:
                server.login(smtp_user, smtp_password)
                server.sendmail(smtp_user, customer_email, msg.as_string())
        else:
            with smtplib.SMTP(smtp_host, smtp_port) as server:
                server.ehlo()
                server.starttls()
                server.login(smtp_user, smtp_password)
                server.sendmail(smtp_user, customer_email, msg.as_string())
    except Exception:
        pass


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Прием заказов, отправка в Telegram группу и email покупателю
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

    # Отправка email-подтверждения покупателю
    send_confirmation_email(customer_email, customer_name, items, total, order_id)
    
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
