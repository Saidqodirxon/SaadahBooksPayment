# 📘 Frontend API Integration Guide

## 🚀 To'lov yaratish (Payment Create)

### Endpoint
```
POST https://pay.saadahbooks.uz/api/payments/create
```

### Request Headers
```json
{
  "Content-Type": "application/json"
}
```

### Request Body (JSON)
```json
{
  "items": [
    {
      "title": "O'zbek tili grammatikasi",
      "price": 45000,
      "qty": 2,
      "author": "A.Nurmonov",
      "image": "/images/books/uzbek-grammar.jpg",
      "slug": "uzbek-tili-grammatikasi",
      "bookId": "book_001"
    },
    {
      "title": "Matematika asoslari",
      "price": 30000,
      "qty": 1,
      "author": "B.Karimov",
      "image": "/images/books/math-basics.jpg",
      "slug": "matematika-asoslari",
      "bookId": "book_002"
    }
  ],
  "customerName": "Said Qodirov",
  "customerEmail": "said@example.com",
  "customerPhone": "+998901234567"
}
```

### ✅ Majburiy Fields (Required)

#### `items` - Array (Kitoblar ro'yxati)
- **Type:** Array of Objects
- **Required:** ✅ Ha
- **Empty bo'lishi mumkinmi:** ❌ Yo'q (kamida 1 ta kitob bo'lishi kerak)

Har bir item (kitob) quyidagi ma'lumotlarga ega bo'lishi kerak:

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `title` | String | ✅ **Majburiy** | Kitob nomi | "O'zbek tili grammatikasi" |
| `price` | Number | ✅ **Majburiy** | Kitob narxi (so'm) | 45000 |
| `qty` | Number | ✅ **Majburiy** | Miqdori (nechta) | 2 |
| `author` | String | ⭐ Optional | Muallif ismi | "A.Nurmonov" |
| `image` | String | ⭐ Optional | Rasm URL | "/images/book.jpg" |
| `slug` | String | ⭐ Optional | URL slug | "uzbek-tili" |
| `bookId` | String | ⭐ Optional | Kitob ID | "book_001" |

#### Mijoz ma'lumotlari (Customer Info)

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `customerName` | String | ✅ **Majburiy** | Mijoz ismi | "Said Qodirov" |
| `customerEmail` | String | ✅ **Majburiy** | Email manzil | "said@example.com" |
| `customerPhone` | String | ✅ **Majburiy** | Telefon raqam | "+998901234567" |

---

## ✅ Success Response (200/201)

```json
{
  "success": true,
  "orderId": "670d41234567890abcdef123",
  "amount": 120000,
  "click_url": "https://my.click.uz/services/pay?service_id=83510&merchant_id=46304&amount=120000&transaction_param=670d41234567890abcdef123&return_url=https://saadahbooks.uz/payment/success"
}
```

### Response Fields:
- `success` - To'lov muvaffaqiyatli yaratildi
- `orderId` - Transaction ID (statusni tekshirish uchun)
- `amount` - Umumiy summa (so'm)
- `click_url` - Click.uz to'lov sahifasiga o'tish uchun URL

---

## ❌ Error Responses (400)

### 1. Bo'sh items array
```json
{
  "error": "Kitoblar ro'yxati bo'sh"
}
```

### 2. Item ma'lumotlari to'liq emas
```json
{
  "error": "Kitob ma'lumotlari to'liq emas. title, price, qty majburiy"
}
```

### 3. Mijoz ma'lumotlari to'liq emas
```json
{
  "error": "Mijoz ma'lumotlari to'liq emas"
}
```

---

## 💻 Frontend Code Examples

### JavaScript (Fetch API)

```javascript
async function createPayment(cartItems, customerInfo) {
  try {
    const response = await fetch('https://pay.saadahbooks.uz/api/payments/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: cartItems.map(item => ({
          title: item.title,
          price: item.price,
          qty: item.quantity, // Frontdan kelgan qty
          author: item.author,
          image: item.image,
          slug: item.slug,
          bookId: item.id,
        })),
        customerName: customerInfo.name,
        customerEmail: customerInfo.email,
        customerPhone: customerInfo.phone,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      // To'lov sahifasiga yo'naltirish
      window.location.href = data.click_url;
    } else {
      // Xatolikni ko'rsatish
      alert(data.error);
    }
  } catch (error) {
    console.error('Payment error:', error);
    alert('To\'lov yaratishda xatolik yuz berdi');
  }
}
```

### React Example

```jsx
import { useState } from 'react';

function CheckoutPage({ cart, customer }) {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);

    try {
      const response = await fetch('https://pay.saadahbooks.uz/api/payments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: cart.map(book => ({
            title: book.title,
            price: book.price,
            qty: book.qty,
            author: book.author,
            image: book.coverImage,
            slug: book.slug,
            bookId: book.id,
          })),
          customerName: customer.fullName,
          customerEmail: customer.email,
          customerPhone: customer.phone,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        // Click.uz ga yo'naltirish
        window.location.href = result.click_url;
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handlePayment} disabled={loading}>
      {loading ? 'Yuklanmoqda...' : 'To\'lash'}
    </button>
  );
}
```

### Vue.js Example

```vue
<script setup>
import { ref } from 'vue';

const loading = ref(false);

async function createPayment(cart, customer) {
  loading.value = true;

  try {
    const response = await fetch('https://pay.saadahbooks.uz/api/payments/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: cart.map(item => ({
          title: item.title,
          price: item.price,
          qty: item.quantity,
          author: item.author,
          image: item.imageUrl,
          slug: item.slug,
          bookId: item.id,
        })),
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      window.location.href = data.click_url;
    } else {
      alert(data.error);
    }
  } catch (error) {
    console.error('Payment failed:', error);
  } finally {
    loading.value = false;
  }
}
</script>
```

---

## 🔍 To'lov statusini tekshirish

### Endpoint
```
GET https://pay.saadahbooks.uz/api/payments/:orderId
```

### Example Request
```javascript
const orderId = '670d41234567890abcdef123';
const response = await fetch(`https://pay.saadahbooks.uz/api/payments/${orderId}`);
const order = await response.json();

console.log(order.state); // 0=pending, 1=preparing, 2=paid, -1=canceled
```

### Response
```json
{
  "_id": "670d41234567890abcdef123",
  "id": "click_trans_12345",
  "items": [
    {
      "title": "O'zbek tili grammatikasi",
      "price": 45000,
      "qty": 2,
      "author": "A.Nurmonov"
    }
  ],
  "customerName": "Said Qodirov",
  "customerEmail": "said@example.com",
  "customerPhone": "+998901234567",
  "amount": 90000,
  "state": 2,
  "provider": "click",
  "create_time": 1728734567890,
  "perform_time": 1728734590123
}
```

### State qiymatlari:
- `0` - Pending (Kutilmoqda)
- `1` - Preparing (Tayyorlanmoqda)
- `2` - Paid (To'landi) ✅
- `-1` - Canceled (Bekor qilindi) ❌
- `-2` - Paid then Canceled

---

## 🎯 To'liq Test Example

```javascript
// Test data
const testPayment = {
  items: [
    {
      title: "O'zbek tili grammatikasi",
      price: 45000,
      qty: 2,
      author: "A.Nurmonov",
      image: "/images/book1.jpg",
      slug: "uzbek-tili",
      bookId: "book_001"
    },
    {
      title: "Matematika asoslari",
      price: 30000,
      qty: 1,
      author: "B.Karimov",
      image: "/images/book2.jpg",
      slug: "matematika",
      bookId: "book_002"
    }
  ],
  customerName: "Said Qodirov",
  customerEmail: "said@example.com",
  customerPhone: "+998901234567"
};

// Total amount calculation:
// (45000 * 2) + (30000 * 1) = 90000 + 30000 = 120000 so'm

fetch('https://pay.saadahbooks.uz/api/payments/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(testPayment)
})
  .then(res => res.json())
  .then(data => {
    console.log('Payment created:', data);
    // Redirect to Click.uz
    if (data.click_url) {
      window.location.href = data.click_url;
    }
  })
  .catch(err => console.error('Error:', err));
```

---

## 📝 Muhim Eslatmalar

1. **Majburiy fields:** `title`, `price`, `qty`, `customerName`, `customerEmail`, `customerPhone` - bularni albatta yuboring!

2. **qty field:** Har bir kitob uchun miqdor (quantity). Default: 1

3. **Total amount:** Backend avtomatik hisoblab chiqadi:
   ```
   totalAmount = Σ(price × qty)
   ```

4. **Telefon format:** `+998901234567` formatida yuboring

5. **Success redirect:** `click_url` ga foydalanuvchini yo'naltiring

6. **Transaction ID:** Response'dagi `orderId` ni saqlang - keyinchalik status tekshirish uchun kerak bo'ladi

---

## 🆘 Ko'p uchraydigan xatoliklar

### ❌ 400 - Kitoblar ro'yxati bo'sh
**Sabab:** `items` array bo'sh yoki yo'q  
**Yechim:** Kamida 1 ta kitob qo'shing

### ❌ 400 - title, price, qty majburiy
**Sabab:** Item ichida bu fieldlardan biri yo'q  
**Yechim:** Har bir item uchun bu 3 ta field majburiy

### ❌ 400 - Mijoz ma'lumotlari to'liq emas
**Sabab:** `customerName`, `customerEmail` yoki `customerPhone` yo'q  
**Yechim:** Uch ta field ham majburiy

### ❌ 404 - Not Found
**Sabab:** Noto'g'ri URL  
**Yechim:** `https://pay.saadahbooks.uz/api/payments/create` ishlatilganiga ishonch hosil qiling

---

## 📞 Qo'shimcha yordam

Agar qo'shimcha savol bo'lsa, backend developer bilan bog'laning.

**Test mode:** Lokal serverda test qilish uchun:
```
http://localhost:9999/api/payments/create
```
