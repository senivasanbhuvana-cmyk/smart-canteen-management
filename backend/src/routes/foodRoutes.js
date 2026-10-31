const express = require('express');
const { getDb } = require('../db');
const { adminRequired } = require('../auth');

const router = express.Router();
const VALID_CATEGORIES = ['Breakfast', 'Meals', 'Snacks', 'Fast Food', 'Drinks'];

// GET /api/foods
router.get('/', (req, res) => {
  try {
    const { category, search, is_veg, available_only } = req.query;
    const db = getDb();

    let query = 'SELECT * FROM food_items WHERE 1=1';
    const params = [];

    if (category && category.trim() && category.trim().toLowerCase() !== 'all') {
      query += ' AND LOWER(category) = LOWER(?)';
      params.push(category.trim());
    }

    if (search && search.trim()) {
      query += ' AND (LOWER(name) LIKE ? OR LOWER(description) LIKE ?)';
      const term = `%${search.trim().toLowerCase()}%`;
      params.push(term, term);
    }

    if (is_veg !== undefined && is_veg !== null && is_veg !== '') {
      const strVeg = String(is_veg).trim().toLowerCase();
      if (strVeg !== 'all') {
        const isVegNum = ['1', 'true', 'yes', 'veg'].includes(strVeg) ? 1 : 0;
        query += ' AND is_veg = ?';
        params.push(isVegNum);
      }
    }

    if (available_only !== undefined && ['1', 'true', 'yes'].includes(String(available_only).trim().toLowerCase())) {
      query += ' AND is_available = 1 AND stock_quantity > 0';
    }

    query += ' ORDER BY category ASC, name ASC';

    const foods = db.prepare(query).all(...params);
    return res.status(200).json({ foods, count: foods.length });
  } catch (err) {
    console.error('Error fetching foods:', err);
    return res.status(500).json({ error: 'Failed to retrieve menu items from database' });
  }
});

// GET /api/foods/categories
router.get('/categories', (req, res) => {
  const db = getDb();
  const categories = db.prepare(`
    SELECT category, COUNT(*) as item_count
    FROM food_items
    GROUP BY category
    ORDER BY category ASC
  `).all();

  return res.status(200).json({ categories });
});

// GET /api/foods/:id
router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(404).json({ error: 'Food item not found' });
  }

  const db = getDb();
  const food = db.prepare('SELECT * FROM food_items WHERE id = ?').get(id);

  if (!food) {
    return res.status(404).json({ error: 'Food item not found' });
  }

  return res.status(200).json({ food });
});

// POST /api/foods
router.post('/', adminRequired, (req, res) => {
  const data = req.body || {};
  const name = (data.name || '').trim();
  const category = (data.category || '').trim();
  const price = parseFloat(data.price);
  const stockQuantity = data.stock_quantity !== undefined ? parseInt(data.stock_quantity, 10) : 20;
  const description = (data.description || '').trim();
  const isVeg = data.is_veg !== undefined ? (data.is_veg ? 1 : 0) : 1;
  const imageUrl = (data.image_url || '').trim();
  const isAvailable = data.is_available !== undefined ? (data.is_available ? 1 : 0) : 1;

  if (!name) {
    return res.status(400).json({ error: 'Food item name is required' });
  }

  if (!category || !VALID_CATEGORIES.includes(category)) {
    return res.status(400).json({
      error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`,
    });
  }

  if (isNaN(price) || price <= 0) {
    return res.status(400).json({ error: 'Price must be a positive number' });
  }

  if (isNaN(stockQuantity) || stockQuantity < 0) {
    return res.status(400).json({ error: 'Stock quantity must be a non-negative integer' });
  }

  const db = getDb();
  const effectiveAvail = isAvailable && stockQuantity > 0 ? 1 : 0;

  const result = db.prepare(`
    INSERT INTO food_items (name, description, category, price, is_veg, image_url, stock_quantity, is_available)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(name, description, category, price, isVeg, imageUrl, stockQuantity, effectiveAvail);

  const newFood = db.prepare('SELECT * FROM food_items WHERE id = ?').get(result.lastInsertRowid);

  return res.status(201).json({
    message: 'Food item created successfully',
    food: newFood,
  });
});

// PUT /api/foods/:id
router.put('/:id', adminRequired, (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(404).json({ error: 'Food item not found' });
  }

  const db = getDb();
  const existing = db.prepare('SELECT * FROM food_items WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Food item not found' });
  }

  const data = req.body || {};
  const name = data.name !== undefined ? (data.name || '').trim() : existing.name;
  const category = data.category !== undefined ? (data.category || '').trim() : existing.category;
  const description = data.description !== undefined ? data.description : existing.description;
  const imageUrl = data.image_url !== undefined ? data.image_url : existing.image_url;
  const isVeg = data.is_veg !== undefined ? (data.is_veg ? 1 : 0) : existing.is_veg;

  let price = existing.price;
  if (data.price !== undefined) {
    price = parseFloat(data.price);
    if (isNaN(price) || price <= 0) {
      return res.status(400).json({ error: 'Price must be a positive number' });
    }
  }

  let stockQuantity = existing.stock_quantity;
  if (data.stock_quantity !== undefined) {
    stockQuantity = parseInt(data.stock_quantity, 10);
    if (isNaN(stockQuantity) || stockQuantity < 0) {
      return res.status(400).json({ error: 'Stock quantity must be a non-negative integer' });
    }
  }

  let isAvailable = existing.is_available;
  if (data.is_available !== undefined) {
    isAvailable = data.is_available ? 1 : 0;
  }
  const effectiveAvail = isAvailable && stockQuantity > 0 ? 1 : 0;

  db.prepare(`
    UPDATE food_items
    SET name = ?, description = ?, category = ?, price = ?, is_veg = ?, image_url = ?,
        stock_quantity = ?, is_available = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(name, description, category, price, isVeg, imageUrl, stockQuantity, effectiveAvail, id);

  const updatedFood = db.prepare('SELECT * FROM food_items WHERE id = ?').get(id);

  return res.status(200).json({
    message: 'Food item updated successfully',
    food: updatedFood,
  });
});

// DELETE /api/foods/:id
router.delete('/:id', adminRequired, (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(404).json({ error: 'Food item not found' });
  }

  const db = getDb();
  const existing = db.prepare('SELECT * FROM food_items WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Food item not found' });
  }

  // Check if food has been ordered
  const orderRef = db.prepare('SELECT id FROM order_items WHERE food_item_id = ? LIMIT 1').get(id);
  if (orderRef) {
    db.prepare('UPDATE food_items SET is_available = 0, stock_quantity = 0 WHERE id = ?').run(id);
    return res.status(200).json({
      message: 'Food item archived and set unavailable (has order history)',
      archived: true,
    });
  }

  db.prepare('DELETE FROM food_items WHERE id = ?').run(id);
  return res.status(200).json({ message: 'Food item deleted successfully' });
});

module.exports = router;
