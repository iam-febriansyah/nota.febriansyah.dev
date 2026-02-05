'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AuthenticatedLayout from '@/components/layout/authenticated-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Printer, ArrowLeft, History } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

/* eslint-disable @typescript-eslint/no-explicit-any */

export default function TransactionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [newStatus, setNewStatus] = useState("");
  const [notes, setNotes] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await fetch(`/api/transactions/${params.id}`);
        if (res.ok) {
          const detail = await res.json();
          setData(detail);
          setNewStatus(detail.header.status);
        }
      } catch (err) {
        console.error("Error fetching detail", err);
      } finally {
        setLoading(false);
      }
    };
    if (params.id) fetchDetail();
  }, [params.id]);

  const handleUpdateStatus = async () => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/transactions/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, notes })
      });

      if (res.ok) {
        router.refresh();
        // Reload local data
        const fresh = await fetch(`/api/transactions/${params.id}`).then(r => r.json());
        setData(fresh);
        setNotes("");
        alert("Status updated successfully");
      }
    } catch {
      alert("Error updating status");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <AuthenticatedLayout><div className="p-8">Loading...</div></AuthenticatedLayout>;
  if (!data) return <AuthenticatedLayout><div className="p-8">Transaction not found</div></AuthenticatedLayout>;

  const canUpdate = user?.role === 'Finance' || user?.role === 'Superadmin';

  return (
    <AuthenticatedLayout>
      <div className="p-8 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Detail Nota #{data.header.invoice_number}</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Daftar Barang</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Barang</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Harga</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.items.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="font-medium">{item.barang_name}</div>
                          <div className="text-xs text-zinc-500">{item.barang_code}</div>
                        </TableCell>
                        <TableCell>{item.qty}</TableCell>
                        <TableCell>Rp {item.unit_price.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-mono">
                           Rp {item.subtotal.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={3} className="text-right text-zinc-500">Subtotal</TableCell>
                      <TableCell className="text-right font-mono">
                         Rp {(Number(data.header.total_amount) + Number(data.header.discount || 0)).toLocaleString()}
                      </TableCell>
                    </TableRow>
                    {Number(data.header.discount) > 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-right text-red-500">Diskon</TableCell>
                        <TableCell className="text-right text-red-500 font-mono">
                           - Rp {Number(data.header.discount).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    )}
                    <TableRow>
                      <TableCell colSpan={3} className="text-right font-bold">TOTAL</TableCell>
                      <TableCell className="text-right font-bold text-lg text-primary">
                         Rp {Number(data.header.total_amount).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center gap-2">
                <History className="h-5 w-5" />
                <CardTitle>Log Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.logs.map((log: any) => (
                    <div key={log.id} className="flex gap-4 border-l-2 border-zinc-200 pl-4 relative">
                      <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-zinc-200 border-2 border-white" />
                      <div className="flex-1 pb-4">
                        <div className="flex justify-between items-start">
                           <span className="font-semibold">{log.status}</span>
                           <span className="text-xs text-zinc-500">{new Date(log.created_at).toLocaleString()}</span>
                        </div>
                        <p className="text-sm text-zinc-600 italic mt-1">&quot;{log.notes}&quot;</p>
                        <p className="text-[10px] text-zinc-400 mt-1 uppercase font-bold">Oleh: {log.updater_name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informasi Nota</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs text-zinc-500 uppercase">Dealer</Label>
                  <p className="font-semibold">{data.header.dealer_name}</p>
                </div>
                <div>
                  <Label className="text-xs text-zinc-500 uppercase">Status Saat Ini</Label>
                  <p className="font-bold text-primary">{data.header.status}</p>
                </div>
                {data.header.promo_description && (
                  <div>
                    <Label className="text-xs text-zinc-500 uppercase">Promo Code / Deskripsi</Label>
                    <p className="font-medium text-sm bg-zinc-50 p-2 rounded border border-zinc-100 mt-1">
                      {data.header.promo_description}
                    </p>
                  </div>
                )}
                <Button className="w-full" variant="outline" onClick={() => window.open(`/api/reports/print?id=${data.header.id}`)}>
                    <Printer className="h-4 w-4 mr-2" /> Cetak PDF
                </Button>
              </CardContent>
            </Card>

            {canUpdate && (
              <Card>
                <CardHeader>
                  <CardTitle>Update Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Pilih Status Baru</Label>
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Proses">Proses</SelectItem>
                        <SelectItem value="Done">Done</SelectItem>
                        <SelectItem value="Reject">Reject</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Catatan / Notes</Label>
                    <Textarea 
                      placeholder="Tambahkan alasan atau info tambahan..." 
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" onClick={handleUpdateStatus} disabled={updating}>
                    {updating ? "Updating..." : "Update Status"}
                  </Button>
                </CardFooter>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
