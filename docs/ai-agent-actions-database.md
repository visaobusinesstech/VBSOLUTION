# Tabela ai_agent_actions - Documentação

## Visão Geral

A tabela `ai_agent_actions` é o coração do sistema de Funnel Steps do AI Agent. Ela armazena todas as configurações de estágios/ações que o agente pode executar, organizadas de forma hierárquica e conectadas ao sistema de chunking Redis/BullMQ.

## Estrutura da Tabela

### Campos Principais

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Identificador único da ação |
| `ai_agent_config_id` | UUID | Referência para `ai_agent_configs` |
| `owner_id` | UUID | ID do proprietário (usuário) |
| `name` | VARCHAR(255) | Nome do estágio/ação |
| `condition` | TEXT | Condição para executar o estágio |
| `instruction_prompt` | TEXT | Prompt de instruções para o Agente IA |
| `collect_data` | JSONB | Array de dados que o agente deve coletar |
| `action` | VARCHAR(100) | Tipo de ação a ser executada |
| `action_config` | JSONB | Configurações específicas da ação |
| `final_instructions` | TEXT | Instruções finais para responder ao usuário |
| `follow_up_timeout` | INTEGER | Timeout em minutos para follow-up |
| `follow_up_action` | VARCHAR(100) | Ação após timeout |
| `is_active` | BOOLEAN | Se o estágio está ativo |
| `execution_order` | INTEGER | Ordem de execução dos estágios |

### Campos de Referência

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `contact_id` | UUID | Referência opcional para contato específico |
| `conversation_id` | UUID | Referência opcional para conversa específica |
| `target_team_id` | UUID | Equipe de destino para ações de transferência |
| `target_user_id` | UUID | Usuário de destino para ações de transferência |

### Campos de Configuração

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `integration_config` | JSONB | Configurações de integrações externas |
| `custom_variables` | JSONB | Variáveis customizadas para o estágio |
| `chunking_config` | JSONB | Configurações do sistema de chunking Redis/BullMQ |
| `validation_rules` | JSONB | Regras de validação para os dados coletados |

### Campos de Monitoramento

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `execution_history` | JSONB | Histórico de execuções do estágio |
| `performance_metrics` | JSONB | Métricas de performance do estágio |

## Relacionamentos

### 1. ai_agent_configs
```sql
ai_agent_actions.ai_agent_config_id → ai_agent_configs.id
```
- **Tipo**: One-to-Many
- **Cascata**: DELETE CASCADE
- **Descrição**: Cada ação pertence a uma configuração de agente

### 2. auth.users (owner)
```sql
ai_agent_actions.owner_id → auth.users.id
```
- **Tipo**: Many-to-One
- **Cascata**: DELETE CASCADE
- **Descrição**: Cada ação pertence a um usuário proprietário

### 3. contatos (opcional)
```sql
ai_agent_actions.contact_id → contatos.id
```
- **Tipo**: Many-to-One
- **Cascata**: DELETE CASCADE
- **Descrição**: Ação pode ser específica para um contato

### 4. conversas (opcional)
```sql
ai_agent_actions.conversation_id → conversas.id
```
- **Tipo**: Many-to-One
- **Cascata**: DELETE CASCADE
- **Descrição**: Ação pode ser específica para uma conversa

### 5. equipes (opcional)
```sql
ai_agent_actions.target_team_id → equipes.id
```
- **Tipo**: Many-to-One
- **Cascata**: SET NULL
- **Descrição**: Equipe de destino para transferências

## Tipos de Ações Suportadas

### 1. call_api
- **Descrição**: Chamar uma API externa
- **Configuração**: URL, método, headers, body
- **Exemplo**: Integração com CRM, sistema de pagamento

### 2. send_file
- **Descrição**: Enviar arquivos para o usuário
- **Configuração**: Tipo de arquivo, template, dados
- **Exemplo**: Enviar proposta, contrato, manual

### 3. google_calendar
- **Descrição**: Criar evento no Google Calendar
- **Configuração**: Template de evento, duração, convidados
- **Exemplo**: Agendar reunião, lembrete

### 4. transfer_human
- **Descrição**: Transferir conversa para humano
- **Configuração**: Equipe, usuário, mensagem de transferência
- **Exemplo**: Escalar para suporte, vendedor

### 5. update_contact
- **Descrição**: Atualizar dados do contato
- **Configuração**: Campos a atualizar, validações
- **Exemplo**: Salvar preferências, histórico

### 6. close_conversation
- **Descrição**: Fechar conversa
- **Configuração**: Mensagem de encerramento, resumo
- **Exemplo**: Finalizar atendimento, agradecer

## Sistema de Chunking

### Configuração Padrão
```json
{
  "enabled": true,
  "max_chunk_size": 200,
  "debounce_time": 30000,
  "delay_between_chunks": 1000
}
```

### Integração com Redis/BullMQ
- **Debounce**: Evita processamento excessivo
- **Chunking**: Divide respostas em pedaços de 200 caracteres
- **Delay**: Tempo entre envio de chunks
- **Queue**: Processamento assíncrono via BullMQ

## Variáveis Disponíveis

