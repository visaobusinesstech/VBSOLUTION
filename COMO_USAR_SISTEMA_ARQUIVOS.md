# 🚀 Como Usar o Sistema de Arquivos

## 📋 Passo a Passo Rápido

### 1️⃣ Configurar o Supabase (OBRIGATÓRIO)

Antes de usar, você DEVE executar o setup no Supabase:

#### Opção A - Via Interface Web (RECOMENDADO)
1. Abra o arquivo `executar-criar-tabelas-files.html` no navegador
2. Clique em **"Testar Conexão"** para verificar
3. Clique em **"Executar Setup"**
4. Aguarde a conclusão (você verá as estatísticas)

#### Opção B - Via SQL Editor
1. Acesse o painel do Supabase
2. Vá em **SQL Editor**
3. Cole o conteúdo de `CREATE_FILES_TABLES.sql`
4. Execute

#### ⚠️ IMPORTANTE: Criar o Bucket
Após executar o script SQL:
1. Acesse **Storage** no painel do Supabase
2. Clique em **New Bucket**
3. Nome: `files`
4. Public: **NÃO** (deixe privado)
5. File size limit: `52428800` (50MB)
6. **Create bucket**

---

## 🎯 Usando o Sistema

### Acessar a Página de Arquivos
```
http://localhost:5173/files
```

### 📤 Fazer Upload de Arquivos

1. Clique no botão **"+"** no canto inferior direito
2. No modal que abrir, clique em **"Upload de Arquivo"**
3. Selecione um ou mais arquivos do seu computador
4. (Opcional) Adicione uma descrição
5. Clique em **"Enviar Arquivo"**
6. Aguarde o upload completar

### 👀 Visualizar um Arquivo

**Opção 1**: Clique diretamente no arquivo na lista
**Opção 2**: Clique no botão **⋮** > **"Visualizar"**

O arquivo será aberto em um modal com preview (se suportado)

### ⭐ Marcar como Favorito

1. Clique no botão **⋮** ao lado do arquivo
2. Selecione **"Adicionar aos favoritos"**
3. O arquivo aparecerá no card **"Favoritos"** na lateral

### 🔗 Compartilhar um Arquivo

1. Clique no botão **⋮** ao lado do arquivo
2. Selecione **"Compartilhar"**
3. O arquivo será marcado como compartilhado
4. Outros usuários poderão vê-lo na aba **"Compartilhado"**

### 📥 Baixar um Arquivo

1. Clique no botão **⋮** ao lado do arquivo
2. Selecione **"Baixar"**
3. O arquivo será baixado para seu computador

### 🗑️ Excluir um Arquivo

1. Clique no botão **⋮** ao lado do arquivo
2. Selecione **"Excluir"**
3. Confirme a exclusão
4. O arquivo será removido permanentemente

---

## 🔍 Navegação

### Abas Principais

#### 📁 Todos
Mostra TODOS os seus arquivos + arquivos compartilhados por outros

#### 👤 Meus documentos
Mostra APENAS os arquivos que você criou

#### 🔗 Compartilhado
Mostra arquivos que foram marcados como compartilhados

#### 🔒 Privado
Mostra seus arquivos marcados como privados

### Cards Laterais

#### 🕐 Recente
Últimos 5 arquivos que você visualizou

#### ⭐ Favoritos
Arquivos que você marcou como favoritos

#### ✍️ Criados por mim
Seus 5 arquivos mais recentes

---

## 🔎 Buscar Arquivos

1. Digite o nome do arquivo na barra de busca (canto superior direito)
2. A lista será filtrada automaticamente

---

## 📊 Ordenar Arquivos

Clique nos cabeçalhos da tabela para ordenar:
- **Nome**: Ordem alfabética
- **Data de atualização**: Do mais recente ao mais antigo
- **Data de visualização**: Últimos visualizados

Clique novamente para inverter a ordem.

---

## 🎨 Tipos de Arquivo Suportados

### Preview Disponível
- 🖼️ **Imagens**: JPG, PNG, GIF, WebP
- 🎥 **Vídeos**: MP4, WebM, OGG
- 🎵 **Áudio**: MP3, WAV, OGG
- 📄 **PDF**: Visualização inline

### Download Direto
- 📝 Documentos: DOCX, XLSX, PPTX
- 📦 Compactados: ZIP, RAR
- 💻 Código: TXT, JS, TS, etc
- E qualquer outro formato!

---

## ⚙️ Dicas e Truques

### ✅ Upload Rápido
- Você pode selecionar **múltiplos arquivos** de uma vez
- A barra de progresso mostra o status em tempo real
- Máximo de **50MB por arquivo**

### ✅ Organização
- Use **tags** para categorizar arquivos
- Marque arquivos importantes como **favoritos**
- Use a aba **"Privado"** para arquivos sensíveis

### ✅ Busca Eficiente
- A busca funciona apenas no **nome** do arquivo
- Use nomes descritivos ao fazer upload
- Tags ajudam na organização

### ✅ Compartilhamento
- Arquivos compartilhados ficam visíveis para **todos os usuários**
- Use com cuidado!
- Para privacidade, mantenha sem compartilhamento

---

## ❌ O que NÃO fazer

### 🚫 Não tente fazer upload de:
- Arquivos maiores que **50MB** (será rejeitado)
- Arquivos maliciosos ou executáveis

### 🚫 Evite:
- Nomes de arquivo muito longos
- Caracteres especiais no nome
- Upload de informações confidenciais sem marca-las como privadas

---

## 🐛 Problemas Comuns

### "Erro ao carregar arquivos"
**Causa**: Banco de dados não configurado
**Solução**: Execute o script `CREATE_FILES_TABLES.sql`

### "Erro ao fazer upload"
**Causa**: Bucket não existe
**Solução**: Crie o bucket `files` no Supabase Storage

### "Nenhum arquivo aparece"
**Causa**: Você ainda não fez upload de nada
**Solução**: Clique no botão **"+"** para fazer upload

### Arquivo não carrega o preview
**Causa**: Tipo de arquivo não suportado para preview
**Solução**: Use o botão **"Baixar"** para fazer download

---

## 🎯 Fluxo Típico de Uso

```
1. Acessar /files
   ↓
2. Clicar no botão "+"
   ↓
3. Escolher "Upload de Arquivo"
   ↓
4. Selecionar arquivo(s)
   ↓
5. (Opcional) Adicionar descrição
   ↓
6. Clicar em "Enviar Arquivo"
   ↓
7. Aguardar upload completar
   ↓
8. Arquivo aparece na lista!
```

---

## 📞 Precisa de Ajuda?

1. Verifique se executou o setup do Supabase
2. Confirme que o bucket `files` existe
3. Verifique o console do navegador (F12) para erros
4. Teste a conexão com o botão "Testar Conexão" no HTML de setup

---

## 🎉 Pronto!

Agora você está pronto para usar o sistema de arquivos do VB Solution CRM!

**Dica Final**: Mantenha seus arquivos organizados usando tags e favoritos! 🌟


