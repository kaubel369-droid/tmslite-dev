'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Building2, ArrowLeft, Save, FileText, Trash2, Pencil, Upload, Download, Phone, Mail, Users, MapPin, Loader2, Truck, Plus, Eye } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatPhoneNumber } from '@/lib/utils';
import LTLRatingScreen from '@/components/LTLRatingScreen';
import SpotQuoteModal from '@/components/SpotQuoteModal';
import PrintButton from '@/components/PrintButton';
import CalendarEventModal from '@/components/CalendarEventModal';
import CustomerReports from '@/components/CustomerReports';
import { createClient } from '@/utils/supabase/client';


type Contact = { id: string; name: string; phone: string; ext: string; cell_phone: string; email: string; position: string; notes: string };
type Document = { id: string; file_name: string; file_path: string; url: string; created_at: string };
type ShipperConsignee = { id: string; name: string; address: string; city: string; state: string; zip: string; phone: string; email: string; website: string; status: string; notes: string };
type SalesRep = { id: string; first_name: string; last_name: string };
type Quote = {
    id: string;
    quote_number: string;
    carrier_name: string;
    scac: string;
    base_rate: number;
    fuel_surcharge: number;
    accessorials_total: number;
    total_carrier_rate: number;
    customer_rate: number;
    transit_days: number;
    origin_info: any;
    destination_info: any;
    items: any[];
    accessorials: any[];
    created_at: string;
};

