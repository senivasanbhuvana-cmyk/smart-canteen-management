const express = require('express');
const crypto = require('crypto');
const { getDb } = require('../db');
const { tokenRequired } = require('../auth');

const router = express.Router();

const VALID_PAYMENT_METHODS = ['Cash at Counter', 'Demo Online Payment'];
const CANCELLABLE_STATUSES = ['Placed', 'Confirmed'];

function generateOrderNumber() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const shortHash = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `SB-${dateStr}-${shortHash}`;
}

function getOrderWithItems(orderId, dbInstance = null) {
  const db = dbInstance || getDb();
  const order = db.prepare(`
    SELECT o.*, u.name as user_name, u.email as user_email, u.student_id
    FROM orders o
    JOIN users u ON o.user_id = u.id
    WHERE o.id = ?
  `).get(orderId);

  if (!order) return null;

  const items = db.prepare(`
    SELECT oi.*, fi.image_url, fi.is_veg, fi.category
    FROM order_items oi
    LEFT JOIN food_items fi ON oi.food_item_id = fi.id
    WHERE oi.order_id = ?
  `).all(orderId);

  order.items = items;
  return order;
}

// POST /api/orders/checkout
router.post('/checkout', tokenRequired, (req, res) => {
  const data = req.body || {};
  const items = data.items || [];
  const paymentMethod = (data.payment_method || 'Cash at Counter').trim();
  const notes = (data.notes || '').trim();

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Cart is empty. Please add items to order.' });
  }

  if (!VALID_PAYMENT_METHODS.includes(paymentMethod)) {
    return res.status(400).json({
      error: "Invalid payment method. Choose either 'Cash at Counter' or 'Demo Online Payment'.",
    });
  }

  const paymentStatus = paymentMethod === 'Demo Online Payment' ? 'paid' : 'pending';
  const db = getDb();

  try {
    db.exec('BEGIN TRANSACTION;');

    const validatedItems = [];
    let totalAmount = 0;

    for (const item of items) {
      const foodId = parseInt(item.food_item_id, 10);
      const qty = parseInt(item.quantity, 10);

      if (isNaN(foodId) || isNaN(qty) || qty <= 0) {
        db.exec('ROLLBACK;');
        return res.status(400).json({ error: 'Invalid item or quantity specified' });
      }

      const food = db
        .prepare('SELECT id, name, price, stock_quantity, is_available FROM food_items WHERE id = ?')
        .get(foodId);

      if (!food) {
        db.exec('ROLLBACK;');
        return res.status(404).json({ error: `Food item (ID: ${foodId}) not found` });
      }

      if (!food.is_available || food.stock_quantity < qty) {
        db.exec('ROLLBACK;');
        return res.status(400).json({
          error: `'${food.name}' is sold out or has only ${food.stock_quantity} left in stock.`,
        });
      }

      const subtotal = Math.round(food.price * qty * 100) / 100;
      totalAmount += subtotal;

      validatedItems.push({
        food_id: food.id,
        name: food.name,
        price: food.price,
        quantity: qty,
        subtotal,
        new_stock: food.stock_quantity - qty,
      });
    }

    totalAmount = Math.round(totalAmount * 100) / 100;
    const orderNumber = generateOrderNumber();

    const orderRes = db.prepare(`
      INSERT INTO orders (order_number, user_id, total_amount, payment_method, payment_status, status, notes)
      VALUES (?, ?, ?, ?, ?, 'Placed', ?)
    `).run(orderNumber, req.currentUser.id, totalAmount, paymentMethod, paymentStatus, notes);

    const orderId = orderRes.lastInsertRowid;

    const insertItemStmt = db.prepare(`
      INSERT INTO order_items (order_id, food_item_id, item_name, price_at_order, quantity, subtotal)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const updateStockStmt = db.prepare(`
      UPDATE food_items
      SET stock_quantity = ?, is_available = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    for (const v of validatedItems) {
      insertItemStmt.run(orderId, v.food_id, v.name, v.price, v.quantity, v.subtotal);
      const newAvail = v.new_stock > 0 ? 1 : 0;
      updateStockStmt.run(v.new_stock, newAvail, v.food_id);
    }

    db.exec('COMMIT;');

    const createdOrder = getOrderWithItems(orderId, db);
    return res.status(201).json({
      message: 'Order placed successfully!',
      order: createdOrder,
    });
  } catch (err) {
    try {
      db.exec('ROLLBACK;');
    } catch (e) {
      // ignore
    }
    return res.status(500).json({ error: `Failed to place order: ${err.message}` });
  }
});

// GET /api/orders/my-orders
router.get('/my-orders', tokenRequired, (req, res) => {
  const db = getDb();
  const orders = db.prepare(`
    SELECT * FROM orders
    WHERE user_id = ?
    ORDER BY created_at DESC
  `).all(req.currentUser.id);

  const getItemsStmt = db.prepare(`
    SELECT oi.*, fi.image_url, fi.is_veg, fi.category
    FROM order_items oi
    LEFT JOIN food_items fi ON oi.food_item_id = fi.id
    WHERE oi.order_id = ?
  `);

  for (const o of orders) {
    o.items = getItemsStmt.all(o.id);
  }

  return res.status(200).json({ orders, count: orders.length });
});

// GET /api/orders/:id
router.get('/:id', tokenRequired, (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const order = getOrderWithItems(id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  if (req.currentUser.role !== 'admin' && order.user_id !== req.currentUser.id) {
    return res.status(403).json({ error: 'Unauthorized access to this order' });
  }

  return res.status(200).json({ order });
});

// POST /api/orders/:id/cancel
router.post('/:id/cancel', tokenRequired, (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const order = getOrderWithItems(id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  if (req.currentUser.role !== 'admin' && order.user_id !== req.currentUser.id) {
    return res.status(403).json({ error: 'Unauthorized to cancel this order' });
  }

  if (order.status === 'Cancelled') {
    return res.status(400).json({ error: 'Order is already cancelled' });
  }

  if (!CANCELLABLE_STATUSES.includes(order.status)) {
    return res.status(400).json({
      error: `Cannot cancel order with status '${order.status}'. Cancellation is only allowed before food preparation begins.`,
    });
  }

  const db = getDb();
  try {
    db.exec('BEGIN TRANSACTION;');

    db.prepare(`
      UPDATE orders
      SET status = 'Cancelled', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(id);

    const restoreStockStmt = db.prepare(`
      UPDATE food_items
      SET stock_quantity = stock_quantity + ?,
          is_available = 1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    for (const item of order.items) {
      restoreStockStmt.run(item.quantity, item.food_item_id);
    }

    db.exec('COMMIT;');

    const updatedOrder = getOrderWithItems(id, db);
    return res.status(200).json({
      message: 'Order successfully cancelled and item stock restored',
      order: updatedOrder,
    });
  } catch (err) {
    try {
      db.exec('ROLLBACK;');
    } catch (e) {
      // ignore
    }
    return res.status(500).json({ error: `Failed to cancel order: ${err.message}` });
  }
});

module.exports = {
  router,
  getOrderWithItems,
};
