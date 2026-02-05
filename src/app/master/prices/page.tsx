'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  History,
  Tag
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AuthenticatedLayout from '@/components/layout/authenticated-layout';

/* eslint-disable @typescript-eslint/no-explicit-any */

export default function MasterPricesPage() {
  const [prices, setPrices] = useState<any[]>([]);
  const [barang, setBarang] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ barang_id: '', price: '', effective_date: new Date().toISOString().split('T')[0] });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([fetchPrices(), fetchBarang()]);
  }, []);

  const fetchPrices = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/master/prices');
      const json = await res.json();
      if (res.ok) setPrices(json);
    } catch (err) {
      console.error('Fetch prices error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBarang = async () => {
    try {
      const res = await fetch('/api/master/barang');
      const json = await res.json();
      if (res.ok) setBarang(json);
    } catch (err) {
      console.error('Fetch barang error:', err);
    }
  };

  const handleOpenAdd = () => {
    setFormData({ barang_id: '', price: '', effective_date: new Date().toISOString().split('T')[0] });
    setError('');
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/master/prices', {
        method: 'POST',
        body: JSON.stringify({
           ...formData,
           price: parseFloat(formData.price)
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const json = await res.json();
      if (res.ok) {
        setIsDialogOpen(false);
        fetchPrices();
      } else {
        setError(json.message || 'Something went wrong');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredPrices = prices.filter(p => 
    p.barang_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AuthenticatedLayout>
      <div className="p-8 space-y-8 bg-zinc-50/50 min-h-screen">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Master Prices</h1>
            <p className="text-zinc-500">Manage item pricing and effective dates history.</p>
          </div>
          <Button onClick={handleOpenAdd}>
            <Plus className="mr-2 h-4 w-4" /> Add Price
          </Button>
        </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Pricing Records</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search items..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Current Price</TableHead>
                  <TableHead>Effective Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-10">
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                        <span className="text-sm text-muted-foreground">Loading prices...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredPrices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-10 text-muted-foreground">
                      No price records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPrices.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.barang_name}</TableCell>
                      <TableCell>Rp {new Intl.NumberFormat('id-ID').format(item.price)}</TableCell>
                      <TableCell>{new Date(item.effective_date).toLocaleDateString('id-ID')}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Item Price</DialogTitle>
            <DialogDescription>
              Set a new price for an item. This will be the active price starting from the effective date.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="grid gap-2">
                <Label htmlFor="barang">Item</Label>
                <Select 
                   value={formData.barang_id} 
                   onValueChange={(v) => setFormData({ ...formData, barang_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an item" />
                  </SelectTrigger>
                  <SelectContent>
                    {barang.map((b) => (
                      <SelectItem key={b.id} value={b.id.toString()}>{b.name} ({b.code})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="price">Price (IDR)</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="e.g. 5000000"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="date">Effective Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.effective_date}
                  onChange={(e) => setFormData({ ...formData, effective_date: e.target.value })}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Adding...' : 'Add Price'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      </div>
    </AuthenticatedLayout>
  );
}
