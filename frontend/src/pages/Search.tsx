import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search as SearchIcon, Filter, X } from 'lucide-react';
import { useVB } from '@/contexts/VBContext';

interface SearchResult {
  id: string;
  type: 'activity' | 'project' | 'contact' | 'company' | 'employee' | 'inventory' | 'file';
  title: string;
  description: string;
  url: string;
  metadata?: any;
}

const Search: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const { user } = useVB();

  const availableFilters = [
    { id: 'activity', label: 'Atividades' },
    { id: 'project', label: 'Projetos' },
    { id: 'contact', label: 'Contatos' },
    { id: 'company', label: 'Empresas' },
    { id: 'employee', label: 'Funcionários' },
    { id: 'inventory', label: 'Inventário' },
    { id: 'file', label: 'Arquivos' }
  ];

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setIsLoading(true);
    try {
      // Simulação de busca - implementar lógica real aqui
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock results
      const mockResults: SearchResult[] = [
        {
          id: '1',
          type: 'activity',
          title: 'Reunião com cliente',
          description: 'Reunião para discutir requisitos do projeto',
          url: '/activities/1'
        },
        {
          id: '2',
          type: 'project',
          title: 'Projeto Alpha',
          description: 'Desenvolvimento do sistema principal',
          url: '/projects/2'
        }
      ];
      
      setResults(mockResults);
    } catch (error) {
      console.error('Erro na busca:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFilter = (filterId: string) => {
    setSelectedFilters(prev => 
      prev.includes(filterId) 
        ? prev.filter(id => id !== filterId)
        : [...prev, filterId]
    );
  };

  const clearFilters = () => {
    setSelectedFilters([]);
  };

  const getTypeLabel = (type: string) => {
    const filter = availableFilters.find(f => f.id === type);
    return filter?.label || type;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      activity: 'bg-blue-100 text-blue-800',
      project: 'bg-green-100 text-green-800',
      contact: 'bg-purple-100 text-purple-800',
      company: 'bg-orange-100 text-orange-800',
      employee: 'bg-indigo-100 text-indigo-800',
      inventory: 'bg-yellow-100 text-yellow-800',
      file: 'bg-gray-100 text-gray-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  useEffect(() => {
    if (searchTerm.trim()) {
      const timeoutId = setTimeout(() => {
        handleSearch();
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setResults([]);
    }
  }, [searchTerm]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Busca Global</h1>
          <p className="text-gray-600">
            Encontre atividades, projetos, contatos e muito mais em todo o sistema
          </p>
        </div>

        {/* Search Bar */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Digite sua busca..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12 text-lg"
                />
              </div>
              <Button 
                onClick={handleSearch}
                disabled={!searchTerm.trim() || isLoading}
                className="h-12 px-8 text-white hover:opacity-90"
                style={{ backgroundColor: '#4A5477' }}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <SearchIcon className="h-5 w-5 mr-2" />
                    Buscar
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {availableFilters.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => toggleFilter(filter.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedFilters.includes(filter.id)
                      ? 'text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  style={selectedFilters.includes(filter.id) ? { backgroundColor: '#4A5477' } : {}}
                >
                  {filter.label}
                </button>
              ))}
              {selectedFilters.length > 0 && (
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Limpar
                </button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>
                Resultados ({results.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {results.map((result) => (
                  <div
                    key={result.id}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => window.location.href = result.url}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {result.title}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(result.type)}`}>
                            {getTypeLabel(result.type)}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-2">
                          {result.description}
                        </p>
                        <p className="text-sm text-gray-500">
                          {result.url}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Results */}
        {searchTerm && !isLoading && results.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <SearchIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Nenhum resultado encontrado
              </h3>
              <p className="text-gray-600 mb-4">
                Tente ajustar seus termos de busca ou filtros
              </p>
              <Button
                onClick={clearFilters}
                variant="outline"
                className="text-gray-700 hover:bg-gray-50"
              >
                Limpar Filtros
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!searchTerm && (
          <Card>
            <CardContent className="p-8 text-center">
              <SearchIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Comece sua busca
              </h3>
              <p className="text-gray-600">
                Digite um termo na barra de busca acima para encontrar conteúdo em todo o sistema
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Search;
