'use client';

import React, { useEffect, useState } from 'react';
import { 
    TrendingUp, 
    DollarSign, 
    Truck, 
    Download, 
    Printer, 
    Loader2, 
    Filter,
    Calendar,
    ChevronDown,
    ChevronUp,
    FileText,
    PieChart as PieChartIcon,
    CheckSquare,
    Square
} from 'lucide-react';
import { 
    AreaChart, 
    Area, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    Legend,
    Cell,
    PieChart,
    Pie
} from 'recharts';
import { format, subDays, parseISO } from 'date-fns';
import * as XLSX from 'xlsx';
import { createClient } from '@/utils/supabase/client';

interface CustomerReportsProps {
    customerId: string;
}

interface LoadProduct {
    pallets: number;
    weight: number;
    description: string;
    nmfc_class: string;
    unit_type: string;
}

interface Load {
    id: string;
    load_number: string;
    status: string;
    pickup_date: string;
    delivery_date: string;
    customer_rate: number;
    carrier_rate: number;
    load_type: string;
    total_weight: string;
    total_pallets: string;
    carrier_pro_number: string;
    bol_number: string;
    carrier?: { name: string };
    shipper?: { city: string; state: string; zip: string };
    consignee?: { city: string; state: string; zip: string };
    load_products?: LoadProduct[];
}

interface RevenueData {
    totalRevenue: number;
    totalCost: number;
    totalMargin: number;
    avgMarginPercent: number;
    dailyData: { date: string, revenue: number, margin: number, count: number }[];
}

interface SummaryData {
    type: string;
    count: number;
    revenue: number;
    margin: number;
}

