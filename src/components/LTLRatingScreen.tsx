'use client';

import { useState, useEffect, useMemo } from 'react';
import { Truck, MapPin, Package, Plus, Trash2, Search, Loader2, ChevronDown, Check, Shield, X, Settings, AlertCircle, CheckCircle2, Save } from 'lucide-react';
import { FreightItem, RateQuote } from '@/lib/carriers/interfaces';
import { cn } from '@/lib/utils';
import { createClient } from '@/utils/supabase/client';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Address {
    zip: string;
    city: string;
    state: string;
}

interface ProductLine extends FreightItem {
    length: number;
    width: number;
    height: number;
}

interface LTLRatingScreenProps {
    customerId?: string;
    carrierId?: string;
    initialData?: any;
    onQuoteSaved?: () => void;
    isCustomer?: boolean;
}

export default function LTLRatingScreen({ customerId, carrierId, initialData, onQuoteSaved, isCustomer }: LTLRatingScreenProps) {
    const [origin, setOrigin] = useState<Address>({ zip: '', city: '', state: '' });
    const [destination, setDestination] = useState<Address>({ zip: '', city: '', state: '' });
    const [items, setItems] = useState<ProductLine[]>([
        { pcs: 1, type: 'PLT', weight: 0, class: '65', length: 48, width: 48, height: 48, pallets: 1, cubic_feet: 64 }
    ]);
    const [selectedAccessorials, setSelectedAccessorials] = useState<string[]>([]);
    const [accessorialsOptions, setAccessorialsOptions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [quotes, setQuotes] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isSavingQuote, setIsSavingQuote] = useState(false);
    const [savedQuoteId, setSavedQuoteId] = useState<string | null>(null);

    // Career Manage States
    const [userRole, setUserRole] = useState<string | null>(null);
    const [carrierConfigs, setCarrierConfigs] = useState<any>({ default_margin: 15, carriers: {} });
    const [carriersList, setCarriersList] = useState<any[]>([]);
    const [isManageModalOpen, setIsManageModalOpen] = useState(false);
    const [isSavingConfigs, setIsSavingConfigs] = useState(false);
    const [tempAccessorial, setTempAccessorial] = useState<string>("");

    // Zip Lookup States
    const [originLoading, setOriginLoading] = useState(false);
    const [destLoading, setDestLoading] = useState(false);
    const [originCities, setOriginCities] = useState<any[]>([]);
    const [destCities, setDestCities] = useState<any[]>([]);

    useEffect(() => {
        fetchAccessorials();
        fetchUserData();
        if (customerId) fetchCustomerConfigs();
    }, [customerId]);

    const fetchUserData = async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();
            if (profile) setUserRole(profile.role);
        }
    };

    const fetchCustomerConfigs = async () => {
        try {
            const res = await fetch(`/api/customers/${customerId}`);
            if (res.ok) {
                const data = await res.json();
                if (data.customer?.carrier_configs) {
                    // Ensure the structure is what we expect
                    const configs = data.customer.carrier_configs;
                    setCarrierConfigs({
                        default_margin: configs.default_margin ?? 15,
                        carriers: configs.carriers ?? {}
                    });
                }
            }
        } catch (err) {
            console.error("Failed to load customer configs", err);
        }
    };

    const fetchCarriers = async () => {
        try {
            const res = await fetch('/api/carriers');
            if (res.ok) {
                const data = await res.json();
                // Filter only those with API enabled
                setCarriersList(data.carriers?.filter((c: any) => c.api_enabled) || []);
            }
        } catch (err) {
            console.error("Failed to load carriers", err);
        }
    };

    const handleSaveConfigs = async () => {
        setIsSavingConfigs(true);
        try {
            const res = await fetch(`/api/customers/${customerId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ carrier_configs: carrierConfigs })
            });
            if (res.ok) {
                setIsManageModalOpen(false);
            }
        } catch (err) {
            console.error("Failed to save configs", err);
        } finally {
            setIsSavingConfigs(false);
        }
    };

    const fetchAccessorials = async () => {
        try {
            const res = await fetch('/api/accessorials');
            if (res.ok) {
                const data = await res.json();
                setAccessorialsOptions(data.accessorials || []);
            }
        } catch (err) {
            console.error("Failed to load accessorials", err);
        }
    };

    const handleZipLookup = async (zip: string, type: 'origin' | 'destination') => {
        if (zip.length < 5) return;
        
        const setLoading = type === 'origin' ? setOriginLoading : setDestLoading;
        const setCities = type === 'origin' ? setOriginCities : setDestCities;
        const setAddr = type === 'origin' ? setOrigin : setDestination;

        setLoading(true);
        try {
            const res = await fetch(`/api/zip-codes/${zip}`);
            if (res.ok) {
                const data = await res.json();
                if (data.locations && data.locations.length > 0) {
                    setCities(data.locations);
                    if (data.locations.length === 1) {
                        setAddr(prev => ({ 
                            ...prev, 
                            zip, 
                            city: data.locations[0].city, 
                            state: data.locations[0].state_id 
                        }));
                    } else {
                        setAddr(prev => ({ ...prev, zip, city: '', state: data.locations[0].state_id }));
                    }
                }
            }
        } catch (err) {
            console.error("Zip lookup failed", err);
        } finally {
            setLoading(false);
        }
    };

    const calculateCubicFeet = (item: ProductLine) => {
        const val = (item.length * item.width * item.height * (item.pcs || 1)) / 1728;
        return parseFloat(val.toFixed(2));
    };

    const updateItem = (index: number, field: keyof ProductLine, value: any) => {
        const newItems = [...items];
        const updatedItem = { ...newItems[index], [field]: value };
        
        // Auto-calculate cubic feet if dimensions or pcs change
        if (['length', 'width', 'height', 'pcs'].includes(field as string)) {
            updatedItem.cubic_feet = calculateCubicFeet(updatedItem);
        }
        
        newItems[index] = updatedItem;
        setItems(newItems);
    };

    const addProductLine = () => {
        if (items.length < 6) {
            setItems([...items, { pcs: 1, type: 'PLT', weight: 0, class: '65', length: 48, width: 48, height: 48, pallets: 1, cubic_feet: 64 }]);
        }
    };

    const removeProductLine = (index: number) => {
        if (items.length > 1) {
            setItems(items.filter((_, i) => i !== index));
        }
    };

    const totals = useMemo(() => {
        return items.reduce((acc, item) => ({
            pcs: acc.pcs + (Number(item.pcs) || 0),
            weight: acc.weight + (Number(item.weight) || 0),
            cubic_feet: acc.cubic_feet + (Number(item.cubic_feet) || 0)
        }), { pcs: 0, weight: 0, cubic_feet: 0 });
    }, [items]);

    const handleGetRates = async () => {
        setLoading(true);
        setError(null);
        setQuotes([]);
        setSavedQuoteId(null);

        try {
            const shipment = {
                origin,
                destination,
                items: items.map(item => ({
                    ...item,
                    pallets: item.type === 'PLT' ? item.pcs : 1 
                })),
                accessorials: selectedAccessorials
            };

            const res = await fetch('/api/rates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    shipment,
                    customerId,
                    carrierId
                })
            });

            if (!res.ok) throw new Error('Rating API failed');
            const data = await res.json();
            setQuotes(data.quotes || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveQuote = async (quote: any) => {
        if (!customerId) return;
        setIsSavingQuote(true);
        setError(null);

        try {
            const payload = {
                customer_id: customerId,
                carrier_id: quote.carrier_id,
                carrier_name: quote.carrier,
                scac: quote.scac,
                base_rate: quote.details?.baseRate || quote.totalCost * 0.8,
                fuel_surcharge: quote.details?.fuelSurcharge || 0,
                accessorials_total: 0, // Could be calculated if available
                total_carrier_rate: quote.totalCost,
                customer_rate: quote.customerCost || quote.total_rate || quote.customer_total_rate,
                transit_days: quote.transitDays,
                origin_info: origin,
                destination_info: destination,
                items: items,
                accessorials: selectedAccessorials
            };

            const res = await fetch('/api/quotes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to save quote');
            }

            const data = await res.json();
            setSavedQuoteId(data.quote.id);
            if (onQuoteSaved) onQuoteSaved();
        } catch (err: any) {
            console.error('Error saving quote:', err);
            setError(err.message);
        } finally {
            setIsSavingQuote(false);
        }
    };

    return (
        <div id="ltl-rating-screen" className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 space-y-8">
                {/* Header */}
                <div id="screen-header" className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <Truck className="h-6 w-6 text-indigo-600" />
                            LTL Rating Engine
                        </h2>
                        <p className="text-sm text-slate-500">Enter shipment details to get real-time carrier quotes.</p>
                    </div>
                </div>

                {/* Locations Section */}
                <div id="locations-section" className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Origin */}
                    <div className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-600 flex items-center gap-2">
                            <MapPin className="h-4 w-4" /> Origin
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="sm:col-span-1">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">ZIP Code</label>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        value={origin.zip} 
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setOrigin(prev => ({ ...prev, zip: val }));
                                            if (val.length === 5) handleZipLookup(val, 'origin');
                                        }}
                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-sm"
                                        placeholder="00000"
                                    />
                                    {originLoading && <Loader2 className="absolute right-2 top-2.5 h-4 w-4 animate-spin text-indigo-500" />}
                                </div>
                            </div>
                            <div className="sm:col-span-1">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">City</label>
                                {originCities.length > 1 ? (
                                    <select 
                                        value={origin.city}
                                        onChange={(e) => setOrigin(prev => ({ ...prev, city: e.target.value }))}
                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white shadow-sm"
                                    >
                                        <option value="">Select City</option>
                                        {originCities.map(c => <option key={c.city} value={c.city}>{c.city}</option>)}
                                    </select>
                                ) : (
                                    <input 
                                        type="text" 
                                        value={origin.city} 
                                        readOnly
                                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white/50 text-slate-500"
                                    />
                                )}
                            </div>
                            <div className="sm:col-span-1">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">State</label>
                                <input 
                                    type="text" 
                                    value={origin.state} 
                                    readOnly
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white/50 text-slate-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Destination */}
                    <div className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-600 flex items-center gap-2">
                            <MapPin className="h-4 w-4 rotate-180" /> Destination
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="sm:col-span-1">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">ZIP Code</label>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        value={destination.zip} 
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setDestination(prev => ({ ...prev, zip: val }));
                                            if (val.length === 5) handleZipLookup(val, 'destination');
                                        }}
                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-sm"
                                        placeholder="00000"
                                    />
                                    {destLoading && <Loader2 className="absolute right-2 top-2.5 h-4 w-4 animate-spin text-indigo-500" />}
                                </div>
                            </div>
                            <div className="sm:col-span-1">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">City</label>
                                {destCities.length > 1 ? (
                                    <select 
                                        value={destination.city}
                                        onChange={(e) => setDestination(prev => ({ ...prev, city: e.target.value }))}
                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white shadow-sm"
                                    >
                                        <option value="">Select City</option>
                                        {destCities.map(c => <option key={c.city} value={c.city}>{c.city}</option>)}
                                    </select>
                                ) : (
                                    <input 
                                        type="text" 
                                        value={destination.city} 
                                        readOnly
                                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white/50 text-slate-500"
                                    />
                                )}
                            </div>
                            <div className="sm:col-span-1">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">State</label>
                                <input 
                                    type="text" 
                                    value={destination.state} 
                                    readOnly
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white/50 text-slate-500"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Product Section */}
                <div id="product-section" className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                            <Package className="h-4 w-4" /> Products
                        </h3>
                        <button 
                            id="add-product-btn"
                            onClick={addProductLine}
                            disabled={items.length >= 6}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Plus className="h-3.5 w-3.5" /> Add Line
                        </button>
                    </div>

                    <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-sm">
                        <table className="w-full text-sm text-left">
                            <thead className="text-[10px] uppercase font-bold text-slate-400 bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3 w-20 text-center">Pcs</th>
                                    <th className="px-4 py-3 w-32">Type</th>
                                    <th className="px-4 py-3 w-32">Weight</th>
                                    <th className="px-4 py-3 w-28">Class</th>
                                    <th className="px-4 py-3 w-24">L(in)</th>
                                    <th className="px-4 py-3 w-24">W(in)</th>
                                    <th className="px-4 py-3 w-24">H(in)</th>
                                    <th className="px-4 py-3 text-right whitespace-nowrap">Cubic Ft</th>
                                    <th className="px-4 py-3 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {items.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-2 py-2">
                                            <input type="number" value={item.pcs} onChange={(e) => updateItem(idx, 'pcs', parseInt(e.target.value) || 0)} className="w-full border border-slate-200 rounded-md px-2 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none" />
                                        </td>
                                        <td className="px-2 py-2">
                                            <select value={item.type || 'PLT'} onChange={(e) => updateItem(idx, 'type', e.target.value)} className="w-full border border-slate-200 rounded-md px-2 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white">
                                                <option value="PLT">Pallets</option>
                                                <option value="CTN">Cartons</option>
                                                <option value="SKD">Skids</option>
                                                <option value="CRATE">Crate</option>
                                                <option value="PCS">Pieces</option>
                                            </select>
                                        </td>
                                        <td className="px-2 py-2">
                                            <input type="number" value={item.weight} onChange={(e) => updateItem(idx, 'weight', parseFloat(e.target.value) || 0)} className="w-full border border-slate-200 rounded-md px-2 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none" />
                                        </td>
                                        <td className="px-2 py-2">
                                            <select value={item.class} onChange={(e) => updateItem(idx, 'class', e.target.value)} className="w-full border border-slate-200 rounded-md px-2 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white">
                                                <option value="50">50</option>
                                                <option value="55">55</option>
                                                <option value="60">60</option>
                                                <option value="65">65</option>
                                                <option value="70">70</option>
                                                <option value="77.5">77.5</option>
                                                <option value="85">85</option>
                                                <option value="92.5">92.5</option>
                                                <option value="100">100</option>
                                                <option value="110">110</option>
                                                <option value="125">125</option>
                                                <option value="150">150</option>
                                                <option value="175">175</option>
                                                <option value="200">200</option>
                                                <option value="250">250</option>
                                            </select>
                                        </td>
                                        <td className="px-2 py-2">
                                            <input type="number" value={item.length} onChange={(e) => updateItem(idx, 'length', parseFloat(e.target.value) || 0)} className="w-full border border-slate-200 rounded-md px-2 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none" />
                                        </td>
                                        <td className="px-2 py-2">
                                            <input type="number" value={item.width} onChange={(e) => updateItem(idx, 'width', parseFloat(e.target.value) || 0)} className="w-full border border-slate-200 rounded-md px-2 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none" />
                                        </td>
                                        <td className="px-2 py-2">
                                            <input type="number" value={item.height} onChange={(e) => updateItem(idx, 'height', parseFloat(e.target.value) || 0)} className="w-full border border-slate-200 rounded-md px-2 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none" />
                                        </td>
                                        <td className="px-4 py-2 text-right font-medium text-slate-700">
                                            {item.cubic_feet}
                                        </td>
                                        <td className="px-2 py-2 text-right">
                                            <button 
                                                onClick={() => removeProductLine(idx)}
                                                disabled={items.length <= 1}
                                                className="text-slate-300 hover:text-red-500 transition-colors disabled:opacity-0"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-slate-50/50 border-t border-slate-200 font-bold">
                                <tr>
                                    <td className="px-2 py-3 text-center text-indigo-700">{totals.pcs}</td>
                                    <td colSpan={1} className="px-4 py-3 text-right text-[10px] text-slate-400 uppercase tracking-widest">Totals</td>
                                    <td className="px-2 py-3 text-indigo-700">{totals.weight} <span className="text-[10px] text-slate-400 ml-1">LBS</span></td>
                                    <td colSpan={4}></td>
                                    <td className="px-4 py-3 text-right text-indigo-700">{totals.cubic_feet.toFixed(2)} <span className="text-[10px] text-slate-400 ml-1">FT³</span></td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                {/* Footer Controls */}
                <div id="footer-controls" className="pt-6 border-t border-slate-100 flex flex-col md:flex-row items-end justify-between gap-6">
                    {/* Accessorials */}
                    {/* Accessorials */}
                    <div className="w-full md:w-1/2 space-y-3">
                        <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">Accessorials</label>
                        <div className="flex gap-2">
                            <select 
                                value={tempAccessorial}
                                onChange={(e) => setTempAccessorial(e.target.value)}
                                className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white shadow-sm"
                            >
                                <option value="">Select Accessorial...</option>
                                {accessorialsOptions
                                    .filter(opt => !selectedAccessorials.includes(opt.id))
                                    .map(opt => (
                                        <option key={opt.id} value={opt.id}>{opt.name}</option>
                                    ))
                                }
                            </select>
                            <button 
                                onClick={() => {
                                    if (tempAccessorial && selectedAccessorials.length < 6) {
                                        setSelectedAccessorials([...selectedAccessorials, tempAccessorial]);
                                        setTempAccessorial("");
                                    }
                                }}
                                disabled={!tempAccessorial || selectedAccessorials.length >= 6}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-lg text-xs transition-all disabled:opacity-50"
                            >
                                Add
                            </button>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 min-h-[40px] p-2 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                            {selectedAccessorials.map(accId => {
                                const acc = accessorialsOptions.find(o => o.id === accId);
                                return (
                                    <div key={accId} className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1.5 border border-indigo-100 group">
                                        {acc?.name || accId}
                                        <button 
                                            onClick={() => setSelectedAccessorials(prev => prev.filter(id => id !== accId))}
                                            className="hover:text-indigo-900"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                );
                            })}
                            {selectedAccessorials.length === 0 && (
                                <span className="text-[10px] text-slate-400 italic">No accessorials selected</span>
                            )}
                        </div>
                        {!isCustomer && <p className="text-[10px] text-slate-400">Total: {selectedAccessorials.length}/6</p>}
                    </div>

                    <div className="flex flex-col items-end gap-4 w-full md:w-auto">
                        {customerId && (userRole === 'Admin' || userRole === 'Supervisor') && (
                            <button 
                                onClick={() => {
                                    fetchCarriers();
                                    setIsManageModalOpen(true);
                                }}
                                className="text-indigo-600 hover:text-indigo-800 text-xs font-bold flex items-center gap-1.5 mr-auto md:mr-0 px-2 py-1 hover:bg-indigo-50 rounded-lg transition-all"
                            >
                                <Settings className="h-3.5 w-3.5" /> Manage Carriers
                            </button>
                        )}
                        <button 
                            id="get-rates-btn"
                            onClick={handleGetRates}
                            disabled={loading || !origin.zip || !destination.zip}
                            className={cn(
                                "w-full md:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-indigo-200 active:scale-95 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed",
                                isCustomer ? "md:w-full" : ""
                            )}
                        >
                            {loading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <Search className="h-5 w-5" />
                            )}
                            Get Rates
                        </button>
                    </div>
                </div>

                {/* Error Banner */}
                {error && (
                    <div id="error-banner" className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                        <div className="bg-red-100 p-1 rounded-full">
                            <Plus className="h-4 w-4 rotate-45" />
                        </div>
                        <p className="text-sm font-medium">{error}</p>
                    </div>
                )}

                {/* Results Grid */}
                {quotes.length > 0 && (
                    <div id="results-grid" className="space-y-4 pt-8 border-t border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-slate-800">Available Quotes</h3>
                            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{quotes.length} Options Found</span>
                        </div>
                        <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr className="text-[10px] uppercase font-bold text-slate-400">
                                        <th className="px-6 py-4">Carrier</th>
                                        {!isCustomer && <th className="px-6 py-4 text-right">Base Rate</th>}
                                        {!isCustomer && <th className="px-6 py-4 text-right">Accessorials</th>}
                                        {!isCustomer && <th className="px-6 py-4 text-right text-indigo-600">Carrier Total</th>}
                                        <th className="px-6 py-4 text-center">Transit</th>
                                        <th className="px-6 py-4 text-right text-emerald-600 bg-emerald-50/50">Rate</th>
                                        <th className="px-6 py-4"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {quotes.map((quote, idx) => (
                                        <tr key={idx} className="hover:bg-indigo-50/20 transition-colors group">                                             <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200 group-hover:border-indigo-200 transition-colors">
                                                        <Truck className="h-6 w-6 text-slate-400 group-hover:text-indigo-400" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-800">{quote.carrier || quote.scac}</p>
                                                        <p className="text-[10px] text-slate-400 font-mono tracking-tighter uppercase">{quote.scac}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            {!isCustomer && (
                                                <td className="px-6 py-4 text-right text-slate-600 font-medium">
                                                    ${(quote.details?.baseRate || quote.totalCost * 0.8).toFixed(2)}
                                                </td>
                                            )}
                                            {!isCustomer && (
                                                <td className="px-6 py-4 text-right text-slate-600 font-medium font-mono text-xs">
                                                    +${(quote.details?.fuelSurcharge || 0).toFixed(2)}
                                                </td>
                                            )}
                                            {!isCustomer && (
                                                <td className="px-6 py-4 text-right font-bold text-indigo-600">
                                                    ${quote.totalCost.toFixed(2)}
                                                </td>
                                            )}
                                            <td className="px-6 py-4 text-center">
                                                <div className="inline-flex flex-col items-center">
                                                    <span className="font-bold text-slate-800">{quote.transitDays}</span>
                                                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">Days</span>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 text-right font-black text-lg text-emerald-600 bg-emerald-50/30 group-hover:bg-emerald-100/40 transition-colors">
                                                ${(quote.customerCost || quote.totalCost * 1.15).toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button 
                                                   onClick={() => handleSaveQuote(quote)}
                                                   disabled={isSavingQuote || savedQuoteId === quote.id}
                                                   className={cn(
                                                       "font-bold px-4 py-2 rounded-lg text-xs transition-all flex items-center gap-2 ml-auto shadow-sm active:scale-95",
                                                       savedQuoteId === quote.id 
                                                           ? "bg-emerald-50 text-emerald-600 border-2 border-emerald-100" 
                                                           : "bg-white border-2 border-slate-200 hover:border-indigo-600 text-slate-700 hover:text-indigo-700"
                                                   )}
                                                >
                                                    {isSavingQuote && !savedQuoteId && !error ? (
                                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                    ) : savedQuoteId === quote.id ? (
                                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                                    ) : null}
                                                    {savedQuoteId === quote.id ? 'Saved' : 'Select'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Loading Skeleton */}
                {loading && (
                    <div className="py-20 flex flex-col items-center justify-center text-slate-400 animate-pulse">
                        <Search className="h-12 w-12 text-indigo-100 mb-4 animate-bounce" />
                        <p className="font-medium">Searching for best carrier rates...</p>
                    </div>
                )}
            </div>

            {/* Manage Carriers Modal */}
            <Dialog open={isManageModalOpen} onOpenChange={setIsManageModalOpen}>
                <DialogContent className="sm:max-w-2xl bg-white border-0 shadow-2xl p-0 overflow-hidden">
                    <div className="p-6 bg-slate-50 border-b border-slate-200">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <Shield className="h-6 w-6 text-indigo-600" />
                                Manage Carrier Settings
                            </DialogTitle>
                            <DialogDescription className="text-slate-500">
                                Blacklist carriers or set custom margins for this customer.
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex items-center justify-between">
                            <div>
                                <h4 className="text-sm font-bold text-indigo-900">Default Margin</h4>
                                <p className="text-xs text-indigo-700">Applied if no carrier-specific margin is set.</p>
                            </div>
                            <div className="relative">
                                <input 
                                    type="number" 
                                    value={carrierConfigs?.default_margin ?? 15}
                                    onChange={(e) => setCarrierConfigs({ ...carrierConfigs, default_margin: parseFloat(e.target.value) || 0 })}
                                    className="w-24 border border-indigo-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-bold text-indigo-900" 
                                />
                                <span className="absolute right-8 top-2 text-slate-400">%</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Carrier Overrides</h4>
                            <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl bg-white shadow-sm overflow-hidden">
                                {carriersList.map(carrier => {
                                    const configs = carrierConfigs?.carriers || {};
                                    const config = configs[carrier.id] || { blacklisted: false, margin: "" };
                                    return (
                                        <div key={carrier.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <input 
                                                    type="checkbox"
                                                    checked={!!config.blacklisted}
                                                    onChange={(e) => {
                                                        const newCarriers = { ...configs };
                                                        newCarriers[carrier.id] = { ...config, blacklisted: e.target.checked };
                                                        setCarrierConfigs({ ...carrierConfigs, carriers: newCarriers });
                                                    }}
                                                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                />
                                                <div>
                                                    <p className={cn("text-sm font-bold", config.blacklisted ? "text-slate-400 line-through" : "text-slate-800")}>
                                                        {carrier.name}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400 font-mono">{carrier.scac}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] text-slate-400 font-bold uppercase">Margin:</span>
                                                <div className="relative">
                                                    <input 
                                                        type="number" 
                                                        placeholder={(carrierConfigs?.default_margin ?? 15).toString()}
                                                        value={config.margin ?? ""}
                                                        onChange={(e) => {
                                                            const newCarriers = { ...configs };
                                                            newCarriers[carrier.id] = { ...config, margin: e.target.value === "" ? "" : parseFloat(e.target.value) };
                                                            setCarrierConfigs({ ...carrierConfigs, carriers: newCarriers });
                                                        }}
                                                        disabled={config.blacklisted}
                                                        className="w-20 border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white text-right font-medium disabled:bg-slate-50 disabled:text-slate-300" 
                                                    />
                                                    <span className="absolute right-2 top-1.5 text-slate-300 text-xs">%</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setIsManageModalOpen(false)}>Cancel</Button>
                            <Button 
                                onClick={handleSaveConfigs} 
                                disabled={isSavingConfigs}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6"
                            >
                                {isSavingConfigs ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                Save Settings
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

