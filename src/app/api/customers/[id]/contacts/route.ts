import { NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase';

export async function GET(request: Request, context: any) {
    try {
        const { id } = await context.params;
        const supabase = getServiceRoleClient();

        const { data, error } = await supabase
            .from('customer_contacts')
            .select('*')
            .eq('customer_id', id)
            .order('created_at', { ascending: true });

        if (error) throw error;

        return NextResponse.json({ contacts: data || [] });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request, context: any) {
    try {
        const { id } = await context.params;
        const body = await request.json();
        const supabase = getServiceRoleClient();

        // Check if limit of 10 is reached
        const { count, error: countError } = await supabase
            .from('customer_contacts')
            .select('*', { count: 'exact', head: true })
            .eq('customer_id', id);

        if (countError) throw countError;
        if (count && count >= 10) {
            return NextResponse.json({ error: 'Maximum of 10 contacts allowed per customer' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('customer_contacts')
            .insert([{
                customer_id: id,
                name: body.name,
                phone: body.phone,
                cell_phone: body.cell_phone,
                email: body.email,
                position: body.position,
                notes: body.notes
            }])
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ contact: data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