type SpotQuote = {
    id: string;
    quote_number: string;
    quote_date: string;
    rate: number;
    carrier_rate: number;
    carrier_name?: string;
    shipper: ShipperConsignee;
    consignee: ShipperConsignee;
    shipper_zip?: string;
    shipper_city?: string;
    shipper_state?: string;
    consignee_zip?: string;
    consignee_city?: string;
    consignee_state?: string;
    carrier?: {
        id: string;
        name: string;
    };
    pcs: number;
    type: string;
    weight: number;
    cubic_ft: number;
    products: any[];
    accessorials: any[];
    additional_instructions: string;
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
    const [spotQuotes, setSpotQuotes] = useState<SpotQuote[]>([]);
    const [accessorialsList, setAccessorialsList] = useState<any[]>([]);
    const [customerUsers, setCustomerUsers] = useState<any[]>([]);
    const [allProfiles, setAllProfiles] = useState<any[]>([]);
    const [userRole, setUserRole] = useState<string | null>(null);

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
    
    // Quote View State
    const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
    const [isViewQuoteOpen, setIsViewQuoteOpen] = useState(false);

    // Spot Quote State
    const [isSpotQuoteOpen, setIsSpotQuoteOpen] = useState(false);
    const [editingSpotQuoteId, setEditingSpotQuoteId] = useState<string | undefined>(undefined);

    // User Management State
    const [isLinkUserOpen, setIsLinkUserOpen] = useState(false);
    const [linkingUser, setLinkingUser] = useState(false);

    const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);

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

        const fetchUserRole = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single();
                setUserRole(profile?.role || null);
            }
        };

        if (id) {
            fetchAllData();
            fetchQuotes();
            fetchSpotQuotes();
            fetchAccessorials();
            fetchCustomerUsers();
            fetchAllProfiles();
            fetchUserRole();
        }
    }, [id]);

    const fetchAccessorials = async () => {
        try {
            const res = await fetch('/api/accessorials');
            if (res.ok) {
                const data = await res.json();
                setAccessorialsList(data.accessorials || []);
            }
        } catch (err) {
            console.error("Failed to fetch accessorials", err);
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

    const fetchSpotQuotes = async () => {
        try {
            const res = await fetch(`/api/customers/${id}/spot-quotes`);
            const data = await res.json();
            setSpotQuotes(data.quotes || []);
        } catch (err) {
            console.error("Failed to fetch spot quotes", err);
        }
    };
    const fetchCustomerUsers = async () => {
        try {
            const res = await fetch(`/api/customers/${id}/users`);
            const data = await res.json();
            setCustomerUsers(data.users || []);
        } catch (err) {
            console.error("Failed to fetch customer users", err);
        }
    };

    const fetchAllProfiles = async () => {
        try {
            // Fetch profiles to link
            const res = await fetch('/api/admin/users'); // Assuming this exists or using a similar endpoint
            if (res.ok) {
                const data = await res.json();
                setAllProfiles(data.users || []);
            }
        } catch (err) {
            console.error("Failed to fetch all profiles", err);
        }
    };

    const handleLinkUser = async (profileId: string) => {
        setLinkingUser(true);
        try {
            const res = await fetch(`/api/customers/${id}/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profileId }),
            });
            if (!res.ok) throw new Error('Failed to link user');
            fetchCustomerUsers();
            setIsLinkUserOpen(false);
        } catch (err: any) {
            alert(err.message);
        } finally {
            setLinkingUser(false);
        }
    };

    const handleUnlinkUser = async (profileId: string) => {
        if (!confirm('Are you sure you want to unlink this user from the customer?')) return;
        try {
            const res = await fetch(`/api/customers/${id}/users?profileId=${profileId}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error('Failed to unlink user');
            fetchCustomerUsers();
        } catch (err: any) {
            alert(err.message);
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
                    <button
                        type="button"
                        onClick={() => setIsCalendarModalOpen(true)}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
                    >
                        Add New Event
                    </button>
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
                        <TabsTrigger value="users">Users ({customerUsers.length})</TabsTrigger>
                        {(userRole === 'Admin' || userRole === 'Supervisor') && (
                            <TabsTrigger value="reports">Reports</TabsTrigger>
                        )}
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
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {quotes.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center py-12 text-slate-500">
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
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <button 
                                                            onClick={() => {
                                                                setSelectedQuote(quote);
                                                                setIsViewQuoteOpen(true);
                                                            }}
                                                            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors" 
                                                            title="View Quote"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </button>
                                                        <PrintButton id={quote.id} type="quote" />
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>

                            {/* Spot Quotes Section */}
                            <div className="p-6 border-t border-slate-200 flex justify-between items-center bg-slate-50 mt-8">
                                <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                    <Truck className="h-5 w-5 text-indigo-600" /> 
                                    Customer Spot Quotes ({spotQuotes.length})
                                </h2>
                                <button 
                                    onClick={() => {
                                        setEditingSpotQuoteId(undefined);
                                        setIsSpotQuoteOpen(true);
                                    }}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
                                >
                                    <Plus className="h-4 w-4" /> New Spot Quote
                                </button>
                            </div>
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50">
                                        <TableHead>Quote #</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Carrier</TableHead>
                                        <TableHead>Shipper</TableHead>
                                        <TableHead>Consignee</TableHead>
                                        <TableHead className="text-right">Rate</TableHead>
                                        <TableHead className="text-right">Carrier Rate</TableHead>
                                        <TableHead>Items</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {spotQuotes.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                                                <div className="flex flex-col items-center">
                                                    <Truck className="h-12 w-12 text-slate-200 mb-3" />
                                                    <p className="font-medium">No spot quotes found.</p>
                                                    <p className="text-sm">Create a new spot quote to get started.</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        spotQuotes.map(quote => (
                                            <TableRow 
                                                key={quote.id} 
                                                className="hover:bg-slate-50 transition-colors cursor-pointer"
                                                onClick={() => {
                                                    setEditingSpotQuoteId(quote.id);
                                                    setIsSpotQuoteOpen(true);
                                                }}
                                            >
                                                <TableCell className="font-bold text-indigo-600 font-mono">{quote.quote_number}</TableCell>
                                                <TableCell className="whitespace-nowrap">{new Date(quote.quote_date).toLocaleDateString()}</TableCell>
                                                <TableCell>
                                                    <span className={quote.carrier_name === 'Not Assigned' ? "text-slate-400 italic" : "font-semibold text-slate-700"}>
                                                        {quote.carrier_name}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col text-xs">
                                                        <span className="font-semibold text-slate-900">{quote.shipper?.name || (quote.shipper_zip ? 'Zip Entry' : '-')}</span>
                                                        <span className="text-[10px] text-slate-500 uppercase tracking-tight">
                                                            {quote.shipper 
                                                                ? `${quote.shipper.city}, ${quote.shipper.state}` 
                                                                : (quote.shipper_zip ? `${quote.shipper_city}, ${quote.shipper_state} ${quote.shipper_zip}` : '-')}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col text-xs">
                                                        <span className="font-semibold text-slate-900">{quote.consignee?.name || (quote.consignee_zip ? 'Zip Entry' : '-')}</span>
                                                        <span className="text-[10px] text-slate-500 uppercase tracking-tight">
                                                            {quote.consignee 
                                                                ? `${quote.consignee.city}, ${quote.consignee.state}` 
                                                                : (quote.consignee_zip ? `${quote.consignee_city}, ${quote.consignee_state} ${quote.consignee_zip}` : '-')}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right font-bold text-indigo-600">${Number(quote.rate).toFixed(2)}</TableCell>
                                                <TableCell className="text-right font-semibold text-slate-600">${Number(quote.carrier_rate || 0).toFixed(2)}</TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-xs font-medium text-slate-700">
                                                            {quote.products?.length || 0} Products ({quote.products?.reduce((acc: number, p: any) => acc + (Number(p.pcs) || 0), 0)} Total Pcs)
                                                        </span>
                                                        {quote.accessorials?.length > 0 && (
                                                            <div className="flex flex-wrap gap-1">
                                                                {quote.accessorials.slice(0, 2).map((accId: string, i: number) => {
                                                                    const acc = accessorialsList.find(a => a.id === accId);
                                                                    return (
                                                                        <span key={i} className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded whitespace-nowrap">
                                                                            {acc?.name || accId}
                                                                        </span>
                                                                    );
                                                                })}
                                                                {quote.accessorials.length > 2 && (
                                                                    <span className="text-[10px] text-slate-400">+{quote.accessorials.length - 2} more</span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                                                        <button 
                                                            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors" 
                                                            title="Edit Quote"
                                                            onClick={() => {
                                                                setEditingSpotQuoteId(quote.id);
                                                                setIsSpotQuoteOpen(true);
                                                            }}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </button>
                                                        <PrintButton id={quote.id} type="spot-quote" />
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Quote Detail Modal */}
                        <Dialog open={isViewQuoteOpen} onOpenChange={setIsViewQuoteOpen}>
                            <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader className="border-b pb-4">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <DialogTitle className="text-2xl font-bold text-indigo-600 flex items-center gap-2">
                                                Quote {selectedQuote?.quote_number}
                                            </DialogTitle>
                                            <DialogDescription>
                                                Saved on {selectedQuote && new Date(selectedQuote.created_at).toLocaleString()}
                                            </DialogDescription>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Carrier</span>
                                            <span className="font-bold text-lg">{selectedQuote?.carrier_name}</span>
                                            <span className="text-xs text-slate-500 block">{selectedQuote?.scac}</span>
                                        </div>
                                    </div>
                                </DialogHeader>

                                <div className="py-6 space-y-8">
                                    {/* Shipping Lane */}
                                    <div className="grid grid-cols-2 gap-8 bg-slate-50 p-6 rounded-xl border border-slate-100">
                                        <div>
                                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1">
                                                <MapPin className="h-3 w-3" /> Origin
                                            </h4>
                                            <div className="font-semibold text-slate-900 leading-tight">
                                                {selectedQuote?.origin_info?.city}, {selectedQuote?.origin_info?.state} {selectedQuote?.origin_info?.zip}
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1">
                                                <MapPin className="h-3 w-3" /> Destination
                                            </h4>
                                            <div className="font-semibold text-slate-900 leading-tight">
                                                {selectedQuote?.destination_info?.city}, {selectedQuote?.destination_info?.state} {selectedQuote?.destination_info?.zip}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Items & Accessorials */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                                                <Users className="h-4 w-4 text-indigo-600" /> Shipment Items
                                            </h4>
                                            <div className="border border-slate-200 rounded-lg overflow-hidden">
                                                <Table>
                                                    <TableHeader className="bg-slate-50">
                                                        <TableRow>
                                                            <TableHead className="py-2 text-[10px]">Pcs</TableHead>
                                                            <TableHead className="py-2 text-[10px]">Type</TableHead>
                                                            <TableHead className="py-2 text-[10px] text-right">Class</TableHead>
                                                            <TableHead className="py-2 text-[10px] text-right">Weight</TableHead>
                                                            <TableHead className="py-2 text-[10px] text-right">Dimensions</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {selectedQuote?.items?.map((item: any, idx: number) => (
                                                            <TableRow key={idx}>
                                                                <TableCell className="py-2 text-xs font-medium">{item.pcs}</TableCell>
                                                                <TableCell className="py-2 text-xs">{item.type}</TableCell>
                                                                <TableCell className="py-2 text-xs text-right">{item.class}</TableCell>
                                                                <TableCell className="py-2 text-xs text-right text-slate-500">{item.weight} lbs</TableCell>
                                                                <TableCell className="py-2 text-xs text-right whitespace-nowrap">
                                                                    {item.length}x{item.width}x{item.height}
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                                                <Plus className="h-4 w-4 text-indigo-600" /> Accessorials
                                            </h4>
                                            {selectedQuote?.accessorials && selectedQuote.accessorials.length > 0 ? (
                                                <div className="flex flex-wrap gap-2">
                                                    {selectedQuote.accessorials.map((accId: any, idx: number) => {
                                                        const acc = accessorialsList.find(a => a.id === accId);
                                                        return (
                                                            <span key={idx} className="px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full text-xs font-medium">
                                                                {acc ? acc.name : accId}
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-slate-400 italic">No accessorials selected.</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Rate Summary */}
                                    <div className="border border-indigo-100 bg-indigo-50/30 rounded-xl p-6">
                                        <h4 className="text-sm font-bold text-slate-900 mb-4">Rate Breakdown</h4>
                                        <div className="space-y-3">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-500 font-medium">Base Linehaul</span>
                                                <span className="font-semibold text-slate-900">${Number(selectedQuote?.base_rate).toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-500 font-medium">Fuel Surcharge</span>
                                                <span className="font-semibold text-slate-900">${Number(selectedQuote?.fuel_surcharge).toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-500 font-medium">Accessorials Total</span>
                                                <span className="font-semibold text-slate-900">${Number(selectedQuote?.accessorials_total).toFixed(2)}</span>
                                            </div>
                                            <div className="pt-3 border-t border-indigo-100 flex justify-between items-end">
                                                <div>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Total Carrier Rate</span>
                                                    <span className="text-lg font-bold text-slate-900">${Number(selectedQuote?.total_carrier_rate).toFixed(2)}</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-1">Final Customer Rate</span>
                                                    <span className="text-2xl font-bold text-indigo-600">${Number(selectedQuote?.customer_rate).toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <DialogFooter className="border-t pt-4 flex justify-between items-center">
                                    {selectedQuote && (
                                        <PrintButton id={selectedQuote.id} type="quote" variant="outline" className="px-6 py-2" />
                                    )}
                                    <button 
                                        onClick={() => setIsViewQuoteOpen(false)}
                                        className="px-6 py-2 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-colors"
                                    >
                                        Close Details
                                    </button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        <SpotQuoteModal 
                            isOpen={isSpotQuoteOpen} 
                            onClose={() => setIsSpotQuoteOpen(false)} 
                            customerId={id} 
                            quoteId={editingSpotQuoteId} 
                            onSave={fetchSpotQuotes} 
                        />
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

                    {/* Users Tab */}
                    <TabsContent value="users" className="outline-none">
                        <div className="bg-white border border-slate-200 border-t-0 shadow-sm rounded-b-xl overflow-hidden">
                            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                                <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                    <Users className="h-5 w-5 text-indigo-600" />
                                    Customer Portal Users
                                </h2>
                                <Dialog open={isLinkUserOpen} onOpenChange={setIsLinkUserOpen}>
                                    <DialogTrigger asChild>
                                        <button className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 font-medium py-2 px-4 rounded-lg flex items-center gap-2 transition-colors">
                                            <Plus className="h-4 w-4" /> Link User Profile
                                        </button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-md">
                                        <DialogHeader>
                                            <DialogTitle>Link User to Customer</DialogTitle>
                                            <DialogDescription>Select an existing user profile to grant them access to this customer portal.</DialogDescription>
                                        </DialogHeader>
                                        <div className="py-4 space-y-4 max-h-96 overflow-y-auto px-1">
                                            {allProfiles.filter(p => (p.role === 'Customer' || p.role === 'Customer Service Rep') && !customerUsers.find(cu => cu.id === p.id)).map(profile => (
                                                <div key={profile.id} className="flex items-center justify-between p-3 border rounded-xl hover:bg-slate-50 transition-colors">
                                                    <div>
                                                        <p className="font-bold text-slate-800">{profile.first_name} {profile.last_name}</p>
                                                        <p className="text-sm text-slate-500">{profile.email}</p>
                                                    </div>
                                                    <button 
                                                        onClick={() => handleLinkUser(profile.id)}
                                                        disabled={linkingUser}
                                                        className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-indigo-700 disabled:opacity-50"
                                                    >
                                                        Link
                                                    </button>
                                                </div>
                                            ))}
                                            {allProfiles.filter(p => (p.role === 'Customer' || p.role === 'Customer Service Rep') && !customerUsers.find(cu => cu.id === p.id)).length === 0 && (
                                                <p className="text-center text-slate-500 py-4">No available user profiles found.</p>
                                            )}
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50">
                                        <TableHead>User Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {customerUsers.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-8 text-slate-500">No users linked to this customer yet.</TableCell>
                                        </TableRow>
                                    ) : (
                                        customerUsers.map(user => (
                                            <TableRow key={user.id}>
                                                <TableCell className="font-medium text-slate-900">{user.first_name} {user.last_name}</TableCell>
                                                <TableCell>{user.email}</TableCell>
                                                <TableCell>
                                                    <span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md text-xs font-bold border border-indigo-100">
                                                        {user.role}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <button 
                                                        onClick={() => handleUnlinkUser(user.id)}
                                                        className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors"
                                                        title="Unlink User"
                                                    >
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

                    {(userRole === 'Admin' || userRole === 'Supervisor') && (
                        <TabsContent value="reports" className="outline-none">
                            <div className="bg-white border border-slate-200 border-t-0 shadow-sm rounded-b-xl p-8">
                                <CustomerReports customerId={id} />
                            </div>
                        </TabsContent>
                    )}

                </Tabs>
            </div>

            <CalendarEventModal
                isOpen={isCalendarModalOpen}
                onClose={() => setIsCalendarModalOpen(false)}
                onSave={() => setIsCalendarModalOpen(false)}
                initialDescription={formData.company_name}
            />
        </div>
    );
}
