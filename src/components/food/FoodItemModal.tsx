import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

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
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-background/80 p-4 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg overflow-hidden rounded-lg border bg-card shadow-lg"
        >
          <div className="flex items-center justify-between border-b p-4">
            <h2 className="text-lg font-semibold">
              {foodItem ? 'Edit Food Item' : 'Add New Food Item'}
            </h2>
            <button
              onClick={onClose}
              className="rounded-full p-1 hover:bg-secondary"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="max-h-[calc(100vh-10rem)] space-y-4 overflow-y-auto p-4">
            {/* Image Upload */}
            <div className="group relative aspect-[16/9] overflow-hidden rounded-lg border-2 border-dashed bg-secondary/20">
              {(previewUrl || foodItem?.imageUrl) ? (
                <img
                  src={previewUrl || foodItem?.imageUrl}
                  alt="Preview"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.onerror = null;
                    target.src = defaultLogo;
                  }}
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  <p className="mt-2 text-sm font-medium">Click or drag image to upload</p>
                  <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="absolute inset-0 cursor-pointer opacity-0"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-black">
                  <Upload className="h-4 w-4" />
                  Change Image
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                required
                className="w-full rounded-md border bg-background px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="e.g., Chicken Sandwich"
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
                className="w-full rounded-md border bg-background px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Brief description of the food item..."
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Original Price (Dhs)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.originalPrice}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, originalPrice: parseFloat(e.target.value) }))
                    }
                    required
                    className="w-full rounded-md border bg-background pl-8 pr-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="0.00"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    د.إ
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Discounted Price (Dhs)
                  {form.originalPrice > 0 && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({Math.round((1 - form.price / form.originalPrice) * 100)}% off)
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.price}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, price: parseFloat(e.target.value) }))
                    }
                    required
                    className="w-full rounded-md border bg-background pl-8 pr-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="0.00"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    د.إ
                  </span>
                </div>
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
                  className="w-full rounded-md border bg-background px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Available quantity"
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
                  className="w-full rounded-md border bg-background px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 border-t pt-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md px-4 py-2 text-sm font-medium hover:bg-secondary"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : foodItem ? 'Save Changes' : 'Create Item'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default FoodItemModal;