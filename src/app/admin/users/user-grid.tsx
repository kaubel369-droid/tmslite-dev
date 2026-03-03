'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { Plus, Pencil, Trash2, ArrowUpDown, X, Loader2 } from 'lucide-react'
import { submitUserForm, deleteUser } from './actions'

type UserProfile = {
    id: string
    email: string | undefined
    created_at: string
    first_name: string
    last_name: string
    role: string
}

export default function UserGrid({
    initialUsers,
    currentOrgId,
}: {
    initialUsers: UserProfile[]
    currentOrgId: string | undefined
}) {
    const [users, setUsers] = useState<UserProfile[]>(initialUsers)
    const [roleFilter, setRoleFilter] = useState<string>('All')

    // Sorting state
    const [sortField, setSortField] = useState<keyof UserProfile>('first_name')
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingUser, setEditingUser] = useState<UserProfile | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [errorMsg, setErrorMsg] = useState('')

    // Form ref
    const formRef = useRef<HTMLFormElement>(null)

    const roles = ['All', 'Admin', 'Supervisor', 'Customer Service Rep', 'Sales Rep', 'Customer']

    // Keep state in sync if props change (though typically Next.js handles this by remounting or fast refresh)
    useEffect(() => {
        setUsers(initialUsers)
    }, [initialUsers])

    const handleSort = (field: keyof UserProfile) => {
        if (field === sortField) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
        } else {
            setSortField(field)
            setSortDirection('asc')
        }
    }

    const filteredAndSortedUsers = useMemo(() => {
        let result = [...users]

        // Filtering
        if (roleFilter !== 'All') {
            result = result.filter(u => u.role === roleFilter)
        }

        // Sorting
        result.sort((a, b) => {
            let aValue = a[sortField]
            let bValue = b[sortField]

            // Handle missing values
            if (aValue === undefined || aValue === null) aValue = ''
            if (bValue === undefined || bValue === null) bValue = ''

            // Sort logic
            if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
            if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
            return 0
        })

        return result
    }, [users, roleFilter, sortField, sortDirection])

    const openAddModal = () => {
        setEditingUser(null)
        setErrorMsg('')
        setIsModalOpen(true)
    }

    const openEditModal = (user: UserProfile) => {
        setEditingUser(user)
        setErrorMsg('')
        setIsModalOpen(true)
    }

    const closeModal = () => {
        setIsModalOpen(false)
        setEditingUser(null)
        setErrorMsg('')
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setErrorMsg('')
        setIsSubmitting(true)

        try {
            const formData = new FormData(e.currentTarget)
            if (currentOrgId) {
                formData.append('org_id', currentOrgId)
            }
            if (editingUser) {
                formData.append('id', editingUser.id)
            }

            const result = await submitUserForm(formData)

            if (result.error) {
                setErrorMsg(result.error)
            } else {
                closeModal()
            }
        } catch (err) {
            setErrorMsg('An unexpected error occurred.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            const result = await deleteUser(id)
            if (result.error) {
                alert(result.error)
            }
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">User Management</h1>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-500">Filter by Role:</span>
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="h-9 w-48 rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                            {roles.map(r => (
                                <option key={r} value={r}>{r}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <button
                    onClick={openAddModal}
                    className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700 transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    Add User
                </button>
            </div>

            <div className="rounded-md border border-slate-200 overflow-hidden bg-white shadow-sm">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold select-none">
                        <tr>
                            <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('first_name')}>
                                <div className="flex items-center gap-1">
                                    Name <ArrowUpDown className="h-3 w-3 text-slate-400" />
                                </div>
                            </th>
                            <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('email')}>
                                <div className="flex items-center gap-1">
                                    Email <ArrowUpDown className="h-3 w-3 text-slate-400" />
                                </div>
                            </th>
                            <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('role')}>
                                <div className="flex items-center gap-1">
                                    Role <ArrowUpDown className="h-3 w-3 text-slate-400" />
                                </div>
                            </th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                        {filteredAndSortedUsers.map((user) => (
                            <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 font-medium text-slate-900 border-l-4 border-l-transparent hover:border-indigo-500 transition-all">
                                    {user.first_name || user.last_name ? `${user.first_name} ${user.last_name}` : 'Pending Invite'}
                                </td>
                                <td className="px-6 py-4 text-slate-600">{user.email}</td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-800 border border-slate-200">
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-100 shadow-sm">
                                        Active
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2 text-slate-400">
                                        <button
                                            onClick={() => openEditModal(user)}
                                            className="hover:text-indigo-600 transition-colors p-1"
                                            title="Edit User"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(user.id)}
                                            className="hover:text-red-600 transition-colors p-1"
                                            title="Delete User"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredAndSortedUsers.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                    <div className="flex flex-col items-center justify-center space-y-3">
                                        <div className="bg-slate-100 p-3 rounded-full">
                                            <Trash2 className="h-6 w-6 text-slate-400" />
                                        </div>
                                        <p>No users found matching current filters.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal Overlay */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-all duration-300 ease-in-out">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden flex flex-col max-h-[90vh]">

                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                            <h2 className="text-lg font-bold text-slate-900">
                                {editingUser ? 'Edit User' : 'Add New User'}
                            </h2>
                            <button
                                onClick={closeModal}
                                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto">
                            <form id="user-form" ref={formRef} onSubmit={handleSubmit} className="space-y-4">

                                {errorMsg && (
                                    <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-100">
                                        {errorMsg}
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700" htmlFor="first_name">First Name</label>
                                        <input
                                            id="first_name" name="first_name"
                                            defaultValue={editingUser?.first_name}
                                            required
                                            className="w-full h-10 px-3 py-2 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
                                            placeholder="John"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700" htmlFor="last_name">Last Name</label>
                                        <input
                                            id="last_name" name="last_name"
                                            defaultValue={editingUser?.last_name}
                                            required
                                            className="w-full h-10 px-3 py-2 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
                                            placeholder="Smith"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700" htmlFor="email">Email Address</label>
                                    <input
                                        id="email" name="email" type="email"
                                        defaultValue={editingUser?.email}
                                        readOnly={!!editingUser}
                                        required
                                        className={`w-full h-10 px-3 py-2 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all ${editingUser ? 'bg-slate-100 cursor-not-allowed text-slate-500' : ''}`}
                                        placeholder="john.smith@example.com"
                                    />
                                    {editingUser && <p className="text-xs text-slate-500 mt-1">Email cannot be changed after creation.</p>}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700" htmlFor="role">System Role</label>
                                    <select
                                        id="role" name="role"
                                        defaultValue={editingUser?.role || 'Customer'}
                                        className="w-full h-10 px-3 py-2 rounded-md border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                                    >
                                        {roles.filter(r => r !== 'All').map(r => (
                                            <option key={r} value={r}>{r}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700" htmlFor="password">
                                        Password {editingUser && <span className="text-slate-400 font-normal">(Leave blank to keep current)</span>}
                                    </label>
                                    <input
                                        id="password" name="password" type="password"
                                        required={!editingUser}
                                        className="w-full h-10 px-3 py-2 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
                                        placeholder={editingUser ? "••••••••" : "Create a secure password"}
                                        minLength={6}
                                    />
                                </div>
                            </form>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={closeModal}
                                disabled={isSubmitting}
                                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="user-form"
                                disabled={isSubmitting}
                                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700 transition-colors min-w-[100px] disabled:opacity-70"
                            >
                                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (editingUser ? 'Save Updates' : 'Create User')}
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </div>
    )
}
