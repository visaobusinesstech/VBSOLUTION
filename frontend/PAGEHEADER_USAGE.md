# Sistema de PageHeader - Guia de Uso

## Visão Geral

O sistema de PageHeader implementa uma barra horizontal fixa logo abaixo da topbar, similar ao ClickUp, que exibe o título da página atual e botões de ação contextual.

## Características

- ✅ **Fixa abaixo da topbar**: Sempre visível em todas as páginas
- ✅ **Título automático**: Detecta automaticamente o título baseado na rota
- ✅ **Botões dinâmicos**: Diferentes botões para cada página
- ✅ **Estilo ClickUp**: Mesmo visual, tipografia e espaçamento
- ✅ **Fácil personalização**: Múltiplas formas de adicionar/modificar botões

## Como Funciona

### 1. Detecção Automática de Título

O sistema detecta automaticamente o título da página seguindo esta prioridade:

1. **Contexto** (se usando `usePageHeaderConfig`)
2. **Props** (se passado diretamente)
3. **Configuração** (no arquivo `usePageConfig.ts`)
4. **nav-items.tsx** (baseado na rota)
5. **Fallback** ("Página")

### 2. Botões de Ação

Todos os botões seguem o padrão:
- **"Gerenciar cartões"**: Sempre presente (estilo outline)
- **Botões específicos**: Dependem da página (estilo sólido azul)

## Como Personalizar

### Método 1: Configuração Global (Recomendado)

Edite o arquivo `frontend/src/hooks/usePageConfig.ts`:

```typescript
'/sua-rota': {
  title: 'Título da Página',
  actions: [
    {
      label: 'Novo Item',
      onClick: () => navigate('/sua-rota/new'),
      icon: <Plus size={12} />
    },
    {
      label: 'Importar',
      onClick: () => console.log('Importar'),
      icon: <Upload size={12} />,
      variant: 'outline' as const
    }
  ]
}
```

### Método 2: Context Hook (Para casos específicos)

Em qualquer página, use o hook `usePageHeaderConfig`:

```typescript
import { usePageHeaderConfig } from '@/contexts/PageHeaderContext';
import { Plus } from 'lucide-react';

export default function MinhaPage() {
  usePageHeaderConfig({
    title: 'Título Customizado',
    actions: [
      {
        label: 'Ação Especial',
        onClick: () => alert('Ação executada!'),
        icon: <Plus size={12} />
      }
    ]
  });

  return (
    <div>Conteúdo da página</div>
  );
}
```

### Método 3: Props Diretas (Raramente usado)

```typescript
<PageHeader 
  title="Título Manual"
  actions={[
    {
      label: 'Botão Manual',
      onClick: () => console.log('Clicado')
    }
  ]}
/>
```

## Exemplos Práticos

### Página com Múltiplos Botões

```typescript
'/products': {
  title: 'Produtos',
  actions: [
    {
      label: 'Novo Produto',
      onClick: () => navigate('/products/new'),
      icon: <Package size={12} />
    },
    {
      label: 'Importar',
      onClick: () => openImportModal(),
      icon: <Upload size={12} />,
      variant: 'outline' as const
    },
    {
      label: 'Exportar',
      onClick: () => exportProducts(),
      icon: <Download size={12} />,
      variant: 'outline' as const
    }
  ]
}
```

### Página com Título Dinâmico

```typescript
export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);

  usePageHeaderConfig({
    title: product ? `Produto: ${product.name}` : 'Carregando...',
    actions: [
      {
        label: 'Editar',
        onClick: () => navigate(`/products/${id}/edit`),
        icon: <Edit size={12} />
      }
    ]
  });

  // ... resto do componente
}
```

## Estilos Disponíveis

### Variantes de Botão

- **`default`**: Botão azul sólido (padrão)
- **`outline`**: Botão com borda cinza
- **`secondary`**: Botão cinza sólido

### Tamanhos de Ícone

Use sempre `size={12}` para ícones para manter consistência.

## Estrutura Atual

```
frontend/src/
├── components/
│   └── PageHeader.tsx          # Componente principal
├── hooks/
│   └── usePageConfig.ts        # Configurações por página
├── contexts/
│   └── PageHeaderContext.tsx   # Context para uso dinâmico
└── Layout.tsx                  # Integração no layout
```

## Troubleshooting

### Título não aparece
- Verifique se a rota está mapeada em `nav-items.tsx`
- Adicione configuração em `usePageConfig.ts`

### Botões não funcionam
- Verifique se a função `onClick` está correta
- Teste com `console.log` primeiro

### Estilo não aplicado
- Verifique se as classes Tailwind estão corretas
- O z-index da barra é `z-20`

## Próximos Passos

Para adicionar uma nova página:

1. Adicione a rota em `nav-items.tsx`
2. Configure título e botões em `usePageConfig.ts`
3. Teste a navegação

O sistema está pronto e funcionando! 🎉
