'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Truck, MapPin, Phone, CheckCircle, Package, LogOut, Pill, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

const statusColors: Record<string, string> = {
  ASSIGNED: 'secondary',
  ACCEPTED: 'default',
  PICKED_UP: 'warning',
  REACHED_DESTINATION: 'warning',
  DELIVERED: 'success',
};

export default function DeliveryDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const [otpInput, setOtpInput] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isAuthenticated) router.push('/auth/login');
    else if (user?.role !== 'DELIVERY_PARTNER') router.push('/dashboard');
  }, [isAuthenticated, user, router]);

  const { data: deliveries = [], isLoading } = useQuery({
    queryKey: ['my-deliveries'],
    queryFn: () => api.get('/delivery/my').then(r => r.data.data),
    refetchInterval: 30000,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.put(`/delivery/${id}/status`, { status }),
    onSuccess: () => {
      toast({ title: 'Status updated' });
      queryClient.invalidateQueries({ queryKey: ['my-deliveries'] });
    },
    onError: () => toast({ title: 'Update failed', variant: 'destructive' }),
  });

  const otpMutation = useMutation({
    mutationFn: ({ id, otp }: { id: string; otp: string }) =>
      api.post(`/delivery/${id}/verify-otp`, { otp }),
    onSuccess: () => {
      toast({ title: 'Delivery confirmed! OTP verified.' });
      queryClient.invalidateQueries({ queryKey: ['my-deliveries'] });
    },
    onError: () => toast({ title: 'Invalid OTP', variant: 'destructive' }),
  });

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    clearAuth();
    router.push('/auth/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Pill className="h-6 w-6 text-primary" />
            <span className="font-bold text-primary">MediSwiftzzz</span>
            <span className="text-sm text-gray-500 ml-2">Delivery</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm">{user?.name}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout}><LogOut className="h-4 w-4" /></Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-2">My Deliveries</h1>
        <p className="text-gray-500 mb-6">Active and pending delivery assignments</p>

        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Loading deliveries...</div>
        ) : deliveries.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Truck className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No deliveries assigned yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {deliveries.map((task: {
              id: string;
              status: string;
              order: {
                id: string;
                totalAmount: number;
                user: { name: string; phone: string };
                address: { line1: string; city: string; pincode: string };
                items: Array<{ medicine: { name: string }; quantity: number }>;
              };
            }) => (
              <Card key={task.id} className="overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base">Order #{task.order.id.slice(0, 8)}</CardTitle>
                  <Badge variant={(statusColors[task.status] as 'default' | 'secondary' | 'destructive' | 'success' | 'warning') || 'default'}>
                    {task.status.replace(/_/g, ' ')}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-2">
                    <Phone className="h-4 w-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">{task.order.user.name}</p>
                      <p className="text-sm text-gray-500">{task.order.user.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                    <p className="text-sm text-gray-600">{task.order.address.line1}, {task.order.address.city} - {task.order.address.pincode}</p>
                  </div>
                  <div className="text-sm text-gray-500">
                    {task.order.items.slice(0, 3).map((i: { medicine: { name: string }; quantity: number }) => `${i.medicine.name} ×${i.quantity}`).join(', ')}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{formatCurrency(task.order.totalAmount)}</span>
                    <a
                      href={`https://maps.google.com/?q=${task.order.address.line1}+${task.order.address.city}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary text-sm hover:underline"
                    >
                      <Navigation className="h-4 w-4" />Navigate
                    </a>
                  </div>

                  {/* Status actions */}
                  <div className="flex gap-2 flex-wrap pt-2">
                    {task.status === 'ASSIGNED' && (
                      <>
                        <Button size="sm" onClick={() => statusMutation.mutate({ id: task.id, status: 'ACCEPTED' })}>Accept</Button>
                        <Button size="sm" variant="outline" onClick={() => statusMutation.mutate({ id: task.id, status: 'REJECTED' })}>Reject</Button>
                      </>
                    )}
                    {task.status === 'ACCEPTED' && (
                      <Button size="sm" onClick={() => statusMutation.mutate({ id: task.id, status: 'PICKED_UP' })}>
                        <Package className="mr-2 h-4 w-4" />Mark Picked Up
                      </Button>
                    )}
                    {task.status === 'PICKED_UP' && (
                      <Button size="sm" onClick={() => statusMutation.mutate({ id: task.id, status: 'REACHED_DESTINATION' })}>
                        <MapPin className="mr-2 h-4 w-4" />Reached Destination
                      </Button>
                    )}
                    {task.status === 'REACHED_DESTINATION' && (
                      <div className="flex gap-2 w-full">
                        <input
                          className="border rounded-md px-3 py-1 text-sm flex-1"
                          placeholder="Enter OTP"
                          value={otpInput[task.id] || ''}
                          onChange={e => setOtpInput(prev => ({ ...prev, [task.id]: e.target.value }))}
                        />
                        <Button size="sm"
                          onClick={() => otpMutation.mutate({ id: task.id, otp: otpInput[task.id] || '' })}
                          disabled={!otpInput[task.id]}>
                          <CheckCircle className="mr-2 h-4 w-4" />Confirm Delivery
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
