import { getServiceRoleClient } from '@/lib/supabase'
import RolesGrid from './roles-grid'

export const dynamic = 'force-dynamic'

export default async function AdminRolesPage() {
    const supabase = getServiceRoleClient()

    // Fetch permissions
    const { data: permissions, error: permissionsError } = await supabase.from('permissions').select('*')

    if (permissionsError) {
        return <div className="p-4 text-red-600 font-medium">Error loading roles & permissions.</div>
    }

    // Pre-defined roles based on Enum
    const roles = ['Admin', 'Supervisor', 'Customer Service Rep', 'Sales Rep', 'Sales Rep/Customer Service Rep', 'Customer']

    return <RolesGrid roles={roles} />
}
