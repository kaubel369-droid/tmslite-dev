'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Building2, ArrowLeft, Save, Lock } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatPhoneNumber } from '@/lib/utils';

export default function NewCarrierPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        company_name: '',
        address: '',
        city: '',
        state: '',
        zip: '',
        phone: '',
        status: 'Active',
        website: '',
        dot_number: '',
        ein: '',
        mc_number: '',
        scac: '',
        insurance_status: '',
        notes: '',
    });

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
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/carriers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to create carrier');
            }

            const data = await response.json();

            // Redirect to edit page
            router.push(`/carriers/edit/${data.carrier.id}`);
            router.refresh();
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center">
            <div className="max-w-5xl w-full">
                <Link
                    href="/carriers"
                    className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 transition-colors mb-6 font-medium"
                >
                    <ArrowLeft className="h-4 w-4" /> Back to Carriers
                </Link>

                <header className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                        <Building2 className="h-8 w-8 text-indigo-600" />
                        Add New Carrier
                    </h1>
                    <p className="text-slate-500 mt-2">Create a new carrier profile. Other features unlock after saving.</p>
                </header>

                {error && (
                    <div className="bg-red-50 text-red-600 border border-red-200 p-4 rounded-xl mb-6">
                        {error}
                    </div>
                )}

                <Tabs defaultValue="info" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 md:grid-cols-6 mb-8 h-auto p-1 bg-white border border-slate-200 rounded-lg shadow-sm">
                        <TabsTrigger value="info" className="py-2.5 data-[state=active]:bg-slate-100 data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm">
                            Carrier Information
                        </TabsTrigger>
                        <TabsTrigger value="contacts" disabled className="py-2.5 flex gap-2 items-center opacity-50 cursor-not-allowed">
                            Contacts <Lock className="h-3 w-3" />
                        </TabsTrigger>
                        <TabsTrigger value="rating" disabled className="py-2.5 flex gap-2 items-center opacity-50 cursor-not-allowed">
                            Rating <Lock className="h-3 w-3" />
                        </TabsTrigger>
                        <TabsTrigger value="documents" disabled className="py-2.5 flex gap-2 items-center opacity-50 cursor-not-allowed">
                            Documents <Lock className="h-3 w-3" />
                        </TabsTrigger>
                        <TabsTrigger value="api_settings" disabled className="py-2.5 flex gap-2 items-center opacity-50 cursor-not-allowed">
                            API Settings <Lock className="h-3 w-3" />
                        </TabsTrigger>
                        <TabsTrigger value="insurance" disabled className="py-2.5 flex gap-2 items-center opacity-50 cursor-not-allowed">
                            Insurance <Lock className="h-3 w-3" />
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="info" className="outline-none">
                        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-8">
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
                                                placeholder="Acme Logistics Inc."
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
                                                placeholder="123 Main St"
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
                                                    placeholder="NY"
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
                                        <div className="md:col-span-2">
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
                                        <div className="md:col-span-2 grid grid-cols-2 lg:grid-cols-4 gap-6">
                                            <div>
                                                <label htmlFor="scac" className="block text-sm font-semibold text-slate-700 mb-1">SCAC</label>
                                                <input
                                                    type="text"
                                                    id="scac"
                                                    name="scac"
                                                    maxLength={8}
                                                    value={formData.scac}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors uppercase"
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor="dot_number" className="block text-sm font-semibold text-slate-700 mb-1">DOT Number</label>
                                                <input
                                                    type="text"
                                                    id="dot_number"
                                                    name="dot_number"
                                                    maxLength={10}
                                                    value={formData.dot_number}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor="mc_number" className="block text-sm font-semibold text-slate-700 mb-1">MC Number</label>
                                                <input
                                                    type="text"
                                                    id="mc_number"
                                                    name="mc_number"
                                                    maxLength={10}
                                                    value={formData.mc_number}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor="ein" className="block text-sm font-semibold text-slate-700 mb-1">EIN</label>
                                                <input
                                                    type="text"
                                                    id="ein"
                                                    name="ein"
                                                    maxLength={10}
                                                    value={formData.ein}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                                                />
                                            </div>
                                        </div>
                                        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label htmlFor="insurance_status" className="block text-sm font-semibold text-slate-700 mb-1">Insurance Status</label>
                                                <input
                                                    type="text"
                                                    id="insurance_status"
                                                    name="insurance_status"
                                                    value={formData.insurance_status}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                                                />
                                            </div>
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

                                <div className="border-b border-slate-100 pb-6">
                                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Contact & Status</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                            <label htmlFor="status" className="block text-sm font-semibold text-slate-700 mb-1">Status</label>
                                            <select
                                                id="status"
                                                name="status"
                                                value={formData.status}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                                            >
                                                <option value="Active">Active</option>
                                                <option value="Credit Hold">Credit Hold</option>
                                                <option value="Inactive">Inactive</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 flex justify-end gap-4">
                                    <Link
                                        href="/carriers"
                                        className="px-6 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
                                    >
                                        Cancel
                                    </Link>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-6 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
                                    >
                                        {loading ? (
                                            <span className="animate-pulse">Saving...</span>
                                        ) : (
                                            <>
                                                <Save className="h-4 w-4" />
                                                Save & Continue
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </TabsContent>

                </Tabs>
            </div>
        </div>
    );
}
