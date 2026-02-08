import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@metagptx/web-sdk';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, DollarSign, ShoppingCart, TrendingUp } from 'lucide-react';
import type { Order, OrderItem } from '@/types/order';

const client = createClient();

export default function Reports() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load orders
      const ordersResponse = await client.entities.orders.query({
        query: { status: 'paid' },
        sort: '-created_at',
        limit: 100
      });
      setOrders(ordersResponse.data.items);

      // Load order items
      const itemsResponse = await client.entities.order_items.query({
        query: {},
        limit: 500
      });
      setOrderItems(itemsResponse.data.items);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const totalSales = orders.reduce((sum, order) => sum + order.total_amount, 0);
    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    // Payment method breakdown
    const paymentMethods: Record<string, number> = {};
    orders.forEach(order => {
      const method = order.payment_method || 'unknown';
      paymentMethods[method] = (paymentMethods[method] || 0) + order.total_amount;
    });

    // Top items
    const itemSales: Record<string, { quantity: number; revenue: number }> = {};
    orderItems.forEach(item => {
      if (!itemSales[item.item_name]) {
        itemSales[item.item_name] = { quantity: 0, revenue: 0 };
      }
      itemSales[item.item_name].quantity += item.quantity;
      itemSales[item.item_name].revenue += item.subtotal;
    });

    const topItems = Object.entries(itemSales)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    return {
      totalSales,
      totalOrders,
      averageOrderValue,
      paymentMethods,
      topItems
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading reports...</div>
      </div>
    );
  }

  const stats = calculateStats();

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => navigate('/pos')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to POS
          </Button>
          <h1 className="text-3xl font-bold flex-1">Sales Reports</h1>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
              <DollarSign className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalSales.toFixed(2)}</div>
              <p className="text-xs text-gray-600 mt-1">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
              <p className="text-xs text-gray-600 mt-1">Completed orders</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.averageOrderValue.toFixed(2)}</div>
              <p className="text-xs text-gray-600 mt-1">Per order</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Payment Methods */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(stats.paymentMethods).map(([method, amount]) => (
                  <div key={method} className="flex justify-between items-center">
                    <span className="text-sm font-medium capitalize">{method}</span>
                    <span className="text-sm font-bold">${amount.toFixed(2)}</span>
                  </div>
                ))}
                {Object.keys(stats.paymentMethods).length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No payment data</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Top Items */}
          <Card>
            <CardHeader>
              <CardTitle>Top Selling Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.topItems.map((item, index) => (
                  <div key={item.name} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                      <span className="text-sm font-medium">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold">${item.revenue.toFixed(2)}</div>
                      <div className="text-xs text-gray-600">{item.quantity} sold</div>
                    </div>
                  </div>
                ))}
                {stats.topItems.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No sales data</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}