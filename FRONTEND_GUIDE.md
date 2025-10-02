# 📚 Frontend Integration - Kitoblar Frontend-da

## 📖 Kitoblar ma'lumotlari Frontend-da JSON formatida

Backend faqat buyurtma va to'lovlarni boshqaradi. Kitoblar ma'lumotlari frontend-da saqlanadi.

### 1. Kitoblar JSON struktura

```javascript
// src/data/books.json yoki src/constants/books.js

export const books = [
  {
    bookId: "book_001",
    title: "O'zbek tili grammatikasi",
    price: 45000,
    author: "A.Nurmonov",
    description: "O'zbek tili grammatikasi bo'yicha to'liq qo'llanma",
    image: "/images/books/uzbek-grammar.jpg",
    category: "Ta'lim",
    pages: 350,
    language: "uz",
    isbn: "978-9943-01-234-5"
  },
  {
    bookId: "book_002",
    title: "Matematika asoslari",
    price: 30000,
    author: "B.Karimov",
    description: "Matematikadan boshlovchilar uchun qo'llanma",
    image: "/images/books/math-basics.jpg",
    category: "Ta'lim",
    pages: 280,
    language: "uz",
    isbn: "978-9943-01-235-2"
  },
  {
    bookId: "book_003",
    title: "Ingliz tili darsligi",
    price: 55000,
    author: "M.Tursunov",
    description: "Ingliz tilini o'rganish uchun kompleks dastur",
    image: "/images/books/english.jpg",
    category: "Til o'rganish",
    pages: 420,
    language: "uz",
    isbn: "978-9943-01-236-9"
  },
  {
    bookId: "book_004",
    title: "Dasturlash asoslari",
    price: 65000,
    author: "D.Ismoilov",
    description: "Python dasturlash tili bo'yicha qo'llanma",
    image: "/images/books/programming.jpg",
    category: "IT",
    pages: 500,
    language: "uz",
    isbn: "978-9943-01-237-6"
  }
]
```

## 🔄 Backend API - Faqat Buyurtmalar

### 1. Buyurtma yaratish

**Endpoint:** `POST /api/orders`

**Request Body:**
```json
{
  "books": [
    {
      "bookId": "book_001",
      "title": "O'zbek tili grammatikasi",
      "price": 45000,
      "author": "A.Nurmonov",
      "image": "/images/books/uzbek-grammar.jpg"
    },
    {
      "bookId": "book_002",
      "title": "Matematika asoslari",
      "price": 30000,
      "author": "B.Karimov",
      "image": "/images/books/math-basics.jpg"
    }
  ],
  "customerName": "Said Qodirov",
  "customerEmail": "said@example.com",
  "customerPhone": "+998901234567"
}
```

**Response:**
```json
{
  "success": true,
  "transaction": {
    "_id": "67890xyz",
    "books": [
      {
        "bookId": "book_001",
        "title": "O'zbek tili grammatikasi",
        "price": 45000,
        "author": "A.Nurmonov",
        "image": "/images/books/uzbek-grammar.jpg"
      },
      {
        "bookId": "book_002",
        "title": "Matematika asoslari",
        "price": 30000,
        "author": "B.Karimov",
        "image": "/images/books/math-basics.jpg"
      }
    ],
    "customerName": "Said Qodirov",
    "customerEmail": "said@example.com",
    "customerPhone": "+998901234567",
    "amount": 75000,
    "state": 0,
    "provider": "click",
    "create_time": 1696248000000
  },
  "totalAmount": 75000
}
```

## 💻 React.js To'liq Misol

### 1. Kitoblar ma'lumotlari
```jsx
// src/data/books.js
export const booksData = [
  {
    bookId: "book_001",
    title: "O'zbek tili grammatikasi",
    price: 45000,
    author: "A.Nurmonov",
    description: "O'zbek tili grammatikasi bo'yicha to'liq qo'llanma",
    image: "/images/books/uzbek-grammar.jpg",
    category: "Ta'lim",
    pages: 350,
    language: "uz"
  },
  {
    bookId: "book_002",
    title: "Matematika asoslari",
    price: 30000,
    author: "B.Karimov",
    description: "Matematikadan boshlovchilar uchun qo'llanma",
    image: "/images/books/math-basics.jpg",
    category: "Ta'lim",
    pages: 280,
    language: "uz"
  },
  // ... boshqa kitoblar
]
```

