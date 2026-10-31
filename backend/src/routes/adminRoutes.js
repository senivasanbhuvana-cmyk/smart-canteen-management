const express = require('express');
const { getDb } = require('../db');
const { adminRequired } = require('../auth');
const { getOrderWithItems } = require('./orderRoutes');

const router = express.Router();

const VALID_STATUS_FLOW = {
  Placed: ['Confirmed', 'Cancelled'],
  Confirmed: ['Preparing', 'Cancelled'],
  Preparing: ['Ready for Pickup', 'Cancelled'],
  'Ready for Pickup': ['Completed', 'Cancelled'],
  Completed: [],
  Cancelled: [],
};

// GET /api/admin/stats
router.get('/stats', adminRequired, (req, res) => {
  const db = getDb();

  // 1. Total Orders
  const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;

  // 2. Today's Orders
  const todayOrders = db.prepare(`
    SELECT COUNT(*) as count FROM orders
    WHERE DATE(created_at, 'localtime') = DATE('now', 'localtime')
  `).get().count;

  // 3. Today's Sales
  const todaySalesRow = db.prepare(`
    SELECT COALESCE(SUM(total_amount), 0.0) as sum FROM orders
    WHERE status = 'Completed' AND DATE(created_at, 'localtime') = DATE('now', 'localtime')
  `).get();
  const todaySales = todaySalesRow ? todaySalesRow.sum : 0.0;

  // 4. All-time Sales
  const allTimeSalesRow = db.prepare(`
    SELECT COALESCE(SUM(total_amount), 0.0) as sum FROM orders
    WHERE status = 'Completed'
  `).get();
  const allTimeSales = allTimeSalesRow ? allTimeSalesRow.sum : 0.0;

  // 5. Total Menu Items
  const totalFoods = db.prepare('SELECT COUNT(*) as count FROM food_items').get().count;

  // 6. Low stock items (stock > 0 and stock <= 5)
  const lowStockItems = db.prepare(`
    SELECT id, name, category, price, stock_quantity, is_available
    FROM food_items
    WHERE stock_quantity > 0 AND stock_quantity <= 5
    ORDER BY stock_quantity ASC
  `).all();

  // 7. Sold out items (stock == 0 or is_available == 0)
  const soldOutItems = db.prepare(`
    SELECT id, name, category, price, stock_quantity, is_available
    FROM food_items
    WHERE stock_quantity = 0 OR is_available = 0
    ORDER BY name ASC
  `).all();

  // 8. Status counts
  const statusCountsRows = db.prepare(`
    SELECT status, COUNT(*) as count FROM orders GROUP BY status
  `).all();
  const statusCounts = {};
  for (const r of statusCountsRows) {
    statusCounts[r.status] = r.count;
  }

  // 9. Recent orders
  const recentOrders = db.prepare(`
    SELECT o.*, u.name as user_name, u.email as user_email, u.student_id
    FROM orders o
    JOIN users u ON o.user_id = u.id
    ORDER BY o.created_at DESC
    LIMIT 6
  `).all();

  const countItemsStmt = db.prepare(`
    SELECT SUM(quantity) as count FROM order_items WHERE order_id = ?
  `);

  for (const o of recentOrders) {
    const it = countItemsStmt.get(o.id);
    o.items_count = it && it.count ? it.count : 0;
  }

  return res.status(200).json({
    total_orders: totalOrders,
    today_orders: todayOrders,
    today_sales: Math.round(todaySales * 100) / 100,
    all_time_sales: Math.round(allTimeSales * 100) / 100,
    total_menu_items: totalFoods,
    low_stock_count: lowStockItems.length,
    sold_out_count: soldOutItems.length,
    low_stock_items: lowStockItems,
    sold_out_items: soldOutItems,
    status_counts: statusCounts,
    recent_orders: recentOrders,
  });
});

// GET /api/admin/orders
router.get('/orders', adminRequired, (req, res) => {
  const { status, search, date } = req.query;
  const db = getDb();

  let query = `
    SELECT o.*, u.name as user_name, u.email as user_email, u.student_id
    FROM orders o
    JOIN users u ON o.user_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (status && status.toLowerCase() !== 'all') {
    query += ' AND LOWER(o.status) = LOWER(?)';
    params.push(status);
  }

  if (date) {
    query += " AND DATE(o.created_at, 'localtime') = DATE(?)";
    params.push(date);
  }

  if (search && search.trim()) {
    query += ' AND (LOWER(o.order_number) LIKE ? OR LOWER(u.name) LIKE ? OR LOWER(u.student_id) LIKE ?)';
    const s = `%${search.trim().toLowerCase()}%`;
    params.push(s, s, s);
  }

  query += ' ORDER BY o.created_at DESC';

  const orders = db.prepare(query).all(...params);

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

// PUT /api/admin/orders/:id/status
router.put('/orders/:id/status', adminRequired, (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const order = getOrderWithItems(id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const data = req.body || {};
  const newStatus = (data.status || '').trim();

  const validTargets = VALID_STATUS_FLOW[order.status] || [];
  if (!validTargets.includes(newStatus)) {
    return res.status(400).json({
      error: `Invalid status transition from '${order.status}' to '${newStatus}'. Allowed targets: ${validTargets.join(', ') || 'None (final status)'}`,
    });
  }

  const db = getDb();
  try {
    db.exec('BEGIN TRANSACTION;');

    let paymentUpdate = '';
    if (newStatus === 'Completed') {
      paymentUpdate = ", payment_status = 'paid'";
    }

    db.prepare(`
      UPDATE orders
      SET status = ?, updated_at = CURRENT_TIMESTAMP ${paymentUpdate}
      WHERE id = ?
    `).run(newStatus, id);

    if (newStatus === 'Cancelled') {
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
    }

    db.exec('COMMIT;');

    const updatedOrder = getOrderWithItems(id, db);
    return res.status(200).json({
      message: `Order status updated to '${newStatus}'`,
      order: updatedOrder,
    });
  } catch (err) {
    try {
      db.exec('ROLLBACK;');
    } catch (e) {
      // ignore
    }
    return res.status(500).json({ error: `Failed to update status: ${err.message}` });
  }
});

module.exports = router;
