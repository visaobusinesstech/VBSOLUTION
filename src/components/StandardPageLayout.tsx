import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, Download, Plus } from 'lucide-react';

interface StandardPageLayoutProps {
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
  viewModeToggle?: {
    value: 'list' | 'grid';
    onChange: (value: 'list' | 'grid') => void;
  };
  actions?: ReactNode;
}

export function StandardPageLayout({
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
  viewModeToggle,
  actions
}: StandardPageLayoutProps) {
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

            {/* Filters Row */}
            {(onSearchChange || filters.length > 0 || viewModeToggle || actions) && (
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
                <div className="flex items-center gap-2">
                  {viewModeToggle && (
                    <div className="flex items-center bg-gray-100 rounded-lg p-1">
                      <Button
                        variant={viewModeToggle.value === 'list' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => viewModeToggle.onChange('list')}
                        className={viewModeToggle.value === 'list' ? 'bg-black text-white' : 'text-gray-700'}
                      >
                        Lista
                      </Button>
                      <Button
                        variant={viewModeToggle.value === 'grid' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => viewModeToggle.onChange('grid')}
                        className={viewModeToggle.value === 'grid' ? 'bg-black text-white' : 'text-gray-700'}
                      >
                        Grade
                      </Button>
                    </div>
                  )}
                  
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