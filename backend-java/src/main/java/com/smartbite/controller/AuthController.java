package com.smartbite.controller;

import com.smartbite.model.User;
import com.smartbite.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@RequestBody Map<String, Object> body) {
        String name = (String) body.get("name");
        String email = (String) body.get("email");
        String studentId = (String) body.get("studentId");
        String password = (String) body.get("password");

        Map<String, Object> result = authService.register(name, email, studentId, password);
        if (result.containsKey("error")) {
            return ResponseEntity.badRequest().body(result);
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, Object> body) {
        String email = (String) body.get("email");
        String password = (String) body.get("password");

        Map<String, Object> result = authService.login(email, password);
        if (result.containsKey("error")) {
            return ResponseEntity.status(401).body(result);
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> me(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }
        return ResponseEntity.ok(authService.safeUser(user));
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, Object>> logout() {
        // Stateless - client discards token
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }
}
