import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Building2, 
  Phone, 
  Mail, 
  Package, 
  Plus,
  Search,
  X
} from 'lucide-react';
import { useLeads, CreateLeadData } from '@/hooks/useLeads-fixed';
import { useFunnelStages } from '@/hooks/useFunnelStages';
import { useContacts, Contact } from '@/hooks/useContacts';
import { useProducts, Product } from '@/hooks/useProducts';
import { useSuppliers, Supplier } from '@/hooks/useSuppliers';
import { useTheme } from '@/contexts/ThemeContext';
import { toast } from '@/hooks/use-toast';

interface CreateLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLeadCreated?: () => void;
  defaultStageId?: string | null;
}

const CreateLeadModal: React.FC<CreateLeadModalProps> = ({ 
  isOpen, 
  onClose, 
  onLeadCreated,
  defaultStageId 
}) => {
  const { topBarColor } = useTheme();
  const { createLead } = useLeads();
  const { stages } = useFunnelStages();
  const { contacts, createContact } = useContacts();
  const { products, createProduct } = useProducts();
  const { suppliers } = useSuppliers();

  const [formData, setFormData] = useState<CreateLeadData>({
    name: '',
    email: '',
    phone: '',
    company: '',
    position: '',
    source: 'website',
      priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
      stage_id: '', // Sempre começar vazio, será definido no useEffect
    responsible_id: '',
    contact_id: '',
    product_id: '',
    // Campos removidos: product_quantity, product_price (não existem na tabela leads)
    value: 0,
    currency: 'BRL',
    expected_close_date: '',
    notes: '',
    status: 'cold' as 'hot' | 'cold'
  });


  // Log do estado do formulário quando muda
  useEffect(() => {
    // Se stage_id for "1", investigar de onde veio
    if (formData.stage_id === '1') {
      console.error('❌ PROBLEMA: stage_id é "1"!');
      console.error('❌ Stack trace:', new Error().stack);
    }
  }, [formData]);

  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedResponsible, setSelectedResponsible] = useState<Supplier | null>(null);
  const [showContactSelector, setShowContactSelector] = useState(false);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [showResponsibleSelector, setShowResponsibleSelector] = useState(false);
  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [searchContact, setSearchContact] = useState('');
  const [searchProduct, setSearchProduct] = useState('');
  const [searchResponsible, setSearchResponsible] = useState('');
  const [loading, setLoading] = useState(false);
  const [productQuantity, setProductQuantity] = useState(1);

  // Produto temporário para criação
  const [tempProduct, setTempProduct] = useState({
    name: '',
    description: '',
    base_price: 0,
    currency: 'BRL',
    unit: 'unidade'
  });

  // Opções de origem do lead
  const leadSources = [
    { value: 'website', label: 'Website' },
    { value: 'whatsapp', label: 'WhatsApp' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'facebook', label: 'Facebook' },
    { value: 'telegram', label: 'Telegram' },
    { value: 'youtube', label: 'YouTube' },
    { value: 'tiktok', label: 'TikTok' },
    { value: 'referral', label: 'Indicação' },
    { value: 'cold_call', label: 'Ligação Fria' },
    { value: 'email', label: 'E-mail' },
    { value: 'event', label: 'Evento' },
    { value: 'other', label: 'Outro' }
  ];

  const priorities = [
    { value: 'low', label: 'Baixa', color: 'bg-green-100 text-green-800' },
    { value: 'medium', label: 'Média', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'high', label: 'Alta', color: 'bg-orange-100 text-orange-800' },
    { value: 'urgent', label: 'Urgente', color: 'bg-red-100 text-red-800' }
  ];

  // Filtrar contatos baseado na busca
  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchContact.toLowerCase()) ||
    contact.email?.toLowerCase().includes(searchContact.toLowerCase()) ||
    contact.phone.toLowerCase().includes(searchContact.toLowerCase())
  );

  // Filtrar produtos baseado na busca
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchProduct.toLowerCase()) ||
    product.category?.toLowerCase().includes(searchProduct.toLowerCase())
  );

  // Filtrar responsáveis (suppliers) baseado na busca
  const filteredResponsibles = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchResponsible.toLowerCase()) ||
    supplier.email?.toLowerCase().includes(searchResponsible.toLowerCase())
  );

  // Resetar formulário quando modal é aberto
  useEffect(() => {
    if (isOpen) {
      
      // Reset imediato do formulário
      const defaultStageIdValue = defaultStageId || (stages.length > 0 ? stages[0].id : '');
      
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        position: '',
        source: 'website',
        priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
        stage_id: defaultStageIdValue,
        responsible_id: '',
        contact_id: '',
        product_id: '',
        // Campos removidos: product_quantity, product_price (não existem na tabela leads)
        value: 0,
        currency: 'BRL',
        expected_close_date: '',
        notes: '',
        status: 'cold' as 'hot' | 'cold'
      });
      
      // Limpar seleções
      setSelectedContact(null);
      setSelectedProduct(null);
      setSelectedResponsible(null);
      setShowContactSelector(false);
      setShowProductSelector(false);
      setShowResponsibleSelector(false);
      setShowCreateProduct(false);
      setSearchContact('');
      setSearchProduct('');
      setSearchResponsible('');
      setProductQuantity(1);
    }
  }, [isOpen, defaultStageId, stages]);

  // Definir etapa padrão quando modal é aberto
  useEffect(() => {
    
    if (isOpen && stages.length > 0) {
      // Sempre usar o primeiro stage válido se defaultStageId não for válido
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      let targetStageId = '';
      
      // Se defaultStageId é válido, usar ele
      if (defaultStageId && uuidRegex.test(defaultStageId)) {
        targetStageId = defaultStageId;
      } else {
        // Senão, usar o primeiro stage válido
        const validStage = stages.find(stage => uuidRegex.test(stage.id));
        if (validStage) {
          targetStageId = validStage.id;
        } else {
          console.error('❌ Nenhum stage válido encontrado!');
          return;
        }
      }
      
      setFormData(prev => {
        const newFormData = {
        ...prev,
          stage_id: targetStageId
        };
        return newFormData;
      });
    }
  }, [isOpen, stages, defaultStageId]);

  // Selecionar contato
  const handleSelectContact = (contact: Contact) => {
    console.log('👤 Selecionando contato:', contact);
    console.log('👤 Nome do contato original:', contact.name);
    console.log('👤 Telefone do contato:', contact.phone);
    
    // Validar se o contato tem nome válido
    if (!contact.name || contact.name.trim() === '') {
      console.warn('⚠️ Contato sem nome válido, usando telefone como nome');
      contact.name = contact.phone || 'Contato sem nome';
    }
    
    // Verificar se o nome não é apenas números
    if (/^\d+$/.test(contact.name.trim())) {
      console.warn('⚠️ Nome do contato contém apenas números, usando telefone como nome');
      contact.name = contact.phone || 'Contato sem nome';
    }
    
    console.log('👤 Nome do contato após validação:', contact.name);
    
    setSelectedContact(contact);
    setFormData(prev => {
      const newFormData = {
      ...prev,
      name: contact.name,
      email: contact.email || '',
      phone: contact.phone,
      company: contact.company || '',
      contact_id: contact.id
      };
      console.log('👤 Dados do formulário atualizados:', newFormData);
      console.log('👤 Campo name específico:', newFormData.name);
      return newFormData;
    });
    setShowContactSelector(false);
    setSearchContact('');
  };

  // Selecionar produto
  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setFormData(prev => ({
      ...prev,
      product_id: product.id,
      // product_price: product.base_price, // Removido - não existe na tabela leads
      // product_quantity removido - não existe na tabela leads
      value: product.base_price * productQuantity
    }));
    setShowProductSelector(false);
    setSearchProduct('');
  };

  // Selecionar responsável
  const handleSelectResponsible = (supplier: Supplier) => {
    setSelectedResponsible(supplier);
    setFormData(prev => ({
      ...prev,
      responsible_id: supplier.id
    }));
    setShowResponsibleSelector(false);
    setSearchResponsible('');
  };

  // Criar novo produto
  const handleCreateProduct = async () => {
    try {
      setLoading(true);
      const newProduct = await createProduct(tempProduct);
      
      if (newProduct) {
        setSelectedProduct(newProduct);
        setFormData(prev => ({
          ...prev,
          product_id: newProduct.id,
          // product_price: newProduct.base_price, // Removido - não existe na tabela leads
          value: newProduct.base_price * 1 // Quantidade fixa em 1
        }));
        setShowCreateProduct(false);
        setTempProduct({ name: '', description: '', base_price: 0, currency: 'BRL', unit: 'unidade' });
        toast({
          title: "Produto criado",
          description: "Produto criado com sucesso!",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar produto. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Calcular valor total quando produto mudar
  useEffect(() => {
    if (selectedProduct) {
      setFormData(prev => ({
        ...prev,
        value: selectedProduct.base_price * 1 // Quantidade fixa em 1
      }));
    }
  }, [selectedProduct]);

  // Salvar lead
  const handleSave = async () => {
    // Proteção contra múltiplas execuções
    if (loading) {
      console.log('⚠️ Salvamento já em andamento, ignorando...');
      return;
    }

    try {
      setLoading(true);
      console.log('🚀 Iniciando salvamento do lead...', formData);

      // Validações básicas
      if (!formData.name || formData.name.trim() === '') {
        console.error('❌ Campo name está vazio!');
        toast({
          title: "Erro",
          description: "Nome é obrigatório",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Verificar se o nome não é apenas números (telefone)
      if (/^\d+$/.test(formData.name.trim())) {
        console.error('❌ Nome contém apenas números:', formData.name);
        toast({
          title: "Erro",
          description: "Nome deve conter letras, não apenas números. Verifique se você não digitou o telefone no campo nome.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Verificar se o nome tem pelo menos 2 caracteres
      if (formData.name.trim().length < 2) {
        console.error('❌ Nome muito curto:', formData.name);
        toast({
          title: "Erro",
          description: "Nome deve ter pelo menos 2 caracteres",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Verificar se o nome não é apenas uma letra
      if (formData.name.trim().length === 1) {
        console.error('❌ Nome muito curto (apenas 1 caractere):', formData.name);
        toast({
          title: "Erro",
          description: "Nome deve ter pelo menos 2 caracteres",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Log dos dados antes do salvamento
      console.log('📋 Dados finais do formulário:', {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        stage_id: formData.stage_id
      });

      // Verificar se o nome não é o mesmo que o telefone
      if (formData.name === formData.phone) {
        toast({
          title: "Erro",
          description: "Nome e telefone não podem ser iguais. Verifique se você digitou o telefone no campo nome.",
          variant: "destructive",
        });
        return;
      }

      if (!formData.stage_id) {
        toast({
          title: "Erro",
          description: "Etapa é obrigatória",
          variant: "destructive",
        });
        return;
      }

      // Log para debug da etapa selecionada
      const selectedStage = stages.find(stage => stage.id === formData.stage_id);

      // Se não há contato selecionado e há dados do lead, criar contato
      let contactId = formData.contact_id;
      if (!selectedContact && (formData.name || formData.phone)) {
        console.log('📞 Criando novo contato...');
        
        // Garantir que o nome do contato seja válido
        const contactName = formData.name && !/^\d+$/.test(formData.name.trim()) 
          ? formData.name.trim() 
          : formData.phone || 'Contato sem nome';
          
        const newContact = await createContact({
          name: contactName,
          email: formData.email,
          phone: formData.phone,
          company: formData.company,
          status: 'lead'
        });
        
        if (newContact) {
          contactId = newContact.id;
          console.log('✅ Contato criado:', newContact);
        }
      }

      // Log detalhado do formData antes de criar leadData
      console.log('🔍 formData completo antes de criar leadData:', formData);
      console.log('🔍 formData.name específico:', formData.name);
      console.log('🔍 formData.phone específico:', formData.phone);
      console.log('🔍 formData.stage_id específico:', formData.stage_id);
      console.log('🔍 formData.responsible_id específico:', formData.responsible_id);
      console.log('🔍 formData.product_id específico:', formData.product_id);

      // Validar se stage_id é um UUID válido
      if (!formData.stage_id || formData.stage_id === '1' || formData.stage_id === '') {
        console.error('❌ stage_id inválido:', formData.stage_id);
        toast({
          title: "Erro",
          description: "Etapa inválida. Selecione uma etapa válida.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Validar se stage_id tem formato de UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(formData.stage_id)) {
        console.error('❌ stage_id não é um UUID válido:', formData.stage_id);
        toast({
          title: "Erro",
          description: "ID da etapa inválido. Recarregue a página e tente novamente.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Validar responsible_id - sempre definir como null por enquanto
      let validResponsibleId = null;
      console.log('🔍 responsible_id original no modal:', formData.responsible_id);
      console.log('🔍 Tipo do responsible_id no modal:', typeof formData.responsible_id);
      
      // Por enquanto, sempre definir como null para evitar problemas de FK
      if (formData.responsible_id && formData.responsible_id !== '') {
        console.warn('⚠️ responsible_id fornecido no modal, mas definindo como null para evitar problemas de FK:', formData.responsible_id);
      }
      
      console.log('🔍 responsible_id final no modal:', validResponsibleId);

      // Criar leadData removendo campos que não existem na tabela leads
      const leadData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        company: formData.company,
        position: formData.position,
        source: formData.source,
        priority: formData.priority as 'low' | 'medium' | 'high' | 'urgent',
        stage_id: formData.stage_id,
        responsible_id: validResponsibleId, // Usar ID válido ou null
        product_id: formData.product_id && formData.product_id !== '' ? formData.product_id : null,
        value: formData.value,
        currency: formData.currency,
        expected_close_date: formData.expected_close_date && formData.expected_close_date !== '' ? formData.expected_close_date : null,
        notes: formData.notes,
        status: formData.status
        // Removidos: contact_id, product_price, product_quantity (não existem na tabela leads)
      };

      // Log detalhado do leadData após spread
      console.log('🔍 leadData completo após spread:', leadData);
      console.log('🔍 leadData.name após spread:', leadData.name);
      console.log('🔍 leadData.phone após spread:', leadData.phone);

      // Garantir que o campo name esteja presente
      if (!leadData.name || leadData.name.trim() === '') {
        console.error('❌ Campo name está vazio!');
        console.error('❌ formData.name:', formData.name);
        console.error('❌ leadData.name:', leadData.name);
        toast({
          title: "Erro",
          description: "Nome é obrigatório e não pode estar vazio",
          variant: "destructive",
        });
        return;
      }

      console.log('💾 Salvando lead com dados:', leadData);
      console.log('💾 Campo name específico:', leadData.name);
      console.log('💾 Campo phone específico:', leadData.phone);
      
      const newLead = await createLead(leadData);
      
      if (newLead) {
        console.log('✅ Lead criado com sucesso:', newLead);
        toast({
          title: "Sucesso",
          description: "Oportunidade criada com sucesso!",
        });
             
             // Chamar callback para atualizar a lista
             if (onLeadCreated) {
               console.log('🔄 Chamando onLeadCreated callback...');
               onLeadCreated();
               console.log('✅ onLeadCreated callback executado');
             } else {
               console.warn('⚠️ onLeadCreated callback não fornecido');
             }
             
        onClose();
        resetForm();
      } else {
        console.error('❌ Falha ao criar lead - retorno null');
        toast({
          title: "Erro",
          description: "Falha ao criar oportunidade. Tente novamente.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('❌ Erro ao salvar lead:', error);
      toast({
        title: "Erro",
        description: `Erro ao criar oportunidade: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Resetar formulário
  const resetForm = () => {
    console.log('🔄 Resetando formulário...');
    const defaultStageIdValue = defaultStageId || (stages.length > 0 ? stages[0].id : '');
    console.log('🔄 Stage ID padrão:', defaultStageIdValue);
    
    const newFormData = {
      name: '',
      email: '',
      phone: '',
      company: '',
      position: '',
      source: 'website',
      priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
      stage_id: defaultStageIdValue,
      responsible_id: '',
      contact_id: '',
      product_id: '',
      // Campos removidos: product_quantity, product_price (não existem na tabela leads)
      value: 0,
      currency: 'BRL',
      expected_close_date: '',
      notes: '',
      status: 'cold' as 'hot' | 'cold'
    };
    
    console.log('🔄 Dados do formulário resetados:', newFormData);
    setFormData(newFormData);
    setSelectedContact(null);
    setSelectedProduct(null);
    setSelectedResponsible(null);
    setShowContactSelector(false);
    setShowProductSelector(false);
    setShowResponsibleSelector(false);
    setShowCreateProduct(false);
    setSearchContact('');
    setSearchProduct('');
    setSearchResponsible('');
    setProductQuantity(1);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-xl">
        <DialogHeader className="pb-4">
          <div className="flex justify-between items-center">
            <DialogTitle className="text-xl font-bold text-gray-800">
              Adicionar Nova Oportunidade
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6">
          {/* Coluna Esquerda */}
          <div className="space-y-4">
            {/* Nome */}
            <div>
              <Label htmlFor="name" className="text-sm font-medium text-gray-700">Nome</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => {
                  const value = e.target.value;
                  
                  // Verificar se o valor contém apenas números
                  if (/^\d+$/.test(value.trim()) && value.trim() !== '') {
                    console.warn('⚠️ Nome contém apenas números, isso pode ser um telefone');
                  }
                  
                  setFormData(prev => {
                    const newFormData = { ...prev, name: value };
                    return newFormData;
                  });
                }}
                placeholder="Nome da oportunidade"
                className="mt-1 w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 transition-all duration-200"
              />
              {/^\d+$/.test(formData.name.trim()) && formData.name.trim() !== '' && (
                <p className="text-xs text-red-500 mt-1">
                  ⚠️ Nome deve conter letras, não apenas números
                </p>
              )}
              </div>

            {/* Responsável - Seletor de Contato */}
            <div>
              <Label htmlFor="assignee" className="text-sm font-medium text-gray-700">Responsável</Label>
              <div className="mt-1">
              {selectedContact ? (
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-md">
                        {selectedContact.name.charAt(0).toUpperCase()}
                      </div>
                  <div>
                        <div className="text-sm font-semibold text-gray-800">{selectedContact.name}</div>
                        <div className="text-xs text-gray-600">{selectedContact.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowContactSelector(true)}
                        className="h-8 w-8 p-0 hover:bg-blue-100 rounded-full"
                      >
                        <Search className="h-4 w-4 text-blue-600" />
                      </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedContact(null);
                      setFormData(prev => ({ ...prev, contact_id: '' }));
                    }}
                        className="h-8 w-8 p-0 hover:bg-red-100 rounded-full"
                  >
                        <X className="h-4 w-4 text-red-600" />
                  </Button>
                    </div>
                </div>
              ) : (
                  <Button
                    variant="outline"
                    onClick={() => setShowContactSelector(true)}
                    className="w-full justify-start h-12 px-4 py-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
                  >
                    <Search className="h-5 w-5 mr-3 text-gray-500" />
                    <span className="text-gray-700">Selecionar Contato</span>
                  </Button>
                )}
                                </div>
                              </div>

            {/* Tipo - Origem do Lead */}
            <div>
              <Label htmlFor="type" className="text-sm font-medium text-gray-700">Tipo</Label>
              <Select
                value={formData.source}
                onValueChange={(value) => setFormData(prev => ({ ...prev, source: value }))}
              >
                <SelectTrigger className="mt-1 w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 transition-all duration-200">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {leadSources.map((source) => (
                    <SelectItem key={source.value} value={source.value}>
                      {source.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
                  </div>

            {/* Nome da Empresa */}
            <div>
              <Label htmlFor="company" className="text-sm font-medium text-gray-700">Nome da Empresa</Label>
              <div className="mt-1 flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  E
                </div>
                    <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                  placeholder="Nome da empresa"
                  className="border-0 bg-transparent p-0 focus:ring-0"
                />
              </div>
                  </div>

            {/* Website */}
                    <div>
              <Label htmlFor="website" className="text-sm font-medium text-gray-700">Website</Label>
              <div className="mt-1 flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                </svg>
                      <Input
                  id="website"
                  placeholder="www.empresa.com"
                  className="border-0 p-0 focus:ring-0"
                      />
                    </div>
            </div>

            {/* Email */}
                    <div>
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
              <div className="mt-1 flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="contato@empresa.com"
                  className="border-0 p-0 focus:ring-0"
                      />
                    </div>
                  </div>

            {/* Data Esperada de Fechamento */}
                    <div>
              <Label htmlFor="expectedCloseDate" className="text-sm font-medium text-gray-700">Data Esperada de Fechamento</Label>
              <div className="mt-1 flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                      <Input
                  id="expectedCloseDate"
                  type="date"
                  value={formData.expected_close_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, expected_close_date: e.target.value }))}
                  className="border-0 p-0 focus:ring-0"
                      />
                    </div>
                  </div>
                </div>

          {/* Coluna Direita */}
          <div className="space-y-4">
            {/* Prioridade */}
            <div>
              <Label htmlFor="priority" className="text-sm font-medium text-gray-700">Prioridade</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, priority: value }))}
              >
                <SelectTrigger className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-gray-400">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                    </svg>
                    <SelectValue placeholder="Alto Valor" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {priorities.map((priority) => (
                    <SelectItem key={priority.value} value={priority.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${priority.color.replace('bg-', 'bg-').replace('-100', '-500')}`} />
                        {priority.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              </div>

            {/* Produto - Seletor de Produtos */}
            <div>
              <Label htmlFor="product" className="text-sm font-medium text-gray-700">Produto</Label>
              <div className="mt-1">
              {selectedProduct ? (
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-md">
                        P
                      </div>
                  <div>
                        <div className="text-sm font-semibold text-gray-800">{selectedProduct.name}</div>
                        <div className="text-xs text-gray-600">
                          R$ {selectedProduct.base_price.toFixed(2)} • Qtd: {productQuantity}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowProductSelector(true)}
                        className="h-8 w-8 p-0 hover:bg-green-100 rounded-full"
                      >
                        <Search className="h-4 w-4 text-green-600" />
                      </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedProduct(null);
                      setFormData(prev => ({ 
                        ...prev, 
                        product_id: '',
                        // product_price: 0, // Removido - não existe na tabela leads
                        value: 0
                      }));
                    }}
                        className="h-8 w-8 p-0 hover:bg-red-100 rounded-full"
                  >
                        <X className="h-4 w-4 text-red-600" />
                  </Button>
                    </div>
                </div>
              ) : (
                  <Button
                    variant="outline"
                    onClick={() => setShowProductSelector(true)}
                    className="w-full justify-start h-12 px-4 py-3 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-all duration-200"
                  >
                    <Search className="h-5 w-5 mr-3 text-gray-500" />
                    <span className="text-gray-700">Selecionar Produto</span>
                  </Button>
                )}
                            </div>
                          </div>

            {/* Quantidade do Produto */}
              {selectedProduct && (
                    <div>
                <Label htmlFor="quantity" className="text-sm font-medium text-gray-700">Quantidade</Label>
                      <Input
                        id="quantity"
                        type="number"
                  value={productQuantity}
                  onChange={(e) => {
                    const qty = parseInt(e.target.value) || 1;
                    setProductQuantity(qty);
                    setFormData(prev => ({
                      ...prev,
                      // product_quantity removido - não existe na tabela leads
                      value: selectedProduct.base_price * qty
                    }));
                  }}
                        min="1"
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-gray-400"
                      />
                    </div>
            )}

            {/* Nome do Responsável */}
            <div>
              <Label htmlFor="responsible" className="text-sm font-medium text-gray-700">Nome do Responsável</Label>
              <div className="mt-1">
                {selectedResponsible ? (
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gradient-to-r from-purple-50 to-indigo-50 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-md">
                        {selectedResponsible.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div className="text-sm font-semibold text-gray-800">{selectedResponsible.name}</div>
                        <div className="text-xs text-gray-600">{selectedResponsible.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowResponsibleSelector(true)}
                        className="h-8 w-8 p-0 hover:bg-purple-100 rounded-full"
                      >
                        <Search className="h-4 w-4 text-purple-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedResponsible(null);
                          setFormData(prev => ({ ...prev, responsible_id: '' }));
                        }}
                        className="h-8 w-8 p-0 hover:bg-red-100 rounded-full"
                      >
                        <X className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => setShowResponsibleSelector(true)}
                    className="w-full justify-start h-12 px-4 py-3 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-all duration-200"
                  >
                    <Search className="h-5 w-5 mr-3 text-gray-500" />
                    <span className="text-gray-700">Selecionar Responsável</span>
                  </Button>
                )}
                </div>
                  </div>

            {/* Valor */}
                  <div>
              <Label htmlFor="value" className="text-sm font-medium text-gray-700">Valor</Label>
              <div className="mt-1 flex items-center gap-2">
                <Input
                  id="value"
                  type="number"
                  value={formData.value}
                  onChange={(e) => setFormData(prev => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
                  placeholder="25000"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-gray-400"
                />
                    <Select
                  value={formData.currency}
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, currency: value }))}
                    >
                  <SelectTrigger className="w-20 px-3 py-2 border border-gray-300 rounded-md">
                    <SelectValue placeholder="BRL" />
                      </SelectTrigger>
                      <SelectContent>
                    <SelectItem value="BRL">BRL</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

            {/* Número de Telefone */}
            <div>
              <Label htmlFor="phone" className="text-sm font-medium text-gray-700">Número de Telefone</Label>
              <div className="mt-1 flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => {
                    let phoneValue = e.target.value;
                    
                    // Limpar formato de WhatsApp se presente
                    if (phoneValue.includes('@g.us')) {
                      phoneValue = phoneValue.replace('@g.us', '');
                      console.log('🧹 Telefone limpo de formato WhatsApp:', phoneValue);
                    }
                    
                    // Manter apenas números
                    phoneValue = phoneValue.replace(/\D/g, '');
                    
                    console.log('📞 Telefone atualizado:', phoneValue);
                    setFormData(prev => ({ ...prev, phone: phoneValue }));
                  }}
                  placeholder="(11) 99999-9999"
                  className="border-0 p-0 focus:ring-0"
                />
              </div>
            </div>

            {/* Etapa - Etapa do Kanban */}
                <div>
              <Label htmlFor="stage" className="text-sm font-medium text-gray-700">Etapa</Label>
                  <Select
                    value={formData.stage_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, stage_id: value }))}
                  >
                <SelectTrigger className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-gray-400">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                    </svg>
                    <SelectValue placeholder="Análise Necessária" />
                  </div>
                    </SelectTrigger>
                    <SelectContent>
                      {stages.map((stage) => (
                        <SelectItem key={stage.id} value={stage.id}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: stage.color }}
                            />
                            {stage.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
            </div>
          </div>
                </div>

        {/* Modal de Seleção de Contatos */}
        {showContactSelector && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96 max-h-96 overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Selecionar Contato</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowContactSelector(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-3">
                  <Input
                  placeholder="Buscar contato..."
                  value={searchContact}
                  onChange={(e) => setSearchContact(e.target.value)}
                />
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {filteredContacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="p-3 hover:bg-gray-50 rounded cursor-pointer border"
                      onClick={() => handleSelectContact(contact)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                          {contact.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium">{contact.name}</div>
                          <div className="text-sm text-gray-500">{contact.email}</div>
                          <div className="text-sm text-gray-500">{contact.phone}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Seleção de Produtos */}
        {showProductSelector && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96 max-h-96 overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Selecionar Produto</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowProductSelector(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-3">
                <Input
                  placeholder="Buscar produto..."
                  value={searchProduct}
                  onChange={(e) => setSearchProduct(e.target.value)}
                />
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="p-3 hover:bg-gray-50 rounded cursor-pointer border"
                      onClick={() => handleSelectProduct(product)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                          P
                        </div>
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-gray-500">
                            R$ {product.base_price.toFixed(2)} • {product.unit}
                          </div>
                          {product.description && (
                            <div className="text-xs text-gray-400">{product.description}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Seleção de Responsável */}
        {showResponsibleSelector && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96 max-h-96 overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Selecionar Responsável</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowResponsibleSelector(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-3">
                <Input
                  placeholder="Buscar responsável..."
                  value={searchResponsible}
                  onChange={(e) => setSearchResponsible(e.target.value)}
                />
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {filteredResponsibles.map((supplier) => (
                    <div
                      key={supplier.id}
                      className="p-3 hover:bg-gray-50 rounded cursor-pointer border"
                      onClick={() => handleSelectResponsible(supplier)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                          {supplier.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium">{supplier.name}</div>
                          <div className="text-sm text-gray-500">{supplier.email}</div>
                          {supplier.phone && (
                            <div className="text-xs text-gray-400">{supplier.phone}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Botões de ação - seguindo o design da imagem */}
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={onClose}
            className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md font-medium border-0 focus:ring-2 focus:ring-gray-300"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || !formData.name || !formData.stage_id}
            className="px-6 py-2 text-white rounded-md font-medium border-0 focus:ring-2 focus:ring-blue-300 shadow-lg hover:shadow-xl transition-all duration-200"
            style={{ backgroundColor: '#021529' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#031a35';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#021529';
            }}
          >
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateLeadModal;
