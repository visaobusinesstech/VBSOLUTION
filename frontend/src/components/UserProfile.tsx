import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { LogOut, Building2, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserCompanyProfile } from '@/hooks/useUserCompanyProfile';
import { useToast } from '@/hooks/use-toast';

interface UserProfileProps {
  variant?: 'sidebar' | 'header' | 'compact';
  showCompanyInfo?: boolean;
  showLogoutButton?: boolean;
}

const UserProfile: React.FC<UserProfileProps> = ({ 
  variant = 'sidebar', 
  showCompanyInfo = true, 
  showLogoutButton = true 
}) => {
  const { signOut } = useAuth();
  const { 
    companyName, 
    companyLogo, 
    userName, 
    userEmail, 
    userAvatar, 
    userInitials, 
    loading 
  } = useUserCompanyProfile();
  const { toast } = useToast();

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

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2">
        <Avatar className="h-8 w-8">
          <AvatarImage src={userAvatar || undefined} alt={userName} />
          <AvatarFallback className="bg-blue-600 text-white text-xs font-medium">
            {userInitials}
          </AvatarFallback>
        </Avatar>
        <span className="text-sm font-medium text-gray-900 hidden sm:block">
          {userName}
        </span>
      </div>
    );
  }

  if (variant === 'header') {
    return (
      <div className="flex items-center gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={userAvatar || undefined} alt={userName} />
          <AvatarFallback className="bg-blue-600 text-white text-xs font-medium">
            {userInitials}
          </AvatarFallback>
        </Avatar>
        <div className="hidden sm:block">
          <div className="text-sm font-medium text-gray-900">
            {userName}
          </div>
          <div className="text-xs text-gray-500">
            {userEmail}
          </div>
        </div>
        {showLogoutButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="h-8 w-8 p-0 hover:bg-gray-100"
            title="Sair"
          >
            <LogOut className="h-4 w-4 text-gray-500" />
          </Button>
        )}
      </div>
    );
  }

  // Variant 'sidebar' (padrão)
  return (
    <div className="space-y-4">
      {/* Logo e nome da empresa */}
      {showCompanyInfo && (
        <div className="flex items-center gap-3">
          {companyLogo ? (
            <img 
              src={companyLogo} 
              alt={companyName}
              className="h-10 w-10 rounded-lg object-cover border border-gray-200"
            />
          ) : (
            <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center border border-gray-200">
              <Building2 className="h-6 w-6 text-white" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold text-gray-900 truncate">
              {loading ? 'Carregando...' : companyName}
            </h1>
            <p className="text-sm text-gray-500">Sistema de Gestão</p>
          </div>
        </div>
      )}

      {/* Perfil do usuário */}
      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
        <Avatar className="h-10 w-10">
          <AvatarImage src={userAvatar || undefined} alt={userName} />
          <AvatarFallback className="bg-blue-600 text-white text-sm font-medium">
            {userInitials}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col flex-1 min-w-0">
          <span className="text-sm font-medium text-gray-900 truncate">
            {userName}
          </span>
          <span className="text-xs text-gray-500 truncate">
            {userEmail}
          </span>
        </div>
        {showLogoutButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="h-8 w-8 p-0 hover:bg-gray-200 flex-shrink-0"
            title="Sair"
          >
            <LogOut className="h-4 w-4 text-gray-500" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
