import React, { useState } from 'react';
import {
  Utensils,
  ShoppingBag,
  User,
  LogOut,
  LogIn,
  LayoutDashboard,
  Menu as MenuIcon,
  X,
  Clock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

export default function Navbar({ currentTab, setCurrentTab }) {
  const { user, isAuthenticated, isAdmin, logout, openAuthModal } = useAuth();
  const { totalItems } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (tab) => {
    setCurrentTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="navbar-header">
      <div className="navbar-container">
        {/* Brand Logo */}
        <div className="brand-logo" onClick={() => handleNavClick('home')}>
          <div className="logo-icon-wrap">
            <Utensils size={22} className="logo-icon" />
          </div>
          <div className="logo-text-wrap">
            <span className="brand-title">SmartBite</span>
            <span className="brand-subtitle">Smart Canteen</span>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="desktop-nav">
          <button
            className={`nav-link ${currentTab === 'home' ? 'nav-link-active' : ''}`}
            onClick={() => handleNavClick('home')}
          >
            Home
          </button>
          <button
            className={`nav-link ${currentTab === 'menu' ? 'nav-link-active' : ''}`}
            onClick={() => handleNavClick('menu')}
          >
            Food Menu
          </button>
          {isAuthenticated && !isAdmin && (
            <button
              className={`nav-link ${currentTab === 'orders' ? 'nav-link-active' : ''}`}
              onClick={() => handleNavClick('orders')}
            >
              My Orders
            </button>
          )}
          {isAdmin && (
            <button
              className={`nav-link nav-link-admin ${currentTab === 'admin' ? 'nav-link-active' : ''}`}
              onClick={() => handleNavClick('admin')}
            >
              <LayoutDashboard size={16} />
              <span>Admin Dashboard</span>
            </button>
          )}
        </nav>

        {/* Right Actions: Cart & Auth */}
        <div className="navbar-actions">
          {/* Cart Icon (only for student or guest) */}
          {!isAdmin && (
            <button
              className={`cart-btn ${currentTab === 'cart' ? 'cart-btn-active' : ''}`}
              onClick={() => handleNavClick('cart')}
              aria-label={`Shopping cart with ${totalItems} items`}
            >
              <ShoppingBag size={20} />
              {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
            </button>
          )}

          {/* User Status / Login */}
          {isAuthenticated ? (
            <div className="user-profile-menu">
              <div className="user-info-chip">
                <div className="user-avatar">
                  <User size={16} />
                </div>
                <div className="user-meta">
                  <span className="user-name">{user.name}</span>
                  <span className="user-role-badge">
                    {isAdmin ? 'Staff Admin' : user.student_id || 'Student'}
                  </span>
                </div>
              </div>
              <button
                onClick={logout}
                className="btn-icon-logout"
                title="Log Out"
                aria-label="Log Out"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => openAuthModal('login')}
              className="btn btn-primary btn-sm login-header-btn"
            >
              <LogIn size={16} />
              <span>Login / Register</span>
            </button>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            className="mobile-toggle-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X size={24} /> : <MenuIcon size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-nav-drawer">
          <button
            className={`mobile-nav-link ${currentTab === 'home' ? 'active' : ''}`}
            onClick={() => handleNavClick('home')}
          >
            Home
          </button>
          <button
            className={`mobile-nav-link ${currentTab === 'menu' ? 'active' : ''}`}
            onClick={() => handleNavClick('menu')}
          >
            Food Menu
          </button>
          {isAuthenticated && !isAdmin && (
            <button
              className={`mobile-nav-link ${currentTab === 'orders' ? 'active' : ''}`}
              onClick={() => handleNavClick('orders')}
            >
              My Orders
            </button>
          )}
          {isAdmin && (
            <button
              className={`mobile-nav-link ${currentTab === 'admin' ? 'active' : ''}`}
              onClick={() => handleNavClick('admin')}
            >
              Admin Dashboard
            </button>
          )}
          {!isAuthenticated && (
            <button
              className="mobile-nav-link text-orange font-semibold"
              onClick={() => {
                setMobileMenuOpen(false);
                openAuthModal('login');
              }}
            >
              Login / Student Register
            </button>
          )}
        </div>
      )}
    </header>
  );
}
