package com.smartbite.dao;

import com.smartbite.model.Order;
import com.smartbite.model.OrderItem;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.util.List;
import java.util.Optional;

@Repository
public class OrderDao {

    private final JdbcTemplate jdbcTemplate;

    public OrderDao(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<Order> orderMapper = (ResultSet rs, int row) -> {
        Order o = new Order();
        o.setId(rs.getLong("id"));
        o.setOrderNumber(rs.getString("order_number"));
        o.setUserId(rs.getLong("user_id"));
        o.setTotalAmount(rs.getDouble("total_amount"));
        o.setStatus(rs.getString("status"));
        o.setPaymentMethod(rs.getString("payment_method"));
        o.setCreatedAt(rs.getString("created_at"));
        // User info joined
        try { o.setUserName(rs.getString("user_name")); } catch (Exception ignored) {}
        try { o.setUserEmail(rs.getString("user_email")); } catch (Exception ignored) {}
        return o;
    };

    private final RowMapper<OrderItem> itemMapper = (ResultSet rs, int row) -> {
        OrderItem i = new OrderItem();
        i.setId(rs.getLong("id"));
        i.setOrderId(rs.getLong("order_id"));
        i.setFoodItemId(rs.getLong("food_item_id"));
        i.setFoodName(rs.getString("food_name"));
        i.setPrice(rs.getDouble("price"));
        i.setQuantity(rs.getInt("quantity"));
        i.setSubtotal(rs.getDouble("subtotal"));
        return i;
    };

    public Long save(Order order) {
        jdbcTemplate.update(
            "INSERT INTO orders (order_number, user_id, total_amount, status, payment_method) VALUES (?, ?, ?, ?, ?)",
            order.getOrderNumber(), order.getUserId(), order.getTotalAmount(),
            order.getStatus(), order.getPaymentMethod()
        );
        return jdbcTemplate.queryForObject("SELECT last_insert_rowid()", Long.class);
    }

    public void saveItem(OrderItem item) {
        jdbcTemplate.update(
            "INSERT INTO order_items (order_id, food_item_id, food_name, price, quantity, subtotal) VALUES (?, ?, ?, ?, ?, ?)",
            item.getOrderId(), item.getFoodItemId(), item.getFoodName(),
            item.getPrice(), item.getQuantity(), item.getSubtotal()
        );
    }

    public Optional<Order> findById(Long id) {
        List<Order> list = jdbcTemplate.query(
            "SELECT o.*, u.name as user_name, u.email as user_email FROM orders o JOIN users u ON o.user_id = u.id WHERE o.id = ?",
            orderMapper, id);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    public Optional<Order> findByOrderNumber(String orderNumber) {
        List<Order> list = jdbcTemplate.query(
            "SELECT o.*, u.name as user_name, u.email as user_email FROM orders o JOIN users u ON o.user_id = u.id WHERE o.order_number = ?",
            orderMapper, orderNumber);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    public List<Order> findByUserId(Long userId) {
        return jdbcTemplate.query(
            "SELECT o.*, u.name as user_name, u.email as user_email FROM orders o JOIN users u ON o.user_id = u.id WHERE o.user_id = ? ORDER BY o.created_at DESC",
            orderMapper, userId);
    }

    public List<Order> findAll() {
        return jdbcTemplate.query(
            "SELECT o.*, u.name as user_name, u.email as user_email FROM orders o JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC",
            orderMapper);
    }

    public List<OrderItem> findItemsByOrderId(Long orderId) {
        return jdbcTemplate.query(
            "SELECT * FROM order_items WHERE order_id = ?", itemMapper, orderId);
    }

    public void updateStatus(Long orderId, String status) {
        jdbcTemplate.update("UPDATE orders SET status = ? WHERE id = ?", status, orderId);
    }

    public int countAll() {
        Integer c = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM orders", Integer.class);
        return c != null ? c : 0;
    }

    public int countToday() {
        Integer c = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM orders WHERE date(created_at) = date('now')", Integer.class);
        return c != null ? c : 0;
    }

    public double todaySales() {
        Double d = jdbcTemplate.queryForObject(
            "SELECT COALESCE(SUM(total_amount),0) FROM orders WHERE date(created_at) = date('now') AND status = 'completed'",
            Double.class);
        return d != null ? d : 0.0;
    }

    public List<Order> findRecent(int limit) {
        return jdbcTemplate.query(
            "SELECT o.*, u.name as user_name, u.email as user_email FROM orders o JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC LIMIT ?",
            orderMapper, limit);
    }
}
