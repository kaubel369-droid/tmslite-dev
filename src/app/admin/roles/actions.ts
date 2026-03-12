'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateRolePermissions(role: string, permissionIds: string[]) {
    const supabase = await createClient()

    // First delete existing permissions for this role
    const { error: deleteError } = await supabase
        .from('role_permissions')
        .delete()
        .eq('role', role)

    if (deleteError) {
        return { error: deleteError.message }
    }

    // Then insert the new ones
    if (permissionIds.length > 0) {
        const inserts = permissionIds.map(permissionId => ({
            role: role,
            permission_id: permissionId
        }))

        const { error: insertError } = await supabase
            .from('role_permissions')
            .insert(inserts)

        if (insertError) {
            return { error: insertError.message }
        }
    }

    revalidatePath(`/admin/roles/${encodeURIComponent(role)}`)
    return { success: true }
}
