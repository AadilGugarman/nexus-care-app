'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Upload, AlertCircle, ClipboardCheck, BarChart3, UserCog } from 'lucide-react';
import { AccountMenu } from '@/components/admin/AccountMenu';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Admin Header */}
      <header className="sticky top-0 z-50 bg-slate-900 border-b border-slate-700">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <div>
              <h1 className="text-white font-bold text-xl tracking-tight">Admin Panel</h1>
              <p className="text-slate-400 text-sm">Master Data Management</p>
            </div>
          </div>
          
          {/* Account Menu */}
          <AccountMenu />
        </div>
      </header>

      {/* Admin Navigation */}
      <nav className="sticky top-[73px] z-40 bg-slate-800 border-b border-slate-700">
        <div className="px-6 py-3 flex gap-2 overflow-x-auto scrollbar-hide">
          <NavLink href="/admin" icon={Home}>Dashboard</NavLink>
          <NavLink href="/admin/analytics" icon={BarChart3}>Analytics</NavLink>
          <NavLink href="/admin/reviews" icon={ClipboardCheck}>Reviews</NavLink>
          <NavLink href="/admin/users" icon={UserCog}>Users</NavLink>
          <NavLink href="/admin/doctors" icon={Users}>Doctors</NavLink>
          <NavLink href="/admin/import" icon={Upload}>Import</NavLink>
          <NavLink href="/admin/quality" icon={AlertCircle}>Quality</NavLink>
        </div>
      </nav>

      {/* Content */}
      <main className="pb-6">
        {children}
      </main>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

function NavLink({ 
  href, 
  icon: Icon, 
  children 
}: { 
  href: string; 
  icon: any; 
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive = pathname === href;
  
  return (
    <Link
      href={href}
      className={`
        flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-semibold text-sm whitespace-nowrap
        transition-all duration-200 ease-out
        ${isActive 
          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25 scale-105' 
          : 'text-slate-400 hover:text-white hover:bg-slate-700/60 hover:scale-105'
        }
      `}
    >
      <Icon className={`w-4.5 h-4.5 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
      <span className="tracking-wide">{children}</span>
    </Link>
  );
}