### Dados do Contato
- `data.nome_cliente` - Nome do cliente
- `data.telefone_cliente` - Telefone do cliente
- `data.email_cliente` - Email do cliente
- `data.cargo_cliente` - Cargo do cliente
- `data.nome_empresa` - Nome da empresa

### Ações do Sistema
- `action.googleCalendar.email` - Email do calendário
- `action.googleCalendar.startDate` - Data de início
- `action.googleCalendar.startTime` - Hora de início

### Dados do Usuário
- `system.chat.id` - ID do chat
- `system.user.id` - ID do usuário
- `system.timestamp` - Timestamp atual

## Funções do Banco de Dados

### 1. get_active_ai_agent_actions(p_agent_config_id)
- **Descrição**: Busca ações ativas de um agente
- **Retorno**: Lista de ações ordenadas por execution_order
- **Uso**: Carregar ações para processamento

### 2. update_ai_agent_action_metrics(p_action_id, p_success, p_response_time)
- **Descrição**: Atualiza métricas de execução
- **Parâmetros**: ID da ação, sucesso, tempo de resposta
- **Uso**: Monitoramento de performance

### 3. log_ai_agent_action_execution(p_action_id, p_contact_id, p_conversation_id, p_input_data, p_output_data, p_success, p_error_message)
- **Descrição**: Registra execução no histórico
- **Parâmetros**: Dados da execução
- **Uso**: Auditoria e debugging

## Segurança (RLS)

### Políticas Implementadas
1. **SELECT**: Usuários veem apenas suas próprias ações
2. **INSERT**: Usuários podem criar apenas suas próprias ações
3. **UPDATE**: Usuários podem atualizar apenas suas próprias ações
4. **DELETE**: Usuários podem deletar apenas suas próprias ações

### Triggers
- **updated_at**: Atualiza automaticamente o timestamp
- **created_by**: Define automaticamente o criador
- **updated_by**: Define automaticamente o atualizador

## Exemplos de Uso

### 1. Criar Ação de Qualificação
```sql
INSERT INTO ai_agent_actions (
  ai_agent_config_id,
  owner_id,
  name,
  condition,
  instruction_prompt,
  collect_data,
  action,
  final_instructions,
  follow_up_timeout,
  is_active,
  execution_order
) VALUES (
  'agent-config-uuid',
  'user-uuid',
  'Identificação e Qualificação Inicial',
  'Início da conversa ou cliente em potencial fazendo contato',
  '# CONTEXTO\n* Você está falando com alguém que está entrando em contato...',
  '["data.nome_cliente", "data.telefone_cliente", "data.email_cliente"]',
  'transfer_human',
  'Agradeça pelo contato, confirme os dados coletados...',
  30,
  true,
  1
);
```

### 2. Buscar Ações Ativas
```sql
SELECT * FROM get_active_ai_agent_actions('agent-config-uuid');
```

### 3. Atualizar Métricas
```sql
SELECT update_ai_agent_action_metrics('action-uuid', true, 1500);
```

## Monitoramento e Métricas

### Métricas Coletadas
- **execution_count**: Número de execuções
- **success_rate**: Taxa de sucesso (0.0 a 1.0)
- **average_response_time**: Tempo médio de resposta (ms)
- **last_executed_at**: Última execução

### Histórico de Execução
- **timestamp**: Quando foi executado
- **contact_id**: Contato envolvido
- **conversation_id**: Conversa envolvida
- **input_data**: Dados de entrada
- **output_data**: Dados de saída
- **success**: Se foi bem-sucedido
- **error_message**: Mensagem de erro (se houver)

## Considerações de Performance

### Índices Criados
- `idx_ai_agent_actions_config_id` - Busca por configuração
- `idx_ai_agent_actions_owner_id` - Busca por proprietário
- `idx_ai_agent_actions_active` - Filtro por status ativo
- `idx_ai_agent_actions_order` - Ordenação por execução
- `idx_ai_agent_actions_contact_id` - Busca por contato
- `idx_ai_agent_actions_conversation_id` - Busca por conversa

### Otimizações
- **JSONB**: Para campos de configuração flexíveis
- **Índices**: Para consultas frequentes
- **RLS**: Para segurança eficiente
- **Triggers**: Para atualizações automáticas

## Integração com Frontend

### Hook useAIAgentActions
- **Carregamento**: `loadActions(filters)`
- **Criação**: `createAction(actionData)`
- **Atualização**: `updateAction(actionData)`
- **Exclusão**: `deleteAction(id)`
- **Toggle**: `toggleAction(id, isActive)`
- **Reordenação**: `reorderActions(actionIds)`
- **Execução**: `executeAction(actionId, inputData)`

### Tipos TypeScript
- **AIAgentAction**: Interface principal
- **CreateAIAgentActionRequest**: Para criação
- **UpdateAIAgentActionRequest**: Para atualização
- **AIAgentActionFilters**: Para filtros
- **AIAgentActionStats**: Para estatísticas

## Próximos Passos

1. **Implementar API endpoints** para CRUD de ações
2. **Criar interface de gerenciamento** no frontend
3. **Integrar com sistema Redis/BullMQ** para processamento
4. **Implementar monitoramento** em tempo real
5. **Adicionar testes** unitários e de integração
6. **Documentar casos de uso** específicos
7. **Otimizar performance** com base no uso real
