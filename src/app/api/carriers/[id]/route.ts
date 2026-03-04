import { NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase';

export async function GET(request: Request, context: any) {
    try {
        const { id } = await context.params;
        const supabase = getServiceRoleClient();

        const { data, error } = await supabase
            .from('carriers')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        return NextResponse.json({ carrier: data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request: Request, context: any) {
    try {
        const { id } = await context.params;
        const body = await request.json();
        const supabase = getServiceRoleClient();

        const { data, error } = await supabase
            .from('carriers')
            .update({
                name: body.company_name,
                phone: body.phone,
                address: body.address,
                city: body.city,
                state: body.state,
                zip: body.zip,
                status: body.status
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ carrier: data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request, context: any) {
    try {
        const { id } = await context.params;
        const supabase = getServiceRoleClient();

        const { error } = await supabase
            .from('carriers')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
