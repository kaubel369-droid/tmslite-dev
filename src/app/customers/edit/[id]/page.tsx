'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Building2, ArrowLeft, Save, FileText, Trash2, Pencil, Upload, Download, Phone, Mail, Users, MapPin, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatPhoneNumber } from '@/lib/utils';

type Contact = { id: string; name: string; phone: string; ext: string; cell_phone: string; email: string; position: string; notes: string };
type Document = { id: string; file_name: string; file_path: string; url: string; created_at: string };

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
        phone: '', email: '', website: '', status: 'Active', notes: '', credit_limit: '', payment_terms: 'Net 30',
    });
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [documents, setDocuments] = useState<Document[]>([]);

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
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchAllData();
    }, [id]);

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
                body: JSON.stringify({ ...formData, credit_limit: parseFloat(formData.credit_limit) || 0 }),
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
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                                        <div className="md:col-span-3">
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
                        <div className="bg-white border border-slate-200 border-t-0 shadow-sm rounded-b-xl p-16 flex flex-col items-center justify-center text-slate-500">
                            <h3 className="text-xl font-medium text-slate-800 mb-2">Dispatch History</h3>
                            <p className="max-w-md text-center">There are no loads recently dispatched for this customer yet.</p>
                        </div>
                    </TabsContent>

                    {/* Quotes Tab */}
                    <TabsContent value="quotes" className="outline-none">
                        <div className="bg-white border border-slate-200 border-t-0 shadow-sm rounded-b-xl p-16 flex flex-col items-center justify-center text-slate-500">
                            <h3 className="text-xl font-medium text-slate-800 mb-2">Freight Quotes</h3>
                            <p className="max-w-md text-center">There are no active quotes to display.</p>
                        </div>
                    </TabsContent>

                    {/* Rating Tab */}
                    <TabsContent value="rating" className="outline-none">
                        <div className="bg-white border border-slate-200 border-t-0 shadow-sm rounded-b-xl p-16 flex flex-col items-center justify-center text-slate-500">
                            <h3 className="text-xl font-medium text-slate-900 mb-2">LTL Rating Screen</h3>
                            <p className="max-w-md text-center">Configure standard LTL rate markups and tariffs here.</p>
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
