'use client';

import { useState, useEffect } from 'react';
import { X, Save, FileText, Paperclip, Truck, Plus, Trash2 } from 'lucide-react';
import ShipperConsigneeModal from './ShipperConsigneeModal';

type Tab = 'Load Information' | 'Notes' | 'Documents';

interface Product {
    pallets: string;
    weight: string;
    description: string;
    nmfc: string;
}

interface LoadEntryModalProps {
    isOpen: boolean;
    onClose: () => void;
    loadId: string | null;
    onSaveSuccess: () => void;
}

export default function LoadEntryModal({ isOpen, onClose, loadId, onSaveSuccess }: LoadEntryModalProps) {
    const [activeTab, setActiveTab] = useState<Tab>('Load Information');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState<any>({
        load_number: '',
        customer_id: '',
        shipper_id: '',
        consignee_id: '',
        status: 'Not Dispatched',
        origin_zip: '',
        destination_zip: '',
        total_weight: '',
        nmfc_class: '',
        total_pallets: '',
        pickup_date: '',
        delivery_date: '',
        customer_rate: 0,
        carrier_rate: 0,
        fuel_surcharge: 0,
        carrier_quote_id: '',
        carrier_pro_number: '',
        bol_number: '',
        selected_carrier_id: '',
        notes: '',
        products: [] as Product[]
    });

    const [customers, setCustomers] = useState<any[]>([]);
    const [shippersConsignees, setShippersConsignees] = useState<any[]>([]);

    // Modal states for adding shipper/consignee
    const [scModalOpen, setScModalOpen] = useState(false);
    const [scModalType, setScModalType] = useState<'Shipper' | 'Consignee'>('Shipper');

    useEffect(() => {
        if (isOpen) {
            fetchDropdownData();
            if (loadId) {
                fetchLoadData(loadId);
            } else {
                setFormData({
                    load_number: '',
                    customer_id: '',
                    shipper_id: '',
                    consignee_id: '',
                    status: 'Not Dispatched',
                    origin_zip: '',
                    destination_zip: '',
                    total_weight: '',
                    nmfc_class: '',
                    total_pallets: '',
                    pickup_date: '',
                    delivery_date: '',
                    customer_rate: 0,
                    carrier_rate: 0,
                    fuel_surcharge: 0,
                    carrier_quote_id: '',
                    carrier_pro_number: '',
                    selected_carrier_id: '',
                    notes: '',
                    products: [{ pallets: '', weight: '', description: '', nmfc: '' }]
                });
                setActiveTab('Load Information');
            }
        }
    }, [isOpen, loadId]);

    const fetchDropdownData = async () => {
        try {
            const [custRes, scRes] = await Promise.all([
                fetch('/api/customers'),
                fetch('/api/shipper-consignees')
            ]);

            if (custRes.ok) {
                const custData = await custRes.json();
                setCustomers(custData.customers || []);
            }
            if (scRes.ok) {
                const scData = await scRes.json();
                setShippersConsignees(scData.shipper_consignees || []);
            }
        } catch (err) {
            console.error("Failed to load drop down data", err);
        }
    };

    const fetchLoadData = async (id: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/loads/${id}`);
            if (!res.ok) throw new Error('Failed to fetch load');
            const data = await res.json();
            const load = data.load;

            // Map load_products to products state
            if (load.load_products && Array.isArray(load.load_products)) {
                load.products = load.load_products.map((p: any) => ({
                    pallets: p.pallets?.toString() || '',
                    weight: p.weight?.toString() || '',
                    description: p.description || '',
                    nmfc: p.nmfc_class || ''
                }));
            }

            // Ensure products is an array if still empty
            if (!load.products || !Array.isArray(load.products) || load.products.length === 0) {
                load.products = [{ pallets: '', weight: '', description: '', nmfc: '' }];
            }

            setFormData(load);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev: any) => ({ ...prev, [name]: value }));
    };

    const handleProductChange = (index: number, field: keyof Product, value: string) => {
        const updatedProducts = [...formData.products];
        updatedProducts[index] = { ...updatedProducts[index], [field]: value };
        setFormData((prev: any) => ({ ...prev, products: updatedProducts }));
    };

    const addProductLine = () => {
        if (formData.products.length < 6) {
            setFormData((prev: any) => ({
                ...prev,
                products: [...prev.products, { pallets: '', weight: '', description: '', nmfc: '' }]
            }));
        }
    };

    const removeProductLine = (index: number) => {
        if (formData.products.length > 1) {
            const updatedProducts = formData.products.filter((_: any, i: number) => i !== index);
            setFormData((prev: any) => ({ ...prev, products: updatedProducts }));
        }
    };

    const handleSave = async () => {
        setLoading(true);
        setError(null);
        try {
            const method = loadId ? 'PUT' : 'POST';
            const url = loadId ? `/api/loads/${loadId}` : '/api/loads';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to save load');
            }

            onSaveSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const openScModal = (type: 'Shipper' | 'Consignee') => {
        setScModalType(type);
        setScModalOpen(true);
    };

    const handleScSaveSuccess = (newRecord: any) => {
        setShippersConsignees((prev: any[]) => [...prev, newRecord]);
        if (scModalType === 'Shipper') {
            setFormData((prev: any) => ({ ...prev, shipper_id: newRecord.id }));
        } else {
            setFormData((prev: any) => ({ ...prev, consignee_id: newRecord.id }));
        }
    };

    if (!isOpen) return null;

    const isEditing = !!loadId || !!formData.id;
    const selectedShipper = shippersConsignees.find(s => s.id === formData.shipper_id);
    const selectedConsignee = shippersConsignees.find(s => s.id === formData.consignee_id);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl mx-auto flex flex-col my-auto max-h-[95vh]">
                {/* Header */}
                <div id="modal-header" className="flex justify-between items-center px-6 py-4 border-b border-slate-200 bg-slate-50/50 rounded-t-xl">
                    <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                        <Truck className="h-5 w-5 text-indigo-600" />
                        {loadId ? `Edit Load ${formData.load_number}` : 'New Load Entry'}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors bg-white p-1 rounded-full shadow-sm">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Tabs */}
                <div id="modal-tabs" className="flex border-b border-slate-200 px-6 bg-slate-50/30">
                    <button
                        id="tab-load-info"
                        className={`py-3 px-4 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'Load Information' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'}`}
                        onClick={() => setActiveTab('Load Information')}
                    >
                        <FileText className="h-4 w-4" /> Load Information
                    </button>
                    <button
                        id="tab-notes"
                        className={`py-3 px-4 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${!isEditing ? 'opacity-50 cursor-not-allowed text-slate-400 border-transparent' : activeTab === 'Notes' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'}`}
                        onClick={() => isEditing && setActiveTab('Notes')}
                        disabled={!isEditing}
                        title={!isEditing ? 'Save load to enable Notes' : ''}
                    >
                        Notes
                    </button>
                    <button
                        id="tab-documents"
                        className={`py-3 px-4 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${!isEditing ? 'opacity-50 cursor-not-allowed text-slate-400 border-transparent' : activeTab === 'Documents' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'}`}
                        onClick={() => isEditing && setActiveTab('Documents')}
                        disabled={!isEditing}
                        title={!isEditing ? 'Save load to enable Documents' : ''}
                    >
                        <Paperclip className="h-4 w-4" /> Documents
                    </button>
                </div>

                {/* Content */}
                <div id="modal-content" className="p-6 overflow-y-auto flex-1 bg-white">
                    {error && (
                        <div id="error-message" className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg border border-red-200 text-sm animate-in fade-in slide-in-from-top-1">
                            {error}
                        </div>
                    )}
                    {loading && !formData.load_number && loadId ? (
                        <div id="loading-spinner" className="py-24 flex flex-col items-center justify-center text-slate-500">
                            <Truck className="h-12 w-12 text-indigo-200 animate-bounce mb-4" />
                            <span className="animate-pulse">Loading load data...</span>
                        </div>
                    ) : (
                        <div id="tab-panels">
                            {activeTab === 'Load Information' && (
                                <div id="load-info-panel" className="space-y-8">
                                    {/* Top Row: Meta Info */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div id="field-load-number">
                                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Load Number</label>
                                            <input type="text" name="load_number" value={formData.load_number || 'Auto-generated'} readOnly className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-slate-50 text-slate-500 cursor-not-allowed" />
                                        </div>
                                        <div id="field-pro-number">
                                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Pro Number</label>
                                            <input type="text" name="carrier_pro_number" value={formData.carrier_pro_number} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all" placeholder="Enter PRO#" />
                                        </div>
                                        <div id="field-bol-number">
                                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">BOL Number</label>
                                            <input type="text" name="bol_number" value={formData.bol_number || ''} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all" placeholder="Enter BOL#" />
                                        </div>
                                        <div id="field-status">
                                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Status</label>
                                            <select name="status" value={formData.status} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-medium text-slate-700">
                                                <option value="Not Dispatched">Not Dispatched</option>
                                                <option value="Dispatched">Dispatched</option>
                                                <option value="In-Transit">In-Transit</option>
                                                <option value="Delivered">Delivered</option>
                                                <option value="Invoiced">Invoiced</option>
                                                <option value="Cancelled">Cancelled</option>
                                            </select>
                                        </div>
                                    </div>

                                    <hr className="border-slate-100" />

                                    {/* Customer Selection */}
                                    <div id="field-customer">
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Customer</label>
                                        <select name="customer_id" value={formData.customer_id} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white">
                                            <option value="">Select Customer</option>
                                            {customers.map(c => (
                                                <option key={c.id} value={c.id}>{c.company_name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Shipper/Consignee Row */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div id="field-shipper-section" className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Shipper</label>
                                                <button
                                                    type="button"
                                                    onClick={() => openScModal('Shipper')}
                                                    className="text-indigo-600 hover:text-indigo-800 text-xs font-bold flex items-center gap-1 bg-indigo-50 px-2 py-1 rounded"
                                                >
                                                    <Plus className="h-3 w-3" /> New Shipper
                                                </button>
                                            </div>
                                            <select name="shipper_id" value={formData.shipper_id} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white">
                                                <option value="">Select Shipper</option>
                                                {shippersConsignees.map(s => (
                                                    <option key={s.id} value={s.id}>{s.name}</option>
                                                ))}
                                            </select>
                                            {selectedShipper && (
                                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-1">
                                                    <p className="font-semibold text-slate-800">{selectedShipper.name}</p>
                                                    <p>{selectedShipper.address}</p>
                                                    <p>{selectedShipper.city}, {selectedShipper.state} {selectedShipper.zip}</p>
                                                    <p>{selectedShipper.phone}</p>
                                                </div>
                                            )}
                                        </div>

                                        <div id="field-consignee-section" className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Consignee</label>
                                                <button
                                                    type="button"
                                                    onClick={() => openScModal('Consignee')}
                                                    className="text-indigo-600 hover:text-indigo-800 text-xs font-bold flex items-center gap-1 bg-indigo-50 px-2 py-1 rounded"
                                                >
                                                    <Plus className="h-3 w-3" /> New Consignee
                                                </button>
                                            </div>
                                            <select name="consignee_id" value={formData.consignee_id} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white">
                                                <option value="">Select Consignee</option>
                                                {shippersConsignees.map(s => (
                                                    <option key={s.id} value={s.id}>{s.name}</option>
                                                ))}
                                            </select>
                                            {selectedConsignee && (
                                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-1">
                                                    <p className="font-semibold text-slate-800">{selectedConsignee.name}</p>
                                                    <p>{selectedConsignee.address}</p>
                                                    <p>{selectedConsignee.city}, {selectedConsignee.state} {selectedConsignee.zip}</p>
                                                    <p>{selectedConsignee.phone}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Products Section */}
                                    <div id="products-section" className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Product Line Items</label>
                                            <button
                                                type="button"
                                                onClick={addProductLine}
                                                disabled={formData.products.length >= 6}
                                                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-2 transition-colors disabled:bg-slate-300"
                                            >
                                                <Plus className="h-3 w-3" /> Add Product
                                            </button>
                                        </div>

                                        <div className="overflow-x-auto">
                                            <table className="w-full border-collapse">
                                                <thead>
                                                    <tr className="text-left text-[10px] uppercase tracking-wider text-slate-400 font-bold border-b border-slate-100">
                                                        <th className="pb-2 w-20">Pallets</th>
                                                        <th className="pb-2 w-28">Weight</th>
                                                        <th className="pb-2">Product Description</th>
                                                        <th className="pb-2 w-24">NMFC</th>
                                                        <th className="pb-2 w-10"></th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50">
                                                    {formData.products.map((p: Product, index: number) => (
                                                        <tr key={index} className="group">
                                                            <td className="py-2 pr-2">
                                                                <input
                                                                    type="text"
                                                                    value={p.pallets}
                                                                    onChange={(e) => handleProductChange(index, 'pallets', e.target.value)}
                                                                    className="w-full border border-slate-200 rounded-md px-2 py-1.5 text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                                                                    placeholder="0"
                                                                />
                                                            </td>
                                                            <td className="py-2 pr-2">
                                                                <input
                                                                    type="text"
                                                                    value={p.weight}
                                                                    onChange={(e) => handleProductChange(index, 'weight', e.target.value)}
                                                                    className="w-full border border-slate-200 rounded-md px-2 py-1.5 text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                                                                    placeholder="LBS"
                                                                />
                                                            </td>
                                                            <td className="py-2 pr-2">
                                                                <input
                                                                    type="text"
                                                                    value={p.description}
                                                                    onChange={(e) => handleProductChange(index, 'description', e.target.value)}
                                                                    className="w-full border border-slate-200 rounded-md px-2 py-1.5 text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                                                                    placeholder="Product description"
                                                                />
                                                            </td>
                                                            <td className="py-2 pr-2">
                                                                <input
                                                                    type="text"
                                                                    value={p.nmfc}
                                                                    onChange={(e) => handleProductChange(index, 'nmfc', e.target.value)}
                                                                    className="w-full border border-slate-200 rounded-md px-2 py-1.5 text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                                                                    placeholder="Class"
                                                                />
                                                            </td>
                                                            <td className="py-2 text-right">
                                                                <button
                                                                    onClick={() => removeProductLine(index)}
                                                                    disabled={formData.products.length <= 1}
                                                                    className="text-slate-300 hover:text-red-500 transition-colors disabled:opacity-0"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                            {formData.products.length >= 6 && (
                                                <p className="text-[10px] text-amber-600 mt-1 font-medium italic">* Maximum 6 product lines allowed</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Zip and Dates */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Route Information</label>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Origin Zip</label>
                                                    <input type="text" name="origin_zip" value={formData.origin_zip} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" required />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Destination Zip</label>
                                                    <input type="text" name="destination_zip" value={formData.destination_zip} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" required />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Dates</label>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Pickup Date</label>
                                                    <input type="date" name="pickup_date" value={formData.pickup_date} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Delivery Date</label>
                                                    <input type="date" name="delivery_date" value={formData.delivery_date} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Rates */}
                                    <div className="space-y-4">
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Financial Information</label>
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Customer Rate ($)</label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                                                    <input type="number" step="0.01" name="customer_rate" value={formData.customer_rate} onChange={handleChange} className="w-full border border-slate-300 rounded-lg pl-7 pr-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Carrier Rate ($)</label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                                                    <input type="number" step="0.01" name="carrier_rate" value={formData.carrier_rate} onChange={handleChange} className="w-full border border-slate-300 rounded-lg pl-7 pr-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Fuel Surcharge ($)</label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                                                    <input type="number" step="0.01" name="fuel_surcharge" value={formData.fuel_surcharge} onChange={handleChange} className="w-full border border-slate-300 rounded-lg pl-7 pr-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Quote ID</label>
                                                <input type="text" name="carrier_quote_id" value={formData.carrier_quote_id} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" placeholder="OPTIONAL" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'Notes' && (
                                <div id="notes-panel" className="space-y-4">
                                    <div id="field-notes">
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Internal Notes</label>
                                        <textarea
                                            name="notes"
                                            value={formData.notes || ''}
                                            onChange={handleChange}
                                            rows={12}
                                            className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-inner"
                                            placeholder="Add instructions, delivery requirements, or carrier specific notes here..."
                                        />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'Documents' && (
                                <div id="documents-panel" className="space-y-4 py-8">
                                    <div id="upload-area" className="border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center bg-slate-50/50 hover:bg-slate-50 hover:border-indigo-200 transition-all cursor-pointer group">
                                        <div className="bg-white h-16 w-16 rounded-full shadow-md flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                            <Paperclip className="h-8 w-8 text-indigo-400" />
                                        </div>
                                        <h3 className="text-sm font-bold text-slate-700">Upload Load Documents</h3>
                                        <p className="text-xs text-slate-400 mt-2 max-w-xs mx-auto text-center leading-relaxed">Drag and drop files here or click to browse. Max file size: 10MB.</p>
                                        <button className="mt-6 bg-white border border-slate-200 text-indigo-600 px-6 py-2 rounded-lg text-xs font-bold hover:shadow-sm hover:border-indigo-100 transition-all active:scale-95">
                                            BROWSE FILES
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div id="modal-footer" className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 rounded-b-xl">
                    <button
                        id="btn-cancel"
                        onClick={onClose}
                        className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 hover:text-slate-800 transition-all text-sm font-bold active:scale-95"
                    >
                        CANCEL
                    </button>
                    <button
                        id="btn-save"
                        onClick={handleSave}
                        disabled={loading}
                        className="px-8 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all text-sm font-bold flex items-center gap-2 disabled:bg-indigo-300 shadow-lg shadow-indigo-100 active:scale-95"
                    >
                        <Save className="h-4 w-4" />
                        {loading ? 'SAVING...' : 'SAVE LOAD'}
                    </button>
                </div>

                {/* Nested Modals */}
                <ShipperConsigneeModal
                    isOpen={scModalOpen}
                    onClose={() => setScModalOpen(false)}
                    onSaveSuccess={handleScSaveSuccess}
                    type={scModalType}
                />
            </div>
        </div>
    );
}
