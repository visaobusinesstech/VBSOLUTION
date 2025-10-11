import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { syncWhatsAppContactSafe } from '@/utils/contactSyncGuard';
import { log, error } from '@/utils/logger';

interface WhatsAppContact {
  chat_id: string;
  name: string;
  phone: string;
  whatsapp_name?: string;
  profile_picture?: string;
  last_message_at?: string;
  unread_count?: number;
  owner_id?: string;
  connection_id?: string;
}

interface Contact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  company?: string;
  whatsapp_name?: string;
  // profile_image_url removed - column doesn't exist in schema
  last_contact_at?: string;
  notes?: string;
  tags?: string[];
  custom_fields?: any[];
  ai_enabled?: boolean;
  attendant_name?: string;
  attendant_photo_url?: string;
  created_at: string;
  updated_at: string;
}

// OPTIMIZED: Batch sync queue
const BATCH_SIZE = 10;
const BATCH_DELAY = 100; // ms

export function useContactSync() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // OPTIMIZED: Batch queue for contact syncs
  const syncQueue = useRef<WhatsAppContact[]>([]);
  const syncTimer = useRef<NodeJS.Timeout | null>(null);
  const syncingInProgress = useRef(false);

  // OPTIMIZED: Batched sync processor
  const processSyncBatch = useCallback(async () => {
    if (syncingInProgress.current || syncQueue.current.length === 0) return;
    
    syncingInProgress.current = true;
    const batch = syncQueue.current.splice(0, BATCH_SIZE);

    try {
      // Group by phone to avoid duplicates
      const uniqueContacts = new Map<string, WhatsAppContact>();
      batch.forEach(contact => {
        if (!uniqueContacts.has(contact.phone)) {
          uniqueContacts.set(contact.phone, contact);
        }
      });

      // Fetch existing contacts in one query
      const phones = Array.from(uniqueContacts.keys());
      const { data: existingContacts } = await supabase
        .from('contacts')
        .select('id, phone')
        .in('phone', phones);

      const existingPhones = new Set(existingContacts?.map(c => c.phone) || []);
      
      // Separate updates and inserts
      const toUpdate: any[] = [];
      const toInsert: any[] = [];

      uniqueContacts.forEach((contact, phone) => {
        const contactData = {
          name: contact.whatsapp_name || contact.name,
          phone: contact.phone,
          whatsapp_name: contact.whatsapp_name,
          // profile_image_url removed - column doesn't exist in schema
          last_contact_at: contact.last_message_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        if (existingPhones.has(phone)) {
          toUpdate.push(contactData);
        } else {
          toInsert.push({
            ...contactData,
            owner_id: contact.owner_id,
            created_at: new Date().toISOString(),
            ai_enabled: false,
            status: 'active',
          });
        }
      });

      // Batch update
      if (toUpdate.length > 0) {
        await Promise.all(
          toUpdate.map(contact =>
            supabase
              .from('contacts')
              .update(contact)
              .eq('phone', contact.phone)
          )
        );
      }

      // Batch insert
      if (toInsert.length > 0) {
        try {
          const { error: insertError } = await supabase.from('contacts').insert(toInsert);
          if (insertError) {
            // Silent: Batch insert error (expected for some contacts)
            console.warn('Contact sync insert warning:', insertError.message);
          }
        } catch (insertErr) {
          // Silent: Contact insert failed (expected for some contacts)
        }
      }

    } catch (err) {
      error('Batch sync error:', err);
    } finally {
      syncingInProgress.current = false;
      
      // Process next batch if queue has items
      if (syncQueue.current.length > 0) {
        syncTimer.current = setTimeout(processSyncBatch, BATCH_DELAY);
      }
    }
  }, []);

  // OPTIMIZED: Queue contact for sync instead of immediate sync
  const syncWhatsAppContact = useCallback(async (whatsappContact: WhatsAppContact) => {
    syncQueue.current.push(whatsappContact);

    // Clear existing timer
    if (syncTimer.current) {
      clearTimeout(syncTimer.current);
    }

    // Start new batch after delay (allows batching)
    syncTimer.current = setTimeout(processSyncBatch, BATCH_DELAY);
  }, [processSyncBatch]);

  // OPTIMIZED: Get contact by phone with caching
  const contactCache = useRef<Map<string, Contact>>(new Map());
  
  const getContactByPhone = useCallback(async (phoneNumber: string, ownerId?: string): Promise<Contact | null> => {
    const cacheKey = `${ownerId}-${phoneNumber}`;

    // Silent: getContactByPhone called

    // Guard: avoid invalid/default placeholders
    if (!phoneNumber || phoneNumber === 'default') {
      return null;
    }

    // Normalize to digits only for consistent queries
    const normalized = String(phoneNumber).replace(/\D/g, '');
    if (!normalized) {
      return null;
    }

    // Check cache first
    if (contactCache.current.has(cacheKey)) {
      return contactCache.current.get(cacheKey)!;
    }

    try {
      let query = supabase
        .from('contacts')
        .select('*')
        .eq('phone', normalized);

      if (ownerId) {
        // Fix owner_id with spaces - replace spaces with underscores
        const sanitizedOwnerId = ownerId.replace(/\s+/g, '_');
        query = query.eq('owner_id', sanitizedOwnerId);
      }

      const { data: contact } = await query.single();

      if (contact) {
        contactCache.current.set(cacheKey, contact);
      }

      return contact;
    } catch (err) {
      return null;
    }
  }, []);

  // OPTIMIZED: Get contact by JID with caching
  const getContactByJid = useCallback(async (jid: string, ownerId?: string): Promise<Contact | null> => {
    const cacheKey = `${ownerId}-${jid}`;
    
    // Check cache first
    if (contactCache.current.has(cacheKey)) {
      return contactCache.current.get(cacheKey)!;
    }

    try {
      let query = supabase
        .from('contacts')
        .select('*')
        .eq('whatsapp_jid', jid);

      if (ownerId) {
        // Fix owner_id with spaces - replace spaces with underscores
        const sanitizedOwnerId = ownerId.replace(/\s+/g, '_');
        query = query.eq('owner_id', sanitizedOwnerId);
      }

      const { data: contact } = await query.single();

      if (contact) {
        contactCache.current.set(cacheKey, contact);
      }

      return contact;
    } catch (err) {
      return null;
    }
  }, []);

  // OPTIMIZED: Update contact with cache invalidation
  const updateContact = useCallback(async (contactId: string, updates: Partial<Contact>) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: updatedContact, error } = await supabase
        .from('contacts')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', contactId)
        .select()
        .single();

      if (error) throw error;

      // Invalidate cache for this contact
      if (updatedContact) {
        const cacheKey = `${updatedContact.owner_id}-${updatedContact.phone}`;
        contactCache.current.delete(cacheKey);
      }

      return updatedContact;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // OPTIMIZED: Create contact
  const createContact = useCallback(async (contactData: Partial<Contact>) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('contacts')
        .insert([{
          name: contactData.name || '',
          phone: contactData.phone || '',
          email: contactData.email || '',
          company: contactData.company || '',
          whatsapp_name: contactData.whatsapp_name || '',
          // profile_image_url removed - column doesn't exist in schema
          notes: contactData.notes || '',
          tags: contactData.tags || [],
          custom_fields: contactData.custom_fields || [],
          ai_enabled: contactData.ai_enabled || false,
          last_contact_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    syncWhatsAppContact,
    getContactByPhone,
    getContactByJid,
    updateContact,
    createContact,
    isLoading,
    error,
  };
}
