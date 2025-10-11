import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  MessageCircle, 
  Settings, 
  Tag, 
  Plus,
  CheckCircle,
  Clock,
  Hash,
  RefreshCw,
  History,
  Pause,
  Bell
} from 'lucide-react';

interface ContactDetailsPanelProps {
  contact: {
    id: string;
    name: string;
    phoneE164: string;
    jid: string;
    customFields?: Record<string, any>;
  } | null;
  connection: {
    id: string;
    name: string;
    status: string;
  } | null;
}

const ContactDetailsPanel: React.FC<ContactDetailsPanelProps> = ({ contact, connection }) => {
  const [customFields, setCustomFields] = useState<Record<string, any>>(contact?.customFields || {});
  const [isEditing, setIsEditing] = useState(false);

  if (!contact) {
    return (
      <Card className="rounded-xl bg-white border p-4">
        <div className="text-sm text-zinc-500 text-center">
          Selecione uma conversa para ver os detalhes do contato
        </div>
      </Card>
    );
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const formatPhoneNumber = (phone: string) => {
    // Formatar número brasileiro
    if (phone.startsWith('55')) {
      const cleaned = phone.replace(/\D/g, '');
      if (cleaned.length === 13) {
        return `+${cleaned.slice(0, 2)} (${cleaned.slice(2, 4)}) ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`;
      }
    }
    return phone;
  };

  const handleCustomFieldChange = (key: string, value: string) => {
    setCustomFields(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const saveCustomFields = () => {
    // Aqui você salvaria os campos customizados
    console.log('Salvando campos customizados:', customFields);
    setIsEditing(false);
  };

  return (
    <Card className="rounded-xl bg-white border p-4 h-full overflow-y-auto">
      <div className="space-y-6">
        {/* Header do Contato */}
        <div className="text-center">
          <Avatar className="w-20 h-20 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-semibold">
              {getInitials(contact.name)}
            </span>
          </Avatar>
          <div className="text-lg font-semibold">{contact.name}</div>
          <div className="text-sm text-zinc-500">{contact.jid}</div>
        </div>

        {/* Status e Informações Básicas */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <div className="text-sm font-medium text-green-800">Inscrito</div>
              <div className="text-xs text-green-600">(Cancelar a inscrição)</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Clock className="h-5 w-5 text-gray-500" />
            <div>
              <div className="text-sm font-medium">Hora do Contato: Desconhecido</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Hash className="h-5 w-5 text-gray-500" />
            <div>
              <div className="text-sm font-medium">ID: {contact.id.split('@')[0]}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
            <RefreshCw className="h-5 w-5 text-green-600" />
            <div>
              <div className="text-sm font-medium text-green-800">Optou pelo WhatsApp</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
            <MessageCircle className="h-5 w-5 text-green-600" />
            <div>
              <div className="text-sm font-medium text-green-800">
                WhatsApp: {formatPhoneNumber(contact.phoneE164)}
              </div>
            </div>
          </div>

          <Button variant="outline" size="sm" className="w-full">
            <History className="h-4 w-4 mr-2" />
            Todo Histórico De Canais
          </Button>
        </div>

        {/* Automações */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Automações
            </h4>
          </div>
          <Button variant="outline" size="sm" className="w-full">
            <Pause className="h-4 w-4 mr-2" />
            Suspender
          </Button>
        </div>

        {/* Tags do Contato */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Tags do contato
            </h4>
          </div>
          <Button variant="outline" size="sm" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            + Adicionar Tag
          </Button>
        </div>

        {/* Sequências */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Inscrito nas Sequências
            </h4>
          </div>
          <Button variant="outline" size="sm" className="w-full">
            Assinar
          </Button>
        </div>

        {/* Preferências */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Optou por aderir</h4>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            Mensagem Privada
          </Badge>
        </div>

        {/* Campos do Sistema */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold">Campos do Sistema</h4>
          <div className="space-y-2">
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Primeiro Nome</label>
              <Input 
                value={contact.name.split(' ')[0]} 
                readOnly 
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Sobrenome</label>
              <Input 
                value={contact.name.split(' ').slice(1).join(' ')} 
                readOnly 
                className="text-sm"
              />
            </div>
          </div>
        </div>

        {/* Campos Personalizados */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">Campos Personalizados</h4>
            <Button 
              variant="link" 
              size="sm" 
              className="text-xs p-0 h-auto"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? 'Salvar' : 'Editar'}
            </Button>
          </div>
          
          {isEditing ? (
            <div className="space-y-2">
              <div>
                <label className="text-xs text-zinc-500 block mb-1">GPT_THREAD</label>
                <Input 
                  value={customFields.GPT_THREAD || ''}
                  onChange={(e) => handleCustomFieldChange('GPT_THREAD', e.target.value)}
                  className="text-sm"
                  placeholder="thread_..."
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500 block mb-1">QUIPPSORT_ENTRADA</label>
                <Input 
                  value={customFields.QUIPPSORT_ENTRADA || ''}
                  onChange={(e) => handleCustomFieldChange('QUIPPSORT_ENTRADA', e.target.value)}
                  className="text-sm"
                  placeholder="Valor de entrada..."
                />
              </div>
              <Button 
                onClick={saveCustomFields}
                size="sm" 
                className="w-full"
              >
                Salvar Alterações
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <div>
                <label className="text-xs text-zinc-500 block mb-1">GPT_THREAD</label>
                <div className="text-sm p-2 bg-gray-50 rounded border">
                  {customFields.GPT_THREAD || 'thread_FrJkCutclxvhZdsXDyuGOHdz'}
                </div>
              </div>
              <div>
                <label className="text-xs text-zinc-500 block mb-1">QUIPPSORT_ENTRADA</label>
                <div className="text-sm p-2 bg-gray-50 rounded border">
                  {customFields.QUIPPSORT_ENTRADA || 'Não definido'}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default ContactDetailsPanel;
