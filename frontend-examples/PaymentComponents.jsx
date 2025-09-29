// React.js frontend component misoli

import React, { useState, useEffect } from 'react';
import './PaymentComponent.css';

// Payment Form Component
export const PaymentForm = () => {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Miqdorni validatsiya qilish
      const paymentAmount = parseInt(amount);
      if (paymentAmount <= 0) {
        throw new Error('Miqdor 0 dan katta bo\'lishi kerak');
      }

      // Backend-ga so'rov yuborish
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: paymentAmount * 100, // Tiyinga o'tkazish
          description: 'Online to\'lov'
        })
      });

      const data = await response.json();

      if (data.success) {
        // Click.uz ga redirect qilish
        window.location.href = data.paymentUrl;
      } else {
        setError(data.message || 'To\'lov yaratishda xatolik');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payment-form">
      <h2>Click.uz orqali to'lov</h2>
      
      <form onSubmit={handlePayment}>
        <div className="form-group">
          <label htmlFor="amount">To'lov miqdori (UZS):</label>
          <input
            type="number"
            id="amount"
            placeholder="Masalan: 50000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            min="1"
          />
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <button 
          type="submit" 
          disabled={loading || !amount}
          className="pay-button"
        >
          {loading ? 'Yaratilmoqda...' : 'Click.uz orqali to\'lash'}
        </button>
      </form>

      <div className="payment-info">
        <p>✅ Xavfsiz to'lov</p>
        <p>✅ Click.uz tomonidan himoyalangan</p>
        <p>✅ Kartalar: Humo, Uzcard, Visa, MasterCard</p>
      </div>
    </div>
  );
};

// Payment Status Component
export const PaymentStatus = ({ transactionId }) => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/payments/status/${transactionId}`);
        const data = await response.json();
        setStatus(data);
      } catch (error) {
        console.error('Status check error:', error);
      } finally {
        setLoading(false);
      }
    };

    if (transactionId) {
      checkStatus();
      
      // Har 5 soniyada status tekshirish
      const interval = setInterval(checkStatus, 5000);
      return () => clearInterval(interval);
    }
  }, [transactionId]);

  if (loading) {
    return <div className="loading">Status tekshirilmoqda...</div>;
  }

  if (!status) {
    return <div className="error">Status ma'lumotlari topilmadi</div>;
  }

  return (
    <div className="payment-status">
      <h3>To'lov holati</h3>
      
      <div className="status-info">
        <p><strong>Transaction ID:</strong> {status.transactionId}</p>
        <p><strong>Miqdor:</strong> {status.amount / 100} UZS</p>
        <p><strong>Holat:</strong> 
          <span className={`status-badge ${status.status}`}>
            {status.status === 'paid' ? 'To\'langan' : 
             status.status === 'pending' ? 'Kutilmoqda' : 'Muvaffaqiyatsiz'}
          </span>
        </p>
        <p><strong>Yaratilgan:</strong> {new Date(status.createdAt).toLocaleString()}</p>
        {status.paidAt && (
          <p><strong>To'langan:</strong> {new Date(status.paidAt).toLocaleString()}</p>
        )}
      </div>
    </div>
  );
};

// Payment History Component
export const PaymentHistory = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch(`/api/payments/history?page=${currentPage}&limit=10`);
        const data = await response.json();
        
        if (data.success) {
          setPayments(data.payments);
          setPagination(data.pagination);
        }
      } catch (error) {
        console.error('History fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [currentPage]);

  if (loading) {
    return <div className="loading">Tarix yuklanmoqda...</div>;
  }

  return (
    <div className="payment-history">
      <h3>To'lovlar tarixi</h3>
      
      {payments.length === 0 ? (
        <p>Hali to'lovlar yo'q</p>
      ) : (
        <div className="payments-table">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Miqdor</th>
                <th>Holat</th>
                <th>Yaratilgan</th>
                <th>To'langan</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(payment => (
                <tr key={payment.transactionId}>
                  <td>{payment.transactionId.substring(0, 8)}...</td>
                  <td>{payment.amount / 100} UZS</td>
                  <td>
                    <span className={`status-badge ${payment.status}`}>
                      {payment.status === 'paid' ? 'To\'langan' : 
                       payment.status === 'pending' ? 'Kutilmoqda' : 'Muvaffaqiyatsiz'}
                    </span>
                  </td>
                  <td>{new Date(payment.createdAt).toLocaleDateString()}</td>
                  <td>
                    {payment.paidAt ? new Date(payment.paidAt).toLocaleDateString() : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {pagination && pagination.totalPages > 1 && (
            <div className="pagination">
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                Oldingi
              </button>
              
              <span>
                {currentPage} / {pagination.totalPages}
              </span>
              
              <button 
                disabled={currentPage === pagination.totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Keyingi
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Success Page Component
export const PaymentSuccess = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const transactionId = urlParams.get('transaction_id');

  return (
    <div className="payment-success">
      <div className="success-icon">✅</div>
      <h2>To'lov muvaffaqiyatli!</h2>
      <p>Sizning to'lovingiz muvaffaqiyatli amalga oshirildi.</p>
      
      {transactionId && (
        <PaymentStatus transactionId={transactionId} />
      )}
      
      <button onClick={() => window.location.href = '/'}>
        Bosh sahifaga qaytish
      </button>
    </div>
  );
};

// Failure Page Component
export const PaymentFailure = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const transactionId = urlParams.get('transaction_id');
  const error = urlParams.get('error');

  return (
    <div className="payment-failure">
      <div className="error-icon">❌</div>
      <h2>To'lov muvaffaqiyatsiz!</h2>
      <p>Afsuski, to'lovingiz amalga oshmadi.</p>
      
      {error && (
        <div className="error-details">
          <p><strong>Xatolik:</strong> {error}</p>
        </div>
      )}
      
      {transactionId && (
        <PaymentStatus transactionId={transactionId} />
      )}
      
      <div className="action-buttons">
        <button onClick={() => window.location.href = '/payment'}>
          Qayta urinish
        </button>
        <button onClick={() => window.location.href = '/'}>
          Bosh sahifaga qaytish
        </button>
      </div>
    </div>
  );
};

// Main App component (usage example)
export const App = () => {
  const [currentPage, setCurrentPage] = useState('payment');

  const renderPage = () => {
    switch(currentPage) {
      case 'payment':
        return <PaymentForm />;
      case 'history':
        return <PaymentHistory />;
      case 'success':
        return <PaymentSuccess />;
      case 'failure':
        return <PaymentFailure />;
      default:
        return <PaymentForm />;
    }
  };

  return (
    <div className="app">
      <nav className="navigation">
        <button 
          onClick={() => setCurrentPage('payment')}
          className={currentPage === 'payment' ? 'active' : ''}
        >
          To'lov
        </button>
        <button 
          onClick={() => setCurrentPage('history')}
          className={currentPage === 'history' ? 'active' : ''}
        >
          Tarix
        </button>
      </nav>

      <main className="main-content">
        {renderPage()}
      </main>
    </div>
  );
};