import { getServiceRoleClient } from '@/lib/supabase'
import { Plus, Pencil, Trash2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
    const supabase = getServiceRoleClient()

    // Best way to get all users + profiles is to query profiles and join or just list users and cross-reference
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
    const { data: profiles, error: profilesError } = await supabase.from('profiles').select('*')

    if (usersError || profilesError) {
        return <div className="p-4 text-red-600 font-medium">Error loading users.</div>
    }

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

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">User Management</h1>
                <button className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors">
                    <Plus className="h-4 w-4" />
                    Add User
                </button>
            </div>

            <div className="rounded-md border border-slate-200 overflow-hidden bg-white shadow-sm">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                        <tr>
                            <th className="px-6 py-4">Name</th>
                            <th className="px-6 py-4">Email</th>
                            <th className="px-6 py-4">Role</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                        {enrichedUsers.map((user) => (
                            <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 font-medium text-slate-900">
                                    {user.first_name || user.last_name ? `${user.first_name} ${user.last_name}` : 'Unknown'}
                                </td>
                                <td className="px-6 py-4">{user.email}</td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-800 border border-slate-200">
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-100">
                                        Active
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2 text-slate-400">
                                        <button className="hover:text-indigo-600 transition-colors p-1" title="Edit User">
                                            <Pencil className="h-4 w-4" />
                                        </button>
                                        <button className="hover:text-red-600 transition-colors p-1" title="Delete User">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {enrichedUsers.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                    No users found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
