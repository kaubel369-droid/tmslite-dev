'use client';

import { useState, useEffect } from 'react';
import { X, Save, FileText, Paperclip, Truck, Plus, Trash2, Shield, Eye, EyeOff, Download, Loader2, Lock, Globe, Printer } from 'lucide-react';
import ShipperConsigneeModal from './ShipperConsigneeModal';
import CalendarEventModal from '@/components/CalendarEventModal';

type Tab = 'Load Information' | 'Notes' | 'Documents';

interface Product {
    pallets: string;
    weight: string;
    description: string;
    nmfc: string;
    unit_type: string;
}

interface LoadEntryModalProps {
    isOpen: boolean;
    onClose: () => void;
    loadId: string | null;
    onSaveSuccess: () => void;
    restrictedCustomerId?: string; // If provided, locks the customer to this ID
}

export default function LoadEntryModal({ isOpen, onClose, loadId, onSaveSuccess, restrictedCustomerId }: LoadEntryModalProps) {
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
        internal_notes: '',
        bol_notes: '',
        tracing_notes: '',
        invoice_notes: '',
        load_type: 'LTL',
        mileage: '',
        products: [] as Product[]
    });

    const [customers, setCustomers] = useState<any[]>([]);
    const [shippersConsignees, setShippersConsignees] = useState<any[]>([]);
    const [carriers, setCarriers] = useState<any[]>([]);
    const [documents, setDocuments] = useState<any[]>([]);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [uploading, setUploading] = useState(false);
    // Modal states for adding shipper/consignee
    const [scModalOpen, setScModalOpen] = useState(false);
    const [scModalType, setScModalType] = useState<'Shipper' | 'Consignee'>('Shipper');
    const [isCalculatingMileage, setIsCalculatingMileage] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState('bol');
    const [isPrinting, setIsPrinting] = useState(false);
    const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchDropdownData();
            if (loadId) {
                fetchLoadData(loadId);
                fetchDocuments(loadId);
            } else {
                setFormData({
                    load_number: '',
                    customer_id: restrictedCustomerId || '',
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
                    internal_notes: '',
                    bol_notes: '',
                    tracing_notes: '',
                    invoice_notes: '',
                    load_type: 'LTL',
                    mileage: '',
                    products: [{ pallets: '', weight: '', description: '', nmfc: '', unit_type: 'PLT' }]
                });
                setDocuments([]);
            }
            setActiveTab('Load Information');
            setError(null);
        }
    }, [isOpen, loadId, restrictedCustomerId]);

    const fetchDropdownData = async () => {
        try {
            const [custRes, scRes, carrierRes] = await Promise.all([
                fetch('/api/customers'),
                fetch('/api/shipper-consignees'),
                fetch('/api/carriers')
            ]);

            if (custRes.ok) {
                const custData = await custRes.json();
                setCustomers(custData.customers || []);
            }
            if (scRes.ok) {
                const scData = await scRes.json();
                setShippersConsignees(scData.shipper_consignees || []);
            }
            if (carrierRes.ok) {
                const carrierData = await carrierRes.json();
                setCarriers(carrierData.carriers || []);
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
                    nmfc: p.nmfc_class || '',
                    unit_type: p.unit_type || 'PLT'
                }));
            }

            // Ensure products is an array if still empty
            if (!load.products || !Array.isArray(load.products) || load.products.length === 0) {
                load.products = [{ pallets: '', weight: '', description: '', nmfc: '', unit_type: 'PLT' }];
            }

            // If new load number returned, update it
            if (load.load_number) {
                setFormData(load);
            } else {
                setFormData(load);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Auto-update zips based on shipper/consignee
    useEffect(() => {
        if (formData.shipper_id) {
            const shipper = shippersConsignees.find(s => s.id === formData.shipper_id);
            if (shipper && shipper.zip !== formData.origin_zip) {
                setFormData((prev: any) => ({ ...prev, origin_zip: shipper.zip }));
            }
        }
    }, [formData.shipper_id, shippersConsignees]);

    useEffect(() => {
        if (formData.consignee_id) {
            const consignee = shippersConsignees.find(s => s.id === formData.consignee_id);
            if (consignee && consignee.zip !== formData.destination_zip) {
                setFormData((prev: any) => ({ ...prev, destination_zip: consignee.zip }));
            }
        }
    }, [formData.consignee_id, shippersConsignees]);
 
    // Auto-calculate mileage when locations change
    useEffect(() => {
        const updateMileage = async () => {
            // Only trigger if both are selected and we're not currently editing/saving
            if (!formData.shipper_id || !formData.consignee_id || loading) return;

            const shipper = shippersConsignees.find(s => s.id === formData.shipper_id);
            const consignee = shippersConsignees.find(s => s.id === formData.consignee_id);

            if (!shipper || !consignee) return;

            // If mileage already exists for an existing load, don't overwrite it unless locations actually changed from what's stored
            // For now, let's just calculate if it's 0 or empty to be safe, or if locations were just changed by user selection
            
            setIsCalculatingMileage(true);
            try {
                const origin = `${shipper.address}, ${shipper.city}, ${shipper.state} ${shipper.zip}`;
                const destination = `${consignee.address}, ${consignee.city}, ${consignee.state} ${consignee.zip}`;
                
                const res = await fetch(`/api/distance/calculate?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`);
                if (!res.ok) throw new Error('Distance API failed');
                
                const data = await res.json();
                if (data.mileage !== null) {
                    setFormData((prev: any) => ({ ...prev, mileage: data.mileage.toString() }));
                }
            } catch (err) {
                console.error("Mileage calculation error:", err);
            } finally {
                setIsCalculatingMileage(false);
            }
        };

        const debounceTimer = setTimeout(updateMileage, 1500); 
        return () => clearTimeout(debounceTimer);
    }, [formData.shipper_id, formData.consignee_id, shippersConsignees]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev: any) => ({ ...prev, [name]: value }));
    };

    const handleProductChange = (index: number, field: keyof Product, value: string) => {
        const updatedProducts = [...formData.products];
        updatedProducts[index] = { ...updatedProducts[index], [field]: value };
        setFormData((prev: any) => ({ ...prev, products: updatedProducts }));
    };

    const fetchDocuments = async (idToFetch?: string) => {
        const currentId = idToFetch || loadId || formData.id;
        if (!currentId) return;
        try {
            const res = await fetch(`/api/loads/${currentId}/documents`);
            if (res.ok) {
                const data = await res.json();
                setDocuments(data.documents || []);
            }
        } catch (err) {
            console.error("Failed to load documents", err);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isPrivate: boolean) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const currentId = loadId || formData.id;
        if (!currentId) {
            setError("Please save the load before uploading documents.");
            return;
        }

        setUploading(true);
        const fData = new FormData();
        fData.append('file', file);
        fData.append('is_private', isPrivate.toString());
        fData.append('type', 'Other'); 

        try {
            const res = await fetch(`/api/loads/${currentId}/documents`, {
                method: 'POST',
                body: fData
            });

            if (!res.ok) throw new Error('Upload failed');
            
            fetchDocuments();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setUploading(false);
            if (e.target) e.target.value = '';
        }
    };

    const handleDeleteDocument = async (documentId: string) => {
        const currentId = loadId || formData.id;
        if (!confirm('Are you sure you want to delete this document?')) return;

        try {
            const res = await fetch(`/api/loads/${currentId}/documents/${documentId}`, {
                method: 'DELETE'
            });

            if (!res.ok) throw new Error('Delete failed');
            
            fetchDocuments();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const addProductLine = () => {
        if (formData.products.length < 6) {
            setFormData((prev: any) => ({
                ...prev,
                products: [...prev.products, { pallets: '', weight: '', description: '', nmfc: '', unit_type: 'PLT' }]
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
            const currentId = loadId || formData.id;
            const method = currentId ? 'PUT' : 'POST';
            const url = currentId ? `/api/loads/${currentId}` : '/api/loads';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to save load');
            }

            const data = await res.json();
            if (data.load) {
                // Update form with saved data (useful for new ID and load number)
                setFormData((prev: any) => ({ ...prev, ...data.load }));

                // If it was a new load, we now have an ID for future updates
                if (!loadId) {
                    // We can't actually change loadId prop, but we can set internal state if we had it
                    // or just let the caller know. For now, since it's a "start over" and "keep open",
                    // the parent might need to refresh or the modal needs to handle its own "editing" state.
                    // The easiest fix is to ensure the parent refreshes without closing.
                }
            }

            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
            onSaveSuccess();
            // Removed onClose() as requested
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = async () => {
        const id = loadId || formData.id;
        if (!id) {
            setError("Please save the load before printing.");
            return;
        }
        
        setIsPrinting(true);
        try {
            // Ensure data is saved before printing
            await handleSave();
            window.open(`/api/print?id=${id}&type=load&template=${selectedTemplate}`, '_blank');
        } catch (err: any) {
            setError(`Failed to save before printing: ${err.message}`);
        } finally {
            setIsPrinting(false);
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

                    <div className="flex items-center gap-3">
                        {isEditing && (
                            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-2 py-1 shadow-sm">
                                <select 
                                    className="text-sm font-medium text-slate-700 bg-transparent border-none focus:ring-0 cursor-pointer outline-none"
                                    value={selectedTemplate}
                                    onChange={(e) => setSelectedTemplate(e.target.value)}
                                >
                                    <option value="bol">Bill of Lading</option>
                                    <option value="customer-load-confirmation">Customer Confirmation</option>
                                    <option value="carrier-load-confirmation">Carrier Confirmation</option>
                                    <option value="customer-invoice">Customer Invoice</option>
                                </select>
                                <div className="w-[1px] h-4 bg-slate-200 mx-1"></div>
                                <button
                                    onClick={handlePrint}
                                    disabled={isPrinting || loading}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-md hover:bg-indigo-100 transition-colors text-sm font-semibold disabled:opacity-50"
                                >
                                    {isPrinting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
                                    Print
                                </button>
                            </div>
                        )}
                        {isEditing && (
                            <button
                                type="button"
                                onClick={() => setIsCalendarModalOpen(true)}
                                className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-1.5 px-3 rounded-lg flex items-center gap-2 transition-colors shadow-sm text-sm"
                            >
                                Add New Event
                            </button>
                        )}
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors bg-white p-1 rounded-full shadow-sm">
                            <X className="h-6 w-6" />
                        </button>
                    </div>
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
                    {saveSuccess && (
                        <div id="save-success-message" className="mb-4 bg-green-50 text-green-600 p-3 rounded-lg border border-green-200 text-sm animate-in fade-in slide-in-from-top-1 flex items-center gap-2">
                            <Save className="h-4 w-4" /> Load saved successfully!
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
                                            <select 
                                                name="status" 
                                                value={formData.status} 
                                                onChange={handleChange} 
                                                disabled={!!restrictedCustomerId}
                                                className={`w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-medium text-slate-700 ${restrictedCustomerId ? 'bg-slate-50 cursor-not-allowed' : ''}`}
                                            >
                                                <option value="Not Dispatched">Not Dispatched</option>
                                                <option value="Dispatched">Dispatched</option>
                                                <option value="In-Transit">In-Transit</option>
                                                <option value="Delivered">Delivered</option>
                                                <option value="Invoiced">Invoiced</option>
                                                <option value="Cancelled">Cancelled</option>
                                            </select>
                                        </div>
                                        <div id="field-carrier">
                                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Carrier</label>
                                            <select
                                                name="selected_carrier_id"
                                                value={formData.selected_carrier_id || ''}
                                                onChange={handleChange}
                                                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-medium text-slate-700"
                                            >
                                                <option value="">Select Carrier</option>
                                                {carriers.map(c => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div id="field-load-type">
                                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Type</label>
                                            <select 
                                                name="load_type" 
                                                value={formData.load_type || 'LTL'} 
                                                onChange={handleChange} 
                                                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-medium text-slate-700"
                                            >
                                                <option value="LTL">LTL</option>
                                                <option value="FTL">FTL</option>
                                                <option value="PTL">PTL</option>
                                                <option value="INTL">INTL</option>
                                                <option value="AIR">AIR</option>
                                                <option value="RAIL">RAIL</option>
                                            </select>
                                        </div>
                                    </div>

                                    <hr className="border-slate-100" />

                                    {/* Customer Selection */}
                                    <div id="field-customer">
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Customer</label>
                                        <select 
                                            name="customer_id" 
                                            value={formData.customer_id} 
                                            onChange={handleChange} 
                                            disabled={!!restrictedCustomerId}
                                            className={`w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white ${restrictedCustomerId ? 'bg-slate-50 cursor-not-allowed' : ''}`}
                                        >
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
                                                    <div className="pt-1">
                                                        <a 
                                                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${selectedConsignee.address}, ${selectedConsignee.city}, ${selectedConsignee.state} ${selectedConsignee.zip}`)}`}
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 mt-1 underline"
                                                        >
                                                            <Globe className="h-3 w-3" /> View Map
                                                        </a>
                                                    </div>
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
                                                        <th className="pb-2 w-16">#</th>
                                                        <th className="pb-2 w-24">Type</th>
                                                        <th className="pb-2 w-24">Weight</th>
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
                                                                <select
                                                                    value={p.unit_type || 'PLT'}
                                                                    onChange={(e) => handleProductChange(index, 'unit_type', e.target.value)}
                                                                    className="w-full border border-slate-200 rounded-md px-2 py-1.5 text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white font-medium text-slate-700"
                                                                >
                                                                    <option value="PLT">PLT</option>
                                                                    <option value="PCS">PCS</option>
                                                                </select>
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
                                                <tfoot className="border-t-2 border-slate-100 bg-slate-50/50">
                                                    <tr>
                                                        <td className="py-3 px-2 text-sm font-bold text-slate-700">
                                                            {formData.products.reduce((sum: number, p: Product) => sum + (parseInt(p.pallets) || 0), 0)}
                                                        </td>
                                                        <td className="py-3 pr-2 text-right text-[10px] uppercase tracking-wider font-bold text-slate-400">
                                                            Total
                                                        </td>
                                                        <td className="py-3 px-2 text-sm font-bold text-slate-700">
                                                            {formData.products.reduce((sum: number, p: Product) => sum + (parseFloat(p.weight) || 0), 0)}
                                                        </td>
                                                        <td className="py-3" colSpan={3}></td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                            {formData.products.length >= 6 && (
                                                <p className="text-[10px] text-amber-600 mt-1 font-medium italic">* Maximum 6 product lines allowed</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Zip and Dates - Route Info removed, only Dates remain */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="hidden">
                                            <input type="hidden" name="origin_zip" value={formData.origin_zip || ''} />
                                            <input type="hidden" name="destination_zip" value={formData.destination_zip || ''} />
                                        </div>
                                        <div className="space-y-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100 md:col-span-2">
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
                                             {!restrictedCustomerId && (
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Carrier Rate ($)</label>
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                                                        <input type="number" step="0.01" name="carrier_rate" value={formData.carrier_rate} onChange={handleChange} className="w-full border border-slate-300 rounded-lg pl-7 pr-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                                                    </div>
                                                </div>
                                            )}
                                            {!restrictedCustomerId && (
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Quote ID</label>
                                                    <input type="text" name="carrier_quote_id" value={formData.carrier_quote_id} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" placeholder="OPTIONAL" />
                                                </div>
                                            )}
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Mileage</label>
                                                <div className="relative">
                                                    {isCalculatingMileage && <Loader2 className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-indigo-500 z-10" />}
                                                    <input 
                                                        type="number" 
                                                        step="0.1" 
                                                        name="mileage" 
                                                        value={formData.mileage || ''} 
                                                        onChange={handleChange} 
                                                        className={`w-full border border-slate-300 rounded-lg ${isCalculatingMileage ? 'pl-8' : 'px-3'} py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all`} 
                                                        placeholder="0.0" 
                                                    />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] font-bold">MILES</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'Notes' && (
                                <div id="notes-panel" className="space-y-6">
                                    <div id="field-bol-notes">
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">BOL Notes</label>
                                        <textarea
                                            name="bol_notes"
                                            value={formData.bol_notes || ''}
                                            onChange={handleChange}
                                            rows={3}
                                            className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-inner"
                                            placeholder="Notes to appear on the BOL..."
                                        />
                                    </div>
                                    <div id="field-tracing-notes">
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Tracing Notes</label>
                                        <textarea
                                            name="tracing_notes"
                                            value={formData.tracing_notes || ''}
                                            onChange={handleChange}
                                            rows={3}
                                            className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-inner"
                                            placeholder="Tracking and tracing updates..."
                                        />
                                    </div>
                                    <div id="field-invoice-notes">
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Invoice Notes</label>
                                        <textarea
                                            name="invoice_notes"
                                            value={formData.invoice_notes || ''}
                                            onChange={handleChange}
                                            rows={3}
                                            className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-inner bg-amber-50/30"
                                            placeholder="Notes to appear on the invoice..."
                                        />
                                    </div>
                                    <div id="field-internal-notes">
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Internal Notes</label>
                                        <textarea
                                            name="internal_notes"
                                            value={formData.internal_notes || ''}
                                            onChange={handleChange}
                                            rows={6}
                                            className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-inner"
                                            placeholder="General instructions, delivery requirements, or carrier specific notes here..."
                                        />
                                    </div>
                                </div>
                            )}

                             {activeTab === 'Documents' && (
                                <div id="documents-panel" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    {/* Public Documents Section */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="bg-indigo-50 p-1.5 rounded-lg">
                                                    <Globe className="h-4 w-4 text-indigo-600" />
                                                </div>
                                                <h3 className="text-sm font-bold text-slate-800">Public Documents</h3>
                                            </div>
                                            <label className="cursor-pointer bg-white border border-slate-200 text-indigo-600 px-4 py-1.5 rounded-lg text-[10px] font-bold hover:shadow-sm hover:border-indigo-200 transition-all flex items-center gap-2 active:scale-95">
                                                <Paperclip className="h-3 w-3" />
                                                UPLOAD PUBLIC
                                                <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, false)} disabled={uploading} />
                                            </label>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {documents.filter(d => !d.is_private).length > 0 ? (
                                                documents.filter(d => !d.is_private).map(doc => (
                                                    <div key={doc.id} className="group flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:border-indigo-200 hover:shadow-sm transition-all">
                                                        <div className="flex items-center gap-3 overflow-hidden">
                                                            <div className="bg-slate-50 p-2 rounded-lg group-hover:bg-indigo-50 transition-colors">
                                                                <FileText className="h-5 w-5 text-slate-400 group-hover:text-indigo-400" />
                                                            </div>
                                                            <div className="overflow-hidden">
                                                                <p className="text-sm font-medium text-slate-700 truncate">{doc.file_name}</p>
                                                                <p className="text-[10px] text-slate-400">{new Date(doc.created_at).toLocaleDateString()}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <a href={doc.url} target="_blank" rel="noopener noreferrer" className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="View Document">
                                                                <Eye className="h-4 w-4" />
                                                            </a>
                                                            <button onClick={() => handleDeleteDocument(doc.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Delete Document">
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="md:col-span-2 py-8 bg-slate-50/50 border border-dashed border-slate-200 rounded-xl text-center">
                                                    <p className="text-xs text-slate-400 italic">No public documents found.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Private Documents Section */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="bg-amber-50 p-1.5 rounded-lg">
                                                    <Lock className="h-4 w-4 text-amber-600" />
                                                </div>
                                                <h3 className="text-sm font-bold text-slate-800">Private Documents</h3>
                                            </div>
                                            <label className="cursor-pointer bg-white border border-slate-200 text-amber-600 px-4 py-1.5 rounded-lg text-[10px] font-bold hover:shadow-sm hover:border-amber-200 transition-all flex items-center gap-2 active:scale-95">
                                                <Paperclip className="h-3 w-3" />
                                                UPLOAD PRIVATE
                                                <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, true)} disabled={uploading} />
                                            </label>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {documents.filter(d => d.is_private).length > 0 ? (
                                                documents.filter(d => d.is_private).map(doc => (
                                                    <div key={doc.id} className="group flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:border-amber-200 hover:shadow-sm transition-all text-amber-900">
                                                        <div className="flex items-center gap-3 overflow-hidden">
                                                            <div className="bg-amber-50/50 p-2 rounded-lg group-hover:bg-amber-50 transition-colors">
                                                                <Lock className="h-5 w-5 text-amber-400" />
                                                            </div>
                                                            <div className="overflow-hidden">
                                                                <p className="text-sm font-medium text-amber-800 truncate">{doc.file_name}</p>
                                                                <p className="text-[10px] text-amber-400">{new Date(doc.created_at).toLocaleDateString()}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <a href={doc.url} target="_blank" rel="noopener noreferrer" className="p-2 text-amber-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all" title="View Document">
                                                                <Eye className="h-4 w-4" />
                                                            </a>
                                                            <button onClick={() => handleDeleteDocument(doc.id)} className="p-2 text-amber-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Delete Document">
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="md:col-span-2 py-8 bg-slate-50/50 border border-dashed border-slate-200 rounded-xl text-center">
                                                    <p className="text-xs text-slate-400 italic">No private documents found.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {uploading && (
                                        <div className="flex justify-center items-center gap-2 text-indigo-600 text-xs font-bold animate-pulse">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            UPLOADING DOCUMENT...
                                        </div>
                                    )}
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

                <CalendarEventModal
                    isOpen={isCalendarModalOpen}
                    onClose={() => setIsCalendarModalOpen(false)}
                    onSave={() => setIsCalendarModalOpen(false)}
                    initialDescription={formData.load_number || 'New Load'}
                />
            </div>
        </div>
    );
}
