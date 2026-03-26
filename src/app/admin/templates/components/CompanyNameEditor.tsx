'use client';

import { useState } from 'react';
import { Save, Loader2, Check } from 'lucide-react';

interface CompanyNameEditorProps {
    initialName: string;
    orgId: string;
}

export default function CompanyNameEditor({ initialName, orgId }: CompanyNameEditorProps) {
    const [name, setName] = useState(initialName);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSave = async () => {
        if (!name.trim()) {
            setError('Company name cannot be empty');
            return;
        }

        setSaving(true);
        setError(null);
        setSaved(false);

        try {
            const res = await fetch('/api/admin/organization', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orgId, name: name.trim() })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to update company name');
            }

            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-4 pb-6 border-b border-slate-100 mb-6">
            <div className="flex flex-col gap-2">
                <label htmlFor="company-name" className="text-sm font-semibold text-slate-800">
                    Company Legal Name
                </label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        id="company-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-lg text-sm border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        placeholder="Enter company name"
                        disabled={saving}
                    />
                    <button
                        onClick={handleSave}
                        disabled={saving || name === initialName}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all shadow-sm ${
                            saving 
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                            : saved
                            ? 'bg-green-500 text-white hover:bg-green-600'
                            : name === initialName
                            ? 'bg-slate-50 text-slate-300 border border-slate-200 cursor-not-allowed shadow-none'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        }`}
                    >
                        {saving ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : saved ? (
                            <Check className="h-3.5 w-3.5" />
                        ) : (
                            <Save className="h-3.5 w-3.5" />
                        )}
                        {saving ? 'Saving...' : saved ? 'Saved' : 'Save Name'}
                    </button>
                </div>
                <p className="text-[11px] text-slate-500">
                    This name appears at the top of generated invoices, BOLs, and other documents.
                </p>
            </div>
            {error && (
                <p className="text-xs text-red-500 font-medium">{error}</p>
            )}
        </div>
    );
}
