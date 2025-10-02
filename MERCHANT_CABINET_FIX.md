# 🚨 MUHIM: Click.uz Merchant Cabinet O'zgartirish

## ❌ Hozirgi muammo:
Click.uz faqat Complete yubormoqda, Prepare kelmayapti.

## ✅ Yechim:
Merchant cabinet'da **ikkala URL'ni ham bir xil qiling**:

```
Prepare URL (Адрес проверки):
https://pay.saadahbooks.uz/api/click/prepare

Complete URL (Адрес результата):
https://pay.saadahbooks.uz/api/click/prepare
```

**Diqqat:** Ikkala URL ham `/prepare` ga ishora qiladi!

Backend avtomatik ravishda action'ga qarab to'g'ri metodga yo'naltiradi.

## 🔧 Backend tayyor:
- action=1 → Prepare
- action=0 → Complete

## 📋 Qadamlar:

1. Click.uz merchant cabinet'ga kiring
2. Complete URL'ni o'zgartiring: `/complete` → `/prepare`
3. Saqlang
4. Test to'lov qiling

Hamma narsa ishlashi kerak! ✅
