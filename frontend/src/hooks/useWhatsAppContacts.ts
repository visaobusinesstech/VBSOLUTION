import { useState, useEffect, useCallback } from 'react';
import { useConnections } from '@/contexts/ConnectionsContext';

interface WhatsAppContact {
  id: string;
  lid?: string;
  phoneNumber?: string;
  name?: string;
  notify?: string;
  verifiedName?: string;
  imgUrl?: string | null;
  status?: string;
  businessInfo?: {
    name?: string;
    description?: string;
    category?: string;
    email?: string;
    website?: string;
    address?: string;
    verified?: boolean;
    online?: boolean;
    status?: string;
  };
  presence?: {
    lastKnownPresence?: 'unavailable' | 'available' | 'composing' | 'recording' | 'paused';
    lastSeen?: number;
  };
  isBlocked?: boolean;
  isMuted?: boolean;
  isPinned?: boolean;
  isArchived?: boolean;
}

const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000';

export function useWhatsAppContacts() {
  const { activeConnection } = useConnections();
  const [contacts, setContacts] = useState<WhatsAppContact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load contacts from backend
  const loadContacts = useCallback(async () => {
    if (!activeConnection?.id || !activeConnection?.owner_id) {
      // Silent: No active connection for loading contacts
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Silent: Loading contacts for connection
      // Sanitize and encode connectionId to avoid spaces or invalid URL chars
      const sanitizedId = encodeURIComponent(String(activeConnection.id).trim().replace(/\s+/g, '_'));
      const url = `${API_URL}/api/baileys-simple/connections/${sanitizedId}/contacts`;
      // Silent: Request URL constructed

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': activeConnection.owner_id,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          // Silent: Contacts endpoint not found (404) - using empty contacts list
          setContacts([]);
          return;
        }
        throw new Error(`Failed to load contacts: ${response.status}`);
      }

      // Validate JSON response
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Invalid JSON response. Content-Type: ${contentType}. Body: ${text.substring(0, 120)}...`);
      }
      const data = await response.json();
      
      if (data.success) {
        setContacts(data.data || []);
        // Silent: Loaded contacts successfully
      } else {
        throw new Error(data.error || 'Failed to load contacts');
      }
    } catch (err: any) {
      // Silent: Error loading contacts (only set error state)
      setError(err.message || 'Erro ao carregar contatos');
    } finally {
      setLoading(false);
    }
  }, [activeConnection?.id, activeConnection?.owner_id]);

  // Load contacts when activeConnection changes
  useEffect(() => {
    if (activeConnection?.id && activeConnection?.owner_id) {
      loadContacts();
    }
  }, [activeConnection?.id, activeConnection?.owner_id, loadContacts]);

  // Add or update contact
  const addOrUpdateContact = useCallback(async (contact: Partial<WhatsAppContact>) => {
    if (!activeConnection?.id || !activeConnection?.owner_id) {
      throw new Error('No active connection');
    }

    try {
      const response = await fetch(`${API_URL}/api/baileys-simple/connections/${activeConnection.id}/contacts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': activeConnection.owner_id,
        },
        body: JSON.stringify(contact),
      });

      if (!response.ok) {
        throw new Error(`Failed to add/update contact: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Reload contacts after update
        await loadContacts();
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to add/update contact');
      }
    } catch (err: any) {
      // Silent: Error adding/updating contact
      throw err;
    }
  }, [activeConnection?.id, activeConnection?.owner_id, loadContacts]);

  // Remove contact
  const removeContact = useCallback(async (contactId: string) => {
    if (!activeConnection?.id || !activeConnection?.owner_id) {
      throw new Error('No active connection');
    }

    try {
      const response = await fetch(`${API_URL}/api/baileys-simple/connections/${activeConnection.id}/contacts/${contactId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': activeConnection.owner_id,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to remove contact: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Reload contacts after removal
        await loadContacts();
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to remove contact');
      }
    } catch (err: any) {
      // Silent: Error removing contact
      throw err;
    }
  }, [activeConnection?.id, activeConnection?.owner_id, loadContacts]);

  // Block contact
  const blockContact = useCallback(async (contactId: string) => {
    if (!activeConnection?.id || !activeConnection?.owner_id) {
      throw new Error('No active connection');
    }

    try {
      const response = await fetch(`${API_URL}/api/baileys-simple/connections/${activeConnection.id}/contacts/${contactId}/block`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': activeConnection.owner_id,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to block contact: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Reload contacts after blocking
        await loadContacts();
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to block contact');
      }
    } catch (err: any) {
      // Silent: Error blocking contact
      throw err;
    }
  }, [activeConnection?.id, activeConnection?.owner_id, loadContacts]);

  // Unblock contact
  const unblockContact = useCallback(async (contactId: string) => {
    if (!activeConnection?.id || !activeConnection?.owner_id) {
      throw new Error('No active connection');
    }

    try {
      const response = await fetch(`${API_URL}/api/baileys-simple/connections/${activeConnection.id}/contacts/${contactId}/unblock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': activeConnection.owner_id,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to unblock contact: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Reload contacts after unblocking
        await loadContacts();
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to unblock contact');
      }
    } catch (err: any) {
      // Silent: Error unblocking contact
      throw err;
    }
  }, [activeConnection?.id, activeConnection?.owner_id, loadContacts]);

  // Get contact profile picture
  const getContactProfilePicture = useCallback(async (contactId: string, type: 'preview' | 'image' = 'preview') => {
    if (!activeConnection?.id || !activeConnection?.owner_id) {
      throw new Error('No active connection');
    }

    try {
      const response = await fetch(`${API_URL}/api/baileys-simple/connections/${activeConnection.id}/contacts/${contactId}/profile-picture?type=${type}`, {
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': activeConnection.owner_id,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get profile picture: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to get profile picture');
      }
    } catch (err: any) {
      // Silent: Error getting profile picture
      throw err;
    }
  }, [activeConnection?.id, activeConnection?.owner_id]);

  // Get contact status
  const getContactStatus = useCallback(async (contactId: string) => {
    if (!activeConnection?.id || !activeConnection?.owner_id) {
      throw new Error('No active connection');
    }

    try {
      const response = await fetch(`${API_URL}/api/baileys-simple/connections/${activeConnection.id}/contacts/${contactId}/status`, {
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': activeConnection.owner_id,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get contact status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to get contact status');
      }
    } catch (err: any) {
      // Silent: Error getting contact status
      throw err;
    }
  }, [activeConnection?.id, activeConnection?.owner_id]);

  // Check if contact is on WhatsApp
  const checkContactOnWhatsApp = useCallback(async (phoneNumber: string) => {
    if (!activeConnection?.id || !activeConnection?.owner_id) {
      throw new Error('No active connection');
    }

    try {
      const response = await fetch(`${API_URL}/api/baileys-simple/connections/${activeConnection.id}/contacts/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': activeConnection.owner_id,
        },
        body: JSON.stringify({ phoneNumber }),
      });

      if (!response.ok) {
        throw new Error(`Failed to check contact: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to check contact');
      }
    } catch (err: any) {
      // Silent: Error checking contact
      throw err;
    }
  }, [activeConnection?.id, activeConnection?.owner_id]);

  return {
    contacts,
    loading,
    error,
    loadContacts,
    addOrUpdateContact,
    removeContact,
    blockContact,
    unblockContact,
    getContactProfilePicture,
    getContactStatus,
    checkContactOnWhatsApp,
  };
}