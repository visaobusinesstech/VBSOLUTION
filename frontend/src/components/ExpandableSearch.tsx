
import { useState } from 'react';
import { Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface ExpandableSearchProps {
  placeholder: string;
  onSearch: (value: string) => void;
  searchValue: string;
}

const ExpandableSearch = ({ placeholder, onSearch, searchValue }: ExpandableSearchProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSearchClick = () => {
    setIsExpanded(true);
  };

  const handleBlur = () => {
    if (!searchValue) {
      setIsExpanded(false);
    }
  };

  return (
    <div className="relative">
      {!isExpanded ? (
        <button
          onClick={handleSearchClick}
          className="h-9 w-9 rounded-md border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 transition-colors"
          title={placeholder}
        >
          <Search className="h-4 w-4 text-gray-400" />
        </button>
      ) : (
        <div className="relative animate-in slide-in-from-left-2">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder={placeholder}
            value={searchValue}
            onChange={(e) => onSearch(e.target.value)}
            onBlur={handleBlur}
            className="pl-10 bg-white border-gray-200 rounded-md w-64 h-9 focus:w-80 transition-all duration-200"
            autoFocus
          />
        </div>
      )}
    </div>
  );
};

export default ExpandableSearch;
