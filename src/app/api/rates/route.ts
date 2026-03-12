import { NextResponse } from 'next/server';
import { ShipmentData } from '@/lib/carriers/interfaces';
import { CarrierRatingService } from '@/lib/carriers/normalization';
import { ODFLStrategy } from '@/lib/carriers/odfl';
import { XPOStrategy } from '@/lib/carriers/xpo';
import { createClient } from '@/utils/supabase/server';

// In a real application, you'd fetch these credentials dynamically from Supabase
// using the getServiceRoleClient() and decrypt them using decrypt_api_key() based on the user's org.
const mockODFLCredentials = {
    api_client_id: process.env.ODFL_CLIENT_ID || 'mock_odfl_id',
    api_client_secret: process.env.ODFL_SECRET || 'mock_odfl_secret',
    account_number: '123456789'
};

const mockXPOCredentials = {
    api_key: process.env.XPO_API_KEY || 'mock_xpo_key',
    account_number: '987654321'
};

export async function POST(request: Request) {
    try {
        // 1. Parse and validate the incoming shipment data from the frontend
        const body = await request.json();
        const shipment: ShipmentData = body.shipment;
        const customerId = body.customerId;
        const carrierId = body.carrierId;

        if (!shipment || !shipment.origin || !shipment.destination || !shipment.items) {
            return NextResponse.json({ error: 'Invalid shipment payload' }, { status: 400 });
        }

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get user's org
        const { data: profile } = await supabase
            .from('profiles')
            .select('org_id')
            .eq('id', user.id)
            .single();

        if (!profile?.org_id) {
            return NextResponse.json({ error: 'Org not found' }, { status: 404 });
        }

        // 2. Initialize the ranking service
        const ratingService = new CarrierRatingService();

        // 3. Register our dynamic strategies
        // In a real app, you'd fetch credentials for these from the DB
        ratingService.registerCarrier(new ODFLStrategy(mockODFLCredentials));
        ratingService.registerCarrier(new XPOStrategy(mockXPOCredentials));

        // 4. Fetch the normalized rates
        let rates = await ratingService.getAggregatedRates(shipment);

        // 5. Fetch carrier configs and mapping
        let carrierConfigs = { default_margin: 15, carriers: {} as any };
        if (customerId) {
            const { data: customer } = await supabase
                .from('customers')
                .select('carrier_configs')
                .eq('id', customerId)
                .single();
            if (customer?.carrier_configs) {
                carrierConfigs = customer.carrier_configs;
            }
        }

        const { data: carriers } = await supabase
            .from('carriers')
            .select('id, scac')
            .eq('api_enabled', true);
        
        const scacToId = (carriers || []).reduce((acc: any, c: any) => {
            if (c.scac) acc[c.scac] = c.id;
            return acc;
        }, {});

        // 6. Filter by blacklisted and calculate margins
        const filteredRates = rates.filter(rate => {
            const carrierId = scacToId[rate.scac];
            if (carrierId && carrierConfigs.carriers[carrierId]?.blacklisted) {
                return false;
            }
            return true;
        });

        const quotesWithMargin = filteredRates.map(quote => {
            const carrierId = scacToId[quote.scac];
            const carrierConfig = carrierId ? carrierConfigs.carriers[carrierId] : null;
            const marginPercent = (carrierConfig?.margin !== undefined && carrierConfig?.margin !== "") 
                ? carrierConfig.margin 
                : carrierConfigs.default_margin;
            
            const marginMultiplier = 1 + (marginPercent / 100);
            const customer_total_rate = parseFloat((quote.totalCost * marginMultiplier).toFixed(2));

            return {
                ...quote,
                carrier_id: carrierId || null,
                customer_total_rate
            };
        });

        // Log results to rate_quotes table
        if (quotesWithMargin.length > 0) {
            const quotesToInsert = quotesWithMargin.map(q => ({
                org_id: profile.org_id,
                carrier_id: q.carrier_id,
                base_rate: q.details?.baseRate || q.totalCost * 0.8,
                total_rate: q.totalCost,
                customer_total_rate: q.customer_total_rate,
                transit_days: q.transitDays,
                quote_id: q.quoteId,
                raw_response: q,
                created_at: new Date().toISOString()
            }));

            await supabase.from('rate_quotes').insert(quotesToInsert);
        }

        return NextResponse.json({ quotes: quotesWithMargin.map(q => ({
            ...q,
            customerCost: q.customer_total_rate
        })) }, { status: 200 });
    } catch (error) {
        console.error('Error fetching rates:', error);
        return NextResponse.json({ error: 'Failed to retrieve rates' }, { status: 500 });
    }
}
