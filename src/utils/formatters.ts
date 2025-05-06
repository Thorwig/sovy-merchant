import { format } from 'date-fns';

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export const formatDateTime = (date: string | Date) => {
  return format(new Date(date), 'MMM d, yyyy h:mm a');
};

export const formatDate = (date: string | Date) => {
  return format(new Date(date), 'MMM d');
};