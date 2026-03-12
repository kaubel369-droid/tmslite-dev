'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import { updateRolePermissions } from '../actions'

type Permission = {
    id: string
    name: string
    description: string
}

type PermissionsFormProps = {
    roleName: string
    permissions: Permission[]
    assignedPermissionIds: string[]
}

export default function PermissionsForm({ roleName, permissions, assignedPermissionIds }: PermissionsFormProps) {
    const router = useRouter()
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(assignedPermissionIds))
    const [isSaving, setIsSaving] = useState(false)
    const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)

    const handleToggle = (id: string) => {
        const next = new Set(selectedIds)
        if (next.has(id)) {
            next.delete(id)
        } else {
            next.add(id)
        }
        setSelectedIds(next)
    }

    const handleSave = async () => {
        setIsSaving(true)
        setMessage(null)
        
        const result = await updateRolePermissions(roleName, Array.from(selectedIds))
        
        setIsSaving(false)
        if (result.error) {
            setMessage({ type: 'error', text: result.error })
        } else {
            setMessage({ type: 'success', text: 'Permissions successfully updated.' })
            router.refresh()
            // Auto-hide success message
            setTimeout(() => setMessage(null), 3000)
        }
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto py-8">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/admin/roles" className="p-2 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors text-slate-500 hover:text-indigo-600">
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                        Manage Permissions: <span className="text-indigo-600 font-extrabold">{roleName}</span>
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">Configure exactly what the {roleName} role is allowed to access.</p>
                </div>
            </div>

            {message && (
                <div className={`p-4 rounded-md mb-6 ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                    {message.text}
                </div>
            )}

            <div className="bg-white rounded-xl shadow border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-slate-800">Assigned Capabilities</h2>
                    <span className="text-sm text-slate-500 font-medium bg-slate-200 px-3 py-1 rounded-full">
                        {selectedIds.size} of {permissions.length} active
                    </span>
                </div>
                
                <div className="divide-y divide-slate-100">
                    {permissions.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">
                            No system permissions have been defined yet.
                        </div>
                    ) : (
                        permissions.map(permission => (
                            <label 
                                key={permission.id} 
                                className={`flex items-start gap-4 p-5 cursor-pointer transition-colors ${selectedIds.has(permission.id) ? 'bg-indigo-50/30 hover:bg-indigo-50/50' : 'hover:bg-slate-50'}`}
                            >
                                <div className="pt-1">
                                    <input 
                                        type="checkbox"
                                        className="h-5 w-5 rounded text-indigo-600 border-slate-300 focus:ring-indigo-600"
                                        checked={selectedIds.has(permission.id)}
                                        onChange={() => handleToggle(permission.id)}
                                    />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-base font-semibold text-slate-900">{permission.name}</h3>
                                    <p className="text-sm text-slate-500 mt-1">{permission.description || 'No description provided.'}</p>
                                </div>
                            </label>
                        ))
                    )}
                </div>
                
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                        <Save className="h-4 w-4" />
                        {isSaving ? 'Saving Changes...' : 'Save Permissions'}
                    </button>
                </div>
            </div>
        </div>
    )
}
