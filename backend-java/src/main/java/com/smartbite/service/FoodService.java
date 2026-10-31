package com.smartbite.service;

import com.smartbite.dao.FoodItemDao;
import com.smartbite.model.FoodItem;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class FoodService {

    private final FoodItemDao foodItemDao;

    public FoodService(FoodItemDao foodItemDao) {
        this.foodItemDao = foodItemDao;
    }

    public List<FoodItem> getAll(String category, String search) {
        if (search != null && !search.isBlank()) {
            return foodItemDao.searchByName(search.trim());
        }
        if (category != null && !category.isBlank() && !category.equalsIgnoreCase("all")) {
            return foodItemDao.findByCategory(category);
        }
        return foodItemDao.findAll();
    }

    public Optional<FoodItem> getById(Long id) {
        return foodItemDao.findById(id);
    }

    public List<String> getCategories() {
        return foodItemDao.findCategories();
    }

    public Map<String, Object> create(Map<String, Object> body) {
        Map<String, Object> result = new HashMap<>();
        String name = (String) body.get("name");
        if (name == null || name.isBlank()) { result.put("error", "Name is required"); return result; }
        Object priceObj = body.get("price");
        if (priceObj == null) { result.put("error", "Price is required"); return result; }
        double price;
        try { price = Double.parseDouble(priceObj.toString()); }
        catch (Exception e) { result.put("error", "Invalid price"); return result; }
        if (price <= 0) { result.put("error", "Price must be positive"); return result; }

        FoodItem f = new FoodItem();
        f.setName(name.trim());
        f.setDescription((String) body.getOrDefault("description", ""));
        f.setPrice(price);
        f.setCategory((String) body.getOrDefault("category", "Snacks"));
        f.setImageUrl((String) body.getOrDefault("imageUrl", ""));
        f.setIsVeg(Boolean.TRUE.equals(body.getOrDefault("isVeg", true)));
        f.setIsAvailable(Boolean.TRUE.equals(body.getOrDefault("isAvailable", true)));
        Object stockObj = body.getOrDefault("stock", 50);
        f.setStock(Integer.parseInt(stockObj.toString()));

        Long id = foodItemDao.save(f);
        f.setId(id);
        result.put("item", f);
        return result;
    }

    public Map<String, Object> update(Long id, Map<String, Object> body) {
        Map<String, Object> result = new HashMap<>();
        Optional<FoodItem> opt = foodItemDao.findById(id);
        if (opt.isEmpty()) { result.put("error", "Food item not found"); return result; }

        FoodItem f = opt.get();
        if (body.containsKey("name")) f.setName(((String) body.get("name")).trim());
        if (body.containsKey("description")) f.setDescription((String) body.get("description"));
        if (body.containsKey("price")) f.setPrice(Double.parseDouble(body.get("price").toString()));
        if (body.containsKey("category")) f.setCategory((String) body.get("category"));
        if (body.containsKey("imageUrl")) f.setImageUrl((String) body.get("imageUrl"));
        if (body.containsKey("isVeg")) f.setIsVeg(Boolean.parseBoolean(body.get("isVeg").toString()));
        if (body.containsKey("isAvailable")) f.setIsAvailable(Boolean.parseBoolean(body.get("isAvailable").toString()));
        if (body.containsKey("stock")) f.setStock(Integer.parseInt(body.get("stock").toString()));

        foodItemDao.update(f);
        result.put("item", f);
        return result;
    }

    public boolean delete(Long id) {
        Optional<FoodItem> opt = foodItemDao.findById(id);
        if (opt.isEmpty()) return false;
        foodItemDao.delete(id);
        return true;
    }
}
