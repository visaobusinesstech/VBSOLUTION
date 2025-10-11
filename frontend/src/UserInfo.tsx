
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const UserInfo = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  if (!user) return null;

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro no logout",
        description: "Ocorreu um erro ao fazer logout.",
        variant: "destructive",
      });
    }
  };

  const initials = user.user_metadata?.name || user.email
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  const displayName = user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário';

  return (
    <Card className="px-3 py-2 bg-white/95 backdrop-blur border-border/50">
      <div className="flex items-center gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={user.user_metadata?.avatar_url} alt={displayName} />
          <AvatarFallback className="bg-vb-primary text-white text-xs">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col flex-1">
          <span className="text-sm font-medium leading-tight">{displayName}</span>
          <span className="text-xs text-muted-foreground leading-tight">{user.email}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          className="h-8 w-8 p-0"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
};

export default UserInfo;
