package com.smartbite.service;

import com.smartbite.dao.UserDao;
import com.smartbite.model.User;
import com.smartbite.util.JwtUtil;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
public class AuthService {

    private final UserDao userDao;
    private final BCryptPasswordEncoder encoder;
    private final JwtUtil jwtUtil;

    public AuthService(UserDao userDao, BCryptPasswordEncoder encoder, JwtUtil jwtUtil) {
        this.userDao = userDao;
        this.encoder = encoder;
        this.jwtUtil = jwtUtil;
    }

    public Map<String, Object> register(String name, String email, String studentId, String password) {
        Map<String, Object> result = new HashMap<>();

        if (name == null || name.isBlank()) { result.put("error", "Name is required"); return result; }
        if (email == null || !email.contains("@")) { result.put("error", "Valid email is required"); return result; }
        if (password == null || password.length() < 6) { result.put("error", "Password must be at least 6 characters"); return result; }

        if (userDao.existsByEmail(email)) {
            result.put("error", "Email already registered");
            return result;
        }
        if (studentId != null && !studentId.isBlank() && userDao.existsByStudentId(studentId)) {
            result.put("error", "Student ID already registered");
            return result;
        }

        User user = new User();
        user.setName(name.trim());
        user.setEmail(email.trim().toLowerCase());
        user.setStudentId(studentId);
        user.setPasswordHash(encoder.encode(password));
        user.setRole("student");

        Long id = userDao.save(user);
        user.setId(id);

        String token = jwtUtil.generateToken(id, user.getEmail(), "student");
        result.put("token", token);
        result.put("user", safeUser(user));
        return result;
    }

    public Map<String, Object> login(String email, String password) {
        Map<String, Object> result = new HashMap<>();

        if (email == null || password == null) {
            result.put("error", "Email and password required");
            return result;
        }

        Optional<User> userOpt = userDao.findByEmail(email.trim().toLowerCase());
        if (userOpt.isEmpty()) {
            result.put("error", "Invalid email or password");
            return result;
        }

        User user = userOpt.get();
        if (!encoder.matches(password, user.getPasswordHash())) {
            result.put("error", "Invalid email or password");
            return result;
        }

        String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRole());
        result.put("token", token);
        result.put("user", safeUser(user));
        return result;
    }

    public Map<String, Object> safeUser(User user) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", user.getId());
        m.put("name", user.getName());
        m.put("email", user.getEmail());
        m.put("studentId", user.getStudentId());
        m.put("role", user.getRole());
        return m;
    }
}
