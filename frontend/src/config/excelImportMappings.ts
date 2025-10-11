import { ImportableEntity } from '@/components/ExcelImportModal';

export interface FieldMapping {
  field: string;
  label: string;
  required?: boolean;
  type?: 'text' | 'number' | 'date' | 'select' | 'boolean';
  options?: string[];
}

export const EXCEL_IMPORT_MAPPINGS: Record<ImportableEntity, FieldMapping[]> = {
  activities: [
    { field: 'title', label: 'Título', required: true, type: 'text' },
    { field: 'description', label: 'Descrição', type: 'text' },
    { field: 'due_date', label: 'Data de Vencimento', required: true, type: 'date' },
    { field: 'priority', label: 'Prioridade', type: 'select', options: ['low', 'medium', 'high', 'urgent'] },
    { field: 'status', label: 'Status', type: 'select', options: ['pending', 'in_progress', 'completed', 'cancelled'] },
    { field: 'type', label: 'Tipo', type: 'select', options: ['task', 'meeting', 'call', 'email', 'other'] },
    { field: 'responsible_name', label: 'Responsável (Nome)', type: 'text' },
    { field: 'company_name', label: 'Empresa (Nome)', type: 'text' },
    { field: 'notes', label: 'Observações', type: 'text' },
    { field: 'estimated_hours', label: 'Horas Estimadas', type: 'number' },
  ],

  projects: [
    { field: 'name', label: 'Nome do Projeto', required: true, type: 'text' },
    { field: 'description', label: 'Descrição', required: true, type: 'text' },
    { field: 'status', label: 'Status', type: 'select', options: ['planning', 'active', 'on_hold', 'completed', 'cancelled'] },
    { field: 'priority', label: 'Prioridade', type: 'select', options: ['low', 'medium', 'high', 'urgent'] },
    { field: 'start_date', label: 'Data de Início', type: 'date' },
    { field: 'due_date', label: 'Data de Término', type: 'date' },
    { field: 'budget', label: 'Orçamento', type: 'number' },
    { field: 'currency', label: 'Moeda', type: 'text' },
    { field: 'progress', label: 'Progresso (%)', type: 'number' },
    { field: 'company_name', label: 'Empresa (Nome)', type: 'text' },
    { field: 'notes', label: 'Notas', type: 'text' },
  ],

  contacts: [
    { field: 'name', label: 'Nome', required: true, type: 'text' },
    { field: 'full_name', label: 'Nome Completo', type: 'text' },
    { field: 'phone', label: 'Telefone', required: true, type: 'text' },
    { field: 'email', label: 'E-mail', type: 'text' },
    { field: 'company', label: 'Empresa', type: 'text' },
    { field: 'position', label: 'Cargo', type: 'text' },
    { field: 'gender', label: 'Gênero', type: 'select', options: ['male', 'female', 'other'] },
    { field: 'status', label: 'Status', type: 'select', options: ['active', 'inactive', 'lead', 'customer'] },
    { field: 'pipeline', label: 'Pipeline', type: 'text' },
    { field: 'whatsapp_opted', label: 'WhatsApp Ativo', type: 'boolean' },
    { field: 'address', label: 'Endereço', type: 'text' },
    { field: 'city', label: 'Cidade', type: 'text' },
    { field: 'state', label: 'Estado', type: 'text' },
    { field: 'zip_code', label: 'CEP', type: 'text' },
    { field: 'notes', label: 'Observações', type: 'text' },
  ],

  leads: [
    { field: 'name', label: 'Nome', required: true, type: 'text' },
    { field: 'email', label: 'E-mail', type: 'text' },
    { field: 'phone', label: 'Telefone', required: true, type: 'text' },
    { field: 'company', label: 'Empresa', type: 'text' },
    { field: 'value', label: 'Valor', type: 'number' },
    { field: 'currency', label: 'Moeda', type: 'text' },
    { field: 'priority', label: 'Prioridade', type: 'select', options: ['low', 'medium', 'high', 'urgent'] },
    { field: 'source', label: 'Origem', type: 'text' },
    { field: 'stage_name', label: 'Etapa (Nome)', type: 'text' },
    { field: 'expected_close_date', label: 'Data Esperada de Fechamento', type: 'date' },
    { field: 'notes', label: 'Observações', type: 'text' },
  ],

  suppliers: [
    { field: 'fantasy_name', label: 'Nome Fantasia', required: true, type: 'text' },
    { field: 'legal_name', label: 'Razão Social', type: 'text' },
    { field: 'cnpj', label: 'CNPJ', type: 'text' },
    { field: 'phone', label: 'Telefone', type: 'text' },
    { field: 'email', label: 'E-mail', type: 'text' },
    { field: 'contact_person', label: 'Pessoa de Contato', type: 'text' },
    { field: 'address', label: 'Endereço', type: 'text' },
    { field: 'city', label: 'Cidade', type: 'text' },
    { field: 'state', label: 'Estado', type: 'text' },
    { field: 'zip_code', label: 'CEP', type: 'text' },
    { field: 'category', label: 'Categoria', type: 'text' },
    { field: 'status', label: 'Status', type: 'select', options: ['active', 'inactive'] },
    { field: 'payment_terms', label: 'Condições de Pagamento', type: 'text' },
    { field: 'notes', label: 'Observações', type: 'text' },
  ],

  inventory: [
    { field: 'name', label: 'Nome do Produto', required: true, type: 'text' },
    { field: 'sku', label: 'SKU', type: 'text' },
    { field: 'description', label: 'Descrição', type: 'text' },
    { field: 'category', label: 'Categoria', type: 'text' },
    { field: 'quantity', label: 'Quantidade', required: true, type: 'number' },
    { field: 'unit', label: 'Unidade', type: 'text' },
    { field: 'cost_price', label: 'Preço de Custo', type: 'number' },
    { field: 'sale_price', label: 'Preço de Venda', type: 'number' },
    { field: 'min_stock', label: 'Estoque Mínimo', type: 'number' },
    { field: 'max_stock', label: 'Estoque Máximo', type: 'number' },
    { field: 'location', label: 'Localização', type: 'text' },
    { field: 'supplier_name', label: 'Fornecedor (Nome)', type: 'text' },
    { field: 'status', label: 'Status', type: 'select', options: ['active', 'inactive', 'discontinued'] },
    { field: 'barcode', label: 'Código de Barras', type: 'text' },
    { field: 'notes', label: 'Observações', type: 'text' },
  ],

  companies: [
    { field: 'fantasy_name', label: 'Nome Fantasia', required: true, type: 'text' },
    { field: 'legal_name', label: 'Razão Social', type: 'text' },
    { field: 'cnpj', label: 'CNPJ', type: 'text' },
    { field: 'phone', label: 'Telefone', type: 'text' },
    { field: 'email', label: 'E-mail', type: 'text' },
    { field: 'website', label: 'Website', type: 'text' },
    { field: 'address', label: 'Endereço', type: 'text' },
    { field: 'city', label: 'Cidade', type: 'text' },
    { field: 'state', label: 'Estado', type: 'text' },
    { field: 'zip_code', label: 'CEP', type: 'text' },
    { field: 'country', label: 'País', type: 'text' },
    { field: 'industry', label: 'Setor/Indústria', type: 'text' },
    { field: 'size', label: 'Tamanho', type: 'select', options: ['small', 'medium', 'large', 'enterprise'] },
    { field: 'status', label: 'Status', type: 'select', options: ['active', 'inactive', 'prospect', 'customer'] },
    { field: 'notes', label: 'Observações', type: 'text' },
  ],
};

