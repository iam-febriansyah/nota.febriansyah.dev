'use client';

import { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  ShieldCheck, 
  Save, 
  Lock,
  ArrowLeft
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
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import AuthenticatedLayout from '@/components/layout/authenticated-layout';

/* eslint-disable @typescript-eslint/no-explicit-any */

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ name: '', password: '', confirmPassword: '' });
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/users/profile');
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setFormData(prev => ({ ...prev, name: data.name }));
      }
    } catch (err) {
      console.error('Failed to fetch profile', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    if (formData.password && formData.password !== formData.confirmPassword) {
      setStatus({ type: 'error', message: 'Passwords do not match' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          password: formData.password || undefined
        })
      });

      const data = await res.json();
      if (res.ok) {
        setStatus({ type: 'success', message: 'Profile updated successfully!' });
        setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
        fetchProfile();
      } else {
        setStatus({ type: 'error', message: data.message || 'Failed to update profile' });
      }
    } catch {
      setStatus({ type: 'error', message: 'Connection error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="p-6 h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="p-8 max-w-4xl mx-auto space-y-8 bg-zinc-50/50 min-h-screen">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="hover:bg-white">
            <Link href="/dashboard">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Your Profile</h1>
            <p className="text-zinc-500">Manage your account information and security.</p>
          </div>
        </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" /> Basic Information
              </CardTitle>
              <CardDescription>Update your display name and contact details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {status && (
                <Alert className={status.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'destructive'}>
                  <AlertDescription>{status.message}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="email" 
                    value={profile?.email} 
                    disabled 
                    className="pl-10 bg-zinc-50"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">Email cannot be changed. Contact admin for assistance.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="role" 
                    value={profile?.role} 
                    disabled 
                    className="pl-10 bg-zinc-50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Display Name</Label>
                <Input 
                  id="name" 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter your full name"
                  required
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" /> Security
              </CardTitle>
              <CardDescription>Change your password. Leave blank to keep current password.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input 
                  id="password" 
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="At least 8 characters"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input 
                  id="confirmPassword" 
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Repeat your new password"
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-3 pt-4">
              <Button type="submit" disabled={submitting}>
                <Save className="mr-2 h-4 w-4" /> 
                {submitting ? 'Updating...' : 'Save Changes'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </form>
      </div>
    </AuthenticatedLayout>
  );
}
