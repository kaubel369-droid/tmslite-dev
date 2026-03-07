import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
    try {
        const supabase = await createClient();

        // RLS will automatically filter this based on the user's role and assignment
        const { data, error } = await supabase
            .from('sales_leads')
            .select(`
                *,
                assigned_to_profile:profiles!sales_leads_assigned_to_fkey(first_name, last_name)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({ salesLeads: data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const body = await request.json();

        // Ensure we have the user auth info to fetch org_id
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        let org_id = body.org_id;

        if (!org_id) {
            const { data: profiles } = await supabase
                .from('profiles')
                .select('org_id')
                .eq('id', user.id)
                .single();
            if (profiles && profiles.org_id) {
                org_id = profiles.org_id;
            } else {
                return NextResponse.json({ error: 'User does not belong to an organization' }, { status: 400 });
            }
        }

        const { data, error } = await supabase
            .from('sales_leads')
            .insert([{
                org_id,
                company_name: body.company_name,
                primary_contact: body.primary_contact,
                email: body.email,
                phone: body.phone,
                address: body.address,
                city: body.city,
                state: body.state,
                zip: body.zip,
                website: body.website,
                status: body.status || 'New',
                notes: body.notes,
                assigned_to: body.assigned_to
            }])
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ salesLead: data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
