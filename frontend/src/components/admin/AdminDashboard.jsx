import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  TrendingUp,
  Utensils,
  AlertTriangle,
  Clock,
  CheckCircle2,
  DollarSign,
  ArrowRight,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';
import { adminAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function AdminDashboard({ onNavigateToMenu, onNavigateToOrders }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showError } = useToast();

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await adminAPI.getStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
      showError('Failed to fetch dashboard statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Calculating cafeteria statistics..." />;
  }

  if (!stats) {
    return (
      <div className="admin-empty-wrap">
        <p>Failed to load statistics.</p>
        <button onClick={fetchStats} className="btn btn-secondary mt-2">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-wrap">
      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Cafeteria Analytics & Overview</h1>
          <p className="admin-page-subtitle">
            Real-time orders, today's verified revenue, and cafeteria inventory alerts.
          </p>
        </div>
        <button onClick={fetchStats} className="btn btn-secondary btn-sm" title="Refresh metrics">
          <RefreshCw size={15} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="stats-cards-grid">
        {/* Card 1: Total Orders */}
        <div className="stat-metric-card">
          <div className="stat-card-icon-box bg-orange-light">
            <ShoppingBag size={22} className="text-orange" />
          </div>
          <div className="stat-card-info">
            <span className="stat-card-label">Total Orders</span>
            <span className="stat-card-value">{stats.total_orders}</span>
            <span className="stat-card-sub text-muted">All-time transactions</span>
          </div>
        </div>

        {/* Card 2: Today's Orders */}
        <div className="stat-metric-card">
          <div className="stat-card-icon-box bg-blue-light">
            <Clock size={22} className="text-blue" />
          </div>
          <div className="stat-card-info">
            <span className="stat-card-label">Today's Orders</span>
            <span className="stat-card-value">{stats.today_orders}</span>
            <span className="stat-card-sub text-muted">Placed today</span>
          </div>
        </div>

        {/* Card 3: Today's Sales (Completed) */}
        <div className="stat-metric-card">
          <div className="stat-card-icon-box bg-green-light">
            <TrendingUp size={22} className="text-green" />
          </div>
          <div className="stat-card-info">
            <span className="stat-card-label">Today's Revenue</span>
            <span className="stat-card-value">₹{stats.today_sales.toFixed(2)}</span>
            <span className="stat-card-sub text-green font-semibold">From completed orders</span>
          </div>
        </div>

        {/* Card 4: Total Menu Items */}
        <div className="stat-metric-card">
          <div className="stat-card-icon-box bg-purple-light">
            <Utensils size={22} className="text-purple" />
          </div>
          <div className="stat-card-info">
            <span className="stat-card-label">Menu Items</span>
            <span className="stat-card-value">{stats.total_menu_items}</span>
            <span className="stat-card-sub text-muted">Active kitchen dishes</span>
          </div>
        </div>

        {/* Card 5: Low-Stock Items */}
        <div className="stat-metric-card">
          <div className="stat-card-icon-box bg-amber-light">
            <AlertTriangle size={22} className="text-amber" />
          </div>
          <div className="stat-card-info">
            <span className="stat-card-label">Low Stock</span>
            <span className="stat-card-value">{stats.low_stock_count}</span>
            <span className="stat-card-sub text-amber font-semibold">5 or fewer remaining</span>
          </div>
        </div>

        {/* Card 6: Sold Out Items */}
        <div className="stat-metric-card">
          <div className="stat-card-icon-box bg-red-light">
            <XCircle size={22} className="text-red" />
          </div>
          <div className="stat-card-info">
            <span className="stat-card-label">Sold Out</span>
            <span className="stat-card-value">{stats.sold_out_count}</span>
            <span className="stat-card-sub text-red font-semibold">Needs restocking</span>
          </div>
        </div>
      </div>

      {/* Low-Stock Inventory Alerts */}
      {stats.low_stock_items && stats.low_stock_items.length > 0 && (
        <div className="inventory-alert-card">
          <div className="alert-card-header">
            <div className="alert-title-wrap">
              <AlertTriangle size={18} className="text-amber" />
              <h3 className="alert-card-title">Kitchen Inventory Attention Required</h3>
            </div>
            <button onClick={onNavigateToMenu} className="btn-link-action">
              <span>Restock in Menu</span>
              <ArrowRight size={15} />
            </button>
          </div>
          <p className="alert-card-desc">
            The following items are running low on ingredients and may sell out shortly:
          </p>
          <div className="low-stock-chips-row">
            {stats.low_stock_items.map((item) => (
              <div key={item.id} className="low-stock-chip">
                <span className="chip-name">{item.name}</span>
                <span className="chip-qty-alert">Only {item.stock_quantity} left</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Orders Section */}
      <div className="recent-orders-section">
        <div className="section-header-compact">
          <h3 className="section-title-sm">Recent Orders</h3>
          <button onClick={onNavigateToOrders} className="btn-link-action">
            <span>View All Orders</span>
            <ArrowRight size={15} />
          </button>
        </div>

        <div className="admin-table-card">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Student</th>
                <th>Items</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {stats.recent_orders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-4 text-muted">
                    No orders placed yet today.
                  </td>
                </tr>
              ) : (
                stats.recent_orders.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <strong className="order-num-text">{o.order_number}</strong>
                    </td>
                    <td>
                      <div className="student-cell">
                        <span className="student-name">{o.user_name}</span>
                        <span className="student-id-text">{o.student_id || 'Student'}</span>
                      </div>
                    </td>
                    <td>{o.items_count} items</td>
                    <td className="font-semibold text-orange">₹{o.total_amount.toFixed(2)}</td>
                    <td>
                      <span className={`badge-payment-sm ${o.payment_status}`}>
                        {o.payment_method === 'Demo Online Payment' ? 'Online' : 'Cash'}
                      </span>
                    </td>
                    <td>
                      <span className={`status-pill sm status-${o.status.toLowerCase().replace(/\s+/g, '-')}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="text-muted text-sm">
                      {new Date(o.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
