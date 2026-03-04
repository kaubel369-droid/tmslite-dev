import { NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase';
import { createClient } from '@/utils/supabase/server';

export async function DELETE(request: Request, context: any) {
    try {
        const { id, documentId } = await context.params;

        // 1. Verify User Role
        const authClient = await createClient();
        const { data: { user }, error: authError } = await authClient.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = getServiceRoleClient();

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'Admin' && profile?.role !== 'Supervisor') {
            return NextResponse.json({ error: 'Forbidden: Requires Admin or Supervisor role to delete documents' }, { status: 403 });
        }

        // 2. Get the document metadata to find the file_path
        const { data: doc, error: docError } = await supabase
            .from('carrier_documents')
            .select('file_path')
            .eq('id', documentId)
            .eq('carrier_id', id)
            .single();

        if (docError) throw docError;
        if (!doc) {
            return NextResponse.json({ error: 'Document not found' }, { status: 404 });
        }

        // 2. Delete from Supabase Storage
        const { error: storageError } = await supabase
            .storage
            .from('carrier-documents')
            .remove([doc.file_path]);

        if (storageError) throw storageError;

        // 3. Delete metadata from Database
        const { error: dbError } = await supabase
            .from('carrier_documents')
            .delete()
            .eq('id', documentId)
            .eq('carrier_id', id);

        if (dbError) throw dbError;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
