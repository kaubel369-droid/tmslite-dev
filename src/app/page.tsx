'use client';

import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Truck, 
  Users, 
  TrendingUp, 
  AlertCircle, 
  Clock, 
  ArrowUpRight, 
  Activity,
  Plus
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

export default function Dashboard() {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    async function getProfile() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        setRole(profile?.role || 'User');
      }
    }
    getProfile();
  }, []);

  const stats = [
    { id: 'active-loads', label: 'Active Loads', value: '12', icon: Truck, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'new-loads', label: 'New Loads', value: '4', icon: Plus, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: 'active-customers', label: 'Active Customers', value: '28', icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { 
      id: 'monthly-revenue',
      label: 'Monthly Revenue', 
      value: '$42,500', 
      icon: TrendingUp, 
      color: 'text-violet-600', 
      bg: 'bg-violet-50',
      roleRestricted: true 
    },
  ];

  const visibleStats = stats.filter(stat => {
    if (stat.roleRestricted) {
      return role === 'Admin' || role === 'Supervisor';
    }
    return true;
  });

  const recentActivity = [
    { id: 1, type: 'load', title: 'Load #5829 Delivered', time: '2 hours ago', status: 'Completed' },
    { id: 2, type: 'load', title: 'New Quote for ABC Corp', time: '4 hours ago', status: 'Pending' },
    { id: 3, type: 'alert', title: 'Delayed Shipment #5810', time: '5 hours ago', status: 'Alert' },
    { id: 4, type: 'customer', title: 'New Customer: Zenith Logistics', time: '1 day ago', status: 'Active' },
  ];

  return (
    <div id="dashboard-container" className="min-h-screen bg-slate-50/50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div id="dashboard-header" className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
              <LayoutDashboard className="h-7 w-7 text-indigo-600" />
              Operational Dashboard
            </h1>
            <p className="text-slate-500 font-medium">Welcome back! Here's what's happening today.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm">
              <Activity className="h-4 w-4" />
              View Reports
            </button>
            <Link 
              href="/loads" 
              className="flex items-center gap-2 bg-indigo-600 px-4 py-2 rounded-xl text-sm font-bold text-white hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-100"
            >
              <Plus className="h-4 w-4" />
              Create Load
            </Link>
          </div>
        </div>

        {/* AI Command Bar */}
        <div id="ai-command-container" className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden flex items-center p-2">
            <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 shrink-0">
              <Activity className="h-6 w-6 animate-pulse" />
            </div>
            <input 
              type="text" 
              placeholder="Ask AI to 'Create a load', 'Find a customer', or 'Show transit alerts'..." 
              className="flex-1 bg-transparent border-none focus:ring-0 px-4 text-slate-700 font-medium placeholder:text-slate-400 text-lg"
            />
            <div className="flex items-center gap-2 pr-2">
              <kbd className="hidden sm:inline-flex h-6 items-center gap-1 rounded border border-slate-200 bg-slate-50 px-1.5 font-mono text-[10px] font-medium text-slate-500">
                <span className="text-xs">⌘</span>K
              </kbd>
              <button className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-md active:scale-95">
                Run Command
              </button>
            </div>
          </div>
          {/* Subtle AI gradient glow under the input */}
          <div className="absolute bottom-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-20"></div>
        </div>

        {/* Stats Grid */}
        <div id="stats-grid" className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${visibleStats.length} gap-4`}>
          {visibleStats.map((stat) => (
            <div key={stat.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.bg} ${stat.color} p-2.5 rounded-xl`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full flex items-center gap-1">
                  <ArrowUpRight className="h-3 w-3" />
                  +12%
                </span>
              </div>
              <div>
                <p className="text-3xl font-black text-slate-800">{stat.value}</p>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div id="main-dashboard-content" className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-800">Recent Shipments</h3>
                <Link href="/loads" className="text-sm font-bold text-indigo-600 hover:underline">View All</Link>
              </div>
              <div className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-4">ID</th>
                        <th className="px-6 py-4">Customer</th>
                        <th className="px-6 py-4">Route</th>
                        <th className="px-6 py-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-sm">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <tr key={i} className="hover:bg-slate-50/50 transition-colors cursor-pointer">
                          <td className="px-6 py-4 font-bold text-slate-700">#58{20 + i}</td>
                          <td className="px-6 py-4 font-medium text-slate-600">Global Logistics Inc.</td>
                          <td className="px-6 py-4 text-slate-500 font-medium">Chicago, IL → Dallas, TX</td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                              i % 2 === 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                            }`}>
                              {i % 2 === 0 ? 'Delivered' : 'In Transit'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Feed */}
          <div id="activity-feed" className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-full">
              <div className="p-6 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-800">Activity Log</h3>
              </div>
              <div className="p-6 space-y-6">
                {recentActivity.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                      item.type === 'alert' ? 'bg-red-50 text-red-600' : 
                      item.type === 'load' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
                    }`}>
                      {item.type === 'alert' ? <AlertCircle className="h-5 w-5" /> : 
                       item.type === 'load' ? <Truck className="h-5 w-5" /> : <Users className="h-5 w-5" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 line-clamp-1">{item.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {item.time}
                        </span>
                        <span className="h-1 w-1 bg-slate-300 rounded-full" />
                        <span className={`text-[10px] font-bold uppercase tracking-tighter ${
                          item.status === 'Alert' ? 'text-red-500' : 'text-slate-500'
                        }`}>{item.status}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full py-4 text-sm font-bold text-slate-500 hover:text-indigo-600 hover:bg-slate-50 transition-all border-t border-slate-100">
                View Full Logs
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
