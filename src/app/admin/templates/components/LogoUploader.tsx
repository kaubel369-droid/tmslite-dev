'use client';

import { useState, useEffect } from 'react';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';

interface LogoUploaderProps {
    initialLogoUrl?: string;
    orgId: string;
}

export default function LogoUploader({ initialLogoUrl, orgId }: LogoUploaderProps) {
    const [logoUrl, setLogoUrl] = useState(initialLogoUrl || '');
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('orgId', orgId);

        try {
            const res = await fetch('/api/admin/logo', {
                method: 'POST',
                body: formData
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to upload logo');
            }

            const data = await res.json();
            setLogoUrl(data.url);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        } finally {
            setUploading(false);
        }
    };

    const handleRemove = async () => {
        if (!confirm('Are you sure you want to remove the company logo?')) return;
        
        setUploading(true);
        try {
            const res = await fetch('/api/admin/logo', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orgId })
            });

            if (!res.ok) throw new Error('Failed to remove logo');
            setLogoUrl('');
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <div className="relative h-24 w-48 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center bg-slate-50 overflow-hidden">
                    {logoUrl ? (
                        <>
                            <img src={logoUrl} alt="Company Logo" className="max-h-full max-w-full object-contain p-2" />
                            <button
                                onClick={handleRemove}
                                className="absolute top-1 right-1 p-1 bg-white rounded-full shadow-sm text-slate-400 hover:text-red-500 transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </>
                    ) : (
                        <div className="flex flex-col items-center gap-1 text-slate-400">
                            <ImageIcon className="h-8 w-8 opacity-20" />
                            <span className="text-[10px] font-medium uppercase tracking-wider">No Logo</span>
                        </div>
                    )}
                    {uploading && (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] flex items-center justify-center">
                            <Loader2 className="h-6 w-6 text-indigo-600 animate-spin" />
                        </div>
                    )}
                </div>

                <div className="flex-1 space-y-2">
                    <h3 className="text-sm font-semibold text-slate-800">Company Logo</h3>
                    <p className="text-xs text-slate-500 max-w-xs">
                        This logo will be used across the system and on all generated reports. 
                        Recommended size: 400x200px.
                    </p>
                    <div className="relative">
                        <input
                            type="file"
                            id="logo-upload"
                            className="hidden"
                            accept="image/*"
                            onChange={handleUpload}
                            disabled={uploading}
                        />
                        <label
                            htmlFor="logo-upload"
                            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                                uploading 
                                ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed' 
                                : 'bg-white border-slate-300 text-slate-700 hover:border-indigo-500 hover:text-indigo-600 shadow-sm'
                            }`}
                        >
                            <Upload className="h-3.5 w-3.5" />
                            {logoUrl ? 'Change Logo' : 'Upload Logo'}
                        </label>
                    </div>
                </div>
            </div>
            {error && (
                <p className="text-xs text-red-500 font-medium">{error}</p>
            )}
        </div>
    );
}
