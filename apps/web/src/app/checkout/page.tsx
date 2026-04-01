'use client';
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, MapPin, CreditCard, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

export default function CheckoutPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuthStore();
  const [selectedAddress, setSelectedAddress] = useState('');
  const [selectedRx, setSelectedRx] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'ONLINE'>('COD');

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: () => api.get('/users/profile').then(r => r.data.data),
    enabled: isAuthenticated,
  });

  const { data: cart } = useQuery({
    queryKey: ['cart'],
    queryFn: () => api.get('/cart').then(r => r.data.data),
    enabled: isAuthenticated,
  });

  const { data: rxList = [] } = useQuery({
    queryKey: ['my-prescriptions'],
    queryFn: () => api.get('/prescriptions/my').then(r => r.data.data),
    enabled: isAuthenticated,
  });

  const items = cart?.items || [];
  const total = items.reduce((s: number, i: { quantity: number; medicine: { price: number } }) => s + i.quantity * i.medicine.price, 0);
  const deliveryFee = total >= 500 ? 0 : 40;
  const hasRx = items.some((i: { medicine: { requiresPrescription: boolean } }) => i.medicine.requiresPrescription);
  const approvedRx = rxList.filter((rx: { status: string }) => rx.status === 'APPROVED');

  const placeOrder = useMutation({
    mutationFn: () => api.post('/orders', {
      addressId: selectedAddress,
      prescriptionId: hasRx ? selectedRx : undefined,
      paymentMethod,
    }),
    onSuccess: (res) => {
      toast({ title: 'Order placed!', description: 'Your order has been placed successfully.' });
      router.push(`/orders/${res.data.data.id}/track`);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Order placement failed';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    },
  });

  const addresses = profile?.addresses || [];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="container mx-auto max-w-2xl">
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/cart"><ArrowLeft className="mr-2 h-4 w-4" />Back to Cart</Link>
        </Button>
        <h1 className="text-2xl font-bold mb-6">Checkout</h1>

        <div className="space-y-4">
          {/* Delivery Address */}
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><MapPin className="h-4 w-4" />Delivery Address</CardTitle></CardHeader>
            <CardContent>
              {addresses.length === 0 ? (
                <p className="text-sm text-gray-500">No addresses. <Link href="/dashboard" className="text-primary">Add one first</Link></p>
              ) : (
                <div className="space-y-2">
                  {addresses.map((addr: { id: string; label: string; line1: string; city: string; pincode: string }) => (
                    <label key={addr.id} className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input type="radio" name="address" value={addr.id} checked={selectedAddress === addr.id} onChange={() => setSelectedAddress(addr.id)} className="mt-1" />
                      <div>
                        <p className="font-medium text-sm">{addr.label}</p>
                        <p className="text-sm text-gray-500">{addr.line1}, {addr.city} - {addr.pincode}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Prescription (if needed) */}
          {hasRx && (
            <Card>
              <CardHeader><CardTitle className="text-base">Prescription</CardTitle></CardHeader>
              <CardContent>
                {approvedRx.length === 0 ? (
                  <div>
                    <p className="text-sm text-amber-600 mb-2">You need an approved prescription for Rx medicines.</p>
                    <Button size="sm" asChild><Link href="/prescriptions/upload">Upload Prescription</Link></Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {approvedRx.map((rx: { id: string; fileName: string; reviewedAt?: string }) => (
                      <label key={rx.id} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <input type="radio" name="rx" value={rx.id} checked={selectedRx === rx.id} onChange={() => setSelectedRx(rx.id)} />
                        <p className="text-sm">{rx.fileName} - Approved</p>
                      </label>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Payment Method */}
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><CreditCard className="h-4 w-4" />Payment Method</CardTitle></CardHeader>
            <CardContent className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="payment" value="COD" checked={paymentMethod === 'COD'} onChange={() => setPaymentMethod('COD')} />
                <Truck className="h-4 w-4" /><span className="text-sm">Cash on Delivery</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="payment" value="ONLINE" checked={paymentMethod === 'ONLINE'} onChange={() => setPaymentMethod('ONLINE')} />
                <CreditCard className="h-4 w-4" /><span className="text-sm">Online Payment</span>
              </label>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader><CardTitle className="text-base">Order Summary</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm"><span>Subtotal</span><span>{formatCurrency(total)}</span></div>
              <div className="flex justify-between text-sm"><span>Delivery</span><span>{deliveryFee === 0 ? 'FREE' : formatCurrency(deliveryFee)}</span></div>
              <div className="flex justify-between font-bold text-base pt-2 border-t">
                <span>Total</span><span>{formatCurrency(total + deliveryFee)}</span>
              </div>
            </CardContent>
          </Card>

          <Button
            className="w-full"
            size="lg"
            disabled={!selectedAddress || (hasRx && !selectedRx) || placeOrder.isPending}
            onClick={() => placeOrder.mutate()}
          >
            {placeOrder.isPending
              ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Placing order...</>
              : `Place Order · ${formatCurrency(total + deliveryFee)}`}
          </Button>
        </div>
      </div>
    </div>
  );
}
