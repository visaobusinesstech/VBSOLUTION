
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { Company } from '@/hooks/useCompanies';
import { CompanyViewModal } from './CompanyViewModal';
import { CompanyEditModal } from './CompanyEditModal';
import { 
  Edit,
  Trash2,
  Eye,
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Users,
  Activity,
  TrendingUp,
  Star,
  Target,
  Globe,
  Briefcase,
  Clock,
  MoreHorizontal,
  ExternalLink,
  Copy,
  MessageSquare,
  Plus,
  ArrowUpDown
} from 'lucide-react';

interface CompaniesTableProps {
  companies: Company[];
  onDeleteCompany: (id: string, name: string) => void;
  onUpdateCompany: (id: string, data: any) => Promise<void>;
}

const CompaniesTable = ({ companies, onDeleteCompany, onUpdateCompany }: CompaniesTableProps) => {
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const handleViewCompany = (company: Company) => {
    setSelectedCompany(company);
    setViewModalOpen(true);
  };

  const handleEditCompany = (company: Company) => {
    setSelectedCompany(company);
    setEditModalOpen(true);
  };

  const handleDeleteCompany = (company: Company) => {
    onDeleteCompany(company.id, company.fantasy_name);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'inactive':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSectorColor = (sector: string) => {
    const colors = [
      'bg-blue-100 text-blue-800 border-blue-200',
      'bg-purple-100 text-purple-800 border-purple-200',
      'bg-green-100 text-green-800 border-green-200',
      'bg-orange-100 text-orange-800 border-orange-200',
      'bg-pink-100 text-pink-800 border-pink-200',
      'bg-indigo-100 text-indigo-800 border-indigo-200',
      'bg-teal-100 text-teal-800 border-teal-200',
      'bg-amber-100 text-amber-800 border-amber-200'
    ];
    
    const index = sector ? sector.charCodeAt(0) % colors.length : 0;
    return colors[index];
  };

  return (
    <>
      {/* Lista de Empresas - Frontend da Activities */}
      <div className="w-full">
        {/* Tabela de Empresas */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          {/* Cabeçalho da Tabela */}
          <div className="bg-gray-50 border-b border-gray-200">
            <div className="flex items-center px-3 py-3 gap-2">
              <div className="w-12 flex items-center">
                <Checkbox className="h-4 w-4" />
              </div>
              <div className="flex-1 flex items-center gap-2 text-sm font-medium text-gray-700">
                <span>Empresa</span>
                <ArrowUpDown className="h-3 w-3 text-gray-400" />
              </div>
              <div className="w-24 flex items-center justify-center gap-2 text-sm font-medium text-gray-700">
                <span>Setor</span>
                <ArrowUpDown className="h-3 w-3 text-gray-400" />
              </div>
              <div className="w-28 flex items-center justify-center gap-2 text-sm font-medium text-gray-700">
                <span>Contato</span>
                <ArrowUpDown className="h-3 w-3 text-gray-400" />
              </div>
              <div className="w-28 flex items-center justify-center gap-2 text-sm font-medium text-gray-700">
                <span>Localização</span>
                <ArrowUpDown className="h-3 w-3 text-gray-400" />
              </div>
              <div className="w-24 flex items-center justify-center gap-2 text-sm font-medium text-gray-700">
                <span>Status</span>
                <ArrowUpDown className="h-3 w-3 text-gray-400" />
              </div>
              <div className="w-24 flex items-center justify-center gap-2 text-sm font-medium text-gray-700">
                <span>Criado em</span>
                <ArrowUpDown className="h-3 w-3 text-gray-400" />
              </div>
              <div className="w-20 flex items-center justify-end gap-2 text-sm font-medium text-gray-700">
                <span>Ações</span>
              </div>
            </div>
          </div>

          {/* Linhas da Tabela */}
          <div className="divide-y divide-gray-200">
            {companies.length > 0 ? (
              companies.map((company) => (
                <div key={company.id} className="flex items-center px-3 py-3 h-14 hover:bg-gray-50 transition-colors gap-2">
                  <div className="w-12 flex items-center">
                    <Checkbox className="h-4 w-4" />
                  </div>
                  <div className="flex-1 flex items-center gap-3 min-w-0">
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm text-gray-900 truncate font-medium">{company.fantasy_name}</span>
                      <span className="text-xs text-gray-400">
                        {company.company_name || 'Nome fantasia'}
                      </span>
                    </div>
                  </div>
                  <div className="w-24 flex items-center justify-center">
                    {company.sector ? (
                      <Badge 
                        variant="outline" 
                        className={`${getSectorColor(company.sector)} text-xs px-1 py-0.5 border font-medium`}
                      >
                        {company.sector.length > 8 ? company.sector.substring(0, 8) + '...' : company.sector}
                      </Badge>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </div>
                  <div className="w-28 flex items-center justify-center gap-2 text-sm text-gray-600">
                    <span className="truncate max-w-20" title={company.email}>
                      {company.email ? company.email.substring(0, 12) + '...' : 'Sem email'}
                    </span>
                  </div>
                  <div className="w-28 flex items-center justify-center gap-2 text-sm text-gray-600">
                    <span className="truncate max-w-20">
                      {company.city && company.state ? `${company.city.substring(0, 6)}, ${company.state}` : 
                       company.address ? company.address.substring(0, 10) + '...' : 'Não informado'}
                    </span>
                  </div>
                  <div className="w-24 flex items-center justify-center gap-2">
                    <div className="flex flex-col items-center gap-1">
                      <Badge 
                        variant="outline" 
                        className={`${getStatusColor(company.status)} text-xs px-1 py-0.5 border font-medium`}
                      >
                        {company.status === 'active' ? 'Ativa' : 
                         company.status === 'inactive' ? 'Inativa' : 
                         company.status === 'pending' ? 'Pendente' : company.status}
                      </Badge>
                      {company.is_supplier && (
                        <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200 text-xs px-1 py-0.5">
                          Fornecedor
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="w-24 flex items-center justify-center gap-2 text-sm text-gray-600">
                    <span className="text-xs">
                      {new Date(company.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: '2-digit'
                      })}
                    </span>
                  </div>
                  <div className="w-20 flex items-center justify-end gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleViewCompany(company)}
                      className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 p-1 rounded-md transition-all duration-200 h-6 w-6"
                      title="Visualizar empresa"
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleEditCompany(company)}
                      className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 p-1 rounded-md transition-all duration-200 h-6 w-6"
                      title="Editar empresa"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDeleteCompany(company)}
                      className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-1 rounded-md transition-all duration-200 h-6 w-6"
                      title="Excluir empresa"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-8 text-center text-gray-500">
                Nenhuma empresa encontrada
              </div>
            )}
          </div>
        </div>

        {/* Espaço branco inferior */}
        <div className="h-32 bg-[#F9FAFB]"></div>
      </div>

      {/* Estado vazio */}
      {companies.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center">
          <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhuma empresa cadastrada
          </h3>
          <p className="text-sm text-gray-600 mb-6 max-w-sm mx-auto">
            Comece cadastrando sua primeira empresa para começar a gerenciar seus relacionamentos comerciais
          </p>
          <Button 
            className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-2 text-sm font-medium shadow-sm hover:shadow-md transition-all duration-200"
          >
            <Plus className="mr-2 h-4 w-4" />
            Cadastrar Primeira Empresa
          </Button>
        </div>
      )}

      <CompanyViewModal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        company={selectedCompany}
      />

      <CompanyEditModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        company={selectedCompany}
        onUpdate={onUpdateCompany}
      />
    </>
  );
};

export default CompaniesTable;
