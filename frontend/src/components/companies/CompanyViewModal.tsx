
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Company } from '@/hooks/useCompanies';
import { Building2, Mail, Phone, MapPin, User, Calendar } from 'lucide-react';

interface CompanyViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: Company | null;
}

export function CompanyViewModal({ isOpen, onClose, company }: CompanyViewModalProps) {
  if (!company) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Detalhes da Empresa
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 p-1">
          {/* Company Name */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="text-xl font-bold text-gray-900">{company.fantasy_name}</h3>
              {company.company_name && (
                <p className="text-gray-600">{company.company_name}</p>
              )}
            </div>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 border-b pb-2">Informações Básicas</h4>
              
              {company.cnpj && (
                <div>
                  <label className="text-sm text-gray-600 font-medium">CNPJ</label>
                  <p className="text-gray-900">{company.cnpj}</p>
                </div>
              )}

              {company.sector && (
                <div>
                  <label className="text-sm text-gray-600 font-medium">Setor</label>
                  <div className="mt-1">
                    <Badge variant="outline" className="bg-gray-50">
                      {company.sector}
                    </Badge>
                  </div>
                </div>
              )}

              {company.reference && (
                <div>
                  <label className="text-sm text-gray-600 font-medium">Referência</label>
                  <p className="text-gray-900">{company.reference}</p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 border-b pb-2">Contato</h4>
              
              {company.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <div>
                    <label className="text-sm text-gray-600 font-medium">Email</label>
                    <p className="text-gray-900">{company.email}</p>
                  </div>
                </div>
              )}

              {company.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <div>
                    <label className="text-sm text-gray-600 font-medium">Telefone</label>
                    <p className="text-gray-900">{company.phone}</p>
                  </div>
                </div>
              )}

              {company.responsible_id && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <div>
                    <label className="text-sm text-gray-600 font-medium">Responsável</label>
                    <p className="text-gray-900">Responsável definido</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Address Information */}
          {(company.address || company.city || company.state || company.cep) && (
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 border-b pb-2 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Endereço
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {company.address && (
                  <div>
                    <label className="text-sm text-gray-600 font-medium">Endereço</label>
                    <p className="text-gray-900">{company.address}</p>
                  </div>
                )}
                {company.cep && (
                  <div>
                    <label className="text-sm text-gray-600 font-medium">CEP</label>
                    <p className="text-gray-900">{company.cep}</p>
                  </div>
                )}
                {company.city && (
                  <div>
                    <label className="text-sm text-gray-600 font-medium">Cidade</label>
                    <p className="text-gray-900">{company.city}</p>
                  </div>
                )}
                {company.state && (
                  <div>
                    <label className="text-sm text-gray-600 font-medium">Estado</label>
                    <p className="text-gray-900">{company.state}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Description */}
          {company.description && (
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-900 border-b pb-2">Descrição</h4>
              <p className="text-gray-700 leading-relaxed">{company.description}</p>
            </div>
          )}

          {/* Timestamps */}
          <div className="flex items-center gap-6 text-sm text-gray-500 pt-4 border-t">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>Criado em: {new Date(company.created_at).toLocaleDateString('pt-BR')}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>Atualizado em: {new Date(company.updated_at).toLocaleDateString('pt-BR')}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
