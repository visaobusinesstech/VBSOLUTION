const { PrismaClient } = require('@prisma/client');

async function removeTimeoutConfigs() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🗑️  Removendo configurações de timeout desnecessárias...');
    
    // Primeiro, vamos ver o que temos na tabela ai_agent_configs
    const configs = await prisma.ai_agent_configs.findMany({
      select: {
        id: true,
        name: true,
        message_debounce_time_ms: true,
        message_chunk_delay_ms: true,
        message_min_delay_ms: true,
        message_max_delay_ms: true,
      }
    });
    
    console.log(`📊 Encontradas ${configs.length} configurações`);
    
    if (configs.length === 0) {
      console.log('✅ Nenhuma configuração encontrada. Tudo limpo!');
      return;
    }
    
    // Vamos remover completamente essas configurações desnecessárias
    console.log('🔧 Removendo todas as configurações de timeout...');
    
    const deleteResult = await prisma.ai_agent_configs.deleteMany({
      where: {
        // Remover todas as configurações que têm esses campos problemáticos
        OR: [
          { message_debounce_time_ms: { not: null } },
          { message_chunk_delay_ms: { not: null } },
          { message_min_delay_ms: { not: null } },
          { message_max_delay_ms: { not: null } },
        ]
      }
    });
    
    console.log(`🎉 Removidas ${deleteResult.count} configurações de timeout desnecessárias!`);
    
    // Verificar se ainda existem configurações
    const remainingConfigs = await prisma.ai_agent_configs.count();
    console.log(`📈 Configurações restantes: ${remainingConfigs}`);
    
  } catch (error) {
    console.error('❌ Erro ao remover configurações de timeout:', error);
    
    // Se der erro, vamos tentar uma abordagem mais simples
    console.log('🔄 Tentando abordagem alternativa...');
    
    try {
      // Vamos tentar atualizar os valores para valores seguros em vez de deletar
      const updateResult = await prisma.ai_agent_configs.updateMany({
        data: {
          message_debounce_time_ms: null,
          message_chunk_delay_ms: null,
          message_min_delay_ms: null,
          message_max_delay_ms: null,
        }
      });
      
      console.log(`✅ Valores de timeout limpos em ${updateResult.count} registros`);
      
    } catch (updateError) {
      console.error('❌ Erro na abordagem alternativa:', updateError);
    }
  } finally {
    await prisma.$disconnect();
  }
}

removeTimeoutConfigs();
