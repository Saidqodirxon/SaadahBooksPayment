# 🚀 Click.uz Payment + Telegram Bot - To'liq Qo'llanma

## ✅ Nima amalga oshirildi:

### 1. **Database Models**
- ✅ `Product` (Kitoblar) - title, price, author, description, image, category, pages, language
- ✅ `Transaction` - books[], customerName, customerEmail, customerPhone, amount, state, provider
- ❌ `User` - O'chirildi (kerak emas)

### 2. **Backend Services**
- ✅ `click.service.js` - Click.uz payment integration
- ✅ `telegram.service.js` - Telegram bot xabarnomalar
- ✅ `order.service.js` - Buyurtmalar va statistika

### 3. **API Endpoints**

#### Books (Kitoblar)
```
GET    /api/books              - Barcha kitoblar
POST   /api/books              - Yangi kitob qo'shish
PUT    /api/books/:bookId      - Kitobni yangilash
DELETE /api/books/:bookId      - Kitobni o'chirish
```

#### Orders (Buyurtmalar)
```
POST   /api/orders             - Yangi buyurtma yaratish
GET    /api/orders             - Barcha buyurtmalar
GET    /api/orders/statistics  - Statistika
GET    /api/orders/:orderId    - Buyurtma ma'lumotlari
```

#### Click.uz Webhooks
```
POST   /api/click/prepare      - To'lovni tayyorlash
POST   /api/click/complete     - To'lovni tasdiqlash
```

### 4. **Telegram Bot Integration**
- ✅ To'lov tayyorlanayotganda xabar
- ✅ To'lov muvaffaqiyatli bo'lganda xabar
- ✅ To'lov bekor qilinganda xabar
- ✅ Sotib olingan kitoblar ro'yxati
- ✅ Kunlik hisobotlar

## 📋 Frontend bilan bog'lash

### 1. Kitoblarni ko'rsatish

```javascript
// Kitoblarni olish
const response = await fetch('http://localhost:9999/api/books')
const data = await response.json()
console.log(data.books) // Kitoblar ro'yxati
```

### 2. Buyurtma yaratish

```javascript
// Buyurtma yaratish
const orderData = {
  books: ['book_id_1', 'book_id_2'], // Kitoblar ID lari
  customerName: 'Said Qodirov',
  customerEmail: 'said@example.com',
  customerPhone: '+998901234567'
}

const response = await fetch('http://localhost:9999/api/orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(orderData)
})

const result = await response.json()
console.log(result.transaction._id) // Transaction ID
console.log(result.totalAmount) // Jami summa
```

### 3. Click.uz to'lovga yo'naltirish

```javascript
// Click.uz to'lov URL yaratish
const paymentUrl = `https://my.click.uz/services/pay?` +
  `service_id=83510&` +
  `merchant_id=46304&` +
  `merchant_user_id=64634&` +
  `amount=${totalAmount}&` +
  `transaction_param=${transactionId}&` +
  `return_url=${window.location.origin}/success&` +
  `merchant_trans_id=${transactionId}`

// To'lov sahifasiga o'tish
window.location.href = paymentUrl
```

### 4. To'lov natijasini tekshirish

```javascript
// Success sahifada
const urlParams = new URLSearchParams(window.location.search)
const transactionId = urlParams.get('merchant_trans_id')

// Buyurtma holatini tekshirish
const response = await fetch(`http://localhost:9999/api/orders/${transactionId}`)
const order = await response.json()

if (order.state === 2) {
  // To'lov muvaffaqiyatli
  console.log('Sotib olingan kitoblar:', order.books)
}
```

## 🧪 Test qilish

### 1. Telegram Bot Test
```bash
node test-telegram.js
```
Natija: Telegram guruhingizga 5 ta test xabar keladi

### 2. Click.uz Test
```bash
node test-click.js
```
Natija: Click.uz prepare va complete testlari

### 3. Postman bilan test
1. `postman_collection.json` faylini import qiling
2. Barcha endpointlarni test qiling

## 📱 Telegram'da qanday xabarlar keladi:

### To'lov tayyorlanayotganda:
```
⏳ Yangi to'lov tayyorlanmoqda...

