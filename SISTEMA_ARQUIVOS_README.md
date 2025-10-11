# 📁 Sistema de Arquivos - VB Solution CRM

Sistema completo de gerenciamento de arquivos integrado ao Supabase Storage e Database.

## 🎯 Funcionalidades Implementadas

### ✅ Abas de Navegação
- **Todos**: Visualiza todos os arquivos do usuário logado e arquivos compartilhados
- **Meus documentos**: Filtra apenas arquivos criados pelo usuário (`owner_id = user.id`)
- **Compartilhado**: Exibe arquivos marcados como compartilhados (`shared = true`)
- **Privado**: Mostra arquivos privados do usuário (`private = true`)

### ✅ Listagem de Arquivos
- Exibição em tabela com colunas:
  - Nome do arquivo com ícone por tipo
  - Localização (pasta)
  - Etiquetas (tags)
  - Data de atualização
  - Data de visualização
  - Status de compartilhamento
- Ordenação por nome, data de criação e data de visualização
- Busca por nome de arquivo
- Cards de arquivo com hover e menu de ações

### ✅ Cards Laterais
1. **Recentes**: 5 arquivos mais recentemente visualizados
2. **Favoritos**: Arquivos marcados como favoritos
3. **Criados por mim**: Últimos 5 arquivos criados pelo usuário

### ✅ Modal de Novo Documento
- **Tipos de documento**: Wiki, Documento, Proposta, Página
- **Ações rápidas**:
  - ✅ **Upload de Arquivo**: Seleção e envio de arquivos
  - 🚧 Importar do Link (em desenvolvimento)
  - 🚧 Duplicar Documento (em desenvolvimento)
  - 🚧 Nova Pasta (em desenvolvimento)
- Upload múltiplo de arquivos
- Barra de progresso em tempo real
- Descrição e tags opcionais

### ✅ Integração com Supabase

#### Tabela `files`
```sql
id              UUID (PK)
owner_id        UUID (FK -> auth.users)
name            TEXT
path            TEXT
size            BIGINT
type            TEXT
folder          TEXT
tags            TEXT[]
favorite        BOOLEAN
shared          BOOLEAN
private         BOOLEAN
description     TEXT
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ
viewed_at       TIMESTAMPTZ
```

#### Storage Bucket `files`
- Bucket privado com autenticação
- Limite de 50MB por arquivo
- Estrutura: `{user_id}/{filename}`

#### Políticas RLS (Row Level Security)
- ✅ Usuários veem apenas seus próprios arquivos
- ✅ Usuários veem arquivos compartilhados
- ✅ Apenas donos podem modificar/deletar arquivos

### ✅ Ações nos Arquivos
- **Visualizar**: Preview de imagens, vídeos, áudios e PDFs
- **Baixar**: Download direto do arquivo
- **Favoritar**: Marcar/desmarcar como favorito
- **Compartilhar**: Tornar arquivo público/privado
- **Excluir**: Remover arquivo do storage e banco de dados

### ✅ Preview de Arquivos
Modal de visualização com suporte para:
- 🖼️ Imagens (JPG, PNG, GIF, WebP)
- 🎥 Vídeos (MP4, WebM, etc)
- 🎵 Áudio (MP3, WAV, etc)
- 📄 PDFs (visualização inline)
- Outros: Download direto

## 🚀 Instalação e Configuração

### Passo 1: Criar Tabela e Bucket no Supabase

Execute o script SQL no Supabase:
```bash
# Opção 1: Via arquivo HTML
Abra o arquivo: executar-criar-tabelas-files.html
Clique em "Executar Setup"

# Opção 2: Via SQL Editor do Supabase
Copie e cole o conteúdo de: CREATE_FILES_TABLES.sql
```

### Passo 2: Criar o Bucket de Storage

No painel do Supabase:
1. Acesse **Storage** > **Buckets**
2. Clique em **New Bucket**
3. Nome: `files`
4. Public: `false` (privado)
5. File size limit: `52428800` (50MB)
6. Clique em **Create bucket**

### Passo 3: Configurar Políticas de Storage

