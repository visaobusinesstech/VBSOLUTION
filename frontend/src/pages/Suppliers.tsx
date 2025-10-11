
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSidebar } from '@/contexts/SidebarContext';
import ImprovedSuppliersPage from '@/components/suppliers/ImprovedSuppliersPage';
import { 
  BarChart3, 
  Calendar, 
  AlignJustify,
  Building2,
  Users,
  MapPin,
  Phone,
  TrendingUp,
  Zap
} from 'lucide-react';
import { UploadButton } from '@/components/UploadButton';

const Suppliers = () => {
  const { sidebarExpanded, expandSidebarFromMenu } = useSidebar();
  const [viewMode, setViewMode] = useState<'fornecedores' | 'dashboard'>('fornecedores');
  const importFunctionRef = useRef<((data: any[]) => Promise<void>) | null>(null);

  const handleViewModeChange = (mode: 'fornecedores' | 'dashboard') => {
    setViewMode(mode);
  };

  // Botões de visualização
  const viewButtons = [
    {
      id: 'fornecedores',
      label: 'Fornecedores',
      icon: Building2,
      active: viewMode === 'fornecedores'
    },
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: BarChart3,
      active: viewMode === 'dashboard'
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
            
            {/* Botões de ação na extrema direita */}
            <div className="flex items-center gap-2">
              {/* Botão de Upload/Importação Excel */}
              <UploadButton
                entityType="suppliers"
                onImportComplete={async (data) => {
                  if (importFunctionRef.current) {
                    await importFunctionRef.current(data);
                  }
                }}
                title="Importar planilha Excel de fornecedores"
              />
              
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full transition-colors"
                title="Automações"
              >
                <Zap className="h-4 w-4 text-gray-700" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Container principal */}
      <div className="px-6 py-6">
        {viewMode === 'fornecedores' && (
          <ImprovedSuppliersPage 
            onImportReady={(fn) => {
              importFunctionRef.current = fn;
            }}
          />
        )}

        {viewMode === 'dashboard' && (
          <div className="space-y-6">
            {/* Cards de estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-white border border-gray-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Total de Fornecedores
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">24</div>
                  <p className="text-xs text-gray-500">fornecedores cadastrados</p>
                </CardContent>
              </Card>

              <Card className="bg-white border border-gray-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Estados Atendidos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">8</div>
                  <p className="text-xs text-gray-500">estados diferentes</p>
                </CardContent>
              </Card>

              <Card className="bg-white border border-gray-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Contatos Ativos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">18</div>
                  <p className="text-xs text-gray-500">fornecedores ativos</p>
                </CardContent>
              </Card>

              <Card className="bg-white border border-gray-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Novos Este Mês
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">3</div>
                  <p className="text-xs text-green-600">+12% vs mês anterior</p>
                </CardContent>
              </Card>
            </div>

            {/* Gráficos e análises */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Fornecedores por Estado</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">São Paulo</span>
                    <span className="text-sm font-medium text-gray-900">8</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '33%' }}></div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Rio de Janeiro</span>
                    <span className="text-sm font-medium text-gray-900">5</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '21%' }}></div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Minas Gerais</span>
                    <span className="text-sm font-medium text-gray-900">4</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full" style={{ width: '17%' }}></div>
                  </div>
                </div>
              </Card>

              <Card className="bg-white border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Atividade Recente</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Novo fornecedor cadastrado</span>
                    <span className="text-xs text-gray-500 ml-auto">2h atrás</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Contato atualizado</span>
                    <span className="text-xs text-gray-500 ml-auto">5h atrás</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Pedido realizado</span>
                    <span className="text-xs text-gray-500 ml-auto">1d atrás</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Suppliers;
