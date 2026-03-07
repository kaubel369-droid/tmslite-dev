import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const salesLeadId = searchParams.get('sales_lead_id');

        if (!salesLeadId) {
            return NextResponse.json({ error: 'Sales Lead ID is required' }, { status: 400 });
        }

        const supabase = await createClient();

        const { data, error } = await supabase
            .from('sales_lead_activities')
            .select('*')
            .eq('sales_lead_id', salesLeadId)
            .order('activity_date', { ascending: false });

        if (error) throw error;

        return NextResponse.json({ activities: data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('sales_lead_activities')
            .insert({
                sales_lead_id: body.sales_lead_id,
                activity_date: body.activity_date,
                activity_type: body.activity_type,
                description: body.description,
                notes: body.notes
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ activity: data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
