package com.smartbite.dao;

import com.smartbite.model.User;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.util.List;
import java.util.Optional;

@Repository
public class UserDao {

    private final JdbcTemplate jdbcTemplate;

    public UserDao(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<User> userMapper = (ResultSet rs, int row) -> {
        User u = new User();
        u.setId(rs.getLong("id"));
        u.setName(rs.getString("name"));
        u.setEmail(rs.getString("email"));
        u.setStudentId(rs.getString("student_id"));
        u.setPasswordHash(rs.getString("password_hash"));
        u.setRole(rs.getString("role"));
        u.setCreatedAt(rs.getString("created_at"));
        return u;
    };

    public Optional<User> findByEmail(String email) {
        List<User> list = jdbcTemplate.query(
            "SELECT * FROM users WHERE email = ?", userMapper, email);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    public Optional<User> findById(Long id) {
        List<User> list = jdbcTemplate.query(
            "SELECT * FROM users WHERE id = ?", userMapper, id);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    public List<User> findByRole(String role) {
        return jdbcTemplate.query(
            "SELECT * FROM users WHERE role = ?", userMapper, role);
    }

    public boolean existsByEmail(String email) {
        Integer count = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM users WHERE email = ?", Integer.class, email);
        return count != null && count > 0;
    }

    public boolean existsByStudentId(String studentId) {
        Integer count = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM users WHERE student_id = ?", Integer.class, studentId);
        return count != null && count > 0;
    }

    public Long save(User user) {
        jdbcTemplate.update(
            "INSERT INTO users (name, email, student_id, password_hash, role) VALUES (?, ?, ?, ?, ?)",
            user.getName(), user.getEmail(), user.getStudentId(), user.getPasswordHash(), user.getRole()
        );
        return jdbcTemplate.queryForObject("SELECT last_insert_rowid()", Long.class);
    }
}
