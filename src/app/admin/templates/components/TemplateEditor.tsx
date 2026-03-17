'use client';

import { useState } from 'react';
import { Save, ArrowLeft, Eye, Code, Search, Info } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { processTemplate } from '@/lib/print-utils';

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

    const mockData = {
        company_name: 'TMSLite Logistics',
        logo_url: 'https://via.placeholder.com/150x60?text=LOGO',
        load_number: 'LOAD-12345',
        quote_number: 'Q-98765',
        quote_date: '03/17/2026',
        customer_name: 'Acme Corporation',
        shipper_name: 'Global Manufacturing Inc.',
        shipper_address: '123 Industrial Way, Chicago, IL 60601',
        consignee_name: 'Retail Distribution Center',
        consignee_address: '456 Delivery Lane, Los Angeles, CA 90001',
        pickup_date: '03/20/2026',
        delivery_date: '03/24/2026',
        total_weight: '42,500',
        total_pallets: '24',
        customer_rate: '$2,450.00',
        bol_number: 'BOL-987654',
        pro_number: 'PRO-12345678',
        bol_notes: 'Please call 24 hours prior to delivery. All freight must be counted and signed for by consignee.',
        pcs: 24,
        type: 'Pallets',
        weight: 42500,
        cubic_ft: 1200,
        products: [
            { pcs: 10, type: 'PLT', description: 'Industrial Parts', weight: 20000, nmfc: '12345-01', class: '70' },
            { pcs: 14, type: 'PLT', description: 'Raw Materials', weight: 22500, nmfc: '67890-02', class: '85' }
        ],
        accessorials_names: ['Liftgate Pickup', 'Residential Delivery'],
        additional_instructions: 'Please call 24h prior to arrival.',
        standard_preamble: 'RECEIVED, subject to the classifications and tariffs in effect on the date of the issue of this Bill of Lading, the property described below, in apparent good order, except as noted (contents and condition of contents of packages unknown), marked, consigned, and destined as indicated below, which said carrier (the word carrier being understood throughout this contract as meaning any person or corporation in possession of the property under the contract) agrees to carry to its usual place of delivery at said destination...',
        shipper_certification: 'This is to certify that the above named materials are properly classified, described, packaged, marked and labeled, and are in proper condition for transportation according to the applicable regulations of the Department of Transportation.',
        liability_statement: 'Unless the shipper declares a higher value and pays the applicable surcharge, carrier liability for loss or damage is limited to $0.50 per pound per package.'
    };

    const previewHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
            <style>
                body { 
                    margin: 0; 
                    padding: 0; 
                    background-color: #f1f5f9; 
                    display: flex; 
                    justify-content: center; 
                    padding-top: 40px;
                    padding-bottom: 40px;
                }
                .paper {
                    background-color: white;
                    width: 8.5in;
                    min-height: 11in;
                    padding: 0.5in;
                    box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
                    border-radius: 4px;
                    box-sizing: border-box;
                }
                @media print {
                    body { background-color: white; padding: 0; }
                    .paper { box-shadow: none; width: 100%; border-radius: 0; }
                }
            </style>
        </head>
        <body>
            <div class="paper">
                ${processTemplate(content || '', mockData)}
            </div>
        </body>
        </html>
    `;

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
        { key: '{{bol_notes}}', desc: 'Special instructions from Load Notes' },
        { key: '{{standard_preamble}}', desc: 'Standard contract of carriage language' },
        { key: '{{shipper_certification}}', desc: 'Shipper signature certification text' },
        { key: '{{liability_statement}}', desc: 'Standard carrier liability limitation' },
        { key: '{{nmfc}}', desc: 'Product NMFC code (inside products loop)' },
        { key: '{{class}}', desc: 'Product Freight Class (inside products loop)' },
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
                        <div className="flex-1 overflow-hidden">
                            <iframe 
                                srcDoc={previewHtml}
                                className="w-full h-full bg-slate-100"
                                title="Template Preview"
                            />
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
