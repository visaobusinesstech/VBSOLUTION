# Sistema de Importação Excel

## 📋 Visão Geral

Sistema completo de importação de planilhas Excel (até 5GB) que permite aos usuários importar dados em massa para diferentes páginas do sistema através de um botão de upload intuitivo localizado no canto superior direito.

## ✨ Funcionalidades

- **Suporte a múltiplos formatos**: Excel (.xlsx, .xls) e CSV (.csv)
- **Arquivos grandes**: Suporta arquivos de até 5GB
- **Mapeamento automático**: Detecta e mapeia automaticamente colunas com nomes similares
- **Validação de dados**: Valida campos obrigatórios antes da importação
- **Feedback visual**: Barra de progresso e resumo de importação
- **Modelos para download**: Baixe modelos pré-configurados para cada tipo de entidade

## 📦 Entidades Suportadas

### 1. **Atividades** (`/activities`)
Campos suportados:
- Título* (obrigatório)
- Descrição
- Data de Vencimento* (obrigatório)
- Prioridade (low, medium, high, urgent)
- Status (pending, in_progress, completed, cancelled)
- Tipo (task, meeting, call, email, other)
- Responsável (Nome)
- Empresa (Nome)
- Observações
- Horas Estimadas

### 2. **Projetos** (`/projects`)
Campos suportados:
- Nome do Projeto* (obrigatório)
- Descrição* (obrigatório)
- Status (planning, active, on_hold, completed, cancelled)
- Prioridade (low, medium, high, urgent)
- Data de Início
- Data de Término
- Orçamento
- Moeda
- Progresso (%)
- Empresa (Nome)
- Notas

### 3. **Contatos** (`/contacts`)
Campos suportados:
- Nome* (obrigatório)
- Nome Completo
- Telefone* (obrigatório)
- E-mail
- Empresa
- Cargo
- Gênero (male, female, other)
- Status (active, inactive, lead, customer)
- Pipeline
- WhatsApp Ativo (sim/não)
- Endereço
- Cidade
- Estado
- CEP
- Observações

### 4. **Estoque** (`/inventory`)
Campos suportados:
- Nome do Produto* (obrigatório)
- SKU
- Descrição
- Categoria
- Quantidade* (obrigatório)
- Unidade
- Preço de Custo
- Preço de Venda
- Estoque Mínimo
- Estoque Máximo
- Localização
- Fornecedor (Nome)
- Status (active, inactive, discontinued)
- Código de Barras
- Observações

### 5. **Fornecedores** (`/suppliers`)
Campos suportados:
- Nome Fantasia* (obrigatório)
- Razão Social
- CNPJ
- Telefone
- E-mail
- Pessoa de Contato
- Endereço
- Cidade
- Estado
- CEP
- Categoria
- Status (active, inactive)
- Condições de Pagamento
- Observações

### 6. **Empresas** (`/companies`)
Campos suportados:
- Nome Fantasia* (obrigatório)
- Razão Social
- CNPJ
- Telefone
- E-mail
- Website
- Endereço
- Cidade
- Estado
- CEP
- País
- Setor/Indústria
- Tamanho (small, medium, large, enterprise)
- Status (active, inactive, prospect, customer)
- Observações

## 🚀 Como Usar

### Passo 1: Preparar a Planilha

1. Clique no botão de **Upload** (ícone de upload) no canto superior direito da página
2. Clique em **"Baixar Modelo"** para obter uma planilha pré-configurada
3. Preencha a planilha com seus dados
4. Salve o arquivo

**Dicas:**
- Use os nomes de colunas exatamente como aparecem no modelo
- Campos marcados com * são obrigatórios
- Para campos de seleção, use os valores exatos (ex: "low", "medium", "high")
- Para datas, use o formato: AAAA-MM-DD (ex: 2025-01-15)
- Para valores booleanos, use: "sim", "não", "true", "false", 1 ou 0

### Passo 2: Importar a Planilha

1. Clique no botão de **Upload**
2. Selecione ou arraste seu arquivo Excel/CSV
3. Aguarde o processamento do arquivo
4. O sistema mostrará as colunas detectadas

### Passo 3: Mapear as Colunas

1. O sistema tentará mapear automaticamente as colunas
2. Verifique se os mapeamentos estão corretos
3. Ajuste manualmente se necessário
4. Certifique-se de que todos os campos obrigatórios (*) estão mapeados

### Passo 4: Confirmar Importação

1. Clique em **"Importar"**
2. Aguarde o processamento
3. Veja o resumo da importação:
   - Quantos registros foram importados com sucesso
   - Quantos falharam
   - Lista de erros (se houver)

