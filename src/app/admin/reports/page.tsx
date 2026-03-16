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
    ShieldAlert
} from 'lucide-react';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function ReportsPage() {
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);
    const [data, setData] = useState<any>(null);
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
            } catch (err) {
                console.error('Failed to fetch report data', err);
            } finally {
                setLoading(false);
            }
        };

        checkAuthAndFetch();
    }, []);

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
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-10">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Business Intelligence</h1>
                    <p className="text-slate-500 text-lg font-medium">Strategic overview of your logistics network and sales performance.</p>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
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
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
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

                    {/* Lead Conversion Pipeline */}
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
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

                    {/* Weekly Revenue vs Cost */}
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 lg:col-span-2">
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
                </div>
            </div>
        </div>
    );
}
