'use client';

import { useState, useEffect } from 'react';
import { 
  FileText, 
  Truck, 
  Clock, 
  MapPin, 
  Package, 
  CheckCircle2, 
  ArrowLeft,
  Loader2,
  ChevronRight,
  Plus
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function SavedQuotesPage() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    async function loadQuotes() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }

        const { data: p } = await supabase
          .from('profiles')
          .select('*, customers(org_id)')
          .eq('id', user.id)
          .single();
        
        setProfile(p);

        if (p?.customer_id) {
          const res = await fetch(`/api/quotes?customerId=${p.customer_id}`);
          if (res.ok) {
            const data = await res.json();
            setQuotes(data.quotes || []);
          }
        }
      } catch (error) {
        console.error('Error loading quotes:', error);
      } finally {
        setLoading(false);
      }
    }

    loadQuotes();
  }, [supabase, router]);

  const handleAcceptQuote = async (quote: any) => {
    setAcceptingId(quote.id);
    try {
      // Create a load from this quote
      const payload = {
        customer_id: quote.customer_id,
        org_id: profile.customers.org_id,
        status: 'Not Dispatched',
        origin_zip: quote.origin_info?.zip || '',
        destination_zip: quote.destination_info?.zip || '',
        customer_rate: quote.customer_rate,
        carrier_rate: quote.total_carrier_rate,
        fuel_surcharge: quote.fuel_surcharge,
        selected_carrier_id: quote.carrier_id,
        load_type: 'LTL',
        products: quote.items?.map((item: any) => ({
          pallets: item.pcs, // Standardizing on PCS as pallets if type is PLT
          weight: item.weight,
          description: `Quote Item: ${item.type || 'LTL'}`,
          nmfc: item.class,
          unit_type: item.type || 'PLT'
        })) || []
      };

      const res = await fetch('/api/loads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to create load');
      
      const data = await res.json();
      router.push(`/portal/loads/${data.load.id}`);
    } catch (error) {
      console.error('Error accepting quote:', error);
      alert('Failed to accept quote. Please contact support.');
    } finally {
      setAcceptingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/portal" className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
              <ArrowLeft className="h-5 w-5 text-slate-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                <FileText className="h-7 w-7 text-indigo-600" />
                Saved LTL Quotes
              </h1>
              <p className="text-slate-500 font-medium text-sm">Review and accept your recent rate quotes.</p>
            </div>
          </div>
          <Link href="/portal">
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-100">
              <Plus className="h-4 w-4 mr-2" /> New Quote
            </Button>
          </Link>
        </div>

        {/* Quotes List */}
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 flex flex-col items-center justify-center gap-4 text-slate-400">
              <Loader2 className="h-10 w-10 animate-spin text-indigo-300" />
              <p className="font-bold">Loading your quotes...</p>
            </div>
          ) : quotes.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-4">
              <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                <FileText className="h-8 w-8 text-slate-300" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">No quotes found</h3>
                <p className="text-slate-500 text-sm">You haven't saved any LTL quotes yet.</p>
              </div>
              <Link href="/portal">
                <Button variant="outline" className="mt-4 border-2">
                  Get a Rate Quote
                </Button>
              </Link>
            </div>
          ) : (
            quotes.map((quote) => (
              <div key={quote.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-all group">
                <div className="flex flex-col md:flex-row">
                  {/* Main Info */}
                  <div className="p-6 md:w-3/4 flex flex-col md:flex-row gap-8">
                    <div className="flex-1 space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="bg-slate-100 p-2 rounded-xl group-hover:bg-indigo-50 transition-colors">
                            <Truck className="h-5 w-5 text-slate-600 group-hover:text-indigo-600" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Carrier / SCAC</p>
                            <p className="font-bold text-slate-800">{quote.carrier_name || quote.scac || 'LTL Carrier'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Quote Date</p>
                          <p className="text-sm font-bold text-slate-700">{new Date(quote.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-8 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                        <div className="flex-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> Origin
                          </p>
                          <p className="text-sm font-bold text-slate-800">{quote.origin_info?.city}, {quote.origin_info?.state} {quote.origin_info?.zip}</p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-slate-300" />
                        <div className="flex-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> Destination
                          </p>
                          <p className="text-sm font-bold text-slate-800">{quote.destination_info?.city}, {quote.destination_info?.state} {quote.destination_info?.zip}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-4">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Package className="h-4 w-4" />
                          <span className="text-xs font-medium">{quote.items?.length || 0} Products</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600">
                          <Clock className="h-4 w-4" />
                          <span className="text-xs font-medium">{quote.transit_days} Est. Days</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Financial & Action */}
                  <div className="bg-slate-50 md:w-1/4 p-6 flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-slate-100 space-y-4">
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estimated Rate</p>
                      <p className="text-3xl font-black text-indigo-600">${parseFloat(quote.customer_rate).toFixed(2)}</p>
                    </div>
                    <Button 
                      onClick={() => handleAcceptQuote(quote)}
                      disabled={acceptingId === quote.id}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-100 transition-all flex items-center justify-center gap-2"
                    >
                      {acceptingId === quote.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                      Accept Quote
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
