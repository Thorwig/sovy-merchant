import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { formatDate } from '../../utils/formatters';
import defaultLogo from '../../assets/logo.png';

interface FoodItemFormData {
  name: string;
  description: string;
  price: number;
  originalPrice: number;
  quantity: number;
  expiryDate: string;
  image?: File;
}

interface FoodItemModalProps {
  foodItem?: {
    id: string;
    name: string;
    description: string;
    price: number;
    originalPrice: number;
    quantity: number;
    expiryDate: string;
    imageUrl?: string;
  };
  onClose: () => void;
  onSuccess: () => void;
}

const FoodItemModal = ({ foodItem, onClose, onSuccess }: FoodItemModalProps) => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FoodItemFormData>({
    name: foodItem?.name || '',
    description: foodItem?.description || '',
    price: foodItem?.price || 0,
    originalPrice: foodItem?.originalPrice || 0,
    quantity: foodItem?.quantity || 0,
    expiryDate: foodItem?.expiryDate
      ? formatDate(foodItem.expiryDate)
      : new Date().toISOString().split('T')[0],
  });
  const [image, setImage] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('description', form.description);
      formData.append('price', form.price.toString());
      formData.append('originalPrice', form.originalPrice.toString());
      formData.append('quantity', form.quantity.toString());
      formData.append('expiryDate', new Date(form.expiryDate).toISOString());
      if (image) {
        formData.append('image', image);
      }

      if (foodItem) {
        await api.updateFoodItem(foodItem.id, formData);
      } else {
        await api.createFoodItem(formData);
      }

      await queryClient.invalidateQueries({ queryKey: ['merchant-food-items'] });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save food item');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-lg border bg-card p-6 shadow-lg">
        <h2 className="text-lg font-semibold">
          {foodItem ? 'Edit Food Item' : 'Add New Food Item'}
        </h2>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              required
              className="w-full rounded-md border bg-background px-3 py-2"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, description: e.target.value }))
              }
              rows={3}
              className="w-full rounded-md border bg-background px-3 py-2"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Original Price (Dhs)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.originalPrice}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, originalPrice: parseFloat(e.target.value) }))
                }
                required
                className="w-full rounded-md border bg-background px-3 py-2"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Discounted Price (Dhs)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, price: parseFloat(e.target.value) }))
                }
                required
                className="w-full rounded-md border bg-background px-3 py-2"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Quantity</label>
              <input
                type="number"
                min="0"
                value={form.quantity}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    quantity: parseInt(e.target.value, 10),
                  }))
                }
                required
                className="w-full rounded-md border bg-background px-3 py-2"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Expiry Date</label>
              <input
                type="date"
                value={form.expiryDate}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, expiryDate: e.target.value }))
                }
                min={new Date().toISOString().split('T')[0]}
                required
                className="w-full rounded-md border bg-background px-3 py-2"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files?.[0] || null)}
              className="w-full rounded-md border bg-background px-3 py-2"
            />
            {foodItem?.imageUrl && !image && (
              <div className="mt-2">
                <img
                  src={foodItem.imageUrl}
                  alt={foodItem.name}
                  className="h-20 w-20 rounded-md object-cover"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.onerror = null;
                    target.src = defaultLogo;
                  }}
                />
              </div>
            )}
          </div>

          {error && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-md bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground hover:bg-secondary/90"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FoodItemModal;