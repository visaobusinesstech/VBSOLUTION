import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { navItems } from '@/nav-items';

export const usePageTitle = () => {
  const location = useLocation();

  useEffect(() => {
    const currentPath = location.pathname;
    
    // Casos especiais
    if (currentPath === '/login') {
      document.title = 'VBSolution | Login';
      return;
    }
    
    // Encontrar o item de navegação correspondente ao caminho atual
    const navItem = navItems.find(item => item.to === currentPath);
    
    if (navItem) {
      // Definir o título da página como "VBSolution | [Nome da Página]"
      document.title = `VBSolution | ${navItem.title}`;
    } else {
      // Para rotas com parâmetros (como /companies/:id), tentar encontrar a rota base
      const pathSegments = currentPath.split('/').filter(Boolean);
      if (pathSegments.length > 0) {
        const basePath = `/${pathSegments[0]}`;
        const baseNavItem = navItems.find(item => item.to === basePath);
        
        if (baseNavItem) {
          // Para rotas com ID, adicionar "Detalhes" ao título
          if (pathSegments.length > 1 && pathSegments[1]) {
            document.title = `VBSolution | ${baseNavItem.title} - Detalhes`;
          } else {
            document.title = `VBSolution | ${baseNavItem.title}`;
          }
        } else {
          // Fallback para rotas não mapeadas
          document.title = 'VBSolution';
        }
      } else {
        // Fallback para rotas não mapeadas
        document.title = 'VBSolution';
      }
    }
  }, [location.pathname]);
};
