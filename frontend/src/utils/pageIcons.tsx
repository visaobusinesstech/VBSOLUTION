import React from 'react';
import {
  Home,
  MessageCircle,
  ClipboardList,
  Calendar,
  TrendingUp,
  PieChart,
  Building2,
  Users,
  Package,
  UserPlus,
  Archive,
  Truck,
  ShoppingCart,
  DollarSign,
  Briefcase,
  UserCheck,
  FolderOpen,
  BarChart3,
  MessageSquare,
  Key,
  Settings
} from 'lucide-react';

// Mapeamento de rotas para ícones
export const pageIcons: Record<string, React.ReactNode> = {
  '/': <Home size={16} />,
  '/feed': <MessageCircle size={16} />,
  '/activities': <ClipboardList size={16} />,
  '/calendar': <Calendar size={16} />,
  '/leads-sales': <TrendingUp size={16} />,
  '/reports-dashboard': <PieChart size={16} />,
  '/companies': <Building2 size={16} />,
  '/employees': <Users size={16} />,
  '/products': <Package size={16} />,
  '/suppliers': <UserPlus size={16} />,
  '/inventory': <Archive size={16} />,
  '/transfers': <Truck size={16} />,
  '/writeoffs': <Archive size={16} />,
  '/sales-orders': <ShoppingCart size={16} />,
  '/sales-funnel': <DollarSign size={16} />,
  '/projects': <Briefcase size={16} />,
  '/work-groups': <UserCheck size={16} />,
  '/files': <FolderOpen size={16} />,
  '/reports': <BarChart3 size={16} />,
  '/chat': <MessageCircle size={16} />,
  '/collaborations': <Users size={16} />,
  '/whatsapp': <MessageSquare size={16} />,
  '/integration': <Key size={16} />,
  '/settings': <Settings size={16} />
};

// Função para obter o ícone da página baseado na rota
export const getPageIcon = (pathname: string): React.ReactNode => {
  // Primeiro, tentar encontrar ícone exato para a rota
  if (pageIcons[pathname]) {
    return pageIcons[pathname];
  }
  
  // Para rotas com parâmetros (como /companies/:id), tentar encontrar a rota base
  const pathSegments = pathname.split('/').filter(Boolean);
  if (pathSegments.length > 0) {
    const basePath = `/${pathSegments[0]}`;
    if (pageIcons[basePath]) {
      return pageIcons[basePath];
    }
  }
  
  // Fallback para ícone padrão
  return <Home size={16} />;
};
