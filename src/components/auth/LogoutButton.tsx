'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthService } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { LogOut, Loader2 } from 'lucide-react';
import { LogoutConfirmationDialog } from './LogoutConfirmationDialog';
import { NavigationStateManager } from '@/lib/navigation';

interface LogoutButtonProps {
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showText?: boolean;
  className?: string;
}

export function LogoutButton({ 
  variant = 'ghost', 
  size = 'default',
  showText = true,
  className = ''
}: LogoutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  async function handleConfirmLogout() {
    setLoading(true);
    try {
      // Clear navigation state on manual logout
      NavigationStateManager.clearState();
      
      await AuthService.signOut();
      
      // Redirect to public directory (home page)
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
      alert('Failed to logout. Please try again.');
    } finally {
      setLoading(false);
      setShowDialog(false);
    }
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setShowDialog(true)}
        disabled={loading}
        className={className}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <LogOut className="w-4 h-4" />
        )}
        {showText && (
          <span className="ml-2">
            {loading ? 'Logging out...' : 'Logout'}
          </span>
        )}
      </Button>
      <LogoutConfirmationDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        onConfirm={handleConfirmLogout}
        isLoading={loading}
      />
    </>
  );
}
