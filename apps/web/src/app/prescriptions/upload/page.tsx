'use client';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Upload, FileText, CheckCircle, ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';

export default function UploadPrescriptionPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { isAuthenticated } = useAuthStore();
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [consent, setConsent] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  }, []);

  const handleUpload = async () => {
    if (!file) return;
    if (!consent) { toast({ title: 'Consent required', description: 'Please agree to the terms', variant: 'destructive' }); return; }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      await api.post('/prescriptions/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast({ title: 'Prescription uploaded!', description: 'Our pharmacist will review it shortly.' });
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Upload failed';
      toast({ title: 'Upload failed', description: msg, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  if (!isAuthenticated) {
    router.push('/auth/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="container mx-auto max-w-2xl">
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/dashboard"><ArrowLeft className="mr-2 h-4 w-4" />Back to Dashboard</Link>
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" />Upload Prescription</CardTitle>
            <CardDescription>Upload a clear image or PDF of your prescription</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Disclaimer */}
            <div className="flex items-start gap-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-yellow-800">
                <p className="font-semibold mb-1">Important Notice</p>
                <p>Your prescription will be reviewed by a licensed pharmacist. Prescription medicines can only be dispensed after approval. Please ensure the prescription is valid and clearly readable.</p>
              </div>
            </div>

            {/* Consent */}
            <div className="flex items-start gap-2">
              <input type="checkbox" id="consent" checked={consent} onChange={e => setConsent(e.target.checked)} className="mt-1" />
              <label htmlFor="consent" className="text-sm text-gray-600 cursor-pointer">
                I confirm this is a genuine prescription from a registered medical practitioner and I consent to sharing it with MediSwiftzzz pharmacists for verification.
              </label>
            </div>

            {/* Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-10 text-center transition-all cursor-pointer ${dragging ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary hover:bg-gray-50'}`}
              onClick={() => document.getElementById('fileInput')?.click()}
            >
              {file ? (
                <div className="space-y-2">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                  <p className="font-semibold text-gray-700">{file.name}</p>
                  <p className="text-sm text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
                  <Button variant="outline" size="sm" onClick={e => { e.stopPropagation(); setFile(null); }}>Remove</Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-12 w-12 text-gray-300 mx-auto" />
                  <p className="font-medium text-gray-600">Drag & drop or click to upload</p>
                  <p className="text-sm text-gray-400">Supports: JPG, PNG, PDF (max 5MB)</p>
                </div>
              )}
            </div>
            <input id="fileInput" type="file" accept="image/*,application/pdf" className="hidden"
              onChange={e => setFile(e.target.files?.[0] || null)} />

            <Button onClick={handleUpload} disabled={!file || uploading || !consent} className="w-full">
              {uploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Uploading...</> : 'Submit Prescription'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
