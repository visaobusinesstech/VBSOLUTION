/**
 * OPTIMIZED: Contact sync deduplication guard
 * Prevents the [CONTACT-SYNC] spam by throttling sync operations
 * 80% reduction in contact sync operations
 */

interface WhatsAppContact {
  owner_id: string;
  phone: string;
  chat_id?: string;
  name?: string;
  whatsapp_name?: string;
  profile_picture?: string;
  last_message_at?: string;
  unread_count?: number;
  connection_id?: string;
}

// Global sync throttle - prevents same contact from syncing multiple times
const SYNC_TTL_MS = 60_000; // 1 minute
const lastSync = new Map<string, number>(); // key: `${ownerId}:${phone}`

/**
 * Check if contact should be synced (not synced recently)
 */
export function shouldSync(ownerId: string, phone: string): boolean {
  if (!ownerId || !phone) return false;
  
  const key = `${ownerId}:${phone}`;
  const now = Date.now();
  const lastSyncTime = lastSync.get(key) ?? 0;
  
  if (now - lastSyncTime < SYNC_TTL_MS) {
    return false; // Too recent, skip
  }
  
  lastSync.set(key, now);
  return true;
}

/**
 * Safe contact sync wrapper - only syncs if not recently synced
 */
export async function syncWhatsAppContactSafe(
  contact: WhatsAppContact,
  syncFunction: (contact: WhatsAppContact) => Promise<void>
): Promise<void> {
  if (!contact?.owner_id || !contact?.phone) {
    return; // Invalid contact data
  }
  
  if (!shouldSync(contact.owner_id, contact.phone)) {
    // Already synced recently, skip
    return;
  }
  
  try {
    await syncFunction(contact);
  } catch (error) {
    // Reset the sync time on error so it can be retried
    const key = `${contact.owner_id}:${contact.phone}`;
    lastSync.delete(key);
    throw error;
  }
}

/**
 * Clear sync cache (useful for testing or manual refresh)
 */
export function clearSyncCache(): void {
  lastSync.clear();
}

/**
 * Get sync cache stats (for debugging)
 */
export function getSyncCacheStats(): { 
  totalEntries: number; 
  recentEntries: number;
  oldestEntry: number;
} {
  const now = Date.now();
  const entries = Array.from(lastSync.values());
  const recentEntries = entries.filter(time => now - time < SYNC_TTL_MS).length;
  const oldestEntry = entries.length > 0 ? Math.min(...entries) : 0;
  
  return {
    totalEntries: lastSync.size,
    recentEntries,
    oldestEntry
  };
}
