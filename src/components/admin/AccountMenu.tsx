'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { User, LogOut, ArrowLeft, ChevronDown } from 'lucide-react';
import { LogoutConfirmationDialog } from '@/components/auth/LogoutConfirmationDialog';

export function AccountMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { profile, signOut } = useAuth();
  const router = useRouter();

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Close menu on Escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setShowLogoutDialog(false);
      }
    }

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await signOut();
      // Redirect to login page after successful logout
      router.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
      alert('Failed to logout. Please try again.');
    }
  };

  const handleBackToApp = () => {
    setIsOpen(false);
    router.push('/');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <div className="relative" ref={menuRef}>
        {/* Account Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 transition-all duration-200 group"
          aria-label="Account menu"
          aria-expanded={isOpen}
        >
          {/* Avatar */}
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <span className="text-white font-bold text-sm">
              {profile?.full_name ? getInitials(profile.full_name) : 'AD'}
            </span>
          </div>

          {/* Name & Email */}
          <div className="hidden md:block text-left">
            <div className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">
              {profile?.full_name || 'Admin'}
            </div>
            <div className="text-xs text-slate-400">
              {profile?.email || 'admin@example.com'}
            </div>
          </div>

          {/* Dropdown Icon */}
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div
            className="absolute right-0 mt-2 w-72 bg-slate-800 rounded-xl shadow-2xl border border-slate-700 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200"
            role="menu"
          >
            {/* Profile Section */}
            <div className="p-4 border-b border-slate-700 bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <span className="text-white font-bold text-lg">
                    {profile?.full_name ? getInitials(profile.full_name) : 'AD'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-white truncate">
                    {profile?.full_name || 'Admin User'}
                  </div>
                  <div className="text-xs text-slate-400 truncate">
                    {profile?.email || 'admin@example.com'}
                  </div>
                  <div className="mt-1">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      Administrator
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              {/* My Profile */}
              <button
                onClick={() => {
                  setIsOpen(false);
                  router.push('/admin/profile');
                }}
                className="w-full px-4 py-2.5 flex items-center gap-3 text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors text-left"
                role="menuitem"
              >
                <User className="w-4 h-4" />
                <span className="text-sm font-medium">My Profile</span>
              </button>

              {/* Back to App */}
              <button
                onClick={handleBackToApp}
                className="w-full px-4 py-2.5 flex items-center gap-3 text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors text-left"
                role="menuitem"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm font-medium">Back to App</span>
              </button>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-700" />

            {/* Logout */}
            <div className="py-2">
              <button
                onClick={() => {
                  setIsOpen(false);
                  setShowLogoutDialog(true);
                }}
                className="w-full px-4 py-2.5 flex items-center gap-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors text-left"
                role="menuitem"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Logout Confirmation Dialog */}
      <LogoutConfirmationDialog
        open={showLogoutDialog}
        onOpenChange={setShowLogoutDialog}
        onConfirm={handleLogout}
        isLoading={isLoggingOut}
      />
    </>
  );
}
