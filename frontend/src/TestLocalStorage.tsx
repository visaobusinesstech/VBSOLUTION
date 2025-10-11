import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useVB } from '@/contexts/VBContext';

export function TestLocalStorage() {
  const { state, dispatch } = useVB();
  const [localStorageData, setLocalStorageData] = useState<any>({});

  useEffect(() => {
    // Carregar dados do localStorage
    const loadLocalStorageData = () => {
      const activities = localStorage.getItem('vb-activities');
      const employees = localStorage.getItem('vb-employees');
      const companies = localStorage.getItem('vb-companies');
      
      setLocalStorageData({
        activities: activities ? JSON.parse(activities) : [],
        employees: employees ? JSON.parse(employees) : [],
        companies: companies ? JSON.parse(companies) : []
      });
    };

    loadLocalStorageData();
    
    // Atualizar quando o estado mudar
    const interval = setInterval(loadLocalStorageData, 1000);
    return () => clearInterval(interval);
  }, [state]);

  const addTestActivity = () => {
    const testActivity = {
      id: Date.now().toString(),
      title: `Teste ${Date.now()}`,
      description: 'Atividade de teste',
      date: new Date(),
      priority: 'medium' as const,
      responsibleId: 'test-user',
      type: 'task' as const,
      status: 'pending' as const,
      createdAt: new Date()
    };

    dispatch({ type: 'ADD_ACTIVITY', payload: testActivity });
  };

  const clearLocalStorage = () => {
    localStorage.removeItem('vb-activities');
    localStorage.removeItem('vb-employees');
    localStorage.removeItem('vb-companies');
    setLocalStorageData({});
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold mb-4">Teste do LocalStorage</h3>
      
      <div className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={addTestActivity} className="text-white hover:opacity-90" style={{ backgroundColor: '#4A5477' }}>
            Adicionar Atividade de Teste
          </Button>
          <Button onClick={clearLocalStorage} variant="outline">
            Limpar LocalStorage
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <h4 className="font-medium">Estado do React:</h4>
            <p className="text-sm text-gray-600">
              Atividades: {state.activities.length}
            </p>
          </div>
          
          <div>
            <h4 className="font-medium">LocalStorage:</h4>
            <p className="text-sm text-gray-600">
              Atividades: {localStorageData.activities?.length || 0}
            </p>
          </div>
          
          <div>
            <h4 className="font-medium">Última Atividade:</h4>
            <p className="text-sm text-gray-600">
              {state.activities[0]?.title || 'Nenhuma'}
            </p>
          </div>
        </div>

        <div className="text-xs text-gray-500">
          <p>Este componente mostra se os dados estão sendo sincronizados entre o estado do React e o localStorage.</p>
        </div>
      </div>
    </div>
  );
}
