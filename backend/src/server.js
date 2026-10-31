require('dotenv').config();
const { createApp } = require('./app');
const { getDb } = require('./db');
const { seedDatabase } = require('./seed');

const PORT = parseInt(process.env.PORT, 10) || 5000;
const app = createApp();

// Ensure initial database seeding has run
try {
  const db = getDb();
  const admin = db.prepare("SELECT id FROM users WHERE role = 'admin' LIMIT 1").get();
  const foodCount = db.prepare("SELECT count(*) as count FROM food_items").get()?.count || 0;
  if (!admin || foodCount === 0) {
    console.log('Database missing admin or menu items. Running automated seed...');
    seedDatabase();
  }
} catch (err) {
  console.warn('Auto-seed check notice:', err.message);
}

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`SmartBite API Server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

module.exports = server;
