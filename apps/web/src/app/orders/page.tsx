'use client';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowLeft, Package, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';

const statusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'success' | 'warning'> = {
  PRESCRIPTION_UPLOADED: 'secondary',
  VERIFIED: 'default',
  PACKED: 'warning',
  OUT_FOR_DELIVERY: 'warning',
  DELIVERED: 'success',
  CANCELLED: 'destructive',
  REJECTED: 'destructive',
};

export default function OrdersPage() {
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => api.get('/orders/my').then(r => r.data.data),
  });

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="container mx-auto max-w-3xl">
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/dashboard"><ArrowLeft className="mr-2 h-4 w-4" />Back</Link>
        </Button>
        <h1 className="text-2xl font-bold mb-6">My Orders</h1>

        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No orders yet</p>
              <Button className="mt-4" asChild><Link href="/medicines">Browse Medicines</Link></Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order: { id: string; status: string; totalAmount: number; createdAt: string; address: { line1: string; city: string }; items: Array<{ medicine: { name: string }; quantity: number }> }) => (
              <Card key={order.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold">Order #{order.id.slice(0, 8)}</p>
                      <p className="text-sm text-gray-400">{formatDate(order.createdAt)}</p>
                    </div>
                    <Badge variant={statusColors[order.status] || 'default'}>
                      {order.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600 mb-3">
                    {order.items.slice(0, 3).map((i: { medicine: { name: string }; quantity: number }) => `${i.medicine.name} ×${i.quantity}`).join(', ')}
                    {order.items.length > 3 && ` +${order.items.length - 3} more`}
                  </div>
                  {order.address && (
                    <div className="flex items-center gap-1 text-xs text-gray-400 mb-3">
                      <MapPin className="h-3 w-3" />
                      <span>{order.address.line1}, {order.address.city}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="font-bold">{formatCurrency(order.totalAmount)}</span>
                    <div className="flex gap-2">
                      {order.status === 'OUT_FOR_DELIVERY' && (
                        <Button size="sm" asChild>
                          <Link href={`/orders/${order.id}/track`}>Track Order</Link>
                        </Button>
                      )}
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/orders/${order.id}`}>View Details</Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
