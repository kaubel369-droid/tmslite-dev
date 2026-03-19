'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
    TrendingUp, 
    Users, 
    Briefcase, 
    DollarSign, 
    ArrowUpRight, 
    ArrowDownRight,
    Loader2,
    ShieldAlert,
    Printer,
    Download,
    CheckSquare,
    Square,
    Calendar,
    FileText
} from 'lucide-react';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import { cn } from '@/lib/utils';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function ReportsPage() {
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);
    const [data, setData] = useState<any>(null);
    const [selectedReports, setSelectedReports] = useState({
        trends: true,
        pipeline: true,
        revenue: true
    });
    const [companyInfo, setCompanyInfo] = useState({ name: '', logo: '' });
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const checkAuthAndFetch = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            if (profile?.role !== 'Admin' && profile?.role !== 'Supervisor') {
                setAuthorized(false);
                setLoading(false);
                return;
            }

            setAuthorized(true);
            
            try {
                const res = await fetch('/api/admin/reports');
                const json = await res.json();
                setData(json);

                // Fetch Company Metadata
                const { data: settings } = await supabase
                    .from('organization_settings')
                    .select('company_name, logo_url')
                    .single();
                
                if (settings) {
                    setCompanyInfo({
                        name: settings.company_name || 'TMSLite Logistics',
                        logo: settings.logo_url || ''
                    });
                }
            } catch (err) {
                console.error('Failed to fetch report data', err);
            } finally {
                setLoading(false);
            }
        };

        checkAuthAndFetch();
    }, []);

    const handlePrint = () => {
        window.print();
    };

    const handleExportExcel = () => {
        if (!data) return;

        const wb = XLSX.utils.book_new();

        if (selectedReports.trends || selectedReports.revenue) {
            const trendData = data.weeklyChart.map((w: any) => ({
                'Week Starting': w.week,
                'Volume': w.volume,
                'Gross Revenue': w.revenue,
                'Carrier Cost': w.cost,
                'Net Margin': w.margin,
                'Margin %': ((w.margin / (w.revenue || 1)) * 100).toFixed(1) + '%'
            }));
            const wsTrends = XLSX.utils.json_to_sheet(trendData);
            XLSX.utils.book_append_sheet(wb, wsTrends, 'Financial Trends');
        }

        if (selectedReports.pipeline) {
            const pipelineData = data.leadChart.map((l: any) => ({
                'Pipeline Status': l.name,
                'Count': l.value
            }));
            const wsPipeline = XLSX.utils.json_to_sheet(pipelineData);
            XLSX.utils.book_append_sheet(wb, wsPipeline, 'Sales Pipeline');
        }

        XLSX.writeFile(wb, `Admin_Intelligence_Report_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    };

    const toggleReport = (report: keyof typeof selectedReports) => {
        setSelectedReports(prev => ({ ...prev, [report]: !prev[report] }));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
                    <p className="text-slate-600 font-medium text-lg">Generating Intelligence...</p>
                </div>
            </div>
        );
    }

    if (!authorized) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-slate-200 text-center">
                    <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShieldAlert className="h-8 w-8 text-red-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Restricted Access</h1>
                    <p className="text-slate-600 mb-8">This dashboard is only available to Admin and Supervisor roles. Please contact your administrator if you believe this is an error.</p>
                    <button 
                        onClick={() => router.push('/')}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg"
                    >
                        Return to Workspace
                    </button>
                </div>
            </div>
        );
    }

    const latestWeek = data?.weeklyChart[data.weeklyChart.length - 1];
    const prevWeek = data?.weeklyChart[data.weeklyChart.length - 2];
    
    const marginIncrease = latestWeek && prevWeek ? ((latestWeek.margin - prevWeek.margin) / prevWeek.margin * 100).toFixed(1) : '0';
    const isMarginUp = Number(marginIncrease) >= 0;

    return (
        <div className="min-h-screen bg-slate-50 p-8 pt-6">
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    @page { size: auto; margin: 10mm; }
                    
                    /* Reset all containers */
                    html, body, .min-h-screen, .max-w-7xl, .p-8, main, #root {
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

                    /* Handle Page Breaks */
                    .print-section {
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                        margin-bottom: 2rem !important;
                        display: block !important;
                    }

                    /* Utility for print-only visibility */
                    .print\\:block { display: block !important; }
                }
            ` }} />

            <div className="max-w-7xl mx-auto space-y-8">
                {/* Professional Print Header */}
                <div className="hidden print:block border-b-4 border-slate-900 pb-6 mb-8">
                    <div className="flex justify-between items-start">
                        <div className="flex gap-4 items-center">
                            {companyInfo.logo ? (
                                <img src={companyInfo.logo} alt="Logo" className="h-16 w-auto object-contain" />
                            ) : (
                                <div className="h-16 w-16 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-2xl">
                                    TMS
                                </div>
                            )}
                            <div>
                                <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
                                    {companyInfo.name}
                                </h1>
                                <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-0.5">
                                    Business Intelligence Report
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Report Generated</div>
                            <div className="text-sm font-bold text-slate-900">{format(new Date(), 'MMMM dd, yyyy')}</div>
                            <div className="text-xs text-slate-500">{format(new Date(), 'pp')}</div>
                        </div>
                    </div>
                </div>

                {/* Main Header & Controls */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 print:hidden">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Business Intelligence</h1>
                        <p className="text-slate-500 text-lg font-medium">Strategic overview of your logistics network and sales performance.</p>
                    </div>
                    
                    <div className="flex flex-col items-end gap-3">
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
                </div>

                {/* Select Reports Controls */}
                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200 flex flex-wrap items-center gap-6 print:hidden">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mr-2 flex items-center gap-2">
                        <FileText className="h-3 w-3" /> Select Reports:
                    </span>
                    
                    <button onClick={() => toggleReport('trends')} className="flex items-center gap-2 text-sm font-semibold group transition-all">
                        {selectedReports.trends ? <CheckSquare className="h-4 w-4 text-indigo-600" /> : <Square className="h-4 w-4 text-slate-300 group-hover:text-slate-400" />}
                        <span className={selectedReports.trends ? 'text-slate-900' : 'text-slate-400'}>Trends</span>
                    </button>

                    <button onClick={() => toggleReport('pipeline')} className="flex items-center gap-2 text-sm font-semibold group transition-all">
                        {selectedReports.pipeline ? <CheckSquare className="h-4 w-4 text-indigo-600" /> : <Square className="h-4 w-4 text-slate-300 group-hover:text-slate-400" />}
                        <span className={selectedReports.pipeline ? 'text-slate-900' : 'text-slate-400'}>Sales Pipeline</span>
                    </button>

                    <button onClick={() => toggleReport('revenue')} className="flex items-center gap-2 text-sm font-semibold group transition-all">
                        {selectedReports.revenue ? <CheckSquare className="h-4 w-4 text-indigo-600" /> : <Square className="h-4 w-4 text-slate-300 group-hover:text-slate-400" />}
                        <span className={selectedReports.revenue ? 'text-slate-900' : 'text-slate-400'}>Revenue vs Cost</span>
                    </button>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 print-section">
                    <div className="bg-white p-6 rounded-22xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="bg-indigo-50 p-3 rounded-xl">
                                <DollarSign className="h-6 w-6 text-indigo-600" />
                            </div>
                            <span className="text-slate-500 font-bold text-sm uppercase tracking-wider">Total Margin</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-slate-900">${latestWeek?.margin.toLocaleString()}</span>
                            <span className={`flex items-center text-sm font-bold ${isMarginUp ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {isMarginUp ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                                {Math.abs(Number(marginIncrease))}%
                            </span>
                        </div>
                        <p className="text-slate-400 text-sm mt-1">v.s. last week</p>
                    </div>

                    <div className="bg-white p-6 rounded-22xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="bg-emerald-50 p-3 rounded-xl">
                                <TrendingUp className="h-6 w-6 text-emerald-600" />
                            </div>
                            <span className="text-slate-500 font-bold text-sm uppercase tracking-wider">Weekly Volume</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-slate-900">{latestWeek?.volume}</span>
                            <span className="text-slate-400 text-sm font-medium">Shipments</span>
                        </div>
                        <p className="text-slate-400 text-sm mt-1">Current period</p>
                    </div>

                    <div className="bg-white p-6 rounded-22xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="bg-amber-50 p-3 rounded-xl">
                                <Users className="h-6 w-6 text-amber-600" />
                            </div>
                            <span className="text-slate-500 font-bold text-sm uppercase tracking-wider">Leads Active</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-slate-900">{data?.leadChart.reduce((a: any, b: any) => a + (b.name !== 'Converted' ? b.value : 0), 0)}</span>
                            <span className="text-slate-400 text-sm font-medium">Prospects</span>
                        </div>
                        <p className="text-slate-400 text-sm mt-1">Awaiting follow-up</p>
                    </div>

                    <div className="bg-white p-6 rounded-22xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="bg-indigo-50 p-3 rounded-xl">
                                <Briefcase className="h-6 w-6 text-indigo-600" />
                            </div>
                            <span className="text-slate-500 font-bold text-sm uppercase tracking-wider">Conversion Rate</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-slate-900">
                                {((data?.leadChart.find((l: any) => l.name === 'Converted')?.value || 0) / (data?.leadChart.reduce((a: any, b: any) => a + b.value, 0) || 1) * 100).toFixed(0)}%
                            </span>
                        </div>
                        <p className="text-slate-400 text-sm mt-1">Lead to Customer</p>
                    </div>
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Volume & Margin Trends */}
                    {selectedReports.trends && (
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 print-section">
                        <h3 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                            <TrendingUp className="h-5 w-5 text-indigo-600" />
                            Volume & Margin Trends
                        </h3>
                        <div className="h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data?.weeklyChart}>
                                    <defs>
                                        <linearGradient id="colorMargin" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="week" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val/1000}k`} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                        labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                                    />
                                    <Area type="monotone" dataKey="margin" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorMargin)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    )}
 
                    {/* Lead Conversion Pipeline */}
                    {selectedReports.pipeline && (
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 print-section">
                        <h3 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                            <Users className="h-5 w-5 text-indigo-600" />
                            Sales Pipeline Distribution
                        </h3>
                        <div className="h-80 w-full flex items-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data?.leadChart}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={80}
                                        outerRadius={110}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {data?.leadChart.map((entry: any, index: any) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend verticalAlign="bottom" height={36}/>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    )}
 
                    {/* Weekly Revenue vs Cost */}
                    {selectedReports.revenue && (
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 lg:col-span-2 print-section">
                        <h3 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                            <DollarSign className="h-5 w-5 text-indigo-600" />
                            Revenue vs Operating Cost
                        </h3>
                        <div className="h-96 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data?.weeklyChart}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="week" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val/1000}k`} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                    />
                                    <Legend verticalAlign="top" align="right" height={36} />
                                    <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} name="Gross Revenue" />
                                    <Bar dataKey="cost" fill="#e2e8f0" radius={[4, 4, 0, 0]} name="Carrier Cost" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    )}
                </div>
            </div>
        </div>
    );
}
