
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';

interface ConfigurationsDropdownProps {
  onConfigClick?: () => void;
}

export function ConfigurationsDropdown({ onConfigClick }: ConfigurationsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const configOptions = [
    'Configurar exibição de campos do formulário',
    'Configurar criação de campos do formulário',
    'Configurações de Kanban',
    'Importar negócios',
    'Migrar de outro CRM',
    'Soluções predefinidas',
    'Modo CRM',
    'CRM proativo',
    'Permissões de Acesso',
    'Ocultar bloco do Contact Center'
  ];

  return (
    <div className="relative">
      <Button 
        variant="ghost" 
        size="sm" 
        className="p-1.5"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Settings className="h-4 w-4 text-gray-500" />
      </Button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 min-w-[320px]">
            <div className="py-2">
              {configOptions.map((option, index) => (
                <button
                  key={index}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => {
                    setIsOpen(false);
                    if (onConfigClick) onConfigClick();
                  }}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
