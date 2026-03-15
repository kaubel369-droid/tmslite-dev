'use client';

import { FileText, Edit2, CheckCircle, Clock } from 'lucide-react';
import Link from 'next/link';

interface Template {
    id: string;
    name: string;
    slug: string;
    type: string;
    updated_at: string;
}

interface TemplateListProps {
    templates: Template[];
}

export default function TemplateList({ templates }: TemplateListProps) {
    const requiredTemplates = [
        { name: 'BOL Template', slug: 'bol', type: 'BOL' },
        { name: 'Customer Rate Quote LTL', slug: 'customer-rate-quote-ltl', type: 'Quote' },
        { name: 'Customer Spot Rate Quote', slug: 'customer-spot-rate-quote', type: 'Quote' },
        { name: 'Customer Invoice', slug: 'customer-invoice', type: 'Invoice' },
        { name: 'Customer Load Confirmation', slug: 'customer-load-confirmation', type: 'Confirmation' },
        { name: 'Carrier Load Confirmation', slug: 'carrier-load-confirmation', type: 'Confirmation' },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {requiredTemplates.map((req) => {
                const template = templates.find(t => t.slug === req.slug);
                return (
                    <div key={req.slug} className="group flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 hover:shadow-md transition-all">
                        <div className="flex items-center gap-4">
                            <div className={`p-2.5 rounded-lg ${template ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-400'}`}>
                                <FileText className="h-5 w-5" />
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-slate-800">{req.name}</h4>
                                <div className="flex items-center gap-2 mt-0.5">
                                    {template ? (
                                        <>
                                            <span className="flex items-center gap-1 text-[10px] font-medium text-green-600">
                                                <CheckCircle className="h-3 w-3" /> Configured
                                            </span>
                                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                                <Clock className="h-3 w-3" /> Updated {new Date(template.updated_at).toLocaleDateString()}
                                            </span>
                                        </>
                                    ) : (
                                        <span className="text-[10px] font-medium text-slate-400 italic">No template set (using default)</span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <Link
                            href={`/admin/templates/${req.slug}`}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-indigo-600 border border-indigo-100 bg-indigo-50/50 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all"
                        >
                            <Edit2 className="h-3 w-3" /> Edit
                        </Link>
                    </div>
                );
            })}
        </div>
    );
}
