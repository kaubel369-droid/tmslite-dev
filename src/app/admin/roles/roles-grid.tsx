'use client'

import React, { useState } from 'react'
import { Shield, Pencil } from 'lucide-react'
import Link from 'next/link'

type RoleGridProps = {
    roles: string[]
}

export default function RolesGrid({ roles }: RoleGridProps) {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [currentRole, setCurrentRole] = useState<string | null>(null)

    const handleOpenModal = (role: string) => {
        setCurrentRole(role)
        setIsModalOpen(true)
    }

    const handleCloseModal = () => {
        setIsModalOpen(false)
        setCurrentRole(null)
    }

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
                                <button 
                                    onClick={() => handleOpenModal(role)}
                                    className="text-slate-400 hover:text-indigo-600 p-1.5 hover:bg-indigo-50 rounded-md transition-colors" 
                                    title="Edit Role"
                                >
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
                            <Link href={`/admin/roles/${encodeURIComponent(role)}`} className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors py-1 cursor-pointer">
                                Manage Permissions &rarr;
                            </Link>
                        </div>
                    </div>
                ))}
            </div>

            {/* Edit Role Modal */}
            {isModalOpen && currentRole && (
                <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                            <h2 className="text-lg font-semibold text-slate-800">
                                View Role
                            </h2>
                            <button
                                onClick={handleCloseModal}
                                className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-200 transition-colors"
                            >
                                ✕
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Role Name</label>
                                <input
                                    type="text"
                                    readOnly
                                    value={currentRole}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md bg-slate-50 text-slate-500 cursor-not-allowed sm:text-sm"
                                />
                                <p className="text-xs text-slate-500 mt-2">
                                    System default roles cannot be renamed. To modify what this role can do, manage its permissions.
                                </p>
                            </div>
                        </div>
                        
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                            <button
                                onClick={handleCloseModal}
                                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                            >
                                Close
                            </button>
                            <Link
                                href={`/admin/roles/${encodeURIComponent(currentRole)}`}
                                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                            >
                                Manage Permissions
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
