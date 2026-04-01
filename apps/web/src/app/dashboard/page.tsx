'use client';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ShoppingCart, FileText, Package, Bell, LogOut, Pill, Plus, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/auth.store';
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

export default function PatientDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, clearAuth } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) router.push('/auth/login');
    else if (user?.role !== 'PATIENT') router.push('/');
  }, [isAuthenticated, user, router]);

  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => api.get('/orders/my').then(r => r.data.data),
    enabled: isAuthenticated,
  });

  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then(r => r.data.data),
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    clearAuth();
    router.push('/auth/login');
  };

  const orders = ordersData || [];
  const unreadCount = (notifData || []).filter((n: { isRead: boolean }) => !n.isRead).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Pill className="h-6 w-6 text-primary" />
            <span className="font-bold text-primary">MediSwiftzzz</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Bell className="h-5 w-5 text-gray-600 cursor-pointer" />
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">{unreadCount}</span>
              )}
            </div>
            <span className="text-sm text-gray-600">Hi, {user?.name?.split(' ')[0]}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout}><LogOut className="h-4 w-4" /></Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: FileText, label: 'Upload Prescription', href: '/prescriptions/upload', color: 'bg-blue-50 text-blue-600' },
            { icon: ShoppingCart, label: 'Browse Medicines', href: '/medicines', color: 'bg-green-50 text-green-600' },
            { icon: Package, label: 'My Orders', href: '/orders', color: 'bg-purple-50 text-purple-600' },
            { icon: Plus, label: 'New Order', href: '/cart', color: 'bg-orange-50 text-orange-600' },
          ].map(({ icon: Icon, label, href, color }) => (
            <Link key={href} href={href}>
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="pt-6 text-center">
                  <div className={`w-12 h-12 rounded-full ${color} flex items-center justify-center mx-auto mb-3`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-medium text-gray-700">{label}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Orders</CardTitle>
            <Link href="/orders"><Button variant="ghost" size="sm">View all</Button></Link>
          </CardHeader>
          <CardContent>
            {ordersLoading ? (
              <div className="text-center py-8 text-gray-500">Loading orders...</div>
            ) : orders.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No orders yet</p>
                <Button className="mt-4" asChild><Link href="/medicines">Browse Medicines</Link></Button>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.slice(0, 5).map((order: { id: string; status: string; totalAmount: number; createdAt: string; items: Array<{ medicine: { name: string } }> }) => (
                  <Link key={order.id} href={`/orders/${order.id}`}>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                      <div>
                        <p className="font-medium text-sm">Order #{order.id.slice(0, 8)}</p>
                        <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                        <p className="text-xs text-gray-400">{order.items.slice(0, 2).map((i: { medicine: { name: string } }) => i.medicine.name).join(', ')}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={statusColors[order.status] || 'default'} className="text-xs mb-1 block">
                          {order.status.replace(/_/g, ' ')}
                        </Badge>
                        <p className="text-sm font-semibold">{formatCurrency(order.totalAmount)}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Order Tracking Hint */}
        {orders.some((o: { status: string }) => o.status === 'OUT_FOR_DELIVERY') && (
          <Card className="mt-4 bg-green-50 border-green-200">
            <CardContent className="pt-4 flex items-center gap-3">
              <Clock className="h-5 w-5 text-green-600 animate-pulse" />
              <div>
                <p className="font-medium text-green-800">Order out for delivery!</p>
                <p className="text-sm text-green-600">
                  <Link href={`/orders/${orders.find((o: { status: string }) => o.status === 'OUT_FOR_DELIVERY')?.id}/track`} className="underline">
                    Track your order
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
