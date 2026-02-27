from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, UploadFile, File, Query, Request, WebSocket, WebSocketDisconnect, Response # Final Reload 4
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
try:
    from mock_db import AsyncMockClient
except ImportError:
    raise
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
from jose import JWTError, jwt
import aiohttp
import base64
from io import BytesIO
from PIL import Image
import asyncio
from aiogram import Bot, Dispatcher, types
from aiogram.filters import Command
from aiogram.types import Message
import qrcode
from email_utils import send_email

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

UPLOAD_DIR = ROOT_DIR / "uploads"
AVATARS_DIR = UPLOAD_DIR / "avatars"
COVERS_DIR = UPLOAD_DIR / "covers"
LOGO_DIR = UPLOAD_DIR / "logo"
FAVS_DIR = UPLOAD_DIR / "favs"
OG_PREVIEW_DIR = UPLOAD_DIR / "files" / "og-preview"

# Ensure directories exist
for directory in [UPLOAD_DIR, AVATARS_DIR, COVERS_DIR, LOGO_DIR, FAVS_DIR, OG_PREVIEW_DIR]:
    directory.mkdir(parents=True, exist_ok=True)

mongo_url = os.getenv('MONGO_URL', 'mongodb://localhost:27017')
USE_MOCK_DB = os.getenv('USE_MOCK_DB', 'true').lower() == 'true'
DB_FILE_PATH = os.getenv('DB_FILE_PATH', 'local_db.json')

client = None
db = None

if USE_MOCK_DB:
    logging.warning(f"Using Mock DB ({DB_FILE_PATH})")
    client = AsyncMockClient(DB_FILE_PATH)
    db = client[os.getenv('DB_NAME', 'my_local_db')]
else:
    try:
        # Try to connect to real Mongo
        client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=2000)
        # Force connection check
        client.server_info()
        logging.info("Connected to MongoDB")
        db = client[os.getenv('DB_NAME', 'my_local_db')]
    except Exception as e:
        logging.error(f"MongoDB connection failed: {e}")
        logging.warning(f"Falling back to Mock DB ({DB_FILE_PATH})")
        client = AsyncMockClient(DB_FILE_PATH)
        db = client[os.getenv('DB_NAME', 'my_local_db')]

app = FastAPI()

# ===== CORS =====
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://inbio.one",
        "http://localhost:3000",
        "http://localhost:8080",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===== Simple In-Memory Rate Limiter =====
from collections import defaultdict
import time as _time

_rate_store: Dict[str, list] = defaultdict(list)

def _rate_limit_check(key: str, max_requests: int, window_seconds: int):
    """Raises 429 if rate limit exceeded."""
    now = _time.time()
    _rate_store[key] = [t for t in _rate_store[key] if now - t < window_seconds]
    if len(_rate_store[key]) >= max_requests:
        raise HTTPException(status_code=429, detail="Слишком много запросов. Попробуйте позже.")
    _rate_store[key].append(now)

api_router = APIRouter(prefix="/api")

@api_router.get("/health")
async def health_check():
    return {"status": "ok"}

@app.get("/robots.txt")
async def robots_txt():
    # Настраиваем домен (в идеале из env, но для начала возьмем относительный путь)
    content = (
        "User-agent: *\n"
        "Disallow: /api/\n"
        "Disallow: /edit/\n"
        "Disallow: /dashboard/\n"
        "Disallow: /login\n"
        "Disallow: /register\n"
        "\n"
        "Sitemap: /sitemap.xml"
    )
    return Response(content=content, media_type="text/plain")

@app.get("/sitemap.xml")
async def sitemap_xml(request: Request):
    # Получаем всех пользователей (страницы)
    users = await db.users.find({}, {"username": 1}).to_list(10000)
    
    # Рекурсивная сборка XML
    base_url = f"{request.url.scheme}://{request.url.netloc}"
    
    xml_content = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml_content += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    
    # Главная страница
    xml_content += f"  <url>\n    <loc>{base_url}/</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n"
    
    # Страницы пользователей
    for user in users:
        if user.get("username"):
            xml_content += f"  <url>\n    <loc>{base_url}/{user['username']}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n"
            
    xml_content += "</urlset>"
    return Response(content=xml_content, media_type="application/xml")

@app.get("/api/qr/generate")
async def generate_qr(url: str, color: str = "black", bg: str = "white"):
    try:
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(url)
        qr.make(fit=True)

        img = qr.make_image(fill_color=color, back_color=bg)
        
        # Save to bytes
        buf = BytesIO()
        img.save(buf, format="PNG")
        
        return Response(content=buf.getvalue(), media_type="image/png")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.websocket("/ws/{username}")
async def websocket_endpoint(websocket: WebSocket, username: str):
    await manager.connect(websocket, username)
    try:
        while True:
            # Keep connection alive and wait for data (though we only send for now)
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, username)
    except Exception as e:
        logger.error(f"WebSocket error for {username}: {e}")
        manager.disconnect(websocket, username)

OWNER_EMAIL = os.getenv("OWNER_EMAIL", "")

@app.on_event("startup")
async def startup_db_check():
    # Ensure owner has admin rights (email from env, not hardcoded)
    if OWNER_EMAIL:
        try:
            await db.users.update_one(
                {"email": OWNER_EMAIL},
                {"$set": {"role": "owner"}}
            )
            logger.info(f"Verified owner role for {OWNER_EMAIL}")
        except Exception as e:
            logger.warning(f"Startup owner check failed: {e}")

    # Create MongoDB indexes for performance
    if not USE_MOCK_DB:
        try:
            await db.users.create_index("email", unique=True)
            await db.users.create_index("id", unique=True)
            await db.pages.create_index("username", unique=True)
            await db.pages.create_index("user_id")
            await db.pages.create_index("id", unique=True)
            await db.blocks.create_index("page_id")
            await db.blocks.create_index("id", unique=True)
            await db.analytics_v2.create_index([("page_id", 1), ("event_type", 1)])
            await db.analytics_v2.create_index("timestamp")
            await db.events.create_index("page_id")
            await db.showcases.create_index("page_id")
            await db.leads.create_index("page_id")
            await db.notifications.create_index("user_id")
            logger.info("MongoDB indexes created/verified")
        except Exception as e:
            logger.warning(f"Index creation warning: {e}")
    
    # Start Telegram Bot polling in background
    if bot and dp:
        asyncio.create_task(dp.start_polling(bot))

    # Start Support Bot polling
    if support_bot and support_dp:
        logger.info("Starting Support Bot polling...")
        asyncio.create_task(support_dp.start_polling(support_bot))
        logger.info("Telegram bot polling started")

SECRET_KEY = os.getenv("JWT_SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("JWT_SECRET_KEY environment variable is required")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")

security = HTTPBearer(auto_error=False)

# Telegram Bot Setup
BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
bot = Bot(token=BOT_TOKEN) if BOT_TOKEN else None
dp = Dispatcher() if BOT_TOKEN else None
linking_codes = {} # temporary map: code -> user_id

# Support Bot Setup
SUPPORT_BOT_TOKEN = os.getenv("SUPPORT_BOT_TOKEN", "")
SUPPORT_OPERATOR_ID = int(os.getenv("SUPPORT_OPERATOR_ID", "548890042")) # ID @sadsoulpro
support_bot = Bot(token=SUPPORT_BOT_TOKEN) if SUPPORT_BOT_TOKEN else None
support_dp = Dispatcher() if SUPPORT_BOT_TOKEN else None
support_admins = [] # Cache for support admins if needed (or just use db)

# {operator_msg_id: user_chat_id}
support_tickets = {}

if support_dp:
    @support_dp.message(Command("start"))
    async def support_cmd_start(message: Message):
        keyboard = types.InlineKeyboardMarkup(inline_keyboard=[
            [types.InlineKeyboardButton(text="👤 Профиль и Аккаунт", callback_data="cat_profile")],
            [types.InlineKeyboardButton(text="🧩 Типы Блоков", callback_data="cat_blocks")],
            [types.InlineKeyboardButton(text="🔃 Сортировка и Публикация", callback_data="cat_sort")],
            [types.InlineKeyboardButton(text="👨‍💻 Позвать оператора", callback_data="human_help")]
        ])
        await message.answer(
            "👋 **Добро пожаловать в поддержку InBio.one!**\n\n"
            "Я помогу вам быстро разобраться с редактором или соединю с живым человеком.\n\n"
            "Выберите интересующий вас раздел ниже 👇",
            reply_markup=keyboard,
            parse_mode="Markdown"
        )

if support_dp:
    @support_dp.message()
    async def support_message_handler(message: Message):
        chat_id = message.chat.id
        logger.info(f"DEBUG: chat_id={chat_id} type={type(chat_id)}, op_id={SUPPORT_OPERATOR_ID} type={type(SUPPORT_OPERATOR_ID)}, eq={chat_id == SUPPORT_OPERATOR_ID}")
        
        # Logic for operator replies
        if chat_id == SUPPORT_OPERATOR_ID and message.reply_to_message:
            reply_id = message.reply_to_message.message_id
            logger.info(f"DEBUG2: reply_to_msg_id={reply_id}")
            ticket = await db.support_tickets.find_one({"msg_id": reply_id})
            logger.info(f"DEBUG2: ticket={ticket}")
            user_chat_id = ticket["user_chat_id"] if ticket else None
            if user_chat_id:
                try:
                    await support_bot.send_message(user_chat_id, f"✉️ **Ответ оператора:**\n\n{message.text}", parse_mode="Markdown")
                    await message.answer("✅ Ответ отправлен пользователю.")
                except Exception as e:
                    await message.answer(f"❌ Ошибка при отправке: {e}")
                return

        text = message.text.lower().strip() if message.text else ""
        
        # Common FAQ keywords search
        qas = await db.support_qa.find({}).to_list(length=100)
        best_match = None
        for qa in qas:
            if any(k.lower() in text for k in qa.get("keywords", [])):
                best_match = qa
                break
            if qa["question"].lower() in text or text in qa["question"].lower():
                best_match = qa
                break

        if best_match:
            await message.answer(f"✨ **{best_match['question']}**\n\n{best_match['answer']}", parse_mode="Markdown")
        else:
            # Forward to operator if not a common question
            if chat_id != SUPPORT_OPERATOR_ID:
                try:
                    # Get user info
                    user_info = f"👤 **Пользователь:** {message.from_user.full_name}"
                    if message.from_user.username:
                        user_info += f" (@{message.from_user.username})"
                    
                    msg_text = message.text or "[Сообщение без текста]"
                    info = f"{user_info}\nID: `{chat_id}`\n\n**Вопрос:**\n"
                    
                    sent_msg = await support_bot.send_message(SUPPORT_OPERATOR_ID, info + msg_text, parse_mode="Markdown")
                    # Bind message ID to user
                    await db.support_tickets.insert_one({"msg_id": sent_msg.message_id, "user_chat_id": chat_id})
                    await message.answer("👨‍💻 **Ваш вопрос передан оператору.**\n\nОжидайте ответа прямо здесь, я пришлю его вам, как только оператор освободится.")
                except Exception as e:
                    logger.error(f"Support forward error: {e}")
                    await message.answer("Произошла ошибка при связи с оператором. Попробуйте позже.")

if support_dp:
    @support_dp.callback_query()
    async def support_callback(call: types.CallbackQuery):
        if call.data == "human_help":
            await call.message.answer(
                "👨‍💻 **Оператор на связи!**\n\n"
                "Просто напишите ваш вопрос ответным сообщением, и я мгновенно передам его специалисту. Ответ придет прямо в этот чат.",
                parse_mode="Markdown"
            )
            await call.answer()
        elif call.data.startswith("cat_"):
            cat = call.data.replace("cat_", "")
            qas = await db.support_qa.find({"category": cat}).to_list(length=30)
            if not qas:
                 await call.message.answer("В этой категории пока нет вопросов.")
            else:
                text = "📖 **Популярные вопросы в этом разделе:**\n\n"
                for qa in qas:
                    text += f"🔹 **{qa['question']}**\n{qa['answer']}\n\n"
                await call.message.answer(text, parse_mode="Markdown")
            await call.answer()


