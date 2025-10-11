import { useState, useEffect, useCallback } from 'react';
import { useConnections } from '@/contexts/ConnectionsContext';

interface GroupParticipant {
  id: string;
  name?: string;
  admin?: 'admin' | 'superadmin' | null;
  phoneNumber?: string;
  lid?: string;
}

interface GroupInfo {
  subject: string;
  description?: string;
  owner?: string;
  admins?: GroupParticipant[];
  participants?: GroupParticipant[];
  created?: string;
  settings?: any;
}

interface WhatsAppGroup {
  id: string;
  subject: string;
  description?: string;
  owner?: string;
  participants: GroupParticipant[];
  admins: GroupParticipant[];
  created?: string;
  isCommunity?: boolean;
  isCommunityAnnounce?: boolean;
  restrict?: boolean;
  announce?: boolean;
  memberAddMode?: boolean;
  joinApprovalMode?: boolean;
  ephemeralDuration?: number;
  inviteCode?: string;
  author?: string;
  authorPn?: string;
  size?: number;
  addressingMode?: 'lid' | 'pn';
  subjectOwner?: string;
  subjectOwnerPn?: string;
  subjectTime?: number;
  descId?: string;
  descOwner?: string;
  descOwnerPn?: string;
  descTime?: number;
  linkedParent?: string;
  imgUrl?: string;
  notify?: string;
}

const API_URL = (import.meta as any).env?.VITE_API_URL || '';

