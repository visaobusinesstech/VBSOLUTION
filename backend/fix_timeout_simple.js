const { PrismaClient } = require('@prisma/client');

async function fixTimeoutOverflow() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔧 Corrigindo valores de timeout inválidos...');
    
    // Verificar configurações atuais
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
    
    let fixedCount = 0;
    
    for (const config of configs) {
      const updates = {};
      let needsUpdate = false;
      
      // Corrigir valores inválidos
      if (config.message_debounce_time_ms > 2147483647 || config.message_debounce_time_ms < 0) {
        updates.message_debounce_time_ms = 30000; // 30 segundos
        needsUpdate = true;
      }
      
      if (config.message_chunk_delay_ms > 2147483647 || config.message_chunk_delay_ms < 0) {
        updates.message_chunk_delay_ms = 2000; // 2 segundos
        needsUpdate = true;
      }
      
      if (config.message_min_delay_ms > 2147483647 || config.message_min_delay_ms < 0) {
        updates.message_min_delay_ms = 3000; // 3 segundos
        needsUpdate = true;
      }
      
      if (config.message_max_delay_ms > 2147483647 || config.message_max_delay_ms < 0) {
        updates.message_max_delay_ms = 5000; // 5 segundos
        needsUpdate = true;
      }
      
      // Corrigir valores suspeitos que podem estar causando problemas
      if (config.message_debounce_time_ms === 3600 || 
          config.message_debounce_time_ms === 7200 || 
          config.message_debounce_time_ms === 36000) {
        updates.message_debounce_time_ms = 30000; // Converter para 30s
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        await prisma.ai_agent_configs.update({
          where: { id: config.id },
          data: {
            ...updates,
            updated_at: new Date(),
          }
        });
        
        console.log(`✅ Corrigido: ${config.name}`);
        fixedCount++;
      }
    }
    
    console.log(`🎉 Correção concluída! ${fixedCount} configurações foram corrigidas.`);
    
  } catch (error) {
    console.error('❌ Erro ao corrigir timeouts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixTimeoutOverflow();
