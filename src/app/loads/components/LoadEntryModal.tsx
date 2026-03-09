'use client';

import { useState, useEffect } from 'react';
import { X, Save, FileText, Paperclip, Truck } from 'lucide-react';

type Tab = 'Load Information' | 'Notes' | 'Documents';

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
        selected_carrier_id: '',
        notes: ''
    });

    const [customers, setCustomers] = useState<any[]>([]);
    const [shippersConsignees, setShippersConsignees] = useState<any[]>([]);

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
                    notes: ''
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
            setFormData(data.load);
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

    if (!isOpen) return null;

    // The Notes and Documents tabs are disabled if this is a new Load that hasn't been saved yet.
    const isEditing = !!loadId || !!formData.id;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl mx-auto flex flex-col my-auto max-h-[90vh]">
                {/* Header */}
                <div id="modal-header" className="flex justify-between items-center px-6 py-4 border-b border-slate-200">
                    <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                        <Truck className="h-5 w-5 text-indigo-600" />
                        {loadId ? `Edit Load ${formData.load_number}` : 'New Load'}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Tabs */}
                <div id="modal-tabs" className="flex border-b border-slate-200 px-6 bg-slate-50/50">
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
                        <div id="error-message" className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg border border-red-200 text-sm">
                            {error}
                        </div>
                    )}
                    {loading && !formData.load_number && loadId ? (
                        <div id="loading-spinner" className="py-12 flex justify-center text-slate-500 animate-pulse">Loading data...</div>
                    ) : (
                        <div id="tab-panels">
                            {activeTab === 'Load Information' && (
                                <div id="load-info-panel" className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div id="field-load-number">
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Load Number</label>
                                            <input type="text" name="load_number" value={formData.load_number || 'Auto-generated'} readOnly className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm bg-slate-100 text-slate-500 cursor-not-allowed focus:outline-none" />
                                        </div>
                                        <div id="field-status">
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                                            <select name="status" value={formData.status} onChange={handleChange} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white">
                                                <option value="Not Dispatched">Not Dispatched</option>
                                                <option value="Dispatched">Dispatched</option>
                                                <option value="In-Transit">In-Transit</option>
                                                <option value="Delivered">Delivered</option>
                                                <option value="Invoiced">Invoiced</option>
                                                <option value="Cancelled">Cancelled</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div id="field-origin">
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Origin Zip *</label>
                                            <input type="text" name="origin_zip" value={formData.origin_zip} onChange={handleChange} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" required />
                                        </div>
                                        <div id="field-destination">
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Destination Zip *</label>
                                            <input type="text" name="destination_zip" value={formData.destination_zip} onChange={handleChange} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" required />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div id="field-customer">
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Customer</label>
                                            <select name="customer_id" value={formData.customer_id} onChange={handleChange} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white">
                                                <option value="">Select Customer</option>
                                                {customers.map(c => (
                                                    <option key={c.id} value={c.id}>{c.company_name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div id="field-shipper">
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Shipper</label>
                                            <select name="shipper_id" value={formData.shipper_id} onChange={handleChange} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white">
                                                <option value="">Select Shipper</option>
                                                {shippersConsignees.map(s => (
                                                    <option key={s.id} value={s.id}>{s.name} ({s.city}, {s.state})</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div id="field-consignee">
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Consignee</label>
                                            <select name="consignee_id" value={formData.consignee_id} onChange={handleChange} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white">
                                                <option value="">Select Consignee</option>
                                                {shippersConsignees.map(s => (
                                                    <option key={s.id} value={s.id}>{s.name} ({s.city}, {s.state})</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div id="field-weight">
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Total Weight *</label>
                                            <input type="number" step="0.01" name="total_weight" value={formData.total_weight} onChange={handleChange} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" required />
                                        </div>
                                        <div id="field-nmfc">
                                            <label className="block text-sm font-medium text-slate-700 mb-1">NMFC Class</label>
                                            <input type="text" name="nmfc_class" value={formData.nmfc_class} onChange={handleChange} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                                        </div>
                                        <div id="field-pallets">
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Total Pallets</label>
                                            <input type="number" name="total_pallets" value={formData.total_pallets} onChange={handleChange} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div id="field-pickup-date">
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Pickup Date</label>
                                            <input type="date" name="pickup_date" value={formData.pickup_date} onChange={handleChange} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                                        </div>
                                        <div id="field-delivery-date">
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Delivery Date</label>
                                            <input type="date" name="delivery_date" value={formData.delivery_date} onChange={handleChange} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div id="field-customer-rate">
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Customer Rate ($)</label>
                                            <input type="number" step="0.01" name="customer_rate" value={formData.customer_rate} onChange={handleChange} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                                        </div>
                                        <div id="field-carrier-rate">
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Carrier Rate ($)</label>
                                            <input type="number" step="0.01" name="carrier_rate" value={formData.carrier_rate} onChange={handleChange} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div id="field-fuel-surcharge">
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Fuel Surcharge ($)</label>
                                            <input type="number" step="0.01" name="fuel_surcharge" value={formData.fuel_surcharge} onChange={handleChange} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                                        </div>
                                        <div id="field-carrier-quote">
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Carrier Quote ID</label>
                                            <input type="text" name="carrier_quote_id" value={formData.carrier_quote_id} onChange={handleChange} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div id="field-carrier-id">
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Selected Carrier ID</label>
                                            <input type="text" name="selected_carrier_id" value={formData.selected_carrier_id} onChange={handleChange} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                                        </div>
                                        <div id="field-carrier-pro">
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Carrier PRO Number</label>
                                            <input type="text" name="carrier_pro_number" value={formData.carrier_pro_number} onChange={handleChange} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
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
                                            rows={8}
                                            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                            placeholder="Add notes related to this load..."
                                        />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'Documents' && (
                                <div id="documents-panel" className="space-y-4">
                                    <div id="upload-area" className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center bg-slate-50">
                                        <Paperclip className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                                        <h3 className="text-sm font-medium text-slate-700">Upload Documents</h3>
                                        <p className="text-xs text-slate-500 mt-1">Drag and drop or click to upload BOL, POD, etc.</p>
                                        <button className="mt-4 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-50 transition-colors">
                                            Select Files
                                        </button>
                                        {/* This is a placeholder for file upload component functionality */}
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
                        className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-100 transition-colors text-sm font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        id="btn-save"
                        onClick={handleSave}
                        disabled={loading}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm font-medium flex items-center gap-2 disabled:bg-indigo-400"
                    >
                        <Save className="h-4 w-4" />
                        {loading ? 'Saving...' : 'Save Load'}
                    </button>
                </div>
            </div>
        </div>
    );
}
