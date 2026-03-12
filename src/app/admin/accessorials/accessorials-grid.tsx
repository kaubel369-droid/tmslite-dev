'use client'

import React, { useState } from 'react'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import { createAccessorial, updateAccessorial, deleteAccessorial } from './actions'

type Accessorial = {
    id: string
    name: string
    min_charge: number | null
    max_charge: number | null
    charge_per_pound: number | null
    charge_per_piece: number | null
    fixed_price: number | null
    API_code: string | null
    org_id: string | null
}

export default function AccessorialsGrid({ 
    initialAccessorials,
    currentOrgId 
}: { 
    initialAccessorials: Accessorial[]
    currentOrgId?: string 
}) {
    const [accessorials, setAccessorials] = useState(initialAccessorials)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [currentAccessorial, setCurrentAccessorial] = useState<Partial<Accessorial> | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleOpenModal = (accessorial?: Accessorial) => {
        if (accessorial) {
            setCurrentAccessorial(accessorial)
        } else {
            setCurrentAccessorial({
                name: '',
                min_charge: null,
                max_charge: null,
                charge_per_pound: null,
                charge_per_piece: null,
                fixed_price: null,
                API_code: '',
            })
        }
        setError(null)
        setIsModalOpen(true)
    }

    const handleCloseModal = () => {
        setIsModalOpen(false)
        setCurrentAccessorial(null)
        setError(null)
    }

    const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSubmitting(true)
        setError(null)

        const formData = new FormData(e.currentTarget)
        const data = {
            name: formData.get('name') as string,
            min_charge: formData.get('min_charge') ? Number(formData.get('min_charge')) : null,
            max_charge: formData.get('max_charge') ? Number(formData.get('max_charge')) : null,
            charge_per_pound: formData.get('charge_per_pound') ? Number(formData.get('charge_per_pound')) : null,
            charge_per_piece: formData.get('charge_per_piece') ? Number(formData.get('charge_per_piece')) : null,
            fixed_price: formData.get('fixed_price') ? Number(formData.get('fixed_price')) : null,
            API_code: formData.get('API_code') as string || null,
            org_id: currentOrgId,
        }

        try {
            if (currentAccessorial?.id) {
                // Update
                const result = await updateAccessorial(currentAccessorial.id, data)
                if (result.error) throw new Error(result.error)
                
                setAccessorials(prev => prev.map(a => a.id === currentAccessorial.id ? { ...a, ...data } as Accessorial : a))
            } else {
                // Create
                const result = await createAccessorial(data)
                if (result.error) throw new Error(result.error)
                
                if (result.data) {
                    setAccessorials(prev => [...prev, result.data as Accessorial])
                }
            }
            handleCloseModal()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this accessorial?')) return

        try {
            const result = await deleteAccessorial(id)
            if (result.error) throw new Error(result.error)
            
            setAccessorials(prev => prev.filter(a => a.id !== id))
        } catch (err: any) {
            alert(`Error deleting: ${err.message}`)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Accessorials</h1>
                    <p className="text-sm text-slate-500 mt-1">Manage carrier accessorial charges and limits.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors shadow-sm text-sm font-medium"
                >
                    <Plus className="h-4 w-4" />
                    Add Accessorial
                </button>
            </div>

            <div className="bg-white rounded-lg shadow border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 bg-slate-50 uppercase border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-medium">Name</th>
                                <th className="px-6 py-4 font-medium">API Code</th>
                                <th className="px-6 py-4 font-medium text-right">Fixed Price</th>
                                <th className="px-6 py-4 font-medium text-right">Per Lb</th>
                                <th className="px-6 py-4 font-medium text-right">Per Piece</th>
                                <th className="px-6 py-4 font-medium text-right">Min</th>
                                <th className="px-6 py-4 font-medium text-right">Max</th>
                                <th className="px-6 py-4 font-medium text-right w-24">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {accessorials.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-8 text-center text-slate-500">
                                        No accessorials found. Click "Add Accessorial" to create one.
                                    </td>
                                </tr>
                            ) : (
                                accessorials.map((acc) => (
                                    <tr key={acc.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-900">{acc.name}</td>
                                        <td className="px-6 py-4 text-slate-500">{acc.API_code || '-'}</td>
                                        <td className="px-6 py-4 text-slate-700 text-right">{acc.fixed_price !== null ? `$${acc.fixed_price}` : '-'}</td>
                                        <td className="px-6 py-4 text-slate-700 text-right">{acc.charge_per_pound !== null ? `$${acc.charge_per_pound}` : '-'}</td>
                                        <td className="px-6 py-4 text-slate-700 text-right">{acc.charge_per_piece !== null ? `$${acc.charge_per_piece}` : '-'}</td>
                                        <td className="px-6 py-4 text-slate-700 text-right">{acc.min_charge !== null ? `$${acc.min_charge}` : '-'}</td>
                                        <td className="px-6 py-4 text-slate-700 text-right">{acc.max_charge !== null ? `$${acc.max_charge}` : '-'}</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleOpenModal(acc)}
                                                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                                                    title="Edit Accessorial"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(acc.id)}
                                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                                    title="Delete Accessorial"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && currentAccessorial && (
                <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                            <h2 className="text-lg font-semibold text-slate-800">
                                {currentAccessorial.id ? 'Edit Accessorial' : 'Add Accessorial'}
                            </h2>
                            <button
                                onClick={handleCloseModal}
                                className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-200 transition-colors"
                            >
                                ✕
                            </button>
                        </div>
                        
                        <form onSubmit={handleSave} className="p-6">
                            {error && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
                                    {error}
                                </div>
                            )}
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                                    <input
                                        type="text"
                                        name="name"
                                        required
                                        defaultValue={currentAccessorial.name}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all sm:text-sm"
                                        placeholder="e.g. Liftgate Delivery"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">API Code</label>
                                    <input
                                        type="text"
                                        name="API_code"
                                        defaultValue={currentAccessorial.API_code || ''}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all sm:text-sm"
                                        placeholder="e.g. LGD"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Fixed Price ($)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            name="fixed_price"
                                            defaultValue={currentAccessorial.fixed_price || ''}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all sm:text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mt-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Charge Per Lb ($)</label>
                                        <input
                                            type="number"
                                            step="0.0001"
                                            name="charge_per_pound"
                                            defaultValue={currentAccessorial.charge_per_pound || ''}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all sm:text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Charge Per Piece ($)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            name="charge_per_piece"
                                            defaultValue={currentAccessorial.charge_per_piece || ''}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all sm:text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mt-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Min Charge ($)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            name="min_charge"
                                            defaultValue={currentAccessorial.min_charge || ''}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all sm:text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Max Charge ($)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            name="max_charge"
                                            defaultValue={currentAccessorial.max_charge || ''}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all sm:text-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="mt-8 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {isSubmitting ? 'Saving...' : 'Save Accessorial'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
