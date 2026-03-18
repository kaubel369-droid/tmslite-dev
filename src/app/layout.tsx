import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import Link from 'next/link';
import { PackageOpen, LogOut, Shield, TrendingUp } from 'lucide-react';
import { createClient } from '@/utils/supabase/server';
import { signout } from '@/app/login/actions';
import Sidebar from '@/components/Sidebar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TMSLite Dashboard',
  description: 'Freight Management Dashboard',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  let userInitial = '';
  let profile = null;

  if (user) {
    const { data: p } = await supabase
      .from('profiles')
      .select('role, first_name')
      .eq('id', user.id)
      .single()
    
    profile = p;
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
                  <Link href="/" className="hover:text-indigo-600 transition-colors">Dashboard</Link>
                  <Link href="/loads" className="hover:text-indigo-600 transition-colors">Load Board</Link>
                  <div className="relative group py-5 -my-5">
                    <button className="hover:text-indigo-600 transition-colors flex items-center gap-1 h-full font-medium">
                      Customers
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70 group-hover:rotate-180 transition-transform duration-200"><path d="m6 9 6 6 6-6" /></svg>
                    </button>
                    <div className="absolute left-0 top-full mt-0 pt-1 w-52 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      <div className="bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden py-1">
                        <Link href="/customers" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 border-b border-slate-100">Customers</Link>
                        <Link href="/sales-leads" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 border-b border-slate-100 last:border-0">Sales Leads</Link>
                        <Link href="/shipper-consignees" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 border-b border-slate-100 last:border-0">Shippers / Consignees</Link>
                      </div>
                    </div>
                  </div>
                  <Link href="/carriers" className="hover:text-indigo-600 transition-colors">Carriers</Link>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {(profile?.role === 'Admin' || profile?.role === 'Supervisor') && (
                  <Link href="/admin/reports" className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-indigo-700 transition-colors">
                    <TrendingUp className="h-4 w-4" />
                    <span className="hidden sm:inline">Reports</span>
                  </Link>
                )}

                {profile?.role === 'Admin' && (
                  <Link href="/admin/users" className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-indigo-700 transition-colors pl-4 border-l border-slate-200">
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
        {user ? (
          <div className="flex flex-1 overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-y-auto bg-slate-50/50">
              {children}
            </main>
          </div>
        ) : (
          <main className="flex-1">
            {children}
          </main>
        )}
      </body>
    </html>
  );
}
