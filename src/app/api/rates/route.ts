import { NextResponse } from 'next/server';
import { ShipmentData } from '@/lib/carriers/interfaces';
import { CarrierRatingService } from '@/lib/carriers/normalization';
import { ODFLStrategy } from '@/lib/carriers/odfl';
import { XPOStrategy } from '@/lib/carriers/xpo';

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

        if (!shipment || !shipment.origin || !shipment.destination || !shipment.items) {
            return NextResponse.json({ error: 'Invalid shipment payload' }, { status: 400 });
        }

        // 2. Initialize the ranking service
        const ratingService = new CarrierRatingService();

        // 3. Register our dynamic strategies (configured via org DB eventually)
        ratingService.registerCarrier(new ODFLStrategy(mockODFLCredentials));
        ratingService.registerCarrier(new XPOStrategy(mockXPOCredentials));

        // 4. Fetch the normalized rates concurrently
        const rates = await ratingService.getAggregatedRates(shipment);

        // 5. Apply any hardcoded or configurable brokerage margin here (e.g. 15% markup)
        const quotesWithMargin = rates.map(quote => ({
            ...quote,
            customerCost: parseFloat((quote.totalCost * 1.15).toFixed(2)) // 15% broker markup
        }));

        return NextResponse.json({ quotes: quotesWithMargin }, { status: 200 });
    } catch (error) {
        console.error('Error fetching rates:', error);
        return NextResponse.json({ error: 'Failed to retrieve rates' }, { status: 500 });
    }
}
