'use client';

import { useState, useEffect } from 'react';
import { Truck, MapPin, Package, X, Loader2, Calendar, Hash } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import PrintButton from './PrintButton';
import { cn } from '@/lib/utils';

interface LTLQuoteDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    quoteId: string | null;
}

export default function LTLQuoteDetailsModal({ isOpen, onClose, quoteId }: LTLQuoteDetailsModalProps) {
    const [loading, setLoading] = useState(false);
    const [quote, setQuote] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && quoteId) {
            fetchQuoteDetails();
        } else {
            setQuote(null);
            setError(null);
        }
    }, [isOpen, quoteId]);

    const fetchQuoteDetails = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/quotes/${quoteId}`);
            if (!res.ok) throw new Error('Failed to fetch quote details');
            const data = await res.json();
            setQuote(data.quote);
        } catch (err: any) {
            console.error('Error fetching quote:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader className="border-b border-slate-100 pb-4 mb-4">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <Truck className="h-6 w-6 text-indigo-600" />
                            LTL Quote Details
                        </DialogTitle>
                        {quote && (
                            <div className="flex items-center gap-3 pr-8">
                                <PrintButton id={quote.id} type="quote" variant="outline" className="px-4 py-2" />
                            </div>
                        )}
                    </div>
                </DialogHeader>

                {loading ? (
                    <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                        <Loader2 className="h-10 w-10 animate-spin text-indigo-500 mb-4" />
                        <p>Loading quote details...</p>
                    </div>
                ) : error ? (
                    <div className="py-10 text-center text-red-500">
                        <p>{error}</p>
                        <button onClick={fetchQuoteDetails} className="text-indigo-600 hover:underline mt-2">Try Again</button>
                    </div>
                ) : quote ? (
                    <div className="space-y-8 py-2">
                        {/* Summary Bar */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Quote ID</label>
                                <div className="flex items-center gap-1.5 font-mono text-sm font-bold text-slate-700">
                                    <Hash className="h-3.5 w-3.5 text-slate-400" />
                                    {quote.id.substring(0, 8)}...
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Date Created</label>
                                <div className="flex items-center gap-1.5 text-sm font-bold text-slate-700">
                                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                    {new Date(quote.created_at).toLocaleDateString()}
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Carrier</label>
                                <div className="text-sm font-bold text-indigo-600">
                                    {quote.carrier_name || quote.scac}
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Quote Amount</label>
                                <div className="text-lg font-black text-emerald-600">
                                    ${Number(quote.customer_rate).toFixed(2)}
                                </div>
                            </div>
                        </div>

                        {/* Origin & Destination */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4 p-5 bg-white rounded-xl border border-slate-100 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                                <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-600 flex items-center gap-2">
                                    <MapPin className="h-4 w-4" /> Origin
                                </h3>
                                <div>
                                    <p className="text-lg font-bold text-slate-800">{quote.origin_info?.city}, {quote.origin_info?.state}</p>
                                    <p className="text-sm text-slate-500 font-medium">{quote.origin_info?.zip}</p>
                                </div>
                            </div>

                            <div className="space-y-4 p-5 bg-white rounded-xl border border-slate-100 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                                <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-600 flex items-center gap-2">
                                    <MapPin className="h-4 w-4 rotate-180" /> Destination
                                </h3>
                                <div>
                                    <p className="text-lg font-bold text-slate-800">{quote.destination_info?.city}, {quote.destination_info?.state}</p>
                                    <p className="text-sm text-slate-500 font-medium">{quote.destination_info?.zip}</p>
                                </div>
                            </div>
                        </div>

                        {/* Items Section */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2 px-1">
                                <Package className="h-4 w-4" /> Shipment Details
                            </h3>
                            <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr className="text-[10px] uppercase font-bold text-slate-400">
                                            <th className="px-6 py-4">Pcs</th>
                                            <th className="px-6 py-4">Type</th>
                                            <th className="px-6 py-4">Weight</th>
                                            <th className="px-6 py-4">Class</th>
                                            <th className="px-6 py-4">Dimensions (LxWxH)</th>
                                            <th className="px-6 py-4 text-right">CU. FT.</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {quote.items?.map((item: any, idx: number) => (
                                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4 font-bold text-slate-700">{item.pcs}</td>
                                                <td className="px-6 py-4 text-slate-600">{item.type}</td>
                                                <td className="px-6 py-4 text-slate-600 font-medium">{item.weight} lbs</td>
                                                <td className="px-6 py-4">
                                                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold">CLASS {item.class}</span>
                                                </td>
                                                <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                                                    {item.length}" x {item.width}" x {item.height}"
                                                </td>
                                                <td className="px-6 py-4 text-right text-slate-700 font-medium">{item.cubic_feet}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-slate-50/30 font-bold border-t border-slate-100">
                                        <tr>
                                            <td className="px-6 py-3 text-slate-800">
                                                {quote.items?.reduce((sum: number, i: any) => sum + (Number(i.pcs) || 0), 0)}
                                            </td>
                                            <td className="px-6 py-3 text-[10px] text-slate-400 uppercase">Totals</td>
                                            <td className="px-6 py-3 text-slate-800">
                                                {quote.items?.reduce((sum: number, i: any) => sum + (Number(i.weight) || 0), 0)} lbs
                                            </td>
                                            <td colSpan={2}></td>
                                            <td className="px-6 py-3 text-right text-slate-800">
                                                {quote.items?.reduce((sum: number, i: any) => sum + (Number(i.cubic_feet) || 0), 0).toFixed(2)}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>

                        {/* Accessorials & Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 px-1">Accessorials</label>
                                <div className="flex flex-wrap gap-2 p-4 bg-slate-50 rounded-xl border border-slate-100 min-h-[60px]">
                                    {quote.accessorials?.length > 0 ? (
                                        quote.accessorials.map((acc: any, idx: number) => (
                                            <span key={idx} className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold border border-indigo-100 shadow-sm">
                                                {typeof acc === 'string' ? acc : acc.name}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-xs text-slate-400 italic">No accessorials requested</span>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-3 text-right">
                                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 px-1">Transit Details</label>
                                <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm inline-block ml-auto">
                                    <div className="flex items-center gap-3">
                                        <div className="text-center">
                                            <p className="text-2xl font-black text-slate-800">{quote.transit_days}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Est. Days</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : null}

                <DialogFooter className="mt-8 pt-4 border-t border-slate-100">
                    <button 
                        onClick={onClose}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-2 rounded-lg font-bold text-sm transition-all"
                    >
                        Close
                    </button>
                    {quote && (
                        <div className="md:hidden mt-2">
                             <PrintButton id={quote.id} type="quote" variant="outline" className="w-full" />
                        </div>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
