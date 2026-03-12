'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createAccessorial(data: any) {
    const supabase = await createClient()

    const { data: insertedData, error } = await supabase
        .from('accessorials')
        .insert(data)
        .select()
        .single()

    if (error) return { error: error.message }

    revalidatePath('/admin/accessorials')
    return { data: insertedData }
}

export async function updateAccessorial(id: string, data: any) {
    const supabase = await createClient()

    const { data: updatedData, error } = await supabase
        .from('accessorials')
        .update(data)
        .eq('id', id)
        .select()
        .single()

    if (error) return { error: error.message }

    revalidatePath('/admin/accessorials')
    return { data: updatedData }
}

export async function deleteAccessorial(id: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('accessorials')
        .delete()
        .eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/admin/accessorials')
    return { success: true }
}
