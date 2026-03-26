import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase';

export async function PATCH(req: NextRequest) {
    const supabase = getServiceRoleClient();
    const { orgId, name } = await req.json();

    if (!orgId || !name) {
        return NextResponse.json({ error: 'Missing organization ID or name' }, { status: 400 });
    }

    try {
        const { error } = await supabase
            .from('organizations')
            .update({ name })
            .eq('id', orgId);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (err: unknown) {
        console.error('Organization update error:', err);
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
    }
}
