# Запуск Inbio.one локально

## Текущий статус
✅ **Приложение успешно запущено и работает локально**

## URL доступа
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Swagger Docs**: http://localhost:8000/docs

## Как запустить

### 1. Backend
```bash
cd backend
uvicorn server:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Frontend
```bash
cd frontend
npm start
```

## Переменные окружения

### Backend (.env)
```
# Database Credentials
MONGO_USER=admin
MONGO_PASSWORD=admin123456

# Security & Sessions
JWT_SECRET_KEY=super_secret_jwt_key_for_local_development_123456789

# Google OAuth 2.0 (нужно получить в Google Cloud Console)
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Telegram Bots (получить у @BotFather) - временно отключены
TELEGRAM_BOT_TOKEN=
SUPPORT_BOT_TOKEN=
SUPPORT_OPERATOR_ID=

# Third-party APIs
RESEND_API_KEY=re_your_resend_api_key
OWNER_EMAIL=your-email@example.com
BASE_URL=http://localhost:3000
```

### Frontend (frontend/.env)
```
REACT_APP_BACKEND_URL=http://localhost:8000
```

## Функционал

### ✅ Работает
- Загрузка фронтенда
- API endpoints
- Swagger документация
- Mock база данных
- Создание статических файлов

### ⚠️ Требует настройки
- Google OAuth авторизация
- Telegram боты
- Отправка email
- MongoDB база данных

## Структура приложения
- **Backend**: Python FastAPI с mock базой данных
- **Frontend**: React с TypeScript
- **База данных**: Mock JSON (для разработки)

## Следующие шаги
1. Настроить Google OAuth в Google Cloud Console
2. Получить токены Telegram ботов
3. Установить MongoDB для продакшн
4. Настроить Resend для email

## Полезные команды
```bash
# Проверить здоровье API
curl http://localhost:8000/api/health

# Swagger документация
open http://localhost:8000/docs


# Остановить все процессы
taskkill /F /IM node.exe
taskkill /F /IM python.exe
```


## 🧹 Очистка проекта
Удалены все упоминания Emergent из проекта:
- **Backend**: Заменены URL и названия сервисов
- **Frontend**: Удалены ссылки и стили Emergent
- **Конфигурация**: Обновлены URL для локальной разработки
- **Тесты**: Изменены URL на localhost

## 📁 Структура проекта (очищенная)
```
inbio.one-main/
├── .env                    # Переменные окружения
├── .gitconfig             # Конфигурация Git
├── .gitignore             # Правила Git
├── Caddyfile              # Конфигурация Caddy сервера
├── README_LOCAL.md        # Документация (этот файл)
├── backend/               # Python FastAPI backend
│   ├── server.py          # Основной файл сервера
│   ├── requirements.txt   # Зависимости Python
│   ├── uploads/           # Загруженные файлы
│   └── ...
├── frontend/              # React frontend
│   ├── src/              # Исходный код
│   ├── public/           # Статические файлы
│   ├── package.json      # Зависимости Node.js
│   └── ...
├── backend_test.py        # Тесты backend
├── docker-compose.yml     # Docker конфигурация
└── local_db.json         # Mock база данных
```

## 🗑️ Удаленные файлы
- **README.md** - пустой файл
- **dep.md**, **help_dep.md** - документация по деплою
- **implementation_plan.md** - план реализации
- **design_guidelines.json** - гайдлайны дизайна
- **test_result.md** - результаты тестов
- **frontend/src/utils/errorReporting.js** - система отчетов об ошибках
- **test_reports/**, **tests/**, **memory/** - папки с тестами
- **frontend/plugins/** - плагины разработки
- **frontend/public/test-api.html** - тестовый API файл
- **cookie.txt**, **server.log** - временные файлы
- **package-lock.json** - локальный lock файл
