import { NextResponse } from 'next/server';
import { calculateMileage } from '../../../../lib/distance';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const origin = searchParams.get('origin');
    const destination = searchParams.get('destination');

    if (!origin || !destination) {
        return NextResponse.json({ error: 'Origin and destination are required' }, { status: 400 });
    }

    try {
        const mileage = await calculateMileage(origin, destination);
        return NextResponse.json({ mileage });
    } catch (error) {
        console.error('API Mileage calculation error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
