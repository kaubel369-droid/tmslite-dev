'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, Plus, Building2, Search } from 'lucide-react';

type Customer = {
    id: string;
    company_name: string;
    primary_contact: string;
    email: string;
    phone: string;
    credit_limit: number;
    payment_terms: string;
};

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const response = await fetch('/api/customers');
                if (!response.ok) throw new Error('Failed to fetch customers');
                const data = await response.json();
                setCustomers(data.customers || []);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchCustomers();
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center">
            <div className="max-w-6xl w-full">
                <header className="mb-8 flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                            <Users className="h-8 w-8 text-indigo-600" />
                            Customers
                        </h1>
                        <p className="text-slate-500 mt-2">Manage your customer relationships and billing details.</p>
                    </div>
                    <Link
                        href="/customers/new"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-4 rounded-lg flex items-center gap-2 transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        New Customer
                    </Link>
                </header>

                {error && (
                    <div className="bg-red-50 text-red-600 border border-red-200 p-4 rounded-xl mb-6">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center p-12">
                        <span className="animate-pulse text-slate-500">Loading customers...</span>
                    </div>
                ) : customers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center bg-white border border-slate-200 border-dashed rounded-xl p-16 text-slate-500 shadow-sm">
                        <Building2 className="h-12 w-12 text-slate-300 mb-4" />
                        <h3 className="text-lg font-medium text-slate-900 mb-1">No customers yet</h3>
                        <p className="mb-6 text-center max-w-sm">Get started by adding your first customer to the TMS to manage their freight and billing.</p>
                        <Link
                            href="/customers/new"
                            className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-indigo-600 font-medium px-4 py-2 rounded-lg shadow-sm transition-all flex items-center gap-2"
                        >
                            <Plus className="h-4 w-4" /> Add Customer
                        </Link>
                    </div>
                ) : (
                    <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                            <div className="relative">
                                <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Search customers..."
                                    className="pl-9 pr-4 py-1.5 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
                                />
                            </div>
                            <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2.5 py-1 rounded-md">{customers.length} Customers</span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-3 font-semibold">Company Name</th>
                                        <th className="px-6 py-3 font-semibold">Contact</th>
                                        <th className="px-6 py-3 font-semibold">Email</th>
                                        <th className="px-6 py-3 font-semibold">Phone</th>
                                        <th className="px-6 py-3 font-semibold text-right">Credit Limit</th>
                                        <th className="px-6 py-3 font-semibold">Terms</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {customers.map((customer) => (
                                        <tr key={customer.id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">
                                                {customer.company_name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                                                {customer.primary_contact || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                                                {customer.email ? (
                                                    <a href={`mailto:${customer.email}`} className="text-indigo-600 hover:underline">{customer.email}</a>
                                                ) : '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                                                {customer.phone || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-slate-600">
                                                ${Number(customer.credit_limit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded-md border border-slate-200 font-medium">
                                                    {customer.payment_terms || 'N/A'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
