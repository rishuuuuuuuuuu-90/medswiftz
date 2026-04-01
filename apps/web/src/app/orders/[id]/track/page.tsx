'use client';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { io, Socket } from 'socket.io-client';
import { ArrowLeft, CheckCircle, Circle, Truck, Package, Pill, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';

const STATUS_STEPS = [
  { key: 'PRESCRIPTION_UPLOADED', label: 'Order Placed', icon: Pill },
  { key: 'VERIFIED', label: 'Prescription Verified', icon: CheckCircle },
  { key: 'PACKED', label: 'Packed', icon: Package },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', icon: Truck },
  { key: 'DELIVERED', label: 'Delivered', icon: CheckCircle },
];

export default function TrackOrderPage() {
  const { id } = useParams() as { id: string };
  const { accessToken } = useAuthStore();
  const [currentStatus, setCurrentStatus] = useState<string>('');

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => api.get(`/orders/${id}`).then(r => r.data.data),
  });

  useEffect(() => {
    if (order) setCurrentStatus(order.status);
  }, [order]);

  useEffect(() => {
    if (!accessToken) return;
    const socket: Socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000', {
      auth: { token: accessToken },
    });
    socket.on('connect', () => socket.emit('join:room', `order:${id}`));
    socket.on('order:status:update', (data: { orderId: string; status: string }) => {
      if (data.orderId === id) setCurrentStatus(data.status);
    });
    return () => { socket.disconnect(); };
  }, [id, accessToken]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center"><Clock className="h-12 w-12 text-primary animate-pulse mx-auto mb-4" /><p>Loading tracking info...</p></div>
      </div>
    );
  }

  const activeStep = STATUS_STEPS.findIndex(s => s.key === (currentStatus || order?.status));

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="container mx-auto max-w-2xl">
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/dashboard"><ArrowLeft className="mr-2 h-4 w-4" />Back</Link>
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Order #{id.slice(0, 8)}</CardTitle>
              <Badge variant={currentStatus === 'DELIVERED' ? 'success' : 'default'}>
                {(currentStatus || order?.status || '').replace(/_/g, ' ')}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {/* Status Steps */}
            <div className="space-y-4 mb-8">
              {STATUS_STEPS.map((step, idx) => {
                const Icon = step.icon;
                const done = idx <= activeStep;
                const active = idx === activeStep;
                return (
                  <div key={step.key} className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${done ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'} ${active ? 'ring-4 ring-primary/20 scale-110' : ''}`}>
                      {done ? <Icon className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium ${done ? 'text-gray-900' : 'text-gray-400'}`}>{step.label}</p>
                      {order?.timeline?.find((t: { status: string; createdAt: string }) => t.status === step.key) && (
                        <p className="text-xs text-gray-400">
                          {formatDate(order.timeline.find((t: { status: string; createdAt: string }) => t.status === step.key)!.createdAt)}
                        </p>
                      )}
                    </div>
                    {active && <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
                  </div>
                );
              })}
            </div>

            {/* Delivery Partner Info */}
            {order?.delivery?.partner && (
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="font-medium text-green-800">Your delivery partner</p>
                <p className="text-green-600">{order.delivery.partner.name} · {order.delivery.partner.phone}</p>
              </div>
            )}

            {/* Order Summary */}
            <div className="mt-6 space-y-2">
              <h3 className="font-semibold">Order Items</h3>
              {order?.items?.map((item: { id: string; quantity: number; price: number; medicine: { name: string } }) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{item.medicine.name} × {item.quantity}</span>
                  <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