export function useWhatsAppGroups() {
  const { activeConnection } = useConnections();
  const [groups, setGroups] = useState<WhatsAppGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load groups from backend
  const loadGroups = useCallback(async () => {
    if (!activeConnection?.id || !activeConnection?.owner_id) {
      console.log('⏳ No active connection for loading groups');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/baileys-simple/connections/${activeConnection.id}/groups`, {
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': activeConnection.owner_id,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to load groups: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setGroups(data.data || []);
        console.log(`✅ Loaded ${data.data?.length || 0} groups`);
      } else {
        throw new Error(data.error || 'Failed to load groups');
      }
    } catch (err: any) {
      console.error('❌ Error loading groups:', err);
      setError(err.message || 'Erro ao carregar grupos');
    } finally {
      setLoading(false);
    }
  }, [activeConnection?.id, activeConnection?.owner_id]);

  // Load groups when activeConnection changes
  useEffect(() => {
    if (activeConnection?.id && activeConnection?.owner_id) {
      loadGroups();
    }
  }, [activeConnection?.id, activeConnection?.owner_id, loadGroups]);

  // Create a new group
  const createGroup = useCallback(async (subject: string, participants: string[]) => {
    if (!activeConnection?.id || !activeConnection?.owner_id) {
      throw new Error('No active connection');
    }

    try {
      const response = await fetch(`${API_URL}/api/baileys-simple/connections/${activeConnection.id}/groups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': activeConnection.owner_id,
        },
        body: JSON.stringify({
          subject,
          participants
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create group: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Reload groups after creation
        await loadGroups();
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to create group');
      }
    } catch (err: any) {
      console.error('❌ Error creating group:', err);
      throw err;
    }
  }, [activeConnection?.id, activeConnection?.owner_id, loadGroups]);

  // Update group subject
  const updateGroupSubject = useCallback(async (groupId: string, subject: string) => {
    if (!activeConnection?.id || !activeConnection?.owner_id) {
      throw new Error('No active connection');
    }

    try {
      const response = await fetch(`${API_URL}/api/baileys-simple/connections/${activeConnection.id}/groups/${groupId}/subject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': activeConnection.owner_id,
        },
        body: JSON.stringify({ subject }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update group subject: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Reload groups after update
        await loadGroups();
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to update group subject');
      }
    } catch (err: any) {
      console.error('❌ Error updating group subject:', err);
      throw err;
    }
  }, [activeConnection?.id, activeConnection?.owner_id, loadGroups]);

  // Update group description
  const updateGroupDescription = useCallback(async (groupId: string, description?: string) => {
    if (!activeConnection?.id || !activeConnection?.owner_id) {
      throw new Error('No active connection');
    }

    try {
      const response = await fetch(`${API_URL}/api/baileys-simple/connections/${activeConnection.id}/groups/${groupId}/description`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': activeConnection.owner_id,
        },
        body: JSON.stringify({ description }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update group description: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Reload groups after update
        await loadGroups();
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to update group description');
      }
    } catch (err: any) {
      console.error('❌ Error updating group description:', err);
      throw err;
    }
  }, [activeConnection?.id, activeConnection?.owner_id, loadGroups]);

  // Add participants to group
  const addParticipants = useCallback(async (groupId: string, participants: string[]) => {
    if (!activeConnection?.id || !activeConnection?.owner_id) {
      throw new Error('No active connection');
    }

    try {
      const response = await fetch(`${API_URL}/api/baileys-simple/connections/${activeConnection.id}/groups/${groupId}/participants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': activeConnection.owner_id,
        },
        body: JSON.stringify({ participants, action: 'add' }),
      });

      if (!response.ok) {
        throw new Error(`Failed to add participants: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Reload groups after update
        await loadGroups();
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to add participants');
      }
    } catch (err: any) {
      console.error('❌ Error adding participants:', err);
      throw err;
    }
  }, [activeConnection?.id, activeConnection?.owner_id, loadGroups]);

  // Remove participants from group
  const removeParticipants = useCallback(async (groupId: string, participants: string[]) => {
    if (!activeConnection?.id || !activeConnection?.owner_id) {
      throw new Error('No active connection');
    }

    try {
      const response = await fetch(`${API_URL}/api/baileys-simple/connections/${activeConnection.id}/groups/${groupId}/participants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': activeConnection.owner_id,
        },
        body: JSON.stringify({ participants, action: 'remove' }),
      });

      if (!response.ok) {
        throw new Error(`Failed to remove participants: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Reload groups after update
        await loadGroups();
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to remove participants');
      }
    } catch (err: any) {
      console.error('❌ Error removing participants:', err);
      throw err;
    }
  }, [activeConnection?.id, activeConnection?.owner_id, loadGroups]);

  // Promote participants to admin
  const promoteParticipants = useCallback(async (groupId: string, participants: string[]) => {
    if (!activeConnection?.id || !activeConnection?.owner_id) {
      throw new Error('No active connection');
    }

    try {
      const response = await fetch(`${API_URL}/api/baileys-simple/connections/${activeConnection.id}/groups/${groupId}/participants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': activeConnection.owner_id,
        },
        body: JSON.stringify({ participants, action: 'promote' }),
      });

      if (!response.ok) {
        throw new Error(`Failed to promote participants: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Reload groups after update
        await loadGroups();
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to promote participants');
      }
    } catch (err: any) {
      console.error('❌ Error promoting participants:', err);
      throw err;
    }
  }, [activeConnection?.id, activeConnection?.owner_id, loadGroups]);

  // Demote participants from admin
  const demoteParticipants = useCallback(async (groupId: string, participants: string[]) => {
    if (!activeConnection?.id || !activeConnection?.owner_id) {
      throw new Error('No active connection');
    }

    try {
      const response = await fetch(`${API_URL}/api/baileys-simple/connections/${activeConnection.id}/groups/${groupId}/participants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': activeConnection.owner_id,
        },
        body: JSON.stringify({ participants, action: 'demote' }),
      });

      if (!response.ok) {
        throw new Error(`Failed to demote participants: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Reload groups after update
        await loadGroups();
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to demote participants');
      }
    } catch (err: any) {
      console.error('❌ Error demoting participants:', err);
      throw err;
    }
  }, [activeConnection?.id, activeConnection?.owner_id, loadGroups]);

  // Leave group
  const leaveGroup = useCallback(async (groupId: string) => {
    if (!activeConnection?.id || !activeConnection?.owner_id) {
      throw new Error('No active connection');
    }

    try {
      const response = await fetch(`${API_URL}/api/baileys-simple/connections/${activeConnection.id}/groups/${groupId}/leave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': activeConnection.owner_id,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to leave group: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Reload groups after leaving
        await loadGroups();
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to leave group');
      }
    } catch (err: any) {
      console.error('❌ Error leaving group:', err);
      throw err;
    }
  }, [activeConnection?.id, activeConnection?.owner_id, loadGroups]);

  // Get group invite code
  const getGroupInviteCode = useCallback(async (groupId: string) => {
    if (!activeConnection?.id || !activeConnection?.owner_id) {
      throw new Error('No active connection');
    }

    try {
      const response = await fetch(`${API_URL}/api/baileys-simple/connections/${activeConnection.id}/groups/${groupId}/invite`, {
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': activeConnection.owner_id,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get invite code: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to get invite code');
      }
    } catch (err: any) {
      console.error('❌ Error getting invite code:', err);
      throw err;
    }
  }, [activeConnection?.id, activeConnection?.owner_id]);

  // Revoke group invite code
  const revokeGroupInviteCode = useCallback(async (groupId: string) => {
    if (!activeConnection?.id || !activeConnection?.owner_id) {
      throw new Error('No active connection');
    }

    try {
      const response = await fetch(`${API_URL}/api/baileys-simple/connections/${activeConnection.id}/groups/${groupId}/invite`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': activeConnection.owner_id,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to revoke invite code: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to revoke invite code');
      }
    } catch (err: any) {
      console.error('❌ Error revoking invite code:', err);
      throw err;
    }
  }, [activeConnection?.id, activeConnection?.owner_id]);

  return {
    groups,
    loading,
    error,
    loadGroups,
    createGroup,
    updateGroupSubject,
    updateGroupDescription,
    addParticipants,
    removeParticipants,
    promoteParticipants,
    demoteParticipants,
    leaveGroup,
    getGroupInviteCode,
    revokeGroupInviteCode,
  };
}
