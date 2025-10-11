
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Users, Target, DollarSign, BarChart3 } from 'lucide-react';
import { Lead as LeadWithDetails } from '@/hooks/useLeads-simple';

interface SalesTopIndicatorsProps {
  leads: LeadWithDetails[];
}

const SalesTopIndicators = ({ leads }: SalesTopIndicatorsProps) => {
  const calculateMetrics = () => {
    const totalLeads = leads.length;
    const wonLeads = leads.filter(lead => lead.status === 'won').length;
    const lostLeads = leads.filter(lead => lead.status === 'lost').length;
    const prospectingLeads = leads.filter(lead => lead.status === 'open').length;
    
    const totalValue = leads.reduce((sum, lead) => sum + lead.value, 0);
    const wonValue = leads.filter(lead => lead.status === 'won').reduce((sum, lead) => sum + lead.value, 0);
    
    const conversionRate = totalLeads > 0 ? (wonLeads / totalLeads * 100).toFixed(1) : '0';
    
    return {
      totalLeads,
      wonLeads,
      lostLeads,
      prospectingLeads,
      totalValue,
      wonValue,
      conversionRate
    };
  };

  const metrics = calculateMetrics();

  const indicators = [
    {
      title: 'Quantidade de Leads',
      value: '247',
      change: '+15% vs mês anterior',
      changeType: 'positive',
      icon: Users,
      color: 'blue'
    },
    {
      title: 'Vendas Fechadas',
      value: '89',
      change: '+22% vs mês anterior',
      changeType: 'positive',
      icon: Target,
      color: 'green'
    },
    {
      title: 'Vendas Não Fechadas',
      value: '158',
      change: '-8% vs mês anterior',
      changeType: 'negative',
      icon: TrendingDown,
      color: 'orange'
    },
    {
      title: 'Quantidade de Prospecção',
      value: '324',
      change: '+12% vs mês anterior',
      changeType: 'positive',
      icon: BarChart3,
      color: 'purple'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {indicators.map((indicator, index) => {
        const Icon = indicator.icon;
        
        return (
          <Card key={index} className="bg-transparent border-2 border-black">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-gray-100">
                  <Icon className="h-8 w-8 text-gray-700" />
                </div>
              </div>
              
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-600">{indicator.title}</p>
                
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold text-black">{indicator.value}</span>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                    indicator.changeType === 'positive' 
                      ? 'text-green-700 bg-green-50' 
                      : 'text-red-700 bg-red-50'
                  }`}>
                    {indicator.changeType === 'positive' ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    <span>{indicator.change.split(' ')[0]}</span>
                  </div>
                </div>
                
                <p className="text-xs text-gray-500">{indicator.change.split(' ').slice(1).join(' ')}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default SalesTopIndicators;
