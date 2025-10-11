import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, AlertTriangle, User, Building2, MapPin, Phone, Mail, Globe } from 'lucide-react';
import { Lead } from '@/hooks/useLeads-fixed';
import { useTheme } from '@/contexts/ThemeContext';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface LeadWonModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead;
  onConfirm: (leadId: string) => Promise<boolean>;
}

const LeadWonModal: React.FC<LeadWonModalProps> = ({ 
  isOpen, 
  onClose, 
  lead, 
  onConfirm 
}) => {
  const { topBarColor } = useTheme();
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [showIncompleteData, setShowIncompleteData] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // 1 = descrição, 2 = empresa
  
  // Estados para dados da empresa
  const [companyName, setCompanyName] = useState(lead.company || '');
  const [companyEmail, setCompanyEmail] = useState(lead.email || '');
  const [companyPhone, setCompanyPhone] = useState(lead.phone || '');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyDescription, setCompanyDescription] = useState('');

  // Verificar se há dados faltantes
  const missingData = [];
  if (!lead.email) missingData.push('E-mail');
  if (!lead.phone) missingData.push('Telefone');
  if (!lead.company) missingData.push('Empresa');

  const hasIncompleteData = missingData.length > 0;

  const handleNextStep = () => {
    if (currentStep === 1) {
      setCurrentStep(2);
    }
  };

  const handlePrevStep = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    }
  };

  const handleClose = () => {
    setCurrentStep(1);
    setNotes('');
    setCompanyName(lead.company || '');
    setCompanyEmail(lead.email || '');
    setCompanyPhone(lead.phone || '');
    setCompanyAddress('');
    setCompanyDescription('');
    onClose();
  };

  const handleConfirm = async () => {
    try {
      setLoading(true);

      // Validar campos obrigatórios
      if (!companyName.trim()) {
        toast({
          title: "Erro",
          description: "Nome da empresa é obrigatório.",
          variant: "destructive",
        });
        return;
      }

      if (!companyEmail.trim()) {
        toast({
          title: "Erro",
          description: "E-mail da empresa é obrigatório.",
          variant: "destructive",
        });
        return;
      }

      // Buscar o usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Erro",
          description: "Usuário não autenticado. Faça login novamente.",
          variant: "destructive",
        });
        return;
      }

      // Preparar descrição com notas de fechamento
      const companyDescriptionText = companyDescription.trim() || '';
      const closingNotesText = notes.trim();
      const fullDescription = closingNotesText 
        ? `${companyDescriptionText}\n\nNotas do Fechamento:\n${closingNotesText}`.trim()
        : companyDescriptionText;

      // Criar empresa no Supabase usando a mesma estrutura da página /companies
      const insertData = {
        owner_id: user.id, // Usar user.id diretamente como na página /companies
        fantasy_name: companyName.trim(), // Nome da empresa como fantasy_name
        company_name: companyName.trim(), // Mesmo nome para company_name
        email: companyEmail.trim() || null,
        phone: companyPhone.trim() || null,
        address: companyAddress.trim() || null,
        description: fullDescription || null,
        status: 'active'
      };

      console.log('📝 Criando empresa com dados:', insertData);

      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert([insertData])
        .select()
        .single();

      if (companyError) {
        console.error('Erro ao criar empresa:', companyError);
        toast({
          title: "Erro",
          description: "Erro ao criar empresa. Tente novamente.",
          variant: "destructive",
        });
        return;
      }

      // Marcar lead como ganho
      const success = await onConfirm(lead.id);
      
      if (success) {
        toast({
          title: "Lead ganho!",
          description: `Lead transformado em empresa "${companyName}" com sucesso.`,
        });
        handleClose();
        // Redirecionar para página de empresas
        window.location.href = '/companies';
      } else {
        toast({
          title: "Erro",
          description: "Erro ao marcar lead como ganho. Tente novamente.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro ao processar lead ganho:', error);
      toast({
        title: "Erro",
        description: "Erro ao processar lead ganho. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteData = () => {
    // Aqui você pode abrir um modal de edição ou redirecionar para a página de contatos
    toast({
      title: "Finalizar cadastro",
      description: "Por favor, complete os dados do lead antes de marcá-lo como ganho.",
      variant: "destructive",
    });
    setShowIncompleteData(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm w-full mx-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Marcar Lead como Ganho
          </DialogTitle>
          {!showIncompleteData && (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${currentStep >= 1 ? 'bg-green-600' : 'bg-gray-300'}`}></div>
                <span className="text-xs text-gray-600">Descrição</span>
              </div>
              <div className="w-4 h-px bg-gray-300"></div>
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${currentStep >= 2 ? 'bg-green-600' : 'bg-gray-300'}`}></div>
                <span className="text-xs text-gray-600">Empresa</span>
              </div>
            </div>
          )}
        </DialogHeader>

        {!showIncompleteData ? (
          <div className="space-y-3">
            {/* Etapa 1: Descrição */}
            {currentStep === 1 && (
              <>
            <Card>
                  <CardContent className="p-3">
                <div className="space-y-2">
                  <h3 className="font-medium">{lead.name}</h3>
                  {lead.company && (
                    <p className="text-sm text-gray-600">{lead.company}</p>
                  )}
                  {lead.value && (
                    <p className="text-sm font-medium text-green-600">
                      Valor: R$ {lead.value.toFixed(2)}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <div>
                  <Label htmlFor="notes" className="text-xs font-medium">Descrição do Fechamento *</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                    placeholder="Descreva como foi o fechamento, condições acordadas, etc..."
                rows={3}
                    className="mt-1 text-xs"
              />
            </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
                  <Button 
                    variant="outline" 
                    onClick={handleClose}
                    className="px-3 py-1 text-xs"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleNextStep}
                    disabled={!notes.trim()}
                    style={{ backgroundColor: topBarColor, color: 'white' }}
                    className="px-3 py-1 text-xs flex items-center gap-1"
                  >
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Avançar
                  </div>
                  </Button>
                </div>
              </>
            )}

            {/* Etapa 2: Dados da Empresa */}
            {currentStep === 2 && (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="h-4 w-4 text-green-600" />
                  <h3 className="text-sm font-semibold text-gray-900">Dados da Empresa</h3>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <Label htmlFor="companyName" className="text-xs font-medium">
                      Nome da Empresa *
                    </Label>
                    <Input
                      id="companyName"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Digite o nome da empresa"
                      className="mt-1 text-xs h-8"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="companyEmail" className="text-xs font-medium">
                        E-mail *
                      </Label>
                      <Input
                        id="companyEmail"
                        type="email"
                        value={companyEmail}
                        onChange={(e) => setCompanyEmail(e.target.value)}
                        placeholder="empresa@exemplo.com"
                        className="mt-1 text-xs h-8"
                      />
                    </div>
                    <div>
                      <Label htmlFor="companyPhone" className="text-xs font-medium">
                        Telefone
                      </Label>
                      <Input
                        id="companyPhone"
                        value={companyPhone}
                        onChange={(e) => setCompanyPhone(e.target.value)}
                        placeholder="(11) 99999-9999"
                        className="mt-1 text-xs h-8"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="companyAddress" className="text-xs font-medium">
                      Endereço
                    </Label>
                    <Input
                      id="companyAddress"
                      value={companyAddress}
                      onChange={(e) => setCompanyAddress(e.target.value)}
                      placeholder="Rua, número, bairro, cidade"
                      className="mt-1 text-xs h-8"
                    />
                  </div>


                  <div>
                    <Label htmlFor="companyDescription" className="text-xs font-medium">
                      Descrição da Empresa
                    </Label>
                    <Textarea
                      id="companyDescription"
                      value={companyDescription}
                      onChange={(e) => setCompanyDescription(e.target.value)}
                      placeholder="Descreva a empresa e seus serviços..."
                      rows={2}
                      className="mt-1 text-xs"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
                  <Button 
                    variant="outline" 
                    onClick={handlePrevStep}
                    className="px-3 py-1 text-xs"
                  >
                    Voltar
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={loading}
                style={{ backgroundColor: topBarColor, color: 'white' }}
                    className="px-3 py-1 text-xs flex items-center gap-1"
                  >
                    {loading ? (
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Salvando...
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        Salvar Empresa
                      </div>
                    )}
              </Button>
            </div>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-center">
              <User className="h-8 w-8 text-yellow-600 mx-auto mb-3" />
              <h3 className="text-sm font-medium mb-2">Finalizar Cadastro</h3>
              <p className="text-xs text-gray-600 mb-3">
                Para marcar este lead como ganho, é necessário completar os seguintes dados:
              </p>
            </div>

            <div className="space-y-2">
              {missingData.map((field) => (
                <div key={field} className="flex items-center gap-2 text-xs">
                  <AlertTriangle className="h-3 w-3 text-yellow-600" />
                  <span className="text-gray-700">{field}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
              <Button 
                variant="outline" 
                onClick={() => setShowIncompleteData(false)}
                className="px-3 py-1 text-xs"
              >
                Voltar
              </Button>
              <Button
                onClick={handleCompleteData}
                style={{ backgroundColor: topBarColor, color: 'white' }}
                className="px-3 py-1 text-xs"
              >
                Finalizar Cadastro
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LeadWonModal;

