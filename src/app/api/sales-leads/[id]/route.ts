import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('sales_leads')
            .select(`
                *,
                assigned_to_profile:profiles!sales_leads_assigned_to_fkey(first_name, last_name)
            `)
            .eq('id', id)
            .single();

        if (error) throw error;

        return NextResponse.json({ salesLead: data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const supabase = await createClient();
        const body = await request.json();

        const { data, error } = await supabase
            .from('sales_leads')
            .update({
                company_name: body.company_name,
                primary_contact: body.primary_contact,
                email: body.email,
                phone: body.phone,
                address: body.address,
                city: body.city,
                state: body.state,
                zip: body.zip,
                website: body.website,
                status: body.status,
                notes: body.notes,
                assigned_to: body.assigned_to,
                converted_to_customer_id: body.converted_to_customer_id
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ salesLead: data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const supabase = await createClient();

        const { error } = await supabase
            .from('sales_leads')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
