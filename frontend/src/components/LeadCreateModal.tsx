import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { X, User, Phone, Mail, Building2, DollarSign, Search, Check, Calendar, FileText } from 'lucide-react';
import { useWhatsAppContacts } from '@/hooks/useWhatsAppContacts';
import { useLeads } from '@/hooks/useLeads-fixed';

// Mock do toast para evitar erros
const toast = ({ title, description, variant }: any) => {
  console.log(`${variant === 'destructive' ? 'ERRO' : 'SUCESSO'}: ${title} - ${description}`);
};

interface LeadData {
  name: string;
  email: string;
  phone: string;
  company: string;
  value: number;
  priority: 'low' | 'medium' | 'high';
  stage_id: string;
  source: string;
  notes?: string;
  currency?: string;
  whatsapp_contact_id?: string;
  product_id?: string;
  expected_close_date?: string;
}

interface LeadCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (leadData: LeadData) => Promise<any>;
  stages: Array<{ id: string; name: string; color: string }>;
}

const LeadCreateModal = ({ isOpen, onClose, onSubmit, stages }: LeadCreateModalProps) => {
  // Usar hooks reais para contatos e leads
  const { contacts: whatsappContacts, loading: contactsLoading } = useWhatsAppContacts();
  const { createLead } = useLeads();
  const inventoryItems = [];
  const inventoryLoading = false;
  
  const [formData, setFormData] = useState<LeadData>({
    name: '',
    email: '',
    phone: '',
    company: '',
    value: 0,
    priority: 'medium',
    stage_id: stages[0]?.id || '',
    source: '',
    notes: '',
    currency: 'BRL',
    whatsapp_contact_id: '',
    product_id: '',
    expected_close_date: ''
  });

  const [loading, setLoading] = useState(false);
  const [showContactSelector, setShowContactSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContact, setSelectedContact] = useState<any>(null);

  const handleInputChange = (field: keyof LeadData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Filtrar contatos do WhatsApp
  const filteredContacts = (whatsappContacts || []).filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.phone.includes(searchQuery) ||
    (contact.whatsapp_name && contact.whatsapp_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleContactSelect = (contact: any) => {
    setSelectedContact(contact);
    setFormData(prev => ({
      ...prev,
      name: contact.name || contact.whatsapp_name || '',
      phone: contact.phone,
      email: contact.email || '',
      whatsapp_contact_id: contact.id
    }));
    setShowContactSelector(false);
    setSearchQuery('');
  };

  const handleClearContact = () => {
    setSelectedContact(null);
    setFormData(prev => ({
      ...prev,
      name: '',
      phone: '',
      email: '',
      whatsapp_contact_id: ''
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.phone) {
      toast({
        title: "Erro",
        description: "Nome e Telefone são obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Preparar dados para criação do lead
      const leadData = {
        name: formData.name,
        email: formData.email || '',
        phone: formData.phone,
        company: formData.company || '',
        value: formData.value || 0,
        priority: formData.priority,
        stage_id: formData.stage_id,
        source: formData.source || 'manual',
        notes: formData.notes || '',
        currency: formData.currency || 'BRL',
        whatsapp_contact_id: formData.whatsapp_contact_id || null,
        product_id: formData.product_id || null,
        expected_close_date: formData.expected_close_date || null
      };

      // Criar lead usando o hook
      await createLead(leadData);
      
      toast({
        title: "Sucesso",
        description: "Lead criado com sucesso!"
      });

      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        value: 0,
        priority: 'medium',
        stage_id: stages[0]?.id || '',
        source: '',
        notes: '',
        currency: 'BRL',
        whatsapp_contact_id: '',
        product_id: '',
        expected_close_date: ''
      });
      setSelectedContact(null);
      setSearchQuery('');
      setShowContactSelector(false);
      
      onClose();
      
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar lead.",
        variant: "destructive"
      });
      console.error('Erro ao criar lead:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      company: '',
      value: 0,
      priority: 'medium',
      stage_id: stages[0]?.id || '',
      source: '',
      notes: '',
      currency: 'BRL',
      whatsapp_contact_id: '',
      product_id: '',
      expected_close_date: ''
    });
    setSelectedContact(null);
    setSearchQuery('');
    setShowContactSelector(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header do Modal */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Criar Novo Lead</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="w-8 h-8 p-0 text-gray-600 hover:bg-gray-100 rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Seleção de contato do WhatsApp */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-700">Selecionar Contato do WhatsApp</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowContactSelector(!showContactSelector)}
                className="flex-1 justify-start h-10"
              >
                <User className="h-4 w-4 mr-2" />
                {selectedContact ? selectedContact.name || selectedContact.whatsapp_name : 'Selecionar contato'}
              </Button>
              {selectedContact && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClearContact}
                  className="h-10 w-10 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {showContactSelector && (
              <Card className="max-h-48 overflow-y-auto">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Buscar contato..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      {contactsLoading ? (
                        <div className="text-center py-4 text-gray-500 text-sm">Carregando contatos...</div>
                      ) : filteredContacts.length > 0 ? (
                        filteredContacts.map((contact) => (
                          <div
                            key={contact.id}
                            className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                            onClick={() => handleContactSelect(contact)}
                          >
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={contact.whatsapp_profile_picture} />
                              <AvatarFallback>
                                <User className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm">
                                {contact.name || contact.whatsapp_name || 'Contato sem nome'}
                              </div>
                              <div className="text-xs text-gray-500">{contact.phone}</div>
                            </div>
                            {selectedContact?.id === contact.id && (
                              <Check className="h-4 w-4 text-blue-600" />
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4 text-gray-500 text-sm">
                          Nenhum contato encontrado
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Informações pessoais */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                Nome *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Nome do lead"
                required
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                Telefone *
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Telefone do lead"
                required
                className="h-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
              E-mail
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="E-mail do lead"
              className="h-10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company" className="text-sm font-medium text-gray-700">
              Empresa
            </Label>
            <Input
              id="company"
              value={formData.company}
              onChange={(e) => handleInputChange('company', e.target.value)}
              placeholder="Empresa do lead"
              className="h-10"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="value" className="text-sm font-medium text-gray-700">
                Valor
              </Label>
              <Input
                id="value"
                type="number"
                value={formData.value}
                onChange={(e) => handleInputChange('value', parseFloat(e.target.value) || 0)}
                placeholder="Valor do lead"
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority" className="text-sm font-medium text-gray-700">Prioridade</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: 'low' | 'medium' | 'high') => handleInputChange('priority', value)}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Selecionar prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stage_id" className="text-sm font-medium text-gray-700">Etapa do Pipeline</Label>
              <Select
                value={formData.stage_id}
                onValueChange={(value) => handleInputChange('stage_id', value)}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Selecionar etapa" />
                </SelectTrigger>
                <SelectContent>
                  {stages.map((stage) => (
                    <SelectItem key={stage.id} value={stage.id}>
                      {stage.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="source" className="text-sm font-medium text-gray-700">Origem</Label>
              <Input
                id="source"
                value={formData.source}
                onChange={(e) => handleInputChange('source', e.target.value)}
                placeholder="De onde veio o lead"
                className="h-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="product_id" className="text-sm font-medium text-gray-700">Produto</Label>
            <Select
              value={formData.product_id}
              onValueChange={(value) => handleInputChange('product_id', value)}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Selecionar produto" />
              </SelectTrigger>
              <SelectContent>
                {inventoryLoading ? (
                  <SelectItem value="loading" disabled>Carregando produtos...</SelectItem>
                ) : (inventoryItems || []).length > 0 ? (
                  (inventoryItems || []).map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name} - R$ {item.price.toLocaleString()}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-items" disabled>Nenhum produto encontrado</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expected_close_date" className="text-sm font-medium text-gray-700">Data Prevista de Fechamento</Label>
            <Input
              id="expected_close_date"
              type="date"
              value={formData.expected_close_date}
              onChange={(e) => handleInputChange('expected_close_date', e.target.value)}
              className="h-10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium text-gray-700">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Adicionar observações sobre o lead"
              rows={3}
              className="resize-none"
            />
          </div>
        </form>

        {/* Footer do Modal */}
        <div className="flex justify-end p-6 border-t border-gray-200 space-x-3">
          <Button variant="ghost" onClick={handleClose} disabled={loading} className="h-10">
            Cancelar
          </Button>
          <Button type="submit" onClick={handleSubmit} disabled={loading} className="h-10">
            {loading ? 'Criando...' : 'Criar Lead'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LeadCreateModal;