interface ReportData {
    revenueReport: RevenueData;
    summaryReport: SummaryData[];
    loads: Load[];
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function CustomerReports({ customerId }: CustomerReportsProps) {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<ReportData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [isDetailExpanded, setIsDetailExpanded] = useState(false);
    const [selectedReports, setSelectedReports] = useState({
        revenue: true,
        summary: true,
        detail: true
    });
    const [companyInfo, setCompanyInfo] = useState<{ name: string; logo: string | null }>({ name: '', logo: null });
    const [customerName, setCustomerName] = useState('');

    const toggleReport = (key: keyof typeof selectedReports) => {
        setSelectedReports(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const fetchReports = React.useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/customers/${customerId}/reports?startDate=${startDate}&endDate=${endDate}`);
            if (!res.ok) {
                const errorBody = await res.json();
                throw new Error(errorBody.error || 'Failed to fetch report data');
            }
            const json = await res.json();
            setData(json);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [customerId, startDate, endDate]);

    useEffect(() => {
        const fetchMetadata = async () => {
            const supabase = createClient();
            
            // Fetch Organization & Logo
            const { data: org } = await supabase.from('organizations').select('name').limit(1).single();
            const { data: logoSetting } = await supabase
                .from('settings')
                .select('setting_value')
                .eq('setting_key', 'company_logo')
                .single();
            
            const logoUrl = (logoSetting?.setting_value as any)?.url || null;
            setCompanyInfo({ name: org?.name || 'TMSLite', logo: logoUrl });

            // Fetch Customer Name
            const { data: customer } = await supabase
                .from('customers')
                .select('company_name')
                .eq('id', customerId)
                .single();
            setCustomerName(customer?.company_name || 'Customer');
        };

        const fetchReportData = async () => {
            fetchReports();
        }

        if (customerId) {
            fetchMetadata();
            fetchReportData();
        }
    }, [customerId, fetchReports]);

    const handleExportExcel = () => {
        if (!data || !data.loads) return;

        // 1. Revenue Summary Sheet
        const revenueWS = XLSX.utils.json_to_sheet([
            { 'Total Revenue': data.revenueReport.totalRevenue, 'Total Cost': data.revenueReport.totalCost, 'Total Margin': data.revenueReport.totalMargin, 'Margin %': `${data.revenueReport.avgMarginPercent.toFixed(2)}%` }
        ]);

        // 2. Summary by Type Sheet
        const summaryWS = XLSX.utils.json_to_sheet(data.summaryReport.map((s: SummaryData) => ({
            'Shipment Type': s.type,
            'Load Count': s.count,
            'Revenue': s.revenue,
            'Margin': s.margin
        })));

        // 3. Detailed Loads Sheet
        const detailedData = data.loads.map((l: Load) => ({
            'Load #': l.load_number,
            'Status': l.status,
            'Pickup': l.pickup_date?.split('T')[0],
            'Delivery': l.delivery_date?.split('T')[0],
            'Carrier': l.carrier?.name || 'N/A',
            'Origin': `${l.shipper?.city || ''}, ${l.shipper?.state || ''} ${l.shipper?.zip || ''}`,
            'Destination': `${l.consignee?.city || ''}, ${l.consignee?.state || ''} ${l.consignee?.zip || ''}`,
            'Type': l.load_type,
            'Weight': l.total_weight,
            'Pallets': l.total_pallets,
            'Revenue': l.customer_rate,
            'Cost': l.carrier_rate,
            'Margin': (l.customer_rate || 0) - (l.carrier_rate || 0),
            'Pro #': l.carrier_pro_number,
            'BOL #': l.bol_number
        }));
        const detailWS = XLSX.utils.json_to_sheet(detailedData);

        const wb = XLSX.utils.book_new();
        
        if (selectedReports.revenue) {
            XLSX.utils.book_append_sheet(wb, revenueWS, "Revenue Overview");
        }
        if (selectedReports.summary) {
            XLSX.utils.book_append_sheet(wb, summaryWS, "Loads Summary");
        }
        if (selectedReports.detail) {
            XLSX.utils.book_append_sheet(wb, detailWS, "Detailed Report");
        }

        if (wb.SheetNames.length === 0) {
            alert("Please select at least one report to export.");
            return;
        }

        XLSX.writeFile(wb, `Customer_Report_${customerId}_${startDate}_to_${endDate}.xlsx`);
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading && !data) {
        return (
            <div className="py-20 flex flex-col items-center justify-center text-slate-500">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mb-4" />
                <p className="font-medium">Calculating Logistics Intelligence...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-600 p-6 rounded-xl flex items-center gap-4 my-8">
                <div className="bg-red-100 p-2 rounded-lg">
                    <Filter className="h-6 w-6" />
                </div>
                <div>
                    <h3 className="font-bold">Error loading reports</h3>
                    <p className="text-sm">{error}</p>
                </div>
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="space-y-8 animate-in fade-in duration-500 print:text-black print:bg-white print:p-0">
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    @page { size: auto; margin: 10mm; }
                    
                    /* Reset all containers to allow multi-page printing */
                    html, body, .min-h-screen, .max-w-7xl, .p-8, main, #root, [class*="overflow-"], .flex-1 {
                        height: auto !important;
                        min-height: 0 !important;
                        overflow: visible !important;
                        position: static !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        width: 100% !important;
                        background: white !important;
                        display: block !important;
                    }
                    
                    /* Hide sidebars and dashboard chrome */
                    nav, aside, footer, header, .sidebar, [role="navigation"], .no-print, .print\\:hidden {
                        display: none !important;
                    }

                    /* Ensure report sections allow page breaks */
                    .print-section {
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                        margin-bottom: 3rem !important;
                        display: block !important;
                        width: 100% !important;
                        position: relative !important;
                    }

                    /* Utility for print-only visibility */
                    .print\\:block { display: block !important; }
                }
            ` }} />
            {/* Professional Print Header */}
            <div className="hidden print:block mb-10 border-b-4 border-slate-900 pb-8">
                <div className="flex justify-between items-start">
                    <div>
                        {companyInfo.logo && (
                            <img src={companyInfo.logo} alt="Company Logo" className="h-16 mb-4 object-contain" />
                        )}
                        <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-2">
                            Customer Performance Report
                        </h1>
                        <div className="flex items-center gap-3">
                            <div className="h-6 w-1 bg-indigo-600"></div>
                            <p className="text-2xl font-bold text-slate-700 tracking-tight">
                                {customerName}
                            </p>
                        </div>
                    </div>
                    <div className="text-right flex flex-col items-end">
                        <div className="bg-slate-900 text-white px-4 py-2 mb-4 rounded-sm">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80">Report Period</p>
                            <p className="text-lg font-black tracking-tight italic">
                                {format(startDate, 'MMM d, yyyy')} - {format(endDate, 'MMM d, yyyy')}
                            </p>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-normal">
                            Generated by {companyInfo.name}
                        </p>
                        <p className="text-[10px] text-slate-500 italic">
                            {format(new Date(), 'PPpp')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Global Print Styles to break out of scroll containers */}
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    /* Reset all containers that might have overflow-hidden or layout constraints */
                    html, body, .min-h-screen, .max-w-6xl, .p-6, main, .flex-1, #root {
                        height: auto !important;
                        min-height: 0 !important;
                        overflow: visible !important;
                        position: static !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        width: 100% !important;
                        max-width: none !important;
                        background: white !important;
                        display: block !important;
                    }
                    
