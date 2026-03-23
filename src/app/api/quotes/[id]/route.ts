import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json({ error: 'Quote ID is required' }, { status: 400 });
        }

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: quote, error } = await supabase
            .from('quotes')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching quote:', error);
            return NextResponse.json({ error: 'Failed to fetch quote' }, { status: 500 });
        }

        if (!quote) {
            return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
        }

        // Resolve accessorial names if they exist as IDs
        if (quote.accessorials && Array.isArray(quote.accessorials) && quote.accessorials.length > 0) {
            const { data: names, error: namesError } = await supabase
                .from('accessorials')
                .select('id, name')
                .in('id', quote.accessorials);
            
            if (!namesError && names) {
                const nameMap = Object.fromEntries(names.map(n => [n.id, n.name]));
                quote.accessorials = quote.accessorials.map((id: string) => nameMap[id] || id);
            }
        }

        return NextResponse.json({ quote }, { status: 200 });
    } catch (error) {
        console.error('Error in quote detail GET:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
