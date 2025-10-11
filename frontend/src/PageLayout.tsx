import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, AlignJustify } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ExpandableSearch from './ExpandableSearch';
import { useSidebar } from '@/contexts/SidebarContext';

interface PageLayoutProps {
  title: string;
  children: ReactNode;
  tabs?: {
    value: string;
    label: string;
    icon: ReactNode;
  }[];
  onTabChange?: (value: string) => void;
  activeTab?: string;
  onCreateClick?: () => void;
  createButtonText?: string;
  searchPlaceholder?: string;
  onSearch?: (value: string) => void;
  searchValue?: string;
  filters?: ReactNode;
  showSearch?: boolean;
}

const PageLayout = ({
  title,
  children,
  tabs,
  onTabChange,
  activeTab,
  onCreateClick,
  createButtonText = "Criar",
  searchPlaceholder = "Buscar...",
  onSearch,
  searchValue = "",
  filters,
  showSearch = true
}: PageLayoutProps) => {
  const { sidebarExpanded, setSidebarExpanded, showMenuButtons, expandSidebarFromMenu } = useSidebar();
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
              </div>
            </div>

            {/* Tabs Section */}
            {tabs && onTabChange && typeof activeTab === 'string' && (
              <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {/* Botão fixo de toggle da sidebar - ao lado esquerdo das abas */}
                    {showMenuButtons && !sidebarExpanded && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-8 h-8 p-0 text-gray-600 hover:bg-gray-100 rounded transition-all duration-200 flex-shrink-0"
                        onClick={expandSidebarFromMenu}
                        title="Expandir barra lateral"
                      >
                        <AlignJustify size={16} />
                      </Button>
                    )}
                    
                    <ScrollArea>
                      <TabsList className="h-auto -space-x-px bg-background p-0 shadow-sm shadow-black/5 rtl:space-x-reverse">
                        {tabs.map((tab) => (
                          <TabsTrigger
                            key={tab.value}
                            value={tab.value}
                            className="relative overflow-hidden rounded-none border border-border py-2 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 first:rounded-s last:rounded-e data-[state=active]:bg-muted data-[state=active]:after:bg-primary"
                          >
                            <span className="opacity-60 mr-1.5">
                              {tab.icon}
                            </span>
                            {tab.label}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                      <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                  </div>
                  
                  {/* Create Button - Posicionado na mesma linha dos tabs */}
                  {onCreateClick && (
                    <Button 
                      size="md-professional"
                      className="flex items-center gap-2 text-white ml-4"
                      style={{ backgroundColor: '#021529' }}
                      onClick={onCreateClick}
                    >
                      <Plus className="h-4 w-4" />
                      {createButtonText}
                    </Button>
                  )}
                </div>

                {/* Filters Row */}
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-3">
                    {/* Search */}
                    {showSearch && onSearch && (
                      <ExpandableSearch
                        placeholder={searchPlaceholder}
                        onSearch={onSearch}
                        searchValue={searchValue}
                      />
                    )}
                  </div>
                  
                  {/* Right side with Advanced Filters */}
                  <div className="flex items-center gap-3">
                    {/* Advanced Filters */}
                    {filters && (
                      <div className="flex items-center gap-3">
                        {filters}
                      </div>
                    )}
                  </div>
                </div>
              </Tabs>
            )}

            {/* No Tabs - Just Search and Filters */}
            {!tabs && (
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-3">
                  {/* Botão fixo de toggle da sidebar - ao lado esquerdo quando não há abas */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-8 h-8 p-0 text-gray-600 hover:bg-gray-100 rounded transition-all duration-200 flex-shrink-0"
                    onClick={() => setSidebarExpanded(!sidebarExpanded)}
                    title={sidebarExpanded ? "Minimizar barra lateral" : "Expandir barra lateral"}
                  >
                    <AlignJustify size={16} />
                  </Button>
                  
                  {/* Search */}
                  {showSearch && onSearch && (
                    <ExpandableSearch
                      placeholder={searchPlaceholder}
                      onSearch={onSearch}
                      searchValue={searchValue}
                    />
                  )}
                </div>
                
                {/* Right side with Create Button and Advanced Filters */}
                <div className="flex items-center gap-3">
                  {/* Create Button */}
                  {onCreateClick && (
                    <Button 
                      size="md-professional"
                      className="flex items-center gap-2 text-white"
                      style={{ backgroundColor: '#021529' }}
                      onClick={onCreateClick}
                    >
                      <Plus className="h-4 w-4" />
                      {createButtonText}
                    </Button>
                  )}
                  
                  {/* Advanced Filters */}
                  {filters && (
                    <div className="flex items-center gap-3">
                      {filters}
                    </div>
                  )}
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
};

export default PageLayout; 
