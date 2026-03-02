import { NextResponse } from 'next/server';
import { ShipmentData } from '@/lib/carriers/interfaces';
import { ODFLStrategy } from '@/lib/carriers/odfl';
import { XPOStrategy } from '@/lib/carriers/xpo';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { shipment, quoteId, scac }: { shipment: ShipmentData, quoteId: string, scac: string } = body;

        if (!shipment || !quoteId || !scac) {
            return NextResponse.json({ error: 'Missing required booking parameters' }, { status: 400 });
        }

        let result;

        // Route the booking request to the appropriate carrier module
        if (scac === 'ODFL') {
            const carrier = new ODFLStrategy({ account_number: '123' });
            result = await carrier.createBooking(shipment, quoteId);
        } else if (scac === 'CNWY') { // commonly used for XPO LTL
            const carrier = new XPOStrategy({ account_number: '987' });
            result = await carrier.createBooking(shipment, quoteId);
        } else {
            return NextResponse.json({ error: 'Unsupported SCAC code' }, { status: 400 });
        }

        if (!result.success) {
            return NextResponse.json({ error: 'Booking failed with carrier' }, { status: 502 });
        }

        // Output would realistically include saving `result.bolUrl` and `result.proNumber` to Supabase
        return NextResponse.json({ booking: result }, { status: 200 });
    } catch (error) {
        console.error('Error processing booking:', error);
        return NextResponse.json({ error: 'Failed to process booking' }, { status: 500 });
    }
}
