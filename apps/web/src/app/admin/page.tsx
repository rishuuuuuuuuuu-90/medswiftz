'use client';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { Package, FileText, Truck, DollarSign, Users, AlertTriangle, LogOut, Pill, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, clearAuth } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) router.push('/auth/login');
    else if (!['ADMIN', 'PHARMACIST'].includes(user?.role || '')) router.push('/dashboard');
  }, [isAuthenticated, user, router]);

  const { data: metrics, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => api.get('/admin/dashboard').then(r => r.data.data),
    refetchInterval: 60000,
  });

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    clearAuth();
    router.push('/auth/login');
  };

  const cards = [
    { label: "Today's Orders", value: metrics?.ordersToday, icon: Package, color: 'text-blue-600 bg-blue-50' },
    { label: 'Pending Prescriptions', value: metrics?.pendingRx, icon: FileText, color: 'text-yellow-600 bg-yellow-50' },
    { label: 'Active Deliveries', value: metrics?.activeDeliveries, icon: Truck, color: 'text-green-600 bg-green-50' },
    { label: 'Total Revenue', value: formatCurrency(metrics?.totalRevenue || 0), icon: DollarSign, color: 'text-purple-600 bg-purple-50' },
    { label: 'Total Patients', value: metrics?.totalUsers, icon: Users, color: 'text-indigo-600 bg-indigo-50' },
    { label: 'Low Stock Items', value: metrics?.lowStock, icon: AlertTriangle, color: 'text-red-600 bg-red-50' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Pill className="h-6 w-6 text-primary" />
            <span className="font-bold text-primary">MediSwiftzzz</span>
            <span className="text-sm text-gray-500 ml-2">{user?.role} Panel</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">{user?.name}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout}><LogOut className="h-4 w-4" /></Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

        {/* Metrics */}
        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Loading metrics...</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {cards.map(({ label, value, icon: Icon, color }) => (
              <Card key={label}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{value ?? '—'}</p>
                      <p className="text-sm text-gray-500">{label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Quick links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { href: '/admin/prescriptions', icon: FileText, label: 'Review Prescriptions', desc: 'Approve or reject pending Rx' },
            { href: '/admin/orders', icon: Package, label: 'Manage Orders', desc: 'View and update order statuses' },
            { href: '/admin/medicines', icon: ClipboardList, label: 'Medicine Catalog', desc: 'Manage medicines and stock' },
          ].map(({ href, icon: Icon, label, desc }) => (
            <Link key={href} href={href}>
              <Card className="cursor-pointer hover:shadow-md transition-shadow h-full">
                <CardHeader>
                  <Icon className="h-8 w-8 text-primary mb-2" />
                  <CardTitle className="text-base">{label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">{desc}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
