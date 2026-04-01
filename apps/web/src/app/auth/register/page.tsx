'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Pill, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';

const schema = z.object({
  name: z.string().min(2, 'Name too short'),
  email: z.string().email('Invalid email'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid phone (10 digits starting with 6-9)'),
  password: z.string().min(8, 'Minimum 8 characters'),
  role: z.enum(['PATIENT', 'DELIVERY_PARTNER']),
  consent: z.literal(true, { errorMap: () => ({ message: 'You must agree to terms' }) }),
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'PATIENT' },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const { consent: _, ...payload } = data;
      const res = await api.post('/auth/register', payload);
      const { user, accessToken, refreshToken } = res.data.data;
      setAuth(user, accessToken, refreshToken);
      toast({ title: 'Account created!', description: 'Welcome to MediSwiftzzz' });
      router.push(user.role === 'DELIVERY_PARTNER' ? '/delivery' : '/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Registration failed';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2"><Pill className="h-10 w-10 text-primary" /></div>
          <CardTitle className="text-2xl">Create Account</CardTitle>
          <CardDescription>Join MediSwiftzzz today</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" placeholder="John Doe" {...register('name')} />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" {...register('email')} />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" placeholder="9876543210" {...register('phone')} />
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="Min 8 characters" {...register('password')} />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>
            <div>
              <Label htmlFor="role">Register as</Label>
              <select id="role" {...register('role')} className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="PATIENT">Patient</option>
                <option value="DELIVERY_PARTNER">Delivery Partner</option>
              </select>
            </div>
            <div className="flex items-start gap-2">
              <input type="checkbox" id="consent" {...register('consent')} className="mt-1" />
              <label htmlFor="consent" className="text-sm text-gray-600">
                I agree to the Terms of Service and understand that prescription medicines require pharmacist approval.
              </label>
            </div>
            {errors.consent && <p className="text-red-500 text-xs">{errors.consent.message}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating account...</> : 'Create Account'}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-4">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-primary hover:underline font-medium">Sign In</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
