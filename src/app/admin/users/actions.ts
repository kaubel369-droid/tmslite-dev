'use server'

import { revalidatePath } from 'next/cache'
import { getServiceRoleClient } from '@/lib/supabase'

export async function submitUserForm(formData: FormData) {
    const supabase = getServiceRoleClient()

    const id = formData.get('id') as string | null
    const email = formData.get('email') as string
    const password = formData.get('password') as string | null // only needed for new or password reset
    const firstName = formData.get('first_name') as string
    const lastName = formData.get('last_name') as string
    const role = formData.get('role') as string
    const orgId = formData.get('org_id') as string // Pass the admin's org_id to the new user

    if (id) {
        // Edit existing user
        const { error: profileError } = await supabase
            .from('profiles')
            .update({
                first_name: firstName,
                last_name: lastName,
                role: role,
            })
            .eq('id', id)

        if (profileError) {
            return { error: 'Failed to update user profile.' }
        }

        if (password) {
            // Optional password update
            const { error: authError } = await supabase.auth.admin.updateUserById(id, {
                password: password
            })
            if (authError) return { error: 'Failed to update user password.' }
        }

    } else {
        // Create new user
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password: password || 'DefaultTempPassword123!', // Require a password for explicitly created users
            email_confirm: true,
        })

        if (authError || !authData.user) {
            if (authError?.message.includes('already exists')) {
                return { error: 'A user with this email already exists.' }
            }
            return { error: 'Failed to create user account.' }
        }

        // Create profile
        const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
                id: authData.user.id,
                org_id: orgId, // Using the same org_id as the admin creating them
                first_name: firstName,
                last_name: lastName,
                role: role
            })

        if (profileError) {
            return { error: 'Failed to create user profile.' }
        }
    }

    revalidatePath('/admin/users')
    return { success: true }
}

export async function deleteUser(id: string) {
    const supabase = getServiceRoleClient()

    // Deleting from auth.users cascades to public.profiles
    const { error } = await supabase.auth.admin.deleteUser(id)

    if (error) {
        return { error: 'Failed to delete user.' }
    }

    revalidatePath('/admin/users')
    return { success: true }
}
