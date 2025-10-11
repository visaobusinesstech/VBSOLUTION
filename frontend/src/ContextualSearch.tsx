
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Search, Filter } from 'lucide-react';
import { useLocation } from 'react-router-dom';

interface ContextualSearchProps {
  onSearch: (term: string) => void;
  placeholder?: string;
}

const ContextualSearch = ({ onSearch, placeholder }: ContextualSearchProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const location = useLocation();

  const getPlaceholder = () => {
    if (placeholder) return placeholder;
    
    const path = location.pathname;
    if (path.includes('/activities')) return 'Buscar atividades...';
    if (path.includes('/companies')) return 'Buscar empresas...';
    if (path.includes('/employees')) return 'Buscar funcionários...';
    if (path.includes('/sales-funnel')) return 'Buscar no funil...';
    if (path.includes('/products')) return 'Buscar produtos...';
    if (path.includes('/calendar')) return 'Buscar eventos...';
    return 'Buscar...';
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    onSearch(value);
  };

  return (
    <div className="relative w-full max-w-sm">
      <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
      <Input
        type="text"
        placeholder={getPlaceholder()}
        value={searchTerm}
        onChange={(e) => handleSearch(e.target.value)}
        className="pl-10 bg-white/95 backdrop-blur border-gray-300 focus:border-blue-500 rounded-lg text-sm h-9"
      />
    </div>
  );
};

export default ContextualSearch;
