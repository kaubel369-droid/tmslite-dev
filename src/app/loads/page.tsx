'use client';

import { useState, useEffect } from 'react';
import { Truck, Plus, Package, CheckCircle2, Search, Edit2 } from 'lucide-react';
import LoadEntryModal from './components/LoadEntryModal';

type Load = {
    id: string;
    load_number: string;
    customer: { company_name: string } | null;
    consignee: { name: string } | null;
    pickup_date: string;
    customer_rate: number;
    status: string;
};

type BoardTab = 'Pickups' | 'Loads' | 'Invoice Que';

export default function LoadsPage() {
    const [loads, setLoads] = useState<Load[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [activeTab, setActiveTab] = useState<BoardTab>('Pickups');
    const [statusFilter, setStatusFilter] = useState<string>('All');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingLoadId, setEditingLoadId] = useState<string | null>(null);

    const fetchLoads = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/loads');
            if (!response.ok) throw new Error('Failed to fetch loads');
            const data = await response.json();
            setLoads(data.loads || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLoads();
    }, []);

    // Filter loads based on the active tab and status filter
    const filteredLoads = loads.filter(load => {
        if (activeTab === 'Pickups') {
            return load.status === 'Not Dispatched' || load.status === 'Dispatched';
        } else if (activeTab === 'Loads') {
            if (statusFilter === 'All') return true; // Could default to In-Transit if All is selected, but "All" should probably show all. 
            if (statusFilter === 'In-Transit Default') return load.status === 'In-Transit';
            return load.status === statusFilter;
        } else if (activeTab === 'Invoice Que') {
            return load.status === 'Delivered';
        }
        return true;
    });

    // When switching tabs, reset or set defaults for filters
    const handleTabChange = (tab: BoardTab) => {
        setActiveTab(tab);
        if (tab === 'Loads') {
            setStatusFilter('In-Transit Default');
        } else {
            setStatusFilter('All');
        }
    };

    const handleOpenNewLoad = () => {
        setEditingLoadId(null);
        setIsModalOpen(true);
    };

    const handleEditLoad = (id: string) => {
        setEditingLoadId(id);
        setIsModalOpen(true);
    };

    const renderStatusBadge = (status: string) => {
        let colorClass = 'bg-slate-100 text-slate-700 border-slate-200';
        if (status === 'Not Dispatched' || status === 'Quoting') colorClass = 'bg-slate-100 text-slate-700 border-slate-200';
        else if (status === 'Dispatched') colorClass = 'bg-indigo-50 text-indigo-700 border-indigo-200';
        else if (status === 'In-Transit') colorClass = 'bg-amber-50 text-amber-700 border-amber-200';
        else if (status === 'Delivered') colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        else if (status === 'Invoiced') colorClass = 'bg-blue-50 text-blue-700 border-blue-200';
        else if (status === 'Cancelled') colorClass = 'bg-red-50 text-red-700 border-red-200';

        return (
            <span className={`text-xs px-2.5 py-1 rounded-full border font-medium whitespace-nowrap ${colorClass}`}>
                {status || 'Unknown'}
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center">
            <div className="max-w-7xl w-full">
                <header className="mb-6 flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                            <Truck className="h-8 w-8 text-indigo-600" />
                            Load Board
                        </h1>
                        <p className="text-slate-500 mt-2">Manage and track your active shipments.</p>
                    </div>
                    <button
                        onClick={handleOpenNewLoad}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-4 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
                    >
                        <Plus className="h-4 w-4" />
                        New Load
                    </button>
                </header>

                {error && (
                    <div className="bg-red-50 text-red-600 border border-red-200 p-4 rounded-xl mb-6 shadow-sm">
                        {error}
                    </div>
                )}

                {/* Tabs */}
                <div className="flex space-x-1 border-b border-slate-200 mb-6">
                    {(['Pickups', 'Loads', 'Invoice Que'] as BoardTab[]).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => handleTabChange(tab)}
                            className={`py-3 px-6 font-medium text-sm transition-colors border-b-2 ${activeTab === tab ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50 rounded-t-lg' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                        >
                            <div className="flex items-center gap-2">
                                {tab === 'Pickups' && <Package className="w-4 h-4" />}
                                {tab === 'Loads' && <Truck className="w-4 h-4" />}
                                {tab === 'Invoice Que' && <CheckCircle2 className="w-4 h-4" />}
                                {tab}
                            </div>
                        </button>
                    ))}
                </div>

                <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden min-h-[500px] flex flex-col">
                    <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                        <div className="flex gap-4 items-center">
                            <div className="relative">
                                <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Search load number..."
                                    className="pl-9 pr-4 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64 shadow-sm"
                                />
                            </div>
                            {activeTab === 'Loads' && (
                                <select
                                    value={statusFilter}
                                    onChange={e => setStatusFilter(e.target.value)}
                                    className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm"
                                >
                                    <option value="All">All Statuses</option>
                                    <option value="In-Transit Default">In-Transit</option>
                                    <option value="Not Dispatched">Not Dispatched</option>
                                    <option value="Dispatched">Dispatched</option>
                                    <option value="Delivered">Delivered</option>
                                    <option value="Invoiced">Invoiced</option>
                                    <option value="Cancelled">Cancelled</option>
                                </select>
                            )}
                        </div>
                        <span className="text-xs text-slate-600 font-medium bg-slate-200/50 px-3 py-1.5 rounded-lg border border-slate-200">
                            {filteredLoads.length} Loads
                        </span>
                    </div>

                    <div className="overflow-x-auto flex-1">
                        {loading ? (
                            <div className="flex justify-center items-center h-48">
                                <span className="animate-pulse text-slate-500 font-medium">Loading loads...</span>
                            </div>
                        ) : (
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-500 uppercase bg-slate-50/80 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold">Load Number</th>
                                        <th className="px-6 py-4 font-semibold">Customer</th>
                                        <th className="px-6 py-4 font-semibold">Consignee</th>
                                        <th className="px-6 py-4 font-semibold">Pickup Date</th>
                                        <th className="px-6 py-4 font-semibold">Rate</th>
                                        <th className="px-6 py-4 font-semibold">Status</th>
                                        <th className="px-6 py-4 text-right font-semibold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredLoads.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                                                <div className="flex flex-col items-center justify-center">
                                                    <Truck className="h-10 w-10 text-slate-300 mb-3" />
                                                    <p className="text-base font-medium text-slate-700">No loads found</p>
                                                    <p className="text-sm mt-1">There are no loads matching the current criteria.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredLoads.map((load) => (
                                        <tr key={load.id} className="hover:bg-slate-50/80 transition-colors group">
                                            <td className="px-6 py-4 whitespace-nowrap font-semibold text-slate-900">
                                                {load.load_number}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-slate-700 font-medium">
                                                {load?.customer?.company_name || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                                                {load?.consignee?.name || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                                                {load.pickup_date ? new Date(load.pickup_date).toLocaleDateString() : '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-slate-700 font-medium">
                                                {load.customer_rate ? `$${load.customer_rate.toFixed(2)}` : '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {renderStatusBadge(load.status)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <button
                                                    onClick={() => handleEditLoad(load.id)}
                                                    className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                                                    title="Edit Load"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>

            <LoadEntryModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                loadId={editingLoadId}
                onSaveSuccess={fetchLoads}
            />
        </div>
    );
}
