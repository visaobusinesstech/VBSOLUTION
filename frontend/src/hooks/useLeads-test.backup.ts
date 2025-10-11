// Arquivo de teste para verificar se useLeads está funcionando
import { useState, useEffect } from 'react';

export interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  stage_id: string;
  created_at: string;
  updated_at: string;
}

export const useLeads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLeads = async () => {
    console.log('🔍 useLeads-test: fetchLeads chamado');
    setLoading(true);
    setError(null);
    
    // Simular dados mock
    const mockLeads: Lead[] = [
      {
        id: '1',
        name: 'Lead Teste 1',
        email: 'teste1@email.com',
        phone: '11999999999',
        company: 'Empresa Teste 1',
        stage_id: '550e8400-e29b-41d4-a716-446655440001',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '2',
        name: 'Lead Teste 2',
        email: 'teste2@email.com',
        phone: '11888888888',
        company: 'Empresa Teste 2',
        stage_id: '550e8400-e29b-41d4-a716-446655440001',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    
    setTimeout(() => {
      setLeads(mockLeads);
      setLoading(false);
      console.log('🔍 useLeads-test: leads definidos:', mockLeads.length);
    }, 1000);
  };

  const createLead = async (leadData: any) => {
    console.log('🔍 useLeads-test: createLead chamado');
    return null;
  };

  const moveLeadToStage = async (leadId: string, stageId: string) => {
    console.log('🔍 useLeads-test: moveLeadToStage chamado');
    return true;
  };

  useEffect(() => {
    console.log('🔍 useLeads-test: useEffect executado');
    fetchLeads();
  }, []);

  return {
    leads,
    loading,
    error,
    fetchLeads,
    createLead,
    moveLeadToStage
  };
};