if dp:
    @dp.message(Command("start"))
    async def cmd_start(message: Message):
        args = message.text.split()
        if len(args) > 1:
            code = args[1]
            if code in linking_codes:
                user_id = linking_codes.pop(code)
                try:
                    await db.users.update_one(
                        {"id": user_id},
                        {"$set": {"telegram_chat_id": str(message.chat.id)}}
                    )
                    await message.answer("Ваш аккаунт InBio.one успешно привязан! Теперь вы будете получать уведомления из контактных форм.")
                except Exception as e:
                    await message.answer("Ошибка при привязке аккаунта. Попробуйте снова.")
            else:
                await message.answer("Неверный или истекший код привязки. Сгенерируйте новый в настройках сайта.")
        else:
            await message.answer("Привет! Я бот уведомлений InBio.one. Привяжите свой аккаунт в настройках сайта, чтобы получать данные из форм.")

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("server.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# ===== WebSocket Manager =====

class ConnectionManager:
    def __init__(self):
        # active_connections: Dict[username, List[WebSocket]]
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, username: str):
        await websocket.accept()
        if username not in self.active_connections:
            self.active_connections[username] = []
        self.active_connections[username].append(websocket)
        logger.info(f"WebSocket connected for username: {username}")

    def disconnect(self, websocket: WebSocket, username: str):
        if username in self.active_connections:
            if websocket in self.active_connections[username]:
                self.active_connections[username].remove(websocket)
            if not self.active_connections[username]:
                del self.active_connections[username]
        logger.info(f"WebSocket disconnected for username: {username}")

    async def notify_page_update(self, username: str, data: Optional[Dict[str, Any]] = None):
        if username in self.active_connections:
            for connection in self.active_connections[username]:
                try:
                    payload = {"type": "page_update"}
                    if data:
                        payload["data"] = data
                    await connection.send_json(payload)
                except Exception as e:
                    logger.error(f"Error sending WebSocket message to {username}: {e}")

manager = ConnectionManager()

# Helper to fetch full data (internal)
async def get_full_page_data_internal(username: str):
    page = await db.pages.find_one({"username": username}, {"_id": 0})
    if not page:
        return None
    
    blocks = await db.blocks.find({"page_id": page["id"]}, {"_id": 0}).sort("order", 1).to_list(100)
    events = await db.events.find({"page_id": page["id"]}, {"_id": 0}).to_list(100)
    showcases = await db.showcases.find({"page_id": page["id"]}, {"_id": 0}).to_list(100)
    
    # Inject user's global analytics IDs
    user = await db.users.find_one({"id": page["user_id"]})
    analytics = {}
    if user:
        if user.get("ga_pixel_id"):
             analytics["ga_pixel_id"] = user.get("ga_pixel_id")
        if user.get("fb_pixel_id"):
             analytics["fb_pixel_id"] = user.get("fb_pixel_id")
        if user.get("vk_pixel_id"):
             analytics["vk_pixel_id"] = user.get("vk_pixel_id")

    return {
        "page": page,
        "blocks": blocks,
        "events": events,
        "showcases": showcases,
        "analytics": analytics
    }

# Helpers to broadcast fresh data to connected clients
async def broadcast_page_update(username: str):
    data = await get_full_page_data_internal(username)
    if data:
        await manager.notify_page_update(username, data)

async def broadcast_by_page_id(page_id: str):
    page = await db.pages.find_one({"id": page_id}, {"username": 1})
    if page and "username" in page:
        await broadcast_page_update(page["username"])

# ===== Models =====

# Template block definitions for onboarding
TEMPLATE_BLOCKS: Dict[str, List[Dict[str, Any]]] = {
    "musician": [
        {"block_type": "social_icons", "content": {"platforms": ["instagram", "tiktok", "youtube"]}},
        {"block_type": "music", "content": {}},
        {"block_type": "link", "content": {"title": "Spotify", "url": ""}},
        {"block_type": "link", "content": {"title": "Apple Music", "url": ""}},
        {"block_type": "events", "content": {"title": "Афиша", "items": []}},
        {"block_type": "gallery", "content": {"images": []}},
    ],
    "barber": [
        {"block_type": "link", "content": {"title": "Записаться", "url": ""}},
        {"block_type": "gallery", "content": {"images": []}},
        {"block_type": "schedule", "content": {}},
        {"block_type": "social_icons", "content": {"platforms": ["instagram", "tiktok"]}},
        {"block_type": "contact_form", "content": {}},
    ],
    "photographer": [
        {"block_type": "gallery", "content": {"images": []}},
        {"block_type": "link", "content": {"title": "Портфолио", "url": ""}},
        {"block_type": "text", "content": {"text": "Прайс на услуги"}},
        {"block_type": "contact_form", "content": {}},
        {"block_type": "social_icons", "content": {"platforms": ["instagram"]}},
    ],
    "blogger": [
        {"block_type": "social_icons", "content": {"platforms": ["instagram", "tiktok", "youtube"]}},
        {"block_type": "link", "content": {"title": "Основная площадка", "url": ""}},
        {"block_type": "youtube", "content": {}},
        {"block_type": "tiktok", "content": {}},
        {"block_type": "donation", "content": {}},
    ],
    "business": [
        {"block_type": "showcase", "content": {"items": []}},
        {"block_type": "link", "content": {"title": "Наш сайт", "url": ""}},
        {"block_type": "contact_form", "content": {}},
        {"block_type": "map", "content": {}},
        {"block_type": "social_icons", "content": {"platforms": ["instagram"]}},
    ],
    "freelancer": [
        {"block_type": "events", "content": {"title": "Услуги и цены", "items": []}},
        {"block_type": "gallery", "content": {"images": []}},
        {"block_type": "contact_form", "content": {}},
        {"block_type": "social_icons", "content": {"platforms": ["instagram", "tiktok"]}},
    ],
    "doctor": [
        {"block_type": "text", "content": {"text": "О себе и образование"}},
        {"block_type": "schedule", "content": {}},
        {"block_type": "link", "content": {"title": "Записаться", "url": ""}},
        {"block_type": "contact_form", "content": {}},
        {"block_type": "map", "content": {}},
    ],
    "restaurant": [
        {"block_type": "gallery", "content": {"images": []}},
        {"block_type": "link", "content": {"title": "Меню", "url": ""}},
        {"block_type": "map", "content": {}},
        {"block_type": "social_icons", "content": {"platforms": ["instagram"]}},
        {"block_type": "events", "content": {"title": "Афиша событий", "items": []}},
    ],
}

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    username: Optional[str] = None
    role: str = "user"
    template: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    email: str
    username: Optional[str] = None
    role: str = "user"

class GlobalSettings(BaseModel):
    welcome_modal_duration: int = 10  # in seconds (1-60)


class PageCreate(BaseModel):
    username: str
    name: str
    bio: Optional[str] = ""
    avatar: Optional[str] = None
    cover: Optional[str] = None
    cover_position: int = 50
    theme: str = "dark"

class PageUpdate(BaseModel):
    name: Optional[str] = None
    bio: Optional[str] = None
    avatar: Optional[str] = None
    cover: Optional[str] = None
    cover_position: Optional[int] = None
    theme: Optional[str] = None
    seoSettings: Optional[Dict[str, Any]] = None

class VerificationRequestCreate(BaseModel):
    user_id: Optional[str] = None
    full_name: str
    document_type: Optional[str] = "profile"
    contact_info: Optional[str] = None
    bio: Optional[str] = None
    comment: Optional[str] = None
    social_links: Optional[List[Dict[str, str]]] = None # [{"platform": "instagram", "url": "..."}]
    # Brand specific
    req_type: str = "personal" # personal, brand
    page_id: Optional[str] = None
    category: Optional[str] = None
    website: Optional[str] = None
    social_link: Optional[str] = None

class SupportQACreate(BaseModel):
    question: str
    answer: str
    keywords: List[str] = []
    category: str = "general"

class SupportQAUpdate(BaseModel):
    question: Optional[str] = None
    answer: Optional[str] = None
    keywords: Optional[List[str]] = None
    category: Optional[str] = None

class SupportQAResponse(SupportQACreate):
    id: str
    created_at: str

class RejectionRequest(BaseModel):
    reason: Optional[str] = None

class NotificationRequest(BaseModel):
    message: str
    user_ids: Optional[List[str]] = None
    emails: Optional[List[str]] = None
    all_users: bool = False

class VerificationRequestResponse(BaseModel):
    id: Optional[str] = None
    user_id: Optional[str] = None
    full_name: Optional[str] = None
    document_type: Optional[str] = None
    status: Optional[str] = "pending"
    created_at: Optional[str] = None
    contact_info: Optional[str] = None
    bio: Optional[str] = None
    comment: Optional[str] = None
    social_links: Optional[List[Dict[str, str]]] = None
    # Brand specific
    req_type: str = "personal" # personal, brand
    page_id: Optional[str] = None
    category: Optional[str] = None
    website: Optional[str] = None
    social_link: Optional[str] = None
    # Current status for UI
    page_is_verified: Optional[bool] = None
    user_is_verified: Optional[bool] = None

class NotificationResponse(BaseModel):
    id: str
    user_id: str
    type: str  # info, success, warning, error
    message: str
    read: bool = False
    created_at: str

class PageResponse(BaseModel):
    id: str
    user_id: str
    username: str
    name: str
    bio: str
    avatar: Optional[str] = None
    cover: Optional[str] = None
    cover_position: int = 50
    is_verified: bool = False
    is_main_page: bool = False # Flag for cascading revoke
    is_brand: bool = False
    brand_status: str = "none"  # none, pending, verified, rejected
    theme: str = "auto"
    seoSettings: Optional[Dict[str, Any]] = None
    created_at: str

class BlockCreate(BaseModel):
    page_id: str
    block_type: str  # "link", "text", "music"
    content: Dict[str, Any]
    order: int = 0

class BlockUpdate(BaseModel):
    content: Optional[Dict[str, Any]] = None
    order: Optional[int] = None

class BlockReorder(BaseModel):
    block_ids: List[str]

class ReservedUsernameCreate(BaseModel):
    username: str
    comment: Optional[str] = None

class ReservedUsernameResponse(BaseModel):
    username: str
    comment: Optional[str] = None
    created_at: str

class BlockResponse(BaseModel):
    id: str
    page_id: str
    block_type: str
    content: Dict[str, Any]
    order: int
    created_at: str

class EventCreate(BaseModel):
    page_id: str
    title: str
    date: str
    description: Optional[str] = ""
    cover: Optional[str] = None
    button_text: Optional[str] = "Подробнее"
    button_url: Optional[str] = ""

class EventUpdate(BaseModel):
    title: Optional[str] = None
    date: Optional[str] = None
    description: Optional[str] = None
    cover: Optional[str] = None
    button_text: Optional[str] = None
    button_url: Optional[str] = None

class EventResponse(BaseModel):
    id: str
    page_id: str
    title: str
    date: str
    description: str
    cover: Optional[str]
    button_text: str
    button_url: str
    created_at: str

class ShowcaseCreate(BaseModel):
    page_id: str
    title: str
    cover: Optional[str] = None
    price: Optional[str] = ""
    button_text: Optional[str] = "Купить"
    button_url: Optional[str] = ""

class ShowcaseUpdate(BaseModel):
    title: Optional[str] = None
    cover: Optional[str] = None
    price: Optional[str] = None
    button_text: Optional[str] = None
    button_url: Optional[str] = None

class ShowcaseResponse(BaseModel):
    id: str
    page_id: str
    title: str
    cover: Optional[str]
    price: str
    button_text: str
    button_url: str
    created_at: str

class MusicResolveRequest(BaseModel):
    url: Optional[str] = None
    upc: Optional[str] = None
    isrc: Optional[str] = None
    mode: str = "auto"  # auto or manual

class UsernameCheckRequest(BaseModel):
    username: str

class UsernameUpdate(BaseModel):
    username: str

class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class UserUpdate(BaseModel):
    ga_pixel_id: Optional[str] = None
    fb_pixel_id: Optional[str] = None
    vk_pixel_id: Optional[str] = None
    webhook_url: Optional[str] = None

class Lead(BaseModel):
    id: str
    page_id: str
    page_name: str
    form_id: Optional[str] = None
    form_type: Optional[str] = None
    name: Optional[str] = ""
    contact: str
    email: Optional[str] = ""
    phone: Optional[str] = ""
    message: Optional[str] = ""
    status: str = "new" # new, working, completed
    created_at: str

class LeadCreate(BaseModel):
    page_id: str
    form_id: Optional[str] = None
    form_type: Optional[str] = None
    name: Optional[str] = ""
    contact: Optional[str] = ""
    email: Optional[str] = ""
    phone: Optional[str] = ""
    message: Optional[str] = ""

