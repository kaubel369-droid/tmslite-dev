import { NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const supabase = getServiceRoleClient();

        const { data, error } = await supabase
            .from('shipper_consignees')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

        return NextResponse.json({ shipper_consignee: data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const supabase = getServiceRoleClient();
        const body = await request.json();

        const { data, error } = await supabase
            .from('shipper_consignees')
            .update({
                name: body.name,
                address: body.address,
                city: body.city,
                state: body.state,
                zip: body.zip,
                phone: body.phone,
                email: body.email,
                website: body.website,
                status: body.status,
                notes: body.notes
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ shipper_consignee: data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const supabase = getServiceRoleClient();

        const { error } = await supabase
            .from('shipper_consignees')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
