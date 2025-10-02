# 🔍 Click.uz Error -2041 Debug Guide

## ❌ Muammo
Click.uz dan xatolik kodi: `-2041`
```
Произошла ошибка во время оплаты. Пожалуйста, попробуйте ещё раз. (-2041)
```

## 🔎 -2041 Xatoligi Nima?

Bu Click.uz serverining ichki xatoligi. Quyidagi sabablar bo'lishi mumkin:

### 1. **Merchant Ma'lumotlari Noto'g'ri**
- ❌ `service_id` noto'g'ri yoki test mode'da
- ❌ `merchant_id` noto'g'ri
- ❌ `secret_key` noto'g'ri
- ❌ Merchant account faol emas

### 2. **URL Muammolari**
- ❌ Webhook URL'lar noto'g'ri ro'yxatdan o'tkazilgan
- ❌ SSL sertifikat muammosi (HTTPS kerak)
- ❌ Server webhook'larga javob bermayabti

### 3. **To'lov Oqimi Muammolari**
- ❌ Backend prepare/complete response xato format
- ❌ Transaction topilmayabti
- ❌ Amount mos kelmayabti

---

## 🛠️ Debug Qilish

### 1. Server Loglarini Ko'rish

Yangilangan kod endi to'liq debug loglarini ko'rsatadi:

**Development:**
```bash
npm run dev
```

**Production (pm2):**
```bash
pm2 logs click-payment --lines 100
```

**Production (systemd):**
```bash
journalctl -u your-service-name -f
```

### 2. Prepare Webhook Loglari

Prepare webhook kelganda consoleda ko'rinadi:

```
=== CLICK PREPARE WEBHOOK ===
Incoming data: {
  "click_trans_id": "12345678",
  "service_id": "83510",
  "merchant_trans_id": "68deccb4d722e2c7e4088965",
  "amount": "50000",
  "action": "1",
  "sign_time": "20251003T120000",
  "sign_string": "abc123..."
}
Signature check: ✅ Valid
Action: 1 (expected: 1 for Prepare)
Looking for transaction with _id: 68deccb4d722e2c7e4088965
Transaction found: {
  _id: "68deccb4d722e2c7e4088965",
  amount: 50000,
  state: 0,
  customerName: "Test User"
}
Amount check: received=50000, expected=50000
Updating transaction...
Transaction updated successfully
Telegram notification sent
Response: {
  "click_trans_id": "12345678",
  "merchant_trans_id": "68deccb4d722e2c7e4088965",
  "merchant_prepare_id": 1728734567890,
  "error": 0,
  "error_note": "Success"
}
=== END PREPARE ===
```

### 3. Complete Webhook Loglari

```
=== CLICK COMPLETE WEBHOOK ===
Incoming data: { ... }
Signature check: ✅ Valid
Action: 0 (expected: 0 for Complete)
Looking for transaction with _id: 68deccb4d722e2c7e4088965
Transaction found: { ... }
Prepare ID check: received=1728734567890, expected=1728734567890
Click error code: 0
Confirming payment...
Payment confirmed successfully
Telegram success notification sent
Response: {
  "click_trans_id": "12345678",
  "merchant_trans_id": "68deccb4d722e2c7e4088965",
  "merchant_confirm_id": 1728734590123,
  "error": 0,
  "error_note": "Success"
}
=== END COMPLETE ===
```

---

## ✅ Tekshirish Ro'yxati

### 1. Environment Variables (.env)
```bash
# Tekshirish
cat .env | grep CLICK
```

Quyidagilar to'g'ri bo'lishi kerak:
```env
CLICK_SERVICE_ID=83510
CLICK_MERCHANT_ID=46304
CLICK_MERCHANT_USER_ID=64634
CLICK_SECRET_KEY=Bh04xdmSYr
```

### 2. Webhook URL'lar

Click.uz merchant cabinet'ida:
- ✅ Prepare URL: `https://pay.saadahbooks.uz/api/click/prepare`
- ✅ Complete URL: `https://pay.saadahbooks.uz/api/click/complete`
- ✅ SSL sertifikat faol
- ✅ Server 443 portda tinglayabti

### 3. Server Test

```bash
# Tashqaridan webhook test
curl -X POST https://pay.saadahbooks.uz/api/click/prepare \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'

# 404 yoki 500 emas, 200 bo'lishi kerak
```

### 4. MongoDB Connection

```bash
# Lokal test
node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI || 'YOUR_URI')
  .then(() => { console.log('✅ Connected'); process.exit(0); })
  .catch(err => { console.log('❌ Error:', err.message); process.exit(1); });
"
```

