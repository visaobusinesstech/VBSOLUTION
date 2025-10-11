# 🔧 Corrigir Avatar nos Posts do Feed - Instruções

## ⚠️ Problema Identificado
A foto de perfil salva nas configurações não estava sendo exibida corretamente nos posts do feed. O problema era que o código estava buscando o avatar apenas do `user_metadata`, mas não da tabela `profiles` onde a foto é realmente salva.

## ✅ Correções Implementadas

### 1. **Atualizado usePosts.ts**
- Corrigida a lógica para buscar o avatar_url da tabela profiles
- Adicionado fallback para user_metadata e dados do usuário

### 2. **Atualizado useFeed.ts**
- Modificada a query para incluir dados da tabela profiles
- Atualizada a lógica para priorizar avatar_url da tabela profiles
- Corrigida a criação de novos posts para usar o avatar correto

### 3. **Atualizado Settings.tsx**
- Agora atualiza tanto o user_metadata quanto a tabela profiles
- Garante sincronização completa entre configurações e feed

## 🚀 Como Testar

### 1. **Recarregar a Página**
1. Pare o servidor de desenvolvimento (`Ctrl+C`)
2. Execute `pnpm dev` novamente
3. Acesse `/feed`

### 2. **Verificar Avatar Atual**
1. Verifique se sua foto de perfil aparece corretamente nos posts existentes
2. Se ainda não aparecer, continue para o próximo passo

### 3. **Atualizar Foto de Perfil (se necessário)**
1. Vá para **Configurações** → **Perfil**
2. Faça upload de uma nova foto de perfil
3. Aguarde a mensagem de sucesso
4. Volte para o **Feed**

### 4. **Testar Novo Post**
1. Crie um novo post de texto no feed
2. Verifique se sua foto de perfil aparece corretamente
3. O avatar deve ser o mesmo da topbar

## 🔍 Verificações

### ✅ Funcionando Corretamente
- [ ] Foto de perfil aparece nos posts existentes
- [ ] Foto de perfil aparece em novos posts
- [ ] Avatar no feed é o mesmo da topbar
- [ ] Avatar é o mesmo das configurações

### ❌ Ainda com Problemas
Se ainda houver problemas:

1. **Verificar Console do Navegador**
   - Abra as ferramentas de desenvolvedor (F12)
   - Verifique se há erros no console

2. **Verificar Banco de Dados**
   - Acesse o Supabase
   - Verifique se a tabela `profiles` tem o `avatar_url` correto
   - Verifique se o `user_metadata` tem o `avatar_url`

3. **Limpar Cache**
   - Limpe o cache do navegador
   - Recarregue a página

## 📋 Arquivos Modificados
- `frontend/src/hooks/usePosts.ts` - Lógica de avatar nos posts
- `frontend/src/hooks/useFeed.ts` - Query e lógica do feed
- `frontend/src/pages/Settings.tsx` - Upload de avatar

## 🎯 Resultado Esperado
Após as correções, a foto de perfil salva nas configurações deve aparecer corretamente em todos os posts do feed, mantendo consistência com a topbar.
