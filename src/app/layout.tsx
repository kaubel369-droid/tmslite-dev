import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Link from 'next/link';
import { PackageOpen } from 'lucide-react';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TMSLite Dev',
  description: 'Direct Carrier TMS and Rate Shop',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-white flex flex-col`}>
        <nav className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white shadow-sm">
          <div className="flex h-16 items-center px-6 max-w-7xl mx-auto w-full justify-between">
            <Link href="/" className="flex items-center gap-2 text-indigo-700 font-bold text-lg tracking-tight">
              <PackageOpen className="h-6 w-6" />
              TMSLite
            </Link>
            <div className="flex gap-6 font-medium text-sm text-slate-600">
              <Link href="/" className="hover:text-indigo-600 transition-colors">Rate Shop</Link>
              <Link href="/loads" className="hover:text-indigo-600 transition-colors">Load Board</Link>
              <Link href="/customers" className="hover:text-indigo-600 transition-colors">Customers</Link>
            </div>
          </div>
        </nav>
        <main className="flex-1">
          {children}
        </main>
      </body>
    </html>
  );
}
