import React, { useState } from 'react';
import {
  CreditCard,
  Banknote,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  ArrowRight,
  Receipt,
  Loader2,
} from 'lucide-react';
import Modal from '../components/common/Modal';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { orderAPI } from '../services/api';

export default function CheckoutModal({ isOpen, onClose, notes, onSuccess }) {
  const { cart, finalTotal, clearCart } = useCart();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [paymentMethod, setPaymentMethod] = useState('Demo Online Payment');
  const [submitting, setSubmitting] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handlePlaceOrder = async () => {
    setErrorMsg('');
    setSubmitting(true);

    try {
      const orderPayload = {
        items: cart.map((i) => ({
          food_item_id: i.id,
          quantity: i.quantity,
        })),
        payment_method: paymentMethod,
        notes: notes || '',
      };

      const res = await orderAPI.checkout(orderPayload);
      setPlacedOrder(res.order);
      showSuccess(`Order ${res.order.order_number} confirmed!`);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to place order. Please try again.');
      showError(err.message || 'Failed to place order.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinish = () => {
    if (placedOrder) {
      onSuccess(placedOrder);
    } else {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={placedOrder ? handleFinish : onClose}
      title={placedOrder ? 'Order Placed Successfully!' : 'Confirm Campus Order'}
      maxWidth="520px"
    >
      {placedOrder ? (
        /* Order Placed Success View */
        <div className="order-success-view">
          <div className="success-icon-badge">
            <CheckCircle2 size={54} className="text-green" />
          </div>

          <h3 className="success-title">Order Confirmed!</h3>
          <p className="success-subtitle">
            The cafeteria kitchen has received your order and added it to the preparation queue.
          </p>

          <div className="order-token-box">
            <span className="token-label">YOUR ORDER NUMBER</span>
            <span className="token-number">{placedOrder.order_number}</span>
            <span className="token-hint">Present this number at the cafeteria counter</span>
          </div>

          <div className="success-meta-list">
            <div className="success-meta-row">
              <span>Student:</span>
              <strong>{user?.name} ({user?.student_id || 'Student'})</strong>
            </div>
            <div className="success-meta-row">
              <span>Amount Paid / Due:</span>
              <strong>₹{placedOrder.total_amount.toFixed(2)}</strong>
            </div>
            <div className="success-meta-row">
              <span>Payment Option:</span>
              <strong>{placedOrder.payment_method}</strong>
            </div>
            <div className="success-meta-row">
              <span>Current Status:</span>
              <span className="badge-status placed">Order Placed</span>
            </div>
          </div>

          <button onClick={handleFinish} className="btn btn-primary btn-block btn-lg mt-4">
            <span>Track Order Timeline</span>
            <ArrowRight size={18} />
          </button>
        </div>
      ) : (
        /* Checkout Options View */
        <div className="checkout-form-view">
          {errorMsg && (
            <div className="form-alert form-alert-error mb-3">
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Quick summary of items */}
          <div className="checkout-summary-box">
            <div className="summary-box-header">
              <Receipt size={16} />
              <span>Order Breakdown ({cart.length} unique items)</span>
            </div>
            <div className="checkout-items-preview">
              {cart.map((item) => (
                <div key={item.id} className="checkout-item-mini">
                  <span className="mini-item-name">
                    {item.name} <span className="mini-item-qty">×{item.quantity}</span>
                  </span>
                  <span className="mini-item-price">
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
            <div className="checkout-final-sum">
              <span>Total Payable:</span>
              <span className="sum-val">₹{finalTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="payment-method-section">
            <label className="section-label">Select Payment Method</label>

            <div className="payment-options-grid">
              {/* Option 1: Demo Online Payment */}
              <div
                className={`payment-option-card ${
                  paymentMethod === 'Demo Online Payment' ? 'active' : ''
                }`}
                onClick={() => setPaymentMethod('Demo Online Payment')}
              >
                <div className="payment-option-radio">
                  <div
                    className={`radio-circle ${
                      paymentMethod === 'Demo Online Payment' ? 'checked' : ''
                    }`}
                  ></div>
                </div>
                <div className="payment-option-content">
                  <div className="payment-option-title">
                    <CreditCard size={18} className="text-orange" />
                    <span>Demo Online Payment</span>
                  </div>
                  <p className="payment-option-sub">
                    Simulated Instant Campus UPI / Wallet checkout.
                  </p>
                </div>
              </div>

              {/* Option 2: Cash at Counter */}
              <div
                className={`payment-option-card ${
                  paymentMethod === 'Cash at Counter' ? 'active' : ''
                }`}
                onClick={() => setPaymentMethod('Cash at Counter')}
              >
                <div className="payment-option-radio">
                  <div
                    className={`radio-circle ${
                      paymentMethod === 'Cash at Counter' ? 'checked' : ''
                    }`}
                  ></div>
                </div>
                <div className="payment-option-content">
                  <div className="payment-option-title">
                    <Banknote size={18} className="text-orange" />
                    <span>Cash at Counter</span>
                  </div>
                  <p className="payment-option-sub">
                    Pay at cafeteria pickup counter upon receiving your food.
                  </p>
                </div>
              </div>
            </div>

            {/* Simulation Disclaimer as per specification */}
            {paymentMethod === 'Demo Online Payment' && (
              <div className="simulation-notice-box">
                <ShieldAlert size={18} className="notice-icon" />
                <div className="notice-text">
                  <strong>Demo Simulation Mode:</strong> This college mini-project uses a mock
                  online payment flow. No real banking details or credit/debit cards are collected.
                </div>
              </div>
            )}
          </div>

          {notes && (
            <div className="checkout-note-preview">
              <span className="note-preview-label">Kitchen note:</span>
              <span className="note-preview-val">"{notes}"</span>
            </div>
          )}

          <div className="checkout-actions-row">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handlePlaceOrder}
              disabled={submitting || cart.length === 0}
              className="btn btn-primary checkout-confirm-btn"
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Placing Order...</span>
                </>
              ) : (
                <span>Confirm & Place Order (₹{finalTotal.toFixed(2)})</span>
              )}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
