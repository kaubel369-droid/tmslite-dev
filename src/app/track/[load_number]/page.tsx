'use client';

import { useState, useEffect } from 'react';
import { 
  Package, 
  MapPin, 
  Clock, 
  ChevronRight, 
  Search,
  CheckCircle2,
  AlertCircle,
  Truck
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function PublicTracking() {
  const { load_number } = useParams();
  const [load, setLoad] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchPublicStatus() {
      try {
        if (!load_number) return;

        // Calling the secure function we just created
        const { data, error: functionError } = await supabase
          .rpc('get_public_tracking_info', { p_load_number: load_number });

        if (functionError) throw functionError;

        if (data && data.length > 0) {
          setLoad(data[0]);
        } else {
          setError('Load not found. Please check the Load # and try again.');
        }
      } catch (err) {
        console.error('Error fetching public status:', err);
        setError('Unable to fetch tracking info at this time.');
      } finally {
        setLoading(false);
      }
    }
    fetchPublicStatus();
  }, [load_number, supabase]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
        {/* Branding Header */}
        <div className="bg-indigo-700 p-8 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <Package size={80} />
          </div>
          <div className="relative z-10">
            <h1 className="text-3xl font-black tracking-tight mb-2">TMSLite Tracking</h1>
            <p className="text-indigo-100 font-medium text-sm">Real-time shipment visibility for your organization.</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {loading ? (
            <div className="flex flex-col items-center gap-4 py-12">
              <Truck className="h-10 w-10 text-indigo-500 animate-bounce" />
              <span className="text-slate-400 font-bold uppercase tracking-widest text-xs">Retrieving Status...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12 space-y-6">
              <div className="inline-flex h-16 w-16 items-center justify-center bg-red-50 text-red-500 rounded-full">
                <AlertCircle size={32} />
              </div>
              <div className="space-y-2">
                <p className="text-slate-800 font-black text-xl">Tracking Error</p>
                <p className="text-slate-500 font-medium max-w-xs mx-auto">{error}</p>
              </div>
              <Link href="/login" className="inline-block bg-slate-100 text-slate-700 px-6 py-2 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all">
                Return to Login
              </Link>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Load Number & Status */}
              <div className="flex items-center justify-between pb-6 border-b border-slate-100">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Load Identifier</p>
                  <p className="text-2xl font-black text-slate-900">#{load.load_number}</p>
                </div>
                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-sm border ${
                  load.status === 'Delivered' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                  load.status === 'In-Transit' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                  'bg-indigo-50 text-indigo-700 border-indigo-100'
                }`}>
                  {load.status}
                </div>
              </div>

              {/* Route */}
              <div className="flex items-center gap-6 justify-center py-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Origin</p>
                  <p className="text-lg font-black text-slate-800">{load.origin_zip}</p>
                </div>
                <div className="flex flex-col items-center gap-1 text-slate-300">
                   <ChevronRight />
                   <div className="h-px w-8 bg-slate-200" />
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Destination</p>
                  <p className="text-lg font-black text-slate-800">{load.destination_zip}</p>
                </div>
              </div>

              {/* Last Update */}
              <div className="flex items-center gap-3 text-slate-500 justify-center">
                <Clock size={16} />
                <span className="text-xs font-bold font-medium tracking-tight">
                  Last Updated: {new Date(load.last_updated).toLocaleString()}
                </span>
              </div>

              {/* Progress Bar (Simplified) */}
              <div className="relative pt-4">
                <div className="h-2 w-full bg-slate-100 rounded-full" />
                <div 
                  className={`absolute top-4 left-0 h-2 bg-indigo-600 rounded-full transition-all duration-1000 ${
                    load.status === 'Delivered' ? 'w-full' : 
                    load.status === 'In-Transit' ? 'w-2/3' : 'w-1/3'
                  }`}
                />
              </div>

              <div className="pt-4 text-center">
                <p className="text-[11px] font-medium text-slate-400">
                  Detailed tracking and documentation are available via the <Link href="/login" className="text-indigo-600 font-bold hover:underline">Customer Portal</Link>.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Footer */}
      <p className="mt-8 text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">
        Powered by TMSLite Security Cloud
      </p>
    </div>
  );
}
