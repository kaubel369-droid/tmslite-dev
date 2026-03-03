import { getServiceRoleClient } from '@/lib/supabase'
import UserGrid from './user-grid'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
    const supabase = getServiceRoleClient()

    const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
    const { data: profiles, error: profilesError } = await supabase.from('profiles').select('*')

    if (usersError || profilesError) {
        return <div className="p-4 text-red-600 font-medium">Error loading users.</div>
    }

    // Get current admin user's org to assign to new users
    const { data: adminAuth } = await supabase.auth.getUser()
    const currentAdminProfile = profiles.find(p => p.id === adminAuth?.user?.id);
    const currentOrgId = currentAdminProfile?.org_id;

    const enrichedUsers = users.users.map(u => {
        const profile = profiles.find(p => p.id === u.id)
        return {
            id: u.id,
            email: u.email,
            created_at: u.created_at,
            first_name: profile?.first_name || '',
            last_name: profile?.last_name || '',
            role: profile?.role || 'Customer',
        }
    })

    return <UserGrid initialUsers={enrichedUsers} currentOrgId={currentOrgId} />
}
