import { supabase, isWhatsAppV2Enabled, DEFAULT_OWNER_ID } from '../config/supabase';
import logger from '../logger';

export interface WhatsAppSessionData {
  id: string;
  owner_id: string;
  session_name: string;
  status: 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
  qr_code?: string;
  connected_at?: Date;
  disconnected_at?: Date;
  connection_id?: string;
  phone_number?: string;
  whatsapp_info?: any;
}

export class SupabaseSessionsService {
  /**
   * Upsert session data
   */
  async upsertSession(sessionData: Partial<WhatsAppSessionData>): Promise<WhatsAppSessionData | null> {
    if (!isWhatsAppV2Enabled()) {
      logger.debug('WhatsApp V2 disabled, skipping session upsert');
      return null;
    }

    try {
      const data = {
        id: sessionData.id || crypto.randomUUID(),
        owner_id: sessionData.owner_id || DEFAULT_OWNER_ID,
        session_name: sessionData.session_name || 'Default Session',
        status: sessionData.status || 'CONNECTING',
        qr_code: sessionData.qr_code || null,
        connected_at: sessionData.connected_at?.toISOString() || null,
        disconnected_at: sessionData.disconnected_at?.toISOString() || null,
        connection_id: sessionData.connection_id || null,
        phone_number: sessionData.phone_number || null,
        whatsapp_info: sessionData.whatsapp_info ? JSON.stringify(sessionData.whatsapp_info) : null,
        updated_at: new Date().toISOString()
      };

      const { data: result, error } = await supabase
        .from('whatsapp_sessions')
        .upsert(data, {
          onConflict: 'id'
        })
        .select()
        .single();

      if (error) {
        logger.error('Error upserting session:', error);
        return null;
      }

      logger.info('Session upserted successfully:', result.id);
      return result as WhatsAppSessionData;
    } catch (error) {
      logger.error('Error in upsertSession:', error);
      return null;
    }
  }

  /**
   * Update session status
   */
  async updateSessionStatus(
    sessionId: string, 
    status: WhatsAppSessionData['status'],
    additionalData?: Partial<WhatsAppSessionData>
  ): Promise<boolean> {
    if (!isWhatsAppV2Enabled()) {
      logger.debug('WhatsApp V2 disabled, skipping session status update');
      return false;
    }

    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (status === 'CONNECTED' && !additionalData?.connected_at) {
        updateData.connected_at = new Date().toISOString();
      }

      if (status === 'DISCONNECTED' && !additionalData?.disconnected_at) {
        updateData.disconnected_at = new Date().toISOString();
      }

      if (additionalData) {
        Object.assign(updateData, additionalData);
      }

      const { error } = await supabase
        .from('whatsapp_sessions')
        .update(updateData)
        .eq('id', sessionId);

      if (error) {
        logger.error('Error updating session status:', error);
        return false;
      }

      logger.info(`Session ${sessionId} status updated to ${status}`);
      return true;
    } catch (error) {
      logger.error('Error in updateSessionStatus:', error);
      return false;
    }
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<WhatsAppSessionData | null> {
    if (!isWhatsAppV2Enabled()) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('whatsapp_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) {
        logger.error('Error getting session:', error);
        return null;
      }

      return data as WhatsAppSessionData;
    } catch (error) {
      logger.error('Error in getSession:', error);
      return null;
    }
  }

  /**
   * Get all sessions for owner
   */
  async getSessionsByOwner(ownerId: string): Promise<WhatsAppSessionData[]> {
    if (!isWhatsAppV2Enabled()) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('whatsapp_sessions')
        .select('*')
        .eq('owner_id', ownerId)
        .order('updated_at', { ascending: false });

      if (error) {
        logger.error('Error getting sessions by owner:', error);
        return [];
      }

      return data as WhatsAppSessionData[];
    } catch (error) {
      logger.error('Error in getSessionsByOwner:', error);
      return [];
    }
  }

  /**
   * Delete session
   */
  async deleteSession(sessionId: string): Promise<boolean> {
    if (!isWhatsAppV2Enabled()) {
      return false;
    }

    try {
      const { error } = await supabase
        .from('whatsapp_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) {
        logger.error('Error deleting session:', error);
        return false;
      }

      logger.info(`Session ${sessionId} deleted successfully`);
      return true;
    } catch (error) {
      logger.error('Error in deleteSession:', error);
      return false;
    }
  }
}

export const supabaseSessionsService = new SupabaseSessionsService();
