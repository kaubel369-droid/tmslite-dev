import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);
        const sales_lead_id = searchParams.get('sales_lead_id');

        if (!sales_lead_id) {
            return NextResponse.json({ error: 'Missing sales_lead_id parameter' }, { status: 400 });
        }

        const { data: contacts, error } = await supabase
            .from('sales_lead_contacts')
            .select('*')
            .eq('sales_lead_id', sales_lead_id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({ contacts });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const body = await request.json();

        if (!body.sales_lead_id || !body.name) {
            return NextResponse.json({ error: 'sales_lead_id and name are required' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('sales_lead_contacts')
            .insert([body])
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ contact: data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