Execute no SQL Editor:
```sql
-- Policy para upload
CREATE POLICY "users_upload_own_files" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy para visualizar
CREATE POLICY "users_view_own_files_storage" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy para deletar
CREATE POLICY "users_delete_own_files_storage" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

### Passo 4: Verificar Integração

O sistema está pronto! Acesse `/files` no seu CRM.

## 📦 Arquivos Criados/Modificados

### Scripts SQL
- `CREATE_FILES_TABLES.sql` - Script de criação da tabela e configurações
- `executar-criar-tabelas-files.html` - Interface web para executar o setup

### Types
- `frontend/src/integrations/supabase/types.ts` - Adicionada definição da tabela `files`

### Hooks
- `frontend/src/hooks/useFiles.ts` - Hook para gerenciar arquivos
- `frontend/src/hooks/useFileUpload.ts` - Hook para upload de arquivos

### Componentes
- `frontend/src/components/files/FileCard.tsx` - Card individual de arquivo
- `frontend/src/components/files/FilePreviewModal.tsx` - Modal de visualização
- `frontend/src/components/files/UploadProgress.tsx` - Indicador de progresso
- `frontend/src/components/files/FilesSidebar.tsx` - Sidebar com cards laterais
- `frontend/src/components/files/CreateDocumentModal.tsx` - Modal de criação/upload

### Páginas
- `frontend/src/pages/Files.tsx` - Página principal (reescrita completa)

## 🎨 UI/UX

### Design System
- ✅ TailwindCSS para estilização
- ✅ Shadcn/UI para componentes base
- ✅ Lucide React para ícones
- ✅ Responsivo e fluido
- ✅ Loading states e skeletons
- ✅ Mensagens de feedback (toast)

### Interações
- ✅ Hover effects nos cards
- ✅ Dropdown menu para ações
- ✅ Drag and drop para upload (via modal)
- ✅ Preview inline de arquivos
- ✅ Busca instantânea
- ✅ Ordenação por colunas
- ✅ Floating action button para criar

## 🔧 Tecnologias Utilizadas

- **React** + **TypeScript**
- **Supabase Client** (Database + Storage)
- **TailwindCSS** (Estilização)
- **Shadcn/UI** (Componentes)
- **Lucide React** (Ícones)
- **date-fns** (Formatação de datas)
- **Sonner** (Toast notifications)

## 📊 Estrutura do Banco de Dados

### Índices Criados
```sql
idx_files_owner_id        - Busca por dono
idx_files_folder          - Busca por pasta
idx_files_favorite        - Filtro de favoritos
idx_files_shared          - Filtro de compartilhados
idx_files_private         - Filtro de privados
idx_files_created_at      - Ordenação por data de criação
idx_files_viewed_at       - Ordenação por visualização
```

### Funções Auxiliares
- `update_files_updated_at()` - Atualiza timestamp automaticamente
- `update_file_viewed_at(file_id)` - Atualiza data de visualização
- `get_user_files_stats(user_id)` - Estatísticas de arquivos do usuário

## 🔐 Segurança

### RLS (Row Level Security)
- ✅ Ativado na tabela `files`
- ✅ Usuários veem apenas seus arquivos ou compartilhados
- ✅ Apenas donos podem modificar/deletar

### Storage Security
- ✅ Bucket privado (não público)
- ✅ Políticas de acesso por usuário
- ✅ Validação de tamanho de arquivo (50MB)
- ✅ Path structure: `{user_id}/{filename}` previne conflitos

## 🚦 Estados e Feedback

### Loading States
- ✅ Skeleton na listagem
- ✅ Spinner durante upload
- ✅ Progress bar em tempo real

### Mensagens
- ✅ Success: Upload, favoritar, deletar
- ✅ Error: Falhas de upload, conexão
- ✅ Warning: Arquivo muito grande
- ✅ Info: Funcionalidades em desenvolvimento

## 📱 Responsividade

- ✅ Desktop: Layout com sidebar + conteúdo principal
- ✅ Tablet: Sidebar colapsável
- ✅ Mobile: Stack vertical, sidebar oculta

## 🔄 Próximas Funcionalidades

### Em Desenvolvimento
- 🚧 Importar arquivo de URL
- 🚧 Duplicar documento
- 🚧 Criar pastas
- 🚧 Mover arquivos entre pastas
- 🚧 Compartilhamento com permissões específicas
- 🚧 Versionamento de arquivos
- 🚧 Comentários em arquivos
- 🚧 Preview de mais formatos (DOCX, XLSX, etc)

## 🐛 Troubleshooting

### Erro: "Bucket does not exist"
**Solução**: Crie o bucket `files` no Supabase Storage

### Erro: "Row Level Security policy violation"
**Solução**: Execute os scripts de políticas RLS no SQL Editor

### Arquivos não aparecem
**Solução**: Verifique se o usuário está autenticado e tem permissões

### Upload falha
**Solução**: 
1. Verifique o tamanho do arquivo (máx 50MB)
2. Confirme que o bucket `files` existe
3. Verifique as políticas de storage

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique os logs do console do navegador
2. Confirme as configurações do Supabase
3. Valide as variáveis de ambiente (VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY)

---

**Desenvolvido para VB Solution CRM** 🚀
Sistema de arquivos completo, moderno e integrado!


