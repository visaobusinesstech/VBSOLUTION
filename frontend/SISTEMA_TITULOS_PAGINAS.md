# Sistema de Títulos das Páginas - VBSolution

## Visão Geral

Este sistema atualiza automaticamente o título da guia do navegador para cada página do sistema, seguindo o padrão:

**"VBSolution | [Nome da Página]"**

## Como Funciona

### 1. Hook Personalizado (`usePageTitle`)

O hook `usePageTitle` é responsável por:
- Monitorar mudanças na rota atual
- Mapear a rota para o título correspondente
- Atualizar `document.title` automaticamente

### 2. Mapeamento de Rotas

O sistema usa o arquivo `nav-items.tsx` para mapear rotas aos títulos:
- Cada item de navegação tem um `title` e um `to` (rota)
- O sistema encontra a rota correspondente e usa o título

### 3. Integração no App

O hook é integrado no `App.tsx` através do componente `PageTitleManager`, que:
- É renderizado dentro do `BrowserRouter`
- Monitora todas as mudanças de rota
- Atualiza os títulos automaticamente

## Exemplos de Títulos

### Páginas Principais
- `/` → "VBSolution | Dashboard"
- `/activities` → "VBSolution | Atividades"
- `/companies` → "VBSolution | Empresas"
- `/products` → "VBSolution | Produtos"
- `/suppliers` → "VBSolution | Fornecedores"

### Páginas de Detalhes
- `/activities/123` → "VBSolution | Atividades - Detalhes"
- `/companies/456` → "VBSolution | Empresas - Detalhes"
- `/projects/789` → "VBSolution | Projetos - Detalhes"

### Casos Especiais
- `/login` → "VBSolution | Login"
- Rotas não mapeadas → "VBSolution"

## Estrutura dos Arquivos

```
frontend/src/
├── hooks/
│   └── usePageTitle.ts          # Hook principal
├── nav-items.tsx                # Mapeamento de rotas
└── App.tsx                      # Integração do sistema
```

## Adicionando Novas Páginas

Para adicionar uma nova página com título personalizado:

1. **Adicione a rota no `App.tsx`**
2. **Adicione o item no `nav-items.tsx`**:
   ```tsx
   {
     title: "Nova Página",
     to: "/nova-pagina",
     icon: IconComponent,
   }
   ```

3. **O título será automaticamente**: "VBSolution | Nova Página"

## Vantagens

- ✅ **Automático**: Não precisa configurar manualmente cada página
- ✅ **Consistente**: Padrão uniforme em todo o sistema
- ✅ **Manutenível**: Centralizado em um único hook
- ✅ **SEO-friendly**: Títulos descritivos para cada página
- ✅ **UX**: Usuários sabem em qual página estão pela guia

## Tecnologias Utilizadas

- **React Router**: Para navegação e mudança de rotas
- **React Hooks**: `useEffect` para monitorar mudanças
- **TypeScript**: Tipagem para segurança do código

## Testando

Para testar o sistema:

1. Navegue entre as páginas usando o menu lateral
2. Verifique se o título da guia muda automaticamente
3. Teste rotas com parâmetros (ex: `/companies/123`)
4. Verifique se rotas não mapeadas mostram "VBSolution"

## Troubleshooting

### Título não está mudando?
- Verifique se a rota está mapeada em `nav-items.tsx`
- Confirme se o `PageTitleManager` está renderizado no `App.tsx`
- Verifique o console para erros

### Título incorreto?
- Verifique se o `title` no `nav-items.tsx` está correto
- Confirme se a rota (`to`) está correta
- Verifique se há conflitos de roteamento

