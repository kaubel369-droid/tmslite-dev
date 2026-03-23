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
  Plus,
  Zap
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import SpotQuoteModal from '@/components/SpotQuoteModal';
import LTLQuoteDetailsModal from '@/components/LTLQuoteDetailsModal';
import PrintButton from '@/components/PrintButton';

export default function SavedQuotesPage() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<any[]>([]);
  const [spotQuotes, setSpotQuotes] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'LTL' | 'Spot'>('LTL');
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const [isLTLDetailsOpen, setIsLTLDetailsOpen] = useState(false);
  const [isSpotDetailsOpen, setIsSpotDetailsOpen] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function loadQuotes() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }

        console.log('Fetching profile for User:', user.id);
        const { data: p, error: profileError } = await supabase
          .from('profiles')
          .select('*, customers!profiles_customer_id_fkey(*)')
          .eq('id', user.id)
          .single();
        
        if (profileError) {
          console.error('Profile fetch error:', profileError);
        }

        console.log('Fetched Profile on Quotes Page:', p);
        setProfile(p);

        if (p?.customer_id) {
          console.log('Loading quotes for Customer ID:', p.customer_id);
          const [ltlRes, spotRes] = await Promise.all([
            fetch(`/api/quotes?customerId=${p.customer_id}`),
            fetch(`/api/customers/${p.customer_id}/spot-quotes`)
          ]);

          if (ltlRes.ok) {
            const data = await ltlRes.json();
            console.log('LTL Quotes fetched:', data.quotes?.length || 0);
            setQuotes(data.quotes || []);
          } else {
            console.error('LTL Quotes fetch failed:', await ltlRes.text());
          }
          if (spotRes.ok) {
            const data = await spotRes.json();
            console.log('Spot Quotes fetched:', data.quotes?.length || 0);
            setSpotQuotes(data.quotes || []);
          } else {
            console.error('Spot Quotes fetch failed:', await spotRes.text());
          }
        } else {
          console.warn('No customer_id found in profile. Quotes cannot be loaded.');
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
                Saved Quotes
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

        {/* Tabs */}
        <div className="flex bg-white p-1 rounded-2xl border border-slate-200">
          <button 
            onClick={() => setActiveTab('LTL')}
            className={cn(
              "flex-1 py-3 px-6 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2",
              activeTab === 'LTL' ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" : "text-slate-500 hover:text-indigo-600"
            )}
          >
            <Truck className="h-4 w-4" /> LTL Quotes ({quotes.length})
          </button>
          <button 
            onClick={() => setActiveTab('Spot')}
            className={cn(
              "flex-1 py-3 px-6 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2",
              activeTab === 'Spot' ? "bg-violet-600 text-white shadow-md shadow-violet-100" : "text-slate-500 hover:text-violet-600"
            )}
          >
            <Zap className="h-4 w-4" /> Spot Quotes ({spotQuotes.length})
          </button>
        </div>

        {/* Quotes List */}
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 flex flex-col items-center justify-center gap-4 text-slate-400">
              <Loader2 className="h-10 w-10 animate-spin text-indigo-300" />
              <p className="font-bold">Loading your quotes...</p>
            </div>
          ) : (activeTab === 'LTL' ? quotes : spotQuotes).length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-4">
              <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                <FileText className="h-8 w-8 text-slate-300" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">No {activeTab} quotes found</h3>
                <p className="text-slate-500 text-sm">You haven't saved any {activeTab} quotes yet.</p>
              </div>
              <Link href="/portal">
                <Button variant="outline" className="mt-4 border-2">
                  Get a Rate Quote
                </Button>
              </Link>
            </div>
          ) : (
            (activeTab === 'LTL' ? quotes : spotQuotes).map((quote) => (
              <div key={quote.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-all group">
                <div className="flex flex-col md:flex-row">
                  {/* Main Info */}
                  <div className="p-6 md:w-3/4 flex flex-col md:flex-row gap-8">
                    <div className="flex-1 space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "p-2 rounded-xl transition-colors",
                            activeTab === 'LTL' ? "bg-slate-100 group-hover:bg-indigo-50" : "bg-slate-100 group-hover:bg-violet-50"
                          )}>
                            {activeTab === 'LTL' ? (
                              <Truck className="h-5 w-5 text-slate-600 group-hover:text-indigo-600" />
                            ) : (
                              <Zap className="h-5 w-5 text-slate-600 group-hover:text-violet-600" />
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                              {activeTab === 'LTL' ? 'Carrier / SCAC' : 'Shipment Type'}
                            </p>
                            <p className="font-bold text-slate-800 italic">
                              {activeTab === 'LTL' 
                                ? (quote.carrier_name || quote.scac || 'LTL Carrier')
                                : (quote.shipment_type || 'Spot Quote')
                              }
                            </p>
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
                          <p className="text-sm font-bold text-slate-800 truncate">
                            {activeTab === 'LTL' 
                              ? `${quote.origin_info?.city}, ${quote.origin_info?.state} ${quote.origin_info?.zip}`
                              : `${quote.shipper?.city || quote.shipper_city}, ${quote.shipper?.state || quote.shipper_state} ${quote.shipper?.zip || quote.shipper_zip}`
                            }
                          </p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-slate-300" />
                        <div className="flex-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> Destination
                          </p>
                          <p className="text-sm font-bold text-slate-800 truncate">
                            {activeTab === 'LTL' 
                              ? `${quote.destination_info?.city}, ${quote.destination_info?.state} ${quote.destination_info?.zip}`
                              : `${quote.consignee?.city || quote.consignee_city}, ${quote.consignee?.state || quote.consignee_state} ${quote.consignee?.zip || quote.consignee_zip}`
                            }
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-4">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Package className="h-4 w-4" />
                          <span className="text-xs font-medium">
                            {activeTab === 'LTL' ? (quote.items?.length || 0) : (quote.pcs || 0)} Units
                          </span>
                        </div>
                        {activeTab === 'LTL' && (
                          <div className="flex items-center gap-2 text-slate-600">
                            <Clock className="h-4 w-4" />
                            <span className="text-xs font-medium">{quote.transit_days} Est. Days</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-slate-600">
                          <Clock className="h-4 w-4 text-slate-400" />
                          <span className="text-xs font-medium">{quote.weight || quote.total_weight} lbs</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Financial & Action */}
                  <div className="bg-slate-50 md:w-1/4 p-6 flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-slate-100 space-y-3">
                    <div className="text-center mb-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">Estimated Rate</p>
                      <p className={cn(
                        "text-3xl font-black",
                        activeTab === 'LTL' ? "text-indigo-600" : "text-violet-600"
                      )}>
                        ${parseFloat(quote.customer_rate || quote.rate || 0).toFixed(2)}
                      </p>
                    </div>

                    <div className="w-full grid grid-cols-2 gap-2">
                      <Button 
                        variant="outline"
                        size="sm"
                        className="text-[10px] font-bold uppercase transition-all hover:bg-white"
                        onClick={() => {
                          setSelectedQuoteId(quote.id);
                          if (activeTab === 'LTL') setIsLTLDetailsOpen(true);
                          else setIsSpotDetailsOpen(true);
                        }}
                      >
                        View Details
                      </Button>
                      <PrintButton 
                        id={quote.id} 
                        type={activeTab === 'LTL' ? 'quote' : 'spot-quote'} 
                        variant="outline"
                        className="text-[10px] font-bold uppercase"
                      />
                    </div>

                    {activeTab === 'LTL' ? (
                      <Button 
                        onClick={() => handleAcceptQuote(quote)}
                        disabled={acceptingId === quote.id}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl shadow-lg shadow-emerald-100 transition-all flex items-center justify-center gap-2 text-sm"
                      >
                        {acceptingId === quote.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                        Accept Quote
                      </Button>
                    ) : (
                      <div className="w-full space-y-2">
                        <Button 
                          variant="outline"
                          className="w-full border-violet-200 text-violet-700 font-bold py-2 rounded-xl text-xs"
                          onClick={() => window.location.href = `mailto:dispatch@example.com?subject=Spot Quote Inquiry: ${quote.id}`}
                        >
                          Enquire About Quote
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <LTLQuoteDetailsModal 
          isOpen={isLTLDetailsOpen}
          onClose={() => {
            setIsLTLDetailsOpen(false);
            setSelectedQuoteId(null);
          }}
          quoteId={selectedQuoteId}
        />

        <SpotQuoteModal 
          isOpen={isSpotDetailsOpen}
          onClose={() => {
            setIsSpotDetailsOpen(false);
            setSelectedQuoteId(null);
          }}
          quoteId={selectedQuoteId || undefined}
          customerId={profile?.customer_id}
          onSave={() => {}} // Not needed for read-only
          readOnly={true}
          isCustomer={true}
        />
      </div>
    </div>
  );
}
