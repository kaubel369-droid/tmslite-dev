'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Plus, MapPin } from 'lucide-react';
import { formatPhoneNumber } from '@/lib/utils';

interface ShipperConsignee {
    id: string;
    name: string;
    address: string;
    city: string;
    state: string;
    zip: string;
}

interface Carrier {
    id: string;
    name: string;
}

interface ProductLine {
    pcs: number;
    type: string;
    weight: number;
    class: string;
    length: number;
    width: number;
    height: number;
    pallets: number;
    cubic_feet: number;
    description?: string;
}

interface SpotQuoteModalProps {
    isOpen: boolean;
    onClose: () => void;
    customerId: string;
    quoteId?: string;
    onSave: () => void;
}

export default function SpotQuoteModal({ isOpen, onClose, customerId, quoteId, onSave }: SpotQuoteModalProps) {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [locations, setLocations] = useState<ShipperConsignee[]>([]);
    const [carriers, setCarriers] = useState<Carrier[]>([]);
    const [accessorialsOptions, setAccessorialsOptions] = useState<any[]>([]);
    const [selectedAccessorials, setSelectedAccessorials] = useState<string[]>([]);
    const [tempAccessorial, setTempAccessorial] = useState<string>("");

    const [formData, setFormData] = useState({
        carrier_id: '',
        rate: '',
        carrier_rate: '',
        shipper_location_id: '',
        consignee_location_id: '',
        products_list: [
            { pcs: 1, type: 'PLT', weight: 0, class: '65', length: 48, width: 48, height: 48, pallets: 1, cubic_feet: 64, description: '' }
        ] as ProductLine[],
        additional_instructions: ''
    });

    // New Location Form State
    const [isAddingLocation, setIsAddingLocation] = useState(false);
    const [locationTarget, setLocationTarget] = useState<'shipper' | 'consignee' | null>(null);
    const [locationForm, setLocationForm] = useState({
        name: '',
        address: '',
        city: '',
        state: '',
        zip: '',
        phone: '',
        email: ''
    });

    useEffect(() => {
        if (isOpen) {
            fetchLocations();
            fetchCarriers();
            fetchAccessorials();
            if (quoteId) {
                fetchQuoteDetails();
            } else {
                setFormData({
                    carrier_id: '',
                    rate: '',
                    carrier_rate: '',
                    shipper_location_id: '',
                    consignee_location_id: '',
                    products_list: [
                        { pcs: 1, type: 'PLT', weight: 0, class: '65', length: 48, width: 48, height: 48, pallets: 1, cubic_feet: 64, description: '' }
                    ],
                    additional_instructions: ''
                });
                setSelectedAccessorials([]);
            }
        }
    }, [isOpen, quoteId]);

    const fetchLocations = async () => {
        try {
            const res = await fetch('/api/shipper-consignees');
            const data = await res.json();
            setLocations(data.shipper_consignees || []);
        } catch (err) {
            console.error('Failed to fetch locations', err);
        }
    };

    const fetchCarriers = async () => {
        try {
            const res = await fetch('/api/carriers');
            const data = await res.json();
            setCarriers(data.carriers || []);
        } catch (err) {
            console.error('Failed to fetch carriers', err);
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

    const fetchQuoteDetails = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/spot-quotes/${quoteId}`);
            const data = await res.json();
            if (data.quote) {
                setFormData({
                    carrier_id: data.quote.carrier_id || '',
                    rate: data.quote.rate?.toString() || '',
                    carrier_rate: data.quote.carrier_rate?.toString() || '',
                    shipper_location_id: data.quote.shipper_location_id || '',
                    consignee_location_id: data.quote.consignee_location_id || '',
                    products_list: Array.isArray(data.quote.products) ? data.quote.products : [
                        { pcs: 1, type: 'PLT', weight: 0, class: '65', length: 48, width: 48, height: 48, pallets: 1, cubic_feet: 64, description: '' }
                    ],
                    additional_instructions: data.quote.additional_instructions || ''
                });
                setSelectedAccessorials(Array.isArray(data.quote.accessorials) ? data.quote.accessorials : []);
            }
        } catch (err) {
            console.error('Failed to fetch quote details', err);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const openAddLocation = (target: 'shipper' | 'consignee') => {
        setLocationTarget(target);
        setIsAddingLocation(true);
        setLocationForm({ name: '', address: '', city: '', state: '', zip: '', phone: '', email: '' });
    };

    const handleLocationSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch('/api/shipper-consignees', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...locationForm, customer_id: customerId }),
            });
            if (!res.ok) throw new Error('Failed to save location');
            const data = await res.json();
            
            // Refresh locations and select the new one
            await fetchLocations();
            if (locationTarget === 'shipper') {
                setFormData(prev => ({ ...prev, shipper_location_id: data.shipper_consignee.id }));
            } else {
                setFormData(prev => ({ ...prev, consignee_location_id: data.shipper_consignee.id }));
            }
            setIsAddingLocation(false);
        } catch (err: any) {
            alert(err.message);
        } finally {
            setSaving(false);
        }
    };

    const calculateCubicFeet = (item: ProductLine) => {
        const val = ((item.length || 0) * (item.width || 0) * (item.height || 0) * (item.pcs || 1)) / 1728;
        return parseFloat(val.toFixed(2));
    };

    const updateProductLine = (index: number, field: keyof ProductLine, value: any) => {
        const newProducts = [...formData.products_list];
        const updatedItem = { ...newProducts[index], [field]: value };
        
        if (['length', 'width', 'height', 'pcs'].includes(field as string)) {
            updatedItem.cubic_feet = calculateCubicFeet(updatedItem);
        }
        
        newProducts[index] = updatedItem;
        setFormData(prev => ({ ...prev, products_list: newProducts }));
    };

    const addProductLine = () => {
        if (formData.products_list.length < 6) {
            setFormData(prev => ({
                ...prev,
                products_list: [...prev.products_list, { pcs: 1, type: 'PLT', weight: 0, class: '65', length: 48, width: 48, height: 48, pallets: 1, cubic_feet: 64, description: '' }]
            }));
        }
    };

    const removeProductLine = (index: number) => {
        if (formData.products_list.length > 1) {
            setFormData(prev => ({
                ...prev,
                products_list: prev.products_list.filter((_, i) => i !== index)
            }));
        }
    };

    const handleQuoteSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const url = quoteId ? `/api/spot-quotes/${quoteId}` : `/api/customers/${customerId}/spot-quotes`;
            const method = quoteId ? 'PUT' : 'POST';
            
            // Calculate totals for denormalized fields (optional, but good for backward compatibility if needed)
            const totals = formData.products_list.reduce((acc, item) => ({
                pcs: acc.pcs + (Number(item.pcs) || 0),
                weight: acc.weight + (Number(item.weight) || 0),
                cubic_ft: acc.cubic_ft + (Number(item.cubic_feet) || 0)
            }), { pcs: 0, weight: 0, cubic_ft: 0 });

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    carrier_id: formData.carrier_id || null,
                    shipper_location_id: formData.shipper_location_id || null,
                    consignee_location_id: formData.consignee_location_id || null,
                    rate: parseFloat(formData.rate) || 0,
                    carrier_rate: parseFloat(formData.carrier_rate) || 0,
                    pcs: totals.pcs,
                    weight: totals.weight,
                    cubic_ft: totals.cubic_ft,
                    products: formData.products_list, // This will be JSONB
                    accessorials: selectedAccessorials // This will be JSONB
                }),
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to save quote');
            }
            onSave();
            onClose();
        } catch (err: any) {
            alert(`Error: ${err.message}`);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{quoteId ? 'Edit Spot Quote' : 'Create New Spot Quote'}</DialogTitle>
                </DialogHeader>

                {loading ? (
                    <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>
                ) : (
                    <form onSubmit={handleQuoteSave} className="space-y-6 py-4">
                        {/* Shipper & Rate */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-semibold text-slate-700">Shipper Location</label>
                                    <button 
                                        type="button" 
                                        onClick={() => openAddLocation('shipper')}
                                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                                    >
                                        <Plus className="h-3 w-3" /> New Shipper
                                    </button>
                                </div>
                                <select 
                                    name="shipper_location_id" 
                                    value={formData.shipper_location_id} 
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                                >
                                    <option value="">-- Select Shipper --</option>
                                    {locations.map(loc => (
                                        <option key={loc.id} value={loc.id}>{loc.name} - {loc.city}, {loc.state}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 text-indigo-600">Customer Rate (All-In)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-slate-400">$</span>
                                    <input 
                                        type="number" 
                                        name="rate" 
                                        value={formData.rate} 
                                        onChange={handleInputChange} 
                                        step="0.01" 
                                        placeholder="0.00"
                                        required
                                        className="w-full pl-7 pr-3 py-2 border border-indigo-200 rounded-lg bg-indigo-50 font-bold text-indigo-700 outline-none focus:ring-2 focus:ring-indigo-500" 
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Consignee */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-semibold text-slate-700">Consignee Location</label>
                                    <button 
                                        type="button" 
                                        onClick={() => openAddLocation('consignee')}
                                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                                    >
                                        <Plus className="h-3 w-3" /> New Consignee
                                    </button>
                                </div>
                                <select 
                                    name="consignee_location_id" 
                                    value={formData.consignee_location_id} 
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                                >
                                    <option value="">-- Select Consignee --</option>
                                    {locations.map(loc => (
                                        <option key={loc.id} value={loc.id}>{loc.name} - {loc.city}, {loc.state}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Multi-Product Section */}

                        {/* Multi-Product Section */}
                        <div className="space-y-4 pt-4 border-t border-slate-100">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-semibold text-slate-700">Product Line Items</label>
                                <button 
                                    type="button"
                                    onClick={addProductLine}
                                    disabled={formData.products_list.length >= 6}
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
                                        {formData.products_list.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-2 py-2">
                                                    <input type="number" value={item.pcs} onChange={(e) => updateProductLine(idx, 'pcs', parseInt(e.target.value) || 0)} className="w-full border border-slate-200 rounded-md px-2 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none" />
                                                </td>
                                                <td className="px-2 py-2">
                                                    <select value={item.type || 'PLT'} onChange={(e) => updateProductLine(idx, 'type', e.target.value)} className="w-full border border-slate-200 rounded-md px-2 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white">
                                                        <option value="PLT">Pallets</option>
                                                        <option value="CTN">Cartons</option>
                                                        <option value="SKD">Skids</option>
                                                        <option value="CRATE">Crate</option>
                                                        <option value="PCS">Pieces</option>
                                                    </select>
                                                </td>
                                                <td className="px-2 py-2">
                                                    <input type="number" value={item.weight} onChange={(e) => updateProductLine(idx, 'weight', parseFloat(e.target.value) || 0)} className="w-full border border-slate-200 rounded-md px-2 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none" />
                                                </td>
                                                <td className="px-2 py-2">
                                                    <select value={item.class} onChange={(e) => updateProductLine(idx, 'class', e.target.value)} className="w-full border border-slate-200 rounded-md px-2 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white">
                                                        {[50, 55, 60, 65, 70, 77.5, 85, 92.5, 100, 110, 125, 150, 175, 200, 250].map(c => (
                                                            <option key={c} value={c}>{c}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="px-2 py-2">
                                                    <input type="number" value={item.length} onChange={(e) => updateProductLine(idx, 'length', parseFloat(e.target.value) || 0)} className="w-full border border-slate-200 rounded-md px-2 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none" />
                                                </td>
                                                <td className="px-2 py-2">
                                                    <input type="number" value={item.width} onChange={(e) => updateProductLine(idx, 'width', parseFloat(e.target.value) || 0)} className="w-full border border-slate-200 rounded-md px-2 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none" />
                                                </td>
                                                <td className="px-2 py-2">
                                                    <input type="number" value={item.height} onChange={(e) => updateProductLine(idx, 'height', parseFloat(e.target.value) || 0)} className="w-full border border-slate-200 rounded-md px-2 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none" />
                                                </td>
                                                <td className="px-4 py-2 text-right font-medium text-slate-700 text-xs">
                                                    {item.cubic_feet}
                                                </td>
                                                <td className="px-2 py-2 text-right">
                                                    <button 
                                                        type="button"
                                                        onClick={() => removeProductLine(idx)}
                                                        disabled={formData.products_list.length <= 1}
                                                        className="text-slate-300 hover:text-red-500 transition-colors disabled:opacity-0"
                                                    >
                                                        <Plus className="h-4 w-4 rotate-45" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Accessorials Section */}
                        <div className="space-y-3 pt-4 border-t border-slate-100">
                            <label className="block text-sm font-semibold text-slate-700">Accessorials</label>
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
                                    type="button"
                                    onClick={() => {
                                        if (tempAccessorial && selectedAccessorials.length < 10) {
                                            setSelectedAccessorials([...selectedAccessorials, tempAccessorial]);
                                            setTempAccessorial("");
                                        }
                                    }}
                                    disabled={!tempAccessorial || selectedAccessorials.length >= 10}
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
                                                type="button"
                                                onClick={() => setSelectedAccessorials(prev => prev.filter(id => id !== accId))}
                                                className="hover:text-indigo-900"
                                            >
                                                <Plus className="h-3 w-3 rotate-45" />
                                            </button>
                                        </div>
                                    );
                                })}
                                {selectedAccessorials.length === 0 && (
                                    <span className="text-[10px] text-slate-400 italic">No accessorials selected</span>
                                )}
                            </div>
                        </div>

                        {/* Carrier & Carrier Rate */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Carrier</label>
                                <select 
                                    name="carrier_id" 
                                    value={formData.carrier_id} 
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                >
                                    <option value="">-- Select Carrier (Optional) --</option>
                                    {carriers.map(carrier => (
                                        <option key={carrier.id} value={carrier.id}>{carrier.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Carrier Rate</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-slate-400">$</span>
                                    <input 
                                        type="number" 
                                        name="carrier_rate" 
                                        value={formData.carrier_rate} 
                                        onChange={handleInputChange} 
                                        step="0.01" 
                                        placeholder="0.00"
                                        className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-indigo-500" 
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Instructions */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Additional Instructions</label>
                            <textarea 
                                name="additional_instructions" 
                                value={formData.additional_instructions} 
                                onChange={handleInputChange} 
                                rows={2}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white resize-none" 
                            />
                        </div>

                        <DialogFooter>
                            <button 
                                type="button" 
                                onClick={onClose} 
                                className="px-4 py-2 text-slate-600 font-medium hover:text-slate-800"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                disabled={saving}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-lg transition-colors disabled:opacity-70 flex items-center gap-2"
                            >
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                                {quoteId ? 'Update Quote' : 'Create Quote'}
                            </button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>

            {/* Sub-modal for adding a new location */}
            <Dialog open={isAddingLocation} onOpenChange={(open) => !open && setIsAddingLocation(false)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Add New {locationTarget === 'shipper' ? 'Shipper' : 'Consignee'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleLocationSave} className="space-y-4 py-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Company Name *</label>
                            <input required type="text" value={locationForm.name} onChange={e => setLocationForm({...locationForm, name: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Address</label>
                            <input type="text" value={locationForm.address} onChange={e => setLocationForm({...locationForm, address: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">City</label>
                                <input type="text" value={locationForm.city} onChange={e => setLocationForm({...locationForm, city: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-sm font-medium mb-1">State</label>
                                    <input type="text" value={locationForm.state} onChange={e => setLocationForm({...locationForm, state: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Zip</label>
                                    <input type="text" value={locationForm.zip} onChange={e => setLocationForm({...locationForm, zip: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Phone</label>
                                <input type="text" value={locationForm.phone} onChange={e => setLocationForm({...locationForm, phone: formatPhoneNumber(e.target.value)})} className="w-full px-3 py-2 border rounded-md" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Email</label>
                                <input type="email" value={locationForm.email} onChange={e => setLocationForm({...locationForm, email: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
                            </div>
                        </div>
                        <DialogFooter className="pt-4">
                            <button 
                                type="submit" 
                                disabled={saving}
                                className="bg-indigo-600 text-white px-4 py-2 rounded-md font-medium hover:bg-indigo-700 disabled:opacity-70 flex items-center gap-2"
                            >
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                                Save Location
                            </button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </Dialog>
    );
}
