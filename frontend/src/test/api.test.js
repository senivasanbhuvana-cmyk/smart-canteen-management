import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authAPI, foodAPI, orderAPI, adminAPI } from '../services/api';

describe('Frontend API Service Layer', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('should attach Bearer token when smartbite_token is in localStorage', async () => {
    localStorage.setItem('smartbite_token', 'test-jwt-token-xyz');

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ user: { id: 1, name: 'Aarav' } }),
    });

    const res = await authAPI.getMe();

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/auth/me',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-jwt-token-xyz',
          'Content-Type': 'application/json',
        }),
      })
    );
    expect(res.user.name).toBe('Aarav');
  });

  it('should properly format food query parameters', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ foods: [], count: 0 }),
    });

    await foodAPI.getAll({
      category: 'Breakfast',
      search: 'Dosa',
      is_veg: true,
      available_only: true,
    });

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/foods?category=Breakfast&search=Dosa&is_veg=true&available_only=1',
      expect.anything()
    );
  });

  it('should send correct checkout payload', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ message: 'Order placed', order: { id: 10 } }),
    });

    const payload = {
      items: [{ food_item_id: 1, quantity: 2 }],
      payment_method: 'Cash at Counter',
      notes: 'No onions',
    };

    const res = await orderAPI.checkout(payload);

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/orders/checkout',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(payload),
      })
    );
    expect(res.order.id).toBe(10);
  });

  it('should throw descriptive error on API failure', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Invalid credentials' }),
    });

    await expect(
      authAPI.login({ email: 'wrong@test.com', password: 'bad' })
    ).rejects.toThrow('Invalid credentials');
  });
});
