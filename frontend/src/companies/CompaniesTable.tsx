
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Company } from '@/hooks/useCompanies';
import { CompanyViewModal } from './CompanyViewModal';
import { CompanyEditModal } from './CompanyEditModal';
import { 
  Edit,
  Trash2,
  Eye,
  Building2
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

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-gray-200 bg-gray-50">
              <TableHead className="font-semibold text-gray-900">Nome</TableHead>
              <TableHead className="font-semibold text-gray-900">Nicho</TableHead>
              <TableHead className="font-semibold text-gray-900">Atividade</TableHead>
              <TableHead className="font-semibold text-gray-900">Responsável</TableHead>
              <TableHead className="font-semibold text-gray-900">Data de Criação</TableHead>
              <TableHead className="text-right font-semibold text-gray-900">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies.map((company) => (
              <TableRow key={company.id} className="hover:bg-gray-50 border-b border-gray-100">
                <TableCell className="font-medium">
                  <div>
                      <div className="font-semibold text-gray-900">{company.fantasy_name}</div>
                      {company.company_name && (
                        <div className="text-sm text-gray-500">{company.company_name}</div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {company.sector ? (
                    <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                      {company.sector}
                    </Badge>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {company.description ? (
                    <div className="text-sm text-gray-700 max-w-xs">
                      <div className="truncate" title={company.description}>
                        {company.description}
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {company.responsible_id ? (
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 bg-gray-200 rounded-full"></div>
                      <span className="text-sm text-gray-700">Responsável</span>
                    </div>
                  ) : (
                    <span className="text-gray-400">Não definido</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="text-sm text-gray-600">
                    {new Date(company.created_at).toLocaleDateString('pt-BR', {
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
                      onClick={() => handleViewCompany(company)}
                      className="text-gray-600 hover:text-gray-800 hover:bg-gray-50 p-2"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleEditCompany(company)}
                      className="text-gray-600 hover:text-gray-800 hover:bg-gray-50 p-2"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDeleteCompany(company)}
                      className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

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
