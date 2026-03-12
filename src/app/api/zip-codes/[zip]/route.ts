import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(
    request: Request,
    { params }: { params: { zip: string } }
) {
    const zip = params.zip;

    if (!zip || zip.length < 3) {
        return NextResponse.json({ error: 'Invalid zip' }, { status: 400 });
    }

    try {
        const { data, error } = await supabase
            .from('zip_codes')
            .select('city, state_id, state_name')
            .eq('zip', zip);

        if (error) throw error;

        return NextResponse.json({ locations: data || [] });
    } catch (error: any) {
        console.error('Zip lookup error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
