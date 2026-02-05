'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  Store, 
  Search, 
  Save, 
  ArrowLeft,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '../../../../components/ui/checkbox';
import AuthenticatedLayout from '@/components/layout/authenticated-layout';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import { cn } from '@/lib/utils';

/* eslint-disable @typescript-eslint/no-explicit-any */

export default function UserDealerMappingPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [dealers, setDealers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedDealers, setSelectedDealers] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, dealersRes] = await Promise.all([
          fetch('/api/users'),
          fetch('/api/master/dealers')
        ]);
        
        if (usersRes.ok) {
          const allUsers = await usersRes.json();
          // Only show users with 'Dealer' role
          setUsers(allUsers.filter((u: any) => u.role === 'Dealer'));
        }
        if (dealersRes.ok) {
          setDealers(await dealersRes.json());
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      fetchMappings(selectedUserId);
    } else {
      setSelectedDealers([]);
    }
  }, [selectedUserId]);

  const fetchMappings = async (userId: string) => {
    try {
      const res = await fetch(`/api/users/mapping?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedDealers(data);
      }
    } catch (err) {
      console.error("Error fetching mappings:", err);
    }
  };

  const handleToggleDealer = (dealerId: number) => {
    setSelectedDealers(prev => 
      prev.includes(dealerId) 
        ? prev.filter(id => id !== dealerId) 
        : [...prev, dealerId]
    );
  };

  const handleSave = async () => {
    if (!selectedUserId) return;
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/users/mapping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUserId,
          dealerIds: selectedDealers
        })
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Mappings saved successfully!' });
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.message || 'Failed to save mappings' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error' });
    } finally {
      setSaving(false);
    }
  };

  const filteredDealers = dealers.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AuthenticatedLayout>
      <div className="p-8 space-y-8 bg-zinc-50/50 min-h-screen">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/users">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">User-Dealer Mapping</h1>
            <p className="text-zinc-500">Assign physical dealers to user accounts with the Dealer role.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Selection */}
          <Card className="lg:col-span-1 border-none shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-zinc-500" />
                Select Dealer User
              </CardTitle>
              <CardDescription>Choose a user to manage their dealer assignments.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {users.length === 0 && !loading && (
                    <p className="text-sm text-zinc-500 py-4">No Dealer users found.</p>
                )}
                {users.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => setSelectedUserId(user.id.toString())}
                    className={cn(
                      "w-full text-left p-3 rounded-xl transition-all border",
                      selectedUserId === user.id.toString()
                        ? "bg-zinc-900 text-white border-zinc-900 shadow-md"
                        : "bg-white text-zinc-900 border-zinc-100 hover:border-zinc-300"
                    )}
                  >
                    <div className="font-semibold">{user.name}</div>
                    <div className={cn(
                        "text-xs mt-1",
                        selectedUserId === user.id.toString() ? "text-zinc-400" : "text-zinc-500"
                    )}>
                      {user.email}
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Dealer Selection */}
          <Card className="lg:col-span-2 border-none shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Store className="h-5 w-5 text-zinc-500" />
                    Available Dealers
                  </CardTitle>
                  <CardDescription>Check the dealers this user is allowed to manage.</CardDescription>
                </div>
                {selectedUserId && (
                    <Button onClick={handleSave} disabled={saving} size="sm">
                       {saving ? "Saving..." : (
                           <>
                            <Save className="h-4 w-4 mr-2" /> Save Mapping
                           </>
                       )}
                    </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {message.text && (
                  <Alert variant={message.type === 'success' ? 'default' : 'destructive'} 
                         className={cn(message.type === 'success' && "bg-emerald-50 border-emerald-200 text-emerald-800")}>
                    {message.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                    <AlertDescription>{message.text}</AlertDescription>
                  </Alert>
              )}

              {!selectedUserId ? (
                <div className="text-center py-20 bg-zinc-50 rounded-2xl border-2 border-dashed border-zinc-200">
                   <Users className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
                   <p className="text-zinc-500">Please select a user from the list to manage mappings.</p>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                    <Input 
                        placeholder="Search dealers by name..." 
                        className="pl-9 h-11"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredDealers.map((dealer) => (
                      <div 
                        key={dealer.id}
                        onClick={() => handleToggleDealer(dealer.id)}
                        className={cn(
                          "flex items-center space-x-3 p-4 rounded-xl border cursor-pointer transition-all",
                          selectedDealers.includes(dealer.id)
                            ? "bg-zinc-50 border-zinc-900 ring-1 ring-zinc-900"
                            : "bg-white border-zinc-100 hover:border-zinc-300"
                        )}
                      >
                        <Checkbox 
                          checked={selectedDealers.includes(dealer.id)}
                          onCheckedChange={() => handleToggleDealer(dealer.id)}
                          onClick={(e: React.MouseEvent) => e.stopPropagation()}
                        />
                        <div className="flex-1 min-w-0">
                          <label className="text-sm font-semibold leading-none cursor-pointer truncate block">
                            {dealer.name}
                          </label>
                          <p className="text-[10px] text-zinc-500 mt-1 truncate">
                             {dealer.address || 'No address'}
                          </p>
                        </div>
                        {selectedDealers.includes(dealer.id) && (
                            <Badge variant="secondary" className="bg-zinc-900 text-white text-[10px]">Active</Badge>
                        )}
                      </div>
                    ))}
                    {filteredDealers.length === 0 && (
                        <p className="text-zinc-500 text-sm py-8 text-center col-span-2">No dealers found.</p>
                    )}
                  </div>
                </>
              )}
            </CardContent>
            {selectedUserId && (
                <CardFooter className="border-t pt-6 bg-zinc-50/50">
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <AlertCircle className="h-4 w-4" />
                        Selected {selectedDealers.length} dealers for this user.
                    </div>
                </CardFooter>
            )}
          </Card>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
