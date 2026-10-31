package com.smartbite.util;

import com.smartbite.dao.UserDao;
import com.smartbite.model.User;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;

import java.util.List;

@Component
public class DatabaseInitializer implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;
    private final UserDao userDao;
    private final BCryptPasswordEncoder encoder;

    public DatabaseInitializer(JdbcTemplate jdbcTemplate, UserDao userDao, BCryptPasswordEncoder encoder) {
        this.jdbcTemplate = jdbcTemplate;
        this.userDao = userDao;
        this.encoder = encoder;
    }

    @Override
    public void run(ApplicationArguments args) {
        createTables();
        seedData();
    }

    private void createTables() {
        jdbcTemplate.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                student_id TEXT,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'student',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
            """);

        jdbcTemplate.execute("""
            CREATE TABLE IF NOT EXISTS food_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                price REAL NOT NULL,
                category TEXT NOT NULL,
                image_url TEXT,
                is_veg INTEGER DEFAULT 1,
                is_available INTEGER DEFAULT 1,
                stock INTEGER DEFAULT 50,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
            """);

        jdbcTemplate.execute("""
            CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_number TEXT UNIQUE NOT NULL,
                user_id INTEGER NOT NULL,
                total_amount REAL NOT NULL,
                status TEXT NOT NULL DEFAULT 'placed',
                payment_method TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
            """);

        jdbcTemplate.execute("""
            CREATE TABLE IF NOT EXISTS order_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id INTEGER NOT NULL,
                food_item_id INTEGER NOT NULL,
                food_name TEXT NOT NULL,
                price REAL NOT NULL,
                quantity INTEGER NOT NULL,
                subtotal REAL NOT NULL,
                FOREIGN KEY (order_id) REFERENCES orders(id)
            )
            """);
    }

    private void seedData() {
        // Seed admin if no admin exists
        List<User> admins = userDao.findByRole("admin");
        if (admins.isEmpty()) {
            String hash = encoder.encode("admin123");
            jdbcTemplate.update(
                "INSERT INTO users (name, email, student_id, password_hash, role) VALUES (?, ?, ?, ?, ?)",
                "Admin", "admin@smartbite.com", null, hash, "admin"
            );
            System.out.println("[SmartBite] Admin seeded: admin@smartbite.com / admin123");
        }

        // Seed student if no students
        List<User> students = userDao.findByRole("student");
        if (students.isEmpty()) {
            String hash = encoder.encode("student123");
            jdbcTemplate.update(
                "INSERT INTO users (name, email, student_id, password_hash, role) VALUES (?, ?, ?, ?, ?)",
                "Demo Student", "student@campus.edu", "CS2024001", hash, "student"
            );
            System.out.println("[SmartBite] Demo student seeded: student@campus.edu / student123");
        }

        // Seed food items if table is empty
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM food_items", Integer.class);
        if (count == null || count == 0) {
            Object[][] items = {
                {"Masala Dosa", "Crispy dosa with spiced potato filling, served with sambar and chutney", 45.0, "Breakfast", "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=400", 1},
                {"Idli Sambar", "Soft steamed idlis with hot sambar and coconut chutney", 35.0, "Breakfast", "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400", 1},
                {"Poha", "Flattened rice with onions, peas and spices", 30.0, "Breakfast", "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400", 1},
                {"Upma", "Semolina cooked with vegetables and spices", 30.0, "Breakfast", "https://images.unsplash.com/photo-1604152135912-04a022e23696?w=400", 1},
                {"Veg Rice Thali", "Rice with dal, sabzi, roti, pickle and papad", 80.0, "Meals", "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400", 1},
                {"Chicken Biryani", "Fragrant basmati rice with tender chicken and spices", 120.0, "Meals", "https://images.unsplash.com/photo-1563379091339-03246963d70a?w=400", 0},
                {"Paneer Butter Masala + Roti", "Creamy paneer curry with 2 butter rotis", 95.0, "Meals", "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400", 1},
                {"Egg Fried Rice", "Wok-tossed rice with eggs and vegetables", 70.0, "Meals", "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400", 0},
                {"Samosa (2 pcs)", "Crispy pastry stuffed with spiced potatoes and peas", 25.0, "Snacks", "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400", 1},
                {"Vada Pav", "Mumbai street-style potato dumpling in a bun", 20.0, "Snacks", "https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400", 1},
                {"French Fries", "Crispy golden fries with ketchup", 60.0, "Fast Food", "https://images.unsplash.com/photo-1576107232684-1279f390859f?w=400", 1},
                {"Veg Burger", "Aloo tikki burger with lettuce, tomato and special sauce", 75.0, "Fast Food", "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400", 1},
                {"Chicken Roll", "Spicy chicken wrapped in paratha with onions and chutney", 90.0, "Fast Food", "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=400", 0},
                {"Masala Chai", "Spiced Indian tea with ginger and cardamom", 15.0, "Drinks", "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400", 1},
                {"Cold Coffee", "Chilled blended coffee with milk and ice cream", 55.0, "Drinks", "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400", 1},
                {"Fresh Lime Soda", "Refreshing lime with soda water and mint", 35.0, "Drinks", "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400", 1},
            };

            for (Object[] item : items) {
                jdbcTemplate.update(
                    "INSERT INTO food_items (name, description, price, category, image_url, is_veg, is_available, stock) VALUES (?, ?, ?, ?, ?, ?, 1, 50)",
                    item[0], item[1], item[2], item[3], item[4], item[5]
                );
            }
            System.out.println("[SmartBite] Seeded " + items.length + " food items");
        }
    }
}
