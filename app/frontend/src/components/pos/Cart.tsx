import { Button } from '@/components/ui/button';
import { Trash2, Plus, Minus } from 'lucide-react';
import type { CartItem } from '@/types/order';

interface CartProps {
  items: CartItem[];
  subtotal: number;
  taxAmount: number;
  total: number;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  onCheckout: () => void;
  onClearCart: () => void;
}

export function Cart({
  items,
  subtotal,
  taxAmount,
  total,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  onClearCart
}: CartProps) {
  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-xl font-bold">Cart</h2>
        {items.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearCart}
            className="text-red-600 hover:text-red-700"
          >
            Clear
          </Button>
        )}
      </div>

      {/* Cart items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {items.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            Cart is empty
          </div>
        ) : (
          items.map(item => (
            <div key={item.id} className="border rounded-lg p-3 bg-gray-50">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold">{item.itemName}</h3>
                  {item.variantName && (
                    <p className="text-sm text-gray-600">{item.variantName}</p>
                  )}
                  {item.modifiers.length > 0 && (
                    <div className="text-xs text-gray-500 mt-1">
                      {item.modifiers.map((mod, idx) => (
                        <div key={idx}>
                          + {mod.optionName}
                          {mod.priceAdjustment > 0 && ` (+$${mod.priceAdjustment.toFixed(2)})`}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveItem(item.id)}
                  className="text-red-600 hover:text-red-700 p-1"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                    className="h-8 w-8 p-0"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="font-semibold w-8 text-center">{item.quantity}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                    className="h-8 w-8 p-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <span className="font-bold">${item.subtotal.toFixed(2)}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Totals and checkout */}
      {items.length > 0 && (
        <div className="border-t p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Subtotal:</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Tax:</span>
            <span>${taxAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold border-t pt-2">
            <span>Total:</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <Button onClick={onCheckout} className="w-full h-12 text-lg">
            Checkout
          </Button>
        </div>
      )}
    </div>
  );
}