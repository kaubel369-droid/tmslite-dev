'use client';

import { useState } from 'react';
import { Save, ArrowLeft, Eye, Code, Search, Info } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface TemplateEditorProps {
    initialContent: string;
    templateName: string;
    slug: string;
    orgId: string;
    type: string;
}

export default function TemplateEditor({ initialContent, templateName, slug, orgId, type }: TemplateEditorProps) {
    const [content, setContent] = useState(initialContent);
    const [saving, setSaving] = useState(false);
    const [view, setView] = useState<'edit' | 'preview'>('edit');
    const router = useRouter();

    const placeholders = [
        { key: '{{company_name}}', desc: 'Your company name' },
        { key: '{{company_logo}}', desc: 'Company logo image tag' },
        { key: '{{load_number}}', desc: 'Load identification number' },
        { key: '{{customer_name}}', desc: 'Primary customer name' },
        { key: '{{shipper_name}}', desc: 'Shipper company name' },
        { key: '{{shipper_address}}', desc: 'Full shipper address' },
        { key: '{{consignee_name}}', desc: 'Consignee company name' },
        { key: '{{consignee_address}}', desc: 'Full consignee address' },
        { key: '{{pickup_date}}', desc: 'Scheduled pickup date' },
        { key: '{{delivery_date}}', desc: 'Scheduled delivery date' },
        { key: '{{total_weight}}', desc: 'Total weight of the load' },
        { key: '{{total_pallets}}', desc: 'Total pallet count' },
        { key: '{{customer_rate}}', desc: 'Total rate charged to customer' },
        { key: '{{bol_number}}', desc: 'Bill of Lading number' },
        { key: '{{pro_number}}', desc: 'Carrier PRO number' },
    ];

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/admin/templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    org_id: orgId,
                    name: templateName,
                    slug,
                    content,
                    type
                })
            });

            if (!res.ok) throw new Error('Failed to save template');
            
            router.refresh();
            // Optional: toast notification
        } catch (err) {
            console.error(err);
            alert('Error saving template');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/templates" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <ArrowLeft className="h-5 w-5 text-slate-500" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">{templateName}</h1>
                        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">{type} Template</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
                        <button
                            onClick={() => setView('edit')}
                            className={`px-4 py-2 text-xs font-bold flex items-center gap-2 transition-colors ${view === 'edit' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            <Code className="h-3.5 w-3.5" /> EDITOR
                        </button>
                        <button
                            onClick={() => setView('preview')}
                            className={`px-4 py-2 text-xs font-bold flex items-center gap-2 transition-colors ${view === 'preview' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            <Eye className="h-3.5 w-3.5" /> PREVIEW
                        </button>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-indigo-700 transition-all shadow-sm active:scale-95 disabled:bg-slate-300"
                    >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        SAVE TEMPLATE
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-4 gap-6 flex-1 overflow-hidden min-h-[600px]">
                <div className="col-span-3 h-full flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    {view === 'edit' ? (
                        <div className="relative flex-1">
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className="w-full h-full p-6 font-mono text-sm focus:outline-none resize-none bg-slate-50/30"
                                placeholder="<!-- Enter HTML Template Here -->"
                            />
                            <div className="absolute top-2 right-4 flex items-center gap-2 text-[10px] font-bold text-slate-400 bg-white/80 px-2 py-1 rounded border border-slate-100 uppercase tracking-tighter">
                                HTML / CSS Supported
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 bg-slate-100 p-8 overflow-y-auto">
                            <div className="w-full h-full bg-white shadow-xl mx-auto max-w-[800px] p-12 min-h-[1056px] rounded-sm border border-slate-200">
                                {/* Simple preview logic - in a real app this would be an iframe or a complex renderer */}
                                <div dangerouslySetInnerHTML={{ 
                                    __html: content
                                        .replace(/{{company_name}}/g, 'TMSLite Logistics')
                                        .replace(/{{load_number}}/g, 'LOAD-12345')
                                        .replace(/{{customer_name}}/g, 'Acme Corp')
                                        .replace(/{{bol_number}}/g, 'B1234567')
                                        .replace(/{{pro_number}}/g, 'P1234567')
                                }} />
                            </div>
                        </div>
                    )}
                </div>

                <div className="col-span-1 space-y-6">
                    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-3 text-slate-800 font-bold text-xs uppercase tracking-widest border-b border-slate-100 pb-2">
                            <Search className="h-3.5 w-3.5 text-indigo-600" />
                            Placeholders
                        </div>
                        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
                            {placeholders.map((p) => (
                                <div key={p.key} className="group p-2 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all cursor-pointer" onClick={() => {
                                    setContent(content + p.key);
                                }}>
                                    <code className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded block w-fit mb-1">{p.key}</code>
                                    <span className="text-[10px] text-slate-500 italic">{p.desc}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-amber-50 rounded-xl border border-amber-100 p-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-2 text-amber-800 font-bold text-xs uppercase tracking-widest">
                            <Info className="h-3.5 w-3.5" />
                            Tutorial
                        </div>
                        <p className="text-[11px] text-amber-700 leading-relaxed">
                            Use standard HTML tags for layout and inline CSS for styling. Click any placeholder to insert it at the end of your template. 
                            <br /><br />
                            <strong>Pro Tip:</strong> Use table layouts for best compatibility in PDF exports.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Loader2({ className }: { className: string }) {
    return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
    )
}
