import React, { useState } from 'react';
import {
  LayoutDashboard,
  Utensils,
  ShoppingBag,
  Store,
  LogOut,
  ShieldAlert,
  ChevronRight,
  Menu as MenuIcon,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AdminLayout({ activeTab, setActiveTab, onReturnToStore, children }) {
  const { user, logout } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const navItems = [
    { key: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard },
    { key: 'menu', label: 'Menu Management', icon: Utensils },
    { key: 'orders', label: 'Order Management', icon: ShoppingBag },
  ];

  const handleSelectTab = (key) => {
    setActiveTab(key);
    setMobileSidebarOpen(false);
  };

  return (
    <div className="admin-wrapper">
      {/* Mobile admin header */}
      <div className="admin-mobile-header">
        <div className="brand-logo sm">
          <div className="logo-icon-wrap xs">
            <Utensils size={16} className="logo-icon" />
          </div>
          <span className="brand-title sm">SmartBite Admin</span>
        </div>
        <button
          className="admin-hamburger-btn"
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          aria-label="Toggle admin sidebar"
        >
          {mobileSidebarOpen ? <X size={22} /> : <MenuIcon size={22} />}
        </button>
      </div>

      {/* Admin Sidebar */}
      <aside className={`admin-sidebar ${mobileSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand-box">
          <div className="logo-icon-wrap">
            <Utensils size={20} className="logo-icon" />
          </div>
          <div>
            <span className="sidebar-brand-name">SmartBite</span>
            <span className="sidebar-badge">Kitchen Admin</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <span className="sidebar-section-title">ADMIN CONTROLS</span>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => handleSelectTab(item.key)}
                className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
                {isActive && <ChevronRight size={16} className="sidebar-active-arrow" />}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button onClick={onReturnToStore} className="sidebar-switch-btn">
            <Store size={16} />
            <span>Switch to Canteen Store</span>
          </button>

          <div className="sidebar-user-card">
            <div className="sidebar-user-info">
              <span className="admin-user-name">{user?.name || 'Administrator'}</span>
              <span className="admin-user-email">{user?.email || 'admin@smartbite.com'}</span>
            </div>
            <button
              onClick={logout}
              className="btn-admin-logout"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Admin Content */}
      <main className="admin-main-viewport">{children}</main>
    </div>
  );
}
