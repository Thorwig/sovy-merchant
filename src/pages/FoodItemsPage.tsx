import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { api, FoodItem } from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';
import FoodItemModal from '../components/food/FoodItemModal';
import defaultLogo from '../assets/logo.png';

const FoodItemsPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<FoodItem | undefined>();
  const queryClient = useQueryClient();

  const { data: foodItems, isLoading } = useQuery({
    queryKey: ['merchant-food-items'],
    queryFn: async () => {
      const response = await api.getMerchantProfile();
      return response.foodItems;
    },
  });

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await api.deleteFoodItem(id);
        await queryClient.invalidateQueries({ queryKey: ['merchant-food-items'] });
      } catch (error: any) {
        console.error('Failed to delete food item:', error);
        // Show error message to user
        window.alert(error.response?.data?.message || 'Failed to delete food item. Please try again.');
      }
    }
  };

  const handleEdit = (item: FoodItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedItem(undefined);
  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-muted-foreground">Loading food items...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Food Items</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Add Food Item
        </button>
      </div>

      {/* Food Items Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {foodItems?.map((item: FoodItem) => (
          <div
            key={item.id}
            className="relative overflow-hidden rounded-lg border bg-card"
          >
            <div className="aspect-[16/9] overflow-hidden bg-gray-100">
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.onerror = null; // Prevent infinite loop
                    target.src = defaultLogo;
                  }}
                />
              ) : (
                <img
                  src={defaultLogo}
                  alt="Default"
                  className="h-full w-full object-contain p-4"
                />
              )}
            </div>
            <div className="p-4">
              <h3 className="font-semibold">{item.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {item.description}
              </p>
              <div className="mt-4 flex items-center justify-between">
                <span className="font-medium text-primary">
                  {formatCurrency(item.price)}
                </span>
                
                <span className="text-sm text-muted-foreground">
                  Qty: {item.quantity}
                </span>
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                Expires: {formatDate(item.expiryDate)}
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => handleEdit(item)}
                  className="flex-1 rounded-md bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground hover:bg-secondary/90"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="flex-1 rounded-md bg-destructive px-3 py-1 text-sm font-medium text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <FoodItemModal
          foodItem={selectedItem}
          onClose={handleCloseModal}
          onSuccess={handleCloseModal}
        />
      )}
    </div>
  );
};

export default FoodItemsPage;