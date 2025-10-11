// =====================================================
// EXECUTAR LIMPEZA DE CONTATOS MOCKADOS
// =====================================================
// Execute: node executar_limpeza_contatos.js

const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase (substitua pelos seus valores)
const supabaseUrl = 'https://your-project.supabase.co';
const supabaseKey = 'your-anon-key';

console.log('⚠️  ATENÇÃO: Configure as variáveis supabaseUrl e supabaseKey antes de executar!');
console.log('📝 Edite este arquivo e substitua os valores de exemplo pelos seus dados do Supabase.');

// Descomente as linhas abaixo após configurar as credenciais
/*
const supabase = createClient(supabaseUrl, supabaseKey);

async function executarLimpeza() {
  try {
    console.log('🔍 Verificando contatos existentes...');
    
    // Listar contatos
    const { data: contatos, error } = await supabase
      .from('contacts')
      .select('*');

    if (error) {
      console.error('❌ Erro:', error);
      return;
    }

    console.log(`📊 Total de contatos: ${contatos.length}`);
    
    // Identificar contatos mockados
    const mockados = contatos.filter(c => 
      ['Thiago', 'Bruna Silva', 'Manoel Martins'].includes(c.name) ||
      ['55863566664', '5511987654321', '5516999888777'].includes(c.phone)
    );

    if (mockados.length > 0) {
      console.log(`🎯 Removendo ${mockados.length} contatos mockados...`);
      
      const { error: deleteError } = await supabase
        .from('contacts')
        .delete()
        .in('id', mockados.map(c => c.id));

      if (deleteError) {
        console.error('❌ Erro ao remover:', deleteError);
        return;
      }

      console.log('✅ Contatos mockados removidos!');
    } else {
      console.log('ℹ️ Nenhum contato mockado encontrado.');
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

executarLimpeza();
*/
