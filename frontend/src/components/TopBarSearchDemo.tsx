import { useState } from 'react';
import { TopBarSearch } from '@/components/ui/topbar-search';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function TopBarSearchDemo() {
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (query: string) => {
    setIsSearching(true);
    setHasSearched(true);
    
    // Simula delay de busca
    setTimeout(() => {
      const results = [
        `Resultado 1 para "${query}"`,
        `Resultado 2 para "${query}"`,
        `Resultado 3 para "${query}"`,
      ];
      
      setSearchResults(results);
      setIsSearching(false);
    }, 500);
  };

  return (
    <div className="space-y-6">
      {/* Simulação da Top Bar */}
      <Card className="bg-slate-900 text-white">
        <CardHeader>
          <CardTitle className="text-white">🔍 Top Bar com SearchBar Integrado</CardTitle>
          <CardDescription className="text-gray-300">
            O SearchBar agora está integrado na top bar do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-4 bg-slate-800 rounded-lg">
            <div className="w-80">
              <TopBarSearch 
                placeholder="Buscar no sistema..." 
                onSearch={handleSearch}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resultados da Busca */}
      {searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados da Busca</CardTitle>
            <CardDescription>
              {searchResults.length} resultado(s) encontrado(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {searchResults.map((result, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div>
                    <h4 className="font-medium">{result}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Resultado da busca na top bar
                    </p>
                  </div>
                  <Badge variant="outline">
                    {index + 1}
                  </Badge>
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
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Buscando...
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estado inicial */}
      {!hasSearched && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <p className="text-sm">
                💡 Digite algo na barra de busca acima
              </p>
              <p className="text-xs mt-1">
                O SearchBar está integrado na top bar do sistema
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informações sobre a integração */}
      <Card>
        <CardHeader>
          <CardTitle>🎯 Integração na Top Bar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-green-600 mb-2">✅ Implementado</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• SearchBar integrado na top bar</li>
                  <li>• Animações suaves com Framer Motion</li>
                  <li>• Sugestões automáticas</li>
                  <li>• Design responsivo</li>
                  <li>• Placeholder dinâmico por página</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-blue-600 mb-2">🔧 Funcionalidades</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Busca global no sistema</li>
                  <li>• Efeitos visuais interativos</li>
                  <li>• Suporte a tema escuro</li>
                  <li>• Acessibilidade completa</li>
                  <li>• Performance otimizada</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
