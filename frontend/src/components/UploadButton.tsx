import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { ExcelImportModal, ImportableEntity } from './ExcelImportModal';
import { EXCEL_IMPORT_MAPPINGS } from '@/config/excelImportMappings';

interface UploadButtonProps {
  onClick?: () => void;
  className?: string;
  title?: string;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'sm' | 'default' | 'lg';
  entityType?: ImportableEntity;
  onImportComplete?: (data: any[]) => Promise<void>;
}

export function UploadButton({ 
  onClick, 
  className = '', 
  title = 'Importar planilha Excel',
  variant = 'ghost',
  size = 'sm',
  entityType,
  onImportComplete
}: UploadButtonProps) {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (entityType && onImportComplete) {
      setIsImportModalOpen(true);
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={`h-8 w-8 p-0 hover:bg-gray-100 rounded-full transition-colors ${className}`}
        onClick={handleClick}
        title={title}
      >
        <Upload className="h-4 w-4 text-gray-700" />
      </Button>

      {entityType && onImportComplete && (
        <ExcelImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          entityType={entityType}
          fieldMappings={EXCEL_IMPORT_MAPPINGS[entityType]}
          onImport={onImportComplete}
        />
      )}
    </>
  );
}
