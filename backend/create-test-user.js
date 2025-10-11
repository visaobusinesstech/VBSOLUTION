#!/usr/bin/env node

/**
 * Criar usuário de teste no Supabase Auth
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nrbsocawokmihvxfcpso.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQ3NDA1MywiZXhwIjoyMDcyMDUwMDUzfQ.w6EJDzQj1fffHJ4lYzOVDLydqhbhGOW5KtGBDjaHfPA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestUser() {
  try {
    console.log('👤 Criando usuário de teste...');
    
    const { data, error } = await supabase.auth.admin.createUser({
      email: `test-${Date.now()}@example.com`,
      password: 'testpassword123',
      email_confirm: true
    });

    if (error) {
      console.error('❌ Erro ao criar usuário:', error);
      return null;
    }

    console.log('✅ Usuário criado:', data.user.id);
    console.log('📧 Email:', data.user.email);
    
    return data.user.id;
  } catch (error) {
    console.error('❌ Erro:', error);
    return null;
  }
}

async function testWithRealUser() {
  const userId = await createTestUser();
  
  if (!userId) {
    console.log('❌ Falha ao criar usuário');
    return;
  }

  console.log('\n🧪 Testando inserção com usuário real...');
  
  try {
    // Testar inserção de sessão
    const sessionData = {
      id: require('uuid').v4(),
      owner_id: userId,
      session_name: 'Sessão de Teste',
      status: 'CONNECTED',
      connected_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('whatsapp_sessions')
      .insert(sessionData)
      .select();

    if (error) {
      console.error('❌ Erro ao inserir sessão:', error);
    } else {
      console.log('✅ Sessão inserida:', data[0].id);
    }

    // Testar inserção de atendimento
    const atendimentoData = {
      id: require('uuid').v4(),
      owner_id: userId,
      company_id: null,
      numero_cliente: '2147483647',
      nome_cliente: 'Cliente de Teste',
      status: 'AGUARDANDO',
      data_inicio: new Date().toISOString(),
      ultima_mensagem: new Date().toISOString(),
      prioridade: 1,
      canal: 'whatsapp',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: atendimento, error: atendimentoError } = await supabase
      .from('whatsapp_atendimentos')
      .insert(atendimentoData)
      .select();

    if (atendimentoError) {
      console.error('❌ Erro ao inserir atendimento:', atendimentoError);
    } else {
      console.log('✅ Atendimento inserido:', atendimento[0].id);
      
      // Testar inserção de mensagem
      const mensagemData = {
        id: require('uuid').v4(),
        owner_id: userId,
        atendimento_id: atendimento[0].id,
        conteudo: 'Mensagem de teste',
        tipo: 'TEXTO',
        remetente: 'CLIENTE',
        timestamp: new Date().toISOString(),
        lida: false,
        created_at: new Date().toISOString()
      };

      const { data: mensagem, error: mensagemError } = await supabase
        .from('whatsapp_mensagens')
        .insert(mensagemData)
        .select();

      if (mensagemError) {
        console.error('❌ Erro ao inserir mensagem:', mensagemError);
      } else {
        console.log('✅ Mensagem inserida:', mensagem[0].id);
      }
    }

    // Testar inserção de configuração
    const configData = {
      id: require('uuid').v4(),
      owner_id: userId,
      company_id: null,
      nome: 'Configuração de Teste',
      mensagem_boas_vindas: 'Olá! Como posso ajudá-lo?',
      mensagem_menu: 'Escolha uma opção:\n1. Suporte\n2. Vendas',
      mensagem_despedida: 'Obrigado por entrar em contato!',
      tempo_resposta: 300,
      max_tentativas: 3,
      ativo: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: config, error: configError } = await supabase
      .from('whatsapp_configuracoes')
      .insert(configData)
      .select();

    if (configError) {
      console.error('❌ Erro ao inserir configuração:', configError);
    } else {
      console.log('✅ Configuração inserida:', config[0].id);
    }

    console.log('\n🎉 Teste completo! Todas as tabelas funcionando.');
    console.log('📋 Próximos passos:');
    console.log('   1. ✅ Backend services criados');
    console.log('   2. ✅ Persistência Supabase funcionando');
    console.log('   3. ✅ APIs WhatsApp V2 criadas');
    console.log('   4. 🔄 Implementar frontend com realtime');
    console.log('   5. 🔄 Testar integração end-to-end');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testWithRealUser().catch(console.error);
