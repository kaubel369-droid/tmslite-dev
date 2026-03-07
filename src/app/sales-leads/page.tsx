'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Target, Plus, Search, Building } from 'lucide-react';

type SalesLead = {
    id: string;
    company_name: string;
    primary_contact: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    status: string;
    assigned_to_profile: { first_name: string, last_name: string } | null;
};

export default function SalesLeadsPage() {
    const [leads, setLeads] = useState<SalesLead[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>('All');

    const filteredLeads = leads.filter(l =>
        statusFilter === 'All' ? true : (l.status || 'New') === statusFilter
    );

    useEffect(() => {
        const fetchLeads = async () => {
            try {
                const response = await fetch('/api/sales-leads');
                if (!response.ok) throw new Error('Failed to fetch sales leads');
                const data = await response.json();
                setLeads(data.salesLeads || []);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchLeads();
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center">
            <div className="max-w-6xl w-full">
                <header className="mb-8 flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                            <Target className="h-8 w-8 text-indigo-600" />
                            Sales Leads
                        </h1>
                        <p className="text-slate-500 mt-2">Track and manage potential customers.</p>
                    </div>
                    <Link
                        href="/sales-leads/new"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-4 rounded-lg flex items-center gap-2 transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        New Lead
                    </Link>
                </header>

                {error && (
                    <div className="bg-red-50 text-red-600 border border-red-200 p-4 rounded-xl mb-6">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center p-12">
                        <span className="animate-pulse text-slate-500">Loading sales leads...</span>
                    </div>
                ) : leads.length === 0 ? (
                    <div className="flex flex-col items-center justify-center bg-white border border-slate-200 border-dashed rounded-xl p-16 text-slate-500 shadow-sm">
                        <Building className="h-12 w-12 text-slate-300 mb-4" />
                        <h3 className="text-lg font-medium text-slate-900 mb-1">No sales leads yet</h3>
                        <p className="mb-6 text-center max-w-sm">Start tracking potential business by adding your first lead.</p>
                        <Link
                            href="/sales-leads/new"
                            className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-indigo-600 font-medium px-4 py-2 rounded-lg shadow-sm transition-all flex items-center gap-2"
                        >
                            <Plus className="h-4 w-4" /> Add Sales Lead
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
                                        placeholder="Search leads..."
                                        className="pl-9 pr-4 py-1.5 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
                                    />
                                </div>
                                <select
                                    value={statusFilter}
                                    onChange={e => setStatusFilter(e.target.value)}
                                    className="px-3 py-1.5 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                                >
                                    <option value="All">All Statuses</option>
                                    <option value="New">New</option>
                                    <option value="Contacted">Contacted</option>
                                    <option value="Qualified">Qualified</option>
                                    <option value="Lost">Lost</option>
                                    <option value="Converted">Converted</option>
                                </select>
                            </div>
                            <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2.5 py-1 rounded-md">{filteredLeads.length} Leads</span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-3 font-semibold">Company Name</th>
                                        <th className="px-6 py-3 font-semibold">Contact</th>
                                        <th className="px-6 py-3 font-semibold">City</th>
                                        <th className="px-6 py-3 font-semibold">State</th>
                                        <th className="px-6 py-3 font-semibold">Assigned To</th>
                                        <th className="px-6 py-3 font-semibold">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredLeads.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                                                No leads match the current filter.
                                            </td>
                                        </tr>
                                    ) : filteredLeads.map((lead) => (
                                        <tr key={lead.id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">
                                                <Link href={`/sales-leads/edit/${lead.id}`} className="text-indigo-600 hover:text-indigo-800 hover:underline">
                                                    {lead.company_name}
                                                </Link>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                                                {lead.primary_contact || '-'}
                                                {lead.phone && <div className="text-xs text-slate-400">{lead.phone}</div>}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                                                {lead.city || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                                                {lead.state || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                                                {lead.assigned_to_profile ? `${lead.assigned_to_profile.first_name} ${lead.assigned_to_profile.last_name || ''}` : '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`text-xs px-2 py-1 rounded-md border font-medium 
                                                    ${lead.status === 'New' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                        lead.status === 'Contacted' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                            lead.status === 'Qualified' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                                                                lead.status === 'Converted' ? 'bg-green-50 text-green-700 border-green-200' :
                                                                    lead.status === 'Lost' ? 'bg-red-50 text-red-700 border-red-200' :
                                                                        'bg-slate-100 text-slate-700 border-slate-200'
                                                    }`}>
                                                    {lead.status || 'New'}
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
