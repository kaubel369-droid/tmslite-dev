import { NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const supabase = getServiceRoleClient();
        
        // 1. Get Active Loads Count
        const { count: activeLoadsCount, error: activeLoadsError } = await supabase
            .from('loads')
            .select('*', { count: 'exact', head: true })
            .in('status', ['Not Dispatched', 'Dispatched', 'In-Transit']);

        // 2. Get New Loads Count (Today)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const { count: newLoadsCount, error: newLoadsError } = await supabase
            .from('loads')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', today.toISOString());

        // 3. Get Active Customers Count
        const { count: customersCount, error: customersError } = await supabase
            .from('customers')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'Active');

        // 4. Calculate Monthly Revenue (sum of customer_rate for current month)
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const { data: revenueData, error: revenueError } = await supabase
            .from('loads')
            .select('customer_rate')
            .gte('created_at', firstDayOfMonth.toISOString())
            .not('status', 'eq', 'Cancelled');

        const monthlyRevenue = revenueData?.reduce((sum, load) => sum + (Number(load.customer_rate) || 0), 0) || 0;

        // 5. Fetch Recent Shipments (Top 5)
        const { data: recentShipments, error: shipmentsError } = await supabase
            .from('loads')
            .select(`
                id, 
                load_number, 
                origin_zip, 
                destination_zip, 
                status,
                customer:customers(company_name)
            `)
            .order('created_at', { ascending: false })
            .limit(5);

        // 6. Fetch Recent Activity (Combining latest loads and customers)
        // We'll just fetch latest 5 loads and latest 5 leads as "activity" for now
        const { data: latestLoads } = await supabase
            .from('loads')
            .select('id, load_number, created_at, status')
            .order('created_at', { ascending: false })
            .limit(3);

        const { data: latestCustomers } = await supabase
            .from('customers')
            .select('id, company_name, created_at')
            .order('created_at', { ascending: false })
            .limit(2);

        const activityLog = [
            ...(latestLoads || []).map(l => ({
                id: `load-${l.id}`,
                type: 'load',
                title: `Load #${l.load_number} Created`,
                time: l.created_at,
                status: l.status
            })),
            ...(latestCustomers || []).map(c => ({
                id: `customer-${c.id}`,
                type: 'customer',
                title: `New Customer: ${c.company_name}`,
                time: c.created_at,
                status: 'Active'
            }))
        ];

        // 7. Fetch Compliance Alerts (Unsatisfactory ratings or expiring insurance)
        const { data: complianceIssues } = await supabase
            .from('carriers')
            .select('id, name, safety_rating')
            .eq('safety_rating', 'Unsatisfactory')
            .limit(3);

        if (complianceIssues) {
            complianceIssues.forEach(issue => {
                activityLog.push({
                    id: `compliance-${issue.id}`,
                    type: 'alert',
                    title: `Compliance Alert: ${issue.name}`,
                    time: new Date().toISOString(),
                    status: 'Alert'
                });
            });
        }

        activityLog.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

        return NextResponse.json({
            stats: {
                activeLoads: activeLoadsCount || 0,
                newLoads: newLoadsCount || 0,
                activeCustomers: customersCount || 0,
                monthlyRevenue: monthlyRevenue
            },
            recentShipments: recentShipments || [],
            activityLog: activityLog
        });

    } catch (error: any) {
        console.error('Dashboard Stats API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
