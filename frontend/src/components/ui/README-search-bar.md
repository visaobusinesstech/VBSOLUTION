# SearchBar Component

Um componente de busca interativo e animado construído com React, TypeScript, Tailwind CSS e Framer Motion.

## ✨ Funcionalidades

- **Animações Suaves**: Efeitos visuais com Framer Motion
- **Sugestões Automáticas**: Lista de sugestões baseada na digitação
- **Efeitos Visuais**: Partículas animadas e efeitos gooey
- **Responsivo**: Funciona em desktop e mobile
- **Acessível**: Suporte completo a acessibilidade
- **Tema Escuro**: Suporte nativo ao modo escuro

## 📦 Dependências

O componente já está configurado no projeto com as seguintes dependências:

```json
{
  "framer-motion": "^12.23.12",
  "lucide-react": "^0.294.0"
}
```

## 🚀 Uso Básico

```tsx
import { SearchBar } from "@/components/ui/search-bar";

function MyComponent() {
  const handleSearch = (query: string) => {
    console.log("Pesquisa:", query);
    // Implementar lógica de busca
  };

  return (
    <SearchBar 
      placeholder="Digite para pesquisar..." 
      onSearch={handleSearch}
    />
  );
}
```

## 📋 Props

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `placeholder` | `string` | `"Search..."` | Texto do placeholder |
| `onSearch` | `(query: string) => void` | `undefined` | Callback chamado ao submeter a busca |

## 🎨 Customização

### Cores e Estilos

O componente usa classes Tailwind CSS e pode ser customizado:

```tsx
// Personalizar sugestões
const SUGGESTIONS = [
  "Atividade 1",
  "Projeto 2", 
  "Cliente 3",
  // ... suas sugestões
];

// Personalizar placeholder
<SearchBar 
  placeholder="Buscar no sistema..." 
  onSearch={handleSearch}
/>
```

### Integração com Dados

```tsx
function ActivitiesSearch() {
  const [activities, setActivities] = useState([]);
  
  const handleSearch = async (query: string) => {
    // Buscar em dados reais
    const results = await searchActivities(query);
    setActivities(results);
  };

  return (
    <div>
      <SearchBar 
        placeholder="Buscar atividades..." 
        onSearch={handleSearch}
      />
      {/* Renderizar resultados */}
    </div>
  );
}
```

## 🔧 Implementação Avançada

### Com Estado de Carregamento

```tsx
function AdvancedSearch() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState([]);

  const handleSearch = async (query: string) => {
    setIsLoading(true);
    try {
      const data = await api.search(query);
      setResults(data);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <SearchBar onSearch={handleSearch} />
      {isLoading && <LoadingSpinner />}
      <SearchResults results={results} />
    </div>
  );
}
```

### Com Debounce

```tsx
import { useDebounce } from "@/hooks/useDebounce";

function DebouncedSearch() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (debouncedQuery) {
      performSearch(debouncedQuery);
    }
  }, [debouncedQuery]);

  return <SearchBar onSearch={setQuery} />;
}
```

## 🎯 Casos de Uso no Sistema

### 1. Busca de Atividades

```tsx
// Em Activities.tsx
import { SearchBar } from "@/components/ui/search-bar";

function ActivitiesPage() {
  const handleActivitySearch = (query: string) => {
    // Filtrar atividades por título, descrição, responsável
    const filtered = activities.filter(activity => 
      activity.title.toLowerCase().includes(query.toLowerCase()) ||
      activity.description.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredActivities(filtered);
  };

  return (
    <div>
      <SearchBar 
        placeholder="Buscar atividades..." 
        onSearch={handleActivitySearch}
      />
      {/* Lista de atividades */}
    </div>
  );
}
```

### 2. Busca de Contatos

```tsx
// Em Contacts.tsx
function ContactsPage() {
  const handleContactSearch = (query: string) => {
    // Buscar contatos por nome, email, telefone
    searchContacts(query);
  };

  return (
    <SearchBar 
      placeholder="Buscar contatos..." 
      onSearch={handleContactSearch}
    />
  );
}
```

### 3. Busca Global

```tsx
// Componente de busca global
function GlobalSearch() {
  const [searchType, setSearchType] = useState('all');
  
  const handleGlobalSearch = (query: string) => {
    switch(searchType) {
      case 'activities':
        searchActivities(query);
        break;
      case 'contacts':
        searchContacts(query);
        break;
      case 'projects':
        searchProjects(query);
        break;
      default:
        searchAll(query);
    }
  };

  return (
    <div className="flex gap-2">
      <Select value={searchType} onValueChange={setSearchType}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tudo</SelectItem>
          <SelectItem value="activities">Atividades</SelectItem>
          <SelectItem value="contacts">Contatos</SelectItem>
          <SelectItem value="projects">Projetos</SelectItem>
        </SelectContent>
      </Select>
      <SearchBar 
        placeholder="Busca global..." 
        onSearch={handleGlobalSearch}
      />
    </div>
  );
}
```

## 🎨 Estilos e Temas

O componente se adapta automaticamente ao tema:

- **Modo Claro**: Fundo branco com bordas cinzas
- **Modo Escuro**: Fundo escuro com bordas cinzas escuras
- **Foco**: Efeitos de gradiente e sombras
- **Hover**: Transições suaves

## 🔍 Acessibilidade

- Suporte completo a navegação por teclado
- Labels adequados para screen readers
- Contraste de cores otimizado
- Estados visuais claros

## 📱 Responsividade

- **Mobile**: Largura adaptativa
- **Tablet**: Tamanho intermediário
- **Desktop**: Largura máxima otimizada

## 🚨 Solução de Problemas

### Animações não funcionam
- Verifique se o Framer Motion está instalado
- Confirme que não há conflitos de CSS

### Sugestões não aparecem
- Verifique o array `SUGGESTIONS`
- Confirme que o input está recebendo dados

### Performance lenta
- Implemente debounce para buscas
- Considere virtualização para listas grandes

## 📝 Exemplo Completo

Veja o arquivo `SearchBarExample.tsx` para um exemplo completo de implementação com:
- Busca em dados reais
- Estados de carregamento
- Renderização de resultados
- Tratamento de erros
