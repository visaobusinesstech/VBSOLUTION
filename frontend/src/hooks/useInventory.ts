import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface InventoryItem {
  id: string;
  owner_id: string;
  product_id: string;
  quantity: number;
  location?: string;
  last_updated: string;
  created_at: string;
  updated_at: string;
  // Campos virtuais para compatibilidade com a interface
  name?: string;
  sku?: string;
  category?: string;
  price?: number;
  min_stock?: number;
  supplier?: string;
  description?: string;
  image_url?: string;
  total_value?: number;
  status?: 'in_stock' | 'low_stock' | 'out_of_stock';
}

export const useInventory = () => {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Buscar todos os itens do inventário do usuário logado
  const fetchInventoryItems = async () => {
    console.log('🔍 fetchInventoryItems: Iniciando busca...', { user: user?.id });
    
    if (!user) {
      console.log('❌ fetchInventoryItems: Usuário não autenticado');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('inventory')
        .select(`
          *,
          products (
            id,
            name,
            sku,
            category,
            base_price,
            min_stock,
            image_url,
            description
          )
        `)
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ fetchInventoryItems: Erro na consulta:', error);
        throw error;
      }

      console.log('📊 fetchInventoryItems: Dados brutos recebidos:', data);

      // Processar dados para criar campos virtuais
      const processedData = (data || []).map(item => {
        const product = item.products;
        const totalValue = (product?.base_price || 0) * item.quantity;
        
        // Determinar status baseado na quantidade
        let status: 'in_stock' | 'low_stock' | 'out_of_stock';
        if (item.quantity === 0) {
          status = 'out_of_stock';
        } else if (item.quantity <= (product?.min_stock || 0)) {
          status = 'low_stock';
        } else {
          status = 'in_stock';
        }

        return {
          ...item,
          name: product?.name || 'Produto sem nome',
          sku: product?.sku || 'N/A',
          category: product?.category || 'Outros',
          price: product?.base_price || 0,
          min_stock: product?.min_stock || 0,
          supplier: 'N/A', // Não temos fornecedor na estrutura atual
          description: product?.description || '',
          image_url: product?.image_url || null,
          total_value: totalValue,
          status
        };
      });

      console.log('✅ fetchInventoryItems: Dados processados:', processedData);
      setInventoryItems(processedData);
    } catch (err) {
      console.error('❌ fetchInventoryItems: Erro ao buscar itens do inventário:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar inventário');
    } finally {
      setLoading(false);
    }
  };

  // Criar novo item no inventário
  const createInventoryItem = async (itemData: {
    name: string;
    category: string;
    price: number;
    quantity: number;
    min_stock: number;
    supplier?: string;
    description?: string;
    image_url?: string;
  }) => {
    console.log('🚀 createInventoryItem: Iniciando criação de item...', { itemData, user: user?.id });
    
    if (!user) {
      console.error('❌ createInventoryItem: Usuário não autenticado');
      throw new Error('Usuário não autenticado');
    }

    try {
      // Primeiro, criar o produto
      console.log('📦 createInventoryItem: Criando produto...');
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert([
          {
            owner_id: user.id,
            name: itemData.name,
            sku: `SKU-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
            category: itemData.category,
            base_price: itemData.price,
            min_stock: itemData.min_stock,
            description: itemData.description,
            image_url: itemData.image_url,
            type: 'product',
            stock: itemData.quantity
          }
        ])
        .select()
        .single();

      if (productError) {
        console.error('❌ createInventoryItem: Erro ao criar produto:', productError);
        throw productError;
      }
      
      console.log('✅ createInventoryItem: Produto criado com sucesso:', product);

      // Depois, criar o item de inventário
      console.log('📋 createInventoryItem: Criando item de inventário...');
      const { data: inventoryItem, error: inventoryError } = await supabase
        .from('inventory')
        .insert([
          {
            owner_id: user.id,
            product_id: product.id,
            quantity: itemData.quantity,
            location: 'Estoque Geral'
          }
        ])
        .select(`
          *,
          products (
            id,
            name,
            sku,
            category,
            base_price,
            min_stock,
            image_url,
            description
          )
        `)
        .single();

      if (inventoryError) {
        console.error('❌ createInventoryItem: Erro ao criar item de inventário:', inventoryError);
        throw inventoryError;
      }
      
      console.log('✅ createInventoryItem: Item de inventário criado com sucesso:', inventoryItem);

      // Processar dados para criar campos virtuais
      const processedItem = {
        ...inventoryItem,
        name: product.name,
        sku: product.sku,
        category: product.category,
        price: product.base_price,
        min_stock: product.min_stock,
        supplier: itemData.supplier || 'N/A',
        description: product.description,
        image_url: product.image_url,
        total_value: product.base_price * itemData.quantity,
        status: itemData.quantity === 0 ? 'out_of_stock' : 
                itemData.quantity <= itemData.min_stock ? 'low_stock' : 'in_stock'
      };

      // Atualizar lista local
      console.log('🔄 createInventoryItem: Atualizando lista local...');
      setInventoryItems(prev => [processedItem, ...prev]);
      
      console.log('✅ createInventoryItem: Item criado com sucesso!', processedItem);
      return processedItem;
    } catch (err) {
      console.error('❌ createInventoryItem: Erro ao criar item do inventário:', err);
      throw err;
    }
  };

  // Atualizar item do inventário
  const updateInventoryItem = async (id: string, updates: {
    name?: string;
    category?: string;
    price?: number;
    quantity?: number;
    min_stock?: number;
    supplier?: string;
    description?: string;
    image_url?: string;
  }) => {
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    try {
      const currentItem = inventoryItems.find(item => item.id === id);
      if (!currentItem) {
        throw new Error('Item não encontrado');
      }

      // Atualizar produto se necessário
      if (updates.name || updates.category || updates.price || updates.min_stock || updates.description || updates.image_url) {
        const { error: productError } = await supabase
          .from('products')
          .update({
            name: updates.name,
            category: updates.category,
            base_price: updates.price,
            min_stock: updates.min_stock,
            description: updates.description,
            image_url: updates.image_url
          })
          .eq('id', currentItem.product_id)
          .eq('owner_id', user.id);

        if (productError) {
          throw productError;
        }
      }

      // Atualizar inventário se quantidade foi alterada
      if (updates.quantity !== undefined) {
        const { data, error } = await supabase
          .from('inventory')
          .update({ quantity: updates.quantity })
          .eq('id', id)
          .eq('owner_id', user.id)
          .select(`
            *,
            products (
              id,
              name,
              sku,
              category,
              base_price,
              min_stock,
              image_url,
              description
            )
          `)
          .single();

        if (error) {
          throw error;
        }

        // Processar dados atualizados
        const product = data.products;
        const processedItem = {
          ...data,
          name: product?.name || updates.name || currentItem.name,
          sku: product?.sku || currentItem.sku,
          category: product?.category || updates.category || currentItem.category,
          price: product?.base_price || updates.price || currentItem.price,
          min_stock: product?.min_stock || updates.min_stock || currentItem.min_stock,
          supplier: updates.supplier || currentItem.supplier,
          description: product?.description || updates.description || currentItem.description,
          image_url: product?.image_url || updates.image_url || currentItem.image_url,
          total_value: (product?.base_price || updates.price || currentItem.price) * updates.quantity,
          status: updates.quantity === 0 ? 'out_of_stock' : 
                  updates.quantity <= (updates.min_stock || currentItem.min_stock) ? 'low_stock' : 'in_stock'
        };

        // Atualizar lista local
        setInventoryItems(prev => 
          prev.map(item => item.id === id ? processedItem : item)
        );

        return processedItem;
      } else {
        // Apenas atualizar campos virtuais se não houve mudança na quantidade
        const updatedItem = {
          ...currentItem,
          name: updates.name || currentItem.name,
          category: updates.category || currentItem.category,
          price: updates.price || currentItem.price,
          min_stock: updates.min_stock || currentItem.min_stock,
          supplier: updates.supplier || currentItem.supplier,
          description: updates.description || currentItem.description,
          image_url: updates.image_url || currentItem.image_url,
          total_value: (updates.price || currentItem.price) * currentItem.quantity
        };

        setInventoryItems(prev => 
          prev.map(item => item.id === id ? updatedItem : item)
        );

        return updatedItem;
      }
    } catch (err) {
      console.error('Erro ao atualizar item do inventário:', err);
      throw err;
    }
  };

  // Deletar item do inventário
  const deleteInventoryItem = async (id: string) => {
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    try {
      const currentItem = inventoryItems.find(item => item.id === id);
      if (!currentItem) {
        throw new Error('Item não encontrado');
      }

      // Deletar item de inventário
      const { error: inventoryError } = await supabase
        .from('inventory')
        .delete()
        .eq('id', id)
        .eq('owner_id', user.id);

      if (inventoryError) {
        throw inventoryError;
      }

      // Deletar produto associado
      const { error: productError } = await supabase
        .from('products')
        .delete()
        .eq('id', currentItem.product_id)
        .eq('owner_id', user.id);

      if (productError) {
        throw productError;
      }

      // Atualizar lista local
      setInventoryItems(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error('Erro ao deletar item do inventário:', err);
      throw err;
    }
  };

  // Buscar itens quando o usuário mudar
  useEffect(() => {
    if (user) {
      fetchInventoryItems();
    } else {
      setInventoryItems([]);
      setLoading(false);
    }
  }, [user]);

  return {
    inventoryItems,
    loading,
    error,
    createInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    refetch: fetchInventoryItems
  };
};
