import { getServiceRoleClient } from '@/lib/supabase'
import PermissionsForm from './permissions-form'

export const dynamic = 'force-dynamic'

export default async function RolePermissionsPage({ params }: { params: { role: string } }) {
    // Await params per Next.js App Router rules
    const awaitedParams = await params;
    const decodedRole = decodeURIComponent(awaitedParams.role)
    const supabase = getServiceRoleClient()

    // 1. Fetch ALL available permissions
    const { data: allPermissions, error: permissionsError } = await supabase
        .from('permissions')
        .select('*')
        .order('name')

    if (permissionsError) {
        return <div className="p-4 text-red-600 font-medium">Error loading permissions data.</div>
    }

    // 2. Fetch assigned permissions for THIS role
    const { data: rolePermissions, error: rolePermsError } = await supabase
        .from('role_permissions')
        .select('permission_id')
        .eq('role', decodedRole)

    if (rolePermsError) {
        return <div className="p-4 text-red-600 font-medium">Error loading assigned role permissions.</div>
    }

    const assignedIds = rolePermissions.map(rp => rp.permission_id)

    return (
        <PermissionsForm 
            roleName={decodedRole} 
            permissions={allPermissions || []} 
            assignedPermissionIds={assignedIds} 
        />
    )
}
