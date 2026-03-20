'use client';

import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Truck, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight, 
  FileText,
  Search
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function CustomerPortal() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [recentLoads, setRecentLoads] = useState<any[]>([]);
  const [stats, setStats] = useState({
    active: 0,
    delivered: 0,
    invoiced: 0
  });
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadPortalData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }

        // Fetch profile to get customer_id
        const { data: p } = await supabase
          .from('profiles')
          .select('*, customers(company_name)')
          .eq('id', user.id)
          .single();
        
        setProfile(p);

        if (p?.customer_id) {
          // Fetch loads using the secure view
          const { data: loads, error: loadsError } = await supabase
            .from('customer_portal_loads')
            .select('*')
            .order('created_at', { ascending: false });

          if (loads) {
            setRecentLoads(loads.slice(0, 5));
            
            // Calculate simple stats
            const active = loads.filter(l => ['Dispatched', 'In-Transit'].includes(l.status)).length;
            const delivered = loads.filter(l => l.status === 'Delivered').length;
            const invoiced = loads.filter(l => l.status === 'Invoiced').length;
            
            setStats({ active, delivered, invoiced });
          }
        }
      } catch (error) {
        console.error('Error loading portal data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadPortalData();
  }, [supabase, router]);

  const statCards = [
    { label: 'Active Shipments', value: stats.active, icon: Truck, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Completed (MTD)', value: stats.delivered, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Pending Documents', value: stats.invoiced, icon: FileText, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
              <LayoutDashboard className="h-7 w-7 text-indigo-600" />
              Customer Portal: {profile?.customers?.company_name || 'My Dashboard'}
            </h1>
            <p className="text-slate-500 font-medium text-sm">Track your shipments and view documentation in real-time.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Track by Load #" 
                className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-48 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {statCards.map((stat) => (
            <div key={stat.label} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.bg} ${stat.color} p-3 rounded-xl`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live Updates</span>
              </div>
              <div>
                <p className="text-3xl font-black text-slate-800">{loading ? '...' : stat.value}</p>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Content Area */}
        <div className="grid grid-cols-1 gap-8">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">Recent Shipments</h3>
              <Link href="/portal/loads" className="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                View All Shipments <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 text-center">Load #</th>
                    <th className="px-6 py-4">Destination</th>
                    <th className="px-6 py-4">Weight</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">ETA / Delivery</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <Clock className="h-8 w-8 text-indigo-300 animate-pulse" />
                          <span className="text-slate-400 font-medium">Fetching your loads...</span>
                        </div>
                      </td>
                    </tr>
                  ) : recentLoads.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">
                        No recent shipments found.
                      </td>
                    </tr>
                  ) : recentLoads.map((load) => (
                    <tr 
                      key={load.id} 
                      className="hover:bg-slate-50/50 transition-colors cursor-pointer" 
                      onClick={() => router.push(`/portal/loads/${load.id}`)}
                    >
                      <td className="px-6 py-4 font-bold text-slate-700 text-center">#{load.load_number}</td>
                      <td className="px-6 py-4 font-medium text-slate-600">{load.destination_zip}</td>
                      <td className="px-6 py-4 text-slate-500 font-medium">{load.total_weight} lbs</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                          load.status === 'Delivered' ? 'bg-emerald-100 text-emerald-700' :
                          load.status === 'In-Transit' ? 'bg-blue-100 text-blue-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {load.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-medium">
                        {load.delivery_date ? new Date(load.delivery_date).toLocaleDateString() : 'TBD'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
