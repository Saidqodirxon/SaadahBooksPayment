# Click.uz Payment Integration - Frontend Development Guide

## Project Overview
You need to create a frontend application that integrates with an existing Click.uz payment backend. The backend is already implemented with Node.js/Express and provides payment processing endpoints.

## Backend API Details

### Base URL: `http://localhost:5000/api`

### Available Endpoints:

1. **Payment Processing Endpoints** (handled by Click.uz):
   - `POST /click/prepare` - Click.uz calls this for payment preparation
   - `POST /click/complete` - Click.uz calls this for payment completion

### Required Frontend Features:

## 1. Payment Initiation Page
Create a page where users can:
- Enter payment amount
- Select products/services
- Initiate payment process

## 2. Payment Processing Flow
Implement the following payment flow:

### Step 1: Create Payment Request
```javascript
// Frontend should call your backend to create a payment
const createPayment = async (amount, productId) => {
  const response = await fetch('/api/payments/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: amount,
      productId: productId,
      userId: currentUser.id
    })
  });
  return response.json();
};
```

### Step 2: Redirect to Click.uz
```javascript
// Generate Click.uz payment URL and redirect user
const redirectToClick = (transactionId, amount) => {
  const clickUrl = `https://my.click.uz/services/pay?service_id=83510&merchant_id=46304&amount=${amount}&transaction_param=${transactionId}`;
  window.location.href = clickUrl;
};
```

### Step 3: Handle Payment Result
```javascript
// Create success and failure pages to handle redirects from Click.uz
// Success: /payment/success?transaction_id=123
// Failure: /payment/failure?transaction_id=123&error=message
```

## 3. Required Backend Endpoints to Add

You need to add these endpoints to your existing backend:

### Create Payment Endpoint
```javascript
// POST /api/payments/create
{
  "amount": 50000,
  "productId": "product_123",
  "userId": "user_456"
}

// Response:
{
  "success": true,
  "transactionId": "tx_789",
  "paymentUrl": "https://my.click.uz/services/pay?..."
}
```

### Check Payment Status
```javascript
// GET /api/payments/status/:transactionId
// Response:
{
  "transactionId": "tx_789",
  "status": "paid|pending|failed",
  "amount": 50000,
  "createdAt": "2025-01-01T10:00:00Z",
  "paidAt": "2025-01-01T10:05:00Z"
}
```

### Get Payment History
```javascript
// GET /api/payments/history/:userId
// Response:
{
  "payments": [
    {
      "transactionId": "tx_789",
      "amount": 50000,
      "status": "paid",
      "createdAt": "2025-01-01T10:00:00Z"
    }
  ]
}
```

## 4. Frontend Technology Stack Suggestions

### React.js Implementation:
```jsx
// PaymentForm.jsx
import React, { useState } from 'react';

const PaymentForm = () => {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseInt(amount) * 100 })
      });
      
      const data = await response.json();
      
      if (data.success) {
        window.location.href = data.paymentUrl;
      } else {
        alert('Payment creation failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
    }
    setLoading(false);
  };

  return (
    <div className="payment-form">
      <h2>Click.uz Payment</h2>
      <input
        type="number"
        placeholder="Enter amount (UZS)"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <button onClick={handlePayment} disabled={loading}>
        {loading ? 'Processing...' : 'Pay with Click'}
      </button>
    </div>
  );
};

export default PaymentForm;
```

### Next.js Implementation:
```jsx
// pages/payment.js
import { useState } from 'react';
import { useRouter } from 'next/router';

export default function PaymentPage() {
  const router = useRouter();
  const [paymentData, setPaymentData] = useState({
    amount: '',
    description: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const response = await fetch('/api/payments/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData)
    });
    
    const result = await response.json();
    
    if (result.success) {
      window.location.href = result.paymentUrl;
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="number"
        placeholder="Amount"
        value={paymentData.amount}
        onChange={(e) => setPaymentData({...paymentData, amount: e.target.value})}
      />
      <button type="submit">Pay with Click.uz</button>
    </form>
  );
}
```

### Vue.js Implementation:
```vue
<template>
  <div class="payment-container">
    <h2>Click.uz Payment</h2>
    <form @submit.prevent="processPayment">
      <input 
        v-model="amount" 
        type="number" 
        placeholder="Enter amount"
        required
      />
      <button type="submit" :disabled="loading">
        {{ loading ? 'Processing...' : 'Pay Now' }}
      </button>
    </form>
  </div>
</template>

<script>
export default {
  data() {
    return {
      amount: '',
      loading: false
    }
  },
  methods: {
    async processPayment() {
      this.loading = true;
      try {
        const response = await this.$http.post('/api/payments/create', {
          amount: this.amount * 100
        });
        
        if (response.data.success) {
          window.location.href = response.data.paymentUrl;
        }
      } catch (error) {
        console.error('Payment failed:', error);
      }
      this.loading = false;
    }
  }
}
</script>
```

## 5. Payment Flow Diagram

```
User → Frontend → Backend → Click.uz → Backend → Frontend
  1. Enter amount        4. Redirect to Click.uz
  2. Click "Pay"         5. User pays
  3. Create transaction  6. Click.uz calls prepare/complete
                        7. Backend updates status
                        8. User redirected back
                        9. Show success/failure
```

## 6. Required Backend Routes to Implement

Add these routes to your existing Express app:

```javascript
// routes/payments.js
const express = require('express');
const router = express.Router();

// Create payment
router.post('/create', async (req, res) => {
  // Implementation needed
});

// Check payment status
router.get('/status/:id', async (req, res) => {
  // Implementation needed
});

// Payment success callback
router.get('/success', async (req, res) => {
  // Implementation needed
});

// Payment failure callback
router.get('/failure', async (req, res) => {
  // Implementation needed
});

module.exports = router;
```

## 7. Environment Variables for Frontend

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_CLICK_MERCHANT_ID=46304
REACT_APP_CLICK_SERVICE_ID=83510
```

## 8. Security Considerations

- Never expose secret keys in frontend
- Validate all inputs on backend
- Use HTTPS in production
- Implement CSRF protection
- Add rate limiting for payment endpoints

## 9. Testing Strategy

1. Test payment creation
2. Test Click.uz redirect
3. Test success/failure callbacks
4. Test payment status updates
5. Test error handling

## Implementation Priority:

1. ✅ Backend payment creation endpoint
2. ✅ Frontend payment form
3. ✅ Click.uz redirect logic
4. ✅ Success/failure pages
5. ✅ Payment status checking
6. ✅ Error handling

Choose your preferred frontend framework and start with the payment form component. The backend endpoints for payment creation and status checking need to be added to your existing codebase.