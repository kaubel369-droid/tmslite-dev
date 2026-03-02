import { Truck, MapPin, CheckCircle2, Clock, Package } from 'lucide-react';
import Link from 'next/link';

// Mock Data representing loads pulled from Supabase
const mockLoads = [
    { id: 'LD-1001', carrier: 'Old Dominion', origin: 'Atlanta, GA', dest: 'Dallas, TX', status: 'Dispatched', date: '2023-11-01' },
    { id: 'LD-1002', carrier: 'XPO Logistics', origin: 'Chicago, IL', dest: 'Miami, FL', status: 'In-Transit', date: '2023-11-02' },
    { id: 'LD-1003', carrier: 'Estes Express', origin: 'Seattle, WA', dest: 'Denver, CO', status: 'In-Transit', date: '2023-11-03' },
    { id: 'LD-1004', carrier: 'FedEx Freight', origin: 'Boston, MA', dest: 'New York, NY', status: 'Delivered', date: '2023-10-30' },
    { id: 'LD-1005', carrier: 'Old Dominion', origin: 'Phoenix, AZ', dest: 'Las Vegas, NV', status: 'Invoiced', date: '2023-10-25' },
];

const loadColumns = [
    { title: 'Dispatched', status: 'Dispatched', icon: <Package className="w-5 h-5 text-indigo-500" />, borderColor: 'border-indigo-200', bgColor: 'bg-indigo-50' },
    { title: 'In-Transit', status: 'In-Transit', icon: <Truck className="w-5 h-5 text-amber-500" />, borderColor: 'border-amber-200', bgColor: 'bg-amber-50' },
    { title: 'Delivered', status: 'Delivered', icon: <MapPin className="w-5 h-5 text-emerald-500" />, borderColor: 'border-emerald-200', bgColor: 'bg-emerald-50' },
    { title: 'Invoiced', status: 'Invoiced', icon: <CheckCircle2 className="w-5 h-5 text-slate-500" />, borderColor: 'border-slate-200', bgColor: 'bg-slate-100' },
];

export default function LoadsDashboard() {
    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8 flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Load Board</h1>
                        <p className="text-slate-500 mt-2">Track active shipments and invoice statuses.</p>
                    </div>
                    <Link href="/" className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-indigo-600 font-medium px-4 py-2 rounded-lg text-sm shadow-sm transition-all focus:ring-2 focus:ring-indigo-100">
                        + New Quote
                    </Link>
                </header>

                <div className="flex gap-6 overflow-x-auto pb-4">
                    {loadColumns.map((col) => {
                        const columnLoads = mockLoads.filter(load => load.status === col.status);

                        return (
                            <div key={col.status} className="flex-1 min-w-[300px] bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col h-[calc(100vh-200px)]">
                                {/* Column Header */}
                                <div className={`p-4 border-b border-slate-200 flex items-center justify-between ${col.bgColor}`}>
                                    <div className="flex items-center gap-2 font-semibold text-slate-700">
                                        {col.icon}
                                        {col.title}
                                    </div>
                                    <span className="bg-white text-slate-600 text-xs font-bold px-2.5 py-1 rounded-full border border-slate-200">
                                        {columnLoads.length}
                                    </span>
                                </div>

                                {/* Card List */}
                                <div className="p-4 flex-1 overflow-y-auto space-y-3 bg-slate-50/50">
                                    {columnLoads.map(load => (
                                        <div key={load.id} className={`bg-white border-l-4 ${col.borderColor} border-y border-r border-slate-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer`}>
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="font-bold text-indigo-700 text-sm">{load.id}</span>
                                                <div className="flex items-center gap-1 text-slate-400 text-xs">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {load.date}
                                                </div>
                                            </div>

                                            <div className="font-medium text-slate-800 text-sm mb-3">
                                                {load.carrier}
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                                                <div>
                                                    <span className="block text-[10px] uppercase text-slate-400 font-semibold mb-0.5">Origin</span>
                                                    <span className="truncate block font-medium text-slate-700">{load.origin}</span>
                                                </div>
                                                <div>
                                                    <span className="block text-[10px] uppercase text-slate-400 font-semibold mb-0.5">Destination</span>
                                                    <span className="truncate block font-medium text-slate-700">{load.dest}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {columnLoads.length === 0 && (
                                        <div className="h-full flex items-center justify-center p-6 text-center text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-lg">
                                            No loads in this status.
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
