// Script para verificar constraints da tabela leads
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://nrbsocawokmihvxfcpso.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NzQwNTMsImV4cCI6MjA3MjA1MDA1M30.3SxEVRNNBHhAXgJ7S2BMHm1QWq9kxYamuLjvZm0_OU0";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function checkConstraints() {
  console.log('🔍 Verificando constraints da tabela leads...');
  
  try {
    // Verificar estrutura da tabela leads
    const { data: tableInfo, error: tableError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'leads')
      .eq('table_schema', 'public');
    
    if (tableError) {
      console.error('❌ Erro ao verificar estrutura da tabela:', tableError.message);
      return;
    }
    
    console.log('📋 Colunas da tabela leads:');
    tableInfo.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // Verificar foreign keys
    const { data: fkInfo, error: fkError } = await supabase
      .from('information_schema.table_constraints')
      .select('constraint_name, constraint_type')
      .eq('table_name', 'leads')
      .eq('table_schema', 'public');
    
    if (fkError) {
      console.error('❌ Erro ao verificar foreign keys:', fkError.message);
      return;
    }
    
    console.log('\n🔗 Constraints da tabela leads:');
    fkInfo.forEach(constraint => {
      console.log(`   - ${constraint.constraint_name}: ${constraint.constraint_type}`);
    });
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error.message);
  }
}

// Executar verificação
checkConstraints();
