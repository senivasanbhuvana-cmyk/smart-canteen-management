import React, { useState } from 'react';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import AuthModal from './components/auth/AuthModal';
import HomePage from './pages/HomePage';
import MenuPage from './pages/MenuPage';
import CartPage from './pages/CartPage';
import OrdersPage from './pages/OrdersPage';
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminMenu from './components/admin/AdminMenu';
import AdminOrders from './components/admin/AdminOrders';
import { ShieldAlert, LogIn, ArrowLeft } from 'lucide-react';
import './index.css';
import './App.css';

function MainContent() {
  const [currentTab, setCurrentTab] = useState(() => {
    try {
      const hash = window.location.hash.replace('#', '');
      if (['home', 'menu', 'cart', 'orders', 'admin'].includes(hash)) {
        return hash;
      }
      const saved = sessionStorage.getItem('smartbite_tab');
      if (['home', 'menu', 'cart', 'orders', 'admin'].includes(saved)) {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'home';
  });

  const [selectedCategory, setSelectedCategory] = useState(() => {
    try {
      const saved = sessionStorage.getItem('smartbite_category');
      if (saved) return saved;
    } catch {
      // ignore
    }
    return 'All';
  });

  const [adminTab, setAdminTab] = useState('dashboard'); // 'dashboard' | 'menu' | 'orders'

  const { isAuthenticated, isAdmin, openAuthModal } = useAuth();

  React.useEffect(() => {
    try {
      sessionStorage.setItem('smartbite_tab', currentTab);
      if (window.location.hash !== `#${currentTab}`) {
        window.location.hash = currentTab;
      }
    } catch {
      // ignore
    }
  }, [currentTab]);

  React.useEffect(() => {
    try {
      sessionStorage.setItem('smartbite_category', selectedCategory);
    } catch {
      // ignore
    }
  }, [selectedCategory]);

  React.useEffect(() => {
    const handleHashChange = () => {
      try {
        const hash = window.location.hash.replace('#', '');
        if (['home', 'menu', 'cart', 'orders', 'admin'].includes(hash)) {
          setCurrentTab(hash);
        }
      } catch {
        // ignore
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // If student clicks on a category from Home page
  const handleSelectCategoryFromHome = (category) => {
    setSelectedCategory(category);
    setCurrentTab('menu');
  };

  // If admin views are requested
  if (currentTab === 'admin') {
    if (!isAuthenticated) {
      return (
        <div className="admin-access-denied-wrap">
          <div className="denied-card">
            <ShieldAlert size={48} className="text-orange" />
            <h2>Administrator Authentication Required</h2>
            <p>
              The SmartBite cafeteria dashboard is restricted to authorized kitchen staff and admins.
              Please sign in with administrator credentials.
            </p>
            <div className="denied-actions">
              <button
                onClick={() => openAuthModal('login')}
                className="btn btn-primary"
              >
                <LogIn size={18} />
                <span>Admin Login</span>
              </button>
              <button
                onClick={() => setCurrentTab('home')}
                className="btn btn-secondary"
              >
                <ArrowLeft size={18} />
                <span>Back to Canteen Store</span>
              </button>
            </div>
            <p className="denied-hint">
              Demo admin credentials: <code>admin@smartbite.com</code> / <code>admin123</code>
            </p>
          </div>
        </div>
      );
    }

    if (!isAdmin) {
      return (
        <div className="admin-access-denied-wrap">
          <div className="denied-card">
            <ShieldAlert size={48} className="text-red" />
            <h2>Student Account Detected</h2>
            <p>
              Your account does not have staff administrator privileges. You can browse dishes and
              track your campus orders in the student store.
            </p>
            <button
              onClick={() => setCurrentTab('home')}
              className="btn btn-primary mt-3"
            >
              <span>Return to Student Store</span>
            </button>
          </div>
        </div>
      );
    }

    // Render Admin Interface
    return (
      <AdminLayout
        activeTab={adminTab}
        setActiveTab={setAdminTab}
        onReturnToStore={() => setCurrentTab('home')}
      >
        {adminTab === 'dashboard' && (
          <AdminDashboard
            onNavigateToMenu={() => setAdminTab('menu')}
            onNavigateToOrders={() => setAdminTab('orders')}
          />
        )}
        {adminTab === 'menu' && <AdminMenu />}
        {adminTab === 'orders' && <AdminOrders />}
      </AdminLayout>
    );
  }

  // Student / Customer Storefront
  return (
    <div className="app-layout">
      <Navbar currentTab={currentTab} setCurrentTab={setCurrentTab} />

      <main className="main-content">
        {currentTab === 'home' && (
          <HomePage
            onNavigate={setCurrentTab}
            onSelectCategory={handleSelectCategoryFromHome}
          />
        )}
        {currentTab === 'menu' && (
          <MenuPage
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
          />
        )}
        {currentTab === 'cart' && <CartPage onNavigate={setCurrentTab} />}
        {currentTab === 'orders' && <OrdersPage onNavigate={setCurrentTab} />}
      </main>

      <Footer onNavigate={setCurrentTab} />
      <AuthModal />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <CartProvider>
          <MainContent />
        </CartProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
