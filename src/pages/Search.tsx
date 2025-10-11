import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, FileText, Users, Building, Calendar, Package, MessageCircle, User, FolderOpen, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface SearchResult {
  id: string;
  type: 'contact' | 'company' | 'project' | 'activity' | 'product' | 'message' | 'employee' | 'file' | 'calendar';
  title: string;
  description: string;
  url: string;
  category: string;
  date?: string;
}

const mockSearchResults: SearchResult[] = [
  {
    id: '1',
    type: 'contact',
    title: 'João Silva',
    description: 'Cliente - Empresa ABC',
    url: '/contacts',
    category: 'Contatos',
    date: '2024-01-15'
  },
  {
    id: '2',
    type: 'company',
    title: 'Empresa ABC Ltda',
    description: 'Empresa de tecnologia com sede em São Paulo',
    url: '/companies',
    category: 'Empresas',
    date: '2024-01-10'
  },
  {
    id: '3',
    type: 'project',
    title: 'Desenvolvimento Sistema CRM',
    description: 'Projeto para implementação de sistema de gestão de clientes',
    url: '/projects',
    category: 'Projetos',
    date: '2024-01-20'
  },
  {
    id: '4',
    type: 'activity',
    title: 'Reunião com Cliente',
    description: 'Reunião para apresentação da proposta comercial',
    url: '/activities',
    category: 'Atividades',
    date: '2024-01-25'
  }
];

const getIconForType = (type: string) => {
  switch (type) {
    case 'contact':
      return <Users className="h-5 w-5" />;
    case 'company':
      return <Building className="h-5 w-5" />;
    case 'project':
      return <FolderOpen className="h-5 w-5" />;
    case 'activity':
      return <Calendar className="h-5 w-5" />;
    case 'product':
      return <Package className="h-5 w-5" />;
    case 'message':
      return <MessageCircle className="h-5 w-5" />;
    case 'employee':
      return <User className="h-5 w-5" />;
    case 'file':
      return <FileText className="h-5 w-5" />;
    default:
      return <Search className="h-5 w-5" />;
  }
};

const getColorForType = (type: string) => {
  switch (type) {
    case 'contact':
      return 'bg-blue-100 text-blue-800';
    case 'company':
      return 'bg-green-100 text-green-800';
    case 'project':
      return 'bg-purple-100 text-purple-800';
    case 'activity':
      return 'bg-orange-100 text-orange-800';
    case 'product':
      return 'bg-pink-100 text-pink-800';
    case 'message':
      return 'bg-cyan-100 text-cyan-800';
    case 'employee':
      return 'bg-indigo-100 text-indigo-800';
    case 'file':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function Search() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const query = searchParams.get('q') || '';
    setSearchQuery(query);
    
    if (query) {
      performSearch(query);
    } else {
      setResults([]);
    }
  }, [searchParams]);

  const performSearch = async (query: string) => {
    setIsLoading(true);
    
    // Simular busca com delay
    setTimeout(() => {
      // Filtrar resultados baseado na query
      const filteredResults = mockSearchResults.filter(result =>
        result.title.toLowerCase().includes(query.toLowerCase()) ||
        result.description.toLowerCase().includes(query.toLowerCase()) ||
        result.category.toLowerCase().includes(query.toLowerCase())
      );
      
      setResults(filteredResults);
      setIsLoading(false);
    }, 500);
  };

  const handleResultClick = (result: SearchResult) => {
    navigate(result.url);
  };

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const query = formData.get('search') as string;
    
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Buscar no Sistema
          </h1>
          <p className="text-gray-600">
            Encontre contatos, empresas, projetos e muito mais
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearchSubmit} className="mb-8">
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              name="search"
              type="text"
              defaultValue={searchQuery}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Digite o que você está procurando..."
            />
            <Button 
              type="submit" 
              className="absolute right-2 top-1/2 transform -translate-y-1/2"
            >
              Buscar
            </Button>
          </div>
        </form>

        {/* Results */}
        {searchQuery && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Resultados para "{searchQuery}"
              </h2>
              <Badge variant="secondary" className="text-sm">
                {isLoading ? 'Buscando...' : `${results.length} resultado(s)`}
              </Badge>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Buscando...</span>
              </div>
            ) : results.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nenhum resultado encontrado
                  </h3>
                  <p className="text-gray-600">
                    Tente usar termos diferentes ou verifique a ortografia.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {results.map((result) => (
                  <Card 
                    key={result.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleResultClick(result)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-lg ${getColorForType(result.type)}`}>
                          {getIconForType(result.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-semibold text-gray-900 truncate">
                              {result.title}
                            </h3>
                            <Badge variant="outline" className="text-xs">
                              {result.category}
                            </Badge>
                          </div>
                          <p className="text-gray-600 mb-2">
                            {result.description}
                          </p>
                          {result.date && (
                            <p className="text-sm text-gray-500">
                              {new Date(result.date).toLocaleDateString('pt-BR')}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Quick Search Categories */}
        {!searchQuery && (
          <div className="mt-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Buscar por categoria
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/contacts')}>
                <CardContent className="p-4 text-center">
                  <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <h3 className="font-medium text-gray-900">Contatos</h3>
                  <p className="text-sm text-gray-600">Clientes e fornecedores</p>
                </CardContent>
              </Card>
              
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/companies')}>
                <CardContent className="p-4 text-center">
                  <Building className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <h3 className="font-medium text-gray-900">Empresas</h3>
                  <p className="text-sm text-gray-600">Organizações</p>
                </CardContent>
              </Card>
              
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/projects')}>
                <CardContent className="p-4 text-center">
                  <FolderOpen className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <h3 className="font-medium text-gray-900">Projetos</h3>
                  <p className="text-sm text-gray-600">Trabalhos e iniciativas</p>
                </CardContent>
              </Card>
              
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/activities')}>
                <CardContent className="p-4 text-center">
                  <Calendar className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                  <h3 className="font-medium text-gray-900">Atividades</h3>
                  <p className="text-sm text-gray-600">Tarefas e eventos</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
