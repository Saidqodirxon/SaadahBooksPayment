# 🔍 TO'LOV MUAMMOSI - DEBUG

## ❓ Muammo:
User aytadi "to'lov o'tmadi", lekin log'da:
- ✅ Signature valid
- ✅ Auto-prepare successful
- ✅ Payment confirmed successfully
- ✅ Response: error: 0, error_note: "Success"

## 🔎 Tekshirish kerak:

### 1. Database'da transaction state:
```javascript
// MongoDB'da tekshirish:
db.transactions.findOne({_id: ObjectId("68dedb5c7d2ed82d20f517cd")})

// Ko'rishingiz kerak:
{
  _id: ObjectId("68dedb5c7d2ed82d20f517cd"),
  state: 2,  // ✅ Paid
  amount: 1000,
  prepare_id: 4429742613,
  create_time: ...,
  perform_time: 1759435642786,  // ✅ Bor
  items: [...],
  customerName: "...",
  customerEmail: "...",
  customerPhone: "..."
}
```

### 2. Click.uz Response:
Backend to'g'ri response qaytaryapti:
```json
{
  "click_trans_id": "3296957637",
  "merchant_trans_id": "68dedb5c7d2ed82d20f517cd",
  "merchant_confirm_id": 1759435642786,
  "error": 0,
  "error_note": "Success"
}
```

### 3. Frontend Check:

**A) Return URL to'g'ri:**
```
https://saadahbooks.uz/payment/success?transaction_param=68dedb5c7d2ed82d20f517cd
```

**B) Frontend success page:** `https://saadahbooks.uz/payment/success`
- Transaction ID bilan status tekshirayaptimi?
- API'dan status so'rayaptimi?

**C) Backend API endpoint:** `/api/payments/:orderId`
```bash
curl https://pay.saadahbooks.uz/api/payments/68dedb5c7d2ed82d20f517cd
```

Javob:
```json
{
  "success": true,
  "transaction": {
    "_id": "68dedb5c7d2ed82d20f517cd",
    "state": 2,  // Paid
    "amount": 1000,
    ...
  }
}
```

## 🎯 Ehtimoliy Muammolar:

### 1. Frontend success page ishlamayapti
**Sabab:** Frontend transaction state'ni tekshirmayapti yoki noto'g'ri tekshiryapti

**Yechim:** Frontend'da:
```javascript
// payment/success page
const urlParams = new URLSearchParams(window.location.search);
const orderId = urlParams.get('transaction_param');

// Backend'dan status tekshirish
const response = await fetch(`https://pay.saadahbooks.uz/api/payments/${orderId}`);
const data = await response.json();

if (data.transaction.state === 2) {
  // ✅ To'lov muvaffaqiyatli
  showSuccessMessage();
} else {
  // ❌ To'lov kutilmoqda yoki bekor qilingan
  showPendingOrErrorMessage();
}
```

### 2. Click.uz redirect qilmayapti
**Sabab:** Click.uz bizning response'ni qabul qilganda error ko'ryapti

**Yechim:** Click.uz'ning response format'ini tekshirish kerak. Ba'zan qo'shimcha fieldlar kerak:
```javascript
// Ehtimol kerak bo'lishi mumkin:
{
  "click_trans_id": "3296957637",
  "merchant_trans_id": "68dedb5c7d2ed82d20f517cd",
  "merchant_prepare_id": 4429742613,  // ← Qo'shish kerak?
  "merchant_confirm_id": 1759435642786,
  "error": 0,
  "error_note": "Success"
}
```

### 3. CORS yoki network muammosi
**Sabab:** Click.uz bizning response'ni ololmayapti

**Tekshirish:**
```bash
# Server log'larida Click.uz'ning request'lari ko'rinishi kerak
pm2 logs click-payment | grep "COMPLETE"
```

## ✅ Birinchi qadam:

### Database'ni tekshiring:
```bash
# SSH bilan serverga kiring
ssh your_server

# MongoDB'ga ulaning
mongo "mongodb+srv://cluster0.ov9etzx.mongodb.net/" --username rsaidqodirxon_db_user

# Database'ni tanlang
use rsaidqodirxon_db

# Transaction'ni tekshiring
db.transactions.findOne({_id: ObjectId("68dedb5c7d2ed82d20f517cd")})
```

### Agar state: 2 (Paid) bo'lsa:
✅ **Backend to'g'ri ishlayapti!**
❌ **Muammo frontend'da yoki Click.uz redirect'ida**

### Agar state: 1 (Preparing) bo'lsa:
❌ **Complete metodi update qilmagan**
🔧 **Backend'ni tuzatish kerak**

### Agar state: 0 (Pending) bo'lsa:
❌ **Auto-prepare ishlamagan**
🔧 **Backend'ni tuzatish kerak**

## 📞 Keyingi qadam:
Database tekshirish natijasini yuboring!
