import { NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const supabase = getServiceRoleClient();
        
        // 1. Weekly Volume & Margin (Last 8 weeks)
        const eightWeeksAgo = new Date();
        eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);
        
        const { data: loadData, error: loadError } = await supabase
            .from('loads')
            .select('created_at, customer_rate, carrier_rate')
            .gte('created_at', eightWeeksAgo.toISOString())
            .not('status', 'eq', 'Cancelled');

        if (loadError) throw loadError;

        // Group by week
        const weeklyData: Record<string, { week: string, volume: number, revenue: number, cost: number, margin: number }> = {};
        
        // Initialize weeks
        for (let i = 7; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - (i * 7));
            // Get start of week (Sunday)
            const startOfWeek = new Date(d);
            startOfWeek.setDate(d.getDate() - d.getDay());
            const weekKey = startOfWeek.toISOString().split('T')[0];
            weeklyData[weekKey] = { week: weekKey, volume: 0, revenue: 0, cost: 0, margin: 0 };
        }

        loadData?.forEach(load => {
            const d = new Date(load.created_at);
            const startOfWeek = new Date(d);
            startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
            const weekKey = startOfWeek.toISOString().split('T')[0];
            
            if (weeklyData[weekKey]) {
                const rev = Number(load.customer_rate) || 0;
                const cost = Number(load.carrier_rate) || 0;
                weeklyData[weekKey].volume += 1;
                weeklyData[weekKey].revenue += rev;
                weeklyData[weekKey].cost += cost;
                weeklyData[weekKey].margin += (rev - cost);
            }
        });

        const weeklyChart = Object.values(weeklyData).sort((a, b) => a.week.localeCompare(b.week));

        // 2. Lead Conversion (Sales Leads)
        const { data: leadData, error: leadError } = await supabase
            .from('sales_leads')
            .select('status');

        if (leadError) throw leadError;

        const leadStats: Record<string, number> = {
            'New': 0,
            'Contacted': 0,
            'Qualified': 0,
            'Lost': 0,
            'Converted': 0
        };

        leadData?.forEach(lead => {
            leadStats[lead.status] = (leadStats[lead.status] || 0) + 1;
        });

        const leadChart = Object.entries(leadStats).map(([name, value]) => ({ name, value }));

        return NextResponse.json({
            weeklyChart,
            leadChart
        });

    } catch (error: any) {
        console.error('Reports API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
