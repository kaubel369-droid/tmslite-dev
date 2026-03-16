import { NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase';

// Mock function for SAFER API check
async function checkSaferAPI(dotNumber?: string, mcNumber?: string): Promise<boolean> {
    // In a real implementation, this would make an HTTP request to the FMCSA SAFER API
    // e.g., fetch(`https://api.safer.fmcsa.dot.gov/...`)
    // For now, if a number is provided, we simulate a successful find (true).
    if (dotNumber && dotNumber.trim() !== '') return true;
    if (mcNumber && mcNumber.trim() !== '') return true;
    return false; // If neither text is found/valid, return false
}

export async function GET(request: Request, context: any) {
    try {
        const { id } = await context.params;
        const supabase = getServiceRoleClient();

        const { data, error } = await supabase
            .from('carriers')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        return NextResponse.json({ carrier: data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request: Request, context: any) {
    try {
        const { id } = await context.params;
        const body = await request.json();
        const supabase = getServiceRoleClient();

        let finalStatus = body.status || 'Active';

        // Check DOT / MC numbers against SAFER API logic
        if (body.dot_number || body.mc_number) {
            const isFound = await checkSaferAPI(body.dot_number, body.mc_number);
            if (!isFound) {
                finalStatus = 'Inactive';
            } else {
                finalStatus = 'Active';
            }
        }

        const { data, error } = await supabase
            .from('carriers')
            .update({
                name: body.company_name,
                phone: body.phone,
                address: body.address,
                city: body.city,
                state: body.state,
                zip: body.zip,
                status: finalStatus,
                website: body.website,
                dot_number: body.dot_number,
                ein: body.ein,
                mc_number: body.mc_number,
                scac: body.scac,
                insurance_status: body.insurance_status,
                safety_rating: body.safety_rating,
                last_safety_check: body.last_safety_check,
                notes: body.notes,
                api_key: body.api_key,
                api_secret: body.api_secret,
                api_url: body.api_url,
                api_account_number: body.api_account_number,
                api_username: body.api_username,
                api_password: body.api_password,
                api_enabled: body.api_enabled
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ carrier: data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request, context: any) {
    try {
        const { id } = await context.params;
        const supabase = getServiceRoleClient();

        const { error } = await supabase
            .from('carriers')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
