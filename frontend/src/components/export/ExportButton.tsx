

import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FileDown, FileText, Table, Code, ChevronDown } from 'lucide-react';
import { exportToCSV, exportToJSON, exportToPDF } from '../../utils/exportHelpers';
import type { SearchResponse } from '../../types/search';

interface ExportButtonProps {
    data: SearchResponse;
    disabled?: boolean;
}

export default function ExportButton({ data, disabled = false }: ExportButtonProps) {
    const handleExport = (type: 'csv' | 'json' | 'pdf') => {
        switch (type) {
            case 'csv':
                exportToCSV(data);
                break;
            case 'json':
                exportToJSON(data);
                break;
            case 'pdf':
                exportToPDF(data);
                break;
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={disabled} className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white">
                    <FileDown className="h-4 w-4 mr-2" />
                    Export
                    <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100">
                <DropdownMenuItem onClick={() => handleExport('pdf')} className="hover:bg-slate-50 dark:hover:bg-slate-700 focus:bg-slate-50 dark:focus:bg-slate-700 cursor-pointer">
                    <FileText className="h-4 w-4 mr-2 text-[#9E59EF]" />
                    Export to PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('csv')} className="hover:bg-slate-50 dark:hover:bg-slate-700 focus:bg-slate-50 dark:focus:bg-slate-700 cursor-pointer">
                    <Table className="h-4 w-4 mr-2 text-[#9E59EF]" />
                    Export to CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('json')} className="hover:bg-slate-50 dark:hover:bg-slate-700 focus:bg-slate-50 dark:focus:bg-slate-700 cursor-pointer">
                    <Code className="h-4 w-4 mr-2 text-[#9E59EF]" />
                    Export to JSON
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
