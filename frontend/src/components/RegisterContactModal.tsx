import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  User, 
  Phone, 
  Mail, 
  Building, 
  X,
  MessageSquare,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Contact {
  id: string;
  owner_id: string;
  atendimento_id?: string;
  chat_id?: string;
  business_id?: string;
  name_wpp?: string;
  name: string;
  full_name?: string;
  phone: string;
  email?: string;
  created_at: string;
  updated_at: string;
  // Campos adicionais que podem ser adicionados
  company?: string;
  gender?: string;
  status?: 'active' | 'inactive' | 'lead';
  pipeline?: string;
  tags?: string[];
  whatsapp_opted?: boolean;
  profile_image_url?: string;
  last_contact_at?: string;
}

interface RegisterContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContactCreated: (contact: Contact) => void;
}

const RegisterContactModal: React.FC<RegisterContactModalProps> = ({
  isOpen,
  onClose,
  onContactCreated
}) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    company: '',
    gender: '',
    pipeline: '',
    whatsappOpted: true,
    consent: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpar erro quando usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Nome é obrigatório';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Telefone é obrigatório';
    } else if (!/^\+?[\d\s\-\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'Formato de telefone inválido';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Formato de email inválido';
    }

    if (!formData.consent) {
      newErrors.consent = 'É necessário aceitar os termos de consentimento';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('➕ handleSubmit: Criando novo contato:', formData);
    
    if (!validateForm()) {
      console.log('❌ handleSubmit: Validação falhou');
      return;
    }

    setIsSubmitting(true);

    try {
      const contactData = {
        owner_id: '905b926a-785a-4f6d-9c3a-9455729500b3', // ID do usuário logado
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        full_name: `${formData.firstName} ${formData.lastName}`.trim(),
        phone: formData.phone,
        email: formData.email || null,
        company: formData.company || null,
        gender: formData.gender || null,
        status: 'active',
        pipeline: formData.pipeline || null,
        whatsapp_opted: formData.whatsappOpted,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_contact_at: new Date().toISOString()
      };

      console.log('➕ handleSubmit: Dados para inserção:', contactData);

      // Inserir no Supabase
      const { data, error } = await supabase
        .from('contacts')
        .insert(contactData)
        .select()
        .single();

      if (error) {
        console.error('❌ handleSubmit: Erro no Supabase:', error);
        throw error;
      }

      console.log('✅ handleSubmit: Contato criado no Supabase:', data);

      const newContact: Contact = {
        ...data,
        tags: []
      };

      onContactCreated(newContact);
      
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        company: '',
        gender: '',
        pipeline: '',
        whatsappOpted: true,
        consent: false
      });
      
      onClose();
    } catch (error) {
      console.error('Erro ao criar contato:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenWhatsApp = () => {
    if (formData.firstName && formData.phone) {
      // Redirecionar para WhatsApp com dados pré-preenchidos
      const contactData = {
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        phone: formData.phone
      };
      
      // Salvar dados temporariamente e redirecionar
      localStorage.setItem('tempContact', JSON.stringify(contactData));
      window.location.href = '/whatsapp';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold text-gray-900">
                  Criar Novo Contato
                </DialogTitle>
                <p className="text-sm text-gray-500 mt-1">
                  Adicione um novo contato ao seu sistema
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg shadow-gray-500/5 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 px-6 py-4 border-b border-gray-200/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Informações Básicas</h3>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Nome e Sobrenome */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-semibold text-gray-700">
                    Nome *
                  </Label>
                  <div className="relative">
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      placeholder="Digite o nome"
                      className={`pr-10 ${errors.firstName ? 'border-red-500' : ''}`}
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="w-4 h-4 bg-gray-300 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                  {errors.firstName && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.firstName}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-semibold text-gray-700">
                    Sobrenome
                  </Label>
                  <div className="relative">
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      placeholder="Digite o sobrenome"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="w-4 h-4 bg-gray-300 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Telefone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-semibold text-gray-700">
                  Número de Telefone *
                </Label>
                <div className="flex gap-2">
                  <Select defaultValue="+55">
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="+55">🇧🇷 +55</SelectItem>
                      <SelectItem value="+1">🇺🇸 +1</SelectItem>
                      <SelectItem value="+54">🇦🇷 +54</SelectItem>
                      <SelectItem value="+56">🇨🇱 +56</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex-1 relative">
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="Inserir telefone"
                      className={`pr-10 ${errors.phone ? 'border-red-500' : ''}`}
                    />
                    <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                </div>
                {errors.phone && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.phone}
                  </p>
                )}
              </div>

              {/* WhatsApp */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="whatsapp"
                  checked={formData.whatsappOpted}
                  onCheckedChange={(checked) => handleInputChange('whatsappOpted', checked as boolean)}
                />
                <Label htmlFor="whatsapp" className="text-sm text-gray-700">
                  Salve o número de telefone para utilizar em conversas no WhatsApp
                  <span className="text-blue-600 ml-1">?</span>
                </Label>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                  E-mail
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Digite o email"
                    className={`pr-10 ${errors.email ? 'border-red-500' : ''}`}
                  />
                  <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Empresa */}
              <div className="space-y-2">
                <Label htmlFor="company" className="text-sm font-semibold text-gray-700">
                  Empresa
                </Label>
                <div className="relative">
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                    placeholder="Digite o nome da empresa"
                    className="pr-10"
                  />
                  <Building className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>

              {/* Gênero */}
              <div className="space-y-2">
                <Label htmlFor="gender" className="text-sm font-semibold text-gray-700">
                  Gênero
                </Label>
                <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar um gênero" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="feminino">Feminino</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                    <SelectItem value="prefiro_nao_informar">Prefiro não informar</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Pipeline */}
              <div className="space-y-2">
                <Label htmlFor="pipeline" className="text-sm font-semibold text-gray-700">
                  Pipeline
                </Label>
                <Select value={formData.pipeline} onValueChange={(value) => handleInputChange('pipeline', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar pipeline" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Qualificação">Qualificação</SelectItem>
                    <SelectItem value="Proposta">Proposta</SelectItem>
                    <SelectItem value="Negociação">Negociação</SelectItem>
                    <SelectItem value="Fechamento">Fechamento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Consentimento */}
          <div className="space-y-4">
            <div className="flex items-start space-x-2">
              <Checkbox
                id="consent"
                checked={formData.consent}
                onCheckedChange={(checked) => handleInputChange('consent', checked as boolean)}
                className="mt-1"
              />
              <Label htmlFor="consent" className="text-sm text-gray-700 leading-relaxed">
                Confirmo que obtivemos o consentimento adequado para enviar SMS, e-mail, ou outros tipos de mensagens de contatos sendo criados ou importados, em conformidade com as leis e regulamentos aplicáveis e com os{' '}
                <span className="text-blue-600 underline cursor-pointer">Termos de Serviço</span>.
              </Label>
            </div>
            {errors.consent && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.consent}
              </p>
            )}
          </div>

          {/* Ações */}
          <div className="flex items-center justify-between pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="px-8 py-3 rounded-xl border-gray-300 hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Cancelar
            </Button>
            <div className="flex items-center gap-3">
              {formData.firstName && formData.phone && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleOpenWhatsApp}
                  className="px-6 py-3 rounded-xl border-green-300 text-green-700 hover:bg-green-50 transition-all duration-200 flex items-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  Abrir Conversa
                </Button>
              )}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-500/25 transition-all duration-200 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Criar
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RegisterContactModal;
