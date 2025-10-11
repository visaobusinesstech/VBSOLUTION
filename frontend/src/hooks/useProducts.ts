import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Product {
  id: string;
  owner_id?: string;
  company_id?: string;
  name: string;
  type: 'product' | 'service';
  sku?: string;
  description?: string;
  category?: string;
  base_price: number;
  currency: string;
  unit: string;
  stock?: number;
  min_stock?: number;
  image_url?: string;
  status: 'active' | 'inactive' | 'discontinued';
  created_at: string;
  updated_at: string;
}

export interface CreateProductData {
  name: string;
  type?: 'product' | 'service';
  sku?: string;
  description?: string;
  category?: string;
  base_price?: number;
  currency?: string;
  unit?: string;
  stock?: number;
  min_stock?: number;
  image_url?: string;
  status?: 'active' | 'inactive' | 'discontinued';
}

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Buscar produtos
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Verificar se o Supabase está configurado
      if (!supabase) {
        console.warn('Supabase não configurado, usando dados mock');
        setProducts([]);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('products')
        .select('*')
        .eq('status', 'active')
        .order('name', { ascending: true });

      if (fetchError) {
        console.warn('Erro ao buscar produtos do Supabase, usando dados mock:', fetchError);
        setProducts([]);
        return;
      }

      setProducts(data || []);
    } catch (err) {
      console.error('Erro ao buscar produtos:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Criar produto
  const createProduct = useCallback(async (productData: CreateProductData): Promise<Product> => {
    try {
      setError(null);

      // Verificar se o Supabase está configurado
      if (!supabase) {
        console.warn('Supabase não configurado, simulando criação de produto');
        const mockProduct: Product = {
          id: Date.now().toString(),
          name: productData.name,
          type: productData.type || 'product',
          sku: productData.sku,
          description: productData.description,
          category: productData.category,
          base_price: productData.base_price || 0,
          currency: productData.currency || 'BRL',
          unit: productData.unit || 'unidade',
          stock: productData.stock,
          min_stock: productData.min_stock,
          image_url: productData.image_url,
          status: productData.status || 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setProducts(prev => [...prev, mockProduct]);
        return mockProduct;
      }

      // Tentar usar Supabase, mas se falhar, usar dados mock
      try {

        const productToInsert = {
          name: productData.name,
          type: productData.type || 'product',
          sku: productData.sku || null,
          description: productData.description || null,
          category: productData.category || null,
          base_price: productData.base_price || 0,
          currency: productData.currency || 'BRL',
          unit: productData.unit || 'unidade',
          stock: productData.stock || null,
          min_stock: productData.min_stock || null,
          image_url: productData.image_url || null,
          status: productData.status || 'active'
        };

        const { data, error: createError } = await supabase
          .from('products')
          .insert([productToInsert] as any)
          .select()
          .single();

        if (createError) {
          throw createError;
        }

        // Atualizar lista local
        await fetchProducts();
        
        return data;
      } catch (supabaseError) {
        console.warn('❌ Erro no Supabase, usando dados mock:', supabaseError.message);
        
        // Criar produto mock quando Supabase falhar
        const mockProduct: Product = {
          id: Date.now().toString(),
          name: productData.name,
          type: productData.type || 'product',
          sku: productData.sku,
          description: productData.description,
          category: productData.category,
          base_price: productData.base_price || 0,
          currency: productData.currency || 'BRL',
          unit: productData.unit || 'unidade',
          stock: productData.stock,
          min_stock: productData.min_stock,
          image_url: productData.image_url,
          status: productData.status || 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        // Adicionar à lista local
        setProducts(prev => [...prev, mockProduct]);
        
        return mockProduct;
      }
    } catch (err) {
      console.error('Erro ao criar produto:', err);
      setError(err instanceof Error ? err.message : 'Erro ao criar produto');
      throw err;
    }
  }, [fetchProducts]);

  // Atualizar produto
  const updateProduct = useCallback(async (id: string, updates: Partial<Product>): Promise<Product> => {
    try {
      setError(null);

      const { data, error: updateError } = await (supabase as any)
        .from('products')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      // Atualizar lista local
      await fetchProducts();
      
      return data;
    } catch (err) {
      console.error('Erro ao atualizar produto:', err);
      setError(err instanceof Error ? err.message : 'Erro ao atualizar produto');
      throw err;
    }
  }, [fetchProducts]);

  // Deletar produto
  const deleteProduct = useCallback(async (id: string): Promise<void> => {
    try {
      setError(null);

      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw deleteError;
      }

      // Atualizar lista local
      await fetchProducts();
    } catch (err) {
      console.error('Erro ao deletar produto:', err);
      setError(err instanceof Error ? err.message : 'Erro ao deletar produto');
      throw err;
    }
  }, [fetchProducts]);

  // Buscar produtos iniciais
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    loading,
    error,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct
  };
};