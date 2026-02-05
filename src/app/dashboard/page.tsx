/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { 
  ArrowUpRight, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Plus, 
  Settings, 
  ArrowRight,
  FileText
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch('/api/dashboard');
        if (res.ok) {
          setData(await res.json());
        }
      } catch (err) {
        console.error("Dashboard fetch error", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const stats = [
    {
      title: "Pending",
      value: data?.widgets?.pending || 0,
      icon: Clock,
      color: "text-yellow-600",
      bg: "bg-yellow-50"
    },
    {
      title: "Diproses",
      value: data?.widgets?.processing || 0,
      icon: ArrowUpRight,
      color: "text-blue-600",
      bg: "bg-blue-50"
    },
    {
      title: "Selesai",
      value: data?.widgets?.done || 0,
      icon: CheckCircle2,
      color: "text-green-600",
      bg: "bg-green-50"
    },
    {
      title: "Ditolak",
      value: data?.widgets?.reject || 0,
      icon: XCircle,
      color: "text-red-600",
      bg: "bg-red-50"
    }
  ];

  if (loading) {
    return <AuthenticatedLayout><div className="p-8">Loading dashboard...</div></AuthenticatedLayout>;
  }

  return (
    <AuthenticatedLayout>
      <div className="p-8 space-y-8 bg-zinc-50/50 min-h-screen">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
            <p className="text-zinc-500">Welcome back to SINFONI Management System.</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => router.push('/transactions/new')}>
              <Plus className="h-4 w-4 mr-2" /> Input Nota Baru
            </Button>
            <Button variant="outline">
               <Settings className="h-4 w-4 mr-2" /> Settings
            </Button>
          </div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <Card key={i} className="overflow-hidden border-none shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <div className={cn("p-2 rounded-lg", stat.bg)}>
                  <stat.icon className={cn("h-4 w-4", stat.color)} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-zinc-500 mt-1">Total nota saat ini</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
          <Card className="lg:col-span-4 border-none shadow-sm">
            <CardHeader>
              <CardTitle>Trend Transaksi</CardTitle>
              <CardDescription>Volume pengajuan nota 6 bulan terakhir.</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.trend || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="month" 
                      stroke="#888888" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <YAxis 
                      stroke="#888888" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(value) => `${value}`}
                    />
                    <Tooltip 
                      cursor={{fill: '#f4f4f5'}}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Bar dataKey="count" fill="#18181b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-3 border-none shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Transactions</CardTitle>
                  <CardDescription>Last 5 active submissions.</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => router.push('/transactions')}>
                  View All <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
               <div className="space-y-4">
                  {data?.recent?.map((trx: any) => (
                    <div 
                      key={trx.id} 
                      onClick={() => router.push(`/transactions/${trx.slug}`)}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-zinc-50 transition border border-transparent hover:border-zinc-100 cursor-pointer"
                    >
                       <div className="flex items-center gap-3">
                          <div className="p-2 bg-zinc-100 rounded-lg">
                             <FileText className="h-4 w-4 text-zinc-600" />
                          </div>
                          <div>
                             <p className="text-sm font-semibold">{trx.invoice_number}</p>
                             <p className="text-xs text-zinc-500">{trx.dealer_name}</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="text-sm font-medium">Rp {trx.total_amount.toLocaleString()}</p>
                          <p className={cn(
                            "text-[10px] font-bold uppercase tracking-wider",
                            trx.status === 'Done' ? 'text-green-600' : 
                            trx.status === 'Reject' ? 'text-red-600' :
                            trx.status === 'Pending' ? 'text-yellow-600' : 'text-blue-600'
                          )}>{trx.status}</p>
                       </div>
                    </div>
                  ))}
               </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
