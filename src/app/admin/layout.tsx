import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { LayoutDashboard, Users, UserCog, Settings } from 'lucide-react'

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect('/login')
    }

    // Double check admin role
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'Admin') {
        redirect('/')
    }

    return (
        <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
            {/* Admin Sidebar */}
            <aside className="w-64 border-r border-slate-200 bg-slate-50 flex flex-col hidden md:flex">
                <div className="p-4 border-b border-slate-200">
                    <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                        <LayoutDashboard className="h-5 w-5 text-indigo-600" />
                        Admin Settings
                    </h2>
                </div>
                <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                    <Link href="/admin/users" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 hover:text-slate-900 transition-colors">
                        <Users className="h-4 w-4" />
                        Users
                    </Link>
                    <Link href="/admin/roles" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 hover:text-slate-900 transition-colors">
                        <UserCog className="h-4 w-4" />
                        Roles & Permissions
                    </Link>
                    <Link href="/admin/accessorials" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 hover:text-slate-900 transition-colors">
                        <Settings className="h-4 w-4" />
                        Accessorials
                    </Link>
                    <Link href="/admin/settings" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 hover:text-slate-900 transition-colors">
                        <Settings className="h-4 w-4" />
                        Email Options
                    </Link>
                </nav>
            </aside>

            {/* Admin Content Area */}
            <main className="flex-1 overflow-y-auto bg-white p-8">
                {children}
            </main>
        </div>
    )
}
