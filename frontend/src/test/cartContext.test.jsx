import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CartProvider, useCart } from '../context/CartContext';
import { ToastProvider } from '../context/ToastContext';

// Wrapper with providers
function wrapper({ children }) {
  return (
    <ToastProvider>
      <CartProvider>{children}</CartProvider>
    </ToastProvider>
  );
}

describe('Cart Context & State Management', () => {
  const sampleFood = {
    id: 1,
    name: 'Masala Dosa',
    price: 70.0,
    category: 'Breakfast',
    stock_quantity: 10,
    is_available: 1,
  };

  it('should initialize with an empty cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    expect(result.current.cart).toEqual([]);
    expect(result.current.totalItems).toBe(0);
    expect(result.current.finalTotal).toBe(0);
  });

  it('should add item to cart and calculate correct totals', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addToCart(sampleFood, 2);
    });

    expect(result.current.cart.length).toBe(1);
    expect(result.current.totalItems).toBe(2);
    expect(result.current.finalTotal).toBe(140.0);
  });

  it('should increase quantity when adding the same item', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addToCart(sampleFood, 1);
    });

    act(() => {
      result.current.addToCart(sampleFood, 2);
    });

    expect(result.current.cart[0].quantity).toBe(3);
    expect(result.current.finalTotal).toBe(210.0);
  });

  it('should prevent adding more than available stock', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addToCart(sampleFood, 15); // stock is only 10
    });

    expect(result.current.cart.length).toBe(0);
  });

  it('should update quantity and remove item when quantity is 0', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addToCart(sampleFood, 2);
    });

    act(() => {
      result.current.updateQuantity(sampleFood.id, 1);
    });
    expect(result.current.cart[0].quantity).toBe(1);

    act(() => {
      result.current.updateQuantity(sampleFood.id, 0);
    });
    expect(result.current.cart.length).toBe(0);
  });

  it('should clear cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addToCart(sampleFood, 2);
    });
    expect(result.current.cart.length).toBe(1);

    act(() => {
      result.current.clearCart();
    });
    expect(result.current.cart.length).toBe(0);
    expect(result.current.finalTotal).toBe(0);
  });
});
