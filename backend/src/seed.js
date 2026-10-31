const { getDb, initDb } = require('./db');
const { hashPassword } = require('./auth');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@smartbite.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const ADMIN_NAME = process.env.ADMIN_NAME || 'Campus Admin';

const SAMPLE_STUDENT_EMAIL = 'student@campus.edu';
const SAMPLE_STUDENT_PASSWORD = 'student123';
const SAMPLE_STUDENT_NAME = 'Aarav Sharma';
const SAMPLE_STUDENT_ID = 'CS2026-042';

const SAMPLE_FOODS = [
  // Breakfast
  {
    name: 'Masala Dosa',
    description: 'Crispy golden fermented rice-lentil crepe stuffed with spiced potato masala, served with fresh coconut chutney & piping hot sambar.',
    category: 'Breakfast',
    price: 70.0,
    is_veg: 1,
    image_url: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&auto=format&fit=crop&q=80',
    stock_quantity: 30,
    is_available: 1,
  },
  {
    name: 'Idli Vada Combo',
    description: 'Two melt-in-mouth steamed idlis paired with a crispy golden medu vada, served with traditional coconut & tomato chutneys.',
    category: 'Breakfast',
    price: 60.0,
    is_veg: 1,
    image_url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80',
    stock_quantity: 25,
    is_available: 1,
  },
  {
    name: 'Indori Poha',
    description: 'Warm flattened rice tossed with crunchy roasted peanuts, mustard seeds, green chillies, turmeric and crowned with crispy sev & lime.',
    category: 'Breakfast',
    price: 40.0,
    is_veg: 1,
    image_url: 'https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?w=600&auto=format&fit=crop&q=80',
    stock_quantity: 20,
    is_available: 1,
  },
  {
    name: 'Aloo Paratha with Curd',
    description: 'Tawa-roasted whole wheat paratha generously stuffed with spiced herb mashed potatoes, served with churned curd and homemade pickle.',
    category: 'Breakfast',
    price: 55.0,
    is_veg: 1,
    image_url: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=600&auto=format&fit=crop&q=80',
    stock_quantity: 18,
    is_available: 1,
  },

  // Meals
  {
    name: 'Hyderabadi Chicken Biryani',
    description: 'Aromatic long-grain basmati rice slow-cooked with tender marinated chicken pieces, saffron, whole spices, served with cooling onion raita.',
    category: 'Meals',
    price: 160.0,
    is_veg: 0,
    image_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80',
    stock_quantity: 20,
    is_available: 1,
  },
  {
    name: 'Paneer Butter Masala Meal',
    description: 'Creamy rich tomato-cashew gravy with soft cottage cheese cubes, served with 2 fluffy butter naans, jeera rice and salad.',
    category: 'Meals',
    price: 140.0,
    is_veg: 1,
    image_url: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&auto=format&fit=crop&q=80',
    stock_quantity: 15,
    is_available: 1,
  },
  {
    name: 'South Indian Mini Thali',
    description: 'Wholesome executive lunch platter with steamed Ponni rice, Madras sambar, tomato rasam, vegetable poriyal, appalam, curd & sweet.',
    category: 'Meals',
    price: 110.0,
    is_veg: 1,
    image_url: 'https://images.unsplash.com/photo-1610057099431-d73a1c9d2f2f?w=600&auto=format&fit=crop&q=80',
    stock_quantity: 25,
    is_available: 1,
  },
  {
    name: 'Egg Curry Bowl',
    description: 'Two golden-fried boiled eggs simmered in a homestyle onion-tomato gravy, served over fragrant steamed basmati rice.',
    category: 'Meals',
    price: 95.0,
    is_veg: 0,
    image_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80',
    stock_quantity: 4, // Low stock demo
    is_available: 1,
  },

  // Snacks
  {
    name: 'Crispy Veg Samosa (2 pcs)',
    description: 'Crisp flaky triangular pastries loaded with spiced potatoes, green peas and whole coriander seeds, served with sweet-tangy saunth chutney.',
    category: 'Snacks',
    price: 30.0,
    is_veg: 1,
    image_url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80',
    stock_quantity: 45,
    is_available: 1,
  },
  {
    name: 'Mumbai Pav Bhaji',
    description: 'Mashed spiced mixed vegetable gravy simmered with special butter pav bhaji masala, served with 2 buttery griddled pav buns & lemon.',
    category: 'Snacks',
    price: 85.0,
    is_veg: 1,
    image_url: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=600&auto=format&fit=crop&q=80',
    stock_quantity: 22,
    is_available: 1,
  },
  {
    name: 'Paneer Pakora Platter',
    description: 'Fresh cottage cheese slices stuffed with mint chutney, batter-fried in spiced gram flour and dusted with chaat masala.',
    category: 'Snacks',
    price: 65.0,
    is_veg: 1,
    image_url: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop&q=80',
    stock_quantity: 18,
    is_available: 1,
  },

  // Fast Food
  {
    name: 'Crispy Veg Cheese Burger',
    description: 'Crunchy herb potato-corn patty topped with melted cheddar cheese slice, fresh lettuce, sliced tomatoes and creamy tandoori mayo.',
    category: 'Fast Food',
    price: 80.0,
    is_veg: 1,
    image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80',
    stock_quantity: 24,
    is_available: 1,
  },
  {
    name: 'Grilled Chicken Burger',
    description: 'Juicy seasoned chicken breast patty flame-grilled, stacked with pickled cucumbers, melted cheese, crisp onion rings and smoky chipotle sauce.',
    category: 'Fast Food',
    price: 120.0,
    is_veg: 0,
    image_url: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&auto=format&fit=crop&q=80',
    stock_quantity: 16,
    is_available: 1,
  },
  {
    name: 'Peri Peri French Fries',
    description: 'Crispy golden potato fries deep fried to perfection and generously tossed in tangy, spicy peri-peri seasoning. Served with garlic dip.',
    category: 'Fast Food',
    price: 65.0,
    is_veg: 1,
    image_url: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=600&auto=format&fit=crop&q=80',
    stock_quantity: 35,
    is_available: 1,
  },
  {
    name: 'Farmhouse Cheesy Pizza (8 inch)',
    description: 'Freshly baked hand-tossed personal pizza loaded with mozzarella cheese, capsicum, sweet corn, diced red onions and black olives.',
    category: 'Fast Food',
    price: 150.0,
    is_veg: 1,
    image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80',
    stock_quantity: 0, // Sold out demo
    is_available: 0,
  },

  // Drinks
  {
    name: 'South Indian Filter Coffee',
    description: 'Authentic Kumbakonam degree decoction brewed coffee whipped with rich boiled milk into a frothy hot aromatic delight.',
    category: 'Drinks',
    price: 25.0,
    is_veg: 1,
    image_url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
    stock_quantity: 50,
    is_available: 1,
  },
  {
    name: 'Special Masala Chai',
    description: 'Kadak hot Assam black tea slow-brewed with freshly pounded ginger, crushed cardamom, cloves and cinnamon.',
    category: 'Drinks',
    price: 20.0,
    is_veg: 1,
    image_url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80',
    stock_quantity: 60,
    is_available: 1,
  },
  {
    name: 'Alphonso Page Lassi',
    name: 'Alphonso Mango Lassi',
    description: 'Rich creamy churned whole milk yogurt infused with sweet Alphonso mango pulp, flavored with green cardamom and saffron strands.',
    category: 'Drinks',
    price: 50.0,
    is_veg: 1,
    image_url: 'https://images.unsplash.com/photo-1553787499-6f9133860278?w=600&auto=format&fit=crop&q=80',
    stock_quantity: 25,
    is_available: 1,
  },
  {
    name: 'Iced Cold Coffee with Ice Cream',
    description: 'Chilled blended espresso coffee with creamy vanilla bean ice cream and a swirl of rich Hershey\'s chocolate syrup.',
    category: 'Drinks',
    price: 60.0,
    is_veg: 1,
    image_url: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=600&auto=format&fit=crop&q=80',
    stock_quantity: 3, // Low stock demo
    is_available: 1,
  },
  {
    name: 'Fresh Mint Lime Soda',
    description: 'Crisp sparkling chilled club soda infused with freshly squeezed key limes, muddled garden mint and sweet-salty rock salt.',
    category: 'Drinks',
    price: 35.0,
    is_veg: 1,
    image_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=80',
    stock_quantity: 40,
    is_available: 1,
  },
];

