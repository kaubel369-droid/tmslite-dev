'use client';

import { Printer } from 'lucide-react';

interface PrintButtonProps {
    id: string;
    type: 'quote' | 'spot-quote';
    variant?: 'icon' | 'outline' | 'full';
    className?: string;
}

export default function PrintButton({ id, type, variant = 'icon', className = '' }: PrintButtonProps) {
    const handlePrint = () => {
        const url = `/api/print?id=${id}&type=${type}`;
        const width = 900;
        const height = 800;
        const left = (window.innerWidth - width) / 2;
        const top = (window.innerHeight - height) / 2;
        
        window.open(
            url, 
            'Print Preview', 
            `width=${width},height=${height},left=${left},top=${top},toolbar=0,scrollbars=1,status=0,resizable=1`
        );
    };

    if (variant === 'icon') {
        return (
            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    handlePrint();
                }}
                className={`p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors ${className}`}
                title="Print Quote"
            >
                <Printer className="h-4 w-4" />
            </button>
        );
    }

    if (variant === 'outline') {
        return (
            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    handlePrint();
                }}
                className={`flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all ${className}`}
            >
                <Printer className="h-3.5 w-3.5" /> PRINT
            </button>
        );
    }

    return (
        <button 
            onClick={(e) => {
                e.stopPropagation();
                handlePrint();
            }}
            className={`flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-50 transition-all shadow-sm active:scale-95 ${className}`}
        >
            <Printer className="h-4 w-4" /> Print Preview
        </button>
    );
}
