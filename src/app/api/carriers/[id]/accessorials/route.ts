import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const awaitedParams = await params;
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get user's org_id
        const { data: profile } = await supabase
            .from('profiles')
            .select('org_id')
            .eq('id', user.id)
            .single();

        if (!profile?.org_id) {
            return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
        }

        // Get all base accessorials for the org
        const { data: baseAccessorials, error: baseError } = await supabase
            .from('accessorials')
            .select('*')
            .eq('org_id', profile.org_id);

        if (baseError) throw baseError;

        // Get carrier specific overrides
        const { data: overrides, error: overridesError } = await supabase
            .from('carrier_accessorials')
            .select('*')
            .eq('carrier_id', awaitedParams.id)
            .eq('org_id', profile.org_id);

        if (overridesError) throw overridesError;

        // Merge them
        const merged = (baseAccessorials || []).map(base => {
            const override = (overrides || []).find(o => o.accessorial_id === base.id);
            if (override) {
                return {
                    ...base,
                    min_charge: override.min_charge,
                    max_charge: override.max_charge,
                    charge_per_pound: override.charge_per_pound,
                    charge_per_piece: override.charge_per_piece,
                    fixed_price: override.fixed_price,
                    is_locked: true,
                    override_id: override.id
                };
            }
            return {
                ...base,
                is_locked: false,
                override_id: null
            };
        });

        // Sort alphabetically by name
        merged.sort((a, b) => a.name.localeCompare(b.name));

        return NextResponse.json({ accessorials: merged });
    } catch (error: any) {
        console.error('Error fetching carrier accessorials:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const awaitedParams = await params;
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

        const data = await request.json();
        const { accessorial_id, min_charge, max_charge, charge_per_pound, charge_per_piece, fixed_price, is_locked } = data;

        if (!is_locked) {
            // Delete override if unlocked
            const { error } = await supabase
                .from('carrier_accessorials')
                .delete()
                .eq('carrier_id', awaitedParams.id)
                .eq('accessorial_id', accessorial_id)
                .eq('org_id', profile?.org_id);
                
            if (error) throw error;
        } else {
            // Upsert override
            const { error } = await supabase
                .from('carrier_accessorials')
                .upsert({
                    carrier_id: awaitedParams.id,
                    accessorial_id,
                    org_id: profile?.org_id,
                    min_charge: min_charge === '' ? null : Number(min_charge),
                    max_charge: max_charge === '' ? null : Number(max_charge),
                    charge_per_pound: charge_per_pound === '' ? null : Number(charge_per_pound),
                    charge_per_piece: charge_per_piece === '' ? null : Number(charge_per_piece),
                    fixed_price: fixed_price === '' ? null : Number(fixed_price)
                }, { onConflict: 'carrier_id,accessorial_id' }); // Requires unique constraint! Which we added.
                
            if (error) throw error;
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error saving carrier accessorial:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
