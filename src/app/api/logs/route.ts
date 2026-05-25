import { NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const supabase = getServiceRoleClient();
        
        // Fetch up to 50 recent loads
        const { data: loads } = await supabase
            .from('loads')
            .select('id, load_number, created_at, status')
            .order('created_at', { ascending: false })
            .limit(50);

        // Fetch up to 50 recent customers
        const { data: customers } = await supabase
            .from('customers')
            .select('id, company_name, created_at')
            .order('created_at', { ascending: false })
            .limit(50);

        // Fetch up to 50 recent spot quotes
        const { data: spotQuotes } = await supabase
            .from('customer_spot_quotes')
            .select('id, quote_number, created_at')
            .is('carrier_id', null)
            .order('created_at', { ascending: false })
            .limit(50);

        // Fetch carriers with compliance issues
        const { data: complianceIssues } = await supabase
            .from('carriers')
            .select('id, name, safety_rating')
            .eq('safety_rating', 'Unsatisfactory')
            .limit(50);

        const activityLog = [
            ...(loads || []).map((l: any) => ({
                id: `load-${l.id}`,
                type: 'load',
                title: `Load #${l.load_number} Created`,
                time: l.created_at,
                status: l.status
            })),
            ...(customers || []).map((c: any) => ({
                id: `customer-${c.id}`,
                type: 'customer',
                title: `New Customer: ${c.company_name}`,
                time: c.created_at,
                status: 'Active'
            })),
            ...(spotQuotes || []).map((q: any) => ({
                id: `spot-${q.id}`,
                type: 'spot-quote',
                title: `NEW Spot Quote: #${q.quote_number}`,
                time: q.created_at,
                status: 'Pending'
            }))
        ];

        if (complianceIssues) {
            complianceIssues.forEach((issue: any) => {
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
            activityLog: activityLog
        });

    } catch (error: any) {
        console.error('Logs API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