function seedDatabase(dbPath = null) {
  const db = initDb(getDb(dbPath));

  // 1. Seed Administrator
  const adminRow = db
    .prepare('SELECT id, password_hash FROM users WHERE LOWER(email) = LOWER(?)')
    .get(ADMIN_EMAIL);

  if (!adminRow) {
    db.prepare(`
      INSERT INTO users (name, email, student_id, password_hash, role)
      VALUES (?, ?, NULL, ?, 'admin')
    `).run(ADMIN_NAME, ADMIN_EMAIL.toLowerCase(), hashPassword(ADMIN_PASSWORD));
    console.log(`Created initial admin: ${ADMIN_EMAIL}`);
  } else {
    if (!adminRow.password_hash || !adminRow.password_hash.startsWith('$2')) {
      db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(
        hashPassword(ADMIN_PASSWORD),
        adminRow.id
      );
    }
    console.log(`Admin account verified: ${ADMIN_EMAIL}`);
  }

  // 2. Seed Sample Student
  const studentRow = db
    .prepare('SELECT id, password_hash FROM users WHERE LOWER(email) = LOWER(?)')
    .get(SAMPLE_STUDENT_EMAIL);

  let studentId;
  if (!studentRow) {
    const res = db.prepare(`
      INSERT INTO users (name, email, student_id, password_hash, role)
      VALUES (?, ?, ?, ?, 'student')
    `).run(
      SAMPLE_STUDENT_NAME,
      SAMPLE_STUDENT_EMAIL.toLowerCase(),
      SAMPLE_STUDENT_ID,
      hashPassword(SAMPLE_STUDENT_PASSWORD)
    );
    studentId = res.lastInsertRowid;
    console.log(`Created sample student: ${SAMPLE_STUDENT_EMAIL}`);
  } else {
    studentId = studentRow.id;
    if (!studentRow.password_hash || !studentRow.password_hash.startsWith('$2')) {
      db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(
        hashPassword(SAMPLE_STUDENT_PASSWORD),
        studentRow.id
      );
    }
    console.log(`Student account verified: ${SAMPLE_STUDENT_EMAIL}`);
  }

  // 3. Seed Food Items
  let insertedFoodCount = 0;
  const insertFoodStmt = db.prepare(`
    INSERT INTO food_items (name, description, category, price, is_veg, image_url, stock_quantity, is_available)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const food of SAMPLE_FOODS) {
    const existing = db
      .prepare('SELECT id FROM food_items WHERE LOWER(name) = LOWER(?)')
      .get(food.name);

    if (!existing) {
      insertFoodStmt.run(
        food.name,
        food.description,
        food.category,
        food.price,
        food.is_veg,
        food.image_url,
        food.stock_quantity,
        food.is_available
      );
      insertedFoodCount++;
    }
  }
  console.log(`Seeded ${insertedFoodCount} new menu items.`);

  // 4. Seed 2 sample demonstration orders if none exist
  const orderCount = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;
  if (orderCount === 0 && studentId) {
    const insertOrderStmt = db.prepare(`
      INSERT INTO orders (order_number, user_id, total_amount, payment_method, payment_status, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const insertItemStmt = db.prepare(`
      INSERT INTO order_items (order_id, food_item_id, item_name, price_at_order, quantity, subtotal)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    // Sample Order 1: Completed
    const res1 = insertOrderStmt.run(
      'SB-20261013-1001',
      studentId,
      90.0,
      'Demo Online Payment',
      'paid',
      'Completed',
      'Extra spicy chutney please'
    );
    const order1Id = res1.lastInsertRowid;

    const dosa = db.prepare('SELECT id, name, price FROM food_items WHERE name = ?').get('Masala Dosa');
    const chai = db.prepare('SELECT id, name, price FROM food_items WHERE name = ?').get('Special Masala Chai');

    if (dosa && chai) {
      insertItemStmt.run(order1Id, dosa.id, dosa.name, dosa.price, 1, dosa.price);
      insertItemStmt.run(order1Id, chai.id, chai.name, chai.price, 1, chai.price);
    }

    // Sample Order 2: Preparing
    const res2 = insertOrderStmt.run(
      'SB-20261013-1002',
      studentId,
      145.0,
      'Cash at Counter',
      'pending',
      'Preparing',
      'Pack for takeout'
    );
    const order2Id = res2.lastInsertRowid;

    const burger = db.prepare('SELECT id, name, price FROM food_items WHERE name = ?').get('Crispy Veg Cheese Burger');
    const fries = db.prepare('SELECT id, name, price FROM food_items WHERE name = ?').get('Peri Peri French Fries');

    if (burger && fries) {
      insertItemStmt.run(order2Id, burger.id, burger.name, burger.price, 1, burger.price);
      insertItemStmt.run(order2Id, fries.id, fries.name, fries.price, 1, fries.price);
    }

    console.log('Seeded 2 demonstration orders with timeline tracking.');
  }

  console.log('Database seeding completed successfully.');
}

if (require.main === module) {
  seedDatabase();
}

module.exports = {
  seedDatabase,
  SAMPLE_FOODS,
};
