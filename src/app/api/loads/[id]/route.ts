import { NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const routeParams = await params;
        const supabase = getServiceRoleClient();
        const { data, error } = await supabase
            .from('loads')
            .select('*')
            .eq('id', routeParams.id)
            .single();

        if (error) throw error;

        return NextResponse.json({ load: data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const routeParams = await params;
        const supabase = getServiceRoleClient();
        const body = await request.json();

        // Remove un-updateable fields like id, org_id, created_at, etc from body to avoid errors
        const { id, org_id, created_at, customer, shipper, consignee, ...updateData } = body;

        // Perform the update
        const { data, error } = await supabase
            .from('loads')
            .update(updateData)
            .eq('id', routeParams.id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ load: data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const routeParams = await params;
        const supabase = getServiceRoleClient();
        const { error } = await supabase.from('loads').delete().eq('id', routeParams.id);
        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
