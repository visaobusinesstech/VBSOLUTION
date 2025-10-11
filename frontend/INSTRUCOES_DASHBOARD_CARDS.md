# 📋 Instruções - Dashboard Cards

## 🚀 Como Configurar

### 1. Execute o SQL no Supabase

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Vá para o seu projeto
3. Clique em **SQL Editor** no menu lateral
4. Execute o código SQL do arquivo `setup_dashboard_cards_manual.sql`

### 2. Verificar se a Tabela foi Criada

Após executar o SQL, verifique se a tabela foi criada:

```sql
SELECT * FROM dashboard_cards LIMIT 5;
```

## ✅ Funcionalidades Implementadas

### 🔧 Modal "Gerenciar Cartões"

- **Adicionar cartões**: Clique em "Adicionar" para novos blocos
- **Remover cartões**: Clique em "Remover" para ocultar blocos
- **Reativar cartões**: Clique em "Reativar" para cartões inativos
- **Visualizar todos**: Lista completa com status (Ativo/Inativo)

### 📊 Blocos Especiais

#### Comentários Atribuídos
- **Dados reais** da página Feed
- Mostra posts com comentários de outros usuários
- Prioridade baseada no tempo (alta/média/baixa)

#### Prioridades (LineUp)
- **Dados reais** dos projetos próximos do prazo
- Projetos que vencem nos próximos 7 dias
- Projetos atrasados aparecem primeiro

### 💾 Persistência

- ✅ Configurações salvas no Supabase
- ✅ Persiste após F5 (refresh)
- ✅ Isolado por usuário (`owner.id`)
- ✅ Drag-and-drop salva automaticamente

## 🎯 Como Usar

1. **Adicionar cartão**: 
   - Clique em "Gerenciar cartões"
   - Clique em "Adicionar" no cartão desejado

2. **Remover cartão**:
   - Opção 1: Botão "Remover" no modal
   - Opção 2: Menu de 3 pontos no cartão (dashboard)

3. **Reativar cartão**:
   - No modal, clique em "Reativar" para cartões inativos

4. **Reordenar**:
   - Arraste e solte os cartões no dashboard

## 🔍 Solução de Problemas

### Cartão não aparece no dashboard
- Verifique se está marcado como "Ativo" no modal
- Recarregue a página (F5)
- Verifique se a tabela foi criada corretamente

### Erro ao salvar
- Verifique conexão com Supabase
- Confirme se o usuário está logado
- Verifique logs do console do navegador

## 📁 Arquivos Modificados

- `frontend/src/hooks/useDashboardCards.ts` - Hook para gerenciar cartões
- `frontend/src/pages/Index.tsx` - Página principal atualizada
- `frontend/setup_dashboard_cards_manual.sql` - SQL para executar no Supabase

## 🎨 Interface

- **Verde**: Cartão ativo/adicionado
- **Vermelho**: Botão de remover
- **Azul**: Botão de adicionar
- **Cinza**: Cartão inativo

---

✨ **Pronto para usar!** Os cartões agora são totalmente personalizáveis e persistem na conta do usuário.
