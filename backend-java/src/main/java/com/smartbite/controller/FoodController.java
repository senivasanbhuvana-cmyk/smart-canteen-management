package com.smartbite.controller;

import com.smartbite.model.FoodItem;
import com.smartbite.model.User;
import com.smartbite.service.FoodService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/foods")
public class FoodController {

    private final FoodService foodService;

    public FoodController(FoodService foodService) {
        this.foodService = foodService;
    }

    @GetMapping
    public ResponseEntity<List<FoodItem>> getAll(
        @RequestParam(required = false) String category,
        @RequestParam(required = false) String search
    ) {
        return ResponseEntity.ok(foodService.getAll(category, search));
    }

    @GetMapping("/categories")
    public ResponseEntity<List<String>> getCategories() {
        return ResponseEntity.ok(foodService.getCategories());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        Optional<FoodItem> opt = foodService.getById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(opt.get());
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> create(
        @RequestBody Map<String, Object> body,
        @AuthenticationPrincipal User user
    ) {
        if (user == null || !"admin".equals(user.getRole())) {
            return ResponseEntity.status(403).body(Map.of("error", "Admin access required"));
        }
        Map<String, Object> result = foodService.create(body);
        if (result.containsKey("error")) return ResponseEntity.badRequest().body(result);
        return ResponseEntity.ok(result);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> update(
        @PathVariable Long id,
        @RequestBody Map<String, Object> body,
        @AuthenticationPrincipal User user
    ) {
        if (user == null || !"admin".equals(user.getRole())) {
            return ResponseEntity.status(403).body(Map.of("error", "Admin access required"));
        }
        Map<String, Object> result = foodService.update(id, body);
        if (result.containsKey("error")) return ResponseEntity.badRequest().body(result);
        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> delete(
        @PathVariable Long id,
        @AuthenticationPrincipal User user
    ) {
        if (user == null || !"admin".equals(user.getRole())) {
            return ResponseEntity.status(403).body(Map.of("error", "Admin access required"));
        }
        boolean deleted = foodService.delete(id);
        if (!deleted) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(Map.of("message", "Food item deleted"));
    }
}