---

## 🔧 Yechimlar

### Agar Signature Failed (-1)

**Sabab:** Secret key noto'g'ri

**Yechim:**
```bash
# .env faylini tekshiring
echo $CLICK_SECRET_KEY

# Agar bo'sh bo'lsa, to'ldiring
echo "CLICK_SECRET_KEY=Bh04xdmSYr" >> .env

# Serverni restart qiling
pm2 restart click-payment
```

### Agar Transaction Not Found (-6)

**Sabab:** `merchant_trans_id` MongoDB'da topilmayapti

**Yechim:**
1. Frontend yaratgan `orderId` to'g'ri yuborilganini tekshiring
2. MongoDB'da transaction mavjudligini tekshiring:
```bash
mongosh "YOUR_MONGO_URI"
use your_database
db.transactions.findOne({ _id: ObjectId("ORDER_ID") })
```

### Agar Amount Invalid (-2)

**Sabab:** Click.uz yuborayotgan summa transaction amount'i bilan mos kelmayapti

**Yechim:**
```bash
# Loglarni tekshiring:
pm2 logs click-payment | grep "Amount check"

# Ko'rinishi:
# Amount check: received=50000, expected=50000
# Agar mos kelmasa - frontend'da to'g'ri amount yuborilganini tekshiring
```

### Agar Server Webhook'ni Qabul Qilmasa

**Sabab:** Firewall yoki NGINX konfiguratsiya muammosi

**Yechim:**

1. NGINX config:
```nginx
location /api/click/ {
    proxy_pass http://localhost:9999;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

2. Firewall:
```bash
# Port ochish
sudo ufw allow 443/tcp
sudo ufw allow 80/tcp
```

---

## 📱 Click.uz Support

Agar yuqoridagilarning hech biri yordam bermasa:

1. **Click.uz Merchant Cabinet** ga kiring
2. **Support** bo'limiga o'ting
3. Quyidagi ma'lumotlarni yuboring:
   - Error kodi: `-2041`
   - Service ID: `83510`
   - Merchant ID: `46304`
   - Webhook URL'lar
   - Test transaction ID

Yoki telefon qiling:
- ☎️ **+998 78 150 01 50** (Click.uz support)

---

## 🧪 Test Mode

Test qilish uchun Click.uz test mode'dan foydalaning:

1. Merchant cabinet'da **Test Mode** yoqing
2. Test kartalar:
   - Karta: `8600 4954 7331 6478`
   - Amal qilish muddati: `03/99`
   - SMS kod: `666666`

---

## 📊 Real-time Monitoring

Production'da doimiy monitoring:

```bash
# 1. Server loglari
pm2 logs click-payment -f

# 2. MongoDB queries
mongosh "YOUR_URI" --eval "db.transactions.find().sort({create_time:-1}).limit(5).pretty()"

# 3. Telegram bot
# Har bir prepare/complete webhook uchun xabar keladi

# 4. Error tracking
pm2 logs click-payment --err
```

---

## ✅ Successful Test

Agar hamma narsa to'g'ri ishlasa:

```
🚀 Frontend → POST /api/payments/create
   ✅ { orderId: "abc123", click_url: "..." }

👤 User → Click.uz sahifasiga o'tadi

📥 Click.uz → POST /api/click/prepare
   ✅ Backend logda: "Transaction updated successfully"
   ✅ Telegram: "⏳ To'lov tayyorlanmoqda..."

💳 User → Karta ma'lumotlarini kiritadi

📥 Click.uz → POST /api/click/complete
   ✅ Backend logda: "Payment confirmed successfully"
   ✅ Telegram: "🎉 To'lov muvaffaqiyatli!"

✅ User → Success sahifaga qaytadi
```

---

## 🚨 Agar -2041 Davom Etsa

Bu Click.uz ning ichki server xatoligi. Ehtimol:

1. **Test mode'da** - Click.uz serverlari vaqti-vaqti bilan ishlamay qoladi
2. **Production'da** - Click.uz support bilan bog'laning
3. **Webhook muammosi** - URL'lar to'g'ri ro'yxatdan o'tkazilganini qayta tekshiring

**Keyingi qadam:**
```bash
# Server loglarini to'liq ko'rsatish
pm2 logs click-payment --lines 200

# Yoki biror faylga saqlash
pm2 logs click-payment --lines 500 > click_logs.txt
```

Loglarni Click.uz support'ga yuboring.
