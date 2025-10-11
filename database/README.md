# Migrações do Sistema AI Agent

Este diretório contém todas as migrações necessárias para configurar o sistema AI Agent no Supabase.

## 📁 Arquivos de Migração

### 1. **complete_migration.sql** ⭐ (RECOMENDADO)
- **Arquivo principal** que executa todas as migrações na ordem correta
- **Execute este arquivo** para configurar todo o sistema de uma vez
- Inclui verificação de integridade e mensagens de status

### 2. **Arquivos Individuais** (para migração granular)

#### **supporting_tables_migration.sql**
- Cria tabelas de suporte: `contatos`, `conversas`, `equipes`, `equipe_membros`
- **Deve ser executado primeiro** se usar migração granular

#### **ai_agent_configs_migration.sql**
- Adiciona colunas de API key e modelo selecionado à tabela `ai_agent_configs`
- Inclui validação e métricas de uso

#### **ai_agent_actions.sql**
- Cria tabela principal `ai_agent_actions`
- Inclui RLS, triggers e funções básicas

#### **ai_agent_actions_fixed_migrations.sql**
- Adiciona colunas de configuração avançada à `ai_agent_actions`
- Inclui funções de métricas e histórico

#### **ai_agent_variables.sql**
- Cria tabela `ai_agent_variables` para gerenciar variáveis do sistema
- Inclui variáveis padrão do sistema

## 🚀 Como Executar

### Opção 1: Migração Completa (Recomendada)
```sql
-- Execute no Supabase SQL Editor
\i complete_migration.sql
```

### Opção 2: Migração Granular
```sql
-- 1. Primeiro, criar tabelas de suporte
\i supporting_tables_migration.sql

-- 2. Criar tabela de ações
\i ai_agent_actions.sql

-- 3. Executar migrações das ações
\i ai_agent_actions_fixed_migrations.sql

-- 4. Executar migrações da configuração
\i ai_agent_configs_migration.sql

-- 5. Criar tabela de variáveis
\i ai_agent_variables.sql
```

## 📊 Estrutura Criada

### Tabelas Principais
- **`ai_agent_configs`** - Configurações dos agentes IA
- **`ai_agent_actions`** - Ações/estágios dos agentes
- **`ai_agent_variables`** - Variáveis do sistema

### Tabelas de Suporte
- **`contatos`** - Contatos do sistema
- **`conversas`** - Conversas dos agentes
- **`equipes`** - Equipes para transferência
- **`equipe_membros`** - Membros das equipes

### Views e Funções
- **`v_ai_agent_complete_config`** - View completa com estatísticas
- **`get_complete_ai_agent_config()`** - Função para obter configuração completa
- **`validate_ai_agent_config()`** - Validação de configurações
- **`update_ai_agent_usage_metrics()`** - Atualização de métricas

## 🔧 Configurações Incluídas

### Sistema de Chunking (Redis/BullMQ)
```json
{
  "enabled": true,
  "max_chunk_size": 200,
  "debounce_time": 30000,
  "delay_between_chunks": 1000
}
```

### Variáveis Padrão
- **Dados do Contato**: `data.nome_cliente`, `data.telefone_cliente`, etc.
- **Ações do Sistema**: `action.googleCalendar.email`, etc.
- **Dados do Usuário**: `system.chat.id`, `system.user.id`, etc.

### Tipos de Ação Suportados
- `call_api` - Chamar API externa
- `send_file` - Enviar arquivos
- `google_calendar` - Integração com Google Calendar
- `transfer_human` - Transferir para humano
- `update_contact` - Atualizar contato
- `close_conversation` - Fechar conversa

## 🔒 Segurança (RLS)

Todas as tabelas incluem Row Level Security configurado:
- Usuários só veem seus próprios dados
- Políticas de SELECT, INSERT, UPDATE, DELETE
- Triggers automáticos para timestamps

## 📈 Monitoramento

### Métricas de Performance
- Contagem de execuções
- Taxa de sucesso
- Tempo médio de resposta
- Última execução

### Histórico de Execução
- Log de todas as execuções
- Dados de entrada e saída
- Status de sucesso/erro
- Mensagens de erro

## 🛠️ Troubleshooting

### Erro: "relation does not exist"
- Execute primeiro `supporting_tables_migration.sql`
- Verifique se todas as tabelas foram criadas

### Erro: "permission denied"
- Verifique se o usuário tem permissões de DDL
- Execute como superuser se necessário

### Erro: "duplicate key value"
- Tabela já existe, use `DROP TABLE` se necessário
- Ou use `IF NOT EXISTS` nas migrações

## 📝 Próximos Passos

Após executar as migrações:

1. **Configurar API Keys** no Supabase
2. **Criar usuários** e configurações iniciais
3. **Testar integração** com frontend
4. **Configurar Redis/BullMQ** para chunking
5. **Implementar monitoramento** em tempo real

## 🔗 Integração com Frontend

As migrações criam a estrutura necessária para:
- Hook `useAIAgentConfig` - Configurações do agente
- Hook `useAIAgentActions` - Gerenciamento de ações
- Hook `useAIAgentVariables` - Gerenciamento de variáveis
- Componente `AIAgentVariablesModal` - Interface de variáveis

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique os logs do Supabase
2. Consulte a documentação das funções
3. Teste as queries individualmente
4. Verifique permissões de RLS
