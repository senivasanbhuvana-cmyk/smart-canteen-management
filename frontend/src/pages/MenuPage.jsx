import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, RefreshCw, X, UtensilsCrossed, AlertCircle } from 'lucide-react';
import FoodCard from '../components/common/FoodCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import { foodAPI } from '../services/api';

const CATEGORIES = ['All', 'Breakfast', 'Meals', 'Snacks', 'Fast Food', 'Drinks'];

export default function MenuPage({ selectedCategory, setSelectedCategory }) {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [vegFilter, setVegFilter] = useState('all'); // 'all', 'veg', 'nonveg'
  const [availableOnly, setAvailableOnly] = useState(false);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  const fetchFoods = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const isVegParam =
        vegFilter === 'veg' ? 1 : vegFilter === 'nonveg' ? 0 : undefined;

      const res = await foodAPI.getAll({
        category: selectedCategory,
        search: appliedSearch.trim() || undefined,
        is_veg: isVegParam,
        available_only: availableOnly,
      });

      // Parse API response safely: { foods: [...] } or [...] or { data: [...] }
      let foodList = [];
      if (Array.isArray(res)) {
        foodList = res;
      } else if (res && Array.isArray(res.foods)) {
        foodList = res.foods;
      } else if (res && Array.isArray(res.data)) {
        foodList = res.data;
      }

      setFoods(foodList);
      setError(null);
    } catch (err) {
      console.error('Failed to load foods:', err);
      setError(err.message || 'Unable to connect to canteen server. Please make sure backend is running.');
      setFoods([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, appliedSearch, vegFilter, availableOnly]);

  useEffect(() => {
    fetchFoods();
  }, [fetchFoods, reloadTrigger]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const trimmed = search.trim();
    if (trimmed === appliedSearch) {
      setReloadTrigger((prev) => prev + 1);
    } else {
      setAppliedSearch(trimmed);
    }
  };

  const handleClearSearch = () => {
    setSearch('');
    setAppliedSearch('');
  };

  const clearFilters = () => {
    setSelectedCategory('All');
    setSearch('');
    setAppliedSearch('');
    setVegFilter('all');
    setAvailableOnly(false);
    setError(null);
    setReloadTrigger((prev) => prev + 1);
  };

  const handleRetry = () => {
    setReloadTrigger((prev) => prev + 1);
  };

  return (
    <div className="menu-page-wrap">
      {/* Header & Search Banner */}
      <div className="menu-header-banner">
        <div className="menu-header-content">
          <h1 className="menu-page-title">Campus Food Menu</h1>
          <p className="menu-page-sub">
            Freshly prepared daily specials, quick snacks, hot brews and filling meals.
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="menu-search-form">
            <Search size={20} className="menu-search-icon" />
            <input
              type="text"
              placeholder="Search dishes (e.g. Dosa, Biryani, Coffee, Burger)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="menu-search-input"
            />
            {search && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="btn-search-clear"
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
            <button type="submit" className="btn btn-primary menu-search-submit">
              Search
            </button>
          </form>
        </div>
      </div>

      <div className="menu-main-container">
        {/* Filters Toolbar */}
        <div className="menu-filters-bar">
          {/* Category Tabs */}
          <div className="category-pills-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`category-pill ${selectedCategory === cat ? 'active' : ''}`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Secondary Filters: Veg / Non-Veg & Available */}
          <div className="secondary-filters-row">
            <div className="diet-toggles">
              <button
                onClick={() => setVegFilter('all')}
                className={`diet-toggle-btn ${vegFilter === 'all' ? 'active' : ''}`}
              >
                All Diets
              </button>
              <button
                onClick={() => setVegFilter('veg')}
                className={`diet-toggle-btn ${vegFilter === 'veg' ? 'active-veg' : ''}`}
              >
                <span className="dot-veg"></span> Pure Veg
              </button>
              <button
                onClick={() => setVegFilter('nonveg')}
                className={`diet-toggle-btn ${vegFilter === 'nonveg' ? 'active-nonveg' : ''}`}
              >
                <span className="dot-nonveg"></span> Non-Veg
              </button>
            </div>

            <label className="checkbox-toggle-label">
              <input
                type="checkbox"
                checked={availableOnly}
                onChange={(e) => setAvailableOnly(e.target.checked)}
              />
              <span>In-Stock Only</span>
            </label>
          </div>
        </div>

        {/* Results summary bar */}
        {!loading && !error && (
          <div className="results-summary-row">
            <p className="results-count">
              Showing <strong>{foods.length}</strong> {foods.length === 1 ? 'item' : 'items'} in{' '}
              <span className="text-orange">{selectedCategory}</span>
            </p>
            {(selectedCategory !== 'All' || appliedSearch || vegFilter !== 'all' || availableOnly) && (
              <button onClick={clearFilters} className="btn-clear-filters">
                Reset Filters
              </button>
            )}
          </div>
        )}

        {/* Food List Grid or Loading or Error or Empty State */}
        {loading ? (
          <LoadingSpinner message="Fetching campus menu..." />
        ) : error ? (
          <EmptyState
            icon={AlertCircle}
            title="Failed to load menu"
            description={error}
            actionText="Retry"
            onAction={handleRetry}
          />
        ) : foods.length === 0 ? (
          <EmptyState
            icon={UtensilsCrossed}
            title="No dishes found"
            description="We couldn't find any menu items matching your selected criteria. Try removing filters or searching for something else."
            actionText="Clear All Filters"
            onAction={clearFilters}
          />
        ) : (
          <div className="food-grid">
            {foods.map((food) => (
              <FoodCard key={food.id} food={food} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
