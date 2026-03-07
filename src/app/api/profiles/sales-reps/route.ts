import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
    try {
        const supabase = await createClient();

        // RLS will ensure we only get profiles within the user's organization.
        const { data, error } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, role')
            .in('role', ['Sales Rep', 'Sales Rep/Customer Service Rep'])
            .order('first_name', { ascending: true })
            .order('last_name', { ascending: true });

        if (error) throw error;

        return NextResponse.json({ salesReps: data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
