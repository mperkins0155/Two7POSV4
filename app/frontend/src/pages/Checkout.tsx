import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createClient } from '@metagptx/web-sdk';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft } from 'lucide-react';
import type { CartItem } from '@/types/order';

const client = createClient();

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { userProfile, organization } = useAuth();
  
  const { cartItems = [], subtotal = 0, taxAmount = 0, total = 0 } = location.state || {};
  
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [tipAmount, setTipAmount] = useState(0);
  const [tipType, setTipType] = useState<'none' | 'percent' | 'custom'>('none');
  const [customTip, setCustomTip] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [processing, setProcessing] = useState(false);

  const calculateTip = () => {
    if (tipType === 'none') return 0;
    if (tipType === 'custom') return parseFloat(customTip) || 0;
    // Percent tips: 10%, 15%, 20%
    return 0;
  };

  const finalTotal = total + tipAmount;

  const generateOrderNumber = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ORD-${timestamp}-${random}`;
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      alert('Cart is empty');
      return;
    }

    setProcessing(true);
    try {
      const orderNumber = generateOrderNumber();
      const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

      // Create order
      const orderData = {
        organization_id: organization?.id,
        order_number: orderNumber,
        cashier_id: userProfile?.id,
        customer_name: customerName || null,
        customer_email: customerEmail || null,
        customer_phone: customerPhone || null,
        subtotal: subtotal,
        tax_amount: taxAmount,
        discount_amount: 0,
        tip_amount: tipAmount,
        total_amount: finalTotal,
        status: paymentMethod === 'cash' ? 'paid' : 'pending',
        payment_method: paymentMethod,
        payment_status: paymentMethod === 'cash' ? 'completed' : 'unpaid',
        created_at: now,
        completed_at: paymentMethod === 'cash' ? now : null
      };

      const orderResponse = await client.entities.orders.create({
        data: orderData
      });

      const order = orderResponse.data;

      // Create order items
      for (const item of cartItems as CartItem[]) {
        const orderItemData = {
          order_id: order.id,
          item_id: item.itemId,
          variant_id: item.variantId || null,
          item_name: item.itemName,
          variant_name: item.variantName || null,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          subtotal: item.subtotal,
          created_at: now
        };

        const orderItemResponse = await client.entities.order_items.create({
          data: orderItemData
        });

        const orderItem = orderItemResponse.data;

        // Create order item modifiers
        for (const modifier of item.modifiers) {
          await client.entities.order_item_modifiers.create({
            data: {
              order_item_id: orderItem.id,
              modifier_option_id: modifier.optionId,
              modifier_name: modifier.modifierName,
              option_name: modifier.optionName,
              price_adjustment: modifier.priceAdjustment,
              created_at: now
            }
          });
        }
      }

      // If cash payment, create payment record immediately
      if (paymentMethod === 'cash') {
        await client.entities.payments.create({
          data: {
            organization_id: organization?.id,
            order_id: order.id,
            amount: finalTotal,
            payment_method: 'cash',
            status: 'completed',
            processed_at: now,
            created_at: now
          }
        });
      }

      // Navigate to receipt
      navigate(`/pos/receipt/${order.id}`, { replace: true });
    } catch (error) {
      console.error('Checkout failed:', error);
      alert('Checkout failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleTipPercentage = (percent: number) => {
    setTipType('percent');
    setTipAmount(subtotal * (percent / 100));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to POS
        </Button>

        <h1 className="text-3xl font-bold mb-6">Checkout</h1>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Left column - Customer info and payment */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer Information (Optional)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="customerName">Name</Label>
                  <Input
                    id="customerName"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Customer name"
                  />
                </div>
                <div>
                  <Label htmlFor="customerEmail">Email</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="customer@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="customerPhone">Phone</Label>
                  <Input
                    id="customerPhone"
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tip</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-4 gap-2">
                  <Button
                    variant={tipType === 'none' ? 'default' : 'outline'}
                    onClick={() => {
                      setTipType('none');
                      setTipAmount(0);
                    }}
                  >
                    No Tip
                  </Button>
                  <Button
                    variant={tipType === 'percent' && tipAmount === subtotal * 0.1 ? 'default' : 'outline'}
                    onClick={() => handleTipPercentage(10)}
                  >
                    10%
                  </Button>
                  <Button
                    variant={tipType === 'percent' && tipAmount === subtotal * 0.15 ? 'default' : 'outline'}
                    onClick={() => handleTipPercentage(15)}
                  >
                    15%
                  </Button>
                  <Button
                    variant={tipType === 'percent' && tipAmount === subtotal * 0.2 ? 'default' : 'outline'}
                    onClick={() => handleTipPercentage(20)}
                  >
                    20%
                  </Button>
                </div>
                <div>
                  <Label htmlFor="customTip">Custom Tip Amount</Label>
                  <Input
                    id="customTip"
                    type="number"
                    step="0.01"
                    value={customTip}
                    onChange={(e) => {
                      setCustomTip(e.target.value);
                      setTipType('custom');
                      setTipAmount(parseFloat(e.target.value) || 0);
                    }}
                    placeholder="0.00"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                  <div className="flex items-center space-x-2 p-3 border rounded hover:bg-gray-50">
                    <RadioGroupItem value="cash" id="cash" />
                    <Label htmlFor="cash" className="flex-1 cursor-pointer">
                      Cash
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded hover:bg-gray-50 opacity-50">
                    <RadioGroupItem value="card" id="card" disabled />
                    <Label htmlFor="card" className="flex-1">
                      Card (Helcim - Coming Soon)
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
          </div>

          {/* Right column - Order summary */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {(cartItems as CartItem[]).map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <div className="flex-1">
                        <div>{item.quantity}x {item.itemName}</div>
                        {item.modifiers.length > 0 && (
                          <div className="text-xs text-gray-600 ml-4">
                            {item.modifiers.map((mod, idx) => (
                              <div key={idx}>+ {mod.optionName}</div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div>${item.subtotal.toFixed(2)}</div>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>${taxAmount.toFixed(2)}</span>
                  </div>
                  {tipAmount > 0 && (
                    <div className="flex justify-between">
                      <span>Tip:</span>
                      <span>${tipAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xl font-bold border-t pt-2">
                    <span>Total:</span>
                    <span>${finalTotal.toFixed(2)}</span>
                  </div>
                </div>

                <Button
                  onClick={handleCheckout}
                  disabled={processing}
                  className="w-full h-12 text-lg"
                >
                  {processing ? 'Processing...' : `Complete Payment - $${finalTotal.toFixed(2)}`}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}