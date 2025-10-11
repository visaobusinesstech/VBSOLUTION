# Correções para Erro ao Salvar Template de Email

## Problemas Identificados

### 1. **Erro 400 (Bad Request) no Supabase**
- **Causa**: Violação de constraints da tabela `templates`
- **Sintomas**: 
  - Console mostra "Failed to load resource: the server responded with a status of 400"
  - Erro do Supabase (INSERT): Object
  - Falha ao salvar template

### 2. **Problemas de Validação de Dados**
- Campos obrigatórios não validados adequadamente
- Valores `undefined` ou `null` sendo enviados para campos NOT NULL
- Falta de limpeza dos dados antes do envio

### 3. **Mapeamento Inconsistente de Dados**
- Campos opcionais sendo enviados como `undefined`
- Arrays não sendo validados corretamente
- Falta de valores padrão para campos obrigatórios

## Correções Aplicadas

### 1. **EmailTemplates.tsx**
```typescript
// ✅ VALIDAÇÃO: Verificar campos obrigatórios
if (!formData.nome || formData.nome.trim() === '') {
  console.error('❌ Nome do template é obrigatório');
  toast.error('Nome do template é obrigatório');
  return false;
}

// ✅ CORREÇÃO: Limpar e validar dados antes do envio
const templateData = {
  user_id: user.id,
  owner_id: user.id,
  nome: formData.nome.trim(),
  conteudo: formData.conteudo.trim(),
  canal: formData.canal.trim(),
  assinatura: formData.assinatura?.trim() || null,
  signature_image: formData.signature_image || null,
  status: formData.status || 'ativo',
  attachments: Array.isArray(formData.attachments) ? formData.attachments : [],
  descricao: formData.descricao?.trim() || null,
  template_file_url: formData.template_file_url || null,
  template_file_name: formData.template_file_name || null,
  image_url: formData.image_url || null,
  font_size_px: formData.font_size_px || '16px',
  updated_at: new Date().toISOString()
};
```

### 2. **TemplateForm.tsx**
```typescript
// ✅ VALIDAÇÃO MELHORADA: Verificar campos obrigatórios
if (!formData.nome || formData.nome.trim() === '') {
  toast.error('Nome do template é obrigatório');
  return;
}

// ✅ CORREÇÃO: Garantir que todos os campos tenham valores válidos
const cleanedFormData = {
  ...formData,
  nome: formData.nome.trim(),
  conteudo: formData.conteudo.trim(),
  canal: formData.canal.trim(),
  assinatura: formData.assinatura?.trim() || '',
  status: formData.status || 'ativo',
  attachments: Array.isArray(formData.attachments) ? formData.attachments : [],
  descricao: formData.descricao?.trim() || '',
  font_size_px: formData.font_size_px || '16px'
};
```

## Scripts SQL para Correção do Banco

### 1. **FIX_TEMPLATES_TABLE.sql**
- Verifica e corrige a estrutura da tabela `templates`
- Define valores padrão adequados para campos obrigatórios
- Corrige dados existentes que possam estar inconsistentes
- Testa a inserção de dados

### 2. **FIX_RLS_POLICIES.sql**
- Corrige políticas de Row Level Security (RLS)
- Garante que usuários possam inserir/atualizar seus próprios templates
- Testa as permissões de acesso

## Campos da Tabela Templates

### Campos Obrigatórios (NOT NULL)
- `id`: UUID (gerado automaticamente)
- `user_id`: UUID (referência ao usuário)
- `owner_id`: UUID (referência ao proprietário)
- `nome`: TEXT (nome do template)
- `conteudo`: TEXT (conteúdo do template)
- `canal`: TEXT (canal de comunicação, padrão: 'email')
- `status`: TEXT (status do template, padrão: 'ativo')
- `font_size_px`: TEXT (tamanho da fonte, padrão: '16px')
- `created_at`: TIMESTAMP (data de criação)
- `updated_at`: TIMESTAMP (data de atualização)

### Campos Opcionais (NULL permitido)
- `assinatura`: TEXT
- `signature_image`: TEXT
- `descricao`: TEXT
- `template_file_url`: TEXT
- `template_file_name`: TEXT
- `image_url`: TEXT
- `attachments`: JSONB (padrão: '[]')

## Como Executar as Correções

1. **Execute o script SQL no Supabase:**
   ```sql
   -- Execute FIX_TEMPLATES_TABLE.sql primeiro
   -- Depois execute FIX_RLS_POLICIES.sql
   ```

2. **Reinicie o servidor de desenvolvimento:**
   ```bash
   # Pare o servidor (Ctrl+C)
   # Execute novamente
   pnpm dev
   ```

3. **Teste o salvamento de template:**
   - Acesse a página de email
   - Tente criar um novo template
   - Verifique se não há mais erros no console

## Logs de Debug

O código agora inclui logs detalhados para facilitar o debug:
- ✅ Sucesso nas operações
- ❌ Erros com detalhes
- 🔍 Verificações de autenticação
- 📤 Dados sendo enviados
- 💾 Processo de salvamento

## Verificações Adicionais

Se o problema persistir, verifique:

1. **Permissões do usuário no Supabase**
2. **Configuração do RLS**
3. **Estrutura da tabela templates**
4. **Logs do console do navegador**
5. **Logs do Supabase Dashboard**

## Status das Correções

- ✅ Validação de campos obrigatórios
- ✅ Limpeza e sanitização de dados
- ✅ Mapeamento correto de campos
- ✅ Scripts SQL para correção do banco
- ✅ Logs de debug melhorados
- ✅ Políticas RLS corrigidas


