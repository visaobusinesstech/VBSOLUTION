// =====================================================
// SCRIPT PARA LIMPAR CONTATOS MOCKADOS
// =====================================================
// Execute este script para remover os contatos mockados
// que aparecem na interface (Thiago, Bruna Silva, Manoel Martins)

const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your-project') || supabaseKey.includes('your-anon-key')) {
  console.error('❌ Configure as variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function limparContatosMockados() {
  try {
    console.log('🔍 Verificando contatos existentes...');
    
    // 1. Listar todos os contatos existentes
    const { data: contatosExistentes, error: listError } = await supabase
      .from('contacts')
      .select('*')
      .order('created_at', { ascending: false });

    if (listError) {
      console.error('❌ Erro ao listar contatos:', listError);
      return;
    }

    console.log(`📊 Total de contatos encontrados: ${contatosExistentes.length}`);
    
    if (contatosExistentes.length > 0) {
      console.log('\n📋 Contatos existentes:');
      contatosExistentes.forEach((contato, index) => {
        console.log(`${index + 1}. ${contato.name} (${contato.phone}) - ${contato.email}`);
      });
    }

    // 2. Identificar contatos mockados para remoção
    const contatosMockados = contatosExistentes.filter(contato => 
      contato.name === 'Thiago' || 
      contato.name === 'Bruna Silva' || 
      contato.name === 'Manoel Martins' ||
      contato.phone === '55863566664' ||
      contato.phone === '5511987654321' ||
      contato.phone === '5516999888777' ||
      contato.email === 'thiago@email.com' ||
      contato.email === 'bruna@empresa.com' ||
      contato.email === 'manoel@startup.com' ||
      contato.company === 'Tech Corp' ||
      contato.company === 'Marketing Plus' ||
      contato.company === 'StartupXYZ'
    );

    console.log(`\n🎯 Contatos mockados identificados: ${contatosMockados.length}`);
    
    if (contatosMockados.length > 0) {
      console.log('\n🗑️ Contatos que serão removidos:');
      contatosMockados.forEach((contato, index) => {
        console.log(`${index + 1}. ${contato.name} (${contato.phone}) - ${contato.email}`);
      });

      // 3. Remover contatos mockados
      const idsParaRemover = contatosMockados.map(contato => contato.id);
      
      console.log('\n🔄 Removendo contatos mockados...');
      
      const { error: deleteError } = await supabase
        .from('contacts')
        .delete()
        .in('id', idsParaRemover);

      if (deleteError) {
        console.error('❌ Erro ao remover contatos:', deleteError);
        return;
      }

      console.log('✅ Contatos mockados removidos com sucesso!');
    } else {
      console.log('ℹ️ Nenhum contato mockado encontrado para remoção.');
    }

    // 4. Verificar resultado final
    console.log('\n🔍 Verificando resultado final...');
    
    const { data: contatosFinais, error: finalError } = await supabase
      .from('contacts')
      .select('*')
      .order('created_at', { ascending: false });

    if (finalError) {
      console.error('❌ Erro ao verificar contatos finais:', finalError);
      return;
    }

    console.log(`\n📊 Total de contatos restantes: ${contatosFinais.length}`);
    
    if (contatosFinais.length > 0) {
      console.log('\n📋 Contatos restantes:');
      contatosFinais.forEach((contato, index) => {
        console.log(`${index + 1}. ${contato.name} (${contato.phone}) - ${contato.email}`);
      });
    } else {
      console.log('\n✅ Tabela de contatos está vazia - pronta para uso!');
    }

    console.log('\n🎉 Limpeza concluída com sucesso!');
    console.log('💡 Agora a página de contatos mostrará apenas dados reais do banco de dados.');

  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error);
  }
}

// Executar limpeza
limparContatosMockados();
