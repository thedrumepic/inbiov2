import os
import logging
import resend
from dotenv import load_dotenv

# Загрузка переменных окружения из .env файла
load_dotenv()

# Инициализация API ключа
resend.api_key = os.getenv("RESEND_API_KEY")

def send_email(to_email: str, subject: str, html_content: str):
    """
    Отправляет транзакционное письмо через Resend API.
    
    :param to_email: Email получателя
    :param subject: Тема письма
    :param html_content: Содержимое письма в формате HTML
    :return: True если отправлено успешно, False в противном случае
    """
    try:
        if not resend.api_key:
            logging.error("RESEND_API_KEY не найден в переменных окружения")
            return False

        params = {
            "from": "InBio.one <noreply@inbio.one>",
            "to": [to_email],
            "subject": subject,
            "html": html_content,
        }

        email = resend.Emails.send(params)
        logging.info(f"Email sent, ID: {email['id']}")
        return True

    except Exception as e:
        logging.error(f"Email send error: {str(e)}")
        return False

# --- ПРИМЕР ВЫЗОВА ---
if __name__ == "__main__":
    # Пример приветственного письма
    welcome_subject = "Добро пожаловать в InBio.one!"
    welcome_html = """
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #10b981;">Привет!</h2>
        <p>Мы рады видеть тебя в <b>InBio.one</b> — сервисе для создания стильных мультиссылок.</p>
        <p>Начни оформлять свою страницу прямо сейчас:</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="https://inbio.one/dashboard" 
               style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
               Перейти в личный кабинет
            </a>
        </div>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #666;">Это автоматическое сообщение, отвечать на него не нужно.</p>
    </div>
    """
    
    # Замените на реальный email для теста
    # send_email("test@example.com", welcome_subject, welcome_html)
