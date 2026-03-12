import { createClient } from '@/utils/supabase/server'
import AccessorialsGrid from './accessorials-grid'

export const dynamic = 'force-dynamic'

export default async function AdminAccessorialsPage() {
    const supabase = await createClient()

    // Get the current user to find their organization
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return <div className="p-4 text-red-600 font-medium">Not authenticated.</div>
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('id', user.id)
        .single()

    const currentOrgId = profile?.org_id

    // Fetch accessorials for the user's organization
    const { data: accessorials, error } = await supabase
        .from('accessorials')
        .select('*')
        .order('name')

    if (error) {
        return <div className="p-4 text-red-600 font-medium">Error loading accessorials: {error.message}</div>
    }

    return <AccessorialsGrid initialAccessorials={accessorials || []} currentOrgId={currentOrgId} />
}
