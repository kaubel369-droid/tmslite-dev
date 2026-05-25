'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Activity,
  AlertCircle, 
  Clock, 
  Truck, 
  Users, 
  Zap,
  Search,
  Filter
} from 'lucide-react';
import { useRouter } from 'next/navigation';

type LogItem = {
  id: string;
  type: string;
  title: string;
  time: string;
  status: string;
};

export default function LogsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

  useEffect(() => {
    async function fetchLogs() {
      try {
        const response = await fetch('/api/logs');
        const data = await response.json();
        if (data.activityLog) {
          setLogs(data.activityLog);
        }
      } catch (error) {
        console.error('Error fetching logs:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          log.status.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'All' ? true : log.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const getLogIcon = (type: string) => {
    switch(type) {
      case 'alert': return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'spot-quote': return <Zap className="h-5 w-5 text-amber-600" />;
      case 'load': return <Truck className="h-5 w-5 text-blue-600" />;
      case 'customer': return <Users className="h-5 w-5 text-emerald-600" />;
      default: return <Activity className="h-5 w-5 text-slate-600" />;
    }
  };

  const getLogBg = (type: string) => {
    switch(type) {
      case 'alert': return 'bg-red-50';
      case 'spot-quote': return 'bg-amber-50';
      case 'load': return 'bg-blue-50';
      case 'customer': return 'bg-emerald-50';
      default: return 'bg-slate-50';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
              <Activity className="h-7 w-7 text-indigo-600" />
              Activity Logs
            </h1>
            <p className="text-slate-500 font-medium mt-1">Full history of system activity, alerts, and user actions.</p>
          </div>
          <Link 
            href="/" 
            className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors"
          >
            &larr; Back to Dashboard
          </Link>
        </header>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search logs..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <select 
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-white border border-slate-200 text-sm font-medium text-slate-700 py-2 pl-3 pr-8 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="All">All Types</option>
                <option value="load">Loads</option>
                <option value="customer">Customers</option>
                <option value="spot-quote">Spot Quotes</option>
                <option value="alert">Alerts</option>
              </select>
            </div>
          </div>

          <div className="p-0">
            {loading ? (
              <div className="p-12 flex justify-center items-center">
                <Activity className="h-8 w-8 text-indigo-300 animate-spin" />
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="p-12 text-center">
                <Activity className="h-12 w-12 text-slate-200 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-slate-700">No logs found</h3>
                <p className="text-sm text-slate-500 mt-1">Try adjusting your filters or search query.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredLogs.map((log) => (
                  <div key={log.id} className="p-6 flex items-start sm:items-center gap-4 hover:bg-slate-50 transition-colors">
                    <div className={`h-12 w-12 rounded-full flex items-center justify-center shrink-0 ${getLogBg(log.type)}`}>
                      {getLogIcon(log.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-bold text-slate-800 line-clamp-1">{log.title}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          {new Date(log.time).toLocaleDateString()} at {new Date(log.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="h-1 w-1 bg-slate-300 rounded-full" />
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                          log.status === 'Alert' ? 'bg-red-50 text-red-600' : 
                          log.status === 'Pending' ? 'bg-amber-50 text-amber-600' : 
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {log.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
