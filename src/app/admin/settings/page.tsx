import { getServiceRoleClient } from '@/lib/supabase'
import { Mail, Save } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminSettingsPage() {
    const supabase = getServiceRoleClient()

    const { data: orgs } = await supabase.from('organizations').select('id').limit(1).single()
    const orgId = orgs?.id

    let emailSettings = { host: '', port: '', user: '', password: '', from: '' }
    if (orgId) {
        const { data: dbSettings } = await supabase
            .from('settings')
            .select('setting_value')
            .eq('org_id', orgId)
            .eq('setting_key', 'email_server')
            .single()

        if (dbSettings?.setting_value) {
            emailSettings = dbSettings.setting_value as typeof emailSettings
        }
    }

    // Next steps: Add a Server Action to handle the form submission

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        <Mail className="h-6 w-6 text-indigo-600" />
                        Email Server Settings
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">Configure the SMTP server used for outbound system emails.</p>
                </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <form className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none text-slate-700" htmlFor="host">
                                SMTP Host
                            </label>
                            <input
                                className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                                name="host"
                                placeholder="smtp.example.com"
                                defaultValue={emailSettings.host}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none text-slate-700" htmlFor="port">
                                SMTP Port
                            </label>
                            <input
                                className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                                name="port"
                                placeholder="587"
                                type="number"
                                defaultValue={emailSettings.port}
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none text-slate-700" htmlFor="user">
                                SMTP Username
                            </label>
                            <input
                                className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                                name="user"
                                placeholder="apikey"
                                defaultValue={emailSettings.user}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none text-slate-700" htmlFor="password">
                                SMTP Password
                            </label>
                            <input
                                className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                                name="password"
                                type="password"
                                placeholder="••••••••"
                                defaultValue={emailSettings.password}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2 pt-2">
                        <label className="text-sm font-medium leading-none text-slate-700" htmlFor="from">
                            From Email Address
                        </label>
                        <input
                            className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                            name="from"
                            type="email"
                            placeholder="noreply@tmslite.com"
                            defaultValue={emailSettings.from}
                            required
                        />
                    </div>

                    <div className="pt-6 flex justify-end">
                        <button
                            type="submit"
                            className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
                        >
                            <Save className="h-4 w-4" />
                            Save Settings
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
