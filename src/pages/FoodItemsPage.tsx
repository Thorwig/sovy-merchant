import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api, FoodItem } from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';
import FoodItemModal from '../components/food/FoodItemModal';
import defaultLogo from '../assets/logo.png';

const LoadingSkeleton = () => (
  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
    {[...Array(6)].map((_, i) => (
      <div
        key={i}
        className="animate-pulse overflow-hidden rounded-lg border bg-card"
      >
        <div className="aspect-[16/9] bg-gray-200" />
        <div className="p-4 space-y-3">
          <div className="h-5 w-3/4 rounded bg-gray-200" />
          <div className="space-y-2">
            <div className="h-4 w-full rounded bg-gray-200" />
            <div className="h-4 w-2/3 rounded bg-gray-200" />
          </div>
          <div className="flex items-center justify-between pt-2">
            <div className="h-5 w-24 rounded bg-gray-200" />
            <div className="h-5 w-16 rounded bg-gray-200" />
          </div>
          <div className="h-4 w-32 rounded bg-gray-200" />
          <div className="flex gap-2 pt-2">
            <div className="h-8 w-full rounded bg-gray-200" />
            <div className="h-8 w-full rounded bg-gray-200" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

const FoodItemsPage = () => {
  const { t } = useTranslation();
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
    if (window.confirm(t('foodItems.deleteConfirm'))) {
      try {
        await api.deleteFoodItem(id);
        await queryClient.invalidateQueries({ queryKey: ['merchant-food-items'] });
      } catch (error: any) {
        console.error('Failed to delete food item:', error);
        window.alert(error.response?.data?.message || t('foodItems.deleteError'));
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
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="h-8 w-32 animate-pulse rounded bg-gray-200 sm:h-10 sm:w-40" />
          <div className="h-10 w-full animate-pulse rounded bg-gray-200 sm:w-48" />
        </div>
        <LoadingSkeleton />
      </div>
    );
  }

  const noItems = !foodItems || foodItems.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold sm:text-3xl">{t('foodItems.title')}</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          {t('foodItems.add')}
        </button>
      </div>

      {noItems ? (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border-2 border-dashed">
          <div className="text-center">
            <h3 className="mt-2 text-sm font-semibold">{t('foodItems.noItems')}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('foodItems.noItemsMessage')}
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              {t('foodItems.add')}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {foodItems.map((item: FoodItem) => (
            <div
              key={item.id}
              className="group relative overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-md"
            >
              <div className="aspect-[16/9] overflow-hidden">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.onerror = null;
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
                <h3 className="font-semibold line-clamp-1">{item.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                  {item.description}
                </p>
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-md bg-secondary/50 p-2">
                    <div className="text-xs text-muted-foreground">{t('foodItems.price')}</div>
                    <div className="font-medium text-primary">
                      {formatCurrency(item.price)}
                    </div>
                  </div>
                  <div className="rounded-md bg-secondary/50 p-2">
                    <div className="text-xs text-muted-foreground">{t('foodItems.quantity')}</div>
                    <div className="font-medium">
                      {item.quantity} {t('foodItems.left')}
                    </div>
                  </div>
                </div>
                <div className="mt-3 text-sm text-muted-foreground">
                  {t('foodItems.expires')}: {formatDate(item.expiryDate)}
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => handleEdit(item)}
                    className="flex-1 rounded-md bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground hover:bg-secondary/90 active:bg-secondary/80"
                  >
                    {t('common.edit')}
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="flex-1 rounded-md bg-destructive/10 px-3 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/20 active:bg-destructive/30"
                  >
                    {t('common.delete')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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