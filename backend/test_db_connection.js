const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔌 Testando conexão com o banco...');
    
    // Testar conexão básica
    await prisma.$connect();
    console.log('✅ Conexão com banco estabelecida!');
    
    // Verificar se a tabela leadActivities existe
    try {
      const result = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'leadActivities'
      `;
      
      console.log('📊 Tabelas encontradas:', result);
      
      if (result.length === 0) {
        console.log('⚠️  Tabela leadActivities não existe. Criando...');
        
        // Criar a tabela leadActivities
        await prisma.$executeRaw`
          CREATE TABLE IF NOT EXISTS "leadActivities" (
            "id" TEXT NOT NULL,
            "ownerId" TEXT NOT NULL,
            "lead_id" TEXT,
            "type" TEXT NOT NULL,
            "title" TEXT NOT NULL,
            "description" TEXT,
            "scheduled_date" TIMESTAMP(3) NOT NULL,
            "end_date" TIMESTAMP(3),
            "location" TEXT,
            "attendees" TEXT,
            "is_all_day" BOOLEAN NOT NULL DEFAULT false,
            "reminder_minutes" INTEGER,
            "status" TEXT NOT NULL DEFAULT 'scheduled',
            "google_event_id" TEXT,
            "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updated_at" TIMESTAMP(3) NOT NULL,
            CONSTRAINT "leadActivities_pkey" PRIMARY KEY ("id")
          )
        `;
        
        console.log('✅ Tabela leadActivities criada!');
      } else {
        console.log('✅ Tabela leadActivities já existe!');
      }
      
      // Verificar se a tabela Leads existe
      const leadsResult = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'Leads'
      `;
      
      if (leadsResult.length === 0) {
        console.log('⚠️  Tabela Leads não existe. Criando...');
        
        await prisma.$executeRaw`
          CREATE TABLE IF NOT EXISTS "Leads" (
            "id" TEXT NOT NULL,
            "ownerId" TEXT NOT NULL,
            "name" TEXT NOT NULL,
            "email" TEXT,
            "phone" TEXT,
            "company" TEXT,
            "source" TEXT,
            "status" TEXT NOT NULL DEFAULT 'new',
            "assigned_to" TEXT,
            "value" DECIMAL(10,2),
            "notes" TEXT,
            "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updated_at" TIMESTAMP(3) NOT NULL,
            CONSTRAINT "Leads_pkey" PRIMARY KEY ("id")
          )
        `;
        
        console.log('✅ Tabela Leads criada!');
      } else {
        console.log('✅ Tabela Leads já existe!');
      }
      
      // Testar inserção de um evento de teste
      console.log('🧪 Testando inserção de evento...');
      
      const testEvent = await prisma.$executeRaw`
        INSERT INTO "leadActivities" (
          "id", "ownerId", "type", "title", "scheduled_date", 
          "end_date", "is_all_day", "status", "created_at", "updated_at"
        ) VALUES (
          'test-event-1', 'test-user', 'meeting', 'Teste de Evento', 
          NOW(), NOW() + INTERVAL '1 hour', false, 'scheduled', NOW(), NOW()
        )
        ON CONFLICT ("id") DO NOTHING
      `;
      
      console.log('✅ Evento de teste inserido!');
      
      // Testar busca de eventos
      console.log('🔍 Testando busca de eventos...');
      
      const events = await prisma.$queryRaw`
        SELECT * FROM "leadActivities" WHERE "ownerId" = 'test-user'
      `;
      
      console.log(`✅ Encontrados ${events.length} eventos para o usuário de teste`);
      
    } catch (tableError) {
      console.error('❌ Erro com tabelas:', tableError);
    }
    
  } catch (error) {
    console.error('❌ Erro na conexão:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
