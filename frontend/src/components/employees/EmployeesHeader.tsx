
import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  Save, 
  Download, 
  RefreshCw,
  LayoutDashboard,
  List
} from 'lucide-react';

interface EmployeesHeaderProps {
  activeTab: string;
  viewMode: 'canvas' | 'manual';
  onViewModeChange: (mode: 'canvas' | 'manual') => void;
  onSave: () => void;
  onRefresh: () => void;
  onExport: () => void;
  onAddNew: () => void;
  isLoading?: boolean;
  orgNodesCount: number;
}

const EmployeesHeader = ({
  activeTab,
  viewMode,
  onViewModeChange,
  onSave,
  onRefresh,
  onExport,
  onAddNew,
  isLoading = false,
  orgNodesCount
}: EmployeesHeaderProps) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestão de Pessoal</h1>
        <p className="text-muted-foreground">
          Gerencie funcionários e estrutura organizacional
        </p>
      </div>
      <div className="flex gap-2">
        {activeTab === 'structure' && (
          <>
            <div className="flex gap-2 mr-4">
              <Button
                variant={viewMode === 'canvas' ? 'default' : 'outline'}
                onClick={() => onViewModeChange('canvas')}
                size="sm"
              >
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Modo Diagrama
              </Button>
              <Button
                variant={viewMode === 'manual' ? 'default' : 'outline'}
                onClick={() => onViewModeChange('manual')}
                size="sm"
              >
                <List className="mr-2 h-4 w-4" />
                Modo Hierárquico
              </Button>
            </div>
            <Button 
              variant="outline" 
              onClick={onRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button 
              variant="outline" 
              onClick={onExport}
              disabled={orgNodesCount === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
            <Button 
              variant="outline" 
              onClick={onSave}
              disabled={isLoading}
            >
              <Save className="mr-2 h-4 w-4" />
              Salvar Estrutura
            </Button>
          </>
        )}
        <Button onClick={onAddNew} className="vb-button-primary">
          <Plus className="mr-2 h-4 w-4" />
          {activeTab === 'employees' ? 'Novo Funcionário' : 'Novo Item'}
        </Button>
      </div>
    </div>
  );
};

export default EmployeesHeader;
