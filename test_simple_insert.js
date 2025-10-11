// Script simples para testar inserção de dados
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://nrbsocawokmihvxfcpso.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NzQwNTMsImV4cCI6MjA3MjA1MDA1M30.3SxEVRNNBHhAXgJ7S2BMHm1QWq9kxYamuLjvZm0_OU0";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testSimpleInsert() {
  console.log('🧪 Testando inserção simples...');
  
  try {
    // Testar inserção de uma área diretamente
    const { data, error } = await supabase
      .from('company_areas')
      .insert([{
        company_id: '00000000-0000-0000-0000-000000000000', // UUID fictício para teste
        name: 'Área de Teste',
        description: 'Teste de inserção',
        status: 'active'
      }])
      .select()
      .single();
    
    if (error) {
      console.error('❌ Erro na inserção:', error);
      
      // Se for erro de RLS, vamos tentar uma abordagem diferente
      if (error.code === '42501') {
        console.log('🔒 Erro de RLS detectado. Tentando buscar empresas existentes...');
        
        const { data: existingCompanies, error: companyError } = await supabase
          .from('companies')
          .select('id')
          .limit(1);
        
        if (companyError) {
          console.error('❌ Erro ao buscar empresas:', companyError);
        } else if (existingCompanies && existingCompanies.length > 0) {
          console.log('✅ Empresa encontrada:', existingCompanies[0].id);
          
          // Tentar inserir área com company_id real
          const { data: areaData, error: areaError } = await supabase
            .from('company_areas')
            .insert([{
              company_id: existingCompanies[0].id,
              name: 'Área de Teste',
              description: 'Teste de inserção com company_id real',
              status: 'active'
            }])
            .select()
            .single();
          
          if (areaError) {
            console.error('❌ Erro ao inserir área:', areaError);
          } else {
            console.log('✅ Área inserida com sucesso:', areaData);
          }
        } else {
          console.log('⚠️  Nenhuma empresa encontrada');
        }
      }
    } else {
      console.log('✅ Área inserida com sucesso:', data);
    }
    
  } catch (err) {
    console.error('❌ Erro geral:', err);
  }
}

async function checkExistingData() {
  console.log('🔍 Verificando dados existentes...');
  
  try {
    // Verificar empresas
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, fantasy_name')
      .limit(5);
    
    if (companiesError) {
      console.error('❌ Erro ao buscar empresas:', companiesError);
    } else {
      console.log('📊 Empresas encontradas:', companies?.length || 0);
      companies?.forEach(company => {
        console.log(`   - ${company.fantasy_name} (${company.id})`);
      });
    }
    
    // Verificar áreas
    const { data: areas, error: areasError } = await supabase
      .from('company_areas')
      .select('id, name, company_id')
      .limit(5);
    
    if (areasError) {
      console.error('❌ Erro ao buscar áreas:', areasError);
    } else {
      console.log('📊 Áreas encontradas:', areas?.length || 0);
      areas?.forEach(area => {
        console.log(`   - ${area.name} (${area.id})`);
      });
    }
    
  } catch (err) {
    console.error('❌ Erro ao verificar dados:', err);
  }
}

async function main() {
  console.log('🚀 Teste simples de inserção...\n');
  
  await checkExistingData();
  console.log('');
  await testSimpleInsert();
  
  console.log('\n✅ Teste concluído!');
}

main().catch(console.error);
