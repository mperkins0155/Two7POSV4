import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProductGrid } from '@/components/pos/ProductGrid';
import { Cart } from '@/components/pos/Cart';
import { ModifierModal } from '@/components/pos/ModifierModal';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogOut, Settings, History } from 'lucide-react';
import type { Item } from '@/types/catalog';

export default function POS() {
  const navigate = useNavigate();
  const { logout, organization, userProfile } = useAuth();
  const { items, itemCount, subtotal, taxAmount, total, addItem, removeItem, updateQuantity, clearCart } = useCart();
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [modifierModalOpen, setModifierModalOpen] = useState(false);

  const handleAddToCart = async (item: Item) => {
    // Check if item has modifiers
    const hasModifiers = await checkItemHasModifiers(item.id);
    
    if (hasModifiers) {
      setSelectedItem(item);
      setModifierModalOpen(true);
    } else {
      // Add directly to cart without modifiers
      addItem({
        itemId: item.id,
        itemName: item.name,
        quantity: 1,
        unitPrice: item.base_price,
        modifiers: [],
        subtotal: item.base_price,
        taxRate: item.tax_rate
      });
    }
  };

  const checkItemHasModifiers = async (itemId: number): Promise<boolean> => {
    try {
      const { createClient } = await import('@metagptx/web-sdk');
      const client = createClient();
      const response = await client.entities.item_modifier_groups.query({
        query: { item_id: itemId },
        limit: 1
      });
      return response.data.items.length > 0;
    } catch (error) {
      console.error('Failed to check modifiers:', error);
      return false;
    }
  };

  const handleAddToCartWithModifiers = (
    modifiers: Array<{
      modifierGroupId: number;
      modifierName: string;
      optionId: number;
      optionName: string;
      priceAdjustment: number;
    }>,
    quantity: number
  ) => {
    if (!selectedItem) return;

    const modifiersTotal = modifiers.reduce((sum, mod) => sum + mod.priceAdjustment, 0);
    const unitPrice = selectedItem.base_price + modifiersTotal;

    addItem({
      itemId: selectedItem.id,
      itemName: selectedItem.name,
      quantity,
      unitPrice: selectedItem.base_price,
      modifiers,
      subtotal: unitPrice * quantity,
      taxRate: selectedItem.tax_rate
    });
  };

  const handleCheckout = () => {
    navigate('/pos/checkout', { state: { cartItems: items, subtotal, taxAmount, total } });
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-primary text-primary-foreground p-3 md:p-4 flex flex-col gap-3 md:flex-row md:justify-between md:items-center">
        <div className="text-center md:text-left">
          <h1 className="text-xl md:text-2xl font-bold">{organization?.name || 'POS System'}</h1>
          <p className="text-xs md:text-sm opacity-90">
            {userProfile?.first_name} {userProfile?.last_name} ({userProfile?.role})
          </p>
        </div>
        <div className="flex flex-wrap justify-center md:justify-end gap-2 w-full md:w-auto">
          <Button
            variant="secondary"
            size="sm"
            className="h-8 px-2 text-xs md:h-9 md:px-3 md:text-sm"
            onClick={() => navigate('/orders')}
          >
            <History className="h-4 w-4 mr-1 md:mr-2" />
            Orders
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="h-8 px-2 text-xs md:h-9 md:px-3 md:text-sm"
            onClick={() => navigate('/settings')}
          >
            <Settings className="h-4 w-4 mr-1 md:mr-2" />
            Settings
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="h-8 px-2 text-xs md:h-9 md:px-3 md:text-sm"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-1 md:mr-2" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Product grid - 70% on desktop, full width on mobile */}
        <div className="flex-1 p-4 overflow-hidden">
          <ProductGrid onAddToCart={handleAddToCart} />
        </div>

        {/* Cart sidebar - 30% on desktop, hidden on mobile (will be a modal) */}
        <div className="w-96 border-l hidden lg:block">
          <Cart
            items={items}
            subtotal={subtotal}
            taxAmount={taxAmount}
            total={total}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={removeItem}
            onCheckout={handleCheckout}
            onClearCart={clearCart}
          />
        </div>
      </div>

      {/* Mobile cart button */}
      {itemCount > 0 && (
        <div className="lg:hidden fixed bottom-4 right-4">
          <Button
            size="lg"
            className="rounded-full shadow-lg"
            onClick={() => navigate('/pos/cart')}
          >
            Cart ({itemCount}) - ${total.toFixed(2)}
          </Button>
        </div>
      )}

      {/* Modifier modal */}
      <ModifierModal
        item={selectedItem}
        open={modifierModalOpen}
        onClose={() => {
          setModifierModalOpen(false);
          setSelectedItem(null);
        }}
        onAddToCart={handleAddToCartWithModifiers}
      />
    </div>
  );
}
