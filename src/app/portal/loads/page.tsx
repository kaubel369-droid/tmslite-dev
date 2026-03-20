'use client';

import { useState, useEffect } from 'react';
import { 
  Truck, 
  Search, 
  Filter,
  ArrowRight,
  ChevronRight,
  PackageCheck
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CustomerLoads() {
  const router = useRouter();
  const [loads, setLoads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const supabase = createClient();

  useEffect(() => {
    async function fetchLoads() {
      try {
        const { data, error } = await supabase
          .from('customer_portal_loads')
          .select('*')
          .order('created_at', { ascending: false });

        if (data) setLoads(data);
      } catch (error) {
        console.error('Error fetching loads:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchLoads();
  }, [supabase]);

  const filteredLoads = loads.filter(load => {
    const matchesSearch = load.load_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || 
      (statusFilter === 'Active' && !['Delivered', 'Invoiced', 'Cancelled'].includes(load.status)) ||
      (statusFilter === 'History' && ['Delivered', 'Invoiced'].includes(load.status));
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
          <Link href="/portal" className="hover:text-indigo-600 transition-colors">Portal</Link>
          <ChevronRight size={12} />
          <span className="text-slate-800">My Loads</span>
        </nav>

        {/* Header & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <PackageCheck className="h-7 w-7 text-indigo-600" />
            Shipment History
          </h1>
          
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search Load #..." 
                className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-64 transition-all"
              />
            </div>
            <div className="flex bg-white border border-slate-200 rounded-xl p-1 gap-1">
              {['All', 'Active', 'History'].map((f) => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    statusFilter === f ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Grid of Load Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            Array(6).fill(0).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 p-6 h-48 animate-pulse shadow-sm">
                <div className="h-6 w-24 bg-slate-100 rounded mb-4" />
                <div className="h-4 w-full bg-slate-50 rounded mb-2" />
                <div className="h-4 w-2/3 bg-slate-50 rounded" />
              </div>
            ))
          ) : filteredLoads.length === 0 ? (
            <div className="col-span-full py-20 text-center">
              <div className="inline-flex h-16 w-16 items-center justify-center bg-slate-100 text-slate-400 rounded-full mb-4">
                <Filter size={24} />
              </div>
              <p className="text-slate-500 font-bold text-lg">No loads found matching filters.</p>
              <button onClick={() => {setSearchTerm(''); setStatusFilter('All');}} className="text-indigo-600 font-bold text-sm mt-2 hover:underline">
                Reset all filters
              </button>
            </div>
          ) : filteredLoads.map((load) => (
            <div 
              key={load.id} 
              onClick={() => router.push(`/portal/loads/${load.id}`)}
              className="group bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all cursor-pointer relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight className="text-indigo-600 h-5 w-5" />
              </div>

              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-black text-slate-800">#{load.load_number}</span>
                <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter shadow-sm border ${
                  load.status === 'Delivered' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                  load.status === 'In-Transit' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                  'bg-indigo-50 text-indigo-700 border-indigo-100'
                }`}>
                  {load.status}
                </span>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center pt-1.5 shrink-0">
                    <div className="h-2 w-2 rounded-full bg-slate-300" />
                    <div className="w-px h-6 bg-slate-200" />
                    <div className="h-2 w-2 rounded-full bg-indigo-500" />
                  </div>
                  <div className="space-y-3">
                    <div className="text-xs">
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Origin Zip</p>
                      <p className="text-slate-700 font-bold">{load.origin_zip}</p>
                    </div>
                    <div className="text-xs">
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Destination Zip</p>
                      <p className="text-slate-700 font-bold">{load.destination_zip}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {load.total_weight} lbs • {load.nmfc_class || 'LTL'}
                  </div>
                  <div className="text-xs font-black text-slate-800">
                    {new Date(load.pickup_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
