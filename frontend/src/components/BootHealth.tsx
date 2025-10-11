import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export default function BootHealth() {
  // Componente desabilitado - não renderiza nada na tela
  // Mantém a lógica de teste para debug no console se necessário
  const [msg, setMsg] = useState('checking...');
  const [details, setDetails] = useState<string>('');
  
  // DEBUG flag - set to false for production
  const DEBUG = false;
  
  useEffect(() => {
    const testSupabase = async () => {
      const url = import.meta.env.VITE_SUPABASE_URL;
      const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!url || !anon) {
        if (DEBUG) console.log(`❌ Missing envs: ${!url ? 'VITE_SUPABASE_URL ' : ''}${!anon ? 'VITE_SUPABASE_ANON_KEY' : ''}`);
        return;
      }
      
      if (DEBUG) console.log('🔄 Testing Supabase...');
      
      try {
        // Use the centralized supabase client
        
        // Test 1: Basic connectivity with a simple table
        if (DEBUG) console.log('🔄 Testing basic connection...');
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id')
          .limit(1);
        
        if (profilesError) {
          console.error('❌ Profiles error:', profilesError);
          return;
        }
        
        if (DEBUG) console.log('✅ Basic connection OK');
        
        // Test 2: WhatsApp tables
        if (DEBUG) console.log('🔄 Testing WhatsApp tables...');
        const { data: conversations, error: convError } = await supabase
          .from('whatsapp_atendimentos')
          .select('id', { head: true, count: 'exact' })
          .limit(1);
        
        if (convError) {
          console.error('❌ WhatsApp error:', convError);
          return;
        }
        
        if (DEBUG) console.log(`✅ Supabase OK (${conversations?.length || 0} conversations) - WhatsApp tables accessible`);
        
      } catch (e) {
        console.error('Supabase connection error:', e);
      }
    };
    
    testSupabase();
  }, []);
  
  // Não renderiza nada na tela - apenas executa testes em background
  return null;
}
