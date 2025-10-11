import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Search, 
  Mail, 
  Building2, 
  User, 
  X, 
  Plus,
  Check,
  ChevronDown,
  ChevronUp
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
}

interface RecipientSearchProps {
  selectedRecipients: Recipient[];
  onRecipientsChange: (recipients: Recipient[]) => void;
  placeholder?: string;
  maxRecipients?: number;
}

export function RecipientSearch({ 
  selectedRecipients, 
  onRecipientsChange, 
  placeholder = "Digite para buscar destinatários...",
  maxRecipients = 50
}: RecipientSearchProps) {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Recipient[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Função para buscar destinatários
  const searchRecipients = async (term: string) => {
    if (!term.trim() || term.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // Buscar em contacts e companies simultaneamente
      const [contactsResult, companiesResult] = await Promise.all([
        // Buscar contatos
        supabase
          .from('contacts')
          .select('id, name, email, phone, company')
          .eq('owner_id', user?.id)
          .or(`name.ilike.%${term}%,email.ilike.%${term}%,company.ilike.%${term}%`)
          .not('email', 'is', null)
          .limit(10),
        
        // Buscar empresas
        supabase
          .from('companies')
          .select('id, fantasy_name, company_name, email, phone')
          .eq('owner_id', user?.id)
          .or(`fantasy_name.ilike.%${term}%,company_name.ilike.%${term}%,email.ilike.%${term}%`)
          .not('email', 'is', null)
          .limit(10)
      ]);

      const contacts: Recipient[] = (contactsResult.data || []).map(contact => ({
        id: `contact_${contact.id}`,
        name: contact.name,
        email: contact.email,
        type: 'contact' as const,
        company: contact.company || undefined,
        phone: contact.phone || undefined,
      }));

      const companies: Recipient[] = (companiesResult.data || []).map(company => ({
        id: `company_${company.id}`,
        name: company.fantasy_name || company.company_name || 'Empresa sem nome',
        email: company.email,
        type: 'company' as const,
        phone: company.phone || undefined,
      }));

      // Combinar e filtrar resultados já selecionados
      const allResults = [...contacts, ...companies];
      const filteredResults = allResults.filter(
        recipient => !selectedRecipients.some(selected => selected.id === recipient.id)
      );

      setSearchResults(filteredResults);
    } catch (error) {
      console.error('Erro ao buscar destinatários:', error);
      toast.error('Erro ao buscar destinatários');
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchRecipients(searchTerm);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, selectedRecipients]);

  // Fechar resultados ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        resultsRef.current &&
        !resultsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Adicionar destinatário
  const addRecipient = (recipient: Recipient) => {
    if (selectedRecipients.length >= maxRecipients) {
      toast.error(`Máximo de ${maxRecipients} destinatários permitido`);
      return;
    }

    if (!selectedRecipients.some(r => r.id === recipient.id)) {
      onRecipientsChange([...selectedRecipients, recipient]);
      setSearchTerm('');
      setShowResults(false);
      toast.success(`${recipient.name} adicionado aos destinatários`);
    }
  };

  // Remover destinatário
  const removeRecipient = (recipientId: string) => {
    onRecipientsChange(selectedRecipients.filter(r => r.id !== recipientId));
  };

  // Adicionar email manualmente
  const addManualEmail = () => {
    const email = searchTerm.trim();
    
    if (!email.includes('@')) {
      toast.error('Digite um email válido');
      return;
    }

    if (selectedRecipients.length >= maxRecipients) {
      toast.error(`Máximo de ${maxRecipients} destinatários permitido`);
      return;
    }

    const manualRecipient: Recipient = {
      id: `manual_${Date.now()}`,
      name: email.split('@')[0],
      email: email,
      type: 'contact',
    };

    onRecipientsChange([...selectedRecipients, manualRecipient]);
    setSearchTerm('');
    setShowResults(false);
    toast.success('Email adicionado manualmente');
  };

  // Validar email
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  return (
    <div className="space-y-3">
      <Label htmlFor="recipient-search">Destinatários</Label>
      
      {/* Campo de busca */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            ref={inputRef}
            id="recipient-search"
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowResults(true);
            }}
            onFocus={() => setShowResults(true)}
            placeholder={placeholder}
            className="pl-10 pr-20"
          />
          {searchTerm && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setShowResults(false);
              }}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Botão para adicionar email manualmente */}
        {searchTerm && isValidEmail(searchTerm) && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addManualEmail}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 px-2 text-xs"
          >
            <Plus className="h-3 w-3 mr-1" />
            Adicionar
          </Button>
        )}

        {/* Resultados da busca */}
        {showResults && (searchResults.length > 0 || isSearching) && (
          <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto">
            <CardContent className="p-2">
              {isSearching ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-sm text-gray-600">Buscando...</span>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-1">
                  {searchResults.map((recipient) => (
                    <div
                      key={recipient.id}
                      onClick={() => addRecipient(recipient)}
                      className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer transition-colors"
                    >
                      <div className="flex items-center space-x-3">
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
                      </div>
                      <Plus className="h-4 w-4 text-gray-400" />
                    </div>
                  ))}
                </div>
              ) : searchTerm.length >= 2 ? (
                <div className="text-center py-4 text-sm text-gray-500">
                  Nenhum destinatário encontrado
                </div>
              ) : null}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Lista de destinatários selecionados */}
      {selectedRecipients.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              Destinatários selecionados ({selectedRecipients.length})
            </span>
            {selectedRecipients.length > 3 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  // Implementar toggle para mostrar/ocultar lista completa
                }}
                className="h-6 px-2 text-xs"
              >
                <ChevronDown className="h-3 w-3" />
              </Button>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2">
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
                  onClick={() => removeRecipient(recipient.id)}
                  className="h-4 w-4 p-0 hover:bg-gray-300"
                >
                  <X className="h-2 w-2" />
                </Button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Limite de destinatários */}
      <div className="text-xs text-gray-500">
        {selectedRecipients.length} de {maxRecipients} destinatários
      </div>
    </div>
  );
}


