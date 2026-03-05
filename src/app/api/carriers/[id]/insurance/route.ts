import { NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase';

export async function GET(request: Request, context: any) {
    try {
        const { id } = await context.params;
        const supabase = getServiceRoleClient();

        const { data, error } = await supabase
            .from('carrier_insurance')
            .select('*')
            .eq('carrier_id', id)
            .single();

        if (error && error.code !== 'PGRST116') throw error; // Allow "No rows found"

        return NextResponse.json({ insurance: data || null });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request: Request, context: any) {
    try {
        const { id } = await context.params;
        const body = await request.json();
        const supabase = getServiceRoleClient();

        // 1. Get carrier org_id
        const { data: carrierInfo, error: carrierError } = await supabase
            .from('carriers')
            .select('org_id')
            .eq('id', id)
            .single();

        if (carrierError || !carrierInfo) throw new Error('Carrier not found');

        // 2. Upsert insurance data
        const { data: insuranceData, error: insuranceError } = await supabase
            .from('carrier_insurance')
            .upsert({
                carrier_id: id,
                org_id: carrierInfo.org_id,
                insurance_company: body.insurance_company || null,
                policy_number: body.policy_number || null,
                expiration_date: body.expiration_date || null,
                coverage_amount: body.coverage_amount || null,
                agent: body.agent || null,
                phone: body.phone || null,
                email: body.email || null,
                notes: body.notes || null
            }, { onConflict: 'carrier_id' })
            .select()
            .single();

        if (insuranceError) throw insuranceError;

        // 3. Calculate status and update carriers table
        let status = 'Expired';
        if (body.expiration_date) {
            const expDate = new Date(body.expiration_date);
            const today = new Date();
            // Reset time part of today for accurate date-only comparison
            today.setHours(0, 0, 0, 0);
            if (expDate >= today) {
                status = 'Active';
            }
        }

        const { error: carrierUpdateError } = await supabase
            .from('carriers')
            .update({ insurance_status: status })
            .eq('id', id);

        if (carrierUpdateError) throw carrierUpdateError;

        return NextResponse.json({ insurance: insuranceData, status: status });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
