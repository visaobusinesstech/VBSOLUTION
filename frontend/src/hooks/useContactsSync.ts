import { useEffect } from 'react';
import { useSocket } from './useSocket';

interface Contact {
  id: string;
  name: string;
  phone: string;
  whatsapp_opted: boolean;
  ai_enabled: boolean;
  owner_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  last_contact_at: string;
}

interface ContactEvent {
  contact: Contact;
  message: string;
  owner_id?: string;
}

export function useContactsSync() {
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    // Escutar criação de contatos
    const handleContactCreated = (data: ContactEvent) => {
      console.log('📞 Novo contato criado:', data);
      
      // Aqui você pode adicionar o contato à lista local
      // ou recarregar a lista de contatos
      if (data.contact) {
        // Emitir evento customizado para atualizar a UI
        window.dispatchEvent(new CustomEvent('contactCreated', { 
          detail: data.contact 
        }));
      }
    };

    // Escutar atualização de contatos
    const handleContactUpdated = (data: { phone: string; owner_id: string; message: string }) => {
      console.log('📞 Contato atualizado:', data);
      
      // Emitir evento customizado para atualizar a UI
      window.dispatchEvent(new CustomEvent('contactUpdated', { 
        detail: data 
      }));
    };

    // TODO: Migrar para Supabase Realtime
    // Registrar listeners
    // socket.on('contact:created', handleContactCreated);
    // socket.on('contact:updated', handleContactUpdated);

    // Cleanup
    return () => {
      // TODO: Implementar cleanup com Supabase Realtime
      // socket.off('contact:created', handleContactCreated);
      // socket.off('contact:updated', handleContactUpdated);
    };
  }, [socket]);

  return {
    // Função para forçar sincronização
    syncContacts: () => {
      if (socket) {
        socket.emit('sync:contacts');
      }
    }
  };
}

