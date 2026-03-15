'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Building2, ArrowLeft, Save, FileText, Trash2, Pencil, Upload, Download, Phone, Mail, Users, MapPin, Loader2, Truck, Plus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatPhoneNumber } from '@/lib/utils';
import LTLRatingScreen from '@/components/LTLRatingScreen';

type Contact = { id: string; name: string; phone: string; ext: string; cell_phone: string; email: string; position: string; notes: string };
type Document = { id: string; file_name: string; file_path: string; url: string; created_at: string };
type ShipperConsignee = { id: string; name: string; address: string; city: string; state: string; zip: string; phone: string; email: string; website: string; status: string; notes: string };
type SalesRep = { id: string; first_name: string; last_name: string };
type Quote = {
    id: string;
    quote_number: string;
    carrier_name: string;
    scac: string;
    total_carrier_rate: number;
    customer_rate: number;
    transit_days: number;
    origin_info: any;
    destination_info: any;
    created_at: string;
};

export default function EditCustomerPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Data States
    const [formData, setFormData] = useState({
        company_name: '', primary_contact: '', address: '', city: '', state: '', zip: '',
        phone: '', email: '', website: '', status: 'Active', notes: '', dispatch_notes: '', credit_limit: '', payment_terms: 'Net 30', sales_person_id: ''
    });
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [shippers, setShippers] = useState<ShipperConsignee[]>([]);
    const [salesReps, setSalesReps] = useState<SalesRep[]>([]);
    const [quotes, setQuotes] = useState<Quote[]>([]);

    // Shipper Dialog State
    const [isShipperOpen, setIsShipperOpen] = useState(false);
    const [editingShipperId, setEditingShipperId] = useState<string | null>(null);
    const [shipperForm, setShipperForm] = useState({ name: '', address: '', city: '', state: '', zip: '', phone: '', email: '', website: '', status: 'Active', notes: '' });

    // Contact Dialog State
    const [isContactOpen, setIsContactOpen] = useState(false);
    const [editingContactId, setEditingContactId] = useState<string | null>(null);
    const [contactForm, setContactForm] = useState({ name: '', phone: '', ext: '', cell_phone: '', email: '', position: '', notes: '' });

    // Document States
    const [uploading, setUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    // Initial Fetch
    useEffect(() => {
        const fetchAllData = async () => {
            try {
                // Fetch Customer
                const custRes = await fetch(`/api/customers/${id}`);
                if (!custRes.ok) throw new Error('Customer not found');
                const custData = await custRes.json();
                setFormData({
                    ...custData.customer,
                    credit_limit: custData.customer.credit_limit?.toString() || ''
                });

                // Fetch Contacts
                const contRes = await fetch(`/api/customers/${id}/contacts`);
                const contData = await contRes.json();
                setContacts(contData.contacts || []);

                // Fetch Documents
                const docRes = await fetch(`/api/customers/${id}/documents`);
                const docData = await docRes.json();
                setDocuments(docData.documents || []);

                // Fetch Shippers
                const shipRes = await fetch(`/api/shipper-consignees?customer_id=${id}`);
                const shipData = await shipRes.json();
                setShippers(shipData.shipper_consignees || []);

                // Fetch Sales Reps
                const repsRes = await fetch('/api/profiles/sales-reps');
                if (repsRes.ok) {
                    const repsData = await repsRes.json();
                    setSalesReps(repsData.salesReps || []);
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        const fetchQuotes = async () => {
            try {
                const res = await fetch(`/api/quotes?customerId=${id}`);
                const data = await res.json();
                setQuotes(data.quotes || []);
            } catch (err) {
                console.error("Failed to fetch quotes", err);
            }
        };

        if (id) {
            fetchAllData();
            fetchQuotes();
        }
    }, [id]);

    const fetchQuotes = async () => {
        try {
            const res = await fetch(`/api/quotes?customerId=${id}`);
            const data = await res.json();
            setQuotes(data.quotes || []);
        } catch (err) {
            console.error("Failed to fetch quotes", err);
        }
    };

    // Customer Info Handlers
    const handleInfoChange = (e: any) => {
        let value = e.target.value;
        if (e.target.name === 'phone') {
            value = formatPhoneNumber(value);
        }
        setFormData(prev => ({ ...prev, [e.target.name]: value }));
    };

    const handleInfoSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        try {
            const res = await fetch(`/api/customers/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, credit_limit: parseFloat(formData.credit_limit) || 0, sales_person_id: formData.sales_person_id || null }),
            });
            if (!res.ok) throw new Error('Failed to update customer');
            router.refresh();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    // Contact Handlers
    const resetContactForm = () => {
        setContactForm({ name: '', phone: '', ext: '', cell_phone: '', email: '', position: '', notes: '' });
        setEditingContactId(null);
    };

    const handleContactSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = editingContactId ? `/api/customers/${id}/contacts/${editingContactId}` : `/api/customers/${id}/contacts`;
            const res = await fetch(url, {
                method: editingContactId ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(contactForm),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error);
            }

            // Refresh contacts
            const contRes = await fetch(`/api/customers/${id}/contacts`);
            const contData = await contRes.json();
            setContacts(contData.contacts || []);
            setIsContactOpen(false);
            resetContactForm();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleContactDelete = async (contactId: string) => {
        if (!confirm('Are you sure you want to delete this contact?')) return;
        try {
            const res = await fetch(`/api/customers/${id}/contacts/${contactId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete contact');
            setContacts(prev => prev.filter(c => c.id !== contactId));
        } catch (err: any) {
            alert(err.message);
        }
    };

    const openEditContact = (contact: Contact) => {
        setContactForm({ ...contact });
        setEditingContactId(contact.id);
        setIsContactOpen(true);
    };

    // Shipper Handlers
    const resetShipperForm = () => {
        setShipperForm({ name: '', address: '', city: '', state: '', zip: '', phone: '', email: '', website: '', status: 'Active', notes: '' });
        setEditingShipperId(null);
    };

    const handleShipperSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = editingShipperId ? `/api/shipper-consignees/${editingShipperId}` : `/api/shipper-consignees`;
            const method = editingShipperId ? 'PUT' : 'POST';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...shipperForm, customer_id: id }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error);
            }

            // Refresh shippers
            const shipRes = await fetch(`/api/shipper-consignees?customer_id=${id}`);
            const shipData = await shipRes.json();
            setShippers(shipData.shipper_consignees || []);
            setIsShipperOpen(false);
            resetShipperForm();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleShipperDelete = async (shipperId: string) => {
        if (!confirm('Are you sure you want to delete this Shipper/Consignee?')) return;
        try {
            const res = await fetch(`/api/shipper-consignees/${shipperId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete');
            setShippers(prev => prev.filter(s => s.id !== shipperId));
        } catch (err: any) {
            alert(err.message);
        }
    };

    // Shipper Sorting State
    const [sortField, setSortField] = useState<keyof ShipperConsignee>('name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    const handleSort = (field: keyof ShipperConsignee) => {
        if (field === sortField) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const sortedShippers = [...shippers].sort((a, b) => {
        const valA = (a[sortField] || '').toString().toLowerCase();
        const valB = (b[sortField] || '').toString().toLowerCase();
        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    const openEditShipper = (shipper: ShipperConsignee) => {
        setShipperForm({
            name: shipper.name || '',
            address: shipper.address || '',
            city: shipper.city || '',
            state: shipper.state || '',
            zip: shipper.zip || '',
            phone: shipper.phone || '',
            email: shipper.email || '',
            website: shipper.website || '',
            status: shipper.status || 'Active',
            notes: shipper.notes || ''
        });
        setEditingShipperId(shipper.id);
        setIsShipperOpen(true);
    };

    // Document Handlers
    const handleDocumentUpload = async () => {
        if (!selectedFile) return;
        setUploading(true);
        const data = new FormData();
        data.append('file', selectedFile);

        try {
            const res = await fetch(`/api/customers/${id}/documents`, {
                method: 'POST',
                body: data
            });
            if (!res.ok) throw new Error('Failed to upload document');

            // Refresh docs
            const docRes = await fetch(`/api/customers/${id}/documents`);
            const docData = await docRes.json();
            setDocuments(docData.documents || []);
            setSelectedFile(null);

            // clear input
            const fileInput = document.getElementById('file_upload') as HTMLInputElement;
            if (fileInput) fileInput.value = '';

        } catch (err: any) {
            alert(err.message);
        } finally {
            setUploading(false);
        }
    };

    const handleDocumentDelete = async (docId: string) => {
        if (!confirm('Are you sure you want to delete this document? (Supervisor/Admin only)')) return;
        try {
            const res = await fetch(`/api/customers/${id}/documents/${docId}`, { method: 'DELETE' });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to delete');
            }
            setDocuments(prev => prev.filter(d => d.id !== docId));
        } catch (err: any) {
            alert(err.message);
        }
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>;
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center">
            <div className="max-w-6xl w-full">
                <Link href="/customers" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 transition-colors mb-6 font-medium">
                    <ArrowLeft className="h-4 w-4" /> Back to Customers
                </Link>

                <header className="mb-8 flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                            <Building2 className="h-8 w-8 text-indigo-600" />
                            {formData.company_name}
                        </h1>
                        <p className="text-slate-500 mt-2 flex items-center gap-4 text-sm font-medium">
                            <span className={`px-2.5 py-1 rounded-md border ${formData.status === 'Active' ? 'bg-green-50 text-green-700 border-green-200' : formData.status === 'Credit Hold' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>{formData.status}</span>
                            <a href={`https://maps.google.com/?q=${encodeURIComponent(`${formData.address}, ${formData.city}, ${formData.state} ${formData.zip}`)}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-indigo-600 transition-colors"><MapPin className="h-4 w-4" /> {formData.city}, {formData.state}</a>
                            <span className="flex items-center gap-1"><Phone className="h-4 w-4" /> {formData.phone}</span>
                        </p>
                    </div>
                </header>

                {error && <div className="bg-red-50 text-red-600 border border-red-200 p-4 rounded-xl mb-6">{error}</div>}

                <Tabs defaultValue="info" className="w-full">
                    <TabsList>
                        <TabsTrigger value="info">Customer Info</TabsTrigger>
                        <TabsTrigger value="contacts">Contacts ({contacts.length})</TabsTrigger>
                        <TabsTrigger value="dispatch">Dispatch</TabsTrigger>
                        <TabsTrigger value="quotes">Quotes</TabsTrigger>
                        <TabsTrigger value="rating">Rating</TabsTrigger>
                        <TabsTrigger value="documents">Documents ({documents.length})</TabsTrigger>
                    </TabsList>

                    {/* Customer Info Tab */}
                    <TabsContent value="info" className="outline-none">
                        <div className="bg-white border border-slate-200 border-t-0 shadow-sm rounded-b-xl p-8">
                            <form onSubmit={handleInfoSave} className="space-y-6">
                                {/* Core Info */}
                                <div className="border-b border-slate-100 pb-6">
                                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Core Information</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-semibold text-slate-700 mb-1">Company Name <span className="text-red-500">*</span></label>
                                            <input type="text" name="company_name" value={formData.company_name} onChange={handleInfoChange} required className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-semibold text-slate-700 mb-1">Address</label>
                                            <input type="text" name="address" value={formData.address || ''} onChange={handleInfoChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                        </div>
                                        <div className="md:col-span-2 grid grid-cols-3 gap-6">
                                            <div className="col-span-1">
                                                <label className="block text-sm font-semibold text-slate-700 mb-1">City</label>
                                                <input type="text" name="city" value={formData.city || ''} onChange={handleInfoChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                            </div>
                                            <div className="col-span-1">
                                                <label className="block text-sm font-semibold text-slate-700 mb-1">State</label>
                                                <input type="text" name="state" value={formData.state || ''} onChange={handleInfoChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                            </div>
                                            <div className="col-span-1">
                                                <label className="block text-sm font-semibold text-slate-700 mb-1">Zip Code</label>
                                                <input type="text" name="zip" value={formData.zip || ''} onChange={handleInfoChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {/* Contact & Web */}
                                <div className="border-b border-slate-100 pb-6">
                                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Contact & Web</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1">Primary Contact</label>
                                            <input type="text" name="primary_contact" value={formData.primary_contact || ''} onChange={handleInfoChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1">Main Phone</label>
                                            <input type="tel" name="phone" value={formData.phone || ''} onChange={handleInfoChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1">Main Email</label>
                                            <input type="email" name="email" value={formData.email || ''} onChange={handleInfoChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1">Website</label>
                                            <input type="url" name="website" value={formData.website || ''} onChange={handleInfoChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                        </div>
                                    </div>
                                </div>
                                {/* Account Status & Notes */}
                                <div className="border-b border-slate-100 pb-6">
                                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Account Details</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1">Status</label>
                                            <select name="status" value={formData.status} onChange={handleInfoChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                                <option value="Active">Active</option>
                                                <option value="Credit Hold">Credit Hold</option>
                                                <option value="Inactive">Inactive</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1">Credit Limit ($)</label>
                                            <input type="number" name="credit_limit" value={formData.credit_limit} onChange={handleInfoChange} step="0.01" min="0" className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1">Payment Terms</label>
                                            <select name="payment_terms" value={formData.payment_terms} onChange={handleInfoChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                                <option value="Prepaid">Prepaid</option>
                                                <option value="Due on Receipt">Due on Receipt</option>
                                                <option value="Net 15">Net 15</option>
                                                <option value="Net 30">Net 30</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1">Assigned Sales Rep</label>
                                            <select name="sales_person_id" value={formData.sales_person_id || ''} onChange={handleInfoChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                                <option value="">-- Unassigned --</option>
                                                {salesReps.map(rep => (
                                                    <option key={rep.id} value={rep.id}>
                                                        {rep.first_name} {rep.last_name || ''}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="md:col-span-4 lg:col-span-4">
                                            <label className="block text-sm font-semibold text-slate-700 mb-1">Notes</label>
                                            <textarea name="notes" value={formData.notes || ''} onChange={handleInfoChange} rows={3} className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-4 flex justify-end">
                                    <button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-6 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-70 shadow-sm">
                                        {saving ? <span className="animate-pulse">Saving...</span> : <><Save className="h-4 w-4" /> Save Changes</>}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </TabsContent>

                    {/* Contacts Tab */}
                    <TabsContent value="contacts" className="outline-none">
                        <div className="bg-white border border-slate-200 border-t-0 shadow-sm rounded-b-xl overflow-hidden">
                            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                                <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2"><Users className="h-5 w-5 text-indigo-600" /> Current Contacts ({contacts.length}/10)</h2>
                                <Dialog open={isContactOpen} onOpenChange={setIsContactOpen}>
                                    <DialogTrigger asChild>
                                        <button onClick={resetContactForm} disabled={contacts.length >= 10} className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 font-medium py-2 px-4 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                            New Contact
                                        </button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-md">
                                        <DialogHeader>
                                            <DialogTitle>{editingContactId ? 'Edit Contact' : 'Add New Contact'}</DialogTitle>
                                            <DialogDescription>Fill in the contact details below.</DialogDescription>
                                        </DialogHeader>
                                        <form onSubmit={handleContactSave} className="space-y-4 py-4">
                                            <div>
                                                <label className="block text-sm font-medium mb-1">Name *</label>
                                                <input required type="text" value={contactForm.name} onChange={e => setContactForm({ ...contactForm, name: e.target.value })} className="w-full px-3 py-2 border rounded-md" />
                                            </div>
                                            <div className="grid grid-cols-12 gap-4">
                                                <div className="col-span-12 sm:col-span-5">
                                                    <label className="block text-sm font-medium mb-1">Phone *</label>
                                                    <input required type="text" value={contactForm.phone} onChange={e => setContactForm({ ...contactForm, phone: formatPhoneNumber(e.target.value) })} className="w-full px-3 py-2 border rounded-md" />
                                                </div>
                                                <div className="col-span-12 sm:col-span-2">
                                                    <label className="block text-sm font-medium mb-1">Ext.</label>
                                                    <input type="text" maxLength={4} value={contactForm.ext || ''} onChange={e => setContactForm({ ...contactForm, ext: e.target.value.replace(/\D/g, '') })} className="w-full px-3 py-2 border rounded-md" placeholder="e.g. 101" />
                                                </div>
                                                <div className="col-span-12 sm:col-span-5">
                                                    <label className="block text-sm font-medium mb-1">Cell Phone</label>
                                                    <input type="text" value={contactForm.cell_phone || ''} onChange={e => setContactForm({ ...contactForm, cell_phone: formatPhoneNumber(e.target.value) })} className="w-full px-3 py-2 border rounded-md" />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium mb-1">Email</label>
                                                    <input type="email" value={contactForm.email || ''} onChange={e => setContactForm({ ...contactForm, email: e.target.value })} className="w-full px-3 py-2 border rounded-md" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium mb-1">Position</label>
                                                    <input type="text" value={contactForm.position || ''} onChange={e => setContactForm({ ...contactForm, position: e.target.value })} className="w-full px-3 py-2 border rounded-md" />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1">Notes</label>
                                                <textarea rows={2} value={contactForm.notes || ''} onChange={e => setContactForm({ ...contactForm, notes: e.target.value })} className="w-full px-3 py-2 border rounded-md resize-none" />
                                            </div>
                                            <DialogFooter>
                                                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-md font-medium hover:bg-indigo-700">Save Contact</button>
                                            </DialogFooter>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            </div>
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50">
                                        <TableHead>Name</TableHead>
                                        <TableHead>Position</TableHead>
                                        <TableHead>Phone</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {contacts.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-slate-500">No contacts recorded yet.</TableCell>
                                        </TableRow>
                                    ) : (
                                        contacts.map(contact => (
                                            <TableRow key={contact.id}>
                                                <TableCell className="font-medium">{contact.name}</TableCell>
                                                <TableCell>{contact.position || '-'}</TableCell>
                                                <TableCell>{contact.phone} {contact.ext && <span className="text-slate-500 text-xs ml-1">x{contact.ext}</span>}</TableCell>
                                                <TableCell>{contact.email ? <a href={`mailto:${contact.email}`} className="text-indigo-600 hover:underline">{contact.email}</a> : '-'}</TableCell>
                                                <TableCell className="text-right flex justify-end gap-2">
                                                    <button onClick={() => openEditContact(contact)} className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors" title="Edit">
                                                        <Pencil className="h-4 w-4" />
                                                    </button>
                                                    <button onClick={() => handleContactDelete(contact.id)} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Delete">
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>

                    {/* Dispatch Tab */}
                    <TabsContent value="dispatch" className="outline-none">
                        <div className="bg-white border border-slate-200 border-t-0 shadow-sm rounded-b-xl overflow-hidden">
                            {/* Top Half: Shippers/Consignees */}
                            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2"><Truck className="h-5 w-5 text-indigo-600" /> Shippers / Consignees</h2>
                                    <p className="text-sm text-slate-500 mt-1">Manage locations associated with this customer.</p>
                                </div>
                                <Dialog open={isShipperOpen} onOpenChange={setIsShipperOpen}>
                                    <DialogTrigger asChild>
                                        <button onClick={resetShipperForm} className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 font-medium py-2 px-4 rounded-lg flex items-center gap-2 transition-colors">
                                            <Plus className="h-4 w-4" /> Add Shipper/Consignee
                                        </button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-2xl">
                                        <DialogHeader>
                                            <DialogTitle>{editingShipperId ? 'Edit Shipper/Consignee' : 'Add New Shipper/Consignee'}</DialogTitle>
                                            <DialogDescription>Enter the location details below.</DialogDescription>
                                        </DialogHeader>
                                        <form onSubmit={handleShipperSave} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-1">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="col-span-2">
                                                    <label className="block text-sm font-medium mb-1">Location Name *</label>
                                                    <input required type="text" value={shipperForm.name} onChange={e => setShipperForm({ ...shipperForm, name: e.target.value })} className="w-full px-3 py-2 border rounded-md" />
                                                </div>
                                                <div className="col-span-2">
                                                    <label className="block text-sm font-medium mb-1">Address</label>
                                                    <input type="text" value={shipperForm.address} onChange={e => setShipperForm({ ...shipperForm, address: e.target.value })} className="w-full px-3 py-2 border rounded-md" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium mb-1">City</label>
                                                    <input type="text" value={shipperForm.city} onChange={e => setShipperForm({ ...shipperForm, city: e.target.value })} className="w-full px-3 py-2 border rounded-md" />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium mb-1">State</label>
                                                        <input type="text" value={shipperForm.state} onChange={e => setShipperForm({ ...shipperForm, state: e.target.value })} className="w-full px-3 py-2 border rounded-md" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium mb-1">Zip</label>
                                                        <input type="text" value={shipperForm.zip} onChange={e => setShipperForm({ ...shipperForm, zip: e.target.value })} className="w-full px-3 py-2 border rounded-md" />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium mb-1">Phone</label>
                                                    <input type="text" value={shipperForm.phone} onChange={e => setShipperForm({ ...shipperForm, phone: formatPhoneNumber(e.target.value) })} className="w-full px-3 py-2 border rounded-md" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium mb-1">Email</label>
                                                    <input type="email" value={shipperForm.email} onChange={e => setShipperForm({ ...shipperForm, email: e.target.value })} className="w-full px-3 py-2 border rounded-md" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium mb-1">Status</label>
                                                    <select value={shipperForm.status} onChange={e => setShipperForm({ ...shipperForm, status: e.target.value })} className="w-full px-3 py-2 border rounded-md bg-white">
                                                        <option value="Active">Active</option>
                                                        <option value="Inactive">Inactive</option>
                                                        <option value="Credit Hold">Credit Hold</option>
                                                    </select>
                                                </div>
                                                <div className="col-span-2">
                                                    <label className="block text-sm font-medium mb-1">Notes</label>
                                                    <textarea rows={2} value={shipperForm.notes} onChange={e => setShipperForm({ ...shipperForm, notes: e.target.value })} className="w-full px-3 py-2 border rounded-md resize-none" />
                                                </div>
                                            </div>
                                            <DialogFooter className="pt-4">
                                                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-md font-medium hover:bg-indigo-700">Save Location</button>
                                            </DialogFooter>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            </div>

                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50">
                                        <TableHead className="cursor-pointer hover:bg-slate-100" onClick={() => handleSort('name')}>
                                            Location Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                                        </TableHead>
                                        <TableHead className="cursor-pointer hover:bg-slate-100" onClick={() => handleSort('city')}>
                                            City, State {sortField === 'city' && (sortDirection === 'asc' ? '↑' : '↓')}
                                        </TableHead>
                                        <TableHead>Phone</TableHead>
                                        <TableHead className="cursor-pointer hover:bg-slate-100" onClick={() => handleSort('status')}>
                                            Status {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
                                        </TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedShippers.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-slate-500">No Shippers/Consignees linked to this customer yet.</TableCell>
                                        </TableRow>
                                    ) : (
                                        sortedShippers.map(shipper => (
                                            <TableRow key={shipper.id}>
                                                <TableCell className="font-medium">
                                                    <Link href={`/shipper-consignees/edit/${shipper.id}`} className="text-indigo-600 hover:text-indigo-800 hover:underline">
                                                        {shipper.name}
                                                    </Link>
                                                </TableCell>
                                                <TableCell>{shipper.city}{shipper.city && shipper.state ? ', ' : ''}{shipper.state}</TableCell>
                                                <TableCell>{shipper.phone || '-'}</TableCell>
                                                <TableCell>
                                                    <span className={`text-xs px-2 py-1 rounded-md border font-medium ${shipper.status === 'Active' ? 'bg-green-50 text-green-700 border-green-200' :
                                                        shipper.status === 'Credit Hold' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                            'bg-slate-100 text-slate-700 border-slate-200'
                                                        }`}>
                                                        {shipper.status || 'Active'}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right flex justify-end gap-2">
                                                    <button onClick={() => openEditShipper(shipper)} className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors" title="Edit">
                                                        <Pencil className="h-4 w-4" />
                                                    </button>
                                                    <button onClick={() => handleShipperDelete(shipper.id)} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Delete">
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>

                            {/* Bottom Half: Dispatch Notes */}
                            <div className="p-6 border-t border-slate-200 bg-slate-50">
                                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2"><FileText className="h-5 w-5 text-indigo-600" /> Dispatch Notes</h3>
                                <div className="space-y-4">
                                    <textarea
                                        value={formData.dispatch_notes || ''}
                                        onChange={(e) => setFormData(prev => ({ ...prev, dispatch_notes: e.target.value }))}
                                        placeholder="Enter any specific dispatch instructions, notes, or requirements for this customer..."
                                        rows={4}
                                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 max-w-4xl bg-white shadow-sm"
                                    />
                                    <div>
                                        <button onClick={handleInfoSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-70 shadow-sm">
                                            {saving ? <span className="animate-pulse">Saving...</span> : <><Save className="h-4 w-4" /> Save Dispatch Notes</>}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Quotes Tab */}
                    <TabsContent value="quotes" className="outline-none">
                        <div className="bg-white border border-slate-200 border-t-0 shadow-sm rounded-b-xl overflow-hidden">
                            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                                <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-indigo-600" /> 
                                    Saved Freight Quotes ({quotes.length})
                                </h2>
                            </div>
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50">
                                        <TableHead>Quote #</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Carrier</TableHead>
                                        <TableHead>Origin / Dest</TableHead>
                                        <TableHead className="text-right">Carrier Rate</TableHead>
                                        <TableHead className="text-right text-indigo-600">Customer Rate</TableHead>
                                        <TableHead className="text-center">Transit</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {quotes.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                                                <div className="flex flex-col items-center">
                                                    <FileText className="h-12 w-12 text-slate-200 mb-3" />
                                                    <p className="font-medium">No saved quotes found.</p>
                                                    <p className="text-sm">Run a rate quote to save one here.</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        quotes.map(quote => (
                                            <TableRow key={quote.id} className="hover:bg-slate-50 transition-colors">
                                                <TableCell className="font-bold text-indigo-600 font-mono">{quote.quote_number}</TableCell>
                                                <TableCell className="whitespace-nowrap">{new Date(quote.created_at).toLocaleDateString()}</TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold">{quote.carrier_name}</span>
                                                        <span className="text-[10px] text-slate-400 font-mono uppercase">{quote.scac}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-xs space-y-0.5">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-[10px] bg-slate-100 px-1 rounded font-bold text-slate-500">ORG</span>
                                                            {quote.origin_info?.city}, {quote.origin_info?.state} {quote.origin_info?.zip}
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-[10px] bg-slate-100 px-1 rounded font-bold text-slate-500">DST</span>
                                                            {quote.destination_info?.city}, {quote.destination_info?.state} {quote.destination_info?.zip}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right font-medium text-slate-600">${Number(quote.total_carrier_rate).toFixed(2)}</TableCell>
                                                <TableCell className="text-right font-bold text-indigo-600">${Number(quote.customer_rate).toFixed(2)}</TableCell>
                                                <TableCell className="text-center font-bold text-slate-800">{quote.transit_days} <span className="text-[10px] text-slate-400 font-normal">D</span></TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>

                    {/* Rating Tab */}
                    <TabsContent value="rating" className="outline-none">
                        <div className="bg-white border border-slate-200 border-t-0 shadow-sm rounded-b-xl p-6">
                            <LTLRatingScreen customerId={id} onQuoteSaved={fetchQuotes} />
                        </div>
                    </TabsContent>

                    {/* Documents Tab */}
                    <TabsContent value="documents" className="outline-none">
                        <div className="bg-white border border-slate-200 border-t-0 shadow-sm rounded-b-xl overflow-hidden">
                            <div className="p-6 border-b border-slate-200 bg-slate-50">
                                <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2 mb-4"><FileText className="h-5 w-5 text-indigo-600" /> Upload New Document</h2>
                                <div className="flex gap-4 items-center">
                                    <input
                                        type="file"
                                        id="file_upload"
                                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                        className="flex-1 max-w-md px-3 py-2 border bg-white border-slate-300 rounded-lg text-sm"
                                    />
                                    <button
                                        onClick={handleDocumentUpload}
                                        disabled={!selectedFile || uploading}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Upload
                                    </button>
                                </div>
                            </div>

                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50">
                                        <TableHead>File Name</TableHead>
                                        <TableHead>Uploaded Date</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {documents.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center py-8 text-slate-500">No documents found for this customer.</TableCell>
                                        </TableRow>
                                    ) : (
                                        documents.map(doc => (
                                            <TableRow key={doc.id}>
                                                <TableCell className="font-medium">
                                                    <a href={doc.url} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline flex items-center gap-2">
                                                        <FileText className="h-4 w-4 text-slate-400" />
                                                        {doc.file_name}
                                                    </a>
                                                </TableCell>
                                                <TableCell>{new Date(doc.created_at).toLocaleDateString()}</TableCell>
                                                <TableCell className="text-right flex justify-end gap-2">
                                                    <a href={doc.url} download={doc.file_name} target="_blank" rel="noreferrer" className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors" title="Download">
                                                        <Download className="h-4 w-4" />
                                                    </a>
                                                    <button onClick={() => handleDocumentDelete(doc.id)} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Delete (Supervisor/Admin Only)">
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>

                </Tabs>
            </div>
        </div>
    );
}
