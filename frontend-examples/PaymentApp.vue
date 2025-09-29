// Vue.js frontend component misoli

<template>
  <div id="app">
    <!-- Navigation -->
    <nav class="navigation">
      <button 
        @click="currentPage = 'payment'" 
        :class="{ active: currentPage === 'payment' }"
      >
        To'lov
      </button>
      <button 
        @click="currentPage = 'history'" 
        :class="{ active: currentPage === 'history' }"
      >
        Tarix
      </button>
    </nav>

    <!-- Payment Form -->
    <div v-if="currentPage === 'payment'" class="payment-form">
      <h2>Click.uz orqali to'lov</h2>
      
      <form @submit.prevent="processPayment">
        <div class="form-group">
          <label for="amount">To'lov miqdori (UZS):</label>
          <input
            v-model="paymentForm.amount"
            type="number"
            id="amount"
            placeholder="Masalan: 50000"
            required
            min="1"
            :disabled="loading"
          />
        </div>

        <div class="form-group">
          <label for="description">Izoh (ixtiyoriy):</label>
          <input
            v-model="paymentForm.description"
            type="text"
            id="description"
            placeholder="To'lov haqida qisqacha"
            :disabled="loading"
          />
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <button 
          type="submit" 
          :disabled="loading || !paymentForm.amount"
          class="pay-button"
        >
          {{ loading ? 'Yaratilmoqda...' : 'Click.uz orqali to\'lash' }}
        </button>
      </form>

      <div class="payment-info">
        <p>✅ Xavfsiz to'lov</p>
        <p>✅ Click.uz tomonidan himoyalangan</p>
        <p>✅ Kartalar: Humo, Uzcard, Visa, MasterCard</p>
      </div>
    </div>

    <!-- Payment History -->
    <div v-if="currentPage === 'history'" class="payment-history">
      <h3>To'lovlar tarixi</h3>
      
      <div v-if="historyLoading" class="loading">
        Tarix yuklanmoqda...
      </div>

      <div v-else-if="payments.length === 0" class="empty-state">
        <p>Hali to'lovlar yo'q</p>
      </div>

      <div v-else class="payments-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Miqdor</th>
              <th>Holat</th>
              <th>Yaratilgan</th>
              <th>To'langan</th>
              <th>Harakat</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="payment in payments" :key="payment.transactionId">
              <td>{{ payment.transactionId.substring(0, 8) }}...</td>
              <td>{{ formatAmount(payment.amount) }} UZS</td>
              <td>
                <span :class="`status-badge ${payment.status}`">
                  {{ getStatusText(payment.status) }}
                </span>
              </td>
              <td>{{ formatDate(payment.createdAt) }}</td>
              <td>{{ payment.paidAt ? formatDate(payment.paidAt) : '-' }}</td>
              <td>
                <button 
                  @click="checkPaymentStatus(payment.transactionId)"
                  class="check-status-btn"
                  :disabled="statusCheckLoading"
                >
                  Tekshirish
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination -->
        <div v-if="pagination && pagination.totalPages > 1" class="pagination">
          <button 
            @click="changePage(currentPageNum - 1)"
            :disabled="currentPageNum === 1"
          >
            Oldingi
          </button>
          
          <span>{{ currentPageNum }} / {{ pagination.totalPages }}</span>
          
          <button 
            @click="changePage(currentPageNum + 1)"
            :disabled="currentPageNum === pagination.totalPages"
          >
            Keyingi
          </button>
        </div>
      </div>
    </div>

    <!-- Payment Status Modal -->
    <div v-if="showStatusModal" class="modal-overlay" @click="closeStatusModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h4>To'lov holati</h4>
          <button @click="closeStatusModal" class="close-btn">&times;</button>
        </div>
        
        <div class="modal-body">
          <div v-if="selectedPaymentStatus">
            <div class="status-info">
              <p><strong>Transaction ID:</strong> {{ selectedPaymentStatus.transactionId }}</p>
              <p><strong>Miqdor:</strong> {{ formatAmount(selectedPaymentStatus.amount) }} UZS</p>
              <p><strong>Holat:</strong> 
                <span :class="`status-badge ${selectedPaymentStatus.status}`">
                  {{ getStatusText(selectedPaymentStatus.status) }}
                </span>
              </p>
              <p><strong>Yaratilgan:</strong> {{ formatDateTime(selectedPaymentStatus.createdAt) }}</p>
              <p v-if="selectedPaymentStatus.paidAt">
                <strong>To'langan:</strong> {{ formatDateTime(selectedPaymentStatus.paidAt) }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Success/Failure Pages -->
    <div v-if="currentPage === 'success'" class="payment-success">
      <div class="success-icon">✅</div>
      <h2>To'lov muvaffaqiyatli!</h2>
      <p>Sizning to'lovingiz muvaffaqiyatli amalga oshirildi.</p>
      <button @click="currentPage = 'payment'" class="action-btn">
        Yangi to'lov
      </button>
    </div>

    <div v-if="currentPage === 'failure'" class="payment-failure">
      <div class="error-icon">❌</div>
      <h2>To'lov muvaffaqiyatsiz!</h2>
      <p>Afsuski, to'lovingiz amalga oshmadi.</p>
      <div class="action-buttons">
        <button @click="currentPage = 'payment'" class="action-btn primary">
          Qayta urinish
        </button>
        <button @click="currentPage = 'history'" class="action-btn">
          Tarixni ko'rish
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'ClickPaymentApp',
  data() {
    return {
      currentPage: 'payment', // payment, history, success, failure
      loading: false,
      historyLoading: false,
      statusCheckLoading: false,
      error: '',
      
      // Payment form
      paymentForm: {
        amount: '',
        description: ''
      },
      
      // Payment history
      payments: [],
      pagination: null,
      currentPageNum: 1,
      
      // Status modal
      showStatusModal: false,
      selectedPaymentStatus: null
    }
  },
  
  mounted() {
    // URL parametrlarini tekshirish
    this.checkUrlParams()
    
    // Payment history yuklaw
    this.fetchPaymentHistory()
  },
  
  methods: {
    // Payment yaratish
    async processPayment() {
      this.loading = true
      this.error = ''

      try {
        // Miqdorni validatsiya qilish
        const amount = parseInt(this.paymentForm.amount)
        if (amount <= 0) {
          throw new Error('Miqdor 0 dan katta bo\'lishi kerak')
        }

        // Backend-ga so'rov
        const response = await axios.post('/api/payments/create', {
          amount: amount * 100, // Tiyinga o'tkazish
          description: this.paymentForm.description || 'Online to\'lov'
        })

        if (response.data.success) {
          // Click.uz ga redirect
          window.location.href = response.data.paymentUrl
        } else {
          this.error = response.data.message || 'To\'lov yaratishda xatolik'
        }
      } catch (error) {
        this.error = error.response?.data?.message || error.message
      } finally {
        this.loading = false
      }
    },

    // Payment history yuklash
    async fetchPaymentHistory() {
      this.historyLoading = true
      
      try {
        const response = await axios.get(`/api/payments/history?page=${this.currentPageNum}&limit=10`)
        
        if (response.data.success) {
          this.payments = response.data.payments
          this.pagination = response.data.pagination
        }
      } catch (error) {
        console.error('History fetch error:', error)
      } finally {
        this.historyLoading = false
      }
    },

    // Payment status tekshirish
    async checkPaymentStatus(transactionId) {
      this.statusCheckLoading = true
      
      try {
        const response = await axios.get(`/api/payments/status/${transactionId}`)
        
        if (response.data.success) {
          this.selectedPaymentStatus = response.data
          this.showStatusModal = true
          
          // History ni yangilash
          await this.fetchPaymentHistory()
        }
      } catch (error) {
        this.error = 'Status tekshirishda xatolik'
      } finally {
        this.statusCheckLoading = false
      }
    },

    // Sahifa o'zgartirish
    async changePage(page) {
      this.currentPageNum = page
      await this.fetchPaymentHistory()
    },

    // Status modal yopish
    closeStatusModal() {
      this.showStatusModal = false
      this.selectedPaymentStatus = null
    },

    // URL parametrlarini tekshirish
    checkUrlParams() {
      const urlParams = new URLSearchParams(window.location.search)
      const transactionId = urlParams.get('transaction_id')
      
      if (window.location.pathname.includes('/success')) {
        this.currentPage = 'success'
      } else if (window.location.pathname.includes('/failure')) {
        this.currentPage = 'failure'
      }
      
      if (transactionId) {
        this.checkPaymentStatus(transactionId)
      }
    },

    // Helper methods
    formatAmount(amount) {
      return (amount / 100).toLocaleString()
    },

    formatDate(date) {
      return new Date(date).toLocaleDateString('uz-UZ')
    },

    formatDateTime(date) {
      return new Date(date).toLocaleString('uz-UZ')
    },

    getStatusText(status) {
      const statusMap = {
        'paid': 'To\'langan',
        'pending': 'Kutilmoqda',
        'failed': 'Muvaffaqiyatsiz'
      }
      return statusMap[status] || status
    }
  }
}
</script>

<style>
/* Bu yerda CSS faylini import qiling yoki inline style yozing */
@import './PaymentComponent.css';

/* Vue-specific styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #e0e0e0;
}

.modal-header h4 {
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
}

.close-btn:hover {
  color: #000;
}

.modal-body {
  padding: 1rem;
}

.check-status-btn {
  padding: 0.25rem 0.5rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
}

.check-status-btn:hover:not(:disabled) {
  background: #0056b3;
}

.check-status-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.action-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
  margin: 0.25rem;
}

.action-btn.primary {
  background: #007bff;
  color: white;
}

.action-btn:not(.primary) {
  background: #6c757d;
  color: white;
}

.action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #666;
  font-style: italic;
}
</style>