                    /* Hide sidebars, navigation, dashboard header, and tabs */
                    nav, aside, footer, .sidebar, [class*="Sidebar"], [role="navigation"],
                    header, [data-slot="tabs-list"], a[href="/customers"], .no-print {
                        display: none !important;
                    }

                    /* Reset specific dashboard layout wrappers */
                    .overflow-y-auto, .overflow-hidden, div {
                        overflow: visible !important;
                        height: auto !important;
                    }

                    /* Ensure charts take up full width but don't break across pages poorly */
                    .recharts-responsive-container {
                        width: 100% !important;
                        height: 350px !important;
                    }

                    .animate-in {
                        animation: none !important;
                    }

                    /* Handle Page Breaks */
                    .print-section {
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                        margin-bottom: 2rem !important;
                        display: block !important;
                    }

                    tr {
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                    }

                    thead {
                        display: table-header-group !important;
                    }

                    /* Utility for print-only visibility */
                    .print\\:block { display: block !important; }
                    .print\\:hidden { display: none !important; }
                }
            ` }} />

            {/* Report Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm print:hidden">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Date Range</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <input 
                            type="date" 
                            value={startDate} 
                            onChange={(e) => setStartDate(e.target.value)}
                            className="text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        />
                        <span className="text-slate-400">to</span>
                        <input 
                            type="date" 
                            value={endDate} 
                            onChange={(e) => setEndDate(e.target.value)}
                            className="text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        />
                    </div>
                    {loading && <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />}
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleExportExcel}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors text-sm font-bold shadow-sm"
                    >
                        <Download className="h-4 w-4" /> Export Excel
                    </button>
                    <button 
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-bold shadow-sm"
                    >
                        <Printer className="h-4 w-4" /> Print Selected
                    </button>
                </div>
            </div>

            {/* Select Reports Controls */}
            <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200 flex flex-wrap items-center gap-6 print:hidden">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mr-2">Select Reports:</span>
                
                <button 
                    onClick={() => toggleReport('revenue')}
                    className="flex items-center gap-2 text-sm font-semibold transition-colors group"
                >
                    {selectedReports.revenue ? <CheckSquare className="h-4 w-4 text-indigo-600" /> : <Square className="h-4 w-4 text-slate-300 group-hover:text-slate-400" />}
                    <span className={selectedReports.revenue ? 'text-slate-900' : 'text-slate-400'}>Revenue Overview</span>
                </button>

                <button 
                    onClick={() => toggleReport('summary')}
                    className="flex items-center gap-2 text-sm font-semibold transition-colors group"
                >
                    {selectedReports.summary ? <CheckSquare className="h-4 w-4 text-indigo-600" /> : <Square className="h-4 w-4 text-slate-300 group-hover:text-slate-400" />}
                    <span className={selectedReports.summary ? 'text-slate-900' : 'text-slate-400'}>Loads Summary</span>
                </button>

                <button 
                    onClick={() => toggleReport('detail')}
                    className="flex items-center gap-2 text-sm font-semibold transition-colors group"
                >
                    {selectedReports.detail ? <CheckSquare className="h-4 w-4 text-indigo-600" /> : <Square className="h-4 w-4 text-slate-300 group-hover:text-slate-400" />}
                    <span className={selectedReports.detail ? 'text-slate-900' : 'text-slate-400'}>Detailed Load Records</span>
                </button>
            </div>

            {/* KPI Overview */}
            {selectedReports.revenue && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print-section">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="bg-indigo-50 p-3 rounded-xl">
                                <DollarSign className="h-6 w-6 text-indigo-600" />
                            </div>
                            <span className="text-slate-500 font-bold text-sm uppercase tracking-wider">Total Revenue</span>
                        </div>
                        <div className="text-3xl font-black text-slate-900">
                            ${data.revenueReport.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <p className="text-slate-400 text-sm mt-1">Gross billing for period</p>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="bg-emerald-50 p-3 rounded-xl">
                                <TrendingUp className="h-6 w-6 text-emerald-600" />
                            </div>
                            <span className="text-slate-500 font-bold text-sm uppercase tracking-wider">Total Margin</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-slate-900">
                                ${data.revenueReport.totalMargin.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            <span className="text-emerald-600 font-bold text-sm">
                                ({data.revenueReport.avgMarginPercent.toFixed(1)}%)
                            </span>
                        </div>
                        <p className="text-slate-400 text-sm mt-1">Profit after carrier costs</p>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="bg-amber-50 p-3 rounded-xl">
                                <Truck className="h-6 w-6 text-amber-600" />
                            </div>
                            <span className="text-slate-500 font-bold text-sm uppercase tracking-wider">Total Loads</span>
                        </div>
                        <div className="text-3xl font-black text-slate-900">
                            {data.loads?.length || 0}
                        </div>
                        <p className="text-slate-400 text-sm mt-1">Completed shipments</p>
                    </div>
                </div>
            )}

            {/* Charts Section */}
            {(selectedReports.revenue || selectedReports.summary) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Revenue Trend */}
                    {selectedReports.revenue && (
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 h-[400px] print-section">
                            <h3 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                                <TrendingUp className="h-5 w-5 text-indigo-600" />
                                Revenue & Margin Trend
                            </h3>
                            <div className="h-[280px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={data.revenueReport.dailyData}>
                                        <defs>
                                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis 
                                            dataKey="date" 
                                            stroke="#94a3b8" 
                                            fontSize={10} 
                                            tickLine={false} 
                                            axisLine={false} 
                                            tickFormatter={(str) => {
                                                const d = parseISO(str);
                                                return format(d, 'MM/dd');
                                            }}
                                        />
                                        <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                            labelFormatter={(label) => format(parseISO(label), 'MMM dd, yyyy')}
                                        />
                                        <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" name="Revenue" />
                                        <Area type="monotone" dataKey="margin" stroke="#10b981" strokeWidth={2} fillOpacity={0} name="Margin" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* Loads Summary by Type */}
                    {selectedReports.summary && (
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 h-[400px] print-section">
                            <h3 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                                <PieChartIcon className="h-5 w-5 text-indigo-600" />
                                Volume by Shipment Type
                            </h3>
                            <div className="h-[280px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={data.summaryReport}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            paddingAngle={5}
                                            dataKey="count"
                                            nameKey="type"
                                        >
                                            {data.summaryReport.map((entry: SummaryData, index: number) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend verticalAlign="bottom" height={36} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Shipment Type Details Table */}
            {selectedReports.summary && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden print-section">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <FileText className="h-4 w-4 text-indigo-600" />
                            Loads Summary by Type
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                    <th className="px-6 py-3">Shipment Type</th>
                                    <th className="px-6 py-3">Load Count</th>
                                    <th className="px-6 py-3">Revenue</th>
                                    <th className="px-6 py-3">Avg Revenue / Load</th>
                                    <th className="px-6 py-3">Total Margin</th>
                                    <th className="px-6 py-3">Margin %</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 italic">
                                {data.summaryReport.map((s: SummaryData, idx: number) => (
                                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-slate-900">{s.type}</td>
                                        <td className="px-6 py-4 text-slate-600 font-medium">{s.count}</td>
                                        <td className="px-6 py-4 text-slate-600 font-medium">${s.revenue.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-slate-600 font-medium">${(s.revenue / s.count).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                        <td className="px-6 py-4 text-emerald-600 font-bold">${s.margin.toLocaleString()}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-xs font-bold">
                                                {((s.margin / (s.revenue || 1)) * 100).toFixed(1)}%
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                <tr className="bg-slate-50 font-black">
                                    <td className="px-6 py-4 text-slate-900">Total</td>
                                    <td className="px-6 py-4 text-slate-900">{data.loads?.length || 0}</td>
                                    <td className="px-6 py-4 text-slate-900">${data.revenueReport.totalRevenue.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-slate-900">${(data.revenueReport.totalRevenue / (data.loads?.length || 1)).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                    <td className="px-6 py-4 text-emerald-600">${data.revenueReport.totalMargin.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-emerald-600">{data.revenueReport.avgMarginPercent.toFixed(1)}%</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Detailed Loads Report Section */}
            {selectedReports.detail && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <button 
                        onClick={() => setIsDetailExpanded(!isDetailExpanded)}
                        className="w-full flex justify-between items-center px-6 py-5 hover:bg-slate-50 transition-colors print:hidden"
                    >
                        <div className="flex items-center gap-3">
                            <div className="bg-slate-100 p-2 rounded-lg">
                                <FileText className="h-5 w-5 text-slate-600" />
                            </div>
                            <div className="text-left">
                                <h3 className="font-bold text-slate-900">Detailed Load Records</h3>
                                <p className="text-xs text-slate-500">View all shipment details and item-level data</p>
                            </div>
                        </div>
                        {isDetailExpanded ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                    </button>
                    
                    <div className={`px-6 py-4 border-b border-slate-100 bg-slate-50/50 hidden print:block`}>
                        <h3 className="font-bold text-slate-800">Detailed Load Records</h3>
                    </div>

                    <div className={`${isDetailExpanded ? 'block' : 'hidden'} print:block`}>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                                        <th className="px-4 py-3">Load #</th>
                                        <th className="px-4 py-3">Date</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3">Carrier / Pro #</th>
                                        <th className="px-4 py-3">Origin / Destination</th>
                                        <th className="px-4 py-3 text-right">Revenue</th>
                                        <th className="px-4 py-3 text-right">Margin</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {data.loads.map((l: Load) => (
                                        <React.Fragment key={l.id}>
                                            <tr className="hover:bg-slate-50/30 font-medium">
                                                <td className="px-4 py-4 text-indigo-600 font-bold">{l.load_number}</td>
                                                <td className="px-4 py-4 text-slate-900 whitespace-nowrap">{l.pickup_date?.split('T')[0]}</td>
                                                <td className="px-4 py-4">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                                        l.status === 'Delivered' || l.status === 'Invoiced' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                                                    }`}>
                                                        {l.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-slate-600">
                                                    <div className="font-bold">{l.carrier?.name || 'Unassigned'}</div>
                                                    <div className="text-[10px] font-medium text-slate-400">{l.carrier_pro_number || 'No PRO#'}</div>
                                                </td>
                                                <td className="px-4 py-4 text-slate-600">
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="text-[10px] uppercase font-bold text-slate-400">From: <span className="text-slate-700">{l.shipper?.city}, {l.shipper?.state}</span></span>
                                                        <span className="text-[10px] uppercase font-bold text-slate-400">To: <span className="text-slate-700">{l.consignee?.city}, {l.consignee?.state}</span></span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-right font-bold text-slate-900">${l.customer_rate?.toLocaleString()}</td>
                                                <td className="px-4 py-4 text-right font-bold text-emerald-600">${((l.customer_rate || 0) - (l.carrier_rate || 0)).toLocaleString()}</td>
                                            </tr>
                                            {/* Nested product details for this load if available */}
                                            {l.load_products && l.load_products.length > 0 && (
                                                <tr className="bg-slate-50/30">
                                                    <td colSpan={7} className="px-12 py-3">
                                                        <div className="border-l-2 border-indigo-200 pl-4 space-y-1">
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Shipment Contents:</span>
                                                            {l.load_products.map((p: LoadProduct, pIdx: number) => (
                                                                <div key={pIdx} className="text-[10px] text-slate-500 flex gap-4">
                                                                    <span className="font-black text-indigo-400">{p.pallets} {p.unit_type}</span>
                                                                    <span className="w-16 font-medium">{p.weight} LBS</span>
                                                                    <span className="flex-1 italic">&quot;{p.description}&quot;</span>
                                                                    {p.nmfc_class && <span className="text-slate-400 font-bold uppercase">Class: {p.nmfc_class}</span>}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Print Only Footer */}
            <div className="hidden print:block mt-20 pt-10 border-t border-slate-200 text-center text-slate-400 text-[10px] uppercase tracking-widest font-bold">
                Generated via TMSLite Intelligence System • {format(new Date(), 'MMM dd, yyyy HH:mm:ss')}
            </div>
        </div>
    );
}
