/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthenticatedLayout from '@/components/layout/authenticated-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, Plus, Download, Printer } from 'lucide-react';

export default function TransactionListPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const router = useRouter();

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        q: search,
        status: statusFilter === "all" ? "" : statusFilter,
        start_date: startDate,
        end_date: endDate
      });
      const res = await fetch(`/api/transactions?${params.toString()}`);
      if (res.ok) {
        setData(await res.json());
      }
    } catch (err) {
      console.error("Error fetching transactions", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [page, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchTransactions();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Proses': return 'bg-blue-100 text-blue-800';
      case 'Done': return 'bg-green-100 text-green-800';
      case 'Reject': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <AuthenticatedLayout>
      <div className="p-8 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Daftar Nota</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.open('/api/reports/export')}>
               <Download className="h-4 w-4 mr-2" /> Export Excel
            </Button>
            <Button onClick={() => router.push('/transactions/new')}>
               <Plus className="h-4 w-4 mr-2" /> Nota Baru
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filter & Pencarian</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
               <div className="space-y-2">
                  <Label>Cari Invoice / Dealer</Label>
                  <Input 
                    placeholder="Keyword..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
               </div>
               <div className="space-y-2">
                  <Label>Dari Tanggal</Label>
                  <Input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
               </div>
               <div className="space-y-2">
                  <Label>Sampai Tanggal</Label>
                  <Input 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
               </div>
               <Button type="submit">Cari Data</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Dealer</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                   <TableRow>
                     <TableCell colSpan={6} className="text-center py-10">Loading...</TableCell>
                   </TableRow>
                ) : !data || data.data.length === 0 ? (
                   <TableRow>
                     <TableCell colSpan={6} className="text-center py-10 text-zinc-500">
                        Tidak ada transaksi ditemukan.
                     </TableCell>
                   </TableRow>
                ) : (
                  data.data.map((trx: any) => (
                    <TableRow key={trx.id}>
                      <TableCell className="font-medium">{trx.invoice_number}</TableCell>
                      <TableCell>{trx.dealer_name}</TableCell>
                      <TableCell>Rp {trx.total_amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap", getStatusColor(trx.status))}>
                          {trx.status}
                        </span>
                      </TableCell>
                      <TableCell>{new Date(trx.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right flex justify-end gap-2">
                        <Button title='Cetak Nota' className='cursor-pointer' variant="outline" size="sm" onClick={() => window.open(`/api/reports/print?id=${trx.id}`)}>
                           <Printer className="h-4 w-4" />
                        </Button>
                        <Button title='Detail' className='cursor-pointer' variant="outline" size="sm" onClick={() => router.push(`/transactions/${trx.slug}`)}>
                           <FileText className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {data && data.pagination && (
              <div className="flex items-center justify-between mt-4">
                 <p className="text-sm text-zinc-500">
                   Total data: {data.pagination.total}
                 </p>
                 <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                    >
                      Prev
                    </Button>
                    <span className="flex items-center px-4 text-sm font-medium">
                      Page {page} of {data.pagination.totalPages}
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      disabled={page === data.pagination.totalPages}
                      onClick={() => setPage(page + 1)}
                    >
                      Next
                    </Button>
                 </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}
