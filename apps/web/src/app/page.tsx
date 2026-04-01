import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pill, Clock, Shield, Truck, ChevronRight } from 'lucide-react';

const features = [
  { icon: Clock, title: 'Fast Delivery', desc: 'Get medicines in 30 minutes' },
  { icon: Shield, title: 'Verified Pharmacists', desc: 'All prescriptions reviewed by licensed pharmacists' },
  { icon: Pill, title: '10,000+ Medicines', desc: 'Wide range of OTC and prescription drugs' },
  { icon: Truck, title: 'Live Tracking', desc: 'Track your order in real-time' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Pill className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold text-primary">MediSwiftzzz</span>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" asChild><Link href="/auth/login">Login</Link></Button>
            <Button asChild><Link href="/auth/register">Get Started</Link></Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="container mx-auto px-4 pt-20 pb-16 text-center">
        <Badge className="mb-4 text-sm" variant="secondary">🚀 Now delivering in 30 minutes</Badge>
        <h1 className="text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
          Medicines Delivered<br />
          <span className="text-primary">To Your Doorstep</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Upload your prescription, our pharmacists verify it, and we deliver your medicines fast & safely.
        </p>
        <div className="flex gap-4 justify-center">
          <Button size="lg" asChild>
            <Link href="/auth/register">Order Now <ChevronRight className="ml-2 h-4 w-4" /></Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/auth/login">Sign In</Link>
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">Why MediSwiftzzz?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map(({ icon: Icon, title, desc }) => (
            <Card key={title} className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{title}</h3>
                <p className="text-gray-500 text-sm">{desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: '1', title: 'Upload Prescription', desc: 'Take a photo or upload a PDF of your prescription' },
              { step: '2', title: 'Pharmacist Verifies', desc: 'Our licensed pharmacist reviews and approves your prescription' },
              { step: '3', title: 'Get It Delivered', desc: 'Medicines packed and delivered to your door with live tracking' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="text-center">
                <div className="w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">{step}</div>
                <h3 className="font-semibold text-lg mb-2">{title}</h3>
                <p className="text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="container mx-auto px-4 py-8">
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="pt-6 text-sm text-yellow-800">
            <strong>⚠️ Medical Disclaimer:</strong> MediSwiftzzz is a pharmacy delivery platform. Prescription medicines require a valid prescription reviewed by our licensed pharmacist. We do not provide medical advice. Always consult your doctor.
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-10 mt-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Pill className="h-5 w-5 text-primary" />
            <span className="text-white font-bold">MediSwiftzzz</span>
          </div>
          <p className="text-sm">© 2024 MediSwiftzzz. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
