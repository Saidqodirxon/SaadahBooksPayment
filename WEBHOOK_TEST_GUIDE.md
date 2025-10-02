# 🔧 Click.uz Webhook Test Guide

## ✅ O'zgarishlar

### 1. Click Service tuzatildi
- ✅ `prepare()` - Endi frontend yaratgan transaction'ni yangilaydi (yangi yaratmaydi)
- ✅ `complete()` - merchant_trans_id (MongoDB _id) orqali ishlaydi
- ✅ Transaction state'lar yangilandi

### 2. Transaction States
```javascript
{
  Paid: 2,         // To'langan
  Preparing: 1,    // Click.uz da tayyorlanmoqda
  Pending: 0,      // Kutilmoqda (yangi yaratilgan)
  Canceled: -1,    // Bekor qilindi
  PaidCanceled: -2 // To'langan keyin bekor qilindi
}
```

### 3. Click Actions
```javascript
{
  Complete: 0,  // To'lovni tasdiqlash
  Prepare: 1,   // To'lovni tayyorlash
}
```

## 🧪 Test Qilish

### Qadam 1: To'lov yaratish

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

**`orderId` ni eslab qoling!** Bu `merchant_trans_id` uchun kerak.

---

### Qadam 2: Prepare Webhook Test

Click.uz server sizning backendingizga prepare webhook yuboradi.

#### 2.1. Signature yaratish

```javascript
const crypto = require('crypto')

const secretKey = 'Bh04xdmSYr'
const prepareData = {
  click_trans_id: '12345678',           // Click.uz trans ID
  service_id: '83510',
  merchant_trans_id: 'OLDINGI_QADAMDAN_ORDERID', // 👈 Buni almashtiring!
  amount: '50000',
  action: '1',                           // 1 = Prepare
  sign_time: '20251002T190844'
}

const signString = `${prepareData.click_trans_id}${prepareData.service_id}${secretKey}${prepareData.merchant_trans_id}${prepareData.amount}${prepareData.action}${prepareData.sign_time}`

const signature = crypto.createHash('md5').update(signString).digest('hex')
console.log('Signature:', signature)
```

#### 2.2. Prepare Request

```bash
curl -X POST http://localhost:9999/api/click/prepare \
  -H "Content-Type: application/json" \
  -d '{
    "click_trans_id": "12345678",
    "service_id": "83510",
    "merchant_trans_id": "68deccb4d722e2c7e4088965",
    "amount": "50000",
    "action": "1",
    "sign_time": "20251002T190844",
    "sign_string": "YUQORIDAGI_SIGNATURE"
  }'
```

**Expected Response:**
```json
{
  "click_trans_id": "12345678",
  "merchant_trans_id": "68deccb4d722e2c7e4088965",
  "merchant_prepare_id": 1728734567890,
  "error": 0,
  "error_note": "Success"
}
```

**`merchant_prepare_id` ni eslab qoling!**

---

### Qadam 3: Complete Webhook Test

#### 3.1. Signature yaratish

```javascript
const completeData = {
  click_trans_id: '12345678',
  service_id: '83510',
  merchant_trans_id: 'ORDDERID',
  merchant_prepare_id: 'PREPARE_IDDAN',    // 👈 Prepare response'dan
  amount: '50000',
  action: '0',                              // 0 = Complete
  error: '0',
  sign_time: '20251002T190900'
}

const signString = `${completeData.click_trans_id}${completeData.service_id}${secretKey}${completeData.merchant_trans_id}${completeData.merchant_prepare_id}${completeData.amount}${completeData.action}${completeData.sign_time}`

const signature = crypto.createHash('md5').update(signString).digest('hex')
console.log('Signature:', signature)
```

#### 3.2. Complete Request

```bash
curl -X POST http://localhost:9999/api/click/complete \
  -H "Content-Type: application/json" \
  -d '{
    "click_trans_id": "12345678",
    "service_id": "83510",
    "merchant_trans_id": "68deccb4d722e2c7e4088965",
    "merchant_prepare_id": "1728734567890",
    "amount": "50000",
    "action": "0",
    "error": "0",
    "sign_time": "20251002T190900",
    "sign_string": "YUQORIDAGI_SIGNATURE"
  }'
```

**Expected Response:**
```json
{
  "click_trans_id": "12345678",
  "merchant_trans_id": "68deccb4d722e2c7e4088965",
  "merchant_confirm_id": 1728734590123,
  "error": 0,
  "error_note": "Success"
}
```

---

## 📱 Telegram Notification

Complete muvaffaqiyatli bo'lgandan keyin Telegram guruhingizga xabar keladi:

```
🎉 Yangi to'lov muvaffaqiyatli!

💳 Transaction ID: 68deccb4d722e2c7e4088965
💰 Summa: 50,000 so'm
📅 Sana: ...

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

## ❌ Xatoliklar

### Error: -1 (SignFailed)
**Sabab:** Signature noto'g'ri  
**Yechim:** Signature'ni qaytadan hisoblang

### Error: -6 (TransactionNotFound)
**Sabab:** `merchant_trans_id` topilmadi  
**Yechim:** To'g'ri `orderId` ishlatilganiga ishonch hosil qiling

### Error: -2 (InvalidAmount)
**Sabab:** Amount mos kelmadi  
**Yechim:** Transaction amount'i bilan mos kelishini tekshiring

### Error: -4 (AlreadyPaid)
**Sabab:** Allaqachon to'langan  
**Yechim:** Yangi transaction yarating

---

## 🔍 Transaction Status Tekshirish

```bash
curl http://localhost:9999/api/payments/68deccb4d722e2c7e4088965
```

**Response:**
```json
{
  "_id": "68deccb4d722e2c7e4088965",
  "id": "12345678",
  "items": [...],
  "customerName": "Test User",
  "amount": 50000,
  "state": 2,              // 2 = Paid
  "provider": "click",
  "create_time": 1728734567890,
  "prepare_id": 1728734567890,
  "perform_time": 1728734590123
}
```

---

## 📋 To'liq Test Script

`test-click-webhook.js` faylini ishlatishingiz mumkin:

```bash
node test-click-webhook.js
```

Bu script avtomatik ravishda:
1. ✅ Prepare webhook test qiladi
2. ✅ Signature yaratadi
3. ✅ Complete webhook test qiladi
4. ✅ Telegram notification tekshiradi

---

## 🚀 Production

Production'da Click.uz serveridan real webhook'lar keladi:

- **Prepare URL:** `https://pay.saadahbooks.uz/api/click/prepare`
- **Complete URL:** `https://pay.saadahbooks.uz/api/click/complete`

Bu URL'larni Click.uz merchant cabinet'ida ro'yxatdan o'tkazishingiz kerak.
