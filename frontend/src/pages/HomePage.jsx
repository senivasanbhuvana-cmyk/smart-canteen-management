import React, { useEffect, useState } from 'react';
import {
  Utensils,
  ArrowRight,
  Clock,
  Sparkles,
  ShieldCheck,
  Smartphone,
  ChevronRight,
  Coffee,
  Flame,
} from 'lucide-react';
import FoodCard from '../components/common/FoodCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { foodAPI } from '../services/api';

const CATEGORIES = [
  {
    name: 'Breakfast',
    icon: '🥞',
    tag: '7:30 - 11:30 AM',
    bg: '#FFF7ED',
  },
  {
    name: 'Meals',
    icon: '🍛',
    tag: '12:00 - 3:30 PM',
    bg: '#FEF3C7',
  },
  {
    name: 'Snacks',
    icon: '🥟',
    tag: 'All Day Crispy',
    bg: '#ECFDF5',
  },
  {
    name: 'Fast Food',
    icon: '🍔',
    tag: 'Burgers & Pizzas',
    bg: '#EFF6FF',
  },
  {
    name: 'Drinks',
    icon: '☕',
    tag: 'Chai, Coffee & Shakes',
    bg: '#FAF5FF',
  },
];

export default function HomePage({ onNavigate, onSelectCategory }) {
  const [popularFoods, setPopularFoods] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPopular = async () => {
      try {
        const res = await foodAPI.getAll();
        // Pick first 6 available items
        const foodList = Array.isArray(res) ? res : (res && Array.isArray(res.foods)) ? res.foods : [];
        const items = foodList.filter((f) => f.is_available && f.stock_quantity > 0).slice(0, 6);
        setPopularFoods(items);
      } catch (err) {
        console.error('Failed to fetch foods:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPopular();
  }, []);

  return (
    <div className="home-page-wrap">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-badge">
              <Sparkles size={16} />
              <span>Smart Campus Dining Experience</span>
            </div>

            <h1 className="hero-heading">
              Your Campus Food, <span className="highlight-text">One Click Away</span>
            </h1>

            <p className="hero-description">
              Skip long lunch lines at the college canteen. Browse fresh hot dishes, order ahead
              from your phone, and collect your food right when it's freshly prepared.
            </p>

            <div className="hero-cta-buttons">
              <button
                onClick={() => onNavigate('menu')}
                className="btn btn-primary btn-lg"
              >
                <span>Browse Menu</span>
                <ArrowRight size={18} />
              </button>
              <button
                onClick={() => onNavigate('orders')}
                className="btn btn-secondary btn-lg"
              >
                <Clock size={18} />
                <span>View Orders</span>
              </button>
            </div>

            {/* Quick stats chips */}
            <div className="hero-stats-row">
              <div className="hero-stat-item">
                <span className="stat-number">10+ mins</span>
                <span className="stat-label">Saved per order</span>
              </div>
              <div className="stat-divider"></div>
              <div className="hero-stat-item">
                <span className="stat-number">100%</span>
                <span className="stat-label">Fresh & Hygienic</span>
              </div>
              <div className="stat-divider"></div>
              <div className="hero-stat-item">
                <span className="stat-number">₹20+</span>
                <span className="stat-label">Affordable meals</span>
              </div>
            </div>
          </div>

          <div className="hero-image-wrap">
            <div className="hero-img-card main">
              <img
                src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80"
                alt="Delicious Campus Food"
                className="hero-main-img"
              />
              <div className="floating-order-chip">
                <div className="pulse-dot"></div>
                <div>
                  <p className="chip-title">Live Kitchen Queue</p>
                  <p className="chip-sub">Ready in 8-12 mins</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="categories-section">
        <div className="section-header">
          <div>
            <h2 className="section-title">Explore Food Categories</h2>
            <p className="section-subtitle">Pick from your favorite campus delicacies</p>
          </div>
          <button
            onClick={() => onNavigate('menu')}
            className="btn-link-action"
          >
            <span>See Full Menu</span>
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="categories-grid">
          {CATEGORIES.map((cat) => (
            <div
              key={cat.name}
              className="category-card"
              style={{ background: cat.bg }}
              onClick={() => {
                onSelectCategory(cat.name);
                onNavigate('menu');
              }}
            >
              <div className="category-icon-emoji">{cat.icon}</div>
              <h3 className="category-name">{cat.name}</h3>
              <span className="category-timing">{cat.tag}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Popular Menu Items */}
      <section className="popular-section">
        <div className="section-header">
          <div>
            <div className="badge-inline">
              <Flame size={14} className="text-orange" />
              <span>Campus Favorites</span>
            </div>
            <h2 className="section-title">Popular Food Items</h2>
            <p className="section-subtitle">Most loved meals ordered by students daily</p>
          </div>
          <button
            onClick={() => onNavigate('menu')}
            className="btn btn-secondary btn-sm"
          >
            <span>View All</span>
            <ArrowRight size={15} />
          </button>
        </div>

        {loading ? (
          <LoadingSpinner message="Loading popular menu dishes..." />
        ) : (
          <div className="food-grid">
            {popularFoods.map((food) => (
              <FoodCard key={food.id} food={food} />
            ))}
          </div>
        )}
      </section>

      {/* Features / Why SmartBite Section */}
      <section className="features-section">
        <div className="features-container">
          <div className="features-header text-center">
            <h2 className="section-title">Why Students Love SmartBite</h2>
            <p className="section-subtitle">
              Engineered for seamless campus dining with speed, transparency and convenience.
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon-box orange">
                <Clock size={24} />
              </div>
              <h3 className="feature-title">Zero Queuing Time</h3>
              <p className="feature-desc">
                Order between classes or from your dorm. Your meal is pre-queued and waiting at the
                counter when you arrive.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-box yellow">
                <Smartphone size={24} />
              </div>
              <h3 className="feature-title">Live Kitchen Tracker</h3>
              <p className="feature-desc">
                Watch your order progress from Placed → Confirmed → Preparing → Ready for Pickup in
                real time.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-box green">
                <ShieldCheck size={24} />
              </div>
              <h3 className="feature-title">Flexible & Safe Checkout</h3>
              <p className="feature-desc">
                Choose between Cash at Counter or simulated Demo Online Payment with instantaneous
                token generation.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
