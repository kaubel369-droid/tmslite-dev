import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('org_id')
            .eq('id', user.id)
            .single();

        if (!profile?.org_id) {
            return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
        }

        const { data, error } = await supabase
            .from('accessorials')
            .select('*')
            .eq('org_id', profile.org_id)
            .order('name');

        if (error) throw error;

        return NextResponse.json({ accessorials: data || [] });
    } catch (error: any) {
        console.error('Error fetching accessorials:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
