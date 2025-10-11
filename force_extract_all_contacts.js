#!/usr/bin/env node

/**
 * Script para forçar extração de informações de todos os contatos existentes
 */

const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://nrbsocawokmihvxfcpso.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQ3NDA1MywiZXhwIjoyMDcyMDUwMDUzfQ.w6EJDzQj1fffHJ4lYzOVDLydqhbhGOW5KtGBDjaHfPA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function forceExtractAllContacts() {
  console.log('🚀 FORÇANDO EXTRAÇÃO DE INFORMAÇÕES DE TODOS OS CONTATOS...\n');

  try {
    // 1. Obter todas as conversas ativas
    console.log('📊 ETAPA 1: Buscando todas as conversas ativas...');
    
    const { data: conversas, error: conversasError } = await supabase
      .from('whatsapp_atendimentos')
      .select('*')
      .eq('status', 'active')
      .order('ultima_mensagem_em', { ascending: false });

    if (conversasError) {
      console.log('❌ Erro ao buscar conversas:', conversasError.message);
      return;
    }

    console.log(`✅ Encontradas ${conversas.length} conversas ativas`);

    // 2. Processar cada conversa
    console.log('\n📊 ETAPA 2: Processando cada conversa...');
    
    for (let i = 0; i < conversas.length; i++) {
      const conversa = conversas[i];
      console.log(`\n🔄 Processando ${i + 1}/${conversas.length}: ${conversa.chat_id}`);
      
      try {
        // Forçar atualização do nome de exibição
        const displayName = conversa.nome_cliente || `Contato ${conversa.numero_cliente}`;
        
        const { error: updateError } = await supabase
          .from('whatsapp_atendimentos')
          .update({
            display_name: displayName,
            is_group: conversa.chat_id.includes('@g.us'),
            updated_at: new Date().toISOString()
          })
          .eq('id', conversa.id);

        if (updateError) {
          console.log(`⚠️ Erro ao atualizar conversa ${conversa.id}:`, updateError.message);
        } else {
          console.log(`✅ Conversa atualizada: ${displayName}`);
        }

        // Verificar se é um contato individual (não grupo)
        if (!conversa.chat_id.includes('@g.us')) {
          // Buscar ou criar contato
          const { data: contatoExistente } = await supabase
            .from('contacts')
            .select('*')
            .eq('phone', conversa.numero_cliente)
            .single();

          if (contatoExistente) {
            // Atualizar contato existente
            const { error: contactUpdateError } = await supabase
              .from('contacts')
              .update({
                name_wpp: conversa.nome_cliente,
                whatsapp_name: conversa.nome_cliente,
                whatsapp_is_group: false,
                updated_at: new Date().toISOString()
              })
              .eq('id', contatoExistente.id);

            if (contactUpdateError) {
              console.log(`⚠️ Erro ao atualizar contato:`, contactUpdateError.message);
            } else {
              console.log(`✅ Contato atualizado: ${conversa.nome_cliente}`);
            }
          } else {
            // Criar novo contato
            const { error: contactCreateError } = await supabase
              .from('contacts')
              .insert({
                phone: conversa.numero_cliente,
                name: conversa.nome_cliente || `Contato ${conversa.numero_cliente}`,
                name_wpp: conversa.nome_cliente,
                whatsapp_name: conversa.nome_cliente,
                whatsapp_is_group: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });

            if (contactCreateError) {
              console.log(`⚠️ Erro ao criar contato:`, contactCreateError.message);
            } else {
              console.log(`✅ Novo contato criado: ${conversa.nome_cliente}`);
            }
          }
        }

      } catch (error) {
        console.log(`❌ Erro ao processar conversa ${conversa.id}:`, error.message);
      }
    }

    // 3. Atualizar mensagens com informações faltantes
    console.log('\n📊 ETAPA 3: Atualizando mensagens com informações faltantes...');
    
    const { data: mensagensSemInfo, error: mensagensError } = await supabase
      .from('whatsapp_mensagens')
      .select('*')
      .or('wpp_name.is.null,raw.is.null')
      .order('created_at', { ascending: false })
      .limit(50);

    if (mensagensError) {
      console.log('❌ Erro ao buscar mensagens:', mensagensError.message);
    } else {
      console.log(`✅ Encontradas ${mensagensSemInfo.length} mensagens para atualizar`);
      
      for (const mensagem of mensagensSemInfo) {
        try {
          // Buscar informações da conversa
          const { data: conversaMsg } = await supabase
            .from('whatsapp_atendimentos')
            .select('nome_cliente, chat_id')
            .eq('id', mensagem.atendimento_id)
            .single();

          const updateData = {};
          
          if (!mensagem.wpp_name && conversaMsg?.nome_cliente) {
            updateData.wpp_name = conversaMsg.nome_cliente;
          }
          
          if (!mensagem.raw) {
            updateData.raw = JSON.stringify({
              messageId: mensagem.message_id || mensagem.id,
              timestamp: mensagem.timestamp,
              content: mensagem.conteudo,
              type: mensagem.tipo,
              sender: mensagem.remetente
            });
          }

          if (Object.keys(updateData).length > 0) {
            updateData.updated_at = new Date().toISOString();
            
            const { error: updateMsgError } = await supabase
              .from('whatsapp_mensagens')
              .update(updateData)
              .eq('id', mensagem.id);

            if (updateMsgError) {
              console.log(`⚠️ Erro ao atualizar mensagem ${mensagem.id}:`, updateMsgError.message);
            } else {
              console.log(`✅ Mensagem atualizada: ${updateData.wpp_name || 'sem nome'}`);
            }
          }
        } catch (error) {
          console.log(`❌ Erro ao processar mensagem ${mensagem.id}:`, error.message);
        }
      }
    }

    // 4. Verificar resultados
    console.log('\n📊 ETAPA 4: Verificando resultados...');
    
    const { count: conversasComDisplayName } = await supabase
      .from('whatsapp_atendimentos')
      .select('*', { count: 'exact', head: true })
      .not('display_name', 'is', null);

    const { count: mensagensComWppName } = await supabase
      .from('whatsapp_mensagens')
      .select('*', { count: 'exact', head: true })
      .not('wpp_name', 'is', null);

    const { count: mensagensComRaw } = await supabase
      .from('whatsapp_mensagens')
      .select('*', { count: 'exact', head: true })
      .not('raw', 'is', null);

    console.log('🎯 RESULTADOS DA EXTRAÇÃO:');
    console.log('========================');
    console.log(`✅ Conversas com display_name: ${conversasComDisplayName || 0}`);
    console.log(`✅ Mensagens com wpp_name: ${mensagensComWppName || 0}`);
    console.log(`✅ Mensagens com raw: ${mensagensComRaw || 0}`);

    console.log('\n🚀 PRÓXIMOS PASSOS:');
    console.log('1. Reinicie o frontend para ver as mudanças');
    console.log('2. Verifique a página de Contatos');
    console.log('3. Verifique as conversas WhatsApp');
    console.log('4. Envie uma mensagem de teste para verificar os logs');

  } catch (error) {
    console.error('❌ Erro durante a extração:', error);
  }
}

// Executar extração
forceExtractAllContacts();
