import { NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase';

export async function GET(request: Request, context: any) {
    try {
        const { id } = await context.params;
        const supabase = getServiceRoleClient();

        const { data: users, error } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, role, email')
            .eq('customer_id', id);

        if (error) throw error;

        return NextResponse.json({ users });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request, context: any) {
    try {
        const { id } = await context.params;
        const { profileId } = await request.json();
        const supabase = getServiceRoleClient();

        const { data, error } = await supabase
            .from('profiles')
            .update({ customer_id: id })
            .eq('id', profileId)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ profile: data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request, context: any) {
    // Unlink user from customer
    try {
        const { id } = await context.params;
        const { searchParams } = new URL(request.url);
        const profileId = searchParams.get('profileId');
        
        if (!profileId) return NextResponse.json({ error: 'Missing profileId' }, { status: 400 });

        const supabase = getServiceRoleClient();

        const { error } = await supabase
            .from('profiles')
            .update({ customer_id: null })
            .eq('id', profileId)
            .eq('customer_id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
