package com.smartbite.controller;

import com.smartbite.model.User;
import com.smartbite.service.OrderService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping("/checkout")
    public ResponseEntity<Map<String, Object>> checkout(
        @RequestBody Map<String, Object> body,
        @AuthenticationPrincipal User user
    ) {
        if (user == null) return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> items = (List<Map<String, Object>>) body.get("items");
        String paymentMethod = (String) body.getOrDefault("paymentMethod", "cash");

        Map<String, Object> result = orderService.checkout(user.getId(), items, paymentMethod);
        if (result.containsKey("error")) return ResponseEntity.badRequest().body(result);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/my-orders")
    public ResponseEntity<?> myOrders(@AuthenticationPrincipal User user) {
        if (user == null) return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        return ResponseEntity.ok(orderService.getMyOrders(user.getId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getOrder(
        @PathVariable Long id,
        @AuthenticationPrincipal User user
    ) {
        if (user == null) return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        boolean isAdmin = "admin".equals(user.getRole());
        Map<String, Object> result = orderService.getOrderById(id, user.getId(), isAdmin);
        if (result.containsKey("error")) return ResponseEntity.status(404).body(result);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<Map<String, Object>> cancel(
        @PathVariable Long id,
        @AuthenticationPrincipal User user
    ) {
        if (user == null) return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        Map<String, Object> result = orderService.cancelOrder(id, user.getId());
        if (result.containsKey("error")) return ResponseEntity.badRequest().body(result);
        return ResponseEntity.ok(result);
    }
}
