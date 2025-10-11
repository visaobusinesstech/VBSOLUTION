
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Check, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface QuickTaskCreatorProps {
  onCreateTask: (title: string, status: string) => void;
  status: string;
}

const QuickTaskCreator = ({
  onCreateTask,
  status
}: QuickTaskCreatorProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (taskTitle.trim()) {
      onCreateTask(taskTitle, status);
      setTaskTitle('');
      setIsExpanded(false);
      toast({
        title: "Tarefa criada",
        description: "Nova tarefa foi adicionada com sucesso"
      });
    }
  };

  const handleCancel = () => {
    setTaskTitle('');
    setIsExpanded(false);
  };

  // Component is now empty - removed quick task functionality
  return null;
};

export default QuickTaskCreator;