### 2. Kitoblar ro'yxati komponenti
```jsx
// src/components/BooksList.jsx
import { useState } from 'react'
import { booksData } from '../data/books'

function BooksList({ onAddToCart }) {
  const [selectedCategory, setSelectedCategory] = useState('all')

  const filteredBooks = selectedCategory === 'all' 
    ? booksData 
    : booksData.filter(book => book.category === selectedCategory)

  const categories = ['all', ...new Set(booksData.map(book => book.category))]

  return (
    <div className="books-section">
      <div className="filters">
        <h3>Kategoriya:</h3>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={selectedCategory === cat ? 'active' : ''}
          >
            {cat === 'all' ? 'Hammasi' : cat}
          </button>
        ))}
      </div>

      <div className="books-grid">
        {filteredBooks.map(book => (
          <div key={book.bookId} className="book-card">
            <img src={book.image} alt={book.title} />
            <h3>{book.title}</h3>
            <p className="author">{book.author}</p>
            <p className="description">{book.description}</p>
            <div className="book-info">
              <span>📄 {book.pages} bet</span>
              <span>🌐 {book.language}</span>
            </div>
            <p className="price">{book.price.toLocaleString()} so'm</p>
            <button onClick={() => onAddToCart(book)}>
              Savatga qo'shish
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default BooksList
```

### 3. Savat (Cart) komponenti
```jsx
// src/components/Cart.jsx
import { useState } from 'react'

function Cart({ cartItems, onRemove, onCheckout }) {
  const totalAmount = cartItems.reduce((sum, book) => sum + book.price, 0)

  return (
    <div className="cart">
      <h2>Savat ({cartItems.length} ta kitob)</h2>

      {cartItems.length === 0 ? (
        <p>Savat bo'sh</p>
      ) : (
        <>
          <div className="cart-items">
            {cartItems.map((book, index) => (
              <div key={`${book.bookId}_${index}`} className="cart-item">
                <img src={book.image} alt={book.title} />
                <div className="item-details">
                  <h4>{book.title}</h4>
                  <p>{book.author}</p>
                </div>
                <p className="price">{book.price.toLocaleString()} so'm</p>
                <button onClick={() => onRemove(index)}>O'chirish</button>
              </div>
            ))}
          </div>

          <div className="cart-total">
            <h3>Jami: {totalAmount.toLocaleString()} so'm</h3>
            <button className="checkout-btn" onClick={onCheckout}>
              To'lovga o'tish
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default Cart
```

### 4. Checkout komponenti
```jsx
// src/components/Checkout.jsx
import { useState } from 'react'
import axios from 'axios'

function Checkout({ cartItems }) {
  const [customerInfo, setCustomerInfo] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: ''
  })
  const [loading, setLoading] = useState(false)

  const totalAmount = cartItems.reduce((sum, book) => sum + book.price, 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // 1. Backend-ga buyurtma yuborish
      const orderData = {
        books: cartItems.map(book => ({
          bookId: book.bookId,
          title: book.title,
          price: book.price,
          author: book.author,
          image: book.image
        })),
        ...customerInfo
      }

      const response = await axios.post(
        'http://localhost:9999/api/orders',
        orderData
      )

      const { transaction } = response.data

      // 2. Click.uz to'lov sahifasiga yo'naltirish
      const paymentUrl = generateClickPaymentUrl(
        transaction._id,
        transaction.amount
      )

      window.location.href = paymentUrl

    } catch (error) {
      console.error('Xatolik:', error)
      alert('Xatolik yuz berdi. Iltimos qayta urinib ko\'ring.')
      setLoading(false)
    }
  }

  const generateClickPaymentUrl = (orderId, amount) => {
    const params = new URLSearchParams({
      service_id: '83510',
      merchant_id: '46304',
      merchant_user_id: '64634',
      amount: amount,
      transaction_param: orderId,
      return_url: `${window.location.origin}/payment-success`,
      merchant_trans_id: orderId
    })

    return `https://my.click.uz/services/pay?${params.toString()}`
  }

  return (
    <div className="checkout">
      <h2>To'lov ma'lumotlari</h2>

      <div className="order-summary">
        <h3>Buyurtma tarkibi:</h3>
        {cartItems.map(book => (
          <div key={book.bookId} className="summary-item">
            <span>{book.title}</span>
            <span>{book.price.toLocaleString()} so'm</span>
          </div>
        ))}
        <div className="summary-total">
          <strong>Jami:</strong>
          <strong>{totalAmount.toLocaleString()} so'm</strong>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Ism familiya *</label>
          <input
            type="text"
            required
            value={customerInfo.customerName}
            onChange={(e) => setCustomerInfo({
              ...customerInfo,
              customerName: e.target.value
            })}
            placeholder="Ism familiyangizni kiriting"
          />
        </div>

        <div className="form-group">
          <label>Email *</label>
          <input
            type="email"
            required
            value={customerInfo.customerEmail}
            onChange={(e) => setCustomerInfo({
              ...customerInfo,
              customerEmail: e.target.value
            })}
            placeholder="email@example.com"
          />
        </div>

        <div className="form-group">
          <label>Telefon *</label>
          <input
            type="tel"
            required
            value={customerInfo.customerPhone}
            onChange={(e) => setCustomerInfo({
              ...customerInfo,
              customerPhone: e.target.value
            })}
            placeholder="+998 90 123 45 67"
          />
        </div>

        <button type="submit" disabled={loading} className="pay-btn">
          {loading ? 'Yuklanmoqda...' : 'To\'lovga o\'tish'}
        </button>
      </form>
    </div>
  )
}

