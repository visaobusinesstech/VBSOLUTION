
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bell, HelpCircle, User } from 'lucide-react';
import { Link } from 'react-router-dom';

export function RightMenu() {
  return (
    <div className="flex items-center gap-2">
      <Button 
        variant="ghost"
        size="sm"
        className="text-white bg-transparent hover:bg-white/10 border border-white/20 p-2"
      >
        <Bell className="h-4 w-4" />
      </Button>

      <Button 
        variant="ghost"
        size="sm"
        asChild
        className="text-white bg-transparent hover:bg-white/10 border border-white/20 p-2"
      >
        <Link to="/settings">
          <HelpCircle className="h-4 w-4" />
        </Link>
      </Button>

      <Link to="/settings">
        <Avatar className="h-8 w-8 ring-2 ring-white/30 cursor-pointer hover:ring-white/50 transition-all">
          <AvatarImage src="/placeholder.svg" alt="Ana Laura Lima" />
          <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white text-sm font-semibold">
            AL
          </AvatarFallback>
        </Avatar>
      </Link>
    </div>
  );
}
