import { Card, CardContent } from '@/components/ui/card';
import { BarChart3, DollarSign, Target, ArrowUpRight, TrendingUp } from 'lucide-react';

const MetricsCards = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <Card className="bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Leads</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">77</p>
              <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                +12% vs mês anterior
              </p>
            </div>
            <div className="h-12 w-12 bg-gray-100 rounded-xl flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-gray-600" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Valor Total</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">R$ 440.000</p>
              <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                +8% vs mês anterior
              </p>
            </div>
            <div className="h-12 w-12 bg-gray-100 rounded-xl flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-gray-600" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Taxa de Conversão</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">19%</p>
              <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                -2% vs mês anterior
              </p>
            </div>
            <div className="h-12 w-12 bg-gray-100 rounded-xl flex items-center justify-center">
              <Target className="h-6 w-6 text-gray-600" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ticket Médio</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">R$ 8.333</p>
              <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                +5% vs mês anterior
              </p>
            </div>
            <div className="h-12 w-12 bg-gray-100 rounded-xl flex items-center justify-center">
              <ArrowUpRight className="h-6 w-6 text-gray-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MetricsCards;
