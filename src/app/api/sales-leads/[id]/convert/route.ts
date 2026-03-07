import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const supabase = await createClient();

        // 1. Fetch the existing sales lead
        const { data: lead, error: fetchError } = await supabase
            .from('sales_leads')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError) throw fetchError;
        if (!lead) throw new Error('Sales lead not found');

        if (lead.status === 'Converted') {
            return NextResponse.json({ error: 'Sales lead is already converted', customerId: lead.converted_to_customer_id }, { status: 400 });
        }

        // 2. Insert into customers table
        const { data: customer, error: insertError } = await supabase
            .from('customers')
            .insert([{
                org_id: lead.org_id,
                company_name: lead.company_name,
                primary_contact: lead.primary_contact,
                email: lead.email,
                phone: lead.phone,
                address: lead.address,
                city: lead.city,
                state: lead.state,
                zip: lead.zip,
                website: lead.website,
                status: 'Active',
                notes: lead.notes,
                sales_person_id: lead.assigned_to
            }])
            .select()
            .single();

        if (insertError) throw insertError;

        // 3. Update the sales lead status to Converted and link the customer id
        const { error: updateError } = await supabase
            .from('sales_leads')
            .update({
                status: 'Converted',
                converted_to_customer_id: customer.id
            })
            .eq('id', id);

        if (updateError) throw updateError;

        return NextResponse.json({ customer: customer });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
