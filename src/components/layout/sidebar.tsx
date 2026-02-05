'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Database, 
  FileText, 
  Users, 
  Package, 
  CreditCard,
  LogOut,
  Plus,
  User,
  Store
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UserSession } from '@/hooks/use-auth';

interface SidebarProps {
  user: UserSession;
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const routes = [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      href: '/dashboard',
      color: 'text-sky-500',
    },
    {
      label: 'Update Profile',
      icon: User,
      href: '/profile',
      color: 'text-emerald-500',
    },
    {
      label: 'Master Data',
      icon: Database,
      href: '/master',
      color: 'text-violet-500',
      role: ['Superadmin'],
      subItems: [
        { label: 'Barang', href: '/master/barang', icon: Package },
        { label: 'Dealers', href: '/master/dealers', icon: Users },
        { label: 'Prices', href: '/master/prices', icon: CreditCard },
      ]
    },
    {
      label: 'Transactions',
      icon: FileText,
      href: '/transactions',
      color: 'text-pink-700',
      role: ['Superadmin', 'Finance', 'Dealer'],
      subItems: [
        { label: 'Daftar Nota', href: '/transactions', icon: FileText },
        { label: 'Input Nota', href: '/transactions/new', icon: Plus, role: ['Dealer', 'Superadmin'] },
      ]
    },
    {
        label: 'User Management',
        icon: Users,
        href: '/admin/users',
        color: 'text-orange-700',
        role: ['Superadmin'],
        subItems: [
          { label: 'List Users', href: '/admin/users', icon: Users },
          { label: 'Dealer Mapping', href: '/admin/users/mapping', icon: Store },
        ]
    }
  ];

  const filteredRoutes = routes.filter(route => !route.role || route.role.includes(user.role));

  return (
    <div className="flex flex-col h-full bg-[#111827] text-white overflow-hidden">
      <div className="px-3 py-6">
        <Link href="/dashboard" className="flex items-center pl-3">
          <h1 className="text-2xl font-bold">
            SINFONI
          </h1>
        </Link>
      </div>

      <ScrollArea className="flex-1 px-3">
        <div className="space-y-1 pb-4">
          {filteredRoutes.map((route) => (
            <div key={route.href}>
              <Link
                href={route.href}
                className={cn(
                  "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition",
                  pathname === route.href ? "text-white bg-white/10" : "text-zinc-400",
                )}
              >
                <div className="flex items-center flex-1">
                  <route.icon className={cn("h-5 w-5 mr-3", route.color)} />
                  {route.label}
                </div>
              </Link>
              {route.subItems && pathname.startsWith(route.href) && (
                <div className="ml-8 mt-1 space-y-1">
                  {route.subItems.map((subItem) => (
                    <Link
                      key={subItem.href}
                      href={subItem.href}
                      className={cn(
                        "text-xs group flex p-2 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition",
                        pathname === subItem.href ? "text-white bg-white/10" : "text-zinc-400",
                      )}
                    >
                      <div className="flex items-center flex-1">
                        <subItem.icon className="h-4 w-4 mr-3" />
                        {subItem.label}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="px-4 py-4 border-t border-white/10 bg-black/40">
        <div className="flex items-center justify-between gap-x-3 px-2">
          <div className="flex flex-col overflow-hidden">
            <p className="text-sm font-semibold text-white truncate">{user.name}</p>
            <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-medium">
              {user.role}
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleLogout}
            className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-red-500/20 active:bg-red-500/30 transition group shrink-0"
            title="Logout Account"
          >
            <LogOut className="h-4 w-4 text-red-500 group-hover:scale-110 transition" />
          </Button>
        </div>
      </div>
    </div>
  );
}
