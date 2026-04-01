'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Trash2, Plus, Minus, ShoppingCart, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

export default function CartPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuthStore();
  const [placing, setPlacing] = useState(false);

  const { data: cart, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: () => api.get('/cart').then(r => r.data.data),
    enabled: isAuthenticated,
  });

  const updateItem = useMutation({
    mutationFn: ({ id, qty }: { id: string; qty: number }) => api.put(`/cart/items/${id}`, { quantity: qty }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
  });

  const removeItem = useMutation({
    mutationFn: (id: string) => api.delete(`/cart/items/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
  });

  const items = cart?.items || [];
  const total = items.reduce((s: number, i: { quantity: number; medicine: { price: number } }) => s + i.quantity * i.medicine.price, 0);
  const deliveryFee = total >= 500 ? 0 : 40;
  const hasRx = items.some((i: { medicine: { requiresPrescription: boolean } }) => i.medicine.requiresPrescription);

  const handleCheckout = async () => {
    setPlacing(true);
    router.push('/checkout');
  };

  if (!isAuthenticated || user?.role !== 'PATIENT') {
    return <div className="min-h-screen flex items-center justify-center"><p>Please log in as a patient</p></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="container mx-auto max-w-2xl">
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/medicines"><ArrowLeft className="mr-2 h-4 w-4" />Continue Shopping</Link>
        </Button>
        <h1 className="text-2xl font-bold mb-6">Cart</h1>

        {isLoading ? (
          <div className="text-center py-12"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div>
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">Your cart is empty</p>
              <Button asChild><Link href="/medicines">Browse Medicines</Link></Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="mb-4">
              <CardContent className="pt-6 space-y-4">
                {items.map((item: { id: string; quantity: number; medicine: { id: string; name: string; price: number; requiresPrescription: boolean } }) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.medicine.name}</p>
                      <p className="text-sm text-primary">{formatCurrency(item.medicine.price)} each</p>
                      {item.medicine.requiresPrescription && (
                        <p className="text-xs text-amber-600">Requires Rx</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" className="h-7 w-7"
                        onClick={() => item.quantity > 1
                          ? updateItem.mutate({ id: item.id, qty: item.quantity - 1 })
                          : removeItem.mutate(item.id)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-6 text-center text-sm">{item.quantity}</span>
                      <Button variant="outline" size="icon" className="h-7 w-7"
                        onClick={() => updateItem.mutate({ id: item.id, qty: item.quantity + 1 })}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="w-20 text-right">
                      <p className="font-semibold text-sm">{formatCurrency(item.medicine.price * item.quantity)}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400" onClick={() => removeItem.mutate(item.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Order Summary</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm"><span>Subtotal</span><span>{formatCurrency(total)}</span></div>
                <div className="flex justify-between text-sm"><span>Delivery Fee</span><span>{deliveryFee === 0 ? 'FREE' : formatCurrency(deliveryFee)}</span></div>
                {total < 500 && <p className="text-xs text-gray-400">Add {formatCurrency(500 - total)} more for free delivery</p>}
                <Separator />
                <div className="flex justify-between font-bold"><span>Total</span><span>{formatCurrency(total + deliveryFee)}</span></div>
                {hasRx && (
                  <p className="text-xs text-amber-600 mt-2">⚠️ Cart contains prescription medicines. You&apos;ll need an approved prescription to complete checkout.</p>
                )}
                <Button className="w-full mt-4" onClick={handleCheckout} disabled={placing}>
                  {placing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</> : 'Proceed to Checkout'}
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