💳 Transaction ID: test_123456
💰 Summa: 75,000 so'm

📚 Kitoblar:
📖 O'zbek tili grammatikasi
📖 Matematika asoslari

⏰ Kutilmoqda...
```

### To'lov muvaffaqiyatli:
```
🎉 Yangi to'lov muvaffaqiyatli!

💳 Transaction ID: test_123456
💰 Summa: 75,000 so'm
📅 Sana: 02.10.2025, 14:30

📚 Sotib olingan kitoblar:
📖 O'zbek tili grammatikasi - 45,000 so'm
📖 Matematika asoslari - 30,000 so'm

✅ Holat: To'landi
🔗 Provider: click
```

### To'lov bekor qilindi:
```
❌ To'lov bekor qilindi

💳 Transaction ID: test_123456
💰 Summa: 75,000 so'm
📅 Bekor qilingan sana: 02.10.2025, 14:35

🔴 Holat: Bekor qilindi
```

## 🎯 Frontend uchun kerakli parametrlar:

### Environment Variables
```env
# React.js
REACT_APP_API_URL=http://localhost:9999/api
REACT_APP_CLICK_SERVICE_ID=83510
REACT_APP_CLICK_MERCHANT_ID=46304
REACT_APP_CLICK_USER_ID=64634

# Vue.js
VUE_APP_API_URL=http://localhost:9999/api
VUE_APP_CLICK_SERVICE_ID=83510
VUE_APP_CLICK_MERCHANT_ID=46304
VUE_APP_CLICK_USER_ID=64634

# Next.js
NEXT_PUBLIC_API_URL=http://localhost:9999/api
NEXT_PUBLIC_CLICK_SERVICE_ID=83510
NEXT_PUBLIC_CLICK_MERCHANT_ID=46304
NEXT_PUBLIC_CLICK_USER_ID=64634
```

## 🔐 Xavfsizlik

1. **.env faylni himoyalang**
   - Git'ga commit qilmang
   - `.gitignore` da bo'lsin

2. **CORS sozlamalari**
   - `CLIENT_URL` ni to'g'ri sozlang
   - Production da faqat o'z domeningizni ruxsat bering

3. **Signature tekshirish**
   - Har bir Click.uz so'rovida signature tekshiriladi
   - Noto'g'ri signature rad etiladi

## 📊 Statistika API

```javascript
// Kunlik statistika
const response = await fetch('http://localhost:9999/api/orders/statistics')
const stats = await response.json()

console.log(stats)
// {
//   totalRevenue: 450000,
//   totalBooks: 12,
//   totalCustomers: 5,
//   successfulPayments: 8,
//   canceledPayments: 2,
//   pendingPayments: 1
// }
```

## 🚀 Production'ga chiqarish

1. **MongoDB Atlas** - Production database
2. **Railway / Render / Vercel** - Backend hosting
3. **Netlify / Vercel** - Frontend hosting
4. **Domain sozlash** - SSL sertifikat
5. **Click.uz webhook URL** - `https://your-domain.com/api/click/`
6. **CORS sozlash** - Production domain

## 📞 Qo'shimcha yordam

Agar savol bo'lsa:
1. `FRONTEND_INTEGRATION.md` faylini o'qing
2. `postman_collection.json` dan foydalaning
3. Test scriptlarni ishlatib ko'ring

## ✅ Keyingi qadamlar:

1. ✅ Backend tayyor
2. ✅ Telegram bot ishlayapti
3. ⏳ Frontend yaratish kerak
4. ⏳ Click.uz bilan real test
5. ⏳ Production'ga deploy

**Omad! 🎉**
