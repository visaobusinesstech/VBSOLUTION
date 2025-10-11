
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Deal {
  id: string;
  company_id: string;
  product_id?: string;
  stage_id: string;
  responsible_id?: string;
  title: string;
  value: number;
  probability: number;
  expected_close_date?: string;
  notes?: string;
  status: 'active' | 'won' | 'lost';
  created_at: string;
  updated_at: string;
}

export interface DealWithDetails extends Deal {
  company?: {
    fantasy_name: string;
    email?: string;
    phone?: string;
  };
  product?: {
    name: string;
    base_price: number;
  };
  stage?: {
    name: string;
    color: string;
  };
}

export const useDeals = () => {
  const [deals, setDeals] = useState<DealWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDeals = async () => {
    try {
      setLoading(true);
      
      // Use raw SQL query to avoid TypeScript type issues
      const { data, error } = await supabase.rpc('get_deals_with_details');
      
      if (error) {
        // Fallback to basic query if RPC doesn't exist
        const { data: basicData, error: basicError } = await supabase
          .from('deals' as any)
          .select('*')
          .order('created_at', { ascending: false });

        if (basicError) throw basicError;
        setDeals(basicData || []);
      } else {
        setDeals(data || []);
      }
    } catch (err) {
      console.error('Error fetching deals:', err);
      setError(err instanceof Error ? err.message : 'Error fetching deals');
    } finally {
      setLoading(false);
    }
  };

  const createDeal = async (dealData: Omit<Deal, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('deals' as any)
        .insert([dealData])
        .select()
        .single();

      if (error) throw error;
      await fetchDeals();
      return data;
    } catch (err) {
      console.error('Error creating deal:', err);
      setError(err instanceof Error ? err.message : 'Error creating deal');
      throw err;
    }
  };

  const updateDeal = async (id: string, updates: Partial<Deal>) => {
    try {
      const { data, error } = await supabase
        .from('deals' as any)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      await fetchDeals();
      return data;
    } catch (err) {
      console.error('Error updating deal:', err);
      setError(err instanceof Error ? err.message : 'Error updating deal');
      throw err;
    }
  };

  const moveDealToStage = async (dealId: string, stageId: string) => {
    return updateDeal(dealId, { stage_id: stageId });
  };

  useEffect(() => {
    fetchDeals();
  }, []);

  return {
    deals,
    loading,
    error,
    createDeal,
    updateDeal,
    moveDealToStage,
    refetch: fetchDeals
  };
};
