import { NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase';
import { startOfDay, endOfDay, parseISO, subDays, format } from 'date-fns';

interface LoadProduct {
    id: string;
    load_id: string;
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

export const dynamic = 'force-dynamic';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { searchParams } = new URL(request.url);
        const { id } = await params;
        const customerId = id;
        const startDateStr = searchParams.get('startDate');
        const endDateStr = searchParams.get('endDate');
        
        const startDate = startDateStr ? startOfDay(parseISO(startDateStr)) : startOfDay(subDays(new Date(), 30));
        const endDate = endDateStr ? endOfDay(parseISO(endDateStr)) : endOfDay(new Date());

        const startStr = format(startDate, 'yyyy-MM-dd');
        const endStr = format(endDate, 'yyyy-MM-dd');

        console.log(`Fetching reports for customer ${customerId} from ${startStr} to ${endStr}`);

        const supabase = getServiceRoleClient();

        // 1. Fetch loads for this customer in the date range
        const { data: loads, error: loadError } = await supabase
            .from('loads')
            .select(`
                *,
                carrier:carriers(name),
                shipper:shipper_consignees!shipper_id(*),
                consignee:shipper_consignees!consignee_id(*),
                load_products(*)
            `)
            .eq('customer_id', customerId)
            .gte('pickup_date', startStr)
            .lte('pickup_date', endStr)
            .not('status', 'eq', 'Cancelled')
            .order('pickup_date', { ascending: true });

        if (loadError) {
            console.error('Load Error:', loadError);
            throw loadError;
        }

        console.log(`Fetched ${loads?.length || 0} loads`);

        // 2. Process Revenue & Margin Report
        const revenueReport = {
            totalRevenue: 0,
            totalCost: 0,
            totalMargin: 0,
            avgMarginPercent: 0,
            dailyData: [] as any[]
        };

        const dailyMap: Record<string, { date: string, revenue: number, margin: number, count: number }> = {};

        loads?.forEach((load: Load) => {
            const rev = Number(load.customer_rate) || 0;
            const cost = Number(load.carrier_rate) || 0;
            const margin = rev - cost;
            const date = load.pickup_date?.split('T')[0] || 'Unknown';

            revenueReport.totalRevenue += rev;
            revenueReport.totalCost += cost;
            revenueReport.totalMargin += margin;

            if (!dailyMap[date]) {
                dailyMap[date] = { date, revenue: 0, margin: 0, count: 0 };
            }
            dailyMap[date].revenue += rev;
            dailyMap[date].margin += margin;
            dailyMap[date].count += 1;
        });

        revenueReport.dailyData = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));
        revenueReport.avgMarginPercent = revenueReport.totalRevenue > 0 
            ? (revenueReport.totalMargin / revenueReport.totalRevenue) * 100 
            : 0;

        // 3. Process Loads Summary Report (Grouped by Shipment Type)
        const summaryMap: Record<string, { type: string, count: number, revenue: number, margin: number }> = {};

        loads?.forEach((load: Load) => {
            const type = load.load_type || 'LTL';
            const rev = Number(load.customer_rate) || 0;
            const cost = Number(load.carrier_rate) || 0;
            const margin = rev - cost;

            if (!summaryMap[type]) {
                summaryMap[type] = { type, count: 0, revenue: 0, margin: 0 };
            }
            summaryMap[type].count += 1;
            summaryMap[type].revenue += rev;
            summaryMap[type].margin += margin;
        });

        const summaryReport = Object.values(summaryMap);

        // 4. Detailed Load Data already fetched in the 'loads' array

        return NextResponse.json({
            revenueReport,
            summaryReport,
            loads: loads || []
        });

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('Customer Reports API Error:', error);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
