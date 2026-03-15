import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
    const supabase = getServiceRoleClient();
    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get('orgId');
    const slug = searchParams.get('slug');

    if (!orgId) {
        return NextResponse.json({ error: 'Missing organization ID' }, { status: 400 });
    }

    try {
        let query = supabase.from('document_templates').select('*').eq('org_id', orgId);
        
        if (slug) {
            query = query.eq('slug', slug);
        }

        const { data, error } = await query;
        if (error) throw error;

        return NextResponse.json(slug ? { template: data[0] } : { templates: data });
    } catch (err: unknown) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const supabase = getServiceRoleClient();
    const body = await req.json();
    const { org_id, name, slug, content, type } = body;

    if (!org_id || !name || !slug || !content || !type) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    try {
        const { data, error } = await supabase
            .from('document_templates')
            .upsert({
                org_id,
                name,
                slug,
                content,
                type,
                updated_at: new Date().toISOString()
            }, { onConflict: 'org_id, slug' })
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json({ template: data });
    } catch (err: unknown) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
    }
}
