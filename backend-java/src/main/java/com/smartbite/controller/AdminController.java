package com.smartbite.controller;

import com.smartbite.dao.FoodItemDao;
import com.smartbite.dao.OrderDao;
import com.smartbite.model.FoodItem;
import com.smartbite.model.Order;
import com.smartbite.service.OrderService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final OrderDao orderDao;
    private final FoodItemDao foodItemDao;
    private final OrderService orderService;

    public AdminController(OrderDao orderDao, FoodItemDao foodItemDao, OrderService orderService) {
        this.orderDao = orderDao;
        this.foodItemDao = foodItemDao;
        this.orderService = orderService;
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> stats() {
        Map<String, Object> s = new HashMap<>();
        s.put("totalOrders", orderDao.countAll());
        s.put("todayOrders", orderDao.countToday());
        s.put("todaySales", orderDao.todaySales());
        s.put("totalMenuItems", foodItemDao.findAll().size());

        List<FoodItem> allItems = foodItemDao.findAll();
        long lowStock = allItems.stream().filter(f -> f.getStock() != null && f.getStock() > 0 && f.getStock() < 5).count();
        long soldOut = allItems.stream().filter(f -> f.getStock() != null && f.getStock() == 0).count();
        s.put("lowStockItems", lowStock);
        s.put("soldOutItems", soldOut);
        s.put("recentOrders", orderDao.findRecent(5));
        return ResponseEntity.ok(s);
    }

    @GetMapping("/orders")
    public ResponseEntity<List<Order>> getAllOrders(
        @RequestParam(required = false) String status,
        @RequestParam(required = false) String search
    ) {
        List<Order> orders = orderDao.findAll();
        if (status != null && !status.isBlank()) {
            orders = orders.stream().filter(o -> status.equalsIgnoreCase(o.getStatus())).toList();
        }
        if (search != null && !search.isBlank()) {
            String q = search.toLowerCase();
            orders = orders.stream().filter(o ->
                (o.getOrderNumber() != null && o.getOrderNumber().toLowerCase().contains(q)) ||
                (o.getUserName() != null && o.getUserName().toLowerCase().contains(q)) ||
                (o.getUserEmail() != null && o.getUserEmail().toLowerCase().contains(q))
            ).toList();
        }
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/orders/{id}")
    public ResponseEntity<Map<String, Object>> getOrderDetail(@PathVariable Long id) {
        Map<String, Object> result = orderService.getOrderById(id, null, true);
        if (result.containsKey("error")) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(result);
    }

    @PutMapping("/orders/{id}/status")
    public ResponseEntity<Map<String, Object>> updateStatus(
        @PathVariable Long id,
        @RequestBody Map<String, Object> body
    ) {
        String newStatus = (String) body.get("status");
        if (newStatus == null) return ResponseEntity.badRequest().body(Map.of("error", "status required"));
        Map<String, Object> result = orderService.updateStatus(id, newStatus);
        if (result.containsKey("error")) return ResponseEntity.badRequest().body(result);
        return ResponseEntity.ok(result);
    }
}
