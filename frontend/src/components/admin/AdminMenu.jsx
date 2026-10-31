import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertTriangle,
  RefreshCw,
  Image as ImageIcon,
  CheckCircle2,
  Utensils,
  Filter,
} from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';
import Modal from '../common/Modal';
import { foodAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const CATEGORIES = ['Breakfast', 'Meals', 'Snacks', 'Fast Food', 'Drinks'];

const SAMPLE_IMAGE_PRESETS = [
  { label: 'Dosa / Crepe', url: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&auto=format&fit=crop&q=80' },
  { label: 'Biryani Rice', url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80' },
  { label: 'Samosa / Snacks', url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80' },
  { label: 'Burger', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80' },
  { label: 'Chai / Coffee', url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80' },
];

export default function AdminMenu() {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFood, setEditingFood] = useState(null);
  const [deleteConfirmFood, setDeleteConfirmFood] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    category: 'Breakfast',
    price: '',
    stock_quantity: 20,
    is_veg: true,
    is_available: true,
    description: '',
    image_url: '',
  });

  const { showSuccess, showError } = useToast();

  const fetchFoods = async () => {
    setLoading(true);
    try {
      const res = await foodAPI.getAll({
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        search: search.trim() || undefined,
      });
      setFoods(res.foods || []);
    } catch (err) {
      showError('Failed to load menu items.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFoods();
  }, [selectedCategory]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchFoods();
  };

  const openAddModal = () => {
    setEditingFood(null);
    setFormData({
      name: '',
      category: 'Breakfast',
      price: '',
      stock_quantity: 25,
      is_veg: true,
      is_available: true,
      description: '',
      image_url: SAMPLE_IMAGE_PRESETS[0].url,
    });
    setModalOpen(true);
  };

  const openEditModal = (food) => {
    setEditingFood(food);
    setFormData({
      name: food.name,
      category: food.category,
      price: food.price.toString(),
      stock_quantity: food.stock_quantity,
      is_veg: Boolean(food.is_veg),
      is_available: Boolean(food.is_available),
      description: food.description || '',
      image_url: food.image_url || '',
    });
    setModalOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);

    try {
      const payload = {
        name: formData.name.trim(),
        category: formData.category,
        price: parseFloat(formData.price),
        stock_quantity: parseInt(formData.stock_quantity, 10),
        is_veg: Boolean(formData.is_veg),
        is_available: formData.is_available ? 1 : 0,
        description: formData.description.trim(),
        image_url: formData.image_url.trim(),
      };

      if (editingFood) {
        await foodAPI.update(editingFood.id, payload);
        showSuccess(`Updated '${formData.name}' successfully.`);
      } else {
        await foodAPI.create(payload);
        showSuccess(`Added '${formData.name}' to canteen menu.`);
      }

      setModalOpen(false);
      fetchFoods();
    } catch (err) {
      showError(err.message || 'Failed to save menu item.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteExecute = async () => {
    if (!deleteConfirmFood) return;
    try {
      const res = await foodAPI.delete(deleteConfirmFood.id);
      showSuccess(res.message || 'Food item removed.');
      setDeleteConfirmFood(null);
      fetchFoods();
    } catch (err) {
      showError(err.message || 'Failed to delete food item.');
    }
  };

  return (
    <div className="admin-menu-wrap">
      {/* Header & Controls */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Cafeteria Menu Management</h1>
          <p className="admin-page-subtitle">
            Add new food items, adjust prices, edit descriptions, and manage kitchen inventory stock.
          </p>
        </div>
        <button onClick={openAddModal} className="btn btn-primary">
          <Plus size={18} />
          <span>Add New Dish</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="admin-toolbar">
        <form onSubmit={handleSearchSubmit} className="admin-search-wrap">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search food by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input search"
          />
          <button type="submit" className="btn btn-secondary btn-sm">
            Search
          </button>
        </form>

        <div className="admin-category-filter">
          <span className="filter-label">Category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="form-select"
          >
            <option value="All">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <button onClick={fetchFoods} className="btn-icon-refresh" title="Refresh">
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Items Table */}
      {loading ? (
        <LoadingSpinner message="Loading food items..." />
      ) : foods.length === 0 ? (
        <EmptyState
          icon={Utensils}
          title="No dishes found"
          description="No food items match the search or category filters."
          actionText="Add New Dish"
          onAction={openAddModal}
        />
      ) : (
        <div className="admin-table-card">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Dish</th>
                <th>Category</th>
                <th>Diet</th>
                <th>Price (INR)</th>
                <th>Stock Left</th>
                <th>Availability</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {foods.map((food) => {
                const isSoldOut = !food.is_available || food.stock_quantity <= 0;
                const isLowStock = !isSoldOut && food.stock_quantity <= 5;

                return (
                  <tr key={food.id} className={isSoldOut ? 'row-sold-out' : ''}>
                    <td>
                      <div className="dish-title-cell">
                        <img
                          src={food.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80'}
                          alt={food.name}
                          className="dish-thumb"
                        />
                        <div>
                          <strong className="dish-name">{food.name}</strong>
                          <p className="dish-desc-preview">{food.description}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge-category">{food.category}</span>
                    </td>
                    <td>
                      <span className={`badge-diet ${food.is_veg ? 'veg' : 'nonveg'}`}>
                        {food.is_veg ? 'Veg' : 'Non-Veg'}
                      </span>
                    </td>
                    <td className="font-semibold text-orange">₹{food.price.toFixed(2)}</td>
                    <td>
                      <div className="stock-cell">
                        <span className={`stock-number ${isLowStock ? 'text-amber font-bold' : isSoldOut ? 'text-red font-bold' : ''}`}>
                          {food.stock_quantity}
                        </span>
                        {isLowStock && <span className="stock-alert-tag">Low</span>}
                        {isSoldOut && <span className="stock-alert-tag red">Out</span>}
                      </div>
                    </td>
                    <td>
                      <span className={`status-pill sm ${food.is_available && food.stock_quantity > 0 ? 'status-completed' : 'status-cancelled'}`}>
                        {food.is_available && food.stock_quantity > 0 ? 'Available' : 'Unavailable'}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="table-actions">
                        <button
                          onClick={() => openEditModal(food)}
                          className="btn-icon-action edit"
                          title="Edit Dish"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmFood(food)}
                          className="btn-icon-action delete"
                          title="Delete / Archive Dish"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Food Modal */}
      {modalOpen && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editingFood ? `Edit Dish: ${editingFood.name}` : 'Add New Food Item'}
          maxWidth="560px"
        >
          <form onSubmit={handleFormSubmit} className="admin-food-form">
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="food-name">Dish Name *</label>
                <input
                  id="food-name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  placeholder="e.g. Paneer Butter Masala"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="food-category">Category *</label>
                <select
                  id="food-category"
                  name="category"
                  value={formData.category}
                  onChange={handleFormChange}
                  className="form-select"
                  required
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="food-price">Price in INR (₹) *</label>
                <input
                  id="food-price"
                  type="number"
                  step="0.5"
                  min="1"
                  name="price"
                  value={formData.price}
                  onChange={handleFormChange}
                  placeholder="e.g. 80"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="food-stock">Stock Quantity *</label>
                <input
                  id="food-stock"
                  type="number"
                  min="0"
                  name="stock_quantity"
                  value={formData.stock_quantity}
                  onChange={handleFormChange}
                  placeholder="e.g. 25"
                  className="form-input"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="food-desc">Description</label>
              <textarea
                id="food-desc"
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                placeholder="Brief description of flavors, ingredients and side servings..."
                rows={2}
                className="form-input textarea"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="food-img">Image URL</label>
              <input
                id="food-img"
                type="url"
                name="image_url"
                value={formData.image_url}
                onChange={handleFormChange}
                placeholder="https://images.unsplash.com/..."
                className="form-input"
              />
              <div className="image-preset-picker">
                <span className="preset-label">Quick Image Presets:</span>
                <div className="preset-buttons">
                  {SAMPLE_IMAGE_PRESETS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, image_url: p.url }))}
                      className="btn-preset-chip"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="form-toggles-row">
              <label className="checkbox-toggle-card">
                <input
                  type="checkbox"
                  name="is_veg"
                  checked={formData.is_veg}
                  onChange={handleFormChange}
                />
                <div>
                  <span className="toggle-card-title">Pure Vegetarian</span>
                  <span className="toggle-card-sub">Mark with green veg badge</span>
                </div>
              </label>

              <label className="checkbox-toggle-card">
                <input
                  type="checkbox"
                  name="is_available"
                  checked={formData.is_available}
                  onChange={handleFormChange}
                />
                <div>
                  <span className="toggle-card-title">Dish Available for Ordering</span>
                  <span className="toggle-card-sub">Visible to students in menu</span>
                </div>
              </label>
            </div>

            <div className="modal-actions-row">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={formSubmitting}
                className="btn btn-primary"
              >
                {formSubmitting
                  ? 'Saving Dish...'
                  : editingFood
                  ? 'Update Menu Item'
                  : 'Add to Menu'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete / Archive Confirmation Modal */}
      {deleteConfirmFood && (
        <Modal
          isOpen={Boolean(deleteConfirmFood)}
          onClose={() => setDeleteConfirmFood(null)}
          title="Delete Food Item"
          maxWidth="440px"
        >
          <div className="delete-confirm-box">
            <div className="alert-danger-icon">
              <AlertTriangle size={36} className="text-red" />
            </div>
            <h4>Remove "{deleteConfirmFood.name}"?</h4>
            <p>
              If this food item was previously ordered by students, it will be safely archived and marked
              unavailable to preserve student order history records.
            </p>
            <div className="modal-actions-row">
              <button
                type="button"
                onClick={() => setDeleteConfirmFood(null)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteExecute}
                className="btn btn-danger"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
