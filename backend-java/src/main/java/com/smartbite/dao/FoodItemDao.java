package com.smartbite.dao;

import com.smartbite.model.FoodItem;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.util.List;
import java.util.Optional;

@Repository
public class FoodItemDao {

    private final JdbcTemplate jdbcTemplate;

    public FoodItemDao(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<FoodItem> foodMapper = (ResultSet rs, int row) -> {
        FoodItem f = new FoodItem();
        f.setId(rs.getLong("id"));
        f.setName(rs.getString("name"));
        f.setDescription(rs.getString("description"));
        f.setPrice(rs.getDouble("price"));
        f.setCategory(rs.getString("category"));
        f.setImageUrl(rs.getString("image_url"));
        f.setIsVeg(rs.getInt("is_veg") == 1);
        f.setIsAvailable(rs.getInt("is_available") == 1);
        f.setStock(rs.getInt("stock"));
        f.setCreatedAt(rs.getString("created_at"));
        return f;
    };

    public List<FoodItem> findAll() {
        return jdbcTemplate.query("SELECT * FROM food_items ORDER BY category, name", foodMapper);
    }

    public List<FoodItem> findByCategory(String category) {
        return jdbcTemplate.query(
            "SELECT * FROM food_items WHERE category = ? ORDER BY name", foodMapper, category);
    }

    public List<FoodItem> searchByName(String query) {
        return jdbcTemplate.query(
            "SELECT * FROM food_items WHERE name LIKE ? ORDER BY name", foodMapper, "%" + query + "%");
    }

    public Optional<FoodItem> findById(Long id) {
        List<FoodItem> list = jdbcTemplate.query(
            "SELECT * FROM food_items WHERE id = ?", foodMapper, id);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    public Long save(FoodItem item) {
        jdbcTemplate.update(
            "INSERT INTO food_items (name, description, price, category, image_url, is_veg, is_available, stock) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            item.getName(), item.getDescription(), item.getPrice(), item.getCategory(),
            item.getImageUrl(), item.getIsVeg() ? 1 : 0, item.getIsAvailable() ? 1 : 0, item.getStock()
        );
        return jdbcTemplate.queryForObject("SELECT last_insert_rowid()", Long.class);
    }

    public void update(FoodItem item) {
        jdbcTemplate.update(
            "UPDATE food_items SET name=?, description=?, price=?, category=?, image_url=?, is_veg=?, is_available=?, stock=? WHERE id=?",
            item.getName(), item.getDescription(), item.getPrice(), item.getCategory(),
            item.getImageUrl(), item.getIsVeg() ? 1 : 0, item.getIsAvailable() ? 1 : 0, item.getStock(), item.getId()
        );
    }

    public void delete(Long id) {
        jdbcTemplate.update("DELETE FROM food_items WHERE id = ?", id);
    }

    public boolean decrementStock(Long id, int qty) {
        int rows = jdbcTemplate.update(
            "UPDATE food_items SET stock = stock - ? WHERE id = ? AND stock >= ?", qty, id, qty);
        return rows > 0;
    }

    public void incrementStock(Long id, int qty) {
        jdbcTemplate.update(
            "UPDATE food_items SET stock = stock + ? WHERE id = ?", qty, id);
    }

    public List<String> findCategories() {
        return jdbcTemplate.queryForList(
            "SELECT DISTINCT category FROM food_items ORDER BY category", String.class);
    }
}
