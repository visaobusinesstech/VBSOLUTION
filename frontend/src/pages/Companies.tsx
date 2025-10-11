import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { useCompaniesSimple as useCompanies } from '@/hooks/useCompaniesSimple';
import { useAuth } from '@/hooks/useAuth';
import { useFilters } from '@/hooks/useFilters';
import { useTheme } from '@/contexts/ThemeContext';
import { useSidebar } from '@/contexts/SidebarContext';
import CompaniesTable from '@/components/companies/CompaniesTable';
import { CreateCompanyModal } from '@/components/CreateCompanyModal';
import FilterBar from '@/components/FilterBar';
import { 
  Building2, 
  Plus, 
  Search,
  Zap,
  X,
  List,
  AlignJustify,
  BarChart3,
  Calendar
} from 'lucide-react';
import { UploadButton } from '@/components/UploadButton';

const Companies = () => {
  const navigate = useNavigate();
  const { companies, loading, error, createCompany, updateCompany, deleteCompany, fetchCompanies } = useCompanies();
  const { user, session, loading: authLoading } = useAuth();
  const { topBarColor } = useTheme();
  const { sidebarExpanded, expandSidebarFromMenu } = useSidebar();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'lista' | 'dashboard'>('lista');
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Hook para gerenciar filtros
  const { filters, updateFilter, clearFilters, getFilterParams } = useFilters();

  // Função para mudança de modo de visualização
  const handleViewModeChange = (mode: 'lista' | 'dashboard') => {
    setViewMode(mode);
  };

  // Botões de visualização seguindo o padrão de Activities
  const viewButtons = [
    {
      id: 'lista',
      label: 'Lista',
      icon: List,
      active: viewMode === 'lista'
    },
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: BarChart3,
      active: viewMode === 'dashboard'
    }
  ];

  const handleCreateCompany = async (formData: any) => {
    try {
      await createCompany(formData);
      setIsCreateModalOpen(false);
      toast({
        title: "Sucesso",
        description: "Empresa cadastrada com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao cadastrar empresa. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateCompany = async (id: string, updates: any) => {
    try {
      await updateCompany(id, updates);
      toast({
        title: "Sucesso",
        description: "Empresa atualizada com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar empresa. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCompany = async (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja excluir a empresa "${name}"?`)) {
      try {
        console.log('🗑️ Tentando excluir empresa:', id, name);
        const result = await deleteCompany(id);
        
        if (result.error) {
          console.error('❌ Erro na exclusão:', result.error);
          toast({
            title: "Erro",
            description: result.error,
            variant: "destructive",
          });
        } else {
          console.log('✅ Empresa excluída com sucesso');
          toast({
            title: "Sucesso",
            description: "Empresa excluída com sucesso!",
          });
          // Recarregar a lista
          fetchCompanies();
        }
      } catch (error) {
        console.error('❌ Erro inesperado:', error);
        toast({
          title: "Erro",
          description: "Erro ao excluir empresa. Tente novamente.",
          variant: "destructive",
        });
      }
    }
  };

  // Função para importação em massa de empresas via Excel
  const handleImportCompanies = async (data: any[]) => {
    try {
      console.log('📊 [IMPORT] Iniciando importação de', data.length, 'empresas');

      // Filtrar apenas linhas com dados válidos
      const validData = data.filter(row => {
        return row.fantasy_name && row.fantasy_name.trim() !== '' && row.fantasy_name.trim() !== 'Exemplo';
      });

      console.log(`📊 [IMPORT] Dados válidos: ${validData.length} de ${data.length} total`);

      if (validData.length === 0) {
        throw new Error('Nenhum dado válido encontrado para importar');
      }

      // Processar dados importados
      const companiesData = await Promise.all(validData.map(async (row) => {
        // Processar status
        let processedStatus = 'active';
        if (row.status && row.status !== 'Exemplo') {
          const statusMap: { [key: string]: string } = {
            'ativo': 'active',
            'ativa': 'active',
            'inativo': 'inactive',
            'inativa': 'inactive',
            'prospecto': 'prospect',
            'cliente': 'customer'
          };
          processedStatus = statusMap[row.status.toLowerCase()] || row.status.toLowerCase();
        }

        // Processar tamanho
        let processedSize = undefined;
        if (row.size && row.size !== 'Exemplo') {
          const sizeMap: { [key: string]: string } = {
            'pequena': 'small',
            'média': 'medium',
            'grande': 'large',
            'corporação': 'enterprise',
            'empresa': 'enterprise'
          };
          processedSize = sizeMap[row.size.toLowerCase()] || row.size.toLowerCase();
        }

        return {
          fantasyName: row.fantasy_name,
          legalName: row.legal_name || row.fantasy_name,
          cnpj: row.cnpj || undefined,
          phone: row.phone || undefined,
          email: row.email || undefined,
          website: row.website || undefined,
          address: row.address || undefined,
          city: row.city || undefined,
          state: row.state || undefined,
          zipCode: row.zip_code || undefined,
          country: row.country || 'Brasil',
          industry: row.industry || undefined,
          size: processedSize,
          status: processedStatus,
          notes: row.notes || undefined
        };
      }));

      console.log('📊 [IMPORT] Empresas a serem importadas:', companiesData);

      // Importar empresas uma por uma
      let successCount = 0;
      let failCount = 0;
      const errors: string[] = [];

      for (const companyData of companiesData) {
        try {
          await createCompany(companyData);
          successCount++;
        } catch (error: any) {
          failCount++;
          errors.push(`Erro ao importar ${companyData.fantasyName}: ${error.message}`);
          console.error('❌ [IMPORT] Erro ao importar empresa:', companyData.fantasyName, error);
        }
      }

      console.log(`✅ [IMPORT] Importação concluída: ${successCount} sucesso, ${failCount} falhas`);

      if (successCount > 0) {
        toast({
          title: "Importação concluída!",
          description: `${successCount} empresa(s) importada(s) com sucesso${failCount > 0 ? ` (${failCount} falha(s))` : ''}.`,
        });
        
        // Recarregar a lista
        fetchCompanies();
      } else {
        throw new Error('Não foi possível importar nenhuma empresa');
      }

      if (errors.length > 0) {
        console.error('❌ [IMPORT] Erros durante importação:', errors);
      }

    } catch (error: any) {
      console.error('❌ [IMPORT] Erro geral na importação:', error);
      toast({
        title: "Erro na importação",
        description: error.message || 'Erro inesperado ao importar empresas',
        variant: "destructive"
      });
    }
  };


  // Função para aplicar filtros
  const applyFilters = async () => {
    const filterParams = getFilterParams();
    // Aqui você pode implementar a lógica de filtros específica para empresas
    console.log('Aplicando filtros:', filterParams);
  };

  // Aplicar filtros automaticamente
  const handleFilterApply = () => {
    applyFilters();
  };

  // Função para focar no campo de busca
  const handleSearchIconClick = () => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // Tratamento de erro seguindo o padrão das outras páginas
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black">
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Erro ao carregar empresas</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchCompanies} variant="outline">
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  // Loading state seguindo o padrão das outras páginas
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black">
        <div className="flex flex-col items-center justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Carregando suas empresas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      {/* Faixa branca contínua com botões de navegação e filtros - alinhada perfeitamente */}
      <div className="bg-white -mt-6 -mx-2">
        {/* Botões de visualização */}
        <div className="px-2 py-4 border-b border-gray-200">
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
                entityType="companies"
                onImportComplete={handleImportCompanies}
                title="Importar planilha Excel de empresas"
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

        {/* Barra de filtros funcionais */}
        <FilterBar
          filters={filters}
          onFilterChange={updateFilter}
          onApplyFilters={handleFilterApply}
          searchInputRef={searchInputRef}
          onClearFilters={clearFilters}
          employees={[]} // Você pode passar os funcionários aqui se necessário
          departments={[]} // Você pode passar os departamentos aqui se necessário
          searchPlaceholder="Filtrar por nome da empresa..."
        />
      </div>

      {/* Container principal com padding otimizado para sidebar expandida */}
      <div className="px-1 pt-4">


        {/* Conteúdo baseado na visualização selecionada */}
        {viewMode === 'lista' && (
          <>
            {/* Companies Table */}
            {companies && companies.length > 0 ? (
              <CompaniesTable 
                companies={companies} 
                onDeleteCompany={handleDeleteCompany}
                onUpdateCompany={handleUpdateCompany}
              />
            ) : (
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="text-center py-16">
                  <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Nenhuma empresa cadastrada
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Comece cadastrando sua primeira empresa para começar a gerenciar seus relacionamentos comerciais
                  </p>
                  <Button 
                    onClick={() => setIsCreateModalOpen(true)}
                    className="text-white hover:opacity-90"
                    style={{ backgroundColor: '#4A5477' }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Cadastrar Primeira Empresa
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {viewMode === 'dashboard' && (
          <div className="space-y-4">
            {/* Cards de estatísticas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total de Empresas</p>
                    <p className="text-2xl font-bold text-gray-900">{companies?.length || 0}</p>
                  </div>
                  <Building2 className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Empresas Ativas</p>
                    <p className="text-2xl font-bold text-gray-900">{companies?.filter(c => c.status === 'active').length || 0}</p>
                  </div>
                  <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                    <div className="h-4 w-4 bg-green-600 rounded-full"></div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Novas Este Mês</p>
                    <p className="text-2xl font-bold text-gray-900">0</p>
                  </div>
                  <Calendar className="h-8 w-8 text-purple-600" />
                </div>
              </div>
              
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Taxa de Crescimento</p>
                    <p className="text-2xl font-bold text-gray-900">+12%</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-green-600" />
                </div>
              </div>
            </div>

            {/* Gráficos e análises */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Empresas por Setor</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Tecnologia</span>
                    <span className="text-sm font-medium text-gray-900">45%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '45%' }}></div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Varejo</span>
                    <span className="text-sm font-medium text-gray-900">30%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '30%' }}></div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Serviços</span>
                    <span className="text-sm font-medium text-gray-900">25%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full" style={{ width: '25%' }}></div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Atividade Recente</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Nova empresa cadastrada</span>
                    <span className="text-xs text-gray-500 ml-auto">2h atrás</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Empresa atualizada</span>
                    <span className="text-xs text-gray-500 ml-auto">5h atrás</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Contato adicionado</span>
                    <span className="text-xs text-gray-500 ml-auto">1d atrás</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Botão flutuante de nova empresa com posição exata da referência */}
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg z-50 transition-colors duration-200"
          style={{
            backgroundColor: '#021529',
            borderColor: '#021529'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#001122';
            e.currentTarget.style.borderColor = '#001122';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#021529';
            e.currentTarget.style.borderColor = '#021529';
          }}
        >
          <Plus className="h-6 w-6 text-white" />
        </Button>

        {/* Modal de criação de empresa */}
        <CreateCompanyModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateCompany}
        />
      </div>
    </div>
  );
};

export default Companies;
