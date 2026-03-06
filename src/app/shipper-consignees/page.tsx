'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Truck, Plus, Building2, Search } from 'lucide-react';

type ShipperConsignee = {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    status: string;
};

export default function ShipperConsigneesPage() {
    const [records, setRecords] = useState<ShipperConsignee[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>('Active');

    const filteredRecords = records.filter(r =>
        statusFilter === 'All' ? true : (r.status || 'Active') === statusFilter
    );

    useEffect(() => {
        const fetchRecords = async () => {
            try {
                const response = await fetch('/api/shipper-consignees');
                if (!response.ok) throw new Error('Failed to fetch shippers/consignees');
                const data = await response.json();
                setRecords(data.shipper_consignees || []);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchRecords();
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center">
            <div className="max-w-6xl w-full">
                <header className="mb-8 flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                            <Truck className="h-8 w-8 text-indigo-600" />
                            Shippers & Consignees
                        </h1>
                        <p className="text-slate-500 mt-2">Manage your pickup and delivery locations.</p>
                    </div>
                    <Link
                        href="/shipper-consignees/new"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-4 rounded-lg flex items-center gap-2 transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        New Shipper/Consignee
                    </Link>
                </header>

                {error && (
                    <div className="bg-red-50 text-red-600 border border-red-200 p-4 rounded-xl mb-6">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center p-12">
                        <span className="animate-pulse text-slate-500">Loading records...</span>
                    </div>
                ) : records.length === 0 ? (
                    <div className="flex flex-col items-center justify-center bg-white border border-slate-200 border-dashed rounded-xl p-16 text-slate-500 shadow-sm">
                        <Building2 className="h-12 w-12 text-slate-300 mb-4" />
                        <h3 className="text-lg font-medium text-slate-900 mb-1">No locations yet</h3>
                        <p className="mb-6 text-center max-w-sm">Get started by adding your first shipper or consignee to manage pickup and delivery operations.</p>
                        <Link
                            href="/shipper-consignees/new"
                            className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-indigo-600 font-medium px-4 py-2 rounded-lg shadow-sm transition-all flex items-center gap-2"
                        >
                            <Plus className="h-4 w-4" /> Add Shipper/Consignee
                        </Link>
                    </div>
                ) : (
                    <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                            <div className="flex gap-4 items-center">
                                <div className="relative">
                                    <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        placeholder="Search locations..."
                                        className="pl-9 pr-4 py-1.5 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
                                    />
                                </div>
                                <select
                                    value={statusFilter}
                                    onChange={e => setStatusFilter(e.target.value)}
                                    className="px-3 py-1.5 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                                >
                                    <option value="All">All Statuses</option>
                                    <option value="Active">Active Only</option>
                                    <option value="Credit Hold">Credit Hold Only</option>
                                    <option value="Inactive">Inactive Only</option>
                                </select>
                            </div>
                            <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2.5 py-1 rounded-md">{filteredRecords.length} Records</span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-3 font-semibold">Name</th>
                                        <th className="px-6 py-3 font-semibold">Address</th>
                                        <th className="px-6 py-3 font-semibold">City</th>
                                        <th className="px-6 py-3 font-semibold">State</th>
                                        <th className="px-6 py-3 font-semibold">Zip</th>
                                        <th className="px-6 py-3 font-semibold">Phone</th>
                                        <th className="px-6 py-3 font-semibold">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredRecords.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                                                No locations match the current filter.
                                            </td>
                                        </tr>
                                    ) : filteredRecords.map((record) => (
                                        <tr key={record.id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">
                                                <Link href={`/shipper-consignees/edit/${record.id}`} className="text-indigo-600 hover:text-indigo-800 hover:underline">
                                                    {record.name}
                                                </Link>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                                                {record.address || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                                                {record.city || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                                                {record.state || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                                                {record.zip || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                                                {record.phone || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`text-xs px-2 py-1 rounded-md border font-medium ${record.status === 'Active' ? 'bg-green-50 text-green-700 border-green-200' :
                                                    record.status === 'Credit Hold' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                        'bg-slate-100 text-slate-700 border-slate-200'
                                                    }`}>
                                                    {record.status || 'Active'}
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
