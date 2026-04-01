'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, XCircle, Eye, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';

export default function PrescriptionReviewPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [reviewNote, setReviewNote] = useState('');
  const [selected, setSelected] = useState<string | null>(null);

  const { data: prescriptions = [], isLoading } = useQuery({
    queryKey: ['pending-prescriptions'],
    queryFn: () => api.get('/prescriptions/pending').then(r => r.data.data),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: string; note?: string }) =>
      api.post(`/prescriptions/${id}/review`, { status, reviewNote: note }),
    onSuccess: (_, vars) => {
      toast({ title: `Prescription ${vars.status === 'APPROVED' ? 'approved' : 'rejected'}` });
      queryClient.invalidateQueries({ queryKey: ['pending-prescriptions'] });
      setSelected(null);
      setReviewNote('');
    },
    onError: () => toast({ title: 'Review failed', variant: 'destructive' }),
  });

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="container mx-auto max-w-4xl">
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/admin"><ArrowLeft className="mr-2 h-4 w-4" />Back to Dashboard</Link>
        </Button>
        <h1 className="text-2xl font-bold mb-6">Prescription Review</h1>

        {isLoading ? (
          <div className="text-center py-12"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div>
        ) : prescriptions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
              <p className="text-gray-500">No pending prescriptions!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {prescriptions.map((rx: { id: string; fileName: string; fileUrl: string; fileType: string; createdAt: string; user: { name: string; phone: string; email: string } }) => (
              <Card key={rx.id}>
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold">{rx.user.name}</p>
                      <p className="text-sm text-gray-500">{rx.user.phone} · {rx.user.email}</p>
                      <p className="text-xs text-gray-400 mt-1">{rx.fileName} · {formatDate(rx.createdAt)}</p>
                      <Badge variant="warning" className="mt-2">PENDING</Badge>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Button variant="outline" size="sm" asChild>
                        <a href={rx.fileUrl} target="_blank" rel="noopener noreferrer">
                          <Eye className="mr-2 h-4 w-4" />View
                        </a>
                      </Button>
                      <Button size="sm" variant="default"
                        onClick={() => reviewMutation.mutate({ id: rx.id, status: 'APPROVED' })}
                        disabled={reviewMutation.isPending}>
                        <CheckCircle className="mr-2 h-4 w-4" />Approve
                      </Button>
                      <Button size="sm" variant="destructive"
                        onClick={() => setSelected(rx.id)}
                        disabled={reviewMutation.isPending}>
                        <XCircle className="mr-2 h-4 w-4" />Reject
                      </Button>
                    </div>
                  </div>

                  {/* Rejection form */}
                  {selected === rx.id && (
                    <div className="mt-4 p-4 bg-red-50 rounded-lg space-y-3">
                      <p className="text-sm font-medium text-red-800">Rejection reason (required):</p>
                      <textarea
                        className="w-full border rounded-md p-2 text-sm"
                        rows={3}
                        placeholder="Enter reason for rejection..."
                        value={reviewNote}
                        onChange={e => setReviewNote(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" variant="destructive"
                          disabled={!reviewNote.trim() || reviewMutation.isPending}
                          onClick={() => reviewMutation.mutate({ id: rx.id, status: 'REJECTED', note: reviewNote })}>
                          Confirm Rejection
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => { setSelected(null); setReviewNote(''); }}>Cancel</Button>
                      </div>
                    </div>
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
