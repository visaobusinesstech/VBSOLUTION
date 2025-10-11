
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X } from 'lucide-react';

interface ColumnOption {
  id: string;
  label: string;
  checked: boolean;
}

interface ColumnSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedColumns: string[];
  onColumnsChange: (columns: string[]) => void;
}

const ColumnSelector = ({ open, onOpenChange, selectedColumns, onColumnsChange }: ColumnSelectorProps) => {
  const [tempSelection, setTempSelection] = useState<string[]>(selectedColumns);

  const columnOptions: ColumnOption[] = [
    { id: 'id', label: 'ID', checked: tempSelection.includes('id') },
    { id: 'nome', label: 'Nome', checked: tempSelection.includes('nome') },
    { id: 'atividade', label: 'Atividade', checked: tempSelection.includes('atividade') },
    { id: 'prazo-final', label: 'Prazo final', checked: tempSelection.includes('prazo-final') },
    { id: 'criado-por', label: 'Criado por', checked: tempSelection.includes('criado-por') },
    { id: 'responsavel', label: 'Responsável', checked: tempSelection.includes('responsavel') },
    { id: 'status', label: 'Status', checked: tempSelection.includes('status') },
    { id: 'projeto', label: 'Projeto', checked: tempSelection.includes('projeto') },
    { id: 'fluxo', label: 'Fluxo', checked: tempSelection.includes('fluxo') },
    { id: 'criado-em', label: 'Criado em', checked: tempSelection.includes('criado-em') },
    { id: 'modificado-em', label: 'Modificado em', checked: tempSelection.includes('modificado-em') },
    { id: 'fechado-em', label: 'Fechado em', checked: tempSelection.includes('fechado-em') },
    { id: 'tempo-necessario', label: 'Tempo necessário estimado', checked: tempSelection.includes('tempo-necessario') },
    { id: 'controlar-tempo', label: 'Controlar tempo gasto', checked: tempSelection.includes('controlar-tempo') },
    { id: 'avaliacao', label: 'Avaliação', checked: tempSelection.includes('avaliacao') },
    { id: 'responsavel-alterar', label: 'O responsável pode alterar o prazo', checked: tempSelection.includes('responsavel-alterar') },
    { id: 'duracao-efetiva', label: 'Duração efetiva', checked: tempSelection.includes('duracao-efetiva') },
    { id: 'concluida', label: 'Concluída', checked: tempSelection.includes('concluida') },
    { id: 'marcadores', label: 'Marcadores', checked: tempSelection.includes('marcadores') },
    { id: 'lead', label: 'Lead', checked: tempSelection.includes('lead') },
    { id: 'contato', label: 'Contato', checked: tempSelection.includes('contato') },
    { id: 'empresa', label: 'Empresa', checked: tempSelection.includes('empresa') },
    { id: 'negocio', label: 'Negócio', checked: tempSelection.includes('negocio') },
    { id: 'itens-crm', label: 'Itens de CRM', checked: tempSelection.includes('itens-crm') }
  ];

  const handleColumnToggle = (columnId: string) => {
    setTempSelection(prev => 
      prev.includes(columnId) 
        ? prev.filter(id => id !== columnId)
        : [...prev, columnId]
    );
  };

  const handleApply = () => {
    onColumnsChange(tempSelection);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setTempSelection(selectedColumns);
    onOpenChange(false);
  };

  const handleSelectAll = () => {
    setTempSelection(columnOptions.map(col => col.id));
  };

  const handleSelectNone = () => {
    setTempSelection([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-white">
        <DialogHeader className="flex flex-row items-center justify-between pb-4 border-b">
          <DialogTitle className="text-lg font-medium text-gray-900">
            Listar configurações de visualização «Minhas Tarefas»
          </DialogTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onOpenChange(false)}
            className="p-1 h-auto"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="py-6">
          <div className="grid grid-cols-3 gap-6">
            {columnOptions.map((column) => (
              <div key={column.id} className="flex items-center space-x-3">
                <Checkbox
                  id={column.id}
                  checked={tempSelection.includes(column.id)}
                  onCheckedChange={() => handleColumnToggle(column.id)}
                  className="h-4 w-4"
                />
                <label 
                  htmlFor={column.id} 
                  className="text-sm text-gray-700 cursor-pointer flex-1"
                >
                  {column.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-6 border-t">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500 flex items-center gap-2">
              ⚙️ Padrão
            </span>
            <div className="flex items-center gap-2">
              <Checkbox className="h-4 w-4" />
              <span className="text-sm text-gray-700">Aplicar para todos os usuários</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button 
              variant="link" 
              size="sm" 
              onClick={handleSelectAll}
              className="text-blue-600 hover:text-blue-800 p-0 h-auto"
            >
              Selecionar todos
            </Button>
            <Button 
              variant="link" 
              size="sm" 
              onClick={handleSelectNone}
              className="text-blue-600 hover:text-blue-800 p-0 h-auto"
            >
              Selecionar nenhum
            </Button>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6">
          <Button 
            variant="outline" 
            onClick={handleCancel}
            className="px-8"
          >
            CANCELAR
          </Button>
          <Button 
            onClick={handleApply}
            className="px-8 bg-lime-400 hover:bg-lime-500 text-black font-medium"
          >
            APLICAR
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ColumnSelector;
