const express = require('express');
const cors = require('cors');
const { initDb } = require('./db');
const authRoutes = require('./routes/authRoutes');
const foodRoutes = require('./routes/foodRoutes');
const { router: orderRoutes } = require('./routes/orderRoutes');
const adminRoutes = require('./routes/adminRoutes');

function createApp(dbPath = null) {
  const app = express();

  // Initialize SQLite tables
  initDb();

  // Configure CORS
  const allowedOrigins = [
    process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:80',
    'http://localhost',
  ];

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, or same-origin)
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(null, true); // Permissive in dev, can restrict if needed
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.status(200).json({
      status: 'healthy',
      service: 'SmartBite Canteen Management API',
      version: '1.0.0',
    });
  });

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/foods', foodRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/admin', adminRoutes);

  // 404 Handler for /api routes
  app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'Resource not found.' });
  });

  // Global Error Handler
  app.use((err, req, res, next) => {
    console.error('Unhandled server error:', err);
    res.status(500).json({
      error: 'An internal server error occurred. Please try again later.',
    });
  });

  return app;
}

module.exports = {
  createApp,
};
