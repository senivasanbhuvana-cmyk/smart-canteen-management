import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useToast } from './ToastContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('smartbite_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const { showSuccess, showError, showInfo } = useToast();

  useEffect(() => {
    try {
      localStorage.setItem('smartbite_cart', JSON.stringify(cart));
    } catch {
      // Ignore local storage error
    }
  }, [cart]);

  const addToCart = useCallback(
    (item, quantity = 1) => {
      if (!item.is_available || item.stock_quantity <= 0) {
        showError(`Sorry, ${item.name} is currently sold out!`);
        return false;
      }

      setCart((prev) => {
        const existingIndex = prev.findIndex((i) => i.id === item.id);
        if (existingIndex > -1) {
          const existing = prev[existingIndex];
          const newQty = existing.quantity + quantity;
          if (newQty > item.stock_quantity) {
            showError(`Only ${item.stock_quantity} available in kitchen right now.`);
            return prev;
          }
          const updated = [...prev];
          updated[existingIndex] = { ...existing, quantity: newQty };
          showSuccess(`Updated ${item.name} quantity (${newQty}) in cart!`);
          return updated;
        } else {
          if (quantity > item.stock_quantity) {
            showError(`Only ${item.stock_quantity} items remaining in stock.`);
            return prev;
          }
          showSuccess(`Added ${item.name} to cart!`);
          return [
            ...prev,
            {
              id: item.id,
              name: item.name,
              price: item.price,
              category: item.category,
              is_veg: item.is_veg,
              image_url: item.image_url,
              stock_quantity: item.stock_quantity,
              quantity,
            },
          ];
        }
      });
      return true;
    },
    [showSuccess, showError]
  );

  const updateQuantity = useCallback(
    (itemId, newQty) => {
      setCart((prev) => {
        if (newQty <= 0) {
          const item = prev.find((i) => i.id === itemId);
          if (item) showInfo(`Removed ${item.name} from cart.`);
          return prev.filter((i) => i.id !== itemId);
        }

        return prev.map((item) => {
          if (item.id === itemId) {
            if (newQty > item.stock_quantity) {
              showError(`Kitchen stock limit reached (${item.stock_quantity} max).`);
              return item;
            }
            return { ...item, quantity: newQty };
          }
          return item;
        });
      });
    },
    [showError, showInfo]
  );

  const removeFromCart = useCallback(
    (itemId) => {
      setCart((prev) => {
        const item = prev.find((i) => i.id === itemId);
        if (item) showInfo(`Removed ${item.name} from cart.`);
        return prev.filter((i) => i.id !== itemId);
      });
    },
    [showInfo]
  );

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const finalTotal = subtotal; // No hidden extra fees

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        totalItems,
        subtotal,
        finalTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
