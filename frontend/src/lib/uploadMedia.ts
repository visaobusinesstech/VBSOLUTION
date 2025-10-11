import { supabase } from '@/integrations/supabase/client';
import { ulid } from 'ulid';

export async function uploadToWaBucket(params: {
  connectionId: string;
  chatId: string;
  file: File;
}) {
  const ext = params.file.name.split('.').pop() || 'bin';
  const key = `${params.connectionId}/${params.chatId}/${ulid()}.${ext}`;

  const { error } = await supabase.storage.from('wa-media').upload(key, params.file, {
    contentType: params.file.type || 'application/octet-stream',
    upsert: false,
  });
  
  if (error) throw error;

  return { mediaKey: key, mimeType: params.file.type || 'application/octet-stream' };
}

