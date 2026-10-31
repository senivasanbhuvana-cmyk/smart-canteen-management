import React, { useState } from 'react';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import EmptyState from '../components/common/EmptyState';
import CheckoutModal from './CheckoutModal';

export default function CartPage({ onNavigate }) {
  const { cart, updateQuantity, removeFromCart, clearCart, subtotal, finalTotal, totalItems } = useCart();
  const { isAuthenticated, openAuthModal } = useAuth();

  const [notes, setNotes] = useState('');
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);

  const handleProceedCheckout = () => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    setCheckoutModalOpen(true);
  };

  if (cart.length === 0) {
    return (
      <div className="cart-page-wrap">
        <div className="cart-container empty">
          <EmptyState
            icon={ShoppingBag}
            title="Your food cart is empty"
            description="Looks like you haven't added any cafeteria meals yet. Explore our fresh menu to satisfy your hunger!"
            actionText="Browse Menu"
            onAction={() => onNavigate('menu')}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page-wrap">
      <div className="cart-container">
        <div className="cart-header-row">
          <div>
            <h1 className="cart-page-title">Your Food Cart</h1>
            <p className="cart-page-subtitle">
              Review your meal items before placing your order with the campus cafeteria.
            </p>
          </div>
          <button onClick={clearCart} className="btn-clear-cart">
            <Trash2 size={16} />
            <span>Clear Cart</span>
          </button>
        </div>

        <div className="cart-layout-grid">
          {/* Cart Items List */}
          <div className="cart-items-column">
            <div className="cart-items-card">
              {cart.map((item) => (
                <div key={item.id} className="cart-item-row">
                  <img
                    src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80'}
                    alt={item.name}
                    className="cart-item-img"
                  />

                  <div className="cart-item-info">
                    <div className="cart-item-title-row">
                      <h3 className="cart-item-name">{item.name}</h3>
                      <span className={`diet-badge-sm ${item.is_veg ? 'diet-veg' : 'diet-nonveg'}`}>
                        <span className="diet-badge-dot"></span>
                      </span>
                    </div>
                    <span className="cart-item-category">{item.category}</span>
                    <p className="cart-item-unit-price">₹{item.price.toFixed(2)} each</p>
                  </div>

                  {/* Quantity Control */}
                  <div className="cart-qty-controller">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="qty-btn"
                      aria-label="Decrease quantity"
                    >
                      <Minus size={15} />
                    </button>
                    <span className="qty-number">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="qty-btn"
                      disabled={item.quantity >= item.stock_quantity}
                      aria-label="Increase quantity"
                    >
                      <Plus size={15} />
                    </button>
                  </div>

                  {/* Line Total */}
                  <div className="cart-item-total">
                    <span className="item-subtotal-val">
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="btn-item-remove"
                    title="Remove item"
                    aria-label="Remove item"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>

            {/* Special Instructions Note Box */}
            <div className="cart-instructions-card">
              <div className="instructions-header">
                <FileText size={18} className="text-orange" />
                <label htmlFor="order-notes" className="instructions-label">
                  Special Kitchen Notes (Optional)
                </label>
              </div>
              <textarea
                id="order-notes"
                placeholder="e.g. Extra spicy sambar, less sugar in coffee, pack for takeaway..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="instructions-textarea"
              />
            </div>
          </div>

          {/* Cart Bill Summary Column */}
          <div className="cart-summary-column">
            <div className="summary-card">
              <h3 className="summary-title">Order Summary</h3>

              <div className="summary-line">
                <span className="summary-label">Items Subtotal ({totalItems})</span>
                <span className="summary-val">₹{subtotal.toFixed(2)}</span>
              </div>

              <div className="summary-line">
                <span className="summary-label">Packaging & Convenience Fee</span>
                <span className="summary-val text-green font-semibold">FREE (₹0)</span>
              </div>

              <div className="summary-line">
                <span className="summary-label">College Cafeteria Discount</span>
                <span className="summary-val text-green font-semibold">Applied</span>
              </div>

              <div className="summary-divider"></div>

              <div className="summary-line total">
                <span className="total-label">Final Amount</span>
                <span className="total-val">₹{finalTotal.toFixed(2)}</span>
              </div>

              <button
                onClick={handleProceedCheckout}
                className="btn btn-primary btn-block checkout-btn"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight size={18} />
              </button>

              <div className="security-notice">
                <ShieldCheck size={16} />
                <span>Zero real card charges • Demo student ordering</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        notes={notes}
        onSuccess={(order) => {
          setCheckoutModalOpen(false);
          clearCart();
          onNavigate('orders');
        }}
      />
    </div>
  );
}
