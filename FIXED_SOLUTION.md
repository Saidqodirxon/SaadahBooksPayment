# ✅ Click.uz Integration - TO'LIQ YECHILGAN

## 🎯 Muammolar va Yechimlar

### ❌ Eski Muammo:
Click.uz webhook'lari `merchant_trans_id` ni MongoDB `_id` sifatida qabul qilmayotgan edi va yangi transaction yaratmoqda edi.

### ✅ Yangi Yechim:
1. **Frontend** `/api/payments/create` orqali transaction yaratadi va `orderId` (_id) oladi
2. **Click.uz** `merchant_trans_id` sifatida shu `orderId` ni ishlatadi
3. **Backend** `merchant_trans_id` orqali MongoDB'da transaction topadi va yangilaydi

---

## 🔧 To'liq Tuzatilgan Kod

### 1. Click Service Logic:

**Prepare:**
```javascript
// merchant_trans_id = MongoDB _id
const transaction = await transactionModel.findById(merchant_trans_id)

// Click ma'lumotlarini qo'shish
await transactionModel.findByIdAndUpdate(merchant_trans_id, {
    id: click_trans_id,
    state: 1, // Preparing
    prepare_id: time
})
```

**Complete:**
```javascript
// merchant_trans_id orqali topish
const transaction = await transactionModel.findById(merchant_trans_id)

// To'lovni tasdiqlash
await transactionModel.findByIdAndUpdate(merchant_trans_id, {
    state: 2, // Paid
    perform_time: time
})
```

### 2. Transaction States:
```javascript
{
  Paid: 2,         // ✅ To'langan
  Preparing: 1,    // ⏳ Click.uz da tayyorlanmoqda
  Pending: 0,      // ⏰ Kutilmoqda
  Canceled: -1,    // ❌ Bekor qilindi
  PaidCanceled: -2 // ❌ To'langan keyin bekor qilindi
}
```

### 3. Click Actions:
```javascript
{
  Complete: 0,  // To'lovni tasdiqlash
  Prepare: 1,   // To'lovni tayyorlash
}
```

---

## 🚀 Serverni Ishga Tushirish

### Production (pm2 bilan):
```bash
# Birinchi marta
pm2 start app.js --name "click-payment"

# Qayta ishga tushirish
pm2 restart click-payment

# Stop
pm2 stop click-payment

# Loglarni ko'rish
pm2 logs click-payment
```

### Development:
```bash
npm run dev
```

### Oddiy:
```bash
node app.js
```

---

## 🧪 Testlash

### Variant 1: Avtomatik To'liq Test

```bash
# Server ishga tushirish (birinchi terminal)
npm run dev

# Test (ikkinchi terminal)
node test-full-integration.js
```

Bu script avtomatik ravishda:
- ✅ To'lov yaratadi
- ✅ Prepare webhook yuboradi
- ✅ Complete webhook yuboradi
- ✅ Status tekshiradi
- ✅ Telegram notification jo'natadi

### Variant 2: Qo'lda Test

#### 1. To'lov yaratish:
```bash
curl -X POST http://localhost:9999/api/payments/create \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{
      "title": "Test Kitob",
      "price": 50000,
      "qty": 1
    }],
    "customerName": "Test User",
    "customerEmail": "test@test.com",
    "customerPhone": "+998901234567"
  }'
```

**Response:**
```json
{
  "success": true,
  "orderId": "68deccb4d722e2c7e4088965",
  "amount": 50000,
  "click_url": "https://my.click.uz/services/pay?..."
}
```

#### 2. Prepare Test:
```bash
# orderId ni MERCHANT_TRANS_ID o'rniga qo'ying
node test-click-webhook.js
```

---

## 🌐 Production URL'lar

Click.uz merchant cabinet'ida ro'yxatdan o'tkazish kerak:

- **Prepare URL:** `https://pay.saadahbooks.uz/api/click/prepare`
- **Complete URL:** `https://pay.saadahbooks.uz/api/click/complete`

---

## 📊 Transaction Flow

```
1. Frontend: POST /api/payments/create
   ↓
   Response: { orderId: "abc123", click_url: "..." }
   ↓
   state: 0 (Pending)

2. User: Click.uz sahifasiga o'tadi (click_url)
   ↓
   Karta ma'lumotlarini kiritadi

3. Click.uz → Backend: POST /api/click/prepare
   ↓
   merchant_trans_id = "abc123"
   ↓
   state: 1 (Preparing)
   ↓
   Telegram: "⏳ To'lov tayyorlanmoqda..."

4. Click.uz → Backend: POST /api/click/complete
   ↓
   merchant_trans_id = "abc123"
   ↓
   state: 2 (Paid) ✅
   ↓
   Telegram: "🎉 To'lov muvaffaqiyatli!"

5. User: return_url ga qaytadi
   ↓
   Frontend: status tekshiradi
```

