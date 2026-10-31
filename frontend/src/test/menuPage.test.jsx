import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MenuPage from '../pages/MenuPage';
import { foodAPI } from '../services/api';
import { CartProvider } from '../context/CartContext';
import { ToastProvider } from '../context/ToastContext';

// Mock foodAPI
vi.mock('../services/api', () => ({
  foodAPI: {
    getAll: vi.fn(),
  },
}));

const mockFoods = [
  {
    id: 1,
    name: 'Masala Dosa',
    category: 'Breakfast',
    price: 70,
    is_veg: 1,
    is_available: 1,
    stock_quantity: 30,
    description: 'Crispy fermented crepe',
    image_url: 'https://example.com/dosa.jpg',
  },
  {
    id: 2,
    name: 'Chicken Biryani',
    category: 'Meals',
    price: 160,
    is_veg: 0,
    is_available: 1,
    stock_quantity: 20,
    description: 'Aromatic basmati rice with chicken',
    image_url: 'https://example.com/biryani.jpg',
  },
];

function renderMenuPage(selectedCategory = 'All', setSelectedCategory = vi.fn()) {
  return render(
    <ToastProvider>
      <CartProvider>
        <MenuPage
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
        />
      </CartProvider>
    </ToastProvider>
  );
}

describe('MenuPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading spinner while fetching menu items', async () => {
    foodAPI.getAll.mockImplementation(() => new Promise(() => {})); // pending
    renderMenuPage();

    expect(screen.getByText(/Fetching campus menu.../i)).toBeInTheDocument();
  });

  it('displays menu items when API successfully returns foods', async () => {
    foodAPI.getAll.mockResolvedValueOnce({ foods: mockFoods, count: 2 });
    renderMenuPage();

    await waitFor(() => {
      expect(screen.getByText('Masala Dosa')).toBeInTheDocument();
      expect(screen.getByText('Chicken Biryani')).toBeInTheDocument();
    });

    expect(screen.getByText(/Showing/i)).toBeInTheDocument();
  });

  it('displays "No dishes found" when API returns 0 matching items', async () => {
    foodAPI.getAll.mockResolvedValueOnce({ foods: [], count: 0 });
    renderMenuPage();

    await waitFor(() => {
      expect(screen.getByText('No dishes found')).toBeInTheDocument();
    });

    expect(screen.getByText('Clear All Filters')).toBeInTheDocument();
  });

  it('displays error message and Retry button when API fails', async () => {
    foodAPI.getAll.mockRejectedValueOnce(new Error('Network connection timeout'));
    renderMenuPage();

    await waitFor(() => {
      expect(screen.getByText('Failed to load menu')).toBeInTheDocument();
      expect(screen.getByText('Network connection timeout')).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    // Should not show "No dishes found"
    expect(screen.queryByText('No dishes found')).not.toBeInTheDocument();

    // Clicking Retry re-attempts fetch
    foodAPI.getAll.mockResolvedValueOnce({ foods: mockFoods, count: 2 });
    fireEvent.click(screen.getByText('Retry'));

    await waitFor(() => {
      expect(screen.getByText('Masala Dosa')).toBeInTheDocument();
    });
  });

  it('resets all filters when "Clear All Filters" is clicked', async () => {
    const setSelectedCategory = vi.fn();
    foodAPI.getAll.mockResolvedValueOnce({ foods: [], count: 0 });

    renderMenuPage('Meals', setSelectedCategory);

    await waitFor(() => {
      expect(screen.getByText('No dishes found')).toBeInTheDocument();
    });

    foodAPI.getAll.mockResolvedValueOnce({ foods: mockFoods, count: 2 });
    fireEvent.click(screen.getByText('Clear All Filters'));

    expect(setSelectedCategory).toHaveBeenCalledWith('All');
    await waitFor(() => {
      expect(foodAPI.getAll).toHaveBeenCalled();
    });
  });

  it('filters by Pure Veg and Non-Veg diet toggles', async () => {
    foodAPI.getAll.mockResolvedValue({ foods: mockFoods, count: 2 });
    renderMenuPage();

    await waitFor(() => {
      expect(screen.getByText('Masala Dosa')).toBeInTheDocument();
    });

    // Click Pure Veg
    fireEvent.click(screen.getByRole('button', { name: /Pure Veg/i }));

    await waitFor(() => {
      expect(foodAPI.getAll).toHaveBeenCalledWith(
        expect.objectContaining({ is_veg: 1 })
      );
    });

    // Click Non-Veg
    fireEvent.click(screen.getByRole('button', { name: /Non-Veg/i }));

    await waitFor(() => {
      expect(foodAPI.getAll).toHaveBeenCalledWith(
        expect.objectContaining({ is_veg: 0 })
      );
    });
  });
});

