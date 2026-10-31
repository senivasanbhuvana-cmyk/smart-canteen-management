const request = require('supertest');
const { createApp } = require('../src/app');
const { getDb, initDb, closeDb } = require('../src/db');
const { seedDatabase } = require('../src/seed');

describe('Orders & Checkout API', () => {
  let app;
  let studentToken;
  let otherStudentToken;
  let adminToken;
  let testFood;

  beforeAll(async () => {
    initDb();
    seedDatabase();
    app = createApp();

    // Login default student
    const sRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'student@campus.edu', password: 'student123' });
    studentToken = sRes.body.token;

    // Register second student
    const s2Res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Second Student',
        email: `student2_${Date.now()}@campus.edu`,
        student_id: `SEC-${Date.now()}`,
        password: 'password123',
      });
    otherStudentToken = s2Res.body.token;

    // Login admin
    const aRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@smartbite.com', password: 'admin123' });
    adminToken = aRes.body.token;

    // Pick an in-stock food item
    const db = getDb();
    testFood = db.prepare('SELECT * FROM food_items WHERE stock_quantity >= 10 AND is_available = 1 LIMIT 1').get();
  });

  afterAll(() => {
    closeDb();
  });

  it('should place an order and deduct stock atomically', async () => {
    const initialStock = testFood.stock_quantity;
    const orderQuantity = 2;

    const res = await request(app)
      .post('/api/orders/checkout')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        items: [{ food_item_id: testFood.id, quantity: orderQuantity }],
        payment_method: 'Demo Online Payment',
        notes: 'Extra napkins please',
      });

    expect(res.status).toBe(201);
    expect(res.body.order).toHaveProperty('order_number');
    expect(res.body.order.status).toBe('Placed');
    expect(res.body.order.payment_status).toBe('paid');
    expect(res.body.order.total_amount).toBe(Math.round(testFood.price * orderQuantity * 100) / 100);

    // Verify stock deduction in database
    const db = getDb();
    const updatedFood = db.prepare('SELECT stock_quantity FROM food_items WHERE id = ?').get(testFood.id);
    expect(updatedFood.stock_quantity).toBe(initialStock - orderQuantity);
  });

  it('should reject checkout when item has insufficient stock', async () => {
    const db = getDb();
    const currentStock = db.prepare('SELECT stock_quantity FROM food_items WHERE id = ?').get(testFood.id).stock_quantity;

    const res = await request(app)
      .post('/api/orders/checkout')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        items: [{ food_item_id: testFood.id, quantity: currentStock + 50 }],
        payment_method: 'Cash at Counter',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/sold out or has only/i);
  });

  it('should reject checkout when cart is empty', async () => {
    const res = await request(app)
      .post('/api/orders/checkout')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        items: [],
        payment_method: 'Cash at Counter',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/cart is empty/i);
  });

  it('should allow student to view their own orders', async () => {
    const res = await request(app)
      .get('/api/orders/my-orders')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.orders)).toBe(true);
    expect(res.body.orders.length).toBeGreaterThan(0);
  });

  it('should prevent another student from viewing someone else order', async () => {
    // Create an order as first student
    const orderRes = await request(app)
      .post('/api/orders/checkout')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        items: [{ food_item_id: testFood.id, quantity: 1 }],
        payment_method: 'Cash at Counter',
      });

    const orderId = orderRes.body.order.id;

    // Attempt to access as other student
    const forbiddenRes = await request(app)
      .get(`/api/orders/${orderId}`)
      .set('Authorization', `Bearer ${otherStudentToken}`);

    expect(forbiddenRes.status).toBe(403);
    expect(forbiddenRes.body.error).toMatch(/unauthorized/i);
  });

  it('should allow student to cancel order and restore item stock', async () => {
    const db = getDb();
    const stockBefore = db.prepare('SELECT stock_quantity FROM food_items WHERE id = ?').get(testFood.id).stock_quantity;

    // Place new order
    const orderRes = await request(app)
      .post('/api/orders/checkout')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        items: [{ food_item_id: testFood.id, quantity: 2 }],
        payment_method: 'Cash at Counter',
      });

    const orderId = orderRes.body.order.id;

    // Cancel the order
    const cancelRes = await request(app)
      .post(`/api/orders/${orderId}/cancel`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.order.status).toBe('Cancelled');

    // Verify stock is restored back
    const stockAfter = db.prepare('SELECT stock_quantity FROM food_items WHERE id = ?').get(testFood.id).stock_quantity;
    expect(stockAfter).toBe(stockBefore);
  });
});
