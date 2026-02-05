'use client';

import { useEffect, useState } from 'react';

export interface UserSession {
  id: number;
  name: string;
  email: string;
  role: 'Superadmin' | 'Dealer' | 'Finance';
}

export function useAuth() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch('/api/auth/me'); // We'll need this endpoint
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch (err) {
        console.error('Failed to fetch session', err);
      } finally {
        setLoading(false);
      }
    }

    fetchSession();
  }, []);

  return { user, loading };
}
