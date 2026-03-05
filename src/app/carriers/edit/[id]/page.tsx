'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Building2, ArrowLeft, Save, FileText, Trash2, Pencil, Upload, Download, Phone, Mail, Users, MapPin, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatPhoneNumber } from '@/lib/utils';
import { createClient } from '@/utils/supabase/client';

type Contact = { id: string; name: string; phone: string; ext: string; cell_phone: string; email: string; position: string; notes: string };
type Document = { id: string; file_name: string; file_path: string; url: string; created_at: string };

export default function EditCarrierPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Auth State
    const [userRole, setUserRole] = useState<string | null>(null);

    // Data States
    const [formData, setFormData] = useState({
        company_name: '', address: '', city: '', state: '', zip: '',
        phone: '', status: 'Active',
        website: '', dot_number: '', ein: '', mc_number: '', scac: '', insurance_status: '', notes: '',
        api_key: '', api_secret: '', api_url: '', api_account_number: '', api_username: '', api_password: '', api_enabled: false
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
                // Fetch User Role
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

                // Fetch Carrier
                const custRes = await fetch(`/api/carriers/${id}`);
                if (!custRes.ok) throw new Error('Carrier not found');
                const custData = await custRes.json();
                setFormData({
                    ...custData.carrier,
                    company_name: custData.carrier.name || ''
                });

                // Fetch Contacts
                const contRes = await fetch(`/api/carriers/${id}/contacts`);
                const contData = await contRes.json();
                setContacts(contData.contacts || []);

                // Fetch Documents
                const docRes = await fetch(`/api/carriers/${id}/documents`);
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

    // Carrier Info Handlers
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
            const res = await fetch(`/api/carriers/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            if (!res.ok) throw new Error('Failed to update carrier');
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
            const url = editingContactId ? `/api/carriers/${id}/contacts/${editingContactId}` : `/api/carriers/${id}/contacts`;
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
            const contRes = await fetch(`/api/carriers/${id}/contacts`);
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
            const res = await fetch(`/api/carriers/${id}/contacts/${contactId}`, { method: 'DELETE' });
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
            const res = await fetch(`/api/carriers/${id}/documents`, {
                method: 'POST',
                body: data
            });
            if (!res.ok) throw new Error('Failed to upload document');

            // Refresh docs
            const docRes = await fetch(`/api/carriers/${id}/documents`);
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
            const res = await fetch(`/api/carriers/${id}/documents/${docId}`, { method: 'DELETE' });
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
                <Link href="/carriers" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 transition-colors mb-6 font-medium">
                    <ArrowLeft className="h-4 w-4" /> Back to Carriers
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
                    <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6 mb-8 h-auto p-1 bg-white border border-slate-200 rounded-lg shadow-sm">
                        <TabsTrigger value="info" className="py-2.5 data-[state=active]:bg-slate-100 data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm">Carrier Info</TabsTrigger>
                        <TabsTrigger value="contacts" className="py-2.5 data-[state=active]:bg-slate-100 data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm">Contacts ({contacts.length})</TabsTrigger>
                        <TabsTrigger value="rating" className="py-2.5 data-[state=active]:bg-slate-100 data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm">Rating</TabsTrigger>
                        <TabsTrigger value="documents" className="py-2.5 data-[state=active]:bg-slate-100 data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm">Documents ({documents.length})</TabsTrigger>
                        {(userRole === 'Admin' || userRole === 'Supervisor') && (
                            <TabsTrigger value="api_settings" className="py-2.5 data-[state=active]:bg-slate-100 data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm">API Settings</TabsTrigger>
                        )}
                        <TabsTrigger value="insurance" className="py-2.5 data-[state=active]:bg-slate-100 data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm">Insurance</TabsTrigger>
                    </TabsList>

                    {/* Carrier Info Tab */}
                    <TabsContent value="info" className="outline-none">
                        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-8">
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
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-semibold text-slate-700 mb-1">Website</label>
                                            <input type="url" name="website" value={formData.website || ''} onChange={handleInfoChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                        </div>
                                        <div className="md:col-span-2 grid grid-cols-2 lg:grid-cols-4 gap-6">
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-1">SCAC</label>
                                                <input type="text" name="scac" maxLength={8} value={formData.scac || ''} onChange={handleInfoChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-1">DOT Number</label>
                                                <input type="text" name="dot_number" maxLength={10} value={formData.dot_number || ''} onChange={handleInfoChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-1">MC Number</label>
                                                <input type="text" name="mc_number" maxLength={10} value={formData.mc_number || ''} onChange={handleInfoChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-1">EIN</label>
                                                <input type="text" name="ein" maxLength={10} value={formData.ein || ''} onChange={handleInfoChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                            </div>
                                        </div>
                                        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-1">Insurance Status</label>
                                                <input type="text" name="insurance_status" value={formData.insurance_status || ''} onChange={handleInfoChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                            </div>
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-semibold text-slate-700 mb-1">Notes</label>
                                            <textarea name="notes" value={formData.notes || ''} onChange={handleInfoChange} rows={3} className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
                                        </div>
                                    </div>
                                </div>
                                <div className="border-b border-slate-100 pb-6">
                                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Contact & Status</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1">Main Phone</label>
                                            <input type="tel" name="phone" value={formData.phone || ''} onChange={handleInfoChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1">Status</label>
                                            <select name="status" value={formData.status} onChange={handleInfoChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                                <option value="Active">Active</option>
                                                <option value="Credit Hold">Credit Hold</option>
                                                <option value="Inactive">Inactive</option>
                                            </select>
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
                        <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
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

                    {/* API Settings Tab */}
                    {(userRole === 'Admin' || userRole === 'Supervisor') && (
                        <TabsContent value="api_settings" className="outline-none">
                            <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-8">
                                <form onSubmit={handleInfoSave} className="space-y-6">
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                                        <div>
                                            <h2 className="text-lg font-semibold text-slate-800">API Settings</h2>
                                            <p className="text-sm text-slate-500">Configure connection details for this carrier.</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-medium text-slate-700">Enable API</span>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" name="api_enabled" checked={formData.api_enabled} onChange={(e) => setFormData(prev => ({ ...prev, api_enabled: e.target.checked }))} className="sr-only peer" />
                                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                            </label>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-semibold text-slate-700 mb-1">API URL</label>
                                            <input type="url" name="api_url" value={formData.api_url || ''} onChange={handleInfoChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="https://api.carrier.com/v1" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1">API Key</label>
                                            <input type="password" name="api_key" value={formData.api_key || ''} onChange={handleInfoChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="••••••••••••••••" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1">API Secret</label>
                                            <input type="password" name="api_secret" value={formData.api_secret || ''} onChange={handleInfoChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="••••••••••••••••" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1">Username</label>
                                            <input type="text" name="api_username" value={formData.api_username || ''} onChange={handleInfoChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
                                            <input type="password" name="api_password" value={formData.api_password || ''} onChange={handleInfoChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="••••••••" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1">Account Number</label>
                                            <input type="text" name="api_account_number" value={formData.api_account_number || ''} onChange={handleInfoChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1">SCAC</label>
                                            <input type="text" name="scac" maxLength={8} value={formData.scac || ''} onChange={handleInfoChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase" />
                                        </div>
                                    </div>

                                    <div className="pt-4 flex flex-wrap justify-between items-center gap-4 bg-slate-50/50 -mx-8 -mb-8 p-6 border-t border-slate-100 rounded-b-xl">
                                        <div className="flex gap-3">
                                            <button type="button" onClick={async () => {
                                                if (confirm('Are you sure you want to delete these API settings?')) {
                                                    setFormData(prev => ({
                                                        ...prev, api_key: '', api_secret: '', api_url: '', api_account_number: '', api_username: '', api_password: '', api_enabled: false
                                                    }));
                                                }
                                            }} className="text-red-600 hover:text-red-700 hover:bg-red-50 font-medium py-2 px-4 rounded-lg transition-colors border border-transparent hover:border-red-200">
                                                Delete Settings
                                            </button>
                                            <button type="button" onClick={() => {
                                                alert('Mock test connection successful!');
                                            }} className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium py-2 px-4 rounded-lg transition-colors shadow-sm">
                                                Test Connection
                                            </button>
                                        </div>
                                        <div className="flex gap-3">
                                            <button type="button" onClick={() => {
                                                router.refresh();
                                            }} className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium py-2 px-4 rounded-lg transition-colors shadow-sm">
                                                Reset
                                            </button>
                                            <button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-70 shadow-sm">
                                                {saving ? <span className="animate-pulse">Saving...</span> : <><Save className="h-4 w-4" /> Save Settings</>}
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </TabsContent>
                    )}

                    {/* Insurance Tab */}
                    <TabsContent value="insurance" className="outline-none">
                        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-16 flex flex-col items-center justify-center text-slate-500">
                            <h3 className="text-xl font-medium text-slate-800 mb-2">Insurance Details</h3>
                            <p className="max-w-md text-center">Track policy expirations, cargo limits, and general liability.</p>
                        </div>
                    </TabsContent>

                    {/* Rating Tab */}
                    <TabsContent value="rating" className="outline-none">
                        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-16 flex flex-col items-center justify-center text-slate-500">
                            <h3 className="text-xl font-medium text-slate-900 mb-2">LTL Rating Screen</h3>
                            <p className="max-w-md text-center">Configure standard LTL rate markups and tariffs here.</p>
                        </div>
                    </TabsContent>

                    {/* Documents Tab */}
                    <TabsContent value="documents" className="outline-none">
                        <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
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
                                            <TableCell colSpan={3} className="text-center py-8 text-slate-500">No documents found for this carrier.</TableCell>
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
