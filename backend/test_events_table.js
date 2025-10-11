const { PrismaClient } = require('@prisma/client');

async function testEventsTable() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔌 Testando tabela events...');
    
    // Testar conexão básica
    await prisma.$connect();
    console.log('✅ Conexão estabelecida!');
    
    // Tentar criar um evento diretamente
    console.log('🧪 Criando evento de teste...');
    
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
    
    // Buscar eventos
    console.log('🔍 Buscando eventos...');
    
    const events = await prisma.event.findMany({
      where: { owner_id: 'test-user-123' },
    });
    
    console.log(`✅ Encontrados ${events.length} eventos para o usuário de teste`);
    
    // Limpar o evento de teste
    await prisma.event.delete({
      where: { id: testEvent.id },
    });
    
    console.log('✅ Evento de teste removido');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testEventsTable();
