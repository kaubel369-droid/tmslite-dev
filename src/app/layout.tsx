import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Link from 'next/link';
import { PackageOpen, LogOut, Shield } from 'lucide-react';
import { createClient } from '@/utils/supabase/server';
import { signout } from '@/app/login/actions';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TMSLite Dev',
  description: 'Direct Carrier TMS and Rate Shop',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let isAdmin = false;
  let userInitial = '';

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, first_name')
      .eq('id', user.id)
      .single()

    isAdmin = profile?.role === 'Admin';
    userInitial = profile?.first_name?.[0] || user.email?.[0]?.toUpperCase() || 'U';
  }

  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-white flex flex-col`}>
        {user && (
          <nav className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white shadow-sm">
            <div className="flex h-16 items-center px-6 max-w-7xl mx-auto w-full justify-between">
              <div className="flex items-center gap-8">
                <Link href="/" className="flex items-center gap-2 text-indigo-700 font-bold text-lg tracking-tight">
                  <PackageOpen className="h-6 w-6" />
                  TMSLite
                </Link>
                <div className="flex gap-6 font-medium text-sm text-slate-600 hidden md:flex">
                  <Link href="/" className="hover:text-indigo-600 transition-colors">Rate Shop</Link>
                  <Link href="/loads" className="hover:text-indigo-600 transition-colors">Load Board</Link>
                  <Link href="/customers" className="hover:text-indigo-600 transition-colors">Customers</Link>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {isAdmin && (
                  <Link href="/admin/users" className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-indigo-700 transition-colors">
                    <Shield className="h-4 w-4" />
                    <span className="hidden sm:inline">Admin</span>
                  </Link>
                )}

                <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                  <div className="flex items-center justify-center bg-indigo-100 text-indigo-700 font-bold h-8 w-8 rounded-full border border-indigo-200">
                    {userInitial}
                  </div>
                  <form action={signout}>
                    <button className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-red-600 transition-colors" title="Sign Out">
                      <LogOut className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </nav>
        )}
        <main className="flex-1">
          {children}
        </main>
      </body>
    </html>
  );
}
