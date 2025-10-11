
import { Button } from '@/components/ui/button';
import { Save, Edit, Trash2, Share, Calendar, User, Flag } from 'lucide-react';

interface ActivityDetailActionsProps {
  onSave: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onShare: () => void;
  isEditing: boolean;
}

export function ActivityDetailActions({
  onSave,
  onEdit,
  onDelete,
  onShare,
  isEditing
}: ActivityDetailActionsProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {isEditing ? (
        <Button
          onClick={onSave}
          size="sm"
          className="bg-black hover:bg-gray-800 text-white h-8 px-3 text-xs"
        >
          <Save className="mr-1 h-3 w-3" />
          Salvar
        </Button>
      ) : (
        <Button
          onClick={onEdit}
          size="sm"
          className="bg-black hover:bg-gray-800 text-white h-8 px-3 text-xs"
        >
          <Edit className="mr-1 h-3 w-3" />
          Editar
        </Button>
      )}
      
      <Button
        onClick={onShare}
        variant="outline"
        size="sm"
        className="border-black text-black hover:bg-gray-100 h-8 px-3 text-xs"
      >
        <Share className="mr-1 h-3 w-3" />
        Compartilhar
      </Button>
      
      <Button
        onClick={onDelete}
        variant="outline"
        size="sm"
        className="border-red-500 text-red-500 hover:bg-red-50 h-8 px-3 text-xs"
      >
        <Trash2 className="mr-1 h-3 w-3" />
        Excluir
      </Button>
    </div>
  );
}
