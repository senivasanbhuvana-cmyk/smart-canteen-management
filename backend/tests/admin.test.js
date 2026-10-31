const request = require('supertest');
const { createApp } = require('../src/app');
const { initDb, closeDb } = require('../src/db');
const { seedDatabase } = require('../src/seed');

describe('Admin Management & Analytics API', () => {
  let app;
  let adminToken;
  let studentToken;

  beforeAll(async () => {
    initDb();
    seedDatabase();
    app = createApp();

    const aRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@smartbite.com', password: 'admin123' });
    adminToken = aRes.body.token;

    const sRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'student@campus.edu', password: 'student123' });
    studentToken = sRes.body.token;
  });

  afterAll(() => {
    closeDb();
  });

  it('should allow admin to view canteen stats and analytics', async () => {
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('total_orders');
    expect(res.body).toHaveProperty('today_orders');
    expect(res.body).toHaveProperty('today_sales');
    expect(res.body).toHaveProperty('all_time_sales');
    expect(res.body).toHaveProperty('low_stock_items');
    expect(res.body).toHaveProperty('sold_out_items');
    expect(res.body).toHaveProperty('status_counts');
  });

  it('should block non-admin users from accessing stats', async () => {
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(403);
  });

  it('should allow admin to list all orders with filters', async () => {
    const res = await request(app)
      .get('/api/admin/orders')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.orders)).toBe(true);
    expect(res.body.count).toBeGreaterThan(0);
  });

  it('should allow admin to progress order status along the valid lifecycle', async () => {
    // List orders to find a 'Placed' order or place one
    const placeRes = await request(app)
      .post('/api/orders/checkout')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        items: [{ food_item_id: 1, quantity: 1 }],
        payment_method: 'Cash at Counter',
      });

    const orderId = placeRes.body.order.id;

    // Placed -> Confirmed
    const s1 = await request(app)
      .put(`/api/admin/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'Confirmed' });
    expect(s1.status).toBe(200);
    expect(s1.body.order.status).toBe('Confirmed');

    // Confirmed -> Preparing
    const s2 = await request(app)
      .put(`/api/admin/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'Preparing' });
    expect(s2.status).toBe(200);
    expect(s2.body.order.status).toBe('Preparing');

    // Preparing -> Ready for Pickup
    const s3 = await request(app)
      .put(`/api/admin/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'Ready for Pickup' });
    expect(s3.status).toBe(200);
    expect(s3.body.order.status).toBe('Ready for Pickup');

    // Ready for Pickup -> Completed
    const s4 = await request(app)
      .put(`/api/admin/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'Completed' });
    expect(s4.status).toBe(200);
    expect(s4.body.order.status).toBe('Completed');
    expect(s4.body.order.payment_status).toBe('paid');
  });

  it('should reject invalid status transitions', async () => {
    // List an order that is Completed
    const res = await request(app)
      .get('/api/admin/orders?status=Completed')
      .set('Authorization', `Bearer ${adminToken}`);

    if (res.body.orders.length > 0) {
      const completedOrderId = res.body.orders[0].id;

      // Cannot transition from Completed back to Preparing
      const invalidRes = await request(app)
        .put(`/api/admin/orders/${completedOrderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'Preparing' });

      expect(invalidRes.status).toBe(400);
      expect(invalidRes.body.error).toMatch(/invalid status transition/i);
    }
  });
});
