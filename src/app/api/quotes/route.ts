import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const customerId = searchParams.get('customerId');

        if (!customerId) {
            return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
        }

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: quotes, error } = await supabase
            .from('quotes')
            .select('*')
            .eq('customer_id', customerId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching quotes:', error);
            return NextResponse.json({ error: 'Failed to fetch quotes' }, { status: 500 });
        }

        return NextResponse.json({ quotes }, { status: 200 });
    } catch (error) {
        console.error('Error in quotes GET:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            customer_id,
            carrier_id,
            carrier_name,
            scac,
            base_rate,
            fuel_surcharge,
            accessorials_total,
            total_carrier_rate,
            customer_rate,
            transit_days,
            origin_info,
            destination_info,
            items,
            accessorials
        } = body;

        if (!customer_id) {
            return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
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

        const { data: quote, error } = await supabase
            .from('quotes')
            .insert({
                org_id: profile.org_id,
                customer_id,
                carrier_id,
                carrier_name,
                scac,
                base_rate,
                fuel_surcharge,
                accessorials_total,
                total_carrier_rate,
                customer_rate,
                transit_days,
                origin_info,
                destination_info,
                items,
                accessorials,
                created_by: user.id
            })
            .select()
            .single();

        if (error) {
            console.error('Error saving quote:', error);
            return NextResponse.json({ error: 'Failed to save quote' }, { status: 500 });
        }

        return NextResponse.json({ quote }, { status: 201 });
    } catch (error) {
        console.error('Error in quotes POST:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
