'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Target, ArrowLeft, Save, Building, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatPhoneNumber } from '@/lib/utils';

type SalesRep = {
    id: string;
    first_name: string;
    last_name: string;
};

export default function EditSalesLeadPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const resolvedParams = use(params);
    const { id } = resolvedParams;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [converting, setConverting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [salesReps, setSalesReps] = useState<SalesRep[]>([]);

    const [formData, setFormData] = useState({
        company_name: '',
        primary_contact: '',
        address: '',
        city: '',
        state: '',
        zip: '',
        phone: '',
        email: '',
        website: '',
        status: 'New',
        notes: '',
        assigned_to: '',
        converted_to_customer_id: null as string | null
    });

    useEffect(() => {
        const fetchReps = async () => {
            try {
                const response = await fetch('/api/profiles/sales-reps');
                if (response.ok) {
                    const data = await response.json();
                    setSalesReps(data.salesReps || []);
                }
            } catch (err) {
                console.error("Failed to fetch sales reps", err);
            }
        };

        const fetchLead = async () => {
            try {
                const response = await fetch(`/api/sales-leads/${id}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch sales lead');
                }
                const data = await response.json();
                const lead = data.salesLead;
                if (lead) {
                    setFormData({
                        company_name: lead.company_name || '',
                        primary_contact: lead.primary_contact || '',
                        address: lead.address || '',
                        city: lead.city || '',
                        state: lead.state || '',
                        zip: lead.zip || '',
                        phone: lead.phone || '',
                        email: lead.email || '',
                        website: lead.website || '',
                        status: lead.status || 'New',
                        notes: lead.notes || '',
                        assigned_to: lead.assigned_to || '',
                        converted_to_customer_id: lead.converted_to_customer_id || null
                    });
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchReps();
        fetchLead();
    }, [id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        let value = e.target.value;
        if (e.target.name === 'phone') {
            value = formatPhoneNumber(value);
        }
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const bodyPayload = { ...formData };
            if (!bodyPayload.assigned_to) {
                delete (bodyPayload as any).assigned_to;
            }

            const response = await fetch(`/api/sales-leads/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(bodyPayload),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to update sales lead');
            }

            setSuccessMessage('Sales lead updated successfully');
            setTimeout(() => setSuccessMessage(null), 3000);
            router.refresh();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleConvert = async () => {
        if (!confirm('Are you sure you want to convert this lead? It will create a new tracking record in the Customers directory.')) return;
        setConverting(true);
        setError(null);

        try {
            const response = await fetch(`/api/sales-leads/${id}/convert`, {
                method: 'POST'
            });
            const data = await response.json();

            if (!response.ok) {
                if (data.customerId) {
                    // Already converted, just route there
                    router.push(`/customers/edit/${data.customerId}`);
                    return;
                }
                throw new Error(data.error || 'Failed to convert sales lead');
            }

            router.push(`/customers/edit/${data.customer.id}`);
            router.refresh();
        } catch (err: any) {
            setError(err.message);
            setConverting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4 text-slate-500">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                    <p>Loading sales lead details...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center">
            <div className="max-w-5xl w-full">
                <div className="flex justify-between items-start mb-6">
                    <Link
                        href="/sales-leads"
                        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 transition-colors font-medium"
                    >
                        <ArrowLeft className="h-4 w-4" /> Back to Sales Leads
                    </Link>
                    {formData.status === 'Converted' ? (
                        <div className="text-sm font-medium text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg flex items-center gap-2">
                            <span>This lead was successfully converted.</span>
                            <Link href={`/customers/edit/${formData.converted_to_customer_id}`} className="underline">View Customer</Link>
                        </div>
                    ) : (
                        ['New', 'Contacted', 'Qualified'].includes(formData.status) && (
                            <button
                                type="button"
                                onClick={handleConvert}
                                disabled={converting}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
                            >
                                {converting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" /> Converting...
                                    </>
                                ) : (
                                    <>
                                        Convert to Customer <ArrowRight className="h-4 w-4" />
                                    </>
                                )}
                            </button>
                        )
                    )}
                </div>

                <header className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                        <Target className="h-8 w-8 text-indigo-600" />
                        {formData.company_name || 'Edit Lead'}
                    </h1>
                    <p className="text-slate-500 mt-2">Manage tracking details for this sales lead.</p>
                </header>

                {error && (
                    <div className="bg-red-50 text-red-600 border border-red-200 p-4 rounded-xl mb-6">
                        {error}
                    </div>
                )}
                {successMessage && (
                    <div className="bg-green-50 text-green-700 border border-green-200 p-4 rounded-xl mb-6">
                        {successMessage}
                    </div>
                )}

                <Tabs defaultValue="info" className="w-full">
                    <TabsList>
                        <TabsTrigger value="info">
                            Lead Information
                        </TabsTrigger>
                        <TabsTrigger value="activity">
                            Activity
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="info" className="outline-none">
                        <div className="bg-white border border-slate-200 border-t-0 shadow-sm rounded-b-xl p-8">
                            <form onSubmit={handleSubmit} className="space-y-6">

                                <div className="border-b border-slate-100 pb-6">
                                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Core Information</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="md:col-span-2">
                                            <label htmlFor="company_name" className="block text-sm font-semibold text-slate-700 mb-1">Company Name <span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                id="company_name"
                                                name="company_name"
                                                value={formData.company_name}
                                                onChange={handleChange}
                                                required
                                                className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label htmlFor="address" className="block text-sm font-semibold text-slate-700 mb-1">Address</label>
                                            <input
                                                type="text"
                                                id="address"
                                                name="address"
                                                value={formData.address}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                                            />
                                        </div>
                                        <div className="md:col-span-2 grid grid-cols-3 gap-6">
                                            <div className="col-span-1">
                                                <label htmlFor="city" className="block text-sm font-semibold text-slate-700 mb-1">City</label>
                                                <input
                                                    type="text"
                                                    id="city"
                                                    name="city"
                                                    value={formData.city}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                                                />
                                            </div>
                                            <div className="col-span-1">
                                                <label htmlFor="state" className="block text-sm font-semibold text-slate-700 mb-1">State</label>
                                                <input
                                                    type="text"
                                                    id="state"
                                                    name="state"
                                                    value={formData.state}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                                                />
                                            </div>
                                            <div className="col-span-1">
                                                <label htmlFor="zip" className="block text-sm font-semibold text-slate-700 mb-1">Zip Code</label>
                                                <input
                                                    type="text"
                                                    id="zip"
                                                    name="zip"
                                                    value={formData.zip}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-b border-slate-100 pb-6">
                                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Contact & Web</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label htmlFor="primary_contact" className="block text-sm font-semibold text-slate-700 mb-1">Primary Contact</label>
                                            <input
                                                type="text"
                                                id="primary_contact"
                                                name="primary_contact"
                                                value={formData.primary_contact}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="phone" className="block text-sm font-semibold text-slate-700 mb-1">Main Phone</label>
                                            <input
                                                type="tel"
                                                id="phone"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1">Main Email</label>
                                            <input
                                                type="email"
                                                id="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="website" className="block text-sm font-semibold text-slate-700 mb-1">Website</label>
                                            <input
                                                type="url"
                                                id="website"
                                                name="website"
                                                value={formData.website}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="border-b border-slate-100 pb-6">
                                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Lead Status & Assignment</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label htmlFor="status" className="block text-sm font-semibold text-slate-700 mb-1">Status</label>
                                            <select
                                                id="status"
                                                name="status"
                                                value={formData.status}
                                                onChange={handleChange}
                                                disabled={formData.status === 'Converted'}
                                                className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors disabled:opacity-60"
                                            >
                                                <option value="New">New</option>
                                                <option value="Contacted">Contacted</option>
                                                <option value="Qualified">Qualified</option>
                                                <option value="Lost">Lost</option>
                                                <option value="Converted">Converted</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label htmlFor="assigned_to" className="block text-sm font-semibold text-slate-700 mb-1">Assigned Sales Rep</label>
                                            <select
                                                id="assigned_to"
                                                name="assigned_to"
                                                value={formData.assigned_to}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                                            >
                                                <option value="">-- Unassigned --</option>
                                                {salesReps.map(rep => (
                                                    <option key={rep.id} value={rep.id}>
                                                        {rep.first_name} {rep.last_name || ''}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="md:col-span-2">
                                            <label htmlFor="notes" className="block text-sm font-semibold text-slate-700 mb-1">Notes</label>
                                            <textarea
                                                id="notes"
                                                name="notes"
                                                value={formData.notes}
                                                onChange={handleChange}
                                                rows={3}
                                                className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors resize-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 flex justify-end gap-4">
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-6 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
                                    >
                                        {saving ? (
                                            <span className="animate-pulse">Saving...</span>
                                        ) : (
                                            <>
                                                <Save className="h-4 w-4" />
                                                Save Updates
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </TabsContent>

                    <TabsContent value="activity">
                        <div className="bg-white border border-slate-200 border-t-0 shadow-sm rounded-b-xl p-8 text-center text-slate-500">
                            Activity tracking coming soon!
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
