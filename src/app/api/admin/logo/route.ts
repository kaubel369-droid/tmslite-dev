import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
    const supabase = getServiceRoleClient();
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const orgId = formData.get('orgId') as string;

    if (!file || !orgId) {
        return NextResponse.json({ error: 'Missing file or organization ID' }, { status: 400 });
    }

    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `logo-${orgId}.${fileExt}`;
        const filePath = `${orgId}/${fileName}`;

        // Upload to Supabase Storage (bucket: logos)
        const { error: uploadError } = await supabase.storage
            .from('logos')
            .upload(filePath, file, {
                upsert: true,
                contentType: file.type
            });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('logos')
            .getPublicUrl(filePath);

        // Update settings table
        const { error: settingsError } = await supabase
            .from('settings')
            .upsert({
                org_id: orgId,
                setting_key: 'company_logo',
                setting_value: { url: publicUrl, path: filePath },
                updated_at: new Date().toISOString()
            }, { onConflict: 'org_id, setting_key' });

        if (settingsError) throw settingsError;

        return NextResponse.json({ url: publicUrl });
    } catch (err: unknown) {
        console.error('Logo upload error:', err);
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const supabase = getServiceRoleClient();
    const { orgId } = await req.json();

    if (!orgId) {
        return NextResponse.json({ error: 'Missing organization ID' }, { status: 400 });
    }

    try {
        // Get current logo path
        const { data: settings } = await supabase
            .from('settings')
            .select('setting_value')
            .eq('org_id', orgId)
            .eq('setting_key', 'company_logo')
            .single();

        const filePath = (settings?.setting_value as { path?: string })?.path;

        if (filePath) {
            await supabase.storage.from('logos').remove([filePath]);
        }

        // Remove from settings
        await supabase
            .from('settings')
            .delete()
            .eq('org_id', orgId)
            .eq('setting_key', 'company_logo');

        return NextResponse.json({ success: true });
    } catch (err: unknown) {
        console.error('Logo delete error:', err);
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
    }
}
