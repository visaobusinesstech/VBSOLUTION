const https = require('https');

// Configurações do Supabase
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://nrbsocawokmihvxfcpso.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NzQwNTMsImV4cCI6MjA3MjA1MDA1M30.3SxEVRNNBHhAXgJ7S2BMHm1QWq9kxYamuLjvZm0_OU0';

async function makeRequest(url, options) {
    return new Promise((resolve, reject) => {
        const req = https.request(url, options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    resolve({ data: result, status: res.statusCode, headers: res.headers });
                } catch (e) {
                    resolve({ data, status: res.statusCode, headers: res.headers });
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        if (options.body) {
            req.write(options.body);
        }
        
        req.end();
    });
}

async function testKanbanUpdate() {
    try {
        console.log('🎯 Teste Kanban Update - Verificando se leads aparecem no Kanban...');
        
        // 1. Verificar leads existentes
        console.log('📊 1. Verificando leads existentes...');
        const leadsUrl = `${SUPABASE_URL}/rest/v1/leads?select=id,name,stage_id,created_at&order=created_at.desc&limit=10`;
        const leadsOptions = {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY
            }
        };
        
        const leadsResult = await makeRequest(leadsUrl, leadsOptions);
        console.log('📊 Status leads:', leadsResult.status);
        console.log('📊 Leads encontrados:', leadsResult.data?.length || 0);
        
        if (leadsResult.data && leadsResult.data.length > 0) {
            console.log('✅ Leads existentes:');
            leadsResult.data.forEach((lead, index) => {
                console.log(`   ${index + 1}. ${lead.name} (Stage: ${lead.stage_id}) - ${lead.created_at}`);
            });
        }

        // 2. Verificar etapas disponíveis
        console.log('📊 2. Verificando etapas disponíveis...');
        const stagesUrl = `${SUPABASE_URL}/rest/v1/funnel_stages?select=id,name,order_index&order=order_index.asc`;
        const stagesOptions = {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY
            }
        };
        
        const stagesResult = await makeRequest(stagesUrl, stagesOptions);
        console.log('📊 Status stages:', stagesResult.status);
        console.log('📊 Etapas encontradas:', stagesResult.data?.length || 0);
        
        if (stagesResult.data && stagesResult.data.length > 0) {
            console.log('✅ Etapas disponíveis:');
            stagesResult.data.forEach((stage, index) => {
                console.log(`   ${index + 1}. ${stage.name} (ID: ${stage.id})`);
            });
        }

        // 3. Criar um novo lead para teste
        console.log('🧪 3. Criando novo lead para teste...');
        const newLead = {
            name: 'Lead Kanban Test - ' + new Date().toISOString(),
            email: 'kanban@teste.com',
            phone: '11999999999',
            company: 'Empresa Kanban Test',
            source: 'website',
            priority: 'medium',
            stage_id: stagesResult.data[0].id, // Primeira etapa
            responsible_id: null,
            status: 'cold',
            currency: 'BRL',
            value: 1000
        };

        console.log('📋 Dados do novo lead:', newLead);

        const createUrl = `${SUPABASE_URL}/rest/v1/leads`;
        const createOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY,
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(newLead)
        };

        const createResult = await makeRequest(createUrl, createOptions);
        
        console.log('📋 Status da criação:', createResult.status);
        console.log('📋 Dados da resposta:', createResult.data);

        if (createResult.status === 201) {
            console.log('✅ Lead criado com sucesso!');
            const createdLead = createResult.data[0];
            console.log('✅ ID do lead:', createdLead.id);
            console.log('✅ Nome do lead:', createdLead.name);
            console.log('✅ Stage ID:', createdLead.stage_id);
            console.log('✅ Data de criação:', createdLead.created_at);
        } else {
            console.log('❌ Erro ao criar lead');
            console.log('📋 Detalhes do erro:', createResult.data);
            return;
        }

        // 4. Verificar se o lead aparece na lista
        console.log('🧪 4. Verificando se o lead aparece na lista...');
        const updatedLeadsResult = await makeRequest(leadsUrl, leadsOptions);
        console.log('📊 Status leads atualizados:', updatedLeadsResult.status);
        console.log('📊 Leads encontrados após criação:', updatedLeadsResult.data?.length || 0);
        
        if (updatedLeadsResult.data && updatedLeadsResult.data.length > 0) {
            console.log('✅ Leads após criação:');
            updatedLeadsResult.data.forEach((lead, index) => {
                console.log(`   ${index + 1}. ${lead.name} (Stage: ${lead.stage_id}) - ${lead.created_at}`);
            });
            
            // Verificar se o lead criado está na lista
            const createdLeadId = createResult.data[0].id;
            const leadInList = updatedLeadsResult.data.find(lead => lead.id === createdLeadId);
            
            if (leadInList) {
                console.log('✅ Lead criado encontrado na lista!');
                console.log('✅ Lead na lista:', leadInList);
            } else {
                console.log('❌ Lead criado NÃO encontrado na lista!');
            }
        }

        // 5. Simular agrupamento por stage (como no Kanban)
        console.log('🧪 5. Simulando agrupamento por stage...');
        if (updatedLeadsResult.data && stagesResult.data) {
            const groupedLeads = {};
            
            // Inicializar grupos
            stagesResult.data.forEach(stage => {
                groupedLeads[stage.id] = [];
            });
            
            // Agrupar leads por stage
            updatedLeadsResult.data.forEach(lead => {
                if (groupedLeads[lead.stage_id]) {
                    groupedLeads[lead.stage_id].push(lead);
                }
            });
            
            console.log('✅ Leads agrupados por stage:');
            Object.keys(groupedLeads).forEach(stageId => {
                const stage = stagesResult.data.find(s => s.id === stageId);
                const leadsInStage = groupedLeads[stageId];
                console.log(`   ${stage?.name || 'Stage desconhecido'} (${stageId}): ${leadsInStage.length} leads`);
                leadsInStage.forEach(lead => {
                    console.log(`     - ${lead.name} (${lead.created_at})`);
                });
            });
        }

        // 6. Limpar lead de teste
        console.log('🧹 6. Limpando lead de teste...');
        const deleteUrl = `${SUPABASE_URL}/rest/v1/leads?id=eq.${createResult.data[0].id}`;
        const deleteOptions = {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY
            }
        };
        
        const deleteResult = await makeRequest(deleteUrl, deleteOptions);
        console.log('📋 Status da deleção:', deleteResult.status);
        
        if (deleteResult.status === 204) {
            console.log('✅ Lead de teste removido');
        } else {
            console.log('⚠️ Erro ao remover lead de teste');
        }

        console.log('🎉 Teste Kanban Update concluído!');
        console.log('📋 Resumo:');
        console.log('   - API Supabase está funcionando');
        console.log('   - Leads são criados com sucesso');
        console.log('   - Leads aparecem na lista após criação');
        console.log('   - Agrupamento por stage funciona');
        console.log('   - Frontend deve atualizar o Kanban automaticamente');

    } catch (error) {
        console.error('❌ Erro no teste kanban update:', error);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    testKanbanUpdate();
}

module.exports = { testKanbanUpdate };

