import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  Mail, 
  Building2, 
  User, 
  X, 
  Check,
  Users,
  ChevronDown,
  ChevronUp,
  Filter,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Recipient {
  id: string;
  name: string;
  email: string;
  type: 'contact' | 'company';
  company?: string;
  phone?: string;
  avatar?: string;
  originalId: string; // ID original da tabela
}

interface AdvancedRecipientSelectorProps {
  selectedRecipients: Recipient[];
  onRecipientsChange: (recipients: Recipient[]) => void;
  maxRecipients?: number;
  layoutVariant?: 'default' | 'image';
}

export function AdvancedRecipientSelector({ 
  selectedRecipients, 
  onRecipientsChange, 
  maxRecipients = 100,
  layoutVariant = 'default'
}: AdvancedRecipientSelectorProps) {
  const { user } = useAuth();
  const [allRecipients, setAllRecipients] = useState<Recipient[]>([]);
  const [filteredRecipients, setFilteredRecipients] = useState<Recipient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'contacts' | 'companies'>('all');
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);

  // Carregar todos os destinatários
  const loadAllRecipients = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      // Buscar contatos e empresas simultaneamente
      const [contactsResult, companiesResult] = await Promise.all([
        supabase
          .from('contacts')
          .select('id, name, email, phone, company')
          .eq('owner_id', user.id)
          .not('email', 'is', null)
          .order('name'),
        
        supabase
          .from('companies')
          .select('id, fantasy_name, company_name, email, phone')
          .eq('owner_id', user.id)
          .not('email', 'is', null)
          .order('fantasy_name')
      ]);

      const contacts: Recipient[] = (contactsResult.data || []).map(contact => ({
        id: `contact_${contact.id}`,
        name: contact.name,
        email: contact.email,
        type: 'contact' as const,
        company: contact.company || undefined,
        phone: contact.phone || undefined,
        originalId: contact.id,
      }));

      const companies: Recipient[] = (companiesResult.data || []).map(company => ({
        id: `company_${company.id}`,
        name: company.fantasy_name || company.company_name || 'Empresa sem nome',
        email: company.email,
        type: 'company' as const,
        phone: company.phone || undefined,
        originalId: company.id,
      }));

      const allRecipients = [...contacts, ...companies];
      setAllRecipients(allRecipients);
      setFilteredRecipients(allRecipients);
    } catch (error) {
      console.error('Erro ao carregar destinatários:', error);
      toast.error('Erro ao carregar destinatários');
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar dados na inicialização
  useEffect(() => {
    loadAllRecipients();
  }, [user?.id]);

  // Filtrar destinatários baseado na busca e filtros
  useEffect(() => {
    let filtered = allRecipients;

    // Filtrar por tipo
    if (filterType !== 'all') {
      filtered = filtered.filter(recipient => recipient.type === filterType);
    }

    // Filtrar por busca
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(recipient =>
        recipient.name.toLowerCase().includes(term) ||
        recipient.email.toLowerCase().includes(term) ||
        (recipient.company && recipient.company.toLowerCase().includes(term))
      );
    }

    // Mostrar apenas selecionados
    if (showSelectedOnly) {
      filtered = filtered.filter(recipient =>
        selectedRecipients.some(selected => selected.id === recipient.id)
      );
    }

    setFilteredRecipients(filtered);
  }, [allRecipients, searchTerm, filterType, showSelectedOnly, selectedRecipients]);

  // Toggle seleção individual
  const toggleRecipient = (recipient: Recipient) => {
    const isSelected = selectedRecipients.some(r => r.id === recipient.id);
    
    if (isSelected) {
      // Remover
      onRecipientsChange(selectedRecipients.filter(r => r.id !== recipient.id));
    } else {
      // Adicionar
      if (selectedRecipients.length >= maxRecipients) {
        toast.error(`Máximo de ${maxRecipients} destinatários permitido`);
        return;
      }
      onRecipientsChange([...selectedRecipients, recipient]);
    }
  };

  // Selecionar/deselecionar todos os destinatários visíveis
  const toggleSelectAll = () => {
    const visibleSelectedCount = filteredRecipients.filter(recipient =>
      selectedRecipients.some(selected => selected.id === recipient.id)
    ).length;

    const isAllSelected = visibleSelectedCount === filteredRecipients.length;

    if (isAllSelected) {
      // Deselecionar todos os visíveis
      const newSelection = selectedRecipients.filter(recipient =>
        !filteredRecipients.some(filtered => filtered.id === recipient.id)
      );
      onRecipientsChange(newSelection);
    } else {
      // Selecionar todos os visíveis
      const newSelections = filteredRecipients.filter(recipient =>
        !selectedRecipients.some(selected => selected.id === recipient.id)
      );

      if (selectedRecipients.length + newSelections.length > maxRecipients) {
        toast.error(`Máximo de ${maxRecipients} destinatários permitido`);
        return;
      }

      onRecipientsChange([...selectedRecipients, ...newSelections]);
    }
  };

  // Limpar seleção
  const clearSelection = () => {
    onRecipientsChange([]);
    toast.success('Seleção limpa');
  };

  // Verificar se todos estão selecionados
  const isAllSelected = filteredRecipients.length > 0 && 
    filteredRecipients.every(recipient =>
      selectedRecipients.some(selected => selected.id === recipient.id)
    );

  // Verificar se alguns estão selecionados
  const isSomeSelected = filteredRecipients.some(recipient =>
    selectedRecipients.some(selected => selected.id === recipient.id)
  );

  // Estatísticas
  const stats = {
    total: allRecipients.length,
    contacts: allRecipients.filter(r => r.type === 'contact').length,
    companies: allRecipients.filter(r => r.type === 'company').length,
    selected: selectedRecipients.length,
    filtered: filteredRecipients.length
  };

  if (layoutVariant === 'image') {
    return (
      <div className="space-y-4">
        {/* Campo de busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar contatos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Seção "Filtrar por tags" - placeholder */}
        <div className="space-y-2">
          <Label>Filtrar por tags</Label>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="cursor-pointer">importado</Badge>
            {/* Adicionar mais tags aqui se necessário */}
          </div>
        </div>

        {/* Cabeçalho "Contato" e botão "Selecionar todos os contatos" */}
        <div className="flex items-center justify-between">
          <Label className="font-semibold">Contato</Label>
          <Button variant="outline" size="sm" onClick={toggleSelectAll}>
            <Check className="mr-2 h-4 w-4" /> Selecionar todos os contatos
          </Button>
        </div>

        {/* Lista de destinatários */}
        <ScrollArea className="h-[200px] border rounded-lg">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-sm text-gray-600">Carregando destinatários...</span>
            </div>
          ) : filteredRecipients.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-500">
              {searchTerm ? 'Nenhum destinatário encontrado' : 'Nenhum destinatário disponível'}
            </div>
          ) : (
            <div className="p-2">
              {filteredRecipients.map((recipient, index) => {
                const isSelected = selectedRecipients.some(r => r.id === recipient.id);
                return (
                  <div key={recipient.id}>
                    <div
                      className={`flex items-center space-x-3 p-3 hover:bg-gray-50 rounded cursor-pointer transition-colors ${
                        isSelected ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => toggleRecipient(recipient)}
                    >
                      <Checkbox
                        checked={isSelected}
                        onChange={() => {}} // Handled by parent onClick
                        className="pointer-events-none"
                      />
                      
                      <div className="flex-shrink-0">
                        {recipient.type === 'company' ? (
                          <Building2 className="h-5 w-5 text-blue-600" />
                        ) : (
                          <User className="h-5 w-5 text-green-600" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {recipient.name}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {recipient.type === 'company' ? 'Empresa' : 'Contato'}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-500 truncate">
                          {recipient.email}
                        </div>
                        {recipient.company && recipient.type === 'contact' && (
                          <div className="text-xs text-gray-400 truncate">
                            {recipient.company}
                          </div>
                        )}
                      </div>
                      
                      {isSelected && (
                        <Check className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                    
                    {index < filteredRecipients.length - 1 && (
                      <Separator className="mx-3" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Exibição de destinatários selecionados */}
        {selectedRecipients.length > 0 && (
          <div className="space-y-2">
            <Label>Destinatários Selecionados ({selectedRecipients.length})</Label>
            <div className="flex flex-wrap gap-2">
              {selectedRecipients.map((recipient) => (
                <Badge key={recipient.id} variant="secondary" className="flex items-center gap-1">
                  {recipient.name}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => toggleRecipient(recipient)} />
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Label>Selecionar Destinatários</Label>
      
      {/* Resumo e controles principais */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Destinatários ({stats.selected}/{maxRecipients})
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-8"
              >
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                {isExpanded ? 'Recolher' : 'Expandir'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={loadAllRecipients}
                disabled={isLoading}
                className="h-8"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
          
          {/* Estatísticas */}
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>Total: {stats.total}</span>
            <span>Contatos: {stats.contacts}</span>
            <span>Empresas: {stats.companies}</span>
            {stats.filtered !== stats.total && (
              <span className="text-blue-600">Filtrados: {stats.filtered}</span>
            )}
          </div>
        </CardHeader>

        {/* Lista de destinatários selecionados */}
        {selectedRecipients.length > 0 && (
          <CardContent className="pt-0">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Selecionados:</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSelection}
                  className="h-6 px-2 text-xs text-red-600 hover:text-red-700"
                >
                  Limpar todos
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {selectedRecipients.map((recipient) => (
                  <Badge
                    key={recipient.id}
                    variant="secondary"
                    className="flex items-center space-x-2 pr-1"
                  >
                    <div className="flex items-center space-x-1">
                      {recipient.type === 'company' ? (
                        <Building2 className="h-3 w-3" />
                      ) : (
                        <User className="h-3 w-3" />
                      )}
                      <span className="text-xs">{recipient.name}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleRecipient(recipient)}
                      className="h-4 w-4 p-0 hover:bg-gray-300"
                    >
                      <X className="h-2 w-2" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Painel expandido */}
      {isExpanded && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Lista de Destinatários
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Controles de filtro e busca */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Campo de busca */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por nome, email ou empresa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filtros */}
              <div className="flex gap-2">
                <Button
                  variant={filterType === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('all')}
                  className="h-9"
                >
                  Todos
                </Button>
                <Button
                  variant={filterType === 'contacts' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('contacts')}
                  className="h-9"
                >
                  <User className="h-3 w-3 mr-1" />
                  Contatos
                </Button>
                <Button
                  variant={filterType === 'companies' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('companies')}
                  className="h-9"
                >
                  <Building2 className="h-3 w-3 mr-1" />
                  Empresas
                </Button>
              </div>
            </div>

            {/* Opção de mostrar apenas selecionados */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="show-selected-only"
                checked={showSelectedOnly}
                onCheckedChange={(checked) => setShowSelectedOnly(!!checked)}
              />
              <Label htmlFor="show-selected-only" className="text-sm">
                Mostrar apenas destinatários selecionados
              </Label>
            </div>

            {/* Controle de selecionar todos */}
            {filteredRecipients.length > 0 && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="select-all"
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isSomeSelected && !isAllSelected;
                    }}
                    onCheckedChange={toggleSelectAll}
                  />
                  <Label htmlFor="select-all" className="font-medium">
                    {isAllSelected ? 'Deselecionar todos' : 'Selecionar todos'}
                    {filteredRecipients.length > 0 && (
                      <span className="text-gray-500 ml-1">
                        ({filteredRecipients.length} {filteredRecipients.length === 1 ? 'item' : 'itens'})
                      </span>
                    )}
                  </Label>
                </div>
              </div>
            )}

            {/* Lista de destinatários */}
            <ScrollArea className="h-80 w-full border rounded-lg">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-sm text-gray-600">Carregando destinatários...</span>
                </div>
              ) : filteredRecipients.length === 0 ? (
                <div className="text-center py-8 text-sm text-gray-500">
                  {searchTerm ? 'Nenhum destinatário encontrado' : 'Nenhum destinatário disponível'}
                </div>
              ) : (
                <div className="p-2">
                  {filteredRecipients.map((recipient, index) => {
                    const isSelected = selectedRecipients.some(r => r.id === recipient.id);
                    return (
                      <div key={recipient.id}>
                        <div
                          className={`flex items-center space-x-3 p-3 hover:bg-gray-50 rounded cursor-pointer transition-colors ${
                            isSelected ? 'bg-blue-50' : ''
                          }`}
                          onClick={() => toggleRecipient(recipient)}
                        >
                          <Checkbox
                            checked={isSelected}
                            onChange={() => {}} // Handled by parent onClick
                            className="pointer-events-none"
                          />
                          
                          <div className="flex-shrink-0">
                            {recipient.type === 'company' ? (
                              <Building2 className="h-5 w-5 text-blue-600" />
                            ) : (
                              <User className="h-5 w-5 text-green-600" />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-gray-900 truncate">
                                {recipient.name}
                              </span>
                              <Badge variant="secondary" className="text-xs">
                                {recipient.type === 'company' ? 'Empresa' : 'Contato'}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-500 truncate">
                              {recipient.email}
                            </div>
                            {recipient.company && recipient.type === 'contact' && (
                              <div className="text-xs text-gray-400 truncate">
                                {recipient.company}
                              </div>
                            )}
                          </div>
                          
                          {isSelected && (
                            <Check className="h-4 w-4 text-blue-600" />
                          )}
                        </div>
                        
                        {index < filteredRecipients.length - 1 && (
                          <Separator className="mx-3" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