export default Checkout
```

### 5. Main App komponenti
```jsx
// src/App.jsx
import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import BooksList from './components/BooksList'
import Cart from './components/Cart'
import Checkout from './components/Checkout'
import PaymentSuccess from './components/PaymentSuccess'

function App() {
  const [cart, setCart] = useState([])
  const [showCart, setShowCart] = useState(false)

  const addToCart = (book) => {
    setCart([...cart, book])
    alert(`"${book.title}" savatga qo'shildi!`)
  }

  const removeFromCart = (index) => {
    const newCart = cart.filter((_, i) => i !== index)
    setCart(newCart)
  }

  const handleCheckout = () => {
    window.location.href = '/checkout'
  }

  return (
    <BrowserRouter>
      <div className="app">
        <header>
          <h1>📚 Saadah Books</h1>
          <button onClick={() => setShowCart(!showCart)}>
            🛒 Savat ({cart.length})
          </button>
        </header>

        <Routes>
          <Route path="/" element={
            <div className="main-content">
              <BooksList onAddToCart={addToCart} />
              {showCart && (
                <Cart
                  cartItems={cart}
                  onRemove={removeFromCart}
                  onCheckout={handleCheckout}
                />
              )}
            </div>
          } />
          
          <Route path="/checkout" element={
            <Checkout cartItems={cart} />
          } />
          
          <Route path="/payment-success" element={
            <PaymentSuccess />
          } />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
```

### 6. Payment Success komponenti
```jsx
// src/components/PaymentSuccess.jsx
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import axios from 'axios'

function PaymentSuccess() {
  const [searchParams] = useSearchParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkPaymentStatus()
  }, [])

  const checkPaymentStatus = async () => {
    try {
      const orderId = searchParams.get('merchant_trans_id')
      
      const response = await axios.get(
        `http://localhost:9999/api/orders/${orderId}`
      )
      
      setOrder(response.data)
      setLoading(false)
    } catch (error) {
      console.error('Xatolik:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="loading">Tekshirilmoqda...</div>
  }

  if (order && order.state === 2) {
    return (
      <div className="success-page">
        <div className="success-icon">✅</div>
        <h1>To'lov muvaffaqiyatli!</h1>
        <p>Sizning buyurtmangiz qabul qilindi.</p>
        
        <div className="order-details">
          <h3>Buyurtma ma'lumotlari:</h3>
          <p><strong>Buyurtma raqami:</strong> {order._id}</p>
          <p><strong>Summa:</strong> {order.amount.toLocaleString()} so'm</p>
          <p><strong>Mijoz:</strong> {order.customerName}</p>
          <p><strong>Email:</strong> {order.customerEmail}</p>
          
          <h4>Sotib olingan kitoblar:</h4>
          <ul>
            {order.books.map((book, index) => (
              <li key={index}>
                <strong>{book.title}</strong> - {book.price.toLocaleString()} so'm
              </li>
            ))}
          </ul>
        </div>

        <button onClick={() => window.location.href = '/'}>
          Bosh sahifaga qaytish
        </button>
      </div>
    )
  }

  return (
    <div className="error-page">
      <div className="error-icon">❌</div>
      <h1>To'lov amalga oshmadi</h1>
      <p>Iltimos qayta urinib ko'ring.</p>
      <button onClick={() => window.location.href = '/'}>
        Bosh sahifaga qaytish
      </button>
    </div>
  )
}

export default PaymentSuccess
```

## 📱 Telegram'da qanday ko'rinadi:

To'lov muvaffaqiyatli bo'lganda:
```
🎉 Yangi to'lov muvaffaqiyatli!

💳 Transaction ID: 67890xyz
💰 Summa: 75,000 so'm
📅 Sana: 02.10.2025, 15:30

📚 Sotib olingan kitoblar:
📖 O'zbek tili grammatikasi - 45,000 so'm
📖 Matematika asoslari - 30,000 so'm

✅ Holat: To'landi
🔗 Provider: click

👤 Mijoz: Said Qodirov
📧 Email: said@example.com
📞 Telefon: +998901234567
```

## 🎯 Muhim:

1. ✅ Kitoblar frontend-da JSON-da
2. ✅ Backend faqat buyurtma va to'lovni boshqaradi
3. ✅ Buyurtma yaratishda kitob ma'lumotlari backend-ga yuboriladi
4. ✅ Telegram'ga kitoblar ro'yxati bilan xabar boradi
5. ✅ Product model kerak emas

Barchasi tayyor! 🚀
