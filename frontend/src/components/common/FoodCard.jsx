import React, { useState } from 'react';
import { Plus, Minus, ShoppingBag, AlertTriangle } from 'lucide-react';
import { useCart } from '../../context/CartContext';

const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80';

export default function FoodCard({ food }) {
  const { cart, addToCart, updateQuantity } = useCart();
  const [imgSrc, setImgSrc] = useState(food.image_url || DEFAULT_IMAGE);

  const cartItem = cart.find((item) => item.id === food.id);
  const isSoldOut = !food.is_available || food.stock_quantity <= 0;
  const isLowStock = !isSoldOut && food.stock_quantity <= 5;

  const handleImageError = () => {
    setImgSrc(DEFAULT_IMAGE);
  };

  return (
    <div className={`food-card ${isSoldOut ? 'food-card-disabled' : ''}`}>
      <div className="food-card-img-wrapper">
        <img
          src={imgSrc}
          alt={food.name}
          className="food-card-img"
          onError={handleImageError}
          loading="lazy"
        />

        {/* Veg / Non-Veg Indicator */}
        <div className={`diet-badge ${food.is_veg ? 'diet-veg' : 'diet-nonveg'}`}>
          <div className="diet-badge-dot"></div>
        </div>

        {/* Category Pill */}
        <span className="category-tag">{food.category}</span>

        {/* Stock status overlay / badge */}
        {isSoldOut ? (
          <div className="sold-out-overlay">
            <span>Sold Out</span>
          </div>
        ) : isLowStock ? (
          <div className="low-stock-badge">
            <AlertTriangle size={12} />
            <span>Only {food.stock_quantity} left</span>
          </div>
        ) : null}
      </div>

      <div className="food-card-content">
        <div className="food-card-header">
          <h4 className="food-card-title">{food.name}</h4>
        </div>

        <p className="food-card-desc">{food.description}</p>

        <div className="food-card-footer">
          <div className="food-price-wrap">
            <span className="currency-symbol">₹</span>
            <span className="food-price">{food.price.toFixed(2)}</span>
          </div>

          <div className="food-action-wrap">
            {isSoldOut ? (
              <button className="btn btn-disabled" disabled>
                Unavailable
              </button>
            ) : cartItem ? (
              <div className="qty-counter-sm">
                <button
                  onClick={() => updateQuantity(food.id, cartItem.quantity - 1)}
                  className="qty-btn"
                  aria-label="Decrease quantity"
                >
                  <Minus size={14} />
                </button>
                <span className="qty-value">{cartItem.quantity}</span>
                <button
                  onClick={() => updateQuantity(food.id, cartItem.quantity + 1)}
                  className="qty-btn"
                  disabled={cartItem.quantity >= food.stock_quantity}
                  aria-label="Increase quantity"
                >
                  <Plus size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => addToCart(food)}
                className="btn btn-add-cart"
                aria-label={`Add ${food.name} to cart`}
              >
                <Plus size={16} />
                <span>Add</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