# ===== Helper Functions =====

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    # JWT exp must be Unix timestamp (seconds since epoch)
    to_encode.update({"exp": int(expire.timestamp())})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def send_reset_email(email: str, token: str):
    """
    Отправка email со ссылкой для сброса пароля через Resend API.
    """
    base_url = os.getenv("BASE_URL", "https://inbio.one")
    reset_link = f"{base_url}/reset-password?token={token}"
    
    subject = "Сброс пароля — InBio.one"
    html_content = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #10b981;">Запрос на сброс пароля 🔑</h2>
        <p>Для создания нового пароля перейдите по ссылке ниже:</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="{reset_link}" 
               style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
               Сбросить пароль
            </a>
        </div>
        <p style="font-size: 14px; color: #666;">Ссылка действительна в течение 1 часа.</p>
        <p style="font-size: 14px; color: #666;">Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #666;">С уважением, команда InBio.one</p>
    </div>
    """
    
    return send_email(email, subject, html_content)

ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "")

security = HTTPBearer(auto_error=False)

# ... (get_current_user remains similar but handles None credential)

async def get_current_user_optional(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    if not credentials:
        return None
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            return None
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            return None
            
        # Enforce roles
        current_role = user.get("role", "user")
        
        if OWNER_EMAIL and user.get("email") == OWNER_EMAIL:
            if current_role != "owner":
                 user["role"] = "owner"
                 await db.users.update_one({"id": user_id}, {"$set": {"role": "owner"}})
                 
        return user
    except JWTError:
        return None

async def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    # This keeps the original strict behavior for normal routes
    if not credentials:
         raise HTTPException(status_code=401, detail="Не авторизован")
    user = await get_current_user_optional(credentials)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token or user not found")
    return user

async def get_current_admin(
    request: Request,
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    # Bypass check via password header (only if ADMIN_PASSWORD is set)
    admin_pass = request.headers.get("X-Admin-Password")
    if admin_pass and ADMIN_PASSWORD and admin_pass == ADMIN_PASSWORD:
        _rate_limit_check(f"admin_bypass:{request.client.host}", max_requests=5, window_seconds=300)
        return current_user or {"role": "owner", "id": "admin_bypass", "email": "admin@inbio.one"}

    if not current_user:
         raise HTTPException(status_code=401, detail="Не авторизован")

    role = current_user.get("role", "user")
    if role != "owner":
        raise HTTPException(
            status_code=403, 
            detail=f"Доступ запрещен: требуются права владельца."
        )
    return current_user

async def get_current_owner(
    request: Request,
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    # Bypass check via password header (only if ADMIN_PASSWORD is set)
    admin_pass = request.headers.get("X-Admin-Password")
    if admin_pass and ADMIN_PASSWORD and admin_pass == ADMIN_PASSWORD:
        _rate_limit_check(f"owner_bypass:{request.client.host}", max_requests=5, window_seconds=300)
        return current_user or {"role": "owner", "id": "admin_bypass", "email": "admin@inbio.one"}

    if not current_user:
         raise HTTPException(status_code=401, detail="Не авторизован")

    role = current_user.get("role", "user")
    if role != "owner":
        raise HTTPException(
            status_code=403, 
            detail="Доступ запрещен: ЭТО СЕКРЕТНАЯ КОМНАТА ТОЛЬКО ДЛЯ ВЛАДЕЛЬЦА"
        )
    return current_user

async def optimize_image(image_data: bytes, max_size: tuple = (800, 800)) -> str:
    """Optimize and convert image to base64"""
    try:
        img = Image.open(BytesIO(image_data))
        img.thumbnail(max_size, Image.Resampling.LANCZOS)
        
        output = BytesIO()
        if img.mode in ('RGBA', 'LA', 'P'):
            img = img.convert('RGB')
        img.save(output, format='JPEG', quality=85, optimize=True)
        
        base64_str = base64.b64encode(output.getvalue()).decode('utf-8')
        return f"data:image/jpeg;base64,{base64_str}"
    except Exception as e:
        logger.error(f"Image optimization error: {e}")
        raise HTTPException(status_code=400, detail="Invalid image")

# ===== Auth Routes =====

class UserMeResponse(BaseModel):
    id: str
    email: str
    username: Optional[str] = None
    role: str
    is_verified: bool = False
    verification_status: Optional[str] = "none"
    ga_pixel_id: Optional[str] = None
    fb_pixel_id: Optional[str] = None
    leads: Optional[List[Lead]] = []
    telegram_chat_id: Optional[str] = None

# Auth session request model
class AuthSessionRequest(BaseModel):
    session_id: str
    username: Optional[str] = None




@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserRegister, request: Request):
    _rate_limit_check(f"register:{request.client.host}", max_requests=5, window_seconds=300)
    # 0. Password validation
    if not user_data.password or len(user_data.password) < 6:
        raise HTTPException(status_code=400, detail="Пароль должен быть не менее 6 символов")
    # 1. Check existing email
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email уже используется")
    
    user_id = str(uuid.uuid4())
    role = "owner" if (OWNER_EMAIL and user_data.email == OWNER_EMAIL) else "user"
    
    # 2. Check username if provided
    created_username = None
    normalized_username = None
    
    if user_data.username:
        normalized_username = user_data.username.lower().strip()
        import re
        if not re.match(r"^[a-zA-Z0-9_-]+$", normalized_username):
             raise HTTPException(status_code=400, detail="Неверный формат ника")
             
        if len(normalized_username) < 4:
             raise HTTPException(status_code=400, detail="Минимальная длина ссылки - 4 символа")

        # Проверка на резерв (для register роль всегда user, если не owner email)
        if role != "owner":
            reserved = await db.reserved_usernames.find_one({"username": normalized_username})
            if reserved:
                raise HTTPException(status_code=400, detail="Зарезервировано системой. Свяжитесь с поддержкой для получения доступа.")

        existing_username = await db.pages.find_one({"username": normalized_username}, {"_id": 0})
        if existing_username:
            raise HTTPException(status_code=400, detail="Данная ссылка уже используется. Пожалуйста, выберите другую.")
        
        created_username = normalized_username

    # 3. Create User
    user = {
        "id": user_id,
        "email": user_data.email,
        "password": hash_password(user_data.password),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "role": role
    }
    
    await db.users.insert_one(user)
    
    # 4. Create Page if username valid
    if created_username:
        page = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "username": created_username,
            "name": created_username,
            "bio": "",
            "avatar": None,
            "cover": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "is_main_page": True
        }
        await db.pages.insert_one(page)

        # 5. Create template blocks if template provided
        if user_data.template and user_data.template in TEMPLATE_BLOCKS:
            page_id = page["id"]
            for order, block_def in enumerate(TEMPLATE_BLOCKS[user_data.template]):
                block = {
                    "id": str(uuid.uuid4()),
                    "page_id": page_id,
                    "user_id": user_id,
                    "block_type": block_def["block_type"],
                    "content": block_def.get("content", {}),
                    "order": order,
                    "is_visible": True,
                    "created_at": datetime.now(timezone.utc).isoformat(),
                }
                await db.blocks.insert_one(block)

    token = create_access_token({"sub": user_id, "role": role})
    
    return TokenResponse(
        access_token=token,
        user_id=user_id,
        email=user_data.email,
        username=created_username,
        role=role
    )

class GoogleAuthRequest(BaseModel):
    token: str

class TelegramAuthRequest(BaseModel):
    id: int
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    username: Optional[str] = None
    photo_url: Optional[str] = None
    auth_date: int
    hash: str

async def _oauth_find_or_create_user(email: str, provider: str, provider_id: str, name: Optional[str] = None):
    """Shared logic for OAuth login: find existing user or create new one."""
    user = await db.users.find_one({"email": email}, {"_id": 0})
    
    if user:
        # Existing user — just login
        page = await db.pages.find_one({"user_id": user["id"]}, {"_id": 0, "username": 1})
        token = create_access_token({"sub": user["id"], "role": user.get("role", "user")})
        return TokenResponse(
            access_token=token,
            user_id=user["id"],
            email=user["email"],
            username=page.get("username") if page else None,
            role=user.get("role", "user")
        )
    
    # New user — create account
    user_id = str(uuid.uuid4())
    role = "owner" if (OWNER_EMAIL and email == OWNER_EMAIL) else "user"
    
    import secrets
    random_password = secrets.token_urlsafe(32)
    
    new_user = {
        "id": user_id,
        "email": email,
        "password": hash_password(random_password),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "role": role,
        "auth_provider": provider,
        "auth_provider_id": str(provider_id),
    }
    await db.users.insert_one(new_user)
    
    token = create_access_token({"sub": user_id, "role": role})
    return TokenResponse(
        access_token=token,
        user_id=user_id,
        email=email,
        username=None,
        role=role
    )

@api_router.post("/auth/google", response_model=TokenResponse)
async def google_auth(data: GoogleAuthRequest, request: Request):
    _rate_limit_check(f"google_auth:{request.client.host}", max_requests=10, window_seconds=300)
    
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=501, detail="Google авторизация не настроена")
    
    # Verify Google token (supports both id_token and access_token)
    try:
        email = None
        name = ""
        google_id = ""
        
        async with aiohttp.ClientSession() as session:
            # Try as id_token first
            async with session.get(
                f"https://oauth2.googleapis.com/tokeninfo?id_token={data.token}"
            ) as resp:
                if resp.status == 200:
                    payload = await resp.json()
                    if payload.get("aud") != GOOGLE_CLIENT_ID:
                        raise HTTPException(status_code=401, detail="Неверный Google токен (audience)")
                    email = payload.get("email")
                    name = payload.get("name", "")
                    google_id = payload.get("sub", "")
                    if not payload.get("email_verified"):
                        email = None
                else:
                    # Try as access_token via userinfo
                    async with session.get(
                        "https://www.googleapis.com/oauth2/v3/userinfo",
                        headers={"Authorization": f"Bearer {data.token}"}
                    ) as userinfo_resp:
                        if userinfo_resp.status != 200:
                            raise HTTPException(status_code=401, detail="Неверный Google токен")
                        payload = await userinfo_resp.json()
                        email = payload.get("email")
                        name = payload.get("name", "")
                        google_id = payload.get("sub", "")
                        if not payload.get("email_verified"):
                            email = None
        
        if not email:
            raise HTTPException(status_code=400, detail="Email не подтверждён в Google аккаунте")
        
        return await _oauth_find_or_create_user(email, "google", google_id, name)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Google auth error: {e}")
        raise HTTPException(status_code=500, detail="Ошибка авторизации через Google")

@api_router.post("/auth/telegram", response_model=TokenResponse)
async def telegram_auth(data: TelegramAuthRequest, request: Request):
    _rate_limit_check(f"tg_auth:{request.client.host}", max_requests=10, window_seconds=300)
    
    if not BOT_TOKEN:
        raise HTTPException(status_code=501, detail="Telegram авторизация не настроена")
    
    # Verify Telegram login hash
    import hashlib
    import hmac
    
    check_data = {k: v for k, v in data.dict().items() if k != "hash" and v is not None}
    data_check_string = "\n".join(f"{k}={v}" for k, v in sorted(check_data.items()))
    
    secret_key = hashlib.sha256(BOT_TOKEN.encode()).digest()
    computed_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()
    
    if computed_hash != data.hash:
        raise HTTPException(status_code=401, detail="Неверная подпись Telegram")
    
    # Check auth_date is not too old (1 day)
    import time as _time_mod
    if _time_mod.time() - data.auth_date > 86400:
        raise HTTPException(status_code=401, detail="Данные авторизации устарели")
    
    # Telegram doesn't provide email — use telegram ID as pseudo-email
    tg_email = f"tg_{data.id}@telegram.inbio.one"
    tg_name = data.first_name or ""
    if data.last_name:
        tg_name += f" {data.last_name}"
    
    # Check if user exists by telegram provider ID first
    user = await db.users.find_one({"auth_provider": "telegram", "auth_provider_id": str(data.id)}, {"_id": 0})
    if user:
        page = await db.pages.find_one({"user_id": user["id"]}, {"_id": 0, "username": 1})
        token = create_access_token({"sub": user["id"], "role": user.get("role", "user")})
        return TokenResponse(
            access_token=token,
            user_id=user["id"],
            email=user.get("email", tg_email),
            username=page.get("username") if page else None,
            role=user.get("role", "user")
        )
    
    return await _oauth_find_or_create_user(tg_email, "telegram", str(data.id), tg_name)

@api_router.get("/auth/telegram/bot-username")
async def get_telegram_bot_username():
    """Return bot username for Telegram Login Widget."""
    if not BOT_TOKEN or not bot:
        raise HTTPException(status_code=501, detail="Telegram бот не настроен")
    try:
        bot_info = await bot.get_me()
        return {"username": bot_info.username}
    except Exception:
        raise HTTPException(status_code=500, detail="Не удалось получить данные бота")

@api_router.post("/submissions", status_code=201)
async def create_lead(lead_data: LeadCreate, request: Request):
    _rate_limit_check(f"lead:{request.client.host}", max_requests=10, window_seconds=300)
    page = await db.pages.find_one({"id": lead_data.page_id})
    if not page:
        raise HTTPException(status_code=404, detail="Страница не найдена")

    user_id = page["user_id"]
    
    new_lead = {
        "id": str(uuid.uuid4()),
        "page_id": lead_data.page_id,
        "page_name": page["name"],
        "form_id": lead_data.form_id,
        "form_type": lead_data.form_type,
        "name": lead_data.name,
        "contact": lead_data.contact or lead_data.email or lead_data.phone or "",
        "email": lead_data.email,
        "phone": lead_data.phone,
        "message": lead_data.message,
        "status": "new",
        "created_at": datetime.now(timezone.utc).isoformat()
    }

    result = await db.users.update_one(
        {"id": user_id},
        {"$push": {"leads": new_lead}}
    )

    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Владелец страницы не найден")

    # Create notification
    notification = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "type": "info",
        "message": f"Кто-то заполнил форму на странице {page['name']}, проверьте в настройках.",
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.notifications.insert_one(notification)

    # Telegram Notification
    user = await db.users.find_one({"id": user_id})
    if user and user.get("telegram_chat_id") and bot:
        try:
            lines = [f"**Новая заявка на InBio.One!**\n"]
            if new_lead.get('name'):
                lines.append(f"**Имя:** {new_lead['name']}")
            if new_lead.get('email'):
                lines.append(f"**Email:** {new_lead['email']}")
            if new_lead.get('phone'):
                lines.append(f"**Телефон:** {new_lead['phone']}")
            if new_lead.get('message'):
                lines.append(f"**Сообщение:** {new_lead['message']}")
            
            lines.append(f"\nСтраница: {new_lead['page_name']}")
            msg = "\n".join(lines)
            await bot.send_message(user["telegram_chat_id"], msg, parse_mode="Markdown")
        except Exception as e:
            logger.error(f"Error sending Telegram notification: {e}")

    return {"message": "Заявка успешно отправлена"}

@api_router.delete("/submissions/{lead_id}")
async def delete_lead(
    lead_id: str,
    current_user: dict = Depends(get_current_user)
):
    user = await db.users.find_one({"id": current_user["id"]})
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
        
    leads = user.get("leads", [])
    new_leads = [l for l in leads if l.get("id") != lead_id]
    
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {"leads": new_leads}}
    )

    return {"message": "Заявка удалена"}

class LeadStatusUpdate(BaseModel):
    status: str

@api_router.patch("/submissions/{lead_id}/status")
async def update_lead_status(
    lead_id: str,
    status_data: LeadStatusUpdate,
    current_user: dict = Depends(get_current_user)
):
    valid_statuses = ["new", "working", "completed"]
    if status_data.status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Неверный статус")

    # Find user first to ensure lead exists and update it manually
    # This is more compatible with simple mock DBs and ensures matched_count/modified_count logic is clear
    user = await db.users.find_one({"id": current_user["id"]})
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
        
    leads = user.get("leads", [])
    lead_idx = -1
    for i, lead in enumerate(leads):
        if lead.get("id") == lead_id:
            lead_idx = i
            break
            
    if lead_idx == -1:
        raise HTTPException(status_code=404, detail="Заявка не найдена")

    # Update status
    leads[lead_idx]["status"] = status_data.status
    
    # Save back
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {"leads": leads}}
    )

    return {"message": "Статус обновлен", "status": status_data.status}

@api_router.delete("/auth/me")
async def delete_my_account(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    
    # 1. Delete blocks from all user pages
    user_pages = await db.pages.find({"user_id": user_id}, {"_id": 0, "id": 1}).to_list(100)
    for page in user_pages:
        await db.blocks.delete_many({"page_id": page["id"]})
        await db.events.delete_many({"page_id": page["id"]})
        await db.showcases.delete_many({"page_id": page["id"]})
    
    # 2. Delete all pages
    await db.pages.delete_many({"user_id": user_id})
    
    # 3. Delete user
    await db.users.delete_one({"id": user_id})
    
    logger.info(f"User {user_id} deleted their account and all associated data.")
    return {"message": "Аккаунт успешно удален"}

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin, request: Request):
    _rate_limit_check(f"login:{request.client.host}", max_requests=10, window_seconds=300)
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Неверный email или пароль")
    
    page = await db.pages.find_one({"user_id": user["id"]}, {"_id": 0, "username": 1})
    token = create_access_token({"sub": user["id"], "role": user.get("role", "user")})
    return TokenResponse(
        access_token=token, 
        user_id=user["id"], 
        email=user["email"],
        username=page["username"] if page else None,
        role=user.get("role", "user")
    )

@api_router.post("/auth/check-username")
async def check_username(data: UsernameCheckRequest):
    # 1. Normalization
    username = data.username.lower().strip()
    
    # 2. Check reserved
    reserved = await db.reserved_usernames.find_one({"username": username})
    if reserved:
        return {"available": False, "reason": "reserved"}

    # 3. Check existing
    existing = await db.pages.find_one({"username": username}, {"_id": 0})
    if existing:
        return {"available": False, "reason": "taken"}
        
    return {"available": True}

@api_router.post("/auth/change-password")
async def change_password(data: PasswordChangeRequest, current_user = Depends(get_current_user)):
    if not data.new_password or len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="Пароль должен быть не менее 6 символов")
    if not verify_password(data.current_password, current_user["password"]):
        raise HTTPException(status_code=400, detail="Неверный текущий пароль")
    
    new_hash = hash_password(data.new_password)
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {"password": new_hash}}
    )
    return {"message": "Пароль успешно изменён"}

@api_router.post("/auth/forgot-password")
async def forgot_password(data: ForgotPasswordRequest, request: Request):
    _rate_limit_check(f"forgot:{request.client.host}", max_requests=3, window_seconds=600)
    """
    Инициация сброса пароля: генерация токена и отправка email
    """
    # Проверяем существование пользователя
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    
    # Всегда возвращаем успех (защита от перебора email)
    if not user:
        return {"message": "Если email существует, инструкции отправлены"}
    
    # Генерируем токен
    reset_token = str(uuid.uuid4())
    expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
    
    # Сохраняем в коллекцию password_resets
    reset_record = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "email": data.email,
        "token": reset_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Удаляем старые токены этого пользователя
    await db.password_resets.delete_many({"user_id": user["id"]})
    
    # Создаём новый
    await db.password_resets.insert_one(reset_record)
    
    # Отправляем email (MVP: логирование)
    send_reset_email(data.email, reset_token)
    
    return {"message": "Если email существует, инструкции отправлены"}

@api_router.post("/auth/reset-password-confirm")
async def reset_password_confirm(data: ResetPasswordRequest):
    """
    Подтверждение сброса пароля: валидация токена и смена пароля
    """
    if not data.new_password or len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="Пароль должен быть не менее 6 символов")
    # Ищем токен
    reset_record = await db.password_resets.find_one({"token": data.token}, {"_id": 0})
    
    if not reset_record:
        raise HTTPException(status_code=400, detail="Неверный или истёкший токен")
    
    # Проверяем срок действия
    expires_at = datetime.fromisoformat(reset_record["expires_at"])
    if datetime.now(timezone.utc) > expires_at:
        # Удаляем истёкший токен
        await db.password_resets.delete_one({"token": data.token})
        raise HTTPException(status_code=400, detail="Токен истёк. Запросите новый")
    
    # Валидация пароля
    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="Пароль должен быть не менее 6 символов")
    
    # Обновляем пароль
    new_hash = hash_password(data.new_password)
    await db.users.update_one(
        {"id": reset_record["user_id"]},
        {"$set": {"password": new_hash}}
    )
    
    # Удаляем использованный токен
    await db.password_resets.delete_one({"token": data.token})
    
    logger.info(f"Password reset successful for user {reset_record['user_id']}")
    
    return {"message": "Пароль успешно изменён"}

@api_router.get("/telegram/link")
async def get_telegram_link(current_user: dict = Depends(get_current_user)):
    code = str(uuid.uuid4())[:8].upper()
    linking_codes[code] = current_user["id"]
    
    # Срок жизни кода 10 минут
    async def expire_code():
        await asyncio.sleep(600)
        linking_codes.pop(code, None)
    asyncio.create_task(expire_code())
    
    bot_username = (await bot.get_me()).username if bot else "inbioone_bot"
    link = f"https://t.me/{bot_username}?start={code}"
    return {"link": link, "code": code}

@api_router.delete("/telegram/link")
async def disconnect_telegram(current_user: dict = Depends(get_current_user)):
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$unset": {"telegram_chat_id": ""}}
    )
    return {"message": "Telegram уведомления отключены"}

@api_router.get("/tools/resolve-url")
async def resolve_url(url: str):
    """
    Разрешает сокращенные ссылки (например, pin.it) в полные URL.
    """
    if not url:
        raise HTTPException(status_code=400, detail="URL is required")
        
    try:
        # Простая проверка безопасности
        target_url = url
        if not target_url.startswith(('http://', 'https://')):
            target_url = 'https://' + target_url
            
        async with aiohttp.ClientSession() as session:
            # Используем GET вместо HEAD для надежности с некоторыми сокращателями
            async with session.get(target_url, allow_redirects=True) as response:
                return {"url": str(response.url)}
    except Exception as e:
        logger.error(f"Error resolving URL {url}: {e}")
        # В случае ошибки возвращаем исходный URL
        return {"url": url}

@api_router.get("/auth/me", response_model=UserMeResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    page = await db.pages.find_one({"user_id": current_user["id"]}, {"_id": 0, "username": 1})
    return {
        "id": current_user["id"],
        "email": current_user["email"],
        "username": page["username"] if page else None,
        "role": current_user.get("role", "user"),
        "is_verified": current_user.get("is_verified", False),
        "verification_status": current_user.get("verificationStatus", "none"),
        "ga_pixel_id": current_user.get("ga_pixel_id"),
        "fb_pixel_id": current_user.get("fb_pixel_id"),
        "vk_pixel_id": current_user.get("vk_pixel_id"),
        "webhook_url": current_user.get("webhook_url"),
        "leads": current_user.get("leads", []),
        "telegram_chat_id": current_user.get("telegram_chat_id")
    }

@api_router.patch("/auth/me")
async def update_me(updates: UserUpdate, current_user: dict = Depends(get_current_user)):
    update_data = {k: v for k, v in updates.dict(exclude_unset=True).items() if v is not None}
    
    if not update_data:
        return {"message": "Нет данных для обновления"}

    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": update_data}
    )
    
    return {"message": "Данные обновлены", "updates": update_data}
    
# ===== Admin Routes =====

@api_router.get("/admin/stats")
async def get_admin_stats(current_admin = Depends(get_current_admin)):
    total_users = await db.users.count_documents({})
    total_pages = await db.pages.count_documents({})
    
    return {
        "total_users": total_users,
        "total_pages": total_pages
    }

@api_router.get("/admin/users")
async def get_all_users(current_admin = Depends(get_current_admin)):
    users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(1000)
    # Join with pages to get all pages for each user
    for user in users:
        pages = await db.pages.find(
            {"user_id": user["id"]}, 
            {"_id": 0, "id": 1, "name": 1, "username": 1, "is_main_page": 1, "is_brand": 1, "brand_status": 1, "created_at": 1, "avatar": 1}
        ).sort("created_at", 1).to_list(100)
        
        user["pages"] = pages
        # Keep username and avatar for backward compatibility (main page or first)
        main_page = next((p for p in pages if p.get("is_main_page")), pages[0] if pages else None)
        user["username"] = main_page["username"] if main_page else "N/A"
        user["avatar"] = main_page["avatar"] if main_page else None
        
    return users

@api_router.delete("/admin/user/{user_id}")
async def admin_delete_user(user_id: str, current_admin = Depends(get_current_admin)):
    if user_id == current_admin["id"]:
        raise HTTPException(status_code=400, detail="Нельзя удалить самого себя")
        
    # Cascade delete
    await db.users.delete_one({"id": user_id})
    await db.pages.delete_many({"user_id": user_id})
    # Optional: delete blocks if page IDs are known, but pages usually enough if we reference by user_id
    # To be thorough:
    page = await db.pages.find_one({"user_id": user_id})
    if page:
        await db.blocks.delete_many({"page_id": page["id"]})
        
    return {"message": "Пользователь и его данные удалены"}

@api_router.post("/admin/users/{user_id}/make-admin")
async def make_owner(user_id: str, current_admin = Depends(get_current_admin)):
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": {"role": "owner"}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    return {"message": "Права владельца выданы"}

# ===== Pages Routes =====

@api_router.get("/pages", response_model=List[PageResponse])
async def get_user_pages(current_user = Depends(get_current_user)):
    try:
        # Get all pages sorted by creation time
        pages = await db.pages.find({"user_id": current_user["id"]}, {"_id": 0}).sort("created_at", 1).to_list(100)
        
        if not pages:
            return []

        # Check if any page is marked as main
        has_main = any(p.get("is_main_page", False) for p in pages)
        
        if not has_main:
            # Mark the first page (oldest) as main
            first_page = pages[0]
            first_page["is_main_page"] = True
            await db.pages.update_one({"id": first_page["id"]}, {"$set": {"is_main_page": True}})
            # Set for others strictly to False if missing (optional but cleaner)
            for p in pages[1:]:
                 if "is_main_page" not in p:
                     p["is_main_page"] = False

        # Sort: Main page first, then others by created_at
        pages.sort(key=lambda x: (not x.get("is_main_page", False), x.get("created_at", "")))
        
        return pages
    except Exception as e:
        import traceback
        tb = traceback.format_exc()
        logger.error(f"Error in get_user_pages: {e}")
        logger.error(tb)
        raise HTTPException(status_code=500, detail=f"{str(e)}\n{tb}")

class AnalyticsEvent(BaseModel):
    page_id: str
    event_type: str  # "view", "click"
    target_id: Optional[str] = None # e.g. track_id or block_id for clicks
    metadata: Optional[Dict[str, Any]] = None

@api_router.post("/analytics/track")
async def track_event(event: AnalyticsEvent, request: Request):
    _rate_limit_check(f"track:{request.client.host}", max_requests=60, window_seconds=60)
    # Public endpoint, no auth required to record views/clicks
    # But we check if page exists to avoid spam
    page = await db.pages.find_one({"id": event.page_id})
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
        
    doc = {
        "id": str(uuid.uuid4()),
        "page_id": event.page_id,
        "event_type": event.event_type,
        "target_id": event.target_id,
        "metadata": event.metadata,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    await db.analytics_v2.insert_one(doc)
    return {"status": "ok"}

@api_router.get("/pages/{username}/stats")
async def get_page_stats(username: str, current_user = Depends(get_current_user)):
    page = await db.pages.find_one({"username": username})
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    
    # Check ownership
    if page["user_id"] != current_user["id"]:
         raise HTTPException(status_code=403, detail="Доступ запрещен")

    # Fetch ALL events for this page ONCE (avoid N+1 and extra count queries)
    all_events = await db.analytics_v2.find({"page_id": page["id"]}).to_list(10000)
    total_views = sum(1 for e in all_events if e["event_type"] == "view")
    total_clicks = sum(1 for e in all_events if e["event_type"] == "click")

    # Chart Data (Last 7 days)
    chart_data = []
    now = datetime.now(timezone.utc)
    for i in range(6, -1, -1):
        day = (now - timedelta(days=i)).strftime("%Y-%m-%d")
        day_views = 0
        day_clicks = 0
        for e in all_events:
            if e.get("timestamp", "").startswith(day):
                if e["event_type"] == "view": day_views += 1
                elif e["event_type"] == "click": day_clicks += 1
        chart_data.append({
            "name": day,
            "views": day_views,
            "clicks": day_clicks
        })

    # 4. Top Links
    click_counts = {}
    for e in all_events:
        if e["event_type"] == "click" and e.get("target_id"):
            tid = e["target_id"]
            click_counts[tid] = click_counts.get(tid, 0) + 1

    top_links = []
    sorted_clicks = sorted(click_counts.items(), key=lambda x: x[1], reverse=True)[:5]
    
    # Batch fetch blocks for top links (avoid N+1)
    top_block_ids = [tid for tid, _ in sorted_clicks]
    top_blocks = {}
    if top_block_ids:
        blocks_list = await db.blocks.find({"id": {"$in": top_block_ids}}).to_list(len(top_block_ids))
        top_blocks = {b["id"]: b for b in blocks_list}
    
    for tid, count in sorted_clicks:
        block = top_blocks.get(tid)
        if block:
            top_links.append({
                "title": block["content"].get("title", "Unknown"),
                "clicks": count
            })

    # 5. Geography — aggregate countries from view events (reuse all_events)
    all_views = [e for e in all_events if e["event_type"] == "view"]
    country_counts = {}
    for v in all_views:
        meta = v.get("metadata") or {}
        country = meta.get("country")
        if country:
            flag = meta.get("flag", "")
            key = country
            if key not in country_counts:
                country_counts[key] = {"country": country, "flag": flag, "count": 0}
            country_counts[key]["count"] += 1

    sorted_countries = sorted(country_counts.values(), key=lambda x: x["count"], reverse=True)[:10]
    views_with_geo = sum(c["count"] for c in sorted_countries)
    geo_data = [
        {
            "country": c["country"],
            "flag": c["flag"],
            "count": c["count"],
            "percent": round(c["count"] / views_with_geo * 100) if views_with_geo > 0 else 0
        }
        for c in sorted_countries
    ]

    # 6. UTM Sources aggregation
    utm_counts = {}
    for v in all_views:
        meta = v.get("metadata") or {}
        source = meta.get("utm_source")
        if source:
            medium = meta.get("utm_medium", "")
            campaign = meta.get("utm_campaign", "")
            key = f"{source}|{medium}|{campaign}"
            if key not in utm_counts:
                utm_counts[key] = {"utm_source": source, "utm_medium": medium, "utm_campaign": campaign, "count": 0}
            utm_counts[key]["count"] += 1

    utm_data = sorted(utm_counts.values(), key=lambda x: x["count"], reverse=True)[:20]

    return {
        "total_views": total_views,
        "total_clicks": total_clicks,
        "ctr": round((total_clicks / total_views * 100), 1) if total_views > 0 else 0,
        "chart_data": chart_data,
        "top_links": top_links,
        "geo_data": geo_data,
        "utm_data": utm_data
    }

@api_router.post("/pages", response_model=PageResponse)
async def create_page(page_data: PageCreate, current_user = Depends(get_current_user)):
    normalized_username = page_data.username.lower().strip()
    
    import re
    if not re.match(r"^[a-zA-Z0-9_-]+$", normalized_username):
        raise HTTPException(status_code=400, detail="Неверный формат ника. Используйте буквы, цифры, _ и -")
        
    if len(normalized_username) < 4:
        raise HTTPException(status_code=400, detail="Минимальная длина ссылки - 4 символа")

    existing = await db.pages.find_one({"username": normalized_username}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Username уже занят")
    
    # Determine if this is the first page
    is_main = False
    existing_count = await db.pages.count_documents({"user_id": current_user["id"]})
    if existing_count == 0:
        is_main = True

    page = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "username": normalized_username,
        "name": page_data.name,
        "bio": page_data.bio or "",
        "avatar": page_data.avatar,
        "cover": page_data.cover,
        "theme": page_data.theme,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "is_main_page": is_main
    }
    
    await db.pages.insert_one(page)
    return PageResponse(**page)

@api_router.get("/pages/{username}", response_model=Dict[str, Any])
async def get_page_by_username(username: str):
    data = await get_full_page_data_internal(username)
    if not data:
        raise HTTPException(status_code=404, detail="Страница не найдена")
    
    # Actually loadPage in frontend does tracking, so we can just return data
    return data

@api_router.patch("/pages/{page_id}", response_model=PageResponse)
async def update_page(page_id: str, updates: PageUpdate, current_user = Depends(get_current_user)):
    query = {"id": page_id}
    if current_user.get("role") != "owner":
        query["user_id"] = current_user["id"]
    page = await db.pages.find_one(query, {"_id": 0})
    if not page:
        raise HTTPException(status_code=404, detail="Страница не найдена")
    
    update_data = {k: v for k, v in updates.dict(exclude_unset=True).items() if v is not None}
    if update_data:
        await db.pages.update_one({"id": page_id}, {"$set": update_data})
        await broadcast_page_update(page["username"])
    
    updated_page = await db.pages.find_one({"id": page_id}, {"_id": 0})
    return PageResponse(**updated_page)

@api_router.patch("/pages/{page_id}/update-username")
async def update_page_username(page_id: str, data: UsernameUpdate, current_user = Depends(get_current_user)):
    # 1. Найти страницу и проверить владельца
    query = {"id": page_id}
    if current_user.get("role") != "owner":
        query["user_id"] = current_user["id"]
    page = await db.pages.find_one(query)
    if not page:
        raise HTTPException(status_code=404, detail="Страница не найдена")
    
    new_username = data.username.lower().strip()
    old_username = page["username"]
    
    if new_username == old_username:
        return {"message": "Имя пользователя не изменилось"}
    
    # 1.1 Проверка на резерв (если не owner)
    if current_user["role"] != "owner":
        reserved = await db.reserved_usernames.find_one({"username": new_username})
        if reserved:
            raise HTTPException(status_code=400, detail="Зарезервировано системой. Свяжитесь с поддержкой для получения доступа.")

    # 2. Валидация формата
    import re
    if not re.match(r"^[a-zA-Z0-9_-]+$", new_username):
        raise HTTPException(status_code=400, detail="Неверный формат ника. Используйте буквы, цифры, _ и -")
        
    if len(new_username) < 4:
        raise HTTPException(status_code=400, detail="Минимальная длина ссылки - 4 символа")

    # 3. Финальная проверка на уникальность
    existing = await db.pages.find_one({"username": new_username})
    if existing:
        raise HTTPException(status_code=400, detail="Данная ссылка уже используется. Пожалуйста, выберите другую.")
    
    # 4. Обновление в коллекции pages
    await db.pages.update_one({"id": page_id}, {"$set": {"username": new_username}})
    
    # 5. Обновление в коллекции users (если там был этот username)
    # Ищем пользователя, у которого в поле username (если оно есть) старый ник
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {"username": new_username}}
    )
    
    await manager.notify_page_update(old_username) # Notify old subscribers (might show 404/redirect)
    await broadcast_page_update(new_username)
    
    logger.info(f"User {current_user['id']} changed username from {old_username} to {new_username}")
    return {"message": "Ссылка успешно обновлена", "username": new_username}

@api_router.delete("/pages/{page_id}")
async def delete_page(page_id: str, current_user = Depends(get_current_user)):
    query = {"id": page_id}
    if current_user.get("role") != "owner":
        query["user_id"] = current_user["id"]
    page = await db.pages.find_one(query, {"_id": 0})
    if not page:
        raise HTTPException(status_code=404, detail="Страница не найдена")
    
    # Check if main page
    if page.get("is_main_page", False):
         raise HTTPException(status_code=400, detail="Нельзя удалить основную страницу")

    await db.pages.delete_one({"id": page_id})
    await db.blocks.delete_many({"page_id": page_id})
    await db.events.delete_many({"page_id": page_id})
    await db.showcases.delete_many({"page_id": page_id})
    
    await manager.notify_page_update(page["username"])
    
    return {"message": "Страница удалена"}

# ===== Blocks Routes =====

@api_router.post("/blocks", response_model=BlockResponse)
async def create_block(block_data: BlockCreate, current_user = Depends(get_current_user)):
    query = {"id": block_data.page_id}
    if current_user.get("role") != "owner":
        query["user_id"] = current_user["id"]
    page = await db.pages.find_one(query, {"_id": 0})
    if not page:
        raise HTTPException(status_code=404, detail="Страница не найдена")
    
    block = {
        "id": str(uuid.uuid4()),
        "page_id": block_data.page_id,
        "block_type": block_data.block_type,
        "content": block_data.content,
        "order": block_data.order,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.blocks.insert_one(block)
    await broadcast_by_page_id(block_data.page_id)
    return BlockResponse(**block)

@api_router.patch("/blocks/reorder")
async def reorder_blocks(data: BlockReorder, current_user = Depends(get_current_user)):
    logger.info(f"Reorder request for blocks: {data.block_ids}")
    if not data.block_ids:
        return {"message": "Список пуст"}
    
    # Находим хоть один существующий блок из списка, чтобы проверить владельца страницы
    sample_block = None
    for bid in data.block_ids:
        sample_block = await db.blocks.find_one({"id": bid}, {"_id": 0})
        if sample_block:
            break
    
    if not sample_block:
        logger.warning(f"None of the blocks {data.block_ids} found for user {current_user['id']}")
        raise HTTPException(status_code=404, detail="Блоки не найдены")
    
    
    query = {"id": sample_block["page_id"]}
    if current_user.get("role") != "owner":
        query["user_id"] = current_user["id"]
    page = await db.pages.find_one(query, {"_id": 0})
    if not page:
        logger.warning(f"Access denied for blocks {data.block_ids} by user {current_user['id']}")
        raise HTTPException(status_code=403, detail="Нет доступа")
    
    # Update orders in bulk
    for index, block_id in enumerate(data.block_ids):
        logger.info(f"Updating block {block_id} to order {index}")
        await db.blocks.update_one(
            {"id": block_id},
            {"$set": {"order": index}}
        )
    
    await manager.notify_page_update(page["username"])
    return {"message": "Порядок обновлён"}

@api_router.patch("/blocks/{block_id}", response_model=BlockResponse)
async def update_block(block_id: str, updates: BlockUpdate, current_user = Depends(get_current_user)):
    block = await db.blocks.find_one({"id": block_id}, {"_id": 0})
    if not block:
        raise HTTPException(status_code=404, detail="Блок не найден")
    
    
    query = {"id": block["page_id"]}
    if current_user.get("role") != "owner":
        query["user_id"] = current_user["id"]
    page = await db.pages.find_one(query, {"_id": 0})
    if not page:
        raise HTTPException(status_code=403, detail="Нет доступа")
    
    update_data = {k: v for k, v in updates.dict(exclude_unset=True).items() if v is not None}
    if update_data:
        await db.blocks.update_one({"id": block_id}, {"$set": update_data})
        await broadcast_by_page_id(block["page_id"])
    
    updated_block = await db.blocks.find_one({"id": block_id}, {"_id": 0})
    return BlockResponse(**updated_block)

@api_router.delete("/blocks/{block_id}")
async def delete_block(block_id: str, current_user = Depends(get_current_user)):
    block = await db.blocks.find_one({"id": block_id}, {"_id": 0})
    if not block:
        raise HTTPException(status_code=404, detail="Блок не найден")
    
    
    query = {"id": block["page_id"]}
    if current_user.get("role") != "owner":
        query["user_id"] = current_user["id"]
    page = await db.pages.find_one(query, {"_id": 0})
    if not page:
        raise HTTPException(status_code=403, detail="Нет доступа")
    
    await db.blocks.delete_one({"id": block_id})
    await broadcast_by_page_id(block["page_id"])
    return {"message": "Блок удалён"}

# ===== Events Routes =====

@api_router.post("/events", response_model=EventResponse)
async def create_event(event_data: EventCreate, current_user = Depends(get_current_user)):
    query = {"id": event_data.page_id}
    if current_user.get("role") != "owner":
        query["user_id"] = current_user["id"]
    page = await db.pages.find_one(query, {"_id": 0})
    if not page:
        raise HTTPException(status_code=404, detail="Страница не найдена")
    
    event = {
        "id": str(uuid.uuid4()),
        "page_id": event_data.page_id,
        "title": event_data.title,
        "date": event_data.date,
        "description": event_data.description or "",
        "cover": event_data.cover,
        "button_text": event_data.button_text or "Подробнее",
        "button_url": event_data.button_url or "",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.events.insert_one(event)
    await broadcast_by_page_id(event_data.page_id)
    return EventResponse(**event)

@api_router.patch("/events/{event_id}", response_model=EventResponse)
async def update_event(event_id: str, updates: EventUpdate, current_user = Depends(get_current_user)):
    event = await db.events.find_one({"id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Событие не найдено")
    
    
    query = {"id": event["page_id"]}
    if current_user.get("role") != "owner":
        query["user_id"] = current_user["id"]
    page = await db.pages.find_one(query, {"_id": 0})
    if not page:
        raise HTTPException(status_code=403, detail="Нет доступа")
    
    update_data = {k: v for k, v in updates.dict(exclude_unset=True).items() if v is not None}
    if update_data:
        await db.events.update_one({"id": event_id}, {"$set": update_data})
        await broadcast_by_page_id(event["page_id"])
    
    updated_event = await db.events.find_one({"id": event_id}, {"_id": 0})
    return EventResponse(**updated_event)

@api_router.delete("/events/{event_id}")
async def delete_event(event_id: str, current_user = Depends(get_current_user)):
    event = await db.events.find_one({"id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Событие не найдено")
    
    
    query = {"id": event["page_id"]}
    if current_user.get("role") != "owner":
        query["user_id"] = current_user["id"]
    page = await db.pages.find_one(query, {"_id": 0})
    if not page:
        raise HTTPException(status_code=403, detail="Нет доступа")
    
    await db.events.delete_one({"id": event_id})
    await broadcast_by_page_id(event["page_id"])
    return {"message": "Событие удалено"}

# ===== Showcases Routes =====

@api_router.post("/showcases", response_model=ShowcaseResponse)
async def create_showcase(showcase_data: ShowcaseCreate, current_user = Depends(get_current_user)):
    query = {"id": showcase_data.page_id}
    if current_user.get("role") != "owner":
        query["user_id"] = current_user["id"]
    page = await db.pages.find_one(query, {"_id": 0})
    if not page:
        raise HTTPException(status_code=404, detail="Страница не найдена")
    
    showcase = {
        "id": str(uuid.uuid4()),
        "page_id": showcase_data.page_id,
        "title": showcase_data.title,
        "cover": showcase_data.cover,
        "price": showcase_data.price or "",
        "button_text": showcase_data.button_text or "Купить",
        "button_url": showcase_data.button_url or "",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.showcases.insert_one(showcase)
    await broadcast_by_page_id(showcase_data.page_id)
    return ShowcaseResponse(**showcase)

@api_router.patch("/showcases/{showcase_id}", response_model=ShowcaseResponse)
async def update_showcase(showcase_id: str, updates: ShowcaseUpdate, current_user = Depends(get_current_user)):
    showcase = await db.showcases.find_one({"id": showcase_id}, {"_id": 0})
    if not showcase:
        raise HTTPException(status_code=404, detail="Витрина не найдена")
    
    
    query = {"id": showcase["page_id"]}
    if current_user.get("role") != "owner":
        query["user_id"] = current_user["id"]
    page = await db.pages.find_one(query, {"_id": 0})
    if not page:
        raise HTTPException(status_code=403, detail="Нет доступа")
    
    update_data = {k: v for k, v in updates.dict(exclude_unset=True).items() if v is not None}
    if update_data:
        await db.showcases.update_one({"id": showcase_id}, {"$set": update_data})
        await broadcast_by_page_id(showcase["page_id"])
    
    updated_showcase = await db.showcases.find_one({"id": showcase_id}, {"_id": 0})
    return ShowcaseResponse(**updated_showcase)

@api_router.delete("/showcases/{showcase_id}")
async def delete_showcase(showcase_id: str, current_user = Depends(get_current_user)):
    showcase = await db.showcases.find_one({"id": showcase_id}, {"_id": 0})
    if not showcase:
        raise HTTPException(status_code=404, detail="Витрина не найдена")
    
    
    query = {"id": showcase["page_id"]}
    if current_user.get("role") != "owner":
        query["user_id"] = current_user["id"]
    page = await db.pages.find_one(query, {"_id": 0})
    if not page:
        raise HTTPException(status_code=403, detail="Нет доступа")
    
    await db.showcases.delete_one({"id": showcase_id})
    await broadcast_by_page_id(showcase["page_id"])
    return {"message": "Витрина удалена"}

# ===== Reserved Usernames Routes =====

@api_router.get("/admin/reserved-usernames", response_model=List[ReservedUsernameResponse])
async def get_reserved_usernames(current_user = Depends(get_current_user)):
    if current_user["role"] != "owner":
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    cursor = db.reserved_usernames.find({})
    reserved = await cursor.to_list(length=1000)
    return [ReservedUsernameResponse(**r) for r in reserved]

@api_router.post("/admin/reserved-usernames", response_model=ReservedUsernameResponse)
async def add_reserved_username(data: ReservedUsernameCreate, current_user = Depends(get_current_user)):
    if current_user["role"] != "owner":
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    username = data.username.lower().strip()
    if not username:
        raise HTTPException(status_code=400, detail="Имя пользователя не может быть пустым")

    existing = await db.reserved_usernames.find_one({"username": username})
    if existing:
        raise HTTPException(status_code=400, detail="Имя уже в резерве")

    reserved_item = {
        "username": username,
        "comment": data.comment,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.reserved_usernames.insert_one(reserved_item)
    return ReservedUsernameResponse(**reserved_item)

@api_router.delete("/admin/reserved-usernames/{username}")
async def delete_reserved_username(username: str, current_user = Depends(get_current_user)):
    if current_user["role"] != "owner":
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    result = await db.reserved_usernames.delete_one({"username": username})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Имя не найдено в резерве")
    
    return {"message": "Имя удалено из резерва"}

# ===== Tool Routes =====

@api_router.get("/tools/resolve-url")
async def resolve_url(url: str):
    if not url:
        return {"url": ""}
        
    # Basic validation
    if not url.startswith(('http://', 'https://')):
        url = 'https://' + url
        
    # Whitelist of allowed domains for resolution
    allowed_hosts = [
        'pin.it', 
        'pinterest.com', 
        'www.pinterest.com',
        'ru.pinterest.com',
        'maps.app.goo.gl', 
        'goo.gl', 
        'yandex.ru', 
        'yandex.kz', 
        'ya.ru',
        'clck.ru'
    ]
    
    try:
        from urllib.parse import urlparse
        parsed = urlparse(url)
        domain = parsed.netloc.lower()
        if domain.startswith('www.'):
            domain = domain[4:]
            
        # Check if domain is allowed OR if it's a google maps domain
        is_allowed = any(domain == host or domain.endswith('.' + host) for host in allowed_hosts)
        
        if not is_allowed and 'google.com' in domain and '/maps' in parsed.path:
             is_allowed = True

        if not is_allowed:
             # For safety, we only resolve known shorteners or target domains
             # But if it's just a resolution, maybe we can be more lenient?
             # Let's return original URL if not allowed, effectively "skipping" resolution
             return {"url": url}

        async with aiohttp.ClientSession() as session:
            async with session.head(url, allow_redirects=True, timeout=10) as resp:
                return {"url": str(resp.url)}
    except Exception as e:
        # Fallback: return original url
        return {"url": url}


# ===== Music/Odesli Routes =====

@api_router.post("/music/resolve")
async def resolve_music_link(data: MusicResolveRequest):
    try:
        if data.mode == "auto" and data.url:
            timeout = aiohttp.ClientTimeout(total=15)
            async with aiohttp.ClientSession(timeout=timeout) as session:
                params = {"url": data.url}
                async with session.get("https://api.song.link/v1-alpha.1/links", params=params) as resp:
                    if resp.status == 200:
                        result = await resp.json()
                        
                        entities = result.get("entitiesByUniqueId", {})
                        entity_id = result.get("entityUniqueId", "")
                        
                        # Preference order for metadata (which entity to use for title/artist/cover)
                        # Odesli providers are usually simple strings like 'spotify', 'itunes', 'youtube', etc.
                        pref_providers = ["spotify", "itunes", "apple", "deezer", "tidal"]
                        best_entity_id = entity_id
                        
                        # If current is youtube or unknown, try to find a better one from available entities
                        current_provider = entities.get(entity_id, {}).get("apiProvider", "").lower()
                        if "youtube" in current_provider or not any(p in current_provider for p in pref_providers):
                            for eid, e_data in entities.items():
                                provider = e_data.get("apiProvider", "").lower()
                                if any(p in provider for p in pref_providers):
                                    best_entity_id = eid
                                    break
                        
                        entity = entities.get(best_entity_id, {})
                        links = result.get("linksByPlatform", {})

                        # Platform mapping for frontend compatibility
                        # Frontend expects: spotify, appleMusic, itunes, youtubeMusic, youtube, yandex, vk, ...
                        PLATFORM_MAP = {
                            "appleMusic": "appleMusic",
                            "itunes": "itunes",
                            "spotify": "spotify",
                            "youtube": "youtube",
                            "youtubeMusic": "youtubeMusic",
                            "yandex": "yandex",
                            "yandexMusic": "yandex",
                            "vk": "vk",
                            "deezer": "deezer",
                            "tidal": "tidal",
                            "amazonMusic": "amazonMusic",
                            "amazonStore": "amazonStore",
                            "amazon": "amazonMusic",
                            "pandora": "pandora",
                            "bandcamp": "bandcamp",
                            "soundcloud": "soundcloud",
                            "napster": "napster",
                            "anghami": "anghami",
                            "boomplay": "boomplay",
                            "audiomack": "audiomack",
                            "audius": "audius",
                            "tiktok": "tiktok"
                        }

                        platforms = []
                        for platform, link_data in links.items():
                            url = None
                            if isinstance(link_data, dict):
                                url = link_data.get("url")
                            elif isinstance(link_data, str):
                                url = link_data
                            
                            if url:
                                # Normalize platform ID using our map
                                target_platform = PLATFORM_MAP.get(platform, platform)
                                platforms.append({
                                    "platform": target_platform,
                                    "url": str(url)
                                })
                        
                        return {
                            "success": True,
                            "data": {
                                "title": entity.get("title", "Unknown"),
                                "artist": entity.get("artistName", "Unknown"),
                                "cover": entity.get("thumbnailUrl"),
                                "platforms": platforms
                            }
                        }
                    else:
                        return {"success": False, "error": "Не удалось найти трек"}
        
        return {"success": False, "error": "Необходимо указать URL"}
    except Exception as e:
        logger.error(f"Music resolve error: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return {"success": False, "error": str(e)}

# ===== Upload Routes =====

@api_router.post("/upload")
async def upload_image(
    file: UploadFile = File(...), 
    category: str = Query("others", enum=["avatars", "covers", "files", "others", "favs"]),
    current_user = Depends(get_current_user)
):
    # Determine allowed types and size limit based on category
    if category == "files":
        allowed_types = [
            "application/pdf", "application/zip", "application/x-zip-compressed",
            "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "text/plain", "application/octet-stream"
        ]
        size_limit = 100 * 1024 * 1024  # 100MB
    elif category == "favs":
        allowed_types = ["image/x-icon", "image/vnd.microsoft.icon", "image/png", "image/jpeg"]
        size_limit = 2 * 1024 * 1024 # 2MB
    else:
        allowed_types = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]
        size_limit = 10 * 1024 * 1024  # 10MB limit

    # Extension check for favicons if content_type is unreliable
    is_icon = category == "favs" and (file.filename.lower().endswith('.ico') or file.filename.lower().endswith('.png'))

    if not file.content_type or (file.content_type not in allowed_types and not is_icon):
        if category != "files" and not is_icon:
            raise HTTPException(status_code=400, detail="Файл должен быть изображением (JPEG, PNG, GIF, WEBP, ICO)")
    
    contents = await file.read()
    if len(contents) > size_limit:
        limit_mb = size_limit // (1024 * 1024)
        raise HTTPException(status_code=400, detail=f"Файл слишком большой (макс. {limit_mb}MB)")
    
    try:
        # Generate unique filename
        safe_name = Path(file.filename).name  # strip any directory components
        ext = Path(safe_name).suffix.lower() or ".jpg"
        if ext not in (".jpg", ".jpeg", ".png", ".gif", ".webp", ".ico", ".pdf", ".zip", ".doc", ".docx", ".xls", ".xlsx", ".txt"):
            ext = ".bin"
        filename = f"{uuid.uuid4()}{ext}"
        
        # Determine target directory
        target_dir = UPLOAD_DIR / category
        target_dir.mkdir(parents=True, exist_ok=True)
        
        file_path = target_dir / filename
        
        # Save file to disk
        with open(file_path, "wb") as f:
            f.write(contents)
            
        # Return relative URL with /api prefix for proper routing
        return {"url": f"/api/uploads/{category}/{filename}"}
    except Exception as e:
        logger.error(f"Image processing error: {e}")
        raise HTTPException(status_code=400, detail="Не удалось обработать изображение")

# ===== Verification Routes =====

@api_router.post("/verification/request", response_model=VerificationRequestResponse)
async def create_verification_request(
    request: VerificationRequestCreate,
    current_user: dict = Depends(get_current_user)
):
    # Check if request already exists
    # Check if request already exists
    query = {"user_id": current_user["id"], "status": "pending"}
    if request.req_type == 'brand':
        query["page_id"] = request.page_id
        
    existing = await db.verification_requests.find_one(query)
    
    if existing:
        raise HTTPException(status_code=400, detail="Заявка уже находится на рассмотрении")

    if request.req_type == 'brand':
        # Check if user is verified (or at least has one verified page which implies user verification)
        # In this system, user verification seems tied to the main page 'is_verified' flag
        # Let's check if the user has a verified page
        verified_page = await db.pages.find_one({"user_id": current_user["id"], "is_verified": True})
        if not verified_page:
             raise HTTPException(status_code=400, detail="Только верифицированные пользователи могут создавать бренды")
        
        # Check if target page exists and belongs to user
        if not request.page_id:
             raise HTTPException(status_code=400, detail="Не указана страница для бренда")
        
        target_page = await db.pages.find_one({"id": request.page_id, "user_id": current_user["id"]})
        if not target_page:
             raise HTTPException(status_code=404, detail="Страница не найдена")

        # Update page brand status
        await db.pages.update_one({"id": request.page_id}, {"$set": {"brand_status": "pending"}})

    new_request = request.dict()
    new_request["id"] = str(uuid.uuid4())
    new_request["user_id"] = current_user["id"]
    new_request["user_email"] = current_user["email"]
    new_request["status"] = "pending"
    new_request["created_at"] = datetime.now().isoformat()

    await db.verification_requests.insert_one(new_request)

    # If it's a personal verification request, update the user status to pending
    if request.req_type == 'personal':
        await db.users.update_one(
            {"id": current_user["id"]},
            {"$set": {"verificationStatus": "pending"}}
        )
    
    # Create notification for admin (optional, effectively just logging here or could be a real notification if admins had a unified inbox)
    logger.info(f"New verification request from {current_user['email']}")

    return new_request

@api_router.get("/admin/verification/requests")
async def get_verification_requests(current_admin: dict = Depends(get_current_admin)):
    requests = await db.verification_requests.find({}, {"_id": 0}).sort("created_at", 1).to_list(100)
    # Ensure email and page username/link is present
    for req in requests:
        user = await db.users.find_one({"id": req["user_id"]})
        if user:
            req["user_email"] = user.get("email")
            req["user_is_verified"] = user.get("is_verified", False)
        
        if req.get("req_type") == "brand" and req.get("page_id"):
            page = await db.pages.find_one({"id": req["page_id"]})
            if page:
                req["page_username"] = page.get("username")
                req["page_is_verified"] = page.get("is_verified", False)
        else:
            # Personal: Find the main page or the first page
            page = await db.pages.find_one({"user_id": req["user_id"], "is_main_page": True})
            if not page:
                pages = await db.pages.find({"user_id": req["user_id"]}).sort("created_at", 1).to_list(1)
                if pages:
                    page = pages[0]
            if page:
                req["page_username"] = page.get("username")
                req["page_is_verified"] = page.get("is_verified", False)
    return requests

@api_router.post("/admin/verification/{request_id}/approve")
async def approve_verification_request(request_id: str, current_admin: dict = Depends(get_current_admin)):
    req = await db.verification_requests.find_one({"id": request_id})
    if not req:
        raise HTTPException(status_code=404, detail="Заявка не найдена")
    
    await db.verification_requests.update_one(
        {"id": request_id},
        {"$set": {"status": "approved"}}
    )
    
    if req.get('req_type') == 'brand':
        # Approve specific Brand Page
        target_page = await db.pages.find_one({"id": req["page_id"]})
        page_display_name = target_page.get("name", req.get("full_name", "N/A")) if target_page else req.get("full_name", "N/A")
        
        await db.pages.update_one(
            {"id": req["page_id"]},
            {"$set": {"is_verified": True, "is_brand": True, "brand_status": "verified"}}
        )
        message = f"Ваша заявка на статус бренда для страницы {page_display_name} одобрена!"
    else:
        # Personal: Approve Main Page ONLY
        main_page = await db.pages.find_one({"user_id": req["user_id"], "is_main_page": True})
        if not main_page:
            # Fallback to the first page if none marked as main
            pages = await db.pages.find({"user_id": req["user_id"]}).sort("created_at", 1).to_list(1)
            if pages:
                main_page = pages[0]
                # Mark it as main page for future
                await db.pages.update_one({"id": main_page["id"]}, {"$set": {"is_main_page": True}})
        
        if main_page:
            await db.pages.update_one(
                {"id": main_page["id"]},
                {"$set": {"is_verified": True}}
            )
            # Update user status
            await db.users.update_one(
                {"id": req["user_id"]},
                {"$set": {"is_verified": True, "verificationStatus": "approved"}}
            )
            message = "Ваша заявка на верификацию одобрена! Галочка появится на вашей главной странице."
        else:
            await db.users.update_one({"id": req["user_id"]}, {"$set": {"is_verified": True, "verificationStatus": "approved"}})
            message = "Ваш аккаунт верифицирован."

    notification = {
        "id": str(uuid.uuid4()),
        "user_id": req["user_id"],
        "type": "verification",
        "message": message,
        "read": False,
        "created_at": datetime.now().isoformat()
    }
    await db.notifications.insert_one(notification)
    
    # Notify by page_id for live tick update
    await broadcast_by_page_id(req.get("page_id")) if req.get("page_id") else None
    
    return {"status": "approved"}

@api_router.post("/admin/verification/{request_id}/reject")
async def reject_verification_request(request_id: str, rejection: RejectionRequest, current_admin: dict = Depends(get_current_admin)):
    req = await db.verification_requests.find_one({"id": request_id})
    if not req:
        raise HTTPException(status_code=404, detail="Заявка не найдена")
    
    await db.verification_requests.update_one(
        {"id": request_id},
        {"$set": {"status": "rejected", "rejection_reason": rejection.reason}}
    )

    if req.get('req_type') == 'brand':
        await db.pages.update_one(
            {"id": req["page_id"]},
            {"$set": {"brand_status": "rejected"}}
        )
        message = f"Ваша заявка на статус бренда отклонена. Причина: {rejection.reason}"
    else:
        await db.users.update_one(
            {"id": req["user_id"]},
            {"$set": {"verificationStatus": "rejected"}}
        )
        message = f"Ваша заявка на верификацию отклонена. Причина: {rejection.reason}"

    notification = {
        "id": str(uuid.uuid4()),
        "user_id": req["user_id"],
        "type": "verification",
        "message": message,
        "read": False,
        "created_at": datetime.now().isoformat()
    }
    await db.notifications.insert_one(notification)
    
    # Notify by page_id for rejection
    await broadcast_by_page_id(req.get("page_id")) if req.get("page_id") else None

    return {"status": "rejected"}

@api_router.post("/admin/verification/{request_id}/cancel")
async def cancel_verification_request(request_id: str, rejection: RejectionRequest, current_admin: dict = Depends(get_current_admin)):
    req = await db.verification_requests.find_one({"id": request_id})
    if not req:
        raise HTTPException(status_code=404, detail="Заявка не найдена")
    
    # Determine if it's a main page revoke or brand revoke
    target_page = None
    if req.get('req_type') == 'brand':
        target_page = await db.pages.find_one({"id": req["page_id"]})
    else:
        # For personal, it's typically the main page
        target_page = await db.pages.find_one({"user_id": req["user_id"], "is_main_page": True})
        if not target_page:
            # Fallback
            pages = await db.pages.find({"user_id": req["user_id"]}).sort("created_at", 1).to_list(1)
            if pages: target_page = pages[0]

    # Мягкая проверка — не блокируем отзыв, просто логируем
    is_actually_verified = target_page.get("is_verified", False) if target_page else False
    if not is_actually_verified:
        user = await db.users.find_one({"id": req["user_id"]})
        if user and not user.get("is_verified", False):
            # Не блокируем — разрешаем обновить статус записи для синхронизации
            pass

    await db.verification_requests.update_one(
        {"id": request_id},
        {"$set": {"status": "cancelled", "rejection_reason": rejection.reason}}
    )

    # If it's a personal verification revocation, also cancel all approved brand requests of the same user
    if req.get('req_type') == 'personal':
        await db.verification_requests.update_many(
            {"user_id": req["user_id"], "req_type": "brand", "status": "approved"},
            {"$set": {"status": "cancelled", "rejection_reason": "Автоматическая отмена при отзыве основной верификации"}}
        )

    base_message = "Ваша верификация была отозвана."
    if req.get('req_type') == 'brand' and target_page:
        page_name = target_page.get("name", "N/A")
        base_message = f"Ваша верификация страницы {page_name} была отозвана."

    reason_text = f"\nПричина: {rejection.reason}" if rejection.reason and rejection.reason.strip() else ""
    message = base_message + reason_text

    if req.get('req_type') == 'brand' and req.get('page_id'):
        # Brand: Revoke specific page ONLY
        await db.pages.update_one(
            {"id": req["page_id"]},
            {"$set": {"is_verified": False, "brand_status": "rejected"}}
        )
    else:
        # Personal/Main: CASCADING REVOKE
        # 1. Update USER object
        await db.users.update_one(
            {"id": req["user_id"]},
            {"$set": {"is_verified": False, "verificationStatus": "cancelled"}}
        )
        # 2. Update ALL pages of the user (including brand pages)
        await db.pages.update_many(
            {"user_id": req["user_id"]},
            {"$set": {"is_verified": False, "is_brand": False, "brand_status": "rejected"}}
        )

    notification = {
        "id": str(uuid.uuid4()),
        "user_id": req["user_id"],
        "type": "verification",
        "message": message,
        "read": False,
        "created_at": datetime.now().isoformat()
    }
    await db.notifications.insert_one(notification)
    
    # Notify on ALL user pages (cascading revoke)
    user_pages = await db.pages.find({"user_id": req["user_id"]}, {"username": 1}).to_list(100)
    for p in user_pages:
        await manager.notify_page_update(p["username"])
        
    return {"status": "revoked"}

@api_router.post("/admin/verification/{request_id}/resume")
async def resume_verification_request(request_id: str, current_admin: dict = Depends(get_current_admin)):
    req = await db.verification_requests.find_one({"id": request_id})
    if not req:
        raise HTTPException(status_code=404, detail="Заявка не найдена")
    
    await db.verification_requests.update_one(
        {"id": request_id},
        {"$set": {
            "status": "pending",
            "rejection_reason": None
        }}
    )
    
    return {"status": "success", "message": "Заявка возобновлена"}

@api_router.delete("/admin/verification/{request_id}")
async def delete_verification_request(request_id: str, current_admin: dict = Depends(get_current_admin)):
    result = await db.verification_requests.delete_one({"id": request_id})
    # Compatibility with both mock_db (returns bool) and Motor (returns DeleteResult)
    deleted = result if isinstance(result, bool) else (getattr(result, 'deleted_count', 0) > 0)
    
    if not deleted:
        raise HTTPException(status_code=404, detail="Заявка не найдена")
    return {"status": "deleted"}

@api_router.post("/admin/users/{user_id}/verify")
async def grant_direct_verification(user_id: str, current_admin: dict = Depends(get_current_admin)):
    # 1. Update user collection
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
        
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"is_verified": True}}
    )

    # 2. Update the Main Page of the user
    main_page = await db.pages.find_one({"user_id": user_id, "is_main_page": True})
    if not main_page:
        # Fallback to the first page
        pages = await db.pages.find({"user_id": user_id}).sort("created_at", 1).to_list(1)
        if pages:
            main_page = pages[0]
            await db.pages.update_one({"id": main_page["id"]}, {"$set": {"is_main_page": True}})
    
    page_username = "N/A"
    if main_page:
        await db.pages.update_one(
            {"id": main_page["id"]},
            {"$set": {"is_verified": True}}
        )
        page_username = main_page.get("username", "N/A")
    
    # 3. Handle verification_requests (for sync with dashboard)
    existing_req = await db.verification_requests.find_one({"user_id": user_id, "status": "pending", "req_type": "personal"})
    if existing_req:
        await db.verification_requests.update_one(
            {"id": existing_req["id"]},
            {"$set": {"status": "approved"}}
        )
    else:
        # Create a proxy request record so it can be revoked later
        new_request = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "user_email": user.get("email"),
            "page_username": page_username,
            "req_type": "personal",
            "status": "approved",
            "created_at": datetime.now().isoformat()
        }
        await db.verification_requests.insert_one(new_request)

    notification = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "type": "verification",
        "message": "Ваш аккаунт верифицирован администратором.",
        "read": False,
        "created_at": datetime.now().isoformat()
    }
    await db.notifications.insert_one(notification)
    
    # Notify on main page for direct verification
    if main_page:
        await manager.notify_page_update(main_page["username"])
        
    return {"status": "verified"}

class NotificationCampaign(BaseModel):
    id: str
    message: str
    target_type: str  # all, selected, single
    created_at: str
    total_recipients: int
    read_count: int = 0
    
@api_router.post("/admin/notifications/send")
async def send_admin_notification(notification_req: NotificationRequest, current_admin: dict = Depends(get_current_admin)):
    users_to_notify = []
    
    # 1. Select Users
    if notification_req.all_users:
        # Fetch ALL users
        all_users = await db.users.find({}).to_list(None)
        users_to_notify = [u["id"] for u in all_users]
        target_type = "all"
    elif notification_req.user_ids:
        users_to_notify = notification_req.user_ids
        target_type = "selected"
    elif notification_req.emails:
        # Resolving emails to IDs
        found_users = await db.users.find({"email": {"$in": notification_req.emails}}).to_list(None)
        users_to_notify = [u["id"] for u in found_users]
        target_type = "single"

    if not users_to_notify:
        return {"status": "error", "message": "No users found"}

    timestamp = datetime.now().isoformat()
    campaign_id = str(uuid.uuid4())
    
    # 2. Create Campaign Record
    campaign = {
        "id": campaign_id,
        "message": notification_req.message,
        "target_type": target_type,
        "recipient_ids": users_to_notify, # Store who was targeted
        "created_at": timestamp,
        "total_recipients": len(users_to_notify)
    }
    await db.notification_campaigns.insert_one(campaign)

    # 3. Create Individual Notifications linked to Campaign
    notifications = [{
        "id": str(uuid.uuid4()),
        "user_id": uid,
        "campaign_id": campaign_id, # Link to campaign
        "type": "info",
        "message": notification_req.message,
        "read": False,
        "created_at": timestamp
    } for uid in users_to_notify]
    
    await db.notifications.insert_many(notifications)
    return {"status": "sent", "count": len(notifications), "campaign_id": campaign_id}

@api_router.get("/admin/campaigns")
async def get_campaigns(current_admin: dict = Depends(get_current_admin)):
    campaigns = await db.notification_campaigns.find({}).sort("created_at", -1).to_list(50)
    
    # Enrich with read counts dynamically
    results = []
    for camp in campaigns:
        # Count read notifications for this campaign
        read_count = await db.notifications.count_documents({"campaign_id": camp["id"], "read": True})
        camp["read_count"] = read_count
        results.append(camp)
        
    return results

@api_router.get("/admin/campaigns/{campaign_id}")
async def get_campaign_details(campaign_id: str, current_admin: dict = Depends(get_current_admin)):
    campaign = await db.notification_campaigns.find_one({"id": campaign_id})
    if not campaign:
        raise HTTPException(status_code=404, detail="Рассылка не найдена")
        
    # Get all notifications for this campaign to see status
    notifications = await db.notifications.find({"campaign_id": campaign_id}).to_list(None)
    
    # Map status by user_id
    status_map = {n["user_id"]: n["read"] for n in notifications}
    
    # Get user details for recipients
    recipients = []
    if "recipient_ids" in campaign:
        users = await db.users.find({"id": {"$in": campaign["recipient_ids"]}}).to_list(None)
        for u in users:
            recipients.append({
                "id": u["id"],
                "email": u["email"],
                "username": u.get("username"),
                "read": status_map.get(u["id"], False)
            })
            
    return {
        "campaign": campaign,
        "recipients": recipients
    }


# ===== Notification Routes =====

@api_router.get("/notifications", response_model=List[NotificationResponse])
async def get_notifications(current_user: dict = Depends(get_current_user)):
    notifications = await db.notifications.find({"user_id": current_user["id"]}).sort("created_at", -1).to_list(50)
    return notifications

@api_router.post("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, current_user: dict = Depends(get_current_user)):
    await db.notifications.update_one(
        {"id": notification_id, "user_id": current_user["id"]},
        {"$set": {"read": True}}
    )
    return {"status": "ok"}
    
@api_router.delete("/notifications")
async def delete_all_notifications(current_user: dict = Depends(get_current_user)):
    await db.notifications.delete_many({"user_id": current_user["id"]})
    return {"status": "ok"}


@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"Request: {request.method} {request.url}")
    try:
        response = await call_next(request)
        logger.info(f"Response: {response.status_code}")
        return response
    except Exception as e:
        logger.error(f"Request Error: {e}")
        import traceback
        raise

# ===== Support Bot Admin Routes =====

@api_router.get("/admin/support", response_model=List[SupportQAResponse])
async def get_support_qa(current_admin: dict = Depends(get_current_admin)):
    cursor = db.support_qa.find({})
    qas = await cursor.to_list(length=1000)
    # Ensure id and created_at exist for model validation
    results = []
    for qa in qas:
         if "id" not in qa: qa["id"] = "legacy_" + str(uuid.uuid4())[:8]
         if "created_at" not in qa: qa["created_at"] = datetime.now(timezone.utc).isoformat()
         results.append(SupportQAResponse(**qa))
    return results

@api_router.post("/admin/support", response_model=SupportQAResponse)
async def create_support_qa(qa: SupportQACreate, current_user: dict = Depends(get_current_owner)):
    doc = qa.dict()
    doc["id"] = str(uuid.uuid4())
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.support_qa.insert_one(doc)
    return SupportQAResponse(**doc)

@api_router.patch("/admin/support/{qa_id}", response_model=SupportQAResponse)
async def update_support_qa(qa_id: str, updates: SupportQAUpdate, current_user: dict = Depends(get_current_owner)):
    update_data = {k: v for k, v in updates.dict(exclude_unset=True).items() if v is not None}
    if update_data:
        await db.support_qa.update_one({"id": qa_id}, {"$set": update_data})
    
    doc = await db.support_qa.find_one({"id": qa_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Q&A not found")
    return SupportQAResponse(**doc) 

@api_router.delete("/admin/support/{qa_id}")
async def delete_support_qa(qa_id: str, current_user: dict = Depends(get_current_owner)):
    result = await db.support_qa.delete_one({"id": qa_id})
    if result.deleted_count == 0:
         raise HTTPException(status_code=404, detail="Q&A not found")
    return {"message": "Deleted"}


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://inbio.one",
        "https://www.inbio.one",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*", "X-Admin-Password"],
)

@api_router.get("/admin/settings", response_model=GlobalSettings)
async def get_admin_settings(current_user: dict = Depends(get_current_owner)):
    settings_doc = await db.settings.find_one({"_id": "global_config"})
    if not settings_doc:
        return GlobalSettings()
    return GlobalSettings(**settings_doc)

@api_router.patch("/admin/settings", response_model=GlobalSettings)
async def update_admin_settings(
    settings: GlobalSettings, 
    current_user: dict = Depends(get_current_owner)
):
    if settings.welcome_modal_duration < 1 or settings.welcome_modal_duration > 60:
         raise HTTPException(status_code=400, detail="Длительность должна быть от 1 до 60 секунд")
         
    await db.settings.update_one(
        {"_id": "global_config"},
        {"$set": settings.dict()},
        upsert=True
    )
    return settings

@api_router.get("/settings/public", response_model=GlobalSettings)
async def get_public_settings():
    settings_doc = await db.settings.find_one({"_id": "global_config"})
    if not settings_doc:
        return GlobalSettings() # Default
    # We can filter sensitive settings here if needed later
    return GlobalSettings(**settings_doc)

# Explicit file serving endpoint for uploads
from fastapi.responses import FileResponse
import mimetypes

@api_router.get("/uploads/{category}/{filename}")
async def serve_upload(category: str, filename: str):
    file_path = UPLOAD_DIR / category / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    # Determine content type
    content_type, _ = mimetypes.guess_type(str(file_path))
    if not content_type:
        content_type = "application/octet-stream"
    
    return FileResponse(
        path=str(file_path),
        media_type=content_type,
        filename=filename
    )

@api_router.get("/uploads/{category}/{subcategory}/{filename}")
async def serve_upload_nested(category: str, subcategory: str, filename: str):
    file_path = UPLOAD_DIR / category / subcategory / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    content_type, _ = mimetypes.guess_type(str(file_path))
    if not content_type:
        content_type = "application/octet-stream"
    
    return FileResponse(
        path=str(file_path),
        media_type=content_type,
        filename=filename
    )

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "db": "mock" if USE_MOCK_DB else "mongo"}


app.include_router(api_router)

# ===== SEO & SPA Routing =====

@app.get("/")
async def serve_landing_page(request: Request):
    return await serve_user_page(request, "landing_page_default")

@app.get("/analytics/{username}")
async def serve_analytics_page(request: Request, username: str):
    return await serve_user_page(request, username)

@app.get("/{username}")
async def serve_user_page(request: Request, username: str):
    # Skip if it's an API route or static file
    if username.startswith("api") or "." in username:
        return Response(status_code=404)
        
    page_data = await get_full_page_data_internal(username.lower())
    
    # Try to find index.html in likely locations
    possible_index_paths = [
        Path("/frontend/build/index.html"),                         # Docker volume mount
        ROOT_DIR.parent / "frontend" / "build" / "index.html",     # Local dev
        ROOT_DIR.parent / "frontend" / "public" / "index.html",    # Fallback
        Path("/usr/share/nginx/html/index.html")                    # Nginx default
    ]
    
    index_path = None
    for p in possible_index_paths:
        if p.exists():
            index_path = p
            break
            
    if not index_path:
        # If no index.html template is found, we cannot inject SEO tags.
        # However, we shouldn't just 404 if it's the landing page.
        logger.error(f"SEO Injection failed: index.html not found in {possible_index_paths}")
        return Response(
            content="<html><body><h1>System Error</h1><p>Frontend template (index.html) not found. Check Docker volumes.</p></body></html>",
            status_code=500,
            media_type="text/html"
        )

    try:
        html_content = index_path.read_text(encoding='utf-8')
        
        # Default values
        title = "InBio.one"
        description = "1bio - Ссылка в био для любых целей"
        favicon = "/api/uploads/logo/favicon.ico"
        og_image = "/api/uploads/files/og-preview/default.jpg"
        
        if page_data:
            page = page_data["page"]
            seo = page.get("seoSettings") or {}
            
            title = seo.get("title") or page.get("name") or title
            if title and not title.endswith("InBio.one"):
                title = f"{title} | InBio.one"
                
            description = seo.get("description") or page.get("bio") or description
            
            if seo.get("favicon"):
                favicon = seo.get("favicon")
            elif page.get("avatar"):
                favicon = page.get("avatar")
                
            if seo.get("og_image"):
                og_image = seo.get("og_image")
            elif page.get("cover"):
                og_image = page.get("cover")
            elif page.get("avatar"):
                og_image = page.get("avatar")

        # Cleanup paths
        def build_url(path):
            if not path: return ""
            if path.startswith(("http://", "https://")): return path
            # Assume it's an upload path
            base = str(request.base_url).rstrip("/")
            if not path.startswith("/"): path = "/" + path
            return f"{base}{path}"

        # Inject
        html_content = html_content.replace("__SEO_TITLE__", title)
        html_content = html_content.replace("__SEO_DESCRIPTION__", description)
        html_content = html_content.replace("__SEO_FAVICON__", build_url(favicon))
        html_content = html_content.replace("__SEO_OG_IMAGE__", build_url(og_image))
        
        return Response(content=html_content, media_type="text/html")
        
    except Exception as e:
        logger.error(f"SEO Injection error: {e}")
        return Response(status_code=500)

# Mount static files
app.mount("/api/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()