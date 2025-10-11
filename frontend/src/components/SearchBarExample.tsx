import { useState } from 'react';
import { SearchBar } from '@/components/ui/search-bar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface SearchBarExampleProps {
  onSearchResults?: (results: any[]) => void;
}

export function SearchBarExample({ onSearchResults }: SearchBarExampleProps) {
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Exemplo de dados que podem ser pesquisados
  const sampleData = [
    { id: 1, title: "Reunião com cliente", type: "atividade", priority: "alta" },
    { id: 2, title: "Desenvolvimento de feature", type: "projeto", priority: "média" },
    { id: 3, title: "Análise de requisitos", type: "atividade", priority: "baixa" },
    { id: 4, title: "Testes de integração", type: "projeto", priority: "alta" },
    { id: 5, title: "Documentação técnica", type: "atividade", priority: "média" },
  ];

  const handleSearch = async (query: string) => {
    setIsSearching(true);
    
    // Simula uma busca com delay
    setTimeout(() => {
      const filteredResults = sampleData.filter(item =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.type.toLowerCase().includes(query.toLowerCase()) ||
        item.priority.toLowerCase().includes(query.toLowerCase())
      );
      
      setSearchResults(filteredResults);
      setIsSearching(false);
      
      // Chama callback se fornecido
      if (onSearchResults) {
        onSearchResults(filteredResults);
      }
    }, 500);
  };

  return (
    <div className="space-y-6">
      {/* SearchBar Component */}
      <Card>
        <CardHeader>
          <CardTitle>🔍 Busca Inteligente</CardTitle>
          <CardDescription>
            Use a barra de busca para encontrar atividades, projetos e mais
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SearchBar 
            placeholder="Buscar atividades, projetos..." 
            onSearch={handleSearch}
          />
        </CardContent>
      </Card>

      {/* Resultados da Busca */}
      {searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados da Busca</CardTitle>
            <CardDescription>
              {searchResults.length} item(s) encontrado(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {searchResults.map((item) => (
                <div 
                  key={item.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div>
                    <h4 className="font-medium">{item.title}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Tipo: {item.type} • Prioridade: {item.priority}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      item.priority === 'alta' ? 'bg-red-100 text-red-800' :
                      item.priority === 'média' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {item.priority}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estado de Carregamento */}
      {isSearching && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Buscando...
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dica de Uso */}
      {searchResults.length === 0 && !isSearching && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <p className="text-sm">
                💡 Digite algo para começar a buscar
              </p>
              <p className="text-xs mt-1">
                Experimente: "reunião", "projeto", "alta", etc.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
