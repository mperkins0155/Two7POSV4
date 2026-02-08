import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createClient } from '@metagptx/web-sdk';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Printer, Home } from 'lucide-react';
import type { Order, OrderItem, OrderItemModifier } from '@/types/order';

const client = createClient();

export default function Receipt() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [itemModifiers, setItemModifiers] = useState<Record<number, OrderItemModifier[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrderDetails();
  }, [orderId]);

  const loadOrderDetails = async () => {
    if (!orderId) return;

    try {
      // Load order
      const orderResponse = await client.entities.orders.get({
        id: parseInt(orderId)
      });
      setOrder(orderResponse.data);

      // Load order items
      const itemsResponse = await client.entities.order_items.query({
        query: { order_id: parseInt(orderId) },
        limit: 100
      });
      const items = itemsResponse.data.items;
      setOrderItems(items);

      // Load modifiers for each item
      const modifiersMap: Record<number, OrderItemModifier[]> = {};
      for (const item of items) {
        const modifiersResponse = await client.entities.order_item_modifiers.query({
          query: { order_item_id: item.id },
          limit: 50
        });
        modifiersMap[item.id] = modifiersResponse.data.items;
      }
      setItemModifiers(modifiersMap);
    } catch (error) {
      console.error('Failed to load order details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleNewOrder = () => {
    navigate('/pos', { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading receipt...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Order not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex gap-2 mb-4 print:hidden">
          <Button onClick={handlePrint} variant="outline">
            <Printer className="h-4 w-4 mr-2" />
            Print Receipt
          </Button>
          <Button onClick={handleNewOrder}>
            <Home className="h-4 w-4 mr-2" />
            New Order
          </Button>
        </div>

        <Card className="print:shadow-none">
          <CardContent className="p-8">
            {/* Header */}
            <div className="text-center mb-6 border-b pb-4">
              <h1 className="text-2xl font-bold mb-2">Receipt</h1>
              <p className="text-sm text-gray-600">Order #{order.order_number}</p>
              <p className="text-sm text-gray-600">
                {new Date(order.created_at).toLocaleString()}
              </p>
            </div>

            {/* Customer info */}
            {(order.customer_name || order.customer_email || order.customer_phone) && (
              <div className="mb-6 border-b pb-4">
                <h2 className="font-semibold mb-2">Customer</h2>
                {order.customer_name && <p className="text-sm">{order.customer_name}</p>}
                {order.customer_email && <p className="text-sm">{order.customer_email}</p>}
                {order.customer_phone && <p className="text-sm">{order.customer_phone}</p>}
              </div>
            )}

            {/* Order items */}
            <div className="mb-6 border-b pb-4">
              <h2 className="font-semibold mb-3">Items</h2>
              <div className="space-y-3">
                {orderItems.map((item) => {
                  const modifiers = itemModifiers[item.id] || [];
                  return (
                    <div key={item.id} className="text-sm">
                      <div className="flex justify-between">
                        <div className="flex-1">
                          <span className="font-medium">{item.quantity}x</span> {item.item_name}
                          {item.variant_name && (
                            <span className="text-gray-600"> - {item.variant_name}</span>
                          )}
                        </div>
                        <div className="font-medium">${item.subtotal.toFixed(2)}</div>
                      </div>
                      {modifiers.length > 0 && (
                        <div className="ml-6 text-gray-600">
                          {modifiers.map((mod, idx) => (
                            <div key={idx} className="flex justify-between">
                              <span>+ {mod.option_name}</span>
                              {mod.price_adjustment > 0 && (
                                <span>+${mod.price_adjustment.toFixed(2)}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Totals */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax:</span>
                <span>${order.tax_amount.toFixed(2)}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount:</span>
                  <span>-${order.discount_amount.toFixed(2)}</span>
                </div>
              )}
              {order.tip_amount > 0 && (
                <div className="flex justify-between">
                  <span>Tip:</span>
                  <span>${order.tip_amount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-xl font-bold border-t pt-2">
                <span>Total:</span>
                <span>${order.total_amount.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment info */}
            <div className="mt-6 pt-4 border-t text-center text-sm text-gray-600">
              <p>Payment Method: {order.payment_method?.toUpperCase()}</p>
              <p className="mt-2">Status: {order.status.toUpperCase()}</p>
              {order.completed_at && (
                <p>Completed: {new Date(order.completed_at).toLocaleString()}</p>
              )}
            </div>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t text-center text-sm text-gray-500">
              <p>Thank you for your business!</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}