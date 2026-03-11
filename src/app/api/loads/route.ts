import { NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const supabase = getServiceRoleClient();

        // Fetch loads with related customer, shipper, and consignee names
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
                customer:customers(company_name),
                shipper:shipper_consignees!shipper_id(name),
                consignee:shipper_consignees!consignee_id(name)
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching loads:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ loads: data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const supabase = getServiceRoleClient();
        const body = await request.json();

        // Need an org_id
        let org_id = body.org_id;
        if (!org_id) {
            const { data: orgs } = await supabase.from('organizations').select('id').limit(1);
            if (orgs && orgs.length > 0) {
                org_id = orgs[0].id;
            } else {
                throw new Error("No organization found. Please create one.");
            }
        }

        // Whitelist of valid columns for the 'loads' table
        const LOAD_COLUMNS = [
            'customer_id', 'status', 'origin_zip', 'destination_zip',
            'total_weight', 'nmfc_class', 'total_pallets', 'customer_rate',
            'carrier_rate', 'fuel_surcharge', 'carrier_quote_id',
            'carrier_pro_number', 'selected_carrier_id', 'pickup_date',
            'delivery_date', 'shipper_id', 'consignee_id', 'bol_number',
            'internal_notes', 'bol_notes', 'tracing_notes', 'load_type', 'mileage'
        ];

        // Filter and map fields for insertion
        const insertData: any = { org_id };
        for (const col of LOAD_COLUMNS) {
            if (col in body) {
                insertData[col] = body[col] === '' ? null : body[col];
            }
        }

        // Auto-calculate totals from products if they exist
        if (body.products && Array.isArray(body.products)) {
            const totalPallets = body.products.reduce((sum: number, p: any) => sum + (parseInt(p.pallets) || 0), 0);
            const totalWeight = body.products.reduce((sum: number, p: any) => sum + (parseFloat(p.weight) || 0), 0);
            
            insertData.total_pallets = totalPallets > 0 ? totalPallets.toString() : null;
            insertData.total_weight = totalWeight > 0 ? totalWeight.toString() : null;
        }

        // 1. Insert Load
        const { data: loadData, error: loadError } = await supabase
            .from('loads')
            .insert([insertData])
            .select()
            .single();

        if (loadError) {
            console.error('Insert load error:', loadError);
            throw loadError;
        }

        // 2. Insert Products if they exist
        if (body.products && Array.isArray(body.products)) {
            const productsToInsert = body.products
                .filter((p: any) => p.description || p.pallets || p.weight)
                .map((p: any) => ({
                    load_id: loadData.id,
                    pallets: parseInt(p.pallets) || 0,
                    weight: parseFloat(p.weight) || 0,
                    description: p.description || '',
                    nmfc_class: p.nmfc || null,
                    unit_type: p.unit_type || 'PLT'
                }));

            if (productsToInsert.length > 0) {
                const { error: prodError } = await supabase
                    .from('load_products')
                    .insert(productsToInsert);
                if (prodError) {
                    console.error("Error inserting products:", prodError);
                    // We don't throw here to allow the main load entry to succeed
                }
            }
        }

        return NextResponse.json({ load: loadData });
    } catch (error: any) {
        console.error('API Error in POST /api/loads:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
