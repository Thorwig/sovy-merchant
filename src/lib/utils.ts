/**
 * Utility functions for the Sovy Merchant application
 */

// Type safe class name utility
export function cn(...inputs: (string | undefined | null | boolean)[]): string {
    return inputs.filter(Boolean).join(' ');
}

// Format currency
export function formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
    }).format(amount);
}

// Format date
export function formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

// Truncate text with ellipsis
export function truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength)}...`;
}

// Simple debounce function
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    
    return function(...args: Parameters<T>) {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

// Generate a random ID
export function generateId(length: number = 8): string {
    return Math.random()
        .toString(36)
        .substring(2, 2 + length);
}

// Safe JSON parse with fallback
export function safeJsonParse<T>(json: string, fallback: T): T {
    try {
        return JSON.parse(json) as T;
    } catch (error) {
        return fallback;
    }
}

// Check if object is empty
export function isEmptyObject(obj: Record<string, any>): boolean {
    return Object.keys(obj).length === 0;
}