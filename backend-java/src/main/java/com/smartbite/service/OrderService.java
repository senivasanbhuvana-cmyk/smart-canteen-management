package com.smartbite.service;

import com.smartbite.dao.FoodItemDao;
import com.smartbite.dao.OrderDao;
import com.smartbite.model.FoodItem;
import com.smartbite.model.Order;
import com.smartbite.model.OrderItem;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class OrderService {

    private static final List<String> STATUS_FLOW =
        Arrays.asList("placed", "confirmed", "preparing", "ready", "completed", "cancelled");

    private final OrderDao orderDao;
    private final FoodItemDao foodItemDao;

    public OrderService(OrderDao orderDao, FoodItemDao foodItemDao) {
        this.orderDao = orderDao;
        this.foodItemDao = foodItemDao;
    }

    @Transactional
    public Map<String, Object> checkout(Long userId, List<Map<String, Object>> cartItems, String paymentMethod) {
        Map<String, Object> result = new HashMap<>();

        if (cartItems == null || cartItems.isEmpty()) {
            result.put("error", "Cart is empty");
            return result;
        }

        List<OrderItem> validatedItems = new ArrayList<>();
        double total = 0;

        for (Map<String, Object> cartItem : cartItems) {
            Long foodId = Long.parseLong(cartItem.get("foodId").toString());
            int qty = Integer.parseInt(cartItem.get("quantity").toString());

            if (qty <= 0) { result.put("error", "Invalid quantity"); return result; }

            Optional<FoodItem> foodOpt = foodItemDao.findById(foodId);
            if (foodOpt.isEmpty()) { result.put("error", "Food item not found: " + foodId); return result; }

            FoodItem food = foodOpt.get();
            if (!food.getIsAvailable()) { result.put("error", food.getName() + " is not available"); return result; }
            if (food.getStock() < qty) { result.put("error", "Insufficient stock for " + food.getName()); return result; }

            OrderItem item = new OrderItem();
            item.setFoodItemId(foodId);
            item.setFoodName(food.getName());
            item.setPrice(food.getPrice());  // server-side price
            item.setQuantity(qty);
            item.setSubtotal(food.getPrice() * qty);
            validatedItems.add(item);
            total += item.getSubtotal();
        }

        // Generate unique order number
        String orderNumber = "SB" + System.currentTimeMillis();

        Order order = new Order();
        order.setOrderNumber(orderNumber);
        order.setUserId(userId);
        order.setTotalAmount(Math.round(total * 100.0) / 100.0);
        order.setStatus("placed");
        order.setPaymentMethod(paymentMethod != null ? paymentMethod : "cash");

        Long orderId = orderDao.save(order);

        // Deduct stock and save items
        for (OrderItem item : validatedItems) {
            boolean ok = foodItemDao.decrementStock(item.getFoodItemId(), item.getQuantity());
            if (!ok) { result.put("error", "Stock error for item " + item.getFoodName()); return result; }
            item.setOrderId(orderId);
            orderDao.saveItem(item);
        }

        order.setId(orderId);
        order.setItems(validatedItems);
        result.put("order", buildOrderResponse(order, validatedItems));
        return result;
    }

    public List<Map<String, Object>> getMyOrders(Long userId) {
        List<Order> orders = orderDao.findByUserId(userId);
        List<Map<String, Object>> list = new ArrayList<>();
        for (Order o : orders) {
            List<OrderItem> items = orderDao.findItemsByOrderId(o.getId());
            list.add(buildOrderResponse(o, items));
        }
        return list;
    }

    public Map<String, Object> getOrderById(Long orderId, Long userId, boolean isAdmin) {
        Optional<Order> opt = orderDao.findById(orderId);
        if (opt.isEmpty()) return Map.of("error", "Order not found");

        Order order = opt.get();
        if (!isAdmin && !order.getUserId().equals(userId)) return Map.of("error", "Access denied");

        List<OrderItem> items = orderDao.findItemsByOrderId(orderId);
        return buildOrderResponse(order, items);
    }

    @Transactional
    public Map<String, Object> cancelOrder(Long orderId, Long userId) {
        Optional<Order> opt = orderDao.findById(orderId);
        if (opt.isEmpty()) return Map.of("error", "Order not found");

        Order order = opt.get();
        if (!order.getUserId().equals(userId)) return Map.of("error", "Access denied");

        String status = order.getStatus();
        if (status.equals("preparing") || status.equals("ready") || status.equals("completed") || status.equals("cancelled")) {
            return Map.of("error", "Cannot cancel order in status: " + status);
        }

        orderDao.updateStatus(orderId, "cancelled");

        // Restore stock
        List<OrderItem> items = orderDao.findItemsByOrderId(orderId);
        for (OrderItem item : items) {
            foodItemDao.incrementStock(item.getFoodItemId(), item.getQuantity());
        }

        return Map.of("message", "Order cancelled successfully");
    }

    public Map<String, Object> updateStatus(Long orderId, String newStatus) {
        Optional<Order> opt = orderDao.findById(orderId);
        if (opt.isEmpty()) return Map.of("error", "Order not found");

        Order order = opt.get();
        String currentStatus = order.getStatus();

        // Validate transition
        int currentIdx = STATUS_FLOW.indexOf(currentStatus);
        int newIdx = STATUS_FLOW.indexOf(newStatus);

        if (newIdx < 0) return Map.of("error", "Invalid status: " + newStatus);
        if (newStatus.equals("cancelled")) {
            if (currentIdx >= STATUS_FLOW.indexOf("preparing") && !currentStatus.equals("cancelled")) {
                return Map.of("error", "Cannot cancel order that is being prepared or later");
            }
            // Restore stock if cancelling
            if (!currentStatus.equals("cancelled")) {
                List<OrderItem> items = orderDao.findItemsByOrderId(orderId);
                for (OrderItem item : items) {
                    foodItemDao.incrementStock(item.getFoodItemId(), item.getQuantity());
                }
            }
        } else if (newIdx != currentIdx + 1) {
            return Map.of("error", "Invalid status transition from " + currentStatus + " to " + newStatus);
        }

        orderDao.updateStatus(orderId, newStatus);
        return Map.of("message", "Status updated to " + newStatus);
    }

    private Map<String, Object> buildOrderResponse(Order order, List<OrderItem> items) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", order.getId());
        m.put("orderNumber", order.getOrderNumber());
        m.put("userId", order.getUserId());
        m.put("userName", order.getUserName());
        m.put("userEmail", order.getUserEmail());
        m.put("totalAmount", order.getTotalAmount());
        m.put("status", order.getStatus());
        m.put("paymentMethod", order.getPaymentMethod());
        m.put("createdAt", order.getCreatedAt());

        List<Map<String, Object>> itemList = new ArrayList<>();
        for (OrderItem i : items) {
            Map<String, Object> im = new HashMap<>();
            im.put("id", i.getId());
            im.put("foodItemId", i.getFoodItemId());
            im.put("foodName", i.getFoodName());
            im.put("price", i.getPrice());
            im.put("quantity", i.getQuantity());
            im.put("subtotal", i.getSubtotal());
            itemList.add(im);
        }
        m.put("items", itemList);
        return m;
    }
}
