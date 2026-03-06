'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Truck, ArrowLeft, Save, Lock } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatPhoneNumber } from '@/lib/utils';

export default function NewShipperConsigneePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        address: '',
        city: '',
        state: '',
        zip: '',
        phone: '',
        email: '',
        website: '',
        status: 'Active',
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
            const response = await fetch('/api/shipper-consignees', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to create shipper/consignee');
            }

            const data = await response.json();

            router.push(`/shipper-consignees/edit/${data.shipper_consignee.id}`);
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
                    href="/shipper-consignees"
                    className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 transition-colors mb-6 font-medium"
                >
                    <ArrowLeft className="h-4 w-4" /> Back to Shippers/Consignees
                </Link>

                <header className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                        <Truck className="h-8 w-8 text-indigo-600" />
                        Add New Shipper/Consignee
                    </h1>
                    <p className="text-slate-500 mt-2">Create a new location profile. Contacts can be added after saving.</p>
                </header>

                {error && (
                    <div className="bg-red-50 text-red-600 border border-red-200 p-4 rounded-xl mb-6">
                        {error}
                    </div>
                )}

                <Tabs defaultValue="info" className="w-full">
                    <TabsList>
                        <TabsTrigger value="info">
                            Shipper/Consignee Information
                        </TabsTrigger>
                        <TabsTrigger value="contacts" disabled className="flex gap-2 items-center opacity-50 cursor-not-allowed">
                            Contacts <Lock className="h-3 w-3" />
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="info" className="outline-none">
                        <div className="bg-white border border-slate-200 border-t-0 shadow-sm rounded-b-xl p-8">
                            <form onSubmit={handleSubmit} className="space-y-6">

                                <div className="border-b border-slate-100 pb-6">
                                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Core Information</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="md:col-span-2">
                                            <label htmlFor="name" className="block text-sm font-semibold text-slate-700 mb-1">Company / Location Name <span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                id="name"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                required
                                                className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                                                placeholder="Acme Warehousing"
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
                                                placeholder="123 Industrial Pkwy"
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
                                    </div>
                                </div>

                                <div className="border-b border-slate-100 pb-6">
                                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Contact & Web</h2>
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
                                                placeholder="https://"
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
                                    <Link
                                        href="/shipper-consignees"
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
