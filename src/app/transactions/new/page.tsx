/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthenticatedLayout from '@/components/layout/authenticated-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { 
  Command, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem, 
  CommandList
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown, Trash2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function TransactionNewPage() {
  const router = useRouter();
  const [dealers, setDealers] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [selectedDealer, setSelectedDealer] = useState<string>("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [discount, setDiscount] = useState(0);
  const [promoDescription, setPromoDescription] = useState("");
  const [cart, setCart] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [openDealer, setOpenDealer] = useState(false);
  const [openItem, setOpenItem] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    // Fetch dealers and items
    const fetchData = async () => {
      try {
        const [dealersRes, itemsRes] = await Promise.all([
          fetch('/api/master/dealers'),
          fetch('/api/master/barang')
        ]);
        if (dealersRes.ok) setDealers(await dealersRes.json());
        if (itemsRes.ok) setItems(await itemsRes.json());
      } catch (err) {
        console.error("Error fetching master data", err);
      }
    };
    fetchData();
  }, []);

  const addToCart = () => {
    if (!selectedItem) return;
    
    // In a real app, you'd fetch the LATEST price for this item
    // For now, let's assume a default unit price or prompt user
    const unitPrice = 100000; // Placeholder price
    const subtotal = qty * unitPrice;

    const newItem = {
      barang_id: selectedItem.id,
      barang_name: selectedItem.name,
      barang_code: selectedItem.code,
      qty,
      unit_price: unitPrice,
      subtotal
    };

    setCart([...cart, newItem]);
    setSelectedItem(null);
    setQty(1);
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const subtotalAmount = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const totalAmount = Math.max(0, subtotalAmount - discount);

  const handleSubmit = async () => {
    if (!selectedDealer || cart.length === 0 || !invoiceNumber) {
      alert("Please fill all required fields");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealer_id: selectedDealer,
          invoice_number: invoiceNumber,
          items: cart,
          total_amount: totalAmount,
          discount: discount,
          promo_description: promoDescription
        })
      });

      if (res.ok) {
        router.push('/transactions');
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.message || "Failed to submit transaction");
      }
    } catch (err) {
      console.error('Error submitting transaction:', err);
      alert("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthenticatedLayout>
      <div className="p-8 max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Input Nota Dealer</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Detail Barang</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 space-y-2">
                  <Label>Pilih Barang</Label>
                  <Popover open={openItem} onOpenChange={setOpenItem}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openItem}
                        className="w-full justify-between"
                      >
                        {selectedItem ? selectedItem.name : "Cari barang..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Cari kode atau nama..." />
                        <CommandList>
                          <CommandEmpty>Barang tidak ditemukan.</CommandEmpty>
                          <CommandGroup>
                            {items.map((item) => (
                              <CommandItem
                                key={item.id}
                                value={`${item.code} ${item.name}`}
                                onSelect={() => {
                                  setSelectedItem(item);
                                  setOpenItem(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedItem?.id === item.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {item.code} - {item.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="w-24 space-y-2">
                  <Label>Qty</Label>
                  <Input 
                    type="number" 
                    value={qty} 
                    onChange={(e) => setQty(parseInt(e.target.value))} 
                    min={1} 
                  />
                </div>
                <Button onClick={addToCart} disabled={!selectedItem}>
                   <Plus className="h-4 w-4 mr-2" /> Add
                </Button>
              </div>

              <Separator />

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kode</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Subtotal</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cart.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-zinc-500 py-6">
                        Belum ada barang di nota.
                      </TableCell>
                    </TableRow>
                  )}
                  {cart.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.barang_code}</TableCell>
                      <TableCell>{item.barang_name}</TableCell>
                      <TableCell>{item.qty}</TableCell>
                      <TableCell>Rp {item.subtotal.toLocaleString()}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => removeFromCart(index)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Header Nota</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Dealer</Label>
                <Popover open={openDealer} onOpenChange={setOpenDealer}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openDealer}
                      className="w-full justify-between"
                    >
                      {selectedDealer 
                        ? dealers.find((d) => d.id.toString() === selectedDealer)?.name 
                        : "Pilih dealer..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Cari dealer..." />
                      <CommandList>
                        <CommandEmpty>Dealer tidak ditemukan.</CommandEmpty>
                        <CommandGroup>
                          {dealers.map((dealer) => (
                            <CommandItem
                              key={dealer.id}
                              value={dealer.name}
                              onSelect={() => {
                                setSelectedDealer(dealer.id.toString());
                                setOpenDealer(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedDealer === dealer.id.toString() ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {dealer.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Nomor Nota / Invoice</Label>
                <Input 
                  placeholder="Contoh: INV-2024001" 
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Diskon (Rp)</Label>
                <Input 
                  type="number"
                  placeholder="0" 
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  min={0}
                />
              </div>
              <div className="space-y-2">
                <Label>Deskripsi Promo (Opsional)</Label>
                <Textarea 
                  placeholder="Contoh: Promo Lebaran, Voucher Merdeka..." 
                  value={promoDescription}
                  onChange={(e) => setPromoDescription(e.target.value)}
                />
              </div>
              <Separator />
              <div className="flex justify-between items-center py-2 text-sm text-zinc-500">
                 <span>Subtotal</span>
                 <span>Rp {subtotalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-2 text-sm text-red-500">
                 <span>Diskon</span>
                 <span>- Rp {discount.toLocaleString()}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center py-2">
                 <span className="font-semibold text-lg">Grand Total</span>
                 <span className="font-bold text-xl text-primary font-mono">
                    Rp {totalAmount.toLocaleString()}
                 </span>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                size="lg" 
                onClick={handleSubmit} 
                disabled={loading || cart.length === 0}
              >
                {loading ? "Submitting..." : "Submit Nota"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
