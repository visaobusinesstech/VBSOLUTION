import React, { useEffect, useState } from 'react';
import { useContactsSync } from '../hooks/useContactsSync';

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

interface ContactsSyncManagerProps {
  onContactCreated?: (contact: Contact) => void;
  onContactUpdated?: (data: { phone: string; owner_id: string; message: string }) => void;
}

export function ContactsSyncManager({ 
  onContactCreated, 
  onContactUpdated 
}: ContactsSyncManagerProps) {
  const { syncContacts } = useContactsSync();
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    // Escutar eventos customizados
    const handleContactCreated = (event: CustomEvent) => {
      console.log('📞 Contato criado recebido:', event.detail);
      setLastSync(new Date());
      
      if (onContactCreated) {
        onContactCreated(event.detail);
      }
    };

    const handleContactUpdated = (event: CustomEvent) => {
      console.log('📞 Contato atualizado recebido:', event.detail);
      setLastSync(new Date());
      
      if (onContactUpdated) {
        onContactUpdated(event.detail);
      }
    };

    // Registrar listeners
    window.addEventListener('contactCreated', handleContactCreated as EventListener);
    window.addEventListener('contactUpdated', handleContactUpdated as EventListener);

    // Cleanup
    return () => {
      window.removeEventListener('contactCreated', handleContactCreated as EventListener);
      window.removeEventListener('contactUpdated', handleContactUpdated as EventListener);
    };
  }, [onContactCreated, onContactUpdated]);

  return (
    <div className="flex items-center gap-2 text-sm text-gray-500">
      {lastSync && (
        <span>
          Última sincronização: {lastSync.toLocaleTimeString()}
        </span>
      )}
      <button
        onClick={syncContacts}
        className="px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
      >
        Sincronizar
      </button>
    </div>
  );
}

