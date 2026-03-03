import { getServiceRoleClient } from '@/lib/supabase'
import { Plus, Shield, Pencil, Trash2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminRolesPage() {
    const supabase = getServiceRoleClient()

    // Fetch permissions
    const { data: permissions, error: permissionsError } = await supabase.from('permissions').select('*')

    if (permissionsError) {
        return <div className="p-4 text-red-600 font-medium">Error loading roles & permissions.</div>
    }

    // Pre-defined roles based on Enum
    const roles = ['Admin', 'Supervisor', 'Customer Service Rep', 'Sales Rep', 'Customer']

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Roles & Permissions</h1>
                    <p className="text-sm text-slate-500 mt-1">Manage system roles and their granted access levels.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {roles.map((role) => (
                    <div key={role} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col hover:border-indigo-300 transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center justify-center p-2 bg-indigo-50 rounded-lg text-indigo-600">
                                <Shield className="h-5 w-5" />
                            </div>
                            <div className="flex gap-2">
                                <button className="text-slate-400 hover:text-indigo-600" title="Edit Role">
                                    <Pencil className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">{role}</h3>
                        <p className="text-sm text-slate-500 mt-1 flex-1">
                            System role defining baseline access for users assigned to this group.
                        </p>
                        <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                            <span className="text-xs font-medium text-slate-500">Configured</span>
                            <button className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
                                Manage Permissions &rarr;
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
