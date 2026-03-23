'use client';

import { useState, useEffect } from 'react';
import { 
  ChevronRight, 
  MapPin, 
  Calendar, 
  Package, 
  FileDown, 
  CheckCircle2, 
  Clock,
  Truck,
  ArrowLeft,
  Info
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

export default function LoadDetail() {
  const router = useRouter();
  const { id } = useParams();
  const [load, setLoad] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchDetails() {
      try {
        const { data: loadData } = await supabase
          .from('customer_portal_loads')
          .select('*')
          .eq('id', id)
          .single();
        
        if (loadData) {
          setLoad(loadData);
          
          const { data: docs } = await supabase
            .from('customer_portal_documents')
            .select('*')
            .eq('load_id', id);
          
          if (docs) setDocuments(docs);
        }
      } catch (error) {
        console.error('Error fetching details:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchDetails();
  }, [id, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/50 p-6 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Clock className="h-10 w-10 text-indigo-400 animate-spin" />
          <span className="text-slate-500 font-bold uppercase tracking-widest text-xs">Loading Shipping Details...</span>
        </div>
      </div>
    );
  }

  if (!load) {
    return <div className="p-12 text-center text-slate-500 font-bold">Load not found.</div>;
  }

  const statusSteps = [
    { label: 'Dispatched', status: ['Dispatched', 'In-Transit', 'Delivered', 'Invoiced'] },
    { label: 'In-Transit', status: ['In-Transit', 'Delivered', 'Invoiced'] },
    { label: 'Delivered', status: ['Delivered', 'Invoiced'] },
  ];

  const currentStatusIndex = statusSteps.findIndex(step => step.status.includes(load.status));

  return (
    <div className="min-h-screen bg-white">
      {/* Detail Header */}
      <div className="bg-slate-50 border-b border-slate-200 p-6 md:p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <Link href="/portal/loads" className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-widest transition-all">
            <ArrowLeft size={14} /> Back to My Loads
          </Link>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <h1 className="text-3xl font-black text-slate-900">Load #{load.load_number}</h1>
              <p className="text-slate-500 font-medium">{load.origin_zip} → {load.destination_zip}</p>
            </div>
            <div className={`px-4 py-2 rounded-xl text-sm font-black uppercase tracking-tighter border-2 ${
              load.status === 'Delivered' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
              load.status === 'In-Transit' ? 'bg-blue-50 text-blue-700 border-blue-100' :
              'bg-indigo-50 text-indigo-700 border-indigo-100'
            }`}>
              {load.status}
            </div>
          </div>

          {/* Progress Tracker (Pizza Tracker Style) */}
          <div className="relative pt-10 pb-4">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 -translate-y-1/2 rounded-full" />
            <div 
              className="absolute top-1/2 left-0 h-1 bg-indigo-600 -translate-y-1/2 rounded-full transition-all duration-1000" 
              style={{ width: `${(currentStatusIndex / (statusSteps.length - 1)) * 100}%` }}
            />
            <div className="relative flex justify-between z-10 px-2 sm:px-4">
              {statusSteps.map((step, idx) => {
                const isCompleted = idx <= currentStatusIndex;
                const isActive = idx === currentStatusIndex;
                const Icon = isCompleted ? CheckCircle2 : Clock;

                return (
                  <div key={step.label} className="flex flex-col items-center gap-3">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center border-4 ${
                      isCompleted ? 'bg-indigo-600 border-indigo-100 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-300'
                    } ${isActive ? 'ring-4 ring-indigo-500/20' : ''}`}>
                      {isActive && !isCompleted ? <Truck size={18} className="animate-pulse" /> : <Icon size={18} />}
                    </div>
                    <span className={`text-[10px] sm:text-xs font-black uppercase tracking-widest ${
                      isCompleted ? 'text-indigo-700' : 'text-slate-400'
                    }`}>{step.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Grid Content */}
      <div className="max-w-5xl mx-auto p-6 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-slate-50 border border-slate-100 p-6 rounded-2xl flex items-start gap-4">
                <div className="bg-white p-2.5 rounded-xl shadow-sm border border-slate-200 text-indigo-600 shrink-0">
                  <MapPin size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Shipping Route</p>
                  <p className="text-sm font-bold text-slate-800">{load.origin_zip} <span className="text-slate-300 mx-2">→</span> {load.destination_zip}</p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-100 p-6 rounded-2xl flex items-start gap-4">
                <div className="bg-white p-2.5 rounded-xl shadow-sm border border-slate-200 text-indigo-600 shrink-0">
                  <Package size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Cargo Details</p>
                  <p className="text-sm font-bold text-slate-800">{load.total_weight} lbs • {load.nmfc_class || 'General'}</p>
                </div>
              </div>

              <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-2xl flex items-start gap-4">
                <div className="bg-white p-2.5 rounded-xl shadow-sm border border-slate-200 text-indigo-600 shrink-0">
                  <FileText size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Quoted Rate</p>
                  <p className="text-sm font-black text-indigo-700">${parseFloat(load.customer_rate || 0).toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Shipment Logic & Timeline</h3>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-50">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-slate-400" />
                    <span className="text-sm font-bold text-slate-600">Scheduled Pickup</span>
                  </div>
                  <span className="text-sm font-black text-slate-900">{new Date(load.pickup_date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-50">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-slate-400" />
                    <span className="text-sm font-bold text-slate-600">Expected Delivery</span>
                  </div>
                  <span className="text-sm font-black text-slate-900">{load.delivery_date ? new Date(load.delivery_date).toLocaleDateString() : 'TBD'}</span>
                </div>
                <div className="pt-2">
                  <div className="flex items-center gap-2 mb-3">
                    <Info size={14} className="text-indigo-500" />
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Shipping Notes</span>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl text-sm text-slate-600 font-medium">
                    {load.bol_notes || 'No public notes for this shipment.'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Documentation Sidebar */}
          <div className="space-y-6">
            <div className="bg-indigo-900 text-white rounded-3xl p-6 shadow-xl shadow-indigo-100 border border-indigo-800 relative overflow-hidden group">
              <div className="absolute -top-10 -right-10 h-32 w-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
              <div className="relative z-10">
                <h3 className="text-lg font-black mb-1">Documentation</h3>
                <p className="text-indigo-200 text-xs font-medium mb-6 leading-relaxed">Download BOLs, PODs, and invoices directly from your portal.</p>
                
                <div className="space-y-3">
                  {documents.length > 0 ? documents.map((doc) => (
                    <button 
                      key={doc.id}
                      className="w-full flex items-center justify-between bg-white/10 border border-white/20 hover:bg-white/20 p-3 rounded-xl transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-indigo-300" />
                        <span className="text-xs font-bold truncate max-w-[120px]">{doc.type}</span>
                      </div>
                      <FileDown className="h-4 w-4" />
                    </button>
                  )) : (
                    <div className="text-center py-4 text-indigo-300 text-xs font-bold border-2 border-dashed border-indigo-700/50 rounded-2xl">
                      No documents available yet.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col items-center text-center">
              <div className="h-12 w-12 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-indigo-600 mb-4 font-black">?</div>
              <p className="text-sm font-bold text-slate-800 mb-1">Need Assistance?</p>
              <p className="text-xs text-slate-500 font-medium mb-4">Contact your account representative for details regarding this shipment.</p>
              <button className="text-xs font-black text-indigo-600 hover:text-indigo-800 transition-all uppercase tracking-widest">Contact Support</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Minimal Icons not already imported
function FileText(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M10 9H8" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
    </svg>
  )
}