## 🔧 Recursos Técnicos

### Componentes Principais

- **ExcelImportModal**: Modal principal para importação
- **UploadButton**: Botão de upload integrado nas páginas
- **excelImportMappings**: Configurações de mapeamento de campos

### Tecnologias Utilizadas

- **xlsx**: Biblioteca para leitura e escrita de arquivos Excel
- **React**: Framework de interface
- **TypeScript**: Tipagem estática
- **Supabase**: Banco de dados

### Validações Implementadas

- ✅ Tamanho máximo do arquivo (5GB)
- ✅ Formato de arquivo válido
- ✅ Campos obrigatórios preenchidos
- ✅ Tipos de dados corretos
- ✅ Valores de seleção válidos

## 📝 Exemplos de Planilhas

### Exemplo: Atividades

| Título | Descrição | Data de Vencimento | Prioridade | Status | Tipo | Responsável (Nome) |
|--------|-----------|-------------------|-----------|--------|------|--------------------|
| Reunião com cliente | Apresentar proposta | 2025-01-20 | high | pending | meeting | João Silva |
| Enviar relatório | Relatório mensal | 2025-01-15 | medium | in_progress | task | Maria Santos |

### Exemplo: Projetos

| Nome do Projeto | Descrição | Status | Prioridade | Data de Início | Orçamento |
|----------------|-----------|--------|-----------|----------------|-----------|
| Website Novo | Desenvolvimento do site institucional | active | high | 2025-01-01 | 50000 |
| App Mobile | Aplicativo para clientes | planning | medium | 2025-02-01 | 80000 |

### Exemplo: Contatos

| Nome | Telefone | E-mail | Empresa | Status |
|------|----------|--------|---------|--------|
| João Silva | (11) 98765-4321 | joao@empresa.com | Empresa ABC | active |
| Maria Santos | (11) 91234-5678 | maria@empresa2.com | Empresa XYZ | lead |

### Exemplo: Empresas

| Nome Fantasia | Razão Social | CNPJ | Telefone | E-mail | Status | Tamanho |
|--------------|--------------|------|----------|---------|--------|---------|
| TechCorp | TechCorp Tecnologia Ltda | 12.345.678/0001-90 | (11) 3456-7890 | contato@techcorp.com | active | medium |
| InnovaSoft | Innova Software S.A. | 98.765.432/0001-10 | (11) 2345-6789 | vendas@innovasoft.com | customer | large |

## ⚠️ Limitações e Observações

- Arquivos muito grandes (próximos a 5GB) podem levar alguns minutos para processar
- O navegador pode ficar temporariamente lento durante o processamento de arquivos grandes
- Recomenda-se importar em lotes de até 10.000 registros por vez para melhor performance
- Campos de relacionamento (ex: "Responsável", "Empresa") usam busca por nome - certifique-se de que os nomes existam no sistema

## 🐛 Solução de Problemas

### Erro: "Arquivo muito grande"
- **Solução**: Divida seu arquivo em arquivos menores ou remova colunas desnecessárias

### Erro: "Formato inválido"
- **Solução**: Certifique-se de que o arquivo é .xlsx, .xls ou .csv

### Erro: "Campos obrigatórios vazios"
- **Solução**: Verifique se todos os campos marcados com * estão preenchidos em todas as linhas

### Erro: "Nenhum dado válido para importar"
- **Solução**: Verifique se sua planilha tem dados e se os mapeamentos estão corretos

### Dados não aparecem após importação
- **Solução**: Atualize a página (F5) para recarregar os dados do servidor

## 💡 Dicas de Uso

1. **Sempre baixe o modelo**: Isso garante que você tenha as colunas corretas
2. **Teste com poucos registros primeiro**: Importe 5-10 linhas para testar antes de importar milhares
3. **Mantenha backup**: Sempre mantenha uma cópia da planilha original
4. **Use nomes exatos**: Para campos que referenciam outros registros (empresas, responsáveis), use os nomes exatos como aparecem no sistema
5. **Limpe seus dados**: Remova linhas vazias e colunas desnecessárias antes de importar

## 🔄 Atualizações Futuras

Funcionalidades planejadas:
- [ ] Importação de Leads
- [ ] Atualização em massa (além de criação)
- [ ] Importação agendada
- [ ] Validação mais avançada (duplicados, etc.)
- [ ] Histórico de importações
- [ ] Reversão de importações

## 📞 Suporte

Para dúvidas ou problemas com o sistema de importação, entre em contato com a equipe de suporte.

