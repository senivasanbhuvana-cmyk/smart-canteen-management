import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Search,
  Filter,
  RefreshCw,
  Clock,
  CheckCircle2,
  ChefHat,
  PackageCheck,
  XCircle,
  Eye,
  Calendar,
  AlertCircle,
  User,
} from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';
import Modal from '../common/Modal';
import { adminAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const STATUS_TABS = [
  'All',
  'Placed',
  'Confirmed',
  'Preparing',
  'Ready for Pickup',
  'Completed',
  'Cancelled',
];

const NEXT_STATUS_MAP = {
  Placed: [
    { label: 'Confirm Order', target: 'Confirmed', icon: CheckCircle2, variant: 'primary' },
    { label: 'Cancel Order', target: 'Cancelled', icon: XCircle, variant: 'danger' },
  ],
  Confirmed: [
    { label: 'Start Preparing', target: 'Preparing', icon: ChefHat, variant: 'primary' },
    { label: 'Cancel Order', target: 'Cancelled', icon: XCircle, variant: 'danger' },
  ],
  Preparing: [
    { label: 'Mark Ready for Pickup', target: 'Ready for Pickup', icon: PackageCheck, variant: 'primary' },
    { label: 'Cancel Order', target: 'Cancelled', icon: XCircle, variant: 'danger' },
  ],
  'Ready for Pickup': [
    { label: 'Mark Completed', target: 'Completed', icon: CheckCircle2, variant: 'success' },
    { label: 'Cancel Order', target: 'Cancelled', icon: XCircle, variant: 'danger' },
  ],
  Completed: [],
  Cancelled: [],
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState('All');
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const [inspectOrder, setInspectOrder] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const { showSuccess, showError } = useToast();

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getAllOrders({
        status: activeStatus !== 'All' ? activeStatus : undefined,
        search: search.trim() || undefined,
        date: dateFilter || undefined,
      });
      setOrders(res.orders || []);
      // If modal open, update inspectOrder
      if (inspectOrder) {
        const found = (res.orders || []).find((o) => o.id === inspectOrder.id);
        if (found) setInspectOrder(found);
      }
    } catch (err) {
      showError('Failed to load orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [activeStatus, dateFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchOrders();
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      const res = await adminAPI.updateOrderStatus(orderId, newStatus);
      showSuccess(`Order updated to '${newStatus}'`);
      if (inspectOrder && inspectOrder.id === orderId) {
        setInspectOrder(res.order);
      }
      fetchOrders();
    } catch (err) {
      showError(err.message || 'Failed to update order status.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="admin-orders-wrap">
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Cafeteria Order Processing</h1>
          <p className="admin-page-subtitle">
            Track student orders, kitchen preparation queue, and update pickup status.
          </p>
        </div>
        <button onClick={fetchOrders} className="btn btn-secondary btn-sm" title="Refresh">
          <RefreshCw size={15} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="admin-orders-toolbar">
        {/* Status Tabs */}
        <div className="status-tabs-row">
          {STATUS_TABS.map((s) => (
            <button
              key={s}
              onClick={() => setActiveStatus(s)}
              className={`status-tab-btn ${activeStatus === s ? 'active' : ''}`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Search & Date inputs */}
        <div className="toolbar-search-row">
          <form onSubmit={handleSearchSubmit} className="order-search-box">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search by Order #, Student Name or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input search"
            />
            <button type="submit" className="btn btn-secondary btn-sm">
              Search
            </button>
          </form>

          <div className="date-picker-box">
            <Calendar size={16} className="date-icon" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="form-input date"
            />
            {dateFilter && (
              <button
                type="button"
                onClick={() => setDateFilter('')}
                className="btn-clear-date"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <LoadingSpinner message="Loading cafeteria orders..." />
      ) : orders.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="No orders found"
          description="There are currently no orders matching this filter."
        />
      ) : (
        <div className="admin-table-card">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Student</th>
                <th>Items Ordered</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Time Placed</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const transitions = NEXT_STATUS_MAP[o.status] || [];
                const primaryAction = transitions.find((t) => t.target !== 'Cancelled');
                const cancelAction = transitions.find((t) => t.target === 'Cancelled');

                return (
                  <tr key={o.id}>
                    <td>
                      <div className="order-num-group">
                        <strong className="order-num-text">{o.order_number}</strong>
                        {o.notes && <span className="notes-tag" title={o.notes}>Notes</span>}
                      </div>
                    </td>
                    <td>
                      <div className="student-cell">
                        <span className="student-name">{o.user_name}</span>
                        <span className="student-id-text">{o.student_id || o.user_email}</span>
                      </div>
                    </td>
                    <td>
                      <div className="items-list-compact">
                        {(o.items || []).map((it) => (
                          <span key={it.id} className="item-token">
                            {it.item_name} ×{it.quantity}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="font-semibold text-orange">₹{o.total_amount.toFixed(2)}</td>
                    <td>
                      <span className={`badge-payment-sm ${o.payment_status}`}>
                        {o.payment_status.toUpperCase()} ({o.payment_method === 'Demo Online Payment' ? 'Demo' : 'Cash'})
                      </span>
                    </td>
                    <td>
                      <span className={`status-pill sm status-${o.status.toLowerCase().replace(/\s+/g, '-')}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="text-muted text-sm">
                      {new Date(o.created_at).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="text-right">
                      <div className="table-actions">
                        <button
                          onClick={() => setInspectOrder(o)}
                          className="btn-icon-action view"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>

                        {/* Quick Status Advance Button */}
                        {primaryAction && (
                          <button
                            onClick={() => handleStatusUpdate(o.id, primaryAction.target)}
                            disabled={updatingId === o.id}
                            className={`btn btn-sm btn-${primaryAction.variant}`}
                          >
                            <span>{primaryAction.label}</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Order Details & Transition Modal */}
      {inspectOrder && (
        <Modal
          isOpen={Boolean(inspectOrder)}
          onClose={() => setInspectOrder(null)}
          title={`Order Details: ${inspectOrder.order_number}`}
          maxWidth="600px"
        >
          <div className="order-inspect-body">
            <div className="inspect-header-grid">
              <div className="inspect-box">
                <span className="inspect-box-label">Student Customer</span>
                <strong className="inspect-box-val">{inspectOrder.user_name}</strong>
                <span className="inspect-box-sub">
                  ID: {inspectOrder.student_id || 'N/A'} • {inspectOrder.user_email}
                </span>
              </div>
              <div className="inspect-box">
                <span className="inspect-box-label">Current Status</span>
                <span className={`status-pill status-${inspectOrder.status.toLowerCase().replace(/\s+/g, '-')}`}>
                  {inspectOrder.status}
                </span>
                <span className="inspect-box-sub">
                  Ordered at: {new Date(inspectOrder.created_at).toLocaleTimeString()}
                </span>
              </div>
            </div>

            <div className="inspect-box mt-2">
              <span className="inspect-box-label">Payment Information</span>
              <div className="flex-row-spaced">
                <span>Method: <strong>{inspectOrder.payment_method}</strong></span>
                <span>
                  Status:{' '}
                  <span className={`badge-payment ${inspectOrder.payment_status}`}>
                    {inspectOrder.payment_status.toUpperCase()}
                  </span>
                </span>
              </div>
              {inspectOrder.notes && (
                <div className="inspect-notes-box">
                  <strong>Student Instructions:</strong> "{inspectOrder.notes}"
                </div>
              )}
            </div>

            {/* Items Table */}
            <div className="inspect-items-wrap mt-3">
              <h4 className="table-caption">Order Items</h4>
              <table className="order-items-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th className="text-right">Price</th>
                    <th className="text-center">Qty</th>
                    <th className="text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {(inspectOrder.items || []).map((it) => (
                    <tr key={it.id}>
                      <td>{it.item_name}</td>
                      <td className="text-right">₹{it.price_at_order.toFixed(2)}</td>
                      <td className="text-center font-semibold">×{it.quantity}</td>
                      <td className="text-right font-semibold">₹{it.subtotal.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="3" className="text-right font-bold">Total:</td>
                    <td className="text-right font-bold text-orange">₹{inspectOrder.total_amount.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Workflow Action Buttons */}
            <div className="inspect-actions-box mt-4">
              <span className="inspect-box-label mb-2">Available Status Transitions:</span>
              <div className="transition-buttons-row">
                {(NEXT_STATUS_MAP[inspectOrder.status] || []).map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.target}
                      onClick={() => handleStatusUpdate(inspectOrder.id, action.target)}
                      disabled={updatingId === inspectOrder.id}
                      className={`btn btn-${action.variant}`}
                    >
                      <Icon size={16} />
                      <span>{action.label}</span>
                    </button>
                  );
                })}
                {!(NEXT_STATUS_MAP[inspectOrder.status]?.length > 0) && (
                  <span className="text-muted italic">This order is completed or cancelled. No further actions required.</span>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
