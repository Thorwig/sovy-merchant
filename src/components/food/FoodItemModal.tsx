import { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Image as ImageIcon, MinusCircle, PlusCircle } from 'lucide-react';
import { api } from '../../services/api';
import { formatDate, formatCurrency } from '../../utils/formatters';
import defaultLogo from '../../assets/logo.png';

interface FoodItemFormData {
  name: string;
  description: string;
  originalPrice: number;
  discountPercentage: number;
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
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FoodItemFormData>({
    name: foodItem?.name || '',
    description: foodItem?.description || '',
    originalPrice: foodItem?.originalPrice || 0,
    discountPercentage: foodItem
      ? Math.round(((foodItem.originalPrice - foodItem.price) / foodItem.originalPrice) * 100 / 5) * 5
      : 50, // Default 50% discount
    quantity: foodItem?.quantity || 0,
    expiryDate: foodItem?.expiryDate
      ? formatDate(foodItem.expiryDate)
      : new Date().toISOString().split('T')[0],
  });
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Round to nearest .50
  const roundToHalf = (num: number) => Math.round(num * 2) / 2;

  // Calculate the discounted price based on original price and discount percentage
  const calculatedPrice = useMemo(() => {
    const discount = form.discountPercentage / 100;
    const discounted = form.originalPrice * (1 - discount);
    return roundToHalf(discounted);
  }, [form.originalPrice, form.discountPercentage]);

  const handleDiscountChange = (increment: boolean) => {
    setForm((prev) => ({
      ...prev,
      discountPercentage: Math.min(
        Math.max(prev.discountPercentage + (increment ? 5 : -5), 50), // Minimum 50%
        70 // Maximum 70%
      ),
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      setError(t('foodItems.modal.error.invalidImageType'));
      return;
    }

    // Check file size (5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      setError(t('foodItems.modal.error.imageTooLarge'));
      return;
    }

    // Clear any previous errors
    setError('');
    
    // Update form state
    setImage(file);
    setForm(prev => ({ ...prev, image: file }));

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('description', form.description);
      formData.append('price', calculatedPrice.toString());
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
      setError(err instanceof Error ? err.message : t('foodItems.modal.error.general'));
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
              {foodItem ? t('foodItems.modal.editTitle') : t('foodItems.modal.addTitle')}
            </h2>
            <button
              onClick={onClose}
              className="rounded-full p-1 hover:bg-secondary"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="max-h-[calc(100vh-10rem)] space-y-4 overflow-y-auto p-4"
          >
            {/* Image Upload */}
            <div className="group relative aspect-[16/9] overflow-hidden rounded-lg border-2 border-dashed bg-secondary/20 hover:border-primary/50 transition-colors">
              {(previewUrl || foodItem?.imageUrl) ? (
                <div className="relative h-full">
                  <img
                    src={previewUrl || foodItem?.imageUrl}
                    alt={t('foodItems.modal.imagePreview')}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.onerror = null;
                      target.src = defaultLogo;
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                    <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-black">
                      <Upload className="h-4 w-4" />
                      {t('foodItems.modal.changeImage')}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-center p-4">
                  <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm font-medium">
                    {t('foodItems.modal.imageDropzone')}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG {t('foodItems.modal.upTo')} 5MB
                  </p>
                </div>
              )}
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={handleImageChange}
                className="absolute inset-0 cursor-pointer opacity-0"
                aria-label={t('foodItems.modal.uploadImage')}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('foodItems.name')}</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
                required
                className="w-full rounded-md border bg-background px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder={t('foodItems.modal.namePlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('foodItems.description')}</label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, description: e.target.value }))
                }
                rows={3}
                className="w-full rounded-md border bg-background px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder={t('foodItems.modal.descriptionPlaceholder')}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('foodItems.modal.priceLabel')}</label>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    min="0"
                    value={form.originalPrice}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        originalPrice: parseFloat(e.target.value) || 0,
                      }))
                    }
                    required
                    className="w-full rounded-md border bg-background pl-8 pr-16 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder={t('foodItems.modal.pricePlaceholder')}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                    MAD
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t('foodItems.modal.discountLabel')}</label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={formatCurrency(calculatedPrice)}
                      readOnly
                      className="w-full rounded-md border bg-muted px-3 py-2 text-muted-foreground"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                      ({form.discountPercentage}% {t('foodItems.off')})
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-md border bg-background p-2">
                  <button
                    type="button"
                    onClick={() => handleDiscountChange(false)}
                    disabled={form.discountPercentage <= 50}
                    className="rounded-md p-1.5 text-foreground hover:bg-secondary disabled:text-muted-foreground disabled:hover:bg-transparent"
                    aria-label={t('foodItems.modal.decreaseDiscount')}
                  >
                    <MinusCircle className="h-5 w-5" />
                  </button>
                  <div className="flex flex-col items-center px-2">
                    <span className="text-lg font-semibold text-primary">
                      {form.discountPercentage}%
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {t('foodItems.modal.discount')}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDiscountChange(true)}
                    disabled={form.discountPercentage >= 70}
                    className="rounded-md p-1.5 text-foreground hover:bg-secondary disabled:text-muted-foreground disabled:hover:bg-transparent"
                    aria-label={t('foodItems.modal.increaseDiscount')}
                  >
                    <PlusCircle className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t('foodItems.modal.quantityLabel')}</label>
                <input
                  type="number"
                  min="0"
                  value={form.quantity}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      quantity: parseInt(e.target.value) || 0,
                    }))
                  }
                  required
                  className="w-full rounded-md border bg-background px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t('foodItems.modal.expiryDateLabel')}</label>
                <input
                  type="date"
                  value={form.expiryDate}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, expiryDate: e.target.value }))
                  }
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
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? t('foodItems.modal.saving') : foodItem ? t('common.update') : t('common.create')}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default FoodItemModal;