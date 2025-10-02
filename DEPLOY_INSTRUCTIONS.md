# 🚀 Production Deployment Instructions

## Problem anichlandi:
Click.uz **faqat `/prepare` URL'ini ishlatmoqda** va u yerga ham `action=0` (Complete) ham `action=1` (Prepare) yubormoqda.

## Fix qilindi:
Barcha 3 endpoint universal qilindi - action parametriga qarab to'g'ri metodga yo'naltiradi:
- `/api/click/webhook` ✅
- `/api/click/prepare` ✅ (eng muhimi - Click.uz buni ishlatmoqda)
- `/api/click/complete` ✅

## Production'ga deploy qilish:

```bash
# 1. SSH bilan serverga kiring
ssh your_user@your_server

# 2. Project folder'iga o'ting
cd /path/to/click

# 3. Latest code'ni pull qiling
git pull origin main

# 4. PM2'da restart qiling
pm2 restart click-payment

# 5. Log'larni kuzating
pm2 logs click-payment --lines 50
```

## Test qilish:

1. **Test to'lov qiling:** https://saadahbooks.uz
2. **Log'larda ko'rishingiz kerak:**
   ```
   🔔 /prepare endpoint - Action: 1
   === CLICK PREPARE SERVICE ===
   Transaction updated to Preparing
   ✅ Prepare successful
   
   🔔 /prepare endpoint - Action: 0
   ⚠️  Complete request received on /prepare endpoint, routing to complete...
   === CLICK COMPLETE SERVICE ===
   Transaction updated to Paid
   ✅ Complete successful
   ```

3. **Telegram'da 2 ta xabar kelishi kerak:**
   - To'lov tayyorlanmoqda (Prepare)
   - To'lov muvaffaqiyatli (Complete)

## Kutilayotgan natija:
✅ Prepare request (action=1) → prepare() metodiga
✅ Complete request (action=0) → complete() metodiga
✅ Transaction: Pending → Preparing → Paid
✅ 2 ta Telegram notification

## Click.uz Merchant Cabinet:
**HECH NARSA O'ZGARTIRMANG!** Current configuration to'g'ri:
- Prepare URL: `https://pay.saadahbooks.uz/api/click/prepare`
- Complete URL: `https://pay.saadahbooks.uz/api/click/complete`

Backend endi ikkala URL'ni ham universal routing bilan ishlaydi.
