'use client';

import { useState, useEffect, useMemo } from 'react';
import { Truck, MapPin, Package, Plus, Trash2, Search, Loader2, ChevronDown, Check } from 'lucide-react';
import { FreightItem, RateQuote } from '@/lib/carriers/interfaces';
import { cn } from '@/lib/utils';

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
}

export default function LTLRatingScreen({ customerId, carrierId, initialData }: LTLRatingScreenProps) {
    const [origin, setOrigin] = useState<Address>({ zip: '', city: '', state: '' });
    const [destination, setDestination] = useState<Address>({ zip: '', city: '', state: '' });
    const [items, setItems] = useState<ProductLine[]>([
        { pcs: 1, type: 'PLT', weight: 0, class: '65', length: 48, width: 48, height: 48, pallets: 1, cubic_feet: 0 }
    ]);
    const [selectedAccessorials, setSelectedAccessorials] = useState<string[]>([]);
    const [accessorialsOptions, setAccessorialsOptions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [quotes, setQuotes] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Zip Lookup States
    const [originLoading, setOriginLoading] = useState(false);
    const [destLoading, setDestLoading] = useState(false);
    const [originCities, setOriginCities] = useState<any[]>([]);
    const [destCities, setDestCities] = useState<any[]>([]);

    useEffect(() => {
        fetchAccessorials();
    }, []);

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
                                    <th className="px-4 py-3 w-16">Pcs</th>
                                    <th className="px-4 py-3 w-28">Type</th>
                                    <th className="px-4 py-3 w-24">Weight</th>
                                    <th className="px-4 py-3 w-24">Class</th>
                                    <th className="px-4 py-3 w-20">L(in)</th>
                                    <th className="px-4 py-3 w-20">W(in)</th>
                                    <th className="px-4 py-3 w-20">H(in)</th>
                                    <th className="px-4 py-3 text-right">Cubic Ft</th>
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
                    <div className="w-full md:w-1/2 space-y-2">
                        <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">Accessorials (Max 6)</label>
                        <div className="relative group">
                            <select 
                                multiple
                                value={selectedAccessorials}
                                onChange={(e) => {
                                    const vals = Array.from(e.target.selectedOptions, option => option.value);
                                    if (vals.length <= 6) setSelectedAccessorials(vals);
                                }}
                                className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white shadow-sm min-h-[120px]"
                            >
                                {accessorialsOptions.map(opt => (
                                    <option key={opt.id} value={opt.id} className="py-1">{opt.name}</option>
                                ))}
                                {accessorialsOptions.length === 0 && (
                                    <>
                                        <option value="liftgate_pickup">Liftgate Pickup</option>
                                        <option value="liftgate_delivery">Liftgate Delivery</option>
                                        <option value="residential_delivery">Residential Delivery</option>
                                        <option value="inside_delivery">Inside Delivery</option>
                                        <option value="limited_access">Limited Access</option>
                                        <option value="notification">Prior Notification</option>
                                    </>
                                )}
                            </select>
                            <div className="absolute top-2 right-2 pointer-events-none text-slate-300">
                                <ChevronDown className="h-5 w-5" />
                            </div>
                        </div>
                        <p className="text-[10px] text-slate-400 italic">Hold Ctrl/Cmd to select multiple.</p>
                    </div>

                    <button 
                        id="get-rates-btn"
                        onClick={handleGetRates}
                        disabled={loading || !origin.zip || !destination.zip}
                        className="w-full md:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-indigo-200 active:scale-95 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <Search className="h-5 w-5" />
                        )}
                        Get Rates
                    </button>
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
                                        <th className="px-6 py-4 text-right">Base Rate</th>
                                        <th className="px-6 py-4 text-right">Accessorials</th>
                                        <th className="px-6 py-4 text-right text-indigo-600">Carrier Total</th>
                                        <th className="px-6 py-4 text-center">Transit</th>
                                        <th className="px-6 py-4 text-right text-emerald-600 bg-emerald-50/50">Customer Rate</th>
                                        <th className="px-6 py-4"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {quotes.map((quote, idx) => (
                                        <tr key={idx} className="hover:bg-indigo-50/20 transition-colors group">
                                            <td className="px-6 py-4 whitespace-nowrap">
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
                                            <td className="px-6 py-4 text-right text-slate-600 font-medium">
                                                ${(quote.details?.baseRate || quote.totalCost * 0.8).toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 text-right text-slate-600 font-medium font-mono text-xs">
                                                +${(quote.details?.fuelSurcharge || 0).toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-indigo-600">
                                                ${quote.totalCost.toFixed(2)}
                                            </td>
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
                                                <button className="bg-white border-2 border-slate-200 hover:border-indigo-600 text-slate-700 hover:text-indigo-700 font-bold px-4 py-2 rounded-lg text-xs transition-all flex items-center gap-2 ml-auto shadow-sm active:scale-95">
                                                    Select
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
        </div>
    );
}