---

## 🔍 Debug va Monitoring

### Loglarni ko'rish:
```bash
# Development
# Consoleda ko'rinadi

# Production (pm2)
pm2 logs click-payment

# Error loglar
pm2 logs click-payment --err
```

### Transaction statusini tekshirish:
```bash
curl http://localhost:9999/api/payments/ORDER_ID
```

### Statistikani ko'rish:
```bash
curl http://localhost:9999/api/orders/statistics
```

---

## ❌ Xatoliklarni Hal Qilish

### Error: -1 (SignFailed)
**Sabab:** Signature noto'g'ri  
**Yechim:** `.env` faylidagi `CLICK_SECRET_KEY` to'g'riligini tekshiring

### Error: -6 (TransactionNotFound)
**Sabab:** `merchant_trans_id` topilmadi  
**Yechim:** 
- Frontend yaratgan `orderId` to'g'ri yuborilganini tekshiring
- MongoDB'da transaction mavjudligini tekshiring

### Error: -2 (InvalidAmount)
**Sabab:** Amount mos kelmadi  
**Yechim:** Click.uz yuborayotgan amount transaction amount'i bilan bir xil bo'lishi kerak

### Error: -4 (AlreadyPaid)
**Sabab:** Transaction allaqachon to'langan  
**Yechim:** Yangi transaction yarating

---

## 🔐 Xavfsizlik

1. ✅ MD5 signature verification
2. ✅ Amount validation
3. ✅ Transaction state checking
4. ✅ Prepare ID matching
5. ✅ Error handling with try-catch
6. ✅ Environment variables

---

## 📱 Telegram Notifications

### Prepare Notification:
```
⏳ Yangi to'lov tayyorlanmoqda...

💳 Transaction ID: abc123
💰 Summa: 50,000 so'm

👤 Mijoz: Test User
📧 Email: test@test.com
📱 Telefon: +998901234567

📚 Tanlangan kitoblar (1 ta):
1. Test Kitob
   1 ta × 50,000 = 50,000 so'm

⏰ Kutilmoqda...
```

### Complete Notification:
```
🎉 Yangi to'lov muvaffaqiyatli!

💳 Transaction ID: abc123
💰 Summa: 50,000 so'm
📅 Sana: 2025-10-03 12:30

👤 Mijoz: Test User
📧 Email: test@test.com
📱 Telefon: +998901234567

📚 Sotib olingan kitoblar (1 ta):
1. Test Kitob
   1 ta × 50,000 = 50,000 so'm

✅ Holat: To'landi
🔗 Provider: click
```

---

## 📝 Environment Variables

`.env` faylida bo'lishi kerak:

```env
PORT=9999
MONOGO_URI=mongodb+srv://...
CLIENT_URL=https://saadahbooks.uz

# Click.uz
CLICK_SERVICE_ID=83510
CLICK_MERCHANT_ID=46304
CLICK_MERCHANT_USER_ID=64634
CLICK_SECRET_KEY=Bh04xdmSYr

# Telegram Bot
TELEGRAM_BOT_TOKEN=8289746602:...
TELEGRAM_CHAT_ID=-1002805208498
```

---

## ✅ Checklist - Production'ga Deploy Qilishdan Oldin

- [ ] `.env` faylida barcha ma'lumotlar to'g'ri
- [ ] MongoDB Atlas connection string to'g'ri
- [ ] Click.uz merchant cabinet'ida webhook URL'lar ro'yxatdan o'tkazilgan
- [ ] Telegram bot tokeni va chat ID to'g'ri
- [ ] Server HTTPS bilan ishlaydi (SSL certificate)
- [ ] `test-full-integration.js` muvaffaqiyatli o'tdi
- [ ] PM2 yoki boshqa process manager o'rnatilgan
- [ ] Nginx reverse proxy sozlangan (agar kerak bo'lsa)

---

## 🎯 Yakuniy Natija

✅ Frontend yaratgan transaction Click.uz tomonidan to'g'ri yangilanadi  
✅ Prepare va Complete webhook'lar to'g'ri ishlaydi  
✅ Telegram notifications yuboriladi  
✅ Transaction state'lar to'g'ri almashadi  
✅ Signature verification ishlaydi  
✅ Error handling yaxshi  

**HAMMA NARSA ISHLAYDI! 🚀**
