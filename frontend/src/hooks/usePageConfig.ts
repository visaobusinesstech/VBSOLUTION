import { useLocation, useNavigate } from 'react-router-dom';

interface PageAction {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'secondary' | 'outline';
  iconName?: string; // Mudando para nome do ícone em string
}

interface PageConfig {
  title?: string;
  actions?: PageAction[];
}

// Função para obter configurações específicas por página
const getPageConfigs = (navigate: ReturnType<typeof useNavigate>): Record<string, PageConfig> => ({
  '/': {
    title: 'Início',
    actions: []
  },
  '/activities': {
    title: 'Atividades',
    actions: [
      {
        label: 'Adicionar Tarefa',
        onClick: () => console.log('Adicionar tarefa'),
        iconName: 'Plus'
      }
    ]
  },
  '/projects': {
    title: 'Projetos',
    actions: [
      {
        label: 'Criar Projeto',
        onClick: () => console.log('Criar projeto'),
        iconName: 'Plus'
      }
    ]
  },
  '/companies': {
    title: 'Empresas',
    actions: [
      {
        label: 'Nova Empresa',
        onClick: () => navigate('/companies/new'),
        iconName: 'Building2'
      },
      {
        label: 'Importar',
        onClick: () => console.log('Importar empresas'),
        iconName: 'Upload',
        variant: 'outline' as const
      }
    ]
  },
  '/employees': {
    title: 'Colaboradores',
    actions: [
      {
        label: 'Novo Colaborador',
        onClick: () => console.log('Criar colaborador'),
        iconName: 'Users'
      }
    ]
  },
  '/products': {
    title: 'Produtos',
    actions: [
      {
        label: 'Novo Produto',
        onClick: () => console.log('Criar produto'),
        iconName: 'Package'
      },
      {
        label: 'Importar',
        onClick: () => console.log('Importar produtos'),
        iconName: 'Upload',
        variant: 'outline' as const
      }
    ]
  },
  '/suppliers': {
    title: 'Fornecedores',
    actions: [
      {
        label: 'Novo Fornecedor',
        onClick: () => console.log('Criar fornecedor'),
        iconName: 'Plus'
      }
    ]
  },
  '/inventory': {
    title: 'Estoque',
    actions: [
      {
        label: 'Ajuste de Estoque',
        onClick: () => console.log('Ajustar estoque'),
        iconName: 'Settings'
      },
      {
        label: 'Exportar',
        onClick: () => console.log('Exportar estoque'),
        iconName: 'Download',
        variant: 'outline' as const
      }
    ]
  },
  '/sales-orders': {
    title: 'Pedidos de Venda',
    actions: [
      {
        label: 'Novo Pedido',
        onClick: () => console.log('Criar pedido'),
        iconName: 'Plus'
      }
    ]
  },
  '/contacts': {
    title: 'Contatos',
    actions: [
      {
        label: 'Novo Contato',
        onClick: () => console.log('Criar contato'),
        iconName: 'Plus'
      }
    ]
  },
  '/settings': {
    title: 'Configurações',
    actions: [
      {
        label: 'Backup',
        onClick: () => console.log('Fazer backup'),
        iconName: 'Download',
        variant: 'outline' as const
      }
    ]
  },
  '/leads-sales': {
    title: 'Leads e Vendas', 
    actions: [
      {
        label: 'Novo Lead',
        onClick: () => console.log('Criar novo lead'),
        iconName: 'Plus'
      }
    ]
  },
  '/work-groups': {
    title: 'Grupos de Trabalho',
    actions: [
      {
        label: 'Novo Grupo',
        onClick: () => console.log('Criar grupo de trabalho'),
        iconName: 'Users'
      }
    ]
  }
});

export function usePageConfig(): PageConfig | undefined {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  
  const pageConfigs = getPageConfigs(navigate);
  
  // Primeiro, tentar encontrar configuração exata para a rota
  if (pageConfigs[currentPath]) {
    return pageConfigs[currentPath];
  }
  
  // Para rotas com parâmetros (como /companies/:id), tentar encontrar a rota base
  const pathSegments = currentPath.split('/').filter(Boolean);
  if (pathSegments.length > 0) {
    const basePath = `/${pathSegments[0]}`;
    if (pageConfigs[basePath]) {
      // Para páginas de detalhes, modificar o título
      if (pathSegments.length > 1 && pathSegments[1]) {
        const baseConfig = pageConfigs[basePath];
        return {
          ...baseConfig,
          title: baseConfig.title ? `${baseConfig.title} - Detalhes` : undefined,
          actions: [] // Páginas de detalhes geralmente não têm as mesmas ações
        };
      }
      return pageConfigs[basePath];
    }
  }
  
  return undefined;
}
