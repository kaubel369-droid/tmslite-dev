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
  Plus,
  Zap
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [command, setCommand] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);
  
  const [statsData, setStatsData] = useState<any>(null);
  const [recentShipments, setRecentShipments] = useState<any[]>([]);
  const [activityData, setActivityData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

    async function fetchDashboardData() {
      try {
        const response = await fetch('/api/dashboard/stats');
        const data = await response.json();
        if (data) {
          setStatsData(data.stats);
          setRecentShipments(data.recentShipments || []);
          setActivityData(data.activityLog || []);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    getProfile();
    fetchDashboardData();
  }, []);

  const handleRunCommand = async () => {
    if (!command.trim()) return;
    
    setIsProcessing(true);
    setFeedback(null);

    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const input = command.toLowerCase();
    
    if (input.includes('load') || input.includes('board') || input.includes('shipment')) {
      setFeedback({ type: 'success', message: 'Navigating to Load Board...' });
      setTimeout(() => router.push('/loads'), 500);
    } else if (input.includes('customer') || input.includes('client')) {
      setFeedback({ type: 'success', message: 'Navigating to Customers...' });
      setTimeout(() => router.push('/customers'), 500);
    } else if (input.includes('carrier') || input.includes('truck')) {
      setFeedback({ type: 'success', message: 'Navigating to Carriers...' });
      setTimeout(() => router.push('/carriers'), 500);
    } else if (input.includes('lead') || input.includes('sales')) {
      setFeedback({ type: 'success', message: 'Navigating to Sales Leads...' });
      setTimeout(() => router.push('/sales-leads'), 500);
    } else if (input.includes('admin') || input.includes('manage') || input.includes('user')) {
      setFeedback({ type: 'success', message: 'Navigating to Admin Settings...' });
      setTimeout(() => router.push('/admin/users'), 500);
    } else if (input.includes('shipper') || input.includes('consignee')) {
      setFeedback({ type: 'success', message: 'Navigating to Shippers & Consignees...' });
      setTimeout(() => router.push('/shipper-consignees'), 500);
    } else if (input.includes('report') || input.includes('stats')) {
      setFeedback({ type: 'info', message: 'Reporting features are coming soon to the dashboard.' });
    } else {
      setFeedback({ 
        type: 'error', 
        message: "I'm not sure how to help with that yet. Try 'Create a load' or 'Show customers'." 
      });
    }

    setIsProcessing(false);
  };

  const stats = [
    { id: 'active-loads', label: 'Active Loads', value: loading ? '...' : (statsData?.activeLoads || '0'), icon: Truck, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'new-loads', label: 'New Loads', value: loading ? '...' : (statsData?.newLoads || '0'), icon: Plus, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: 'active-customers', label: 'Active Customers', value: loading ? '...' : (statsData?.activeCustomers || '0'), icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { 
      id: 'monthly-revenue',
      label: 'Monthly Revenue', 
      value: loading ? '...' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(statsData?.monthlyRevenue || 0), 
      icon: TrendingUp, 
      color: 'text-violet-600', 
      bg: 'bg-violet-50',
      roleRestricted: true 
    },
    { 
      id: 'pending-quotes',
      label: 'Pending Spot Quotes', 
      value: loading ? '...' : (statsData?.pendingQuotes || '0'), 
      icon: Zap, 
      color: 'text-amber-600', 
      bg: 'bg-amber-50',
      roleRestricted: true 
    },
  ];

  const visibleStats = stats.filter(stat => {
    if (stat.roleRestricted) {
      return role === 'Admin' || role === 'Supervisor';
    }
    return true;
  });

  const recentActivity = activityData.length > 0 ? activityData.map(item => ({
    ...item,
    time: new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + (new Date(item.time).toDateString() === new Date().toDateString() ? 'Today' : new Date(item.time).toLocaleDateString())
  })) : [
    { id: 'no-activity', type: 'info', title: 'No recent activity', time: '', status: 'Clean' }
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
              <Activity className={`${isProcessing ? 'animate-spin' : 'animate-pulse'} h-6 w-6`} />
            </div>
            <input 
              type="text" 
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRunCommand()}
              placeholder="Ask AI to 'Create a load', 'Find a customer', or 'Show transit alerts'..." 
              className="flex-1 bg-transparent border-none focus:ring-0 px-4 text-slate-700 font-medium placeholder:text-slate-400 text-lg"
              disabled={isProcessing}
            />
            <div className="flex items-center gap-2 pr-2">
              <kbd className="hidden sm:inline-flex h-6 items-center gap-1 rounded border border-slate-200 bg-slate-50 px-1.5 font-mono text-[10px] font-medium text-slate-500">
                <span className="text-xs">⌘</span>K
              </kbd>
              <button 
                onClick={handleRunCommand}
                disabled={isProcessing || !command.trim()}
                className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px]"
              >
                {isProcessing ? 'Thinking...' : 'Run Command'}
              </button>
            </div>
          </div>
          
          {/* Feedback Message */}
          {feedback && (
            <div className={`mt-2 ml-4 flex items-center gap-2 text-sm font-bold animate-in fade-in slide-in-from-top-1 duration-300 ${
              feedback.type === 'success' ? 'text-emerald-600' : 
              feedback.type === 'error' ? 'text-red-600' : 'text-indigo-600'
            }`}>
              {feedback.type === 'success' ? <ArrowUpRight className="h-4 w-4" /> : 
              feedback.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <Activity className="h-4 w-4" />}
              {feedback.message}
            </div>
          )}

          {/* Subtle AI gradient glow under the input */}
          <div className="absolute bottom-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-20"></div>
        </div>

        {/* Stats Grid */}
        <div id="stats-grid" className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4`}>
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
                      {loading ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-4 text-center text-slate-400">Loading shipments...</td>
                        </tr>
                      ) : recentShipments.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-4 text-center text-slate-400">No shipments found.</td>
                        </tr>
                      ) : recentShipments.map((load) => (
                        <tr key={load.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => router.push('/loads')}>
                          <td className="px-6 py-4 font-bold text-slate-700">#{load.load_number}</td>
                          <td className="px-6 py-4 font-medium text-slate-600">{load.customer?.company_name || 'Generic Customer'}</td>
                          <td className="px-6 py-4 text-slate-500 font-medium">{load.origin_zip || '--'} → {load.destination_zip || '--'}</td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                              ['Delivered', 'Invoiced'].includes(load.status) ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                            }`}>
                              {load.status}
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
                      item.type === 'spot-quote' ? 'bg-amber-50 text-amber-600' :
                      item.type === 'load' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
                    }`}>
                      {item.type === 'alert' ? <AlertCircle className="h-5 w-5" /> : 
                       item.type === 'spot-quote' ? <Zap className="h-5 w-5" /> :
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
