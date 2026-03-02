'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Building2, ArrowLeft, Save } from 'lucide-react';

export default function NewCustomerPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        company_name: '',
        primary_contact: '',
        email: '',
        phone: '',
        credit_limit: '',
        payment_terms: 'Net 30',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/customers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...formData,
                    credit_limit: parseFloat(formData.credit_limit) || 0,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to create customer');
            }

            router.push('/customers');
            router.refresh(); // Refresh the page to show new data
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center">
            <div className="max-w-3xl w-full">
                <Link
                    href="/customers"
                    className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 transition-colors mb-6 font-medium"
                >
                    <ArrowLeft className="h-4 w-4" /> Back to Customers
                </Link>

                <header className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                        <Building2 className="h-8 w-8 text-indigo-600" />
                        Add New Customer
                    </h1>
                    <p className="text-slate-500 mt-2">Enter the details for the new customer profile.</p>
                </header>

                {error && (
                    <div className="bg-red-50 text-red-600 border border-red-200 p-4 rounded-xl mb-6">
                        {error}
                    </div>
                )}

                <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">

                        <div className="border-b border-slate-100 pb-6">
                            <h2 className="text-lg font-semibold text-slate-800 mb-4">Company Information</h2>
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
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
                                        placeholder="Acme Logistics Inc."
                                    />
                                </div>
                                <div>
                                    <label htmlFor="primary_contact" className="block text-sm font-semibold text-slate-700 mb-1">Primary Contact</label>
                                    <input
                                        type="text"
                                        id="primary_contact"
                                        name="primary_contact"
                                        value={formData.primary_contact}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
                                        placeholder="Jane Doe"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1">Email Address</label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
                                        placeholder="jane@acme.com"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="phone" className="block text-sm font-semibold text-slate-700 mb-1">Phone Number</label>
                                    <input
                                        type="tel"
                                        id="phone"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
                                        placeholder="(555) 123-4567"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-2">
                            <h2 className="text-lg font-semibold text-slate-800 mb-4">Billing Details</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="credit_limit" className="block text-sm font-semibold text-slate-700 mb-1">Credit Limit ($)</label>
                                    <input
                                        type="number"
                                        id="credit_limit"
                                        name="credit_limit"
                                        value={formData.credit_limit}
                                        onChange={handleChange}
                                        step="0.01"
                                        min="0"
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
                                        placeholder="5000.00"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="payment_terms" className="block text-sm font-semibold text-slate-700 mb-1">Payment Terms</label>
                                    <select
                                        id="payment_terms"
                                        name="payment_terms"
                                        value={formData.payment_terms}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors appearance-none"
                                    >
                                        <option value="Prepaid">Prepaid</option>
                                        <option value="Due on Receipt">Due on Receipt</option>
                                        <option value="Net 15">Net 15</option>
                                        <option value="Net 30">Net 30</option>
                                        <option value="Net 45">Net 45</option>
                                        <option value="Net 60">Net 60</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 flex justify-end gap-4 border-t border-slate-100">
                            <Link
                                href="/customers"
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
                                        Save Customer
                                    </>
                                )}
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
}
