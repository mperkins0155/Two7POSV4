import { useState, useCallback } from 'react';
import type { CartItem } from '@/types/order';

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback((item: Omit<CartItem, 'id'>) => {
    const id = `${item.itemId}-${item.variantId || 0}-${Date.now()}`;
    setItems(prev => [...prev, { ...item, id }]);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const modifiersTotal = item.modifiers.reduce((sum, mod) => sum + mod.priceAdjustment, 0);
        const subtotal = (item.unitPrice + modifiersTotal) * quantity;
        return { ...item, quantity, subtotal };
      }
      return item;
    }));
  }, [removeItem]);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  
  // Calculate tax based on items' tax rates
  const taxAmount = items.reduce((sum, item) => {
    return sum + (item.subtotal * (item.taxRate / 100));
  }, 0);

  return {
    items,
    itemCount,
    subtotal,
    taxAmount,
    total: subtotal + taxAmount,
    addItem,
    removeItem,
    updateQuantity,
    clearCart
  };
}