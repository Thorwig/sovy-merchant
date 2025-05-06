import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from './useToast';

export interface FoodItem {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export function useFoodItems() {
  const [items, setItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  const fetchItems = async () => {
    try {
      setLoading(true);
      const data = await api.getFoodItems();
      setItems(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
      toast({
        title: 'Error',
        description: 'Failed to fetch food items',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createItem = async (data: FormData) => {
    try {
      setLoading(true);
      const newItem = await api.createFoodItem(data);
      setItems((prev) => [...prev, newItem]);
      toast({
        title: 'Success',
        description: 'Food item created successfully',
        variant: 'success',
      });
      return newItem;
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to create food item',
        variant: 'destructive',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateItem = async (id: string, data: FormData) => {
    try {
      setLoading(true);
      const updatedItem = await api.updateFoodItem(id, data);
      setItems((prev) =>
        prev.map((item) => (item.id === id ? updatedItem : item))
      );
      toast({
        title: 'Success',
        description: 'Food item updated successfully',
        variant: 'success',
      });
      return updatedItem;
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to update food item',
        variant: 'destructive',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (id: string) => {
    try {
      setLoading(true);
      await api.deleteFoodItem(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
      toast({
        title: 'Success',
        description: 'Food item deleted successfully',
        variant: 'success',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to delete food item',
        variant: 'destructive',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const toggleAvailability = async (id: string) => {
    try {
      setLoading(true);
      const itemToUpdate = items.find((item) => item.id === id);
      if (!itemToUpdate) throw new Error('Item not found');

      const updatedItem = await api.updateFoodItem(id, {
        isAvailable: !itemToUpdate.isAvailable,
      });

      setItems((prev) =>
        prev.map((item) => (item.id === id ? updatedItem : item))
      );

      toast({
        title: 'Success',
        description: `Item marked as ${
          updatedItem.isAvailable ? 'available' : 'unavailable'
        }`,
        variant: 'success',
      });

      return updatedItem;
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to update item availability',
        variant: 'destructive',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  return {
    items,
    loading,
    error,
    refresh: fetchItems,
    createItem,
    updateItem,
    deleteItem,
    toggleAvailability,
  };
}