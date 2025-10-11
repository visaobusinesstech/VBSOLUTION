import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useSuppliersFilters } from '@/hooks/useSuppliersFilters';
import { useTheme } from '@/contexts/ThemeContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { CreateSupplierModal } from '@/components/CreateSupplierModal';
import SuppliersFilterBar from '@/components/SuppliersFilterBar';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users,
  Plus, 
  Search, 
  MapPin, 
  Edit,
  Trash2,
  Building2,
  Phone,
  Zap,
  X
} from 'lucide-react';

interface ImprovedSuppliersPageProps {
  onImportReady?: (importFunction: (data: any[]) => Promise<void>) => void;
}

const ImprovedSuppliersPage = ({ onImportReady }: ImprovedSuppliersPageProps = {}) => {
  const navigate = useNavigate();
  const { suppliers, loading, error, createSupplier, deleteSupplier } = useSuppliers();
  const { topBarColor } = useTheme();
  const { sidebarExpanded } = useSidebar();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAutomationModalOpen, setIsAutomationModalOpen] = useState(false);
  
  // Hook para gerenciar filtros
  const { filters, updateFilter, clearFilters, getFilterParams } = useSuppliersFilters();

  // Extrair dados únicos para os filtros
  const cities = useMemo(() => {
    const uniqueCities = [...new Set(suppliers.map(s => s.city).filter(Boolean))];
    return uniqueCities.sort();
  }, [suppliers]);

  const states = useMemo(() => {
    const uniqueStates = [...new Set(suppliers.map(s => s.state).filter(Boolean))];
    return uniqueStates.sort();
  }, [suppliers]);

  const activities = useMemo(() => {
    const uniqueActivities = [...new Set(suppliers.map(s => s.notes).filter(Boolean))];
    return uniqueActivities.sort();
  }, [suppliers]);

  // Aplicar filtros
  const filteredSuppliers = useMemo(() => {
    let filtered = suppliers;

    // Filtro de busca
    if (filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(supplier =>
        supplier.name.toLowerCase().includes(searchTerm) ||
        supplier.fantasy_name?.toLowerCase().includes(searchTerm) ||
        supplier.notes?.toLowerCase().includes(searchTerm) ||
        supplier.cnpj?.toLowerCase().includes(searchTerm)
      );
    }

    // Filtro de cidade
    if (filters.city !== 'all') {
      filtered = filtered.filter(supplier => supplier.city === filters.city);
    }

    // Filtro de estado
    if (filters.state !== 'all') {
      filtered = filtered.filter(supplier => supplier.state === filters.state);
    }

    // Filtro de atividade
    if (filters.activity !== 'all') {
      filtered = filtered.filter(supplier => supplier.notes === filters.activity);
    }

    // Filtro de data
    if (filters.dateRange !== 'all') {
      const now = new Date();
      let startDate: Date;
      
      switch (filters.dateRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'recent':
          startDate = new Date(now.setDate(now.getDate() - 30));
          break;
        default:
          startDate = new Date(0);
      }
      
      filtered = filtered.filter(supplier => 
        new Date(supplier.created_at) >= startDate
      );
    }

    return filtered;
  }, [suppliers, filters]);

  const handleCreateSupplier = async (formData: any) => {
    try {
      console.log('🚀 handleCreateSupplier: Iniciando criação com dados:', formData);
      
      // Limpar erros anteriores
      if (error) {
        clearError();
      }
      
      const result = await createSupplier(formData);
      console.log('✅ handleCreateSupplier: Fornecedor criado com sucesso:', result);
      
      setIsCreateDialogOpen(false);
      toast({
        title: "Sucesso",
        description: "Fornecedor cadastrado com sucesso!",
      });
    } catch (error) {
      console.error('❌ handleCreateSupplier: Erro ao criar fornecedor:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao cadastrar fornecedor. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Função para importação em massa de fornecedores via Excel
  const handleImportSuppliers = async (data: any[]) => {
    try {
      console.log('📊 [IMPORT] Iniciando importação de', data.length, 'fornecedores');

      // Filtrar apenas linhas com dados válidos
      const validData = data.filter(row => {
        return row.fantasy_name && row.fantasy_name.trim() !== '' && row.fantasy_name.trim() !== 'Exemplo';
      });

      console.log(`📊 [IMPORT] Dados válidos: ${validData.length} de ${data.length} total`);

      if (validData.length === 0) {
        throw new Error('Nenhum dado válido encontrado para importar');
      }

      // Processar dados importados
      const suppliersData = validData.map((row) => {
        // Processar status - sempre usar 'active' para fornecedores sem status definido
        let processedStatus = 'active'; // Status padrão
        if (row.status && row.status !== 'Exemplo' && row.status.trim() !== '') {
          const statusMap: { [key: string]: string } = {
            'ativo': 'active',
            'inativo': 'inactive'
          };
          processedStatus = statusMap[row.status.toLowerCase()] || 'active';
        }

        const supplierData = {
          fantasy_name: row.fantasy_name,
          legal_name: row.legal_name || row.fantasy_name,
          cnpj: row.cnpj || null,
          phone: row.phone || null,
          email: row.email || null,
          contact_person: row.contact_person || null,
          address: row.address || null,
          city: row.city || null,
          state: row.state || null,
          zip_code: row.zip_code || null,
          category: row.category || null,
          status: processedStatus as 'active' | 'inactive',
          payment_terms: row.payment_terms || null,
          notes: row.notes || null
        };
        
        console.log('🔍 [IMPORT] Dados do fornecedor individual:', supplierData);
        return supplierData;
      });

      console.log('📤 [IMPORT] Dados preparados para inserção:', suppliersData);

      // Inserir todos os fornecedores no Supabase
      const { data: insertedSuppliers, error } = await supabase
        .from('suppliers')
        .insert(suppliersData)
        .select();

      if (error) {
        console.error('❌ [IMPORT] Erro no Supabase:', error);
        throw error;
      }

      console.log('✅ [IMPORT] Fornecedores importados com sucesso:', insertedSuppliers);

      // Recarregar fornecedores para atualizar todas as visualizações
      console.log('🔄 [IMPORT] Recarregando fornecedores...');
      // O hook useSuppliers já gerencia o estado automaticamente
      console.log('✅ [IMPORT] Fornecedores recarregados');

      toast({
        title: "Importação concluída",
        description: `${insertedSuppliers?.length || 0} fornecedores foram importados com sucesso`
      });

    } catch (error) {
      console.error('❌ [IMPORT] Erro ao importar fornecedores:', error);
      throw error;
    }
  };

  // Exportar função de importação para o componente pai
  if (onImportReady) {
    onImportReady(handleImportSuppliers);
  }

  const handleDeleteSupplier = async (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o fornecedor "${name}"?`)) {
      try {
        await deleteSupplier(id);
        toast({
          title: "Sucesso",
          description: "Fornecedor excluído com sucesso!",
        });
      } catch (error) {
        toast({
          title: "Erro",
          description: "Erro ao excluir fornecedor. Tente novamente.",
          variant: "destructive",
        });
      }
    }
  };




  // Função para aplicar filtros
  const handleFilterApply = () => {
    // Os filtros são aplicados automaticamente via useMemo
    // Esta função pode ser usada para lógica adicional se necessário
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando fornecedores...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        <p>Erro ao carregar fornecedores: {error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Barra de filtros funcionais - alinhada com as abas de navegação */}
      <div className={`bg-white -mt-6 border-b border-gray-200 ${sidebarExpanded ? '-ml-[240px] -mr-6' : '-ml-[64px] -mr-6'}`}>
        <div className={`${sidebarExpanded ? 'ml-[240px]' : 'ml-[64px]'} mr-6`}>
          <SuppliersFilterBar
            filters={filters}
            onFilterChange={updateFilter}
            onApplyFilters={handleFilterApply}
            onClearFilters={clearFilters}
            cities={cities}
            states={states}
            activities={activities}
            searchPlaceholder="Filtrar fornecedores por nome, fantasia, CNPJ ou notas..."
          />
        </div>
      </div>

      {/* Container principal com padding otimizado */}
      <div className="pt-3">
        {/* Badge de contagem */}
        <div className="mb-4">
              <Badge variant="outline" className="border-gray-300 text-gray-700">
                {filteredSuppliers.length} {filteredSuppliers.length === 1 ? 'fornecedor' : 'fornecedores'}
            {filteredSuppliers.length !== suppliers.length && ` de ${suppliers.length}`}
              </Badge>
        </div>

                {/* Tabela de Fornecedores */}
        <div className="w-full">
          <div className="bg-white rounded-lg border border-gray-200">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-gray-200">
                  <TableHead className="font-medium text-gray-900">Nome</TableHead>
                  <TableHead className="font-medium text-gray-900">Empresa</TableHead>
                  <TableHead className="font-medium text-gray-900">Atividade</TableHead>
                  <TableHead className="font-medium text-gray-900">Contato</TableHead>
                  <TableHead className="font-medium text-gray-900">Data de Criação</TableHead>
                  <TableHead className="text-right font-medium text-gray-900">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                  {filteredSuppliers.length > 0 ? (
                    filteredSuppliers.map((supplier) => (
                  <TableRow key={supplier.id} className="hover:bg-gray-50 border-b border-gray-100">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-gray-900" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{supplier.name}</div>
                          {supplier.cnpj && (
                            <div className="text-sm text-gray-500">{supplier.cnpj}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {supplier.fantasy_name ? (
                        <div className="text-sm text-gray-700">{supplier.fantasy_name}</div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {supplier.notes ? (
                        <Badge variant="outline" className="border-gray-300 text-gray-700">
                          {supplier.notes.substring(0, 30)}...
                        </Badge>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {supplier.phone && (
                          <div className="flex items-center gap-1 text-sm text-gray-700">
                            <Phone className="h-3 w-3 text-gray-400" />
                            <span>{supplier.phone}</span>
                          </div>
                        )}
                        {(supplier.city || supplier.state) && (
                          <div className="flex items-center gap-1 text-sm text-gray-700">
                            <MapPin className="h-3 w-3 text-gray-400" />
                            <span>{[supplier.city, supplier.state].filter(Boolean).join(', ')}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600">
                        {new Date(supplier.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 h-6 w-6 p-0"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteSupplier(supplier.id, supplier.name)}
                          className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 h-6 w-6 p-0"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        Nenhum fornecedor encontrado com os filtros aplicados
                      </TableCell>
                    </TableRow>
                  )}
              </TableBody>
            </Table>
          </div>
        </div>

      </div>

      {/* Botão flutuante para criar fornecedor */}
      <Button
        onClick={() => setIsCreateDialogOpen(true)}
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

      {/* Modal de criação de fornecedor */}
      <CreateSupplierModal
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSubmit={handleCreateSupplier}
      />

      {/* Modal de Automações */}
      {isAutomationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsAutomationModalOpen(false)}
          />
          
          {/* Modal Content */}
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Automatize</h2>
                <button
                  onClick={() => setIsAutomationModalOpen(false)}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>
            
            {/* Body */}
            <div className="px-6 py-6">
              <div className="w-full h-40 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 flex items-center justify-center">
                <span className="text-gray-500 text-sm">Espaço para futuras automações de fornecedores</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImprovedSuppliersPage;
