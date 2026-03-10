import { NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase';

export async function GET(request: Request, context: any) {
    try {
        const { id } = await context.params;
        const supabase = getServiceRoleClient();

        const { data, error } = await supabase
            .from('documents')
            .select('*')
            .eq('load_id', id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Generate signed URLs for the files
        const documents = await Promise.all(data.map(async (doc) => {
            const { data: urlData, error: urlError } = await supabase
                .storage
                .from('load-documents')
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
        const isPrivate = formData.get('is_private') === 'true';
        const docType = (formData.get('type') as string) || 'Rate_Con';

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const supabase = getServiceRoleClient();

        // 1. Get load org_id first
        const { data: loadInfo, error: loadError } = await supabase
            .from('loads')
            .select('org_id')
            .eq('id', id)
            .single();

        if (loadError || !loadInfo) throw new Error('Load not found');

        // 2. Generate a unique file path
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `${loadInfo.org_id}/${id}/${fileName}`;

        // 3. Upload to storage
        const { data: storageData, error: storageError } = await supabase
            .storage
            .from('load-documents')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (storageError) throw storageError;

        // 4. Save metadata to database
        const { data: docData, error: docError } = await supabase
            .from('documents')
            .insert([{
                load_id: id,
                org_id: loadInfo.org_id,
                file_name: file.name,
                file_path: filePath,
                type: docType,
                is_private: isPrivate
            }])
            .select()
            .single();

        if (docError) {
            // Rollback storage if db fails
            await supabase.storage.from('load-documents').remove([filePath]);
            throw docError;
        }

        return NextResponse.json({ document: docData });
    } catch (error: any) {
        console.error("Document Upload Error:", error);
        return NextResponse.json({ error: error.message || 'Unknown error occurred' }, { status: 500 });
    }
}
