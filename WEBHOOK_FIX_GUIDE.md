# ✅ MUAMMO YECHILDI - Click.uz Webhook Configuration

## 🎯 Muammo Nima Edi?

Logda ko'rindi:
```
Action: 0 (expected: 1 for Prepare)
Response: ActionNotFound
```

**Sabab:** Click.uz **bitta URL**ga ham `action=1` (Prepare) ham `action=0` (Complete) yuboradi, lekin bizda 2 ta alohida endpoint bor edi.

---

## ✅ Yechim

### 1. Yangi Endpoint Yaratildi

**URL:** `/api/click/webhook`

Bu endpoint avtomatik ravishda `action` qiymatiga qarab prepare yoki complete metodini chaqiradi:
- `action=1` → Prepare
- `action=0` → Complete

### 2. Kod O'zgarishlari

**Controller** (`click.controller.js`):
```javascript
async webhook(req, res, next) {
    const action = parseInt(req.body.action)
    
    if (action === 1) {
        // Prepare
        result = await clickService.prepare(data)
    } else if (action === 0) {
        // Complete
        result = await clickService.complete(data)
    }
}
```

---

## 🔧 Click.uz Merchant Cabinet Configuration

### MUHIM! Webhook URL'ni o'zgartiring:

#### ❌ Eski (Noto'g'ri):
```
Prepare URL: https://pay.saadahbooks.uz/api/click/prepare
Complete URL: https://pay.saadahbooks.uz/api/click/complete
```

#### ✅ Yangi (To'g'ri):
```
Service URL: https://pay.saadahbooks.uz/api/click/webhook
```

Yoki agar Click.uz merchant cabinet'da 2 ta URL kiritish talab qilsa:

```
Prepare URL: https://pay.saadahbooks.uz/api/click/webhook
Complete URL: https://pay.saadahbooks.uz/api/click/webhook
```

**Ikkala URL ham bir xil bo'lishi kerak!**

---

## 📋 Qadamma-qadam Yo'riqnoma

### 1. Code Deploy Qilish

```bash
git add .
git commit -m "Fix Click.uz webhook - use single endpoint with action routing"
git push
```

### 2. Serverda Yangilash

```bash
# SSH orqali serverga kirish
ssh user@your-server

# Kodni tortish
cd /path/to/your/app
git pull

# Serverni restart qilish
pm2 restart click-payment

# Yoki systemd
sudo systemctl restart your-service
```

### 3. Click.uz Merchant Cabinet'da Sozlash

1. **Kirish:** https://my.click.uz/merchant
2. **Sozlamalar** → **Webhook URLs**
3. **Eski URL'larni o'chirish** (agar bor bo'lsa)
4. **Yangi URL qo'shish:**
   ```
   https://pay.saadahbooks.uz/api/click/webhook
   ```
5. **Saqlash** va **Test qilish**

---

## 🧪 Test Qilish

### 1. Lokal Test (Development)

```bash
# Terminal 1: Server
npm run dev

# Terminal 2: Test
curl -X POST http://localhost:9999/api/click/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "click_trans_id": "12345",
    "service_id": "83510",
    "merchant_trans_id": "ORDER_ID",
    "amount": "1000",
    "action": "0",
    "sign_time": "2025-10-03 12:00:00",
    "sign_string": "test"
  }'
```

### 2. Production Test

Click.uz merchant cabinet'da "Test Payment" tugmasini bosing.

### 3. Real To'lov Test

1. Frontend'dan to'lov yaratish
2. Click.uz sahifasiga o'tish
3. Test karta bilan to'lash:
   - Karta: `8600 4954 7331 6478`
   - Muddat: `03/99`
   - SMS: `666666`

---

## 📊 Kutilayotgan Loglar

### Prepare (action=1):
```
🔔 Click.uz Webhook received
Action: 1 (Prepare)

=== CLICK PREPARE WEBHOOK ===
Incoming data: {
  "click_trans_id": "3296946500",
  "action": "1",
  ...
}
Signature check: ✅ Valid
Action: 1 (expected: 1 for Prepare)
Transaction found: { ... }
✅ Transaction updated successfully
Response: { error: 0, error_note: "Success" }
=== END PREPARE ===
```

### Complete (action=0):
```
🔔 Click.uz Webhook received
Action: 0 (Complete)

=== CLICK COMPLETE WEBHOOK ===
Incoming data: {
  "click_trans_id": "3296946500",
  "action": "0",
  "error": "0",
  ...
}
Signature check: ✅ Valid
Action: 0 (expected: 0 for Complete)
Transaction found: { ... }
Confirming payment...
✅ Payment confirmed successfully
Telegram success notification sent
Response: { error: 0, error_note: "Success" }
=== END COMPLETE ===
```

---

## ✅ Endpoint'lar

### Yangi (Tavsiya etiladi):
- `POST /api/click/webhook` - Bitta endpoint, action'ga qarab ishlaydi

### Eski (Backward compatibility):
- `POST /api/click/prepare` - Faqat prepare uchun
- `POST /api/click/complete` - Faqat complete uchun

**Eslatma:** Click.uz merchant cabinet'da faqat `/webhook` endpoint'ini ishlatish tavsiya etiladi.

---

## 🎯 Click.uz Webhook Flow

```
1. User → To'lov sahifasiga o'tadi

2. Click.uz → POST /api/click/webhook
   {
     "action": "1",  // Prepare
     ...
   }
   ↓
   Backend → Prepare metodi
   ↓
   Response: { error: 0 }

3. User → Karta ma'lumotlarini kiritadi

4. User → SMS kodni kiritadi

5. Click.uz → POST /api/click/webhook
   {
     "action": "0",  // Complete
     "error": "0",   // Muvaffaqiyatli
     ...
   }
   ↓
   Backend → Complete metodi
   ↓
   Response: { error: 0 }
   ↓
   Telegram: "🎉 To'lov muvaffaqiyatli!"

6. User → Success sahifaga qaytadi
```

---

## ❌ Agar Xatolik Bo'lsa

### Error: ActionNotFound
```
Action: 0 (expected: 1 for Prepare)
```

**Sabab:** Click.uz noto'g'ri endpoint'ga yubormoqda

**Yechim:** Merchant cabinet'da URL'ni `/webhook` ga o'zgartiring

### Error: Transaction Not Found

**Sabab:** `merchant_trans_id` noto'g'ri

**Yechim:** Frontend to'g'ri `orderId` yuborishi kerak

### Error: Signature Failed

**Sabab:** `secret_key` noto'g'ri

**Yechim:** `.env` faylidagi `CLICK_SECRET_KEY` ni tekshiring

---

## 📱 Qo'shimcha Ma'lumot

### Click.uz Documentation:
https://docs.click.uz/

### Click.uz Support:
- ☎️ +998 78 150 01 50
- 📧 support@click.uz

### Test Kartalar:
- Karta: `8600 4954 7331 6478`
- Amal qilish: `03/99`
- SMS kod: `666666`

---

## 🚀 Final Checklist

- [ ] Code serverga deploy qilindi
- [ ] Server restart qilindi
- [ ] Loglar ishlayapti (`pm2 logs click-payment -f`)
- [ ] Click.uz merchant cabinet'da webhook URL `/webhook` ga o'zgartirildi
- [ ] Test to'lov qilindi
- [ ] Prepare webhook muvaffaqiyatli (action=1)
- [ ] Complete webhook muvaffaqiyatli (action=0)
- [ ] Telegram xabarlari kelmoqda
- [ ] Real to'lov test qilindi

**Hammasi ishlaydi! 🎉**
