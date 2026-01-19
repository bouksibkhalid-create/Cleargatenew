
import React from 'react';
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
                <Button variant="outline" size="sm" disabled={disabled}>
                    <FileDown className="h-4 w-4 mr-2" />
                    Export
                    <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport('pdf')}>
                    <FileText className="h-4 w-4 mr-2" />
                    Export to PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('csv')}>
                    <Table className="h-4 w-4 mr-2" />
                    Export to CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('json')}>
                    <Code className="h-4 w-4 mr-2" />
                    Export to JSON
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
