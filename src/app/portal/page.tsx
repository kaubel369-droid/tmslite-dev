'use client';

import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Truck, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight, 
  FileText,
  Search,
  Plus,
  Zap,
  User,
  Building2,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import LoadEntryModal from '@/app/loads/components/LoadEntryModal';
import LTLRatingScreen from '@/components/LTLRatingScreen';
import SpotQuoteModal from '@/components/SpotQuoteModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

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
  const [isPickupModalOpen, setIsPickupModalOpen] = useState(false);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [isSpotQuoteModalOpen, setIsSpotQuoteModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function loadPortalData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }

        console.log('User ID:', user.id);
        
        // Fetch profile to get customer_id
        const { data: p, error: profileError } = await supabase
          .from('profiles')
          .select('*, customers(*)')
          .eq('id', user.id)
          .single();
        
        if (profileError) {
          console.error('Profile fetch error:', profileError);
        }

        console.log('Fetched Profile:', p);
        setProfile(p);

        if (p?.customer_id) {
          console.log('Customer ID found:', p.customer_id);
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
            <Button 
              onClick={() => setIsPickupModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-200"
            >
              <Plus className="h-4 w-4" /> Schedule Pickup
            </Button>
            <Button 
              onClick={() => setIsQuoteModalOpen(true)}
              variant="outline"
              className="border-2 border-indigo-100 hover:border-indigo-600 hover:text-indigo-600 font-bold rounded-xl flex items-center gap-2 transition-all"
            >
              <Zap className="h-4 w-4" /> Get LTL Quote
            </Button>
            <Button 
              onClick={() => setIsSpotQuoteModalOpen(true)}
              variant="outline"
              className="border-2 border-violet-100 hover:border-violet-600 hover:text-violet-600 font-bold rounded-xl flex items-center gap-2 transition-all"
            >
              <ArrowUpRight className="h-4 w-4" /> Get Spot Quote
            </Button>
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Shipments */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
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
                    <th className="px-6 py-4 text-center">Weight</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-right">Delivery Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm text-slate-600">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                        Loading...
                      </td>
                    </tr>
                  ) : recentLoads.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">No shipments found</td>
                    </tr>
                  ) : recentLoads.map((load) => (
                    <tr 
                      key={load.id} 
                      className="hover:bg-slate-50/50 transition-colors cursor-pointer" 
                      onClick={() => router.push(`/portal/loads/${load.id}`)}
                    >
                      <td className="px-6 py-4 font-bold text-slate-700 text-center">#{load.load_number}</td>
                      <td className="px-6 py-4">{load.destination_zip}</td>
                      <td className="px-6 py-4 text-center">{load.total_weight} lbs</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                          load.status === 'Delivered' ? 'bg-emerald-100 text-emerald-700' :
                          load.status === 'In-Transit' ? 'bg-blue-100 text-blue-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {load.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {load.delivery_date ? new Date(load.delivery_date).toLocaleDateString() : 'TBD'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Business Info */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-6">
                <Building2 className="h-5 w-5 text-indigo-600" />
                Business Profile
              </h3>
              <div className="space-y-6">
                <div className="flex items-start gap-3">
                  <div className="bg-slate-50 p-2 rounded-lg">
                    <User className="h-4 w-4 text-slate-500" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Primary Contact</label>
                    <p className="text-sm font-bold text-slate-700">{profile?.full_name || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-slate-50 p-2 rounded-lg">
                    <Mail className="h-4 w-4 text-slate-500" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Email Address</label>
                    <p className="text-sm font-bold text-slate-700">{profile?.email || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-slate-50 p-2 rounded-lg">
                    <Zap className="h-4 w-4 text-slate-500" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Saved Quotes</label>
                    <Link href="/portal/quotes" className="text-sm font-bold text-indigo-600 hover:underline">
                      View Saved Quotes
                    </Link>
                  </div>
                </div>
              </div>
              <Button 
                onClick={() => setIsProfileModalOpen(true)}
                variant="ghost" 
                className="w-full mt-6 text-slate-500 hover:text-indigo-600 font-bold text-xs flex items-center gap-2 border border-dashed border-slate-200 hover:border-indigo-200 rounded-xl"
              >
                View Full Profile <ArrowUpRight className="h-3 w-3" />
              </Button>
            </div>

            <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-6 rounded-2xl text-white shadow-lg shadow-indigo-100">
              <h4 className="font-bold mb-2">Need Support?</h4>
              <p className="text-xs text-indigo-100 mb-4 leading-relaxed">Our dispatch team is available 24/7 to assist with your shipments.</p>
              <button className="w-full bg-white/20 hover:bg-white/30 text-white text-xs font-bold py-2.5 rounded-xl transition-all border border-white/20">
                Contact Dispatch
              </button>
            </div>
          </div>
        </div>

        {/* Modals */}
        <LoadEntryModal 
          isOpen={isPickupModalOpen}
          onClose={() => setIsPickupModalOpen(false)}
          loadId={null}
          restrictedCustomerId={profile?.customer_id}
          onSaveSuccess={() => {
            setIsPickupModalOpen(false);
            // Refresh logic could go here
          }}
        />

        <Dialog open={isQuoteModalOpen} onOpenChange={setIsQuoteModalOpen}>
          <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto p-0 border-0 bg-transparent shadow-none">
            <LTLRatingScreen 
              customerId={profile?.customer_id}
              isCustomer={true}
              onQuoteSaved={() => {
                setIsQuoteModalOpen(false);
                // toast.success('LTL Quote saved successfully!');
              }}
            />
          </DialogContent>
        </Dialog>

        <SpotQuoteModal 
          isOpen={isSpotQuoteModalOpen}
          onClose={() => setIsSpotQuoteModalOpen(false)}
          customerId={profile?.customer_id}
          isCustomer={true}
          onSave={() => {
            setIsSpotQuoteModalOpen(false);
            // toast.success('Spot Quote submitted successfully!');
          }}
        />

        {/* Business Profile Modal */}
        <Dialog open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-xl font-black text-slate-800 flex items-center gap-2">
                <Building2 className="h-6 w-6 text-indigo-600" />
                Business Profile
              </DialogTitle>
            </DialogHeader>
            <div className="py-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Company Name</label>
                  <p className="font-bold text-slate-700">{profile?.customers?.company_name || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Customer ID</label>
                  <p className="font-mono text-xs text-slate-500">{profile?.customer_id || 'N/A'}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center">
                  <User className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Primary Administrator</label>
                  <p className="text-lg font-black text-slate-800">{profile?.full_name || profile?.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="h-3 w-3 text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email</span>
                  </div>
                  <p className="text-sm font-bold text-slate-700 truncate">{profile?.email}</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Phone className="h-3 w-3 text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Phone</span>
                  </div>
                  <p className="text-sm font-bold text-slate-700">{profile?.phone || 'Not Provided'}</p>
                </div>
              </div>

              {profile?.customers?.address && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-3 w-3 text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Registered Office</span>
                  </div>
                  <p className="text-sm font-bold text-slate-700">{profile.customers.address}</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button onClick={() => setIsProfileModalOpen(false)} variant="secondary" className="w-full font-bold">
                Close Profile
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
