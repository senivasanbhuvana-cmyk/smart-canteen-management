import React from 'react';
import { Utensils, Clock, MapPin, Phone, ShieldCheck } from 'lucide-react';

export default function Footer({ onNavigate }) {
  return (
    <footer className="footer-wrap">
      <div className="footer-container">
        <div className="footer-col brand-col">
          <div className="footer-brand">
            <div className="logo-icon-wrap sm">
              <Utensils size={18} className="logo-icon" />
            </div>
            <span className="brand-title">SmartBite</span>
          </div>
          <p className="footer-desc">
            Smart digital canteen management system designed to reduce campus lunchtime queues,
            streamline order preparation, and deliver fresh hot meals on time.
          </p>
          <div className="footer-badge">
            <ShieldCheck size={16} />
            <span>Official Campus Canteen Project</span>
          </div>
        </div>

        <div className="footer-col">
          <h4 className="footer-heading">Quick Navigation</h4>
          <ul className="footer-links">
            <li>
              <button onClick={() => onNavigate('home')} className="footer-link-btn">
                Home
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('menu')} className="footer-link-btn">
                Food Menu
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('orders')} className="footer-link-btn">
                Track My Orders
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('cart')} className="footer-link-btn">
                Shopping Cart
              </button>
            </li>
          </ul>
        </div>

        <div className="footer-col">
          <h4 className="footer-heading">Cafeteria Timings</h4>
          <div className="timing-item">
            <Clock size={16} className="timing-icon" />
            <div>
              <p className="timing-label">Breakfast & Beverages</p>
              <p className="timing-val">07:30 AM – 11:30 AM</p>
            </div>
          </div>
          <div className="timing-item">
            <Clock size={16} className="timing-icon" />
            <div>
              <p className="timing-label">Lunch & Executive Thalis</p>
              <p className="timing-val">12:00 PM – 03:30 PM</p>
            </div>
          </div>
          <div className="timing-item">
            <Clock size={16} className="timing-icon" />
            <div>
              <p className="timing-label">Evening Snacks & Fast Food</p>
              <p className="timing-val">04:00 PM – 07:30 PM</p>
            </div>
          </div>
        </div>

        <div className="footer-col">
          <h4 className="footer-heading">Canteen Counter</h4>
          <p className="contact-item">
            <MapPin size={16} />
            <span>Block C, Ground Floor, Central Student Center</span>
          </p>
          <p className="contact-item">
            <Phone size={16} />
            <span>Ext. 2044 / canteen@campus.edu</span>
          </p>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} SmartBite — Smart Canteen Management System. All rights reserved.</p>
        <p className="footer-tech">React + Vite • Python Flask • SQLite</p>
      </div>
    </footer>
  );
}
