import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSidebar } from '@/contexts/SidebarContext';
import { 
  BarChart3, 
  Calendar,
  AlignJustify
} from 'lucide-react';

const Reports = () => {
  const { sidebarExpanded, expandSidebarFromMenu } = useSidebar();
  const [viewMode, setViewMode] = useState<'dashboard' | 'calendario'>('dashboard');

  const handleViewModeChange = (mode: 'dashboard' | 'calendario') => {
    setViewMode(mode);
  };

  // Botões de visualização
  const viewButtons = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: BarChart3,
      active: viewMode === 'dashboard'
    },
    {
      id: 'calendario',
      label: 'Calendário',
      icon: Calendar,
      active: viewMode === 'calendario'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Faixa branca contínua com botões de navegação */}
      <div className="bg-white -mt-6 -mx-6">
        {/* Botões de visualização */}
        <div className="px-6 py-4 border-b border-gray-200">
      <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Botão fixo de toggle da sidebar - SEMPRE VISÍVEL quando colapsada */}
              {!sidebarExpanded && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-8 h-8 p-0 text-gray-600 hover:bg-gray-100 rounded transition-all duration-200 flex-shrink-0"
                  onClick={expandSidebarFromMenu}
                  title="Expandir barra lateral"
                >
                  <AlignJustify size={14} />
                </Button>
              )}
              
              {viewButtons.map((button) => {
                const Icon = button.icon;
                return (
            <Button 
                    key={button.id}
                    variant="ghost"
              size="sm" 
                    onClick={() => handleViewModeChange(button.id as any)}
                    className={`
                      h-10 px-4 text-sm font-medium transition-all duration-200 rounded-lg
                      ${button.active 
                        ? 'bg-gray-50 text-slate-900 shadow-inner' 
                        : 'text-slate-700 hover:text-slate-900 hover:bg-gray-25'
                      }
                    `}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {button.label}
            </Button>
                );
              })}
            </div>
          </div>
        </div>
            </div>

      {/* Container principal */}
      <div className="px-6 py-6">
        {viewMode === 'dashboard' && (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Em desenvolvimento</h2>
              <p className="text-gray-600">Esta funcionalidade está sendo desenvolvida e estará disponível em breve.</p>
            </div>
            </div>
        )}

        {viewMode === 'calendario' && (
          <Card className="bg-white border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Calendário de Relatórios</h3>
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">Calendário de Relatórios</h4>
              <p className="text-gray-600 mb-6">
                Visualize eventos, prazos e atividades relacionadas aos seus relatórios em um calendário interativo.
              </p>
              <div className="space-y-2 text-sm text-gray-500">
                <p>• Prazos de entrega de relatórios</p>
                <p>• Reuniões de análise de dados</p>
                <p>• Lembretes de atualização</p>
                <p>• Apresentações agendadas</p>
            </div>
            </div>
        </Card>
        )}
      </div>
    </div>
  );
};

export default Reports;
