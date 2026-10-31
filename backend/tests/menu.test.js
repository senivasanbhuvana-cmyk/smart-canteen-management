const request = require('supertest');
const { createApp } = require('../src/app');
const { initDb, closeDb } = require('../src/db');
const { seedDatabase } = require('../src/seed');

describe('Menu & Food Management API', () => {
  let app;
  let adminToken;
  let studentToken;

  beforeAll(async () => {
    initDb();
    seedDatabase();
    app = createApp();

    // Login as admin
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@smartbite.com', password: 'admin123' });
    adminToken = adminRes.body.token;

    // Login as student
    const studentRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'student@campus.edu', password: 'student123' });
    studentToken = studentRes.body.token;
  });

  afterAll(() => {
    closeDb();
  });

  it('should list all available food items', async () => {
    const res = await request(app).get('/api/foods');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.foods)).toBe(true);
    expect(res.body.count).toBeGreaterThan(0);
  });

  it('should fetch categories summary', async () => {
    const res = await request(app).get('/api/foods/categories');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.categories)).toBe(true);
    expect(res.body.categories.length).toBeGreaterThan(0);
  });

  it('should filter foods by category and search term', async () => {
    const res1 = await request(app).get('/api/foods?category=Breakfast');
    expect(res1.status).toBe(200);
    expect(res1.body.foods.every(f => f.category === 'Breakfast')).toBe(true);

    const res2 = await request(app).get('/api/foods?search=Dosa');
    expect(res2.status).toBe(200);
    expect(res2.body.foods.some(f => f.name.includes('Dosa'))).toBe(true);
  });

  it('should filter foods by veg preference', async () => {
    const res = await request(app).get('/api/foods?is_veg=1');
    expect(res.status).toBe(200);
    expect(res.body.foods.every(f => f.is_veg === 1)).toBe(true);
  });

  it('should allow admin to create a new food item', async () => {
    const newFood = {
      name: `Test Paneer Wrap ${Date.now()}`,
      category: 'Snacks',
      price: 85.0,
      stock_quantity: 15,
      description: 'Fresh grilled wrap stuffed with cottage cheese',
      is_veg: true,
      image_url: 'https://images.unsplash.com/test-wrap.jpg',
      is_available: true,
    };

    const res = await request(app)
      .post('/api/foods')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(newFood);

    expect(res.status).toBe(201);
    expect(res.body.food.name).toBe(newFood.name);
    expect(res.body.food.price).toBe(85.0);
  });

  it('should forbid student from creating a food item', async () => {
    const res = await request(app)
      .post('/api/foods')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        name: 'Unauthorized Item',
        category: 'Snacks',
        price: 50,
      });

    expect(res.status).toBe(403);
  });

  it('should allow admin to update an existing food item', async () => {
    // Get existing food
    const listRes = await request(app).get('/api/foods');
    const targetFood = listRes.body.foods[0];

    const updateRes = await request(app)
      .put(`/api/foods/${targetFood.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        price: targetFood.price + 5,
        stock_quantity: 28,
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.food.stock_quantity).toBe(28);
  });
});
