<h1 align="center" id="title">Click.uz Integration with NodeJS + Telegram Bot</h1>

<p align="center"><img src="https://socialify.git.ci/samarbadriddin0v/click-uz-integration-nodejs/image?language=1&amp;owner=1&amp;name=1&amp;stargazers=1&amp;theme=Light" alt="project-image"></p>

<p id="description">Click.uz to'lov tizimi va Telegram bot bilan to'liq integratsiya. Kitoblar savdosi uchun mo'ljallangan backend API. Har bir to'lov haqida Telegram orqali xabarnoma.</p>

## 🚀 Xususiyatlar

- ✅ Click.uz to'lov integratsiyasi
- 📚 Kitoblar boshqaruvi (CRUD)
- 🛒 Buyurtmalar tizimi
- 📊 Statistika va hisobotlar
- 📱 Telegram bot xabarnomalar
- 🔐 Signature tekshirish
- 💳 To'lov holatlarini kuzatish

## 📋 API Endpoints

### Books
- `GET /api/books` - Barcha kitoblar
- `POST /api/books` - Yangi kitob qo'shish
- `PUT /api/books/:bookId` - Kitobni yangilash
- `DELETE /api/books/:bookId` - Kitobni o'chirish

### Orders
- `POST /api/orders` - Yangi buyurtma yaratish
- `GET /api/orders` - Barcha buyurtmalar
- `GET /api/orders/:orderId` - Buyurtma ma'lumotlari
- `GET /api/orders/statistics` - Statistika

### Click.uz Webhooks
- `POST /api/click/prepare` - To'lovni tayyorlash
- `POST /api/click/complete` - To'lovni tasdiqlash

## 🛠️ Installation Steps:

<p>1. Install packages</p>

```bash
npm install
```

<p>2. Setup .env file</p>

```env
PORT=9999
CLIENT_URL=https://your-frontend.com
MONOGO_URI=your_mongodb_uri
MONGODB_USER=your_db_user
MONGODB_PASS=your_db_password

TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id

CLICK_SECRET_KEY=your_secret_key
CLICK_SERVICE_ID=your_service_id
CLICK_MERCHANT_ID=your_merchant_id
CLICK_MERCHANT_USER_ID=your_user_id
CLICK_CHECKOUT_LINK=https://my.click.uz
```

<p>3. Start the app</p>

```bash
npm start
# or development mode
npm run dev
```

## 📱 Telegram Bot Setup

1. [@BotFather](https://t.me/botfather) dan yangi bot yarating
2. Bot token oling
3. Guruh/kanal yarating va botni admin qiling
4. Chat ID oling (`@userinfobot` dan)
5. `.env` fayliga qo'shing

## 💳 Click.uz Setup

1. [Click.uz merchant panel](https://my.click.uz) da ro'yxatdan o'ting
2. Service yarating
3. Service ID, Secret Key, Merchant ID olish
4. Webhook URL sozlang: `https://your-domain.com/api/click/`
5. `.env` fayliga qo'shing

## 📊 Telegram Notifications

To'lovlar haqida avtomatik xabarnomalar:

- ⏳ To'lov tayyorlanmoqda (Prepare)
- ✅ To'lov muvaffaqiyatli (Complete)
- ❌ To'lov bekor qilindi (Cancel)
- 📚 Sotib olingan kitoblar ro'yxati
- 💰 Jami summa

## 🧪 Testing

```bash
# Test script
node test-click.js

# Test with Postman
# Import postman_collection.json
```

## 💻 Built with

Technologies used in the project:

*   NodeJS
*   ExpressJS  
*   MongoDB
*   Telegram Bot API
*   Click.uz Payment Gateway

## 📝 License

MIT
