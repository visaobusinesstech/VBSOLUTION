
import { Button } from '@/components/ui/button';

interface NavItem {
  id: number;
  title: string;
  url: string;
  dropdown: boolean;
  items?: NavItem[];
}

interface NavBarProps {
  list: NavItem[];
  activeId?: number;
  onItemClick?: (item: NavItem) => void;
}

const NavBar = ({ list, activeId, onItemClick }: NavBarProps) => {
  return (
    <nav className="flex items-center gap-1 bg-gray-100 p-1 rounded-md">
      {list.map((item) => (
        <Button
          key={item.id}
          variant={activeId === item.id ? "default" : "ghost"}
          size="sm"
          onClick={() => onItemClick?.(item)}
          className={`px-3 py-1.5 rounded-md transition-all text-xs h-7 border-none ${
            activeId === item.id 
              ? 'bg-white shadow-sm text-gray-900 font-medium' 
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          {item.title}
        </Button>
      ))}
    </nav>
  );
};

export default NavBar;
