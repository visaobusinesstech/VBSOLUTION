const { PrismaClient } = require('@prisma/client');

async function testPostgresConnection() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔌 Testando conexão PostgreSQL...');
    
    // Testar conexão básica
    await prisma.$connect();
    console.log('✅ Conexão PostgreSQL estabelecida!');
    
    // Testar se conseguimos fazer uma query simples
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Query de teste executada:', result);
    
    // Testar se a tabela events existe
    const tableCheck = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'events'
      ) as exists;
    `;
    
    console.log('📊 Tabela events existe?', tableCheck[0].exists);
    
    if (tableCheck[0].exists) {
      // Testar inserção de um evento
      console.log('🧪 Testando inserção de evento...');
      
      const testEvent = await prisma.event.create({
        data: {
          owner_id: 'test-user-123',
          title: 'Teste de Evento',
          description: 'Evento de teste criado via API',
          start_time: new Date(),
          end_time: new Date(Date.now() + 60 * 60 * 1000), // 1 hora depois
          location: 'Local de teste',
          all_day: false,
          attendees: ['test@example.com'],
        },
      });
      
      console.log('✅ Evento de teste criado:', testEvent);
      
      // Testar busca de eventos
      const events = await prisma.event.findMany({
        where: { owner_id: 'test-user-123' },
      });
      
      console.log(`✅ Encontrados ${events.length} eventos para o usuário de teste`);
      
      // Limpar o evento de teste
      await prisma.event.delete({
        where: { id: testEvent.id },
      });
      
      console.log('✅ Evento de teste removido');
    }
    
  } catch (error) {
    console.error('❌ Erro na conexão PostgreSQL:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPostgresConnection();
