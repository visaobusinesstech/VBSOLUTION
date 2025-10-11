// Script para testar conexão e criar tabelas no Supabase
// Execute este script no Node.js ou no console do navegador

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://nrbsocawokmihvxfcpso.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NzQwNTMsImV4cCI6MjA3MjA1MDA1M30.3SxEVRNNBHhAXgJ7S2BMHm1QWq9kxYamuLjvZm0_OU0";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testConnection() {
  console.log('🔍 Testando conexão com Supabase...');
  
  try {
    // Testar conexão básica
    const { data, error } = await supabase.from('companies').select('count').limit(1);
    
    if (error) {
      console.error('❌ Erro na conexão:', error);
      return false;
    }
    
    console.log('✅ Conexão com Supabase estabelecida com sucesso!');
    return true;
  } catch (err) {
    console.error('❌ Erro na conexão:', err);
    return false;
  }
}

async function checkTables() {
  console.log('🔍 Verificando tabelas existentes...');
  
  const tables = ['company_settings', 'company_areas', 'company_roles', 'company_users', 'user_profiles'];
  const existingTables = [];
  const missingTables = [];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('count').limit(1);
      
      if (error && error.code === 'PGRST116') {
        // Tabela não existe
        missingTables.push(table);
        console.log(`❌ Tabela '${table}' não existe`);
      } else if (error) {
        console.log(`⚠️  Erro ao verificar tabela '${table}':`, error.message);
        missingTables.push(table);
      } else {
        existingTables.push(table);
        console.log(`✅ Tabela '${table}' existe`);
      }
    } catch (err) {
      console.log(`❌ Erro ao verificar tabela '${table}':`, err.message);
      missingTables.push(table);
    }
  }
  
  return { existingTables, missingTables };
}

async function createTestData() {
  console.log('🔍 Criando dados de teste...');
  
  try {
    // Primeiro, verificar se existe uma empresa
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id')
      .limit(1);
    
    if (companiesError) {
      console.error('❌ Erro ao buscar empresas:', companiesError);
      return;
    }
    
    if (!companies || companies.length === 0) {
      console.log('⚠️  Nenhuma empresa encontrada. Criando empresa de teste...');
      
      // Criar empresa de teste
      const { data: newCompany, error: createCompanyError } = await supabase
        .from('companies')
        .insert([{
          owner_id: '00000000-0000-0000-0000-000000000000', // UUID fictício para teste
          fantasy_name: 'Empresa de Teste',
          company_name: 'Empresa de Teste LTDA',
          status: 'active'
        }])
        .select()
        .single();
      
      if (createCompanyError) {
        console.error('❌ Erro ao criar empresa:', createCompanyError);
        return;
      }
      
      console.log('✅ Empresa de teste criada:', newCompany.id);
      
      // Criar configurações da empresa
      const { data: settings, error: settingsError } = await supabase
        .from('company_settings')
        .insert([{
          company_id: newCompany.id,
          company_name: 'Empresa de Teste',
          default_language: 'pt-BR',
          default_timezone: 'America/Sao_Paulo',
          default_currency: 'BRL',
          datetime_format: 'DD/MM/YYYY HH:mm'
        }])
        .select()
        .single();
      
      if (settingsError) {
        console.error('❌ Erro ao criar configurações:', settingsError);
      } else {
        console.log('✅ Configurações da empresa criadas');
      }
      
      // Criar áreas de teste
      const { data: areas, error: areasError } = await supabase
        .from('company_areas')
        .insert([
          { company_id: newCompany.id, name: 'Administração', description: 'Setor administrativo' },
          { company_id: newCompany.id, name: 'Vendas', description: 'Setor de vendas' },
          { company_id: newCompany.id, name: 'TI', description: 'Tecnologia da Informação' }
        ])
        .select();
      
      if (areasError) {
        console.error('❌ Erro ao criar áreas:', areasError);
      } else {
        console.log('✅ Áreas de teste criadas:', areas.length);
      }
      
      // Criar cargos de teste
      const { data: roles, error: rolesError } = await supabase
        .from('company_roles')
        .insert([
          { 
            company_id: newCompany.id, 
            name: 'Administrador', 
            description: 'Administrador do sistema',
            permissions: {}
          },
          { 
            company_id: newCompany.id, 
            name: 'Gerente', 
            description: 'Gerente de equipe',
            permissions: {}
          },
          { 
            company_id: newCompany.id, 
            name: 'Usuário', 
            description: 'Usuário padrão',
            permissions: {}
          }
        ])
        .select();
      
      if (rolesError) {
        console.error('❌ Erro ao criar cargos:', rolesError);
      } else {
        console.log('✅ Cargos de teste criados:', roles.length);
      }
      
    } else {
      console.log('✅ Empresa encontrada:', companies[0].id);
    }
    
  } catch (err) {
    console.error('❌ Erro ao criar dados de teste:', err);
  }
}

async function main() {
  console.log('🚀 Iniciando teste e configuração do banco de dados...\n');
  
  // 1. Testar conexão
  const connected = await testConnection();
  if (!connected) {
    console.log('❌ Não foi possível conectar ao Supabase. Verifique as credenciais.');
    return;
  }
  
  console.log('');
  
  // 2. Verificar tabelas
  const { existingTables, missingTables } = await checkTables();
  
  console.log('\n📊 Resumo:');
  console.log(`✅ Tabelas existentes: ${existingTables.length}`);
  console.log(`❌ Tabelas faltando: ${missingTables.length}`);
  
  if (missingTables.length > 0) {
    console.log('\n⚠️  ATENÇÃO: Execute o script SQL no Supabase para criar as tabelas faltantes:');
    console.log('📁 Arquivo: create_company_tables.sql');
    console.log('\nTabelas que precisam ser criadas:');
    missingTables.forEach(table => console.log(`   - ${table}`));
  }
  
  console.log('');
  
  // 3. Criar dados de teste se as tabelas existem
  if (missingTables.length === 0) {
    await createTestData();
  } else {
    console.log('⏭️  Pulando criação de dados de teste - tabelas não existem');
  }
  
  console.log('\n✅ Teste concluído!');
}

// Executar se chamado diretamente
if (typeof window === 'undefined') {
  main().catch(console.error);
} else {
  // Se executado no navegador
  window.testDatabase = main;
  console.log('💡 Execute window.testDatabase() para testar o banco de dados');
}
