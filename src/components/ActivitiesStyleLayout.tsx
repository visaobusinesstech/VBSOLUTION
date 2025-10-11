import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, Download, Plus, List, Grid, Calendar, Clock, BarChart3, Kanban } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

interface ActivitiesStyleLayoutProps {
  title: string;
  description?: string;
  children: ReactNode;
  onCreateClick?: () => void;
  createButtonText?: string;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  filters?: {
    label: string;
    value: string;
    options: { value: string; label: string }[];
    onChange: (value: string) => void;
  }[];
  stats?: {
    label: string;
    value: string | number;
    color?: string;
  }[];
  viewModes?: {
    value: string;
    label: string;
    icon: ReactNode;
  }[];
  currentViewMode?: string;
  onViewModeChange?: (value: string) => void;
  actions?: ReactNode;
  showAdvancedFilters?: boolean;
  advancedFiltersComponent?: ReactNode;
}

export function ActivitiesStyleLayout({
  title,
  description,
  children,
  onCreateClick,
  createButtonText = "Criar",
  searchPlaceholder = "Buscar...",
  searchValue = "",
  onSearchChange,
  filters = [],
  stats = [],
  viewModes = [],
  currentViewMode,
  onViewModeChange,
  actions,
  showAdvancedFilters = false,
  advancedFiltersComponent
}: ActivitiesStyleLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex flex-col h-full">
        {/* Header Section */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="p-6">
            {/* Top Row */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                
                {onCreateClick && (
                  <Button 
                    variant="primary" 
                    size="md-professional"
                    className="flex items-center gap-2"
                    onClick={onCreateClick}
                  >
                    <Plus className="h-4 w-4" />
                    {createButtonText}
                  </Button>
                )}
              </div>

              {/* Stats */}
              {stats.length > 0 && (
                <div className="flex items-center gap-6">
                  {stats.map((stat, index) => (
                    <div key={index} className="text-center">
                      <div className={`text-2xl font-bold ${stat.color || 'text-blue-600'}`}>
                        {stat.value}
                      </div>
                      <div className="text-xs text-gray-500">{stat.label}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* View Mode Tabs */}
            {viewModes.length > 0 && (
              <Tabs value={currentViewMode} onValueChange={onViewModeChange} className="w-full">
                <ScrollArea>
                  <TabsList className="mb-3 h-auto -space-x-px bg-background p-0 shadow-sm shadow-black/5 rtl:space-x-reverse">
                    {viewModes.map((mode) => (
                      <TabsTrigger
                        key={mode.value}
                        value={mode.value}
                        className="relative overflow-hidden rounded-none border border-border py-2 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 first:rounded-s last:rounded-e data-[state=active]:bg-muted data-[state=active]:after:bg-primary"
                      >
                        {mode.icon}
                        {mode.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>

                {/* Filters Row */}
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-3">
                    {/* Search */}
                    {onSearchChange && (
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder={searchPlaceholder}
                          value={searchValue}
                          onChange={(e) => onSearchChange(e.target.value)}
                          className="pl-10 bg-gray-50 border-gray-200 rounded-md w-64 h-9"
                        />
                      </div>
                    )}
                    
                    {/* Filters */}
                    {filters.map((filter, index) => (
                      <Select key={index} value={filter.value} onValueChange={filter.onChange}>
                        <SelectTrigger className="w-48 border-gray-200 bg-gray-50">
                          <SelectValue placeholder={filter.label} />
                        </SelectTrigger>
                        <SelectContent>
                          {filter.options.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ))}
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    {showAdvancedFilters && advancedFiltersComponent}
                    
                    {actions}
                    
                    <Button variant="outline" className="border-gray-200 hover:bg-gray-50">
                      <Filter className="h-4 w-4 mr-2" />
                      Filtros
                    </Button>
                    <Button variant="outline" className="border-gray-200 hover:bg-gray-50">
                      <Download className="h-4 w-4 mr-2" />
                      Exportar
                    </Button>
                  </div>
                </div>
              </Tabs>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm min-h-[600px]">
            <div className="p-6">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 