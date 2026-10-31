const request = require('supertest');
const { createApp } = require('../src/app');
const { getDb, initDb, closeDb } = require('../src/db');
const { seedDatabase } = require('../src/seed');

describe('Authentication & User Management API', () => {
  let app;

  beforeAll(() => {
    // Setup test database
    initDb();
    seedDatabase();
    app = createApp();
  });

  afterAll(() => {
    closeDb();
  });

  const uniqueStudentId = `TEST-${Date.now()}`;
  const testStudent = {
    name: 'Priya Patel',
    email: `priya_${Date.now()}@campus.edu`,
    student_id: uniqueStudentId,
    password: 'password123',
  };

  it('should register a new student account successfully', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testStudent);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toMatchObject({
      name: testStudent.name,
      email: testStudent.email.toLowerCase(),
      student_id: testStudent.student_id,
      role: 'student',
    });
  });

  it('should reject registration with duplicate email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        ...testStudent,
        student_id: `DIFF-${Date.now()}`,
      });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already exists/i);
  });

  it('should reject registration with duplicate student ID', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Another User',
        email: `another_${Date.now()}@campus.edu`,
        student_id: testStudent.student_id,
        password: 'password123',
      });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already exists/i);
  });

  it('should reject registration with invalid email or short password', async () => {
    const res1 = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Invalid Email',
        email: 'invalid-email',
        student_id: `INV-${Date.now()}`,
        password: 'password123',
      });
    expect(res1.status).toBe(400);

    const res2 = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Short Pw',
        email: `valid_${Date.now()}@campus.edu`,
        student_id: `INV2-${Date.now()}`,
        password: '123',
      });
    expect(res2.status).toBe(400);
  });

  it('should login with valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testStudent.email,
        password: testStudent.password,
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe(testStudent.email.toLowerCase());
  });

  it('should reject login with incorrect password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testStudent.email,
        password: 'wrongpassword',
      });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid email or password/i);
  });

  it('should return current user profile via /api/auth/me', async () => {
    // First login
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: testStudent.email,
        password: testStudent.password,
      });

    const token = loginRes.body.token;

    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.user.email).toBe(testStudent.email.toLowerCase());
  });

  it('should reject /api/auth/me without valid token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});
