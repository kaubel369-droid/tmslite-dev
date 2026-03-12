'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'
import { Settings2, Loader2, Save, Unlock, Lock } from 'lucide-react'

type AccessorialMerge = {
    id: string
    name: string
    min_charge: number | null
    max_charge: number | null
    charge_per_pound: number | null
    charge_per_piece: number | null
    fixed_price: number | null
    API_code: string | null
    is_locked: boolean // From carrier_accessorials
}

type Props = {
    carrierId: string
}

export default function CarrierAccessorialsModal({ carrierId }: Props) {
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [accessorials, setAccessorials] = useState<AccessorialMerge[]>([])
    const [editingItem, setEditingItem] = useState<AccessorialMerge | null>(null)
    const [saving, setSaving] = useState(false)

    // Form state for editing
    const [form, setForm] = useState({
        min_charge: '', max_charge: '', charge_per_pound: '', charge_per_piece: '', fixed_price: '', is_locked: false
    })

    const fetchAccessorials = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/carriers/${carrierId}/accessorials`)
            if (res.ok) {
                const data = await res.json()
                setAccessorials(data.accessorials || [])
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    // Load data when opening modal
    useEffect(() => {
        if (isOpen) fetchAccessorials()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen])

    const handleOpenEdit = (item: AccessorialMerge) => {
        setEditingItem(item)
        setForm({
            min_charge: item.min_charge?.toString() || '',
            max_charge: item.max_charge?.toString() || '',
            charge_per_pound: item.charge_per_pound?.toString() || '',
            charge_per_piece: item.charge_per_piece?.toString() || '',
            fixed_price: item.fixed_price?.toString() || '',
            is_locked: item.is_locked
        })
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target
        setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    }

    const handleSave = async () => {
        if (!editingItem) return
        setSaving(true)
        try {
            const payload = {
                accessorial_id: editingItem.id,
                ...form
            }
            const res = await fetch(`/api/carriers/${carrierId}/accessorials`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (!res.ok) throw new Error('Failed to save')
            
            // Re-fetch data
            await fetchAccessorials()
            setEditingItem(null)
        } catch (error) {
            console.error(error)
            alert('Failed to save overriding rates.')
        } finally {
            setSaving(false)
        }
    }

    const formatCurrency = (val: number | null) => {
        if (val === null || val === undefined) return '-'
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val)
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <button 
                type="button"
                onClick={() => setIsOpen(true)}
                className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium py-2 px-4 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
            >
                <Settings2 className="h-4 w-4 text-slate-500" />
                Accessorials
            </button>

            <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col p-0">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="text-xl">Carrier Accessorial Overrides</DialogTitle>
                    <DialogDescription>
                        Lock in specific pricing that applies only to this carrier.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-6 pb-6">
                    {loading ? (
                        <div className="p-12 flex justify-center items-center text-slate-400">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-slate-50 sticky top-0 border-b border-slate-200 z-10 shadow-sm">
                                <TableRow>
                                    <TableHead className="py-3 px-4 font-semibold text-slate-700">Accessorial Name</TableHead>
                                    <TableHead className="py-3 px-4 font-semibold text-slate-700 whitespace-nowrap text-right">Min Charge</TableHead>
                                    <TableHead className="py-3 px-4 font-semibold text-slate-700 whitespace-nowrap text-right">Max Charge</TableHead>
                                    <TableHead className="py-3 px-4 font-semibold text-slate-700 whitespace-nowrap text-right">Fixed Price</TableHead>
                                    <TableHead className="py-3 px-4 font-semibold text-slate-700 text-center">Status</TableHead>
                                    <TableHead className="py-3 px-4 text-right font-semibold text-slate-700">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {accessorials.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                                            No accessorials configured in the system.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    accessorials.map(acc => (
                                        <TableRow key={acc.id} className="hover:bg-slate-50/50">
                                            <TableCell className="py-3 px-4">
                                                <div className="font-medium text-slate-900">{acc.name}</div>
                                                {acc.API_code && <div className="text-xs text-slate-500 font-mono mt-0.5">{acc.API_code}</div>}
                                            </TableCell>
                                            <TableCell className="py-3 px-4 text-right text-slate-600">{formatCurrency(acc.min_charge)}</TableCell>
                                            <TableCell className="py-3 px-4 text-right text-slate-600">{formatCurrency(acc.max_charge)}</TableCell>
                                            <TableCell className="py-3 px-4 text-right text-slate-600">{formatCurrency(acc.fixed_price)}</TableCell>
                                            <TableCell className="py-3 px-4 text-center">
                                                {acc.is_locked ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                                        <Lock className="h-3 w-3" /> Locked
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                                                        <Unlock className="h-3 w-3" /> Default
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell className="py-3 px-4 text-right">
                                                <button 
                                                    onClick={() => handleOpenEdit(acc)}
                                                    className="text-indigo-600 hover:text-indigo-800 text-sm font-medium hover:underline transition-colors"
                                                >
                                                    Edit
                                                </button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </DialogContent>

            {/* Individual Edit Modal */}
            {editingItem && (
                <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="flex items-center justify-between">
                                Edit {editingItem.name} Override
                            </DialogTitle>
                        </DialogHeader>

                        <div className="py-4 space-y-4">
                            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
                                <div className="pt-0.5">
                                    <input 
                                        type="checkbox" 
                                        name="is_locked"
                                        id="is_locked"
                                        checked={form.is_locked}
                                        onChange={handleChange}
                                        className="h-4 w-4 rounded text-amber-600 focus:ring-amber-500 border-amber-300"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="is_locked" className="font-semibold text-amber-900 cursor-pointer text-sm">Lock for this Carrier</label>
                                    <p className="text-xs text-amber-700 mt-1">
                                        When checked, the rates below will override the default system accessorial rates for this specific carrier during rating.
                                    </p>
                                </div>
                            </div>

                            <div className={`grid grid-cols-2 gap-4 ${!form.is_locked ? 'opacity-50 pointer-events-none' : ''}`}>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Min Charge ($)</label>
                                    <input type="number" step="0.01" name="min_charge" value={form.min_charge} onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Max Charge ($)</label>
                                    <input type="number" step="0.01" name="max_charge" value={form.max_charge} onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Charge Per Pound ($)</label>
                                    <input type="number" step="0.0001" name="charge_per_pound" value={form.charge_per_pound} onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Charge Per Piece ($)</label>
                                    <input type="number" step="0.01" name="charge_per_piece" value={form.charge_per_piece} onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Fixed Price ($)</label>
                                    <input type="number" step="0.01" name="fixed_price" value={form.fixed_price} onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
                                </div>
                            </div>
                        </div>

                        <DialogFooter>
                            <button 
                                onClick={() => setEditingItem(null)}
                                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSave}
                                disabled={saving}
                                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {saving ? 'Saving...' : <><Save className="h-4 w-4" /> Save Pricing</>}
                            </button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </Dialog>
    )
}
