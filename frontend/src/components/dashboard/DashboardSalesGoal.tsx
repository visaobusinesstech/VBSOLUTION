
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Target, Plus, TrendingUp, Calendar } from 'lucide-react';
import SalesGoalModal from '@/components/leads/SalesGoalModal';
import { useProducts } from '@/hooks/useProducts';

interface SalesGoal {
  id: string;
  month: string;
  year: number;
  targetAmount: number;
  productId?: string;
  productName?: string;
}

const DashboardSalesGoal = () => {
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [salesGoal, setSalesGoal] = useState<SalesGoal | null>(null);
  const { products, loading: productsLoading } = useProducts();

  // Mock current sales amount - replace with actual calculation
  const currentSalesAmount = 85000;

  const handleSaveGoal = (goal: Omit<SalesGoal, 'id'>) => {
    const newGoal = {
      ...goal,
      id: Date.now().toString()
    };
    setSalesGoal(newGoal);
  };

  if (!salesGoal) {
    return (
      <>
        <Card className="bg-white border border-gray-200">
          <CardContent className="p-8 text-center">
            <Target className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Defina sua Meta de Vendas
            </h3>
            <p className="text-gray-600 mb-6">
              Configure uma meta mensal para acompanhar seu desempenho
            </p>
            <Button 
              onClick={() => setShowGoalModal(true)}
              className="bg-gray-900 hover:bg-gray-800 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Definir Meta
            </Button>
          </CardContent>
        </Card>

        <SalesGoalModal
          isOpen={showGoalModal}
          onClose={() => setShowGoalModal(false)}
          onSaveGoal={handleSaveGoal}
          products={products}
        />
      </>
    );
  }

  const progressPercentage = Math.min((currentSalesAmount / salesGoal.targetAmount) * 100, 100);
  const remaining = Math.max(salesGoal.targetAmount - currentSalesAmount, 0);
  const isOverTarget = currentSalesAmount > salesGoal.targetAmount;

  const monthName = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ][parseInt(salesGoal.month) - 1];

  return (
    <>
      <Card className="bg-white border border-gray-200">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-gray-600" />
              Meta de {monthName} {salesGoal.year}
              {salesGoal.productName && (
                <Badge variant="outline" className="ml-2 border-gray-300">
                  {salesGoal.productName}
                </Badge>
              )}
            </CardTitle>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowGoalModal(true)}
              className="border-gray-300"
            >
              Editar Meta
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Valores principais */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="text-2xl font-bold text-gray-900">
                R$ {currentSalesAmount.toLocaleString('pt-BR')}
              </div>
              <div className="text-sm text-gray-600 flex items-center justify-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3" />
                Atual
              </div>
            </div>

            <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="text-2xl font-bold text-gray-600">
                R$ {salesGoal.targetAmount.toLocaleString('pt-BR')}
              </div>
              <div className="text-sm text-gray-600 flex items-center justify-center gap-1 mt-1">
                <Target className="h-3 w-3" />
                Meta
              </div>
            </div>

            <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className={`text-2xl font-bold ${isOverTarget ? 'text-gray-900' : 'text-gray-600'}`}>
                {isOverTarget ? '+' : ''}R$ {(isOverTarget ? currentSalesAmount - salesGoal.targetAmount : remaining).toLocaleString('pt-BR')}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {isOverTarget ? 'Excedente' : 'Restante'}
              </div>
            </div>
          </div>

          {/* Barra de progresso */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Progresso</span>
              <span className="font-medium text-gray-900">{progressPercentage.toFixed(1)}%</span>
            </div>
            <div className="relative">
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div 
                  className="bg-gray-900 h-4 rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Gráfico de progresso tecnológico */}
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-2">Progresso da Meta</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Alcançado</span>
                    <span className="font-medium">{((currentSalesAmount / salesGoal.targetAmount) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gray-900 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
              
              {/* Indicador circular */}
              <div className="relative w-20 h-20">
                <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 32 32">
                  <circle
                    cx="16" cy="16" r="14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-gray-200"
                  />
                  <circle
                    cx="16" cy="16" r="14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeDasharray={`${progressPercentage * 0.88} 88`}
                    className="text-gray-900"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-gray-900">
                    {Math.round(progressPercentage)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <SalesGoalModal
        isOpen={showGoalModal}
        onClose={() => setShowGoalModal(false)}
        onSaveGoal={handleSaveGoal}
        products={products}
      />
    </>
  );
};

export default DashboardSalesGoal;
