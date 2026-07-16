import Link from 'next/link';
import { Home, Users, Upload, AlertCircle, ClipboardCheck } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Admin Header */}
      <header className="sticky top-0 z-50 bg-slate-900 border-b border-slate-700">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <div>
              <h1 className="text-white font-semibold text-lg">Admin Panel</h1>
              <p className="text-slate-400 text-xs">Master Data Management</p>
            </div>
          </div>
          <Link
            href="/"
            className="text-slate-400 hover:text-white text-sm flex items-center gap-1"
          >
            ← Back to App
          </Link>
        </div>
      </header>

      {/* Admin Navigation */}
      <nav className="bg-slate-800 border-b border-slate-700">
        <div className="flex overflow-x-auto">
          <NavLink href="/admin" icon={Home}>Dashboard</NavLink>
          <NavLink href="/admin/reviews" icon={ClipboardCheck}>Reviews</NavLink>
          <NavLink href="/admin/doctors" icon={Users}>Doctors</NavLink>
          <NavLink href="/admin/import" icon={Upload}>Import</NavLink>
          <NavLink href="/admin/quality" icon={AlertCircle}>Quality</NavLink>
        </div>
      </nav>

      {/* Content */}
      <main className="pb-6">
        {children}
      </main>
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
  return (
    <Link
      href={href}
      className="flex items-center gap-2 px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-700/50 border-b-2 border-transparent hover:border-blue-500 whitespace-nowrap transition-colors"
    >
      <Icon className="w-4 h-4" />
      <span className="text-sm font-medium">{children}</span>
    </Link>
  );
}
