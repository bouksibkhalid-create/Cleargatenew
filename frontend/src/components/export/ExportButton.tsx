

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
                <Button variant="outline" size="sm" disabled={disabled} className="bg-transparent border-white/10 text-gray-400 hover:bg-white/5 hover:text-white">
                    <FileDown className="h-4 w-4 mr-2" />
                    Export
                    <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#1A1F2E] border-white/10 text-gray-300">
                <DropdownMenuItem onClick={() => handleExport('pdf')} className="hover:bg-white/5 hover:text-white focus:bg-white/5 focus:text-white cursor-pointer">
                    <FileText className="h-4 w-4 mr-2 text-[#00D4AA]" />
                    Export to PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('csv')} className="hover:bg-white/5 hover:text-white focus:bg-white/5 focus:text-white cursor-pointer">
                    <Table className="h-4 w-4 mr-2 text-[#00D4AA]" />
                    Export to CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('json')} className="hover:bg-white/5 hover:text-white focus:bg-white/5 focus:text-white cursor-pointer">
                    <Code className="h-4 w-4 mr-2 text-[#00D4AA]" />
                    Export to JSON
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
