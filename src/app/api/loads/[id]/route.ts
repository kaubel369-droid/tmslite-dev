import { NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const routeParams = await params;
        const supabase = getServiceRoleClient();
        const { data, error } = await supabase
            .from('loads')
            .select(`
                id, 
                org_id, 
                customer_id, 
                load_number, 
                status, 
                origin_zip, 
                destination_zip, 
                total_weight, 
                nmfc_class, 
                total_pallets, 
                customer_rate, 
                carrier_rate, 
                fuel_surcharge, 
                carrier_quote_id, 
                carrier_pro_number, 
                selected_carrier_id, 
                pickup_date, 
                delivery_date, 
                created_at, 
                updated_at, 
                shipper_id, 
                consignee_id, 
                bol_number,
                internal_notes,
                bol_notes,
                tracing_notes,
                load_type,
                mileage,
                shipper:shipper_consignees!shipper_id(*), 
                consignee:shipper_consignees!consignee_id(*),
                load_products!load_id(*)
            `)
            .eq('id', routeParams.id)
            .single();

        if (error) throw error;

        return NextResponse.json({ load: data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const routeParams = await params;
        const supabase = getServiceRoleClient();
        const body = await request.json();

        // Whitelist of valid columns for the 'loads' table
        const LOAD_COLUMNS = [
            'customer_id', 'status', 'origin_zip', 'destination_zip',
            'total_weight', 'nmfc_class', 'total_pallets', 'customer_rate',
            'carrier_rate', 'fuel_surcharge', 'carrier_quote_id',
            'carrier_pro_number', 'selected_carrier_id', 'pickup_date',
            'delivery_date', 'shipper_id', 'consignee_id', 'bol_number',
            'internal_notes', 'bol_notes', 'tracing_notes', 'load_type', 'mileage'
        ];

        // Filter body to only include whitelisted columns
        const updateData: any = {};
        for (const col of LOAD_COLUMNS) {
            if (col in body) {
                // Sanitize empty strings to null
                updateData[col] = body[col] === '' ? null : body[col];
            }
        }

        // Perform the update
        const { data, error } = await supabase
            .from('loads')
            .update(updateData)
            .eq('id', routeParams.id)
            .select()
            .single();

        if (error) {
            console.error('Update load error:', error);
            throw error;
        }

        // 2. Update product lines if provided
        if (body.products && Array.isArray(body.products)) {
            // Delete existing products for this load
            const { error: delError } = await supabase
                .from('load_products')
                .delete()
                .eq('load_id', routeParams.id);

            if (delError) {
                console.error("Error deleting old products:", delError);
            }

            // Map and filter new products
            const productsToInsert = body.products
                .filter((p: any) => p.description || p.pallets || p.weight)
                .map((p: any) => ({
                    load_id: routeParams.id,
                    pallets: parseInt(p.pallets) || 0,
                    weight: parseFloat(p.weight) || 0,
                    description: p.description || '',
                    nmfc_class: p.nmfc || null
                }));

            if (productsToInsert.length > 0) {
                const { error: prodError } = await supabase
                    .from('load_products')
                    .insert(productsToInsert);
                if (prodError) {
                    console.error("Error inserting products:", prodError);
                    // We don't throw here to allow the main load update to succeed
                }
            }
        }

        return NextResponse.json({ load: data });
    } catch (error: any) {
        console.error('API Error in PUT /api/loads/[id]:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const routeParams = await params;
        const supabase = getServiceRoleClient();
        const { error } = await supabase.from('loads').delete().eq('id', routeParams.id);
        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
