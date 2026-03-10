import { NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase';

export async function DELETE(request: Request, context: any) {
    try {
        const { id, documentId } = await context.params;
        const supabase = getServiceRoleClient();

        // 1. Get document info first to delete from storage
        const { data: doc, error: fetchError } = await supabase
            .from('documents')
            .select('file_path')
            .eq('id', documentId)
            .eq('load_id', id)
            .single();

        if (fetchError || !doc) throw new Error('Document not found');

        // 2. Delete from storage
        const { error: storageError } = await supabase
            .storage
            .from('load-documents')
            .remove([doc.file_path]);

        if (storageError) throw storageError;

        // 3. Delete from database
        const { error: deleteError } = await supabase
            .from('documents')
            .delete()
            .eq('id', documentId);

        if (deleteError) throw deleteError;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
