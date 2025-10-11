import { useState } from 'react';
import { SearchBar } from '@/components/ui/search-bar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Edit, Trash2 } from 'lucide-react';

interface Activity {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  responsible?: string;
  deadline?: string;
}

interface ActivitiesSearchIntegrationProps {
  activities: Activity[];
  onViewActivity?: (activity: Activity) => void;
  onEditActivity?: (activity: Activity) => void;
  onDeleteActivity?: (activity: Activity) => void;
}

export function ActivitiesSearchIntegration({ 
  activities, 
  onViewActivity, 
  onEditActivity, 
  onDeleteActivity 
}: ActivitiesSearchIntegrationProps) {
  const [searchResults, setSearchResults] = useState<Activity[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (query: string) => {
    setIsSearching(true);
    setHasSearched(true);
    
    // Simula delay de busca
    setTimeout(() => {
      const filteredResults = activities.filter(activity => {
        const searchTerm = query.toLowerCase();
        return (
          activity.title.toLowerCase().includes(searchTerm) ||
          activity.description?.toLowerCase().includes(searchTerm) ||
          activity.responsible?.toLowerCase().includes(searchTerm) ||
          activity.status.toLowerCase().includes(searchTerm) ||
          activity.priority.toLowerCase().includes(searchTerm)
        );
      });
      
      setSearchResults(filteredResults);
      setIsSearching(false);
    }, 300);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-orange-100 text-orange-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderActivityCard = (activity: Activity) => (
    <Card key={activity.id} className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{activity.title}</CardTitle>
            {activity.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {activity.description}
              </p>
            )}
          </div>
          <div className="flex gap-2 ml-4">
            <Badge className={getStatusColor(activity.status)}>
              {activity.status}
            </Badge>
            <Badge className={getPriorityColor(activity.priority)}>
              {activity.priority}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {activity.responsible && (
              <span>Responsável: {activity.responsible}</span>
            )}
            {activity.deadline && (
              <span className="ml-4">Prazo: {activity.deadline}</span>
            )}
          </div>
          <div className="flex gap-2">
            {onViewActivity && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewActivity(activity)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
            {onEditActivity && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEditActivity(activity)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {onDeleteActivity && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDeleteActivity(activity)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* SearchBar */}
      <Card>
        <CardHeader>
          <CardTitle>🔍 Busca de Atividades</CardTitle>
        </CardHeader>
        <CardContent>
          <SearchBar 
            placeholder="Buscar por título, descrição, responsável..." 
            onSearch={handleSearch}
          />
        </CardContent>
      </Card>

      {/* Resultados */}
      {isSearching && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Buscando atividades...
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {!isSearching && hasSearched && (
        <Card>
          <CardHeader>
            <CardTitle>
              Resultados da Busca ({searchResults.length} atividade{searchResults.length !== 1 ? 's' : ''})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {searchResults.length > 0 ? (
              <div className="space-y-4">
                {searchResults.map(renderActivityCard)}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">
                  Nenhuma atividade encontrada com os critérios de busca.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Estado inicial */}
      {!hasSearched && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <p className="text-sm">
                💡 Digite algo para buscar atividades
              </p>
              <p className="text-xs mt-1">
                Você pode buscar por título, descrição, responsável, status ou prioridade
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
