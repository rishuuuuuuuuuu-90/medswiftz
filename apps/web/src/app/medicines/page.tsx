'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowLeft, Search, ShoppingCart, Pill, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

export default function MedicinesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['medicines', search, category],
    queryFn: () => api.get('/medicines', { params: { search, category } }).then(r => r.data.data),
    enabled: true,
  });

  const addToCart = useMutation({
    mutationFn: (medicineId: string) => api.post('/cart/items', { medicineId, quantity: 1 }),
    onSuccess: () => { toast({ title: 'Added to cart' }); queryClient.invalidateQueries({ queryKey: ['cart'] }); },
    onError: () => toast({ title: 'Failed to add to cart', variant: 'destructive' }),
  });

  const medicines = data?.medicines || [];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="container mx-auto max-w-5xl">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" asChild><Link href="/dashboard"><ArrowLeft className="h-4 w-4" /></Link></Button>
          <h1 className="text-2xl font-bold flex-1">Browse Medicines</h1>
          {isAuthenticated && user?.role === 'PATIENT' && (
            <Button variant="outline" asChild><Link href="/cart"><ShoppingCart className="mr-2 h-4 w-4" />Cart</Link></Button>
          )}
        </div>

        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input className="pl-10" placeholder="Search medicines..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="h-10 rounded-md border px-3 text-sm" value={category} onChange={e => setCategory(e.target.value)}>
            <option value="">All Categories</option>
            <option value="Analgesics">Analgesics</option>
            <option value="Antibiotics">Antibiotics</option>
            <option value="Diabetes">Diabetes</option>
            <option value="Gastro">Gastro</option>
            <option value="Allergy">Allergy</option>
            <option value="Cardiovascular">Cardiovascular</option>
            <option value="Vitamins">Vitamins</option>
          </select>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Loading medicines...</div>
        ) : medicines.length === 0 ? (
          <div className="text-center py-12">
            <Pill className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No medicines found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {medicines.map((med: { id: string; name: string; genericName?: string; manufacturer?: string; category: string; price: number; requiresPrescription: boolean; description?: string; inventory?: { stock: number } }) => (
              <Card key={med.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-sm">{med.name}</p>
                      {med.genericName && <p className="text-xs text-gray-400">{med.genericName}</p>}
                    </div>
                    {med.requiresPrescription && (
                      <Badge variant="secondary" className="text-xs shrink-0">Rx</Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mb-1">{med.manufacturer} · {med.category}</p>
                  {med.description && <p className="text-xs text-gray-400 mb-3 line-clamp-2">{med.description}</p>}
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-primary">{formatCurrency(med.price)}</span>
                    <span className={`text-xs ${med.inventory?.stock === 0 ? 'text-red-500' : 'text-green-600'}`}>
                      {med.inventory?.stock === 0 ? 'Out of stock' : `${med.inventory?.stock} in stock`}
                    </span>
                  </div>
                  {med.requiresPrescription && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-amber-600">
                      <AlertCircle className="h-3 w-3" />
                      <span>Requires prescription</span>
                    </div>
                  )}
                  {isAuthenticated && user?.role === 'PATIENT' && (
                    <Button className="w-full mt-3" size="sm"
                      disabled={!med.inventory?.stock || addToCart.isPending}
                      onClick={() => addToCart.mutate(med.id)}>
                      Add to Cart
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
