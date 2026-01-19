/**
 * Graph Controls - Zoom, Layout, Filters, Search, Export
 * Provides interactive controls for the relationship graph
 */

import { useState } from 'react';
import { Plus, Minus, Maximize2, Filter, Search, LayoutGrid, Download, Copy } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface GraphControlsProps {
    onZoomIn: () => void;
    onZoomOut: () => void;
    onFitView: () => void;
    onLayoutChange: (layout: string) => void;
    onFilterChange: (filters: GraphFilters) => void;
    onSearch: (query: string) => void;
    onExportImage: () => void;
    onCopyGraph: () => void;
    currentLayout: string;
}

export interface GraphFilters {
    showSanctioned: boolean;
    showPEP: boolean;
    showFamily: boolean;
    showBusiness: boolean;
    showCompany: boolean;
    showLocation: boolean;
}



export default function GraphControls({
    onZoomIn,
    onZoomOut,
    onFitView,
    onLayoutChange,
    // onFilterChange, // Unused
    onSearch,
    onExportImage,
    onCopyGraph,
    currentLayout,
}: GraphControlsProps) {
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);
        onSearch(query);
    };

    return (
        <div className="graph-controls">
            {/* Zoom Controls */}
            <div className="control-group">
                <button onClick={onZoomIn} className="control-button" title="Zoom In">
                    <Plus className="w-4 h-4" />
                </button>
                <button onClick={onZoomOut} className="control-button" title="Zoom Out">
                    <Minus className="w-4 h-4" />
                </button>
                <button onClick={onFitView} className="control-button" title="Fit View">
                    <Maximize2 className="w-4 h-4" />
                </button>
            </div>

            {/* Export Menu */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className="control-button-wide">
                        <Download className="w-4 h-4" />
                        <span className="text-xs">Export</span>
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={onExportImage}>
                        <Download className="w-4 h-4 mr-2" />
                        Download as PNG
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onCopyGraph}>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy to Clipboard
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Layout Selector */}
            <div className="control-group">
                <Select value={currentLayout} onValueChange={onLayoutChange}>
                    <SelectTrigger className="w-36 h-9 text-xs">
                        <LayoutGrid className="w-3.5 h-3.5 mr-1" />
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="radial">Radial</SelectItem>
                        <SelectItem value="force">Force Directed</SelectItem>
                        <SelectItem value="hierarchical">Hierarchical</SelectItem>
                        <SelectItem value="circular">Circular</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Filters */}
            <div className="control-group">
                <button className="control-button-wide" onClick={() => { }}>
                    <Filter className="w-4 h-4" />
                    <span className="text-xs">Filters</span>
                </button>
            </div>

            {/* TODO: Implement Popover for filters */}
            {/* <Popover>
                <PopoverTrigger asChild>
                    <button className="control-button-wide">
                        <Filter className="w-4 h-4" />
                        <span className="text-xs">Filters</span>
                    </button>
                </PopoverTrigger>
                <PopoverContent className="w-72" align="start">
                    <div className="filters-panel">
                        <h4 className="font-semibold text-sm mb-3">Filter Nodes</h4>

                        <div className="space-y-3">
                            <div className="filter-item">
                                <Checkbox
                                    id="filter-sanctioned"
                                    checked={filters.showSanctioned}
                                    onCheckedChange={(checked) =>
                                        handleFilterChange('showSanctioned', checked as boolean)
                                    }
                                />
                                <Label htmlFor="filter-sanctioned" className="text-sm cursor-pointer">
                                    Sanctioned Entities
                                </Label>
                            </div>

                            <div className="filter-item">
                                <Checkbox
                                    id="filter-pep"
                                    checked={filters.showPEP}
                                    onCheckedChange={(checked) =>
                                        handleFilterChange('showPEP', checked as boolean)
                                    }
                                />
                                <Label htmlFor="filter-pep" className="text-sm cursor-pointer">
                                    PEPs
                                </Label>
                            </div>

                            <div className="filter-item">
                                <Checkbox
                                    id="filter-family"
                                    checked={filters.showFamily}
                                    onCheckedChange={(checked) =>
                                        handleFilterChange('showFamily', checked as boolean)
                                    }
                                />
                                <Label htmlFor="filter-family" className="text-sm cursor-pointer">
                                    Family Members
                                </Label>
                            </div>

                            <div className="filter-item">
                                <Checkbox
                                    id="filter-business"
                                    checked={filters.showBusiness}
                                    onCheckedChange={(checked) =>
                                        handleFilterChange('showBusiness', checked as boolean)
                                    }
                                />
                                <Label htmlFor="filter-business" className="text-sm cursor-pointer">
                                    Business Associates
                                </Label>
                            </div>

                            <div className="filter-item">
                                <Checkbox
                                    id="filter-company"
                                    checked={filters.showCompany}
                                    onCheckedChange={(checked) =>
                                        handleFilterChange('showCompany', checked as boolean)
                                    }
                                />
                                <Label htmlFor="filter-company" className="text-sm cursor-pointer">
                                    Companies
                                </Label>
                            </div>

                            <div className="filter-item">
                                <Checkbox
                                    id="filter-location"
                                    checked={filters.showLocation}
                                    onCheckedChange={(checked) =>
                                        handleFilterChange('showLocation', checked as boolean)
                                    }
                                />
                                <Label htmlFor="filter-location" className="text-sm cursor-pointer">
                                    Locations
                                </Label>
                            </div>
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={resetFilters}
                            className="w-full mt-4"
                        >
                            Reset Filters
                        </Button>
                    </div>
                </PopoverContent>
            </Popover>

            {/* Search */}
            <div className="control-search">
                <Search className="w-4 h-4 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search nodes..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="search-input"
                />
            </div>
        </div>
    );
}
