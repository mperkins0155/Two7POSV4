import { useEffect, useState } from 'react';
import { createClient } from '@metagptx/web-sdk';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Item } from '@/types/catalog';

const client = createClient();

interface ProductGridProps {
  onAddToCart: (item: Item) => void;
}

export function ProductGrid({ onAddToCart }: ProductGridProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const response = await client.entities.items.query({
        query: { is_active: true },
        sort: 'category,name',
        limit: 100
      });
      const itemsData = response.data.items;
      setItems(itemsData);
      
      // Extract unique categories
      const uniqueCategories = Array.from(
        new Set(itemsData.map((item: Item) => item.category).filter(Boolean))
      ) as string[];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Failed to load items:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = selectedCategory === 'all'
    ? items
    : items.filter(item => item.category === selectedCategory);

  if (loading) {
    return <div className="flex items-center justify-center h-full">Loading products...</div>;
  }

  return (
    <div className="h-full flex flex-col">
      {/* Category filter tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        <Button
          variant={selectedCategory === 'all' ? 'default' : 'outline'}
          onClick={() => setSelectedCategory('all')}
          className="whitespace-nowrap"
        >
          All Items
        </Button>
        {categories.map(category => (
          <Button
            key={category}
            variant={selectedCategory === category ? 'default' : 'outline'}
            onClick={() => setSelectedCategory(category)}
            className="whitespace-nowrap"
          >
            {category}
          </Button>
        ))}
      </div>

      {/* Product grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto">
        {filteredItems.map(item => (
          <Card
            key={item.id}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => onAddToCart(item)}
          >
            <CardContent className="p-4">
              {item.image_url && (
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-full h-32 object-cover rounded mb-2"
                />
              )}
              <h3 className="font-semibold text-lg mb-1">{item.name}</h3>
              {item.description && (
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">{item.description}</p>
              )}
              <p className="text-xl font-bold text-primary">
                ${item.base_price.toFixed(2)}
              </p>
              {item.track_inventory && (
                <p className="text-xs text-gray-500 mt-1">
                  Stock: {item.current_stock}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="flex items-center justify-center h-full text-gray-500">
          No items found in this category
        </div>
      )}
    </div>
  );
}