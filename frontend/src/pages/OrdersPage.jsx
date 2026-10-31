import React, { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ChefHat,
  PackageCheck,
  ShoppingBag,
  RefreshCw,
  Ban,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import Modal from '../components/common/Modal';
import { orderAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

const TIMELINE_STEPS = [
  { key: 'Placed', label: 'Order Placed', icon: Clock },
  { key: 'Confirmed', label: 'Confirmed', icon: CheckCircle2 },
  { key: 'Preparing', label: 'Preparing', icon: ChefHat },
  { key: 'Ready for Pickup', label: 'Ready for Pickup', icon: PackageCheck },
  { key: 'Completed', label: 'Completed', icon: CheckCircle2 },
];

export default function OrdersPage({ onNavigate }) {
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const { showSuccess, showError } = useToast();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [confirmCancelOrder, setConfirmCancelOrder] = useState(null);
  const [expandedOrders, setExpandedOrders] = useState({});

  const fetchOrders = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await orderAPI.getMyOrders();
      setOrders(res.orders || []);
      // Expand top order by default
      if (res.orders && res.orders.length > 0) {
        setExpandedOrders((prev) => ({
          ...prev,
          [res.orders[0].id]: true,
        }));
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      showError('Failed to fetch your orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [isAuthenticated]);

  const toggleExpand = (id) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleCancelClick = (order) => {
    setConfirmCancelOrder(order);
  };

  const handleExecuteCancel = async () => {
    if (!confirmCancelOrder) return;
    const orderId = confirmCancelOrder.id;
    setCancellingId(orderId);
    try {
      await orderAPI.cancel(orderId);
      showSuccess(`Order ${confirmCancelOrder.order_number} has been cancelled.`);
      setConfirmCancelOrder(null);
      fetchOrders();
    } catch (err) {
      showError(err.message || 'Failed to cancel order.');
    } finally {
      setCancellingId(null);
    }
  };

  const getStepStatus = (orderStatus, stepKey) => {
    if (orderStatus === 'Cancelled') return 'cancelled';

    const orderIndex = TIMELINE_STEPS.findIndex((s) => s.key === orderStatus);
    const stepIndex = TIMELINE_STEPS.findIndex((s) => s.key === stepKey);

    if (stepIndex < orderIndex) return 'completed';
    if (stepIndex === orderIndex) return 'current';
    return 'upcoming';
  };

  if (!isAuthenticated) {
    return (
      <div className="orders-page-wrap">
        <div className="orders-container empty">
          <EmptyState
            icon={Clock}
            title="Sign in to view your orders"
            description="Please log in with your student credentials to track your meal preparation and past orders."
            actionText="Sign In / Register"
            onAction={() => openAuthModal('login')}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="orders-page-wrap">
      <div className="orders-container">
        <div className="orders-header-row">
          <div>
            <h1 className="orders-page-title">My Canteen Orders</h1>
            <p className="orders-page-subtitle">
              Live status tracking and order history for {user?.name} ({user?.student_id || 'Student'}).
            </p>
          </div>
          <button onClick={fetchOrders} className="btn btn-secondary btn-sm" title="Refresh list">
            <RefreshCw size={15} />
            <span>Refresh</span>
          </button>
        </div>

        {loading ? (
          <LoadingSpinner message="Fetching your order history..." />
        ) : orders.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title="No orders placed yet"
            description="You haven't ordered any delicious campus food yet. Head over to our food menu and place your first order!"
            actionText="Browse Menu"
            onAction={() => onNavigate('menu')}
          />
        ) : (
          <div className="orders-list">
            {orders.map((order) => {
              const isExpanded = Boolean(expandedOrders[order.id]);
              const canCancel =
                order.status === 'Placed' || order.status === 'Confirmed';

              return (
                <div key={order.id} className="order-card">
                  {/* Order Card Header */}
                  <div className="order-card-header" onClick={() => toggleExpand(order.id)}>
                    <div className="order-header-left">
                      <div className="order-num-tag">
                        <span className="order-num-label">Order #</span>
                        <strong className="order-num-val">{order.order_number}</strong>
                      </div>
                      <span className="order-date-text">
                        {new Date(order.created_at).toLocaleString([], {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </span>
                    </div>

                    <div className="order-header-right">
                      <span className={`status-pill status-${order.status.toLowerCase().replace(/\s+/g, '-')}`}>
                        {order.status}
                      </span>
                      <span className="order-header-total">
                        ₹{order.total_amount.toFixed(2)}
                      </span>
                      <button className="btn-toggle-expand" aria-label="Expand order details">
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </button>
                    </div>
                  </div>

                  {/* Visual Tracking Timeline */}
                  <div className="order-timeline-section">
                    {order.status === 'Cancelled' ? (
                      <div className="cancelled-banner">
                        <XCircle size={20} className="text-red" />
                        <div>
                          <strong>This order was cancelled.</strong>
                          <p>Food ingredients and inventory have been restored to kitchen stock.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="timeline-stepper">
                        {TIMELINE_STEPS.map((step, idx) => {
                          const state = getStepStatus(order.status, step.key);
                          const Icon = step.icon;

                          return (
                            <div key={step.key} className={`stepper-step ${state}`}>
                              <div className="step-node">
                                <Icon size={16} />
                              </div>
                              <span className="step-label">{step.label}</span>
                              {idx < TIMELINE_STEPS.length - 1 && (
                                <div className={`step-connector ${state === 'completed' ? 'filled' : ''}`}></div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Expandable Order Details & Actions */}
                  {isExpanded && (
                    <div className="order-expanded-details">
                      <div className="details-divider"></div>

                      <div className="order-meta-grid">
                        <div className="meta-box">
                          <span className="meta-box-label">Payment Method</span>
                          <span className="meta-box-val">{order.payment_method}</span>
                          <span className={`badge-payment ${order.payment_status}`}>
                            {order.payment_status.toUpperCase()}
                          </span>
                        </div>
                        {order.notes && (
                          <div className="meta-box">
                            <span className="meta-box-label">Kitchen Notes</span>
                            <span className="meta-box-val italic">"{order.notes}"</span>
                          </div>
                        )}
                      </div>

                      {/* Order Items Table */}
                      <div className="order-items-table-wrap">
                        <h4 className="table-caption">Ordered Food Items</h4>
                        <table className="order-items-table">
                          <thead>
                            <tr>
                              <th>Item</th>
                              <th>Category</th>
                              <th className="text-right">Price</th>
                              <th className="text-center">Qty</th>
                              <th className="text-right">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(order.items || []).map((item) => (
                              <tr key={item.id}>
                                <td>
                                  <div className="item-cell-title">
                                    <span
                                      className={`diet-dot-sm ${item.is_veg ? 'veg' : 'nonveg'}`}
                                    ></span>
                                    <span>{item.item_name}</span>
                                  </div>
                                </td>
                                <td>{item.category || 'Kitchen Item'}</td>
                                <td className="text-right">₹{item.price_at_order.toFixed(2)}</td>
                                <td className="text-center font-semibold">×{item.quantity}</td>
                                <td className="text-right font-semibold">
                                  ₹{item.subtotal.toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr>
                              <td colSpan="4" className="text-right font-bold">
                                Grand Total:
                              </td>
                              <td className="text-right font-bold text-orange">
                                ₹{order.total_amount.toFixed(2)}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>

                      {/* Cancellation Action if status is Placed or Confirmed */}
                      <div className="order-card-actions">
                        {canCancel ? (
                          <button
                            onClick={() => handleCancelClick(order)}
                            className="btn btn-outline-danger btn-sm"
                            disabled={cancellingId === order.id}
                          >
                            <Ban size={15} />
                            <span>Cancel Order</span>
                          </button>
                        ) : order.status === 'Cancelled' ? (
                          <span className="info-hint text-red">Order was cancelled.</span>
                        ) : (
                          <span className="info-hint">
                            Preparation has started. Order can no longer be cancelled.
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirmation Modal for Order Cancellation */}
      {confirmCancelOrder && (
        <Modal
          isOpen={Boolean(confirmCancelOrder)}
          onClose={() => setConfirmCancelOrder(null)}
          title="Cancel Order Confirmation"
          maxWidth="460px"
        >
          <div className="cancel-confirm-body">
            <div className="alert-danger-icon">
              <AlertCircle size={40} className="text-red" />
            </div>
            <h4 className="cancel-confirm-title">
              Cancel Order #{confirmCancelOrder.order_number}?
            </h4>
            <p className="cancel-confirm-desc">
              Are you sure you want to cancel this order? Once cancelled, the ordered items will be
              immediately returned to the cafeteria kitchen stock.
            </p>
            <div className="modal-actions-row">
              <button
                type="button"
                onClick={() => setConfirmCancelOrder(null)}
                className="btn btn-secondary"
              >
                Keep Order
              </button>
              <button
                type="button"
                onClick={handleExecuteCancel}
                disabled={Boolean(cancellingId)}
                className="btn btn-danger"
              >
                {cancellingId ? 'Cancelling...' : 'Yes, Cancel Order'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
