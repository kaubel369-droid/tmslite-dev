import { NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase';

export async function GET(request: Request, context: any) {
    try {
        const { id } = await context.params;
        const supabase = getServiceRoleClient();

        const { data, error } = await supabase
            .from('carrier_documents')
            .select('*')
            .eq('carrier_id', id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Also generate signed URls for the files
        const documents = await Promise.all(data.map(async (doc) => {
            const { data: urlData, error: urlError } = await supabase
                .storage
                .from('carrier-documents')
                .createSignedUrl(doc.file_path, 3600); // 1 hour expiry

            return {
                ...doc,
                url: urlError ? null : urlData.signedUrl
            };
        }));

        return NextResponse.json({ documents });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request, context: any) {
    try {
        const { id } = await context.params;
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const supabase = getServiceRoleClient();

        // Generate a unique file path: carrier_id/timestamp_filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `${id}/${fileName}`;

        // Upload to storage
        const { data: storageData, error: storageError } = await supabase
            .storage
            .from('carrier-documents')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (storageError) throw storageError;

        // Get carrier org_id
        const { data: carrierInfo, error: carrierError } = await supabase
            .from('carriers')
            .select('org_id')
            .eq('id', id)
            .single();

        if (carrierError || !carrierInfo) {
            // Rollback storage if carrier not found
            await supabase.storage.from('carrier-documents').remove([filePath]);
            throw new Error('Carrier not found');
        }

        // Save metadata to database
        const { data: docData, error: docError } = await supabase
            .from('carrier_documents')
            .insert([{
                carrier_id: id,
                org_id: carrierInfo.org_id,
                file_name: file.name,
                file_path: filePath,
                // uploaded_by would require user authcontext, skipping for now
            }])
            .select()
            .single();

        if (docError) {
            // Rollback storage if db fails
            await supabase.storage.from('carrier-documents').remove([filePath]);
            throw docError;
        }

        return NextResponse.json({ document: docData });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
