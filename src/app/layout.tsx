import type { Metadata, Viewport } from 'next';
import './globals.css';
import { StoreProvider } from '@/lib/store';
import { AuthProvider } from '@/lib/auth';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from '@/components/error-boundary';
import { NavigationPersistenceProvider } from '@/components/NavigationPersistenceProvider';

export const metadata: Metadata = {
  title: 'MR Route Planner',
  description: 'Mobile-first medical representative route planner',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8fafc' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning data-font-size="default">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('mr-route-planner-v1');if(t){var s=JSON.parse(t);var st=s.settings||{};var th=st.theme;var fs=st.fontSize;var m=window.matchMedia('(prefers-color-scheme: dark)').matches;if(th==='dark'||(th!=='light'&&m)){document.documentElement.classList.add('dark');}if(fs==='small'||fs==='default'||fs==='large'||fs==='extra-large'){document.documentElement.dataset.fontSize=fs;}}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 antialiased">
        <ErrorBoundary>
          <AuthProvider>
            <NavigationPersistenceProvider>
              <StoreProvider>{children}</StoreProvider>
            </NavigationPersistenceProvider>
          </AuthProvider>
        </ErrorBoundary>
        <Toaster 
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: 'rgb(51 65 85)',
              color: 'rgb(248 250 252)',
              borderRadius: '0.75rem',
              padding: '12px 16px',
              fontSize: '14px',
              fontWeight: '600',
            },
            success: {
              iconTheme: {
                primary: 'rgb(16 185 129)',
                secondary: 'rgb(248 250 252)',
              },
            },
            error: {
              iconTheme: {
                primary: 'rgb(239 68 68)',
                secondary: 'rgb(248 250 252)',
              },
            },
          }}
        />
      </body>
    </html>
  );
}
