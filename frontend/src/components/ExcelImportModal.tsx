import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, X, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

export type ImportableEntity = 'activities' | 'projects' | 'contacts' | 'leads' | 'suppliers' | 'inventory' | 'companies';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: ImportableEntity;
  onImport: (data: any[]) => Promise<void>;
  fieldMappings: {
    field: string;
    label: string;
    required?: boolean;
    type?: 'text' | 'number' | 'date' | 'select' | 'boolean';
    options?: string[];
  }[];
}

interface ColumnMapping {
  excelColumn: string;
  systemField: string;
}

export function ExcelImportModal({
  isOpen,
  onClose,
  entityType,
  onImport,
  fieldMappings
}: ExcelImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [excelData, setExcelData] = useState<any[]>([]);
  const [excelColumns, setExcelColumns] = useState<string[]>([]);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [step, setStep] = useState<'upload' | 'mapping' | 'importing' | 'complete'>('upload');
  const [importResults, setImportResults] = useState<{
    success: number;
    failed: number;
    errors: string[];
  }>({ success: 0, failed: 0, errors: [] });

  const entityLabels: Record<ImportableEntity, string> = {
    activities: 'Atividades',
    projects: 'Projetos',
    contacts: 'Contatos',
    leads: 'Leads',
    suppliers: 'Fornecedores',
    inventory: 'Estoque',
    companies: 'Empresas'
  };

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    // Verificar tamanho do arquivo (5GB)
    const maxSize = 5 * 1024 * 1024 * 1024; // 5GB em bytes
    if (selectedFile.size > maxSize) {
      toast.error('Arquivo muito grande', {
        description: 'O arquivo não pode ter mais de 5GB.'
      });
      return;
    }

    // Verificar extensão
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileExtension = selectedFile.name.toLowerCase().slice(selectedFile.name.lastIndexOf('.'));
    if (!validExtensions.includes(fileExtension)) {
      toast.error('Formato inválido', {
        description: 'Por favor, selecione um arquivo Excel (.xlsx, .xls) ou CSV (.csv).'
      });
      return;
    }

    setFile(selectedFile);
    processFile(selectedFile);
  }, []);

  const processFile = async (file: File) => {
    setIsProcessing(true);
    try {
      console.log('📁 Processando arquivo:', file.name, 'Tamanho:', file.size);
      
      const data = await file.arrayBuffer();
      console.log('📊 Dados carregados, tamanho:', data.byteLength);
      
      const workbook = XLSX.read(data, { type: 'array', cellDates: true });
      console.log('📋 Workbook criado, planilhas:', workbook.SheetNames);
      
      // Pegar a primeira planilha
      const worksheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[worksheetName];
      
      if (!worksheet) {
        throw new Error('Não foi possível acessar a planilha');
      }
      
      // Converter para JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '', header: 1 });
      console.log('📝 Dados JSON:', jsonData);
      
      if (jsonData.length <= 1) {
        toast.error('Planilha vazia', {
          description: 'A planilha não contém dados para importar. Verifique se há pelo menos uma linha de dados além do cabeçalho.'
        });
        setIsProcessing(false);
        return;
      }

      // Converter primeira linha em cabeçalhos e resto em dados
      const headers = jsonData[0] as string[];
      const rows = jsonData.slice(1) as any[][];
      
      // Converter para formato de objeto e filtrar linhas vazias
      const objectData = rows
        .filter(row => {
          // Remove linhas completamente vazias ou que só têm valores vazios/exemplo
          return row.some(cell => {
            const value = cell ? cell.toString().trim() : '';
            return value !== '' && value !== 'Exemplo';
          });
        })
        .map(row => {
          const obj: any = {};
          headers.forEach((header, index) => {
            obj[header] = row[index] || '';
          });
          return obj;
        });

      console.log('🔍 Headers:', headers);
      console.log('📊 Dados processados:', objectData);
      console.log(`📊 Linhas válidas encontradas: ${objectData.length} (de ${rows.length} linhas totais)`);

      // Extrair colunas
      const columns = headers;
      
      setExcelData(objectData);
      setExcelColumns(columns);
      
      // Auto-mapear colunas com base em nomes similares
      const autoMappings: ColumnMapping[] = [];
      fieldMappings.forEach(field => {
        // Procurar coluna com nome similar
        const matchingColumn = columns.find(col => 
          col.toLowerCase().includes(field.field.toLowerCase()) ||
          field.label.toLowerCase().includes(col.toLowerCase()) ||
          normalizeString(col) === normalizeString(field.label) ||
          normalizeString(col) === normalizeString(field.field)
        );
        
        if (matchingColumn) {
          autoMappings.push({
            excelColumn: matchingColumn,
            systemField: field.field
          });
        }
      });
      
      console.log('🔗 Auto-mapeamentos:', autoMappings);
      setColumnMappings(autoMappings);
      
      // Se o título está mapeado e há dados válidos, importar automaticamente
      const titleMapped = autoMappings.find(m => m.systemField === 'title' && m.excelColumn);
      let hasValidTitle = false;
      
      console.log('🔍 Verificando mapeamento do título:', titleMapped);
      console.log('📊 Dados para verificar:', objectData);
      
      if (titleMapped && objectData.length <= 20) {
        // Verificar se há pelo menos um título válido
        hasValidTitle = objectData.some(row => {
          const title = row[titleMapped.excelColumn];
          const isValid = title && title.toString().trim() !== '' && title.toString().trim() !== 'Exemplo';
          console.log('🔍 Verificando linha:', row, 'Título:', title, 'Válido:', isValid);
          return isValid;
        });
        console.log('✅ Título válido encontrado:', hasValidTitle);
        
        if (hasValidTitle) {
          // Importação automática para arquivos com título válido
          console.log('🚀 Iniciando importação automática...');
          setStep('importing');
          setImportProgress(0);
          await handleImportData(objectData, autoMappings);
        } else {
          console.log('⚠️ Nenhum título válido encontrado, mostrando mapeamento');
          setStep('mapping');
        }
      } else {
        console.log('⚠️ Título não mapeado ou muitos dados, mostrando mapeamento');
        setStep('mapping');
      }
      
      if (titleMapped && objectData.length <= 20 && hasValidTitle) {
        toast.success('Arquivo carregado!', {
          description: `${objectData.length} linhas encontradas. Importando automaticamente...`
        });
      } else {
        toast.success('Arquivo carregado!', {
          description: `${objectData.length} linhas encontradas. Configure o mapeamento das colunas.`
        });
      }
    } catch (error) {
      console.error('❌ Erro ao processar arquivo:', error);
      let errorMessage = 'Não foi possível ler o arquivo. Verifique se ele está correto.';
      
      if (error instanceof Error) {
        if (error.message.includes('Cannot read')) {
          errorMessage = 'Arquivo corrompido ou formato inválido. Tente salvar novamente como .xlsx ou .csv';
        } else if (error.message.includes('Invalid file')) {
          errorMessage = 'Formato de arquivo não suportado. Use .xlsx, .xls ou .csv';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast.error('Erro ao processar arquivo', {
        description: errorMessage
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const normalizeString = (str: string): string => {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');
  };

  const updateColumnMapping = (systemField: string, excelColumn: string) => {
    setColumnMappings(prev => {
      const existing = prev.find(m => m.systemField === systemField);
      if (existing) {
        return prev.map(m => 
          m.systemField === systemField 
            ? { ...m, excelColumn } 
            : m
        );
      } else {
        return [...prev, { systemField, excelColumn }];
      }
    });
  };

  const validateMappings = (): boolean => {
    // Verificar se todos os campos obrigatórios foram mapeados
    const requiredFields = fieldMappings.filter(f => f.required);
    const missingRequired = requiredFields.filter(field => {
      const mapping = columnMappings.find(m => m.systemField === field.field);
      return !mapping || !mapping.excelColumn || mapping.excelColumn === '';
    });

    if (missingRequired.length > 0) {
      toast.error('Mapeamento incompleto', {
        description: `Os seguintes campos obrigatórios precisam ser mapeados: ${missingRequired.map(f => f.label).join(', ')}`
      });
      return false;
    }

    return true;
  };

  const handleImportData = async (data: any[], mappings: ColumnMapping[]) => {
    const mappedData: any[] = [];
    const errors: string[] = [];

    try {
      // Mapear dados da planilha para o formato esperado
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const mappedRow: any = {};

        // Aplicar mapeamento de colunas
        mappings.forEach(mapping => {
          if (mapping.excelColumn && mapping.excelColumn !== '' && row[mapping.excelColumn] !== undefined) {
            const field = fieldMappings.find(f => f.field === mapping.systemField);
            let value = row[mapping.excelColumn];

            // Converter tipo conforme necessário
            if (field?.type === 'number') {
              value = parseFloat(value) || 0;
            } else if (field?.type === 'date' && value) {
              // Se já for Date, usar diretamente
              if (value instanceof Date) {
                value = value.toISOString();
              } else {
                // Tentar parsear string
                const date = new Date(value);
                value = isNaN(date.getTime()) ? null : date.toISOString();
              }
            } else if (field?.type === 'boolean') {
              value = value === true || value === 'true' || value === 'TRUE' || value === 'sim' || value === 'SIM' || value === 1;
            }

            // Só adicionar se o valor não estiver vazio
            if (value !== undefined && value !== null && value !== '') {
              mappedRow[mapping.systemField] = value;
            }
          }
        });

        // Validar dados obrigatórios
        const missingRequired = fieldMappings
          .filter(f => f.required)
          .filter(f => !mappedRow[f.field] || mappedRow[f.field] === '');

        if (missingRequired.length > 0) {
          errors.push(`Linha ${i + 2}: Campos obrigatórios vazios: ${missingRequired.map(f => f.label).join(', ')}`);
        } else {
          mappedData.push(mappedRow);
        }

        // Atualizar progresso
        setImportProgress(Math.round(((i + 1) / data.length) * 50));
      }

      if (mappedData.length === 0) {
        throw new Error('Nenhum dado válido para importar');
      }

      // Importar dados
      let successCount = 0;
      let failCount = 0;

      try {
        await onImport(mappedData);
        successCount = mappedData.length;
        setImportProgress(100);
      } catch (error: any) {
        failCount = mappedData.length;
        errors.push(`Erro ao importar: ${error.message || 'Erro desconhecido'}`);
      }

      setImportResults({
        success: successCount,
        failed: failCount,
        errors
      });

      setStep('complete');

      if (successCount > 0) {
        toast.success('Importação concluída!', {
          description: `${successCount} ${entityLabels[entityType].toLowerCase()} importados com sucesso.`
        });
      } else {
        toast.error('Falha na importação', {
          description: 'Não foi possível importar os dados. Verifique os erros.'
        });
      }
    } catch (error: any) {
      console.error('Erro ao importar:', error);
      toast.error('Erro na importação', {
        description: error.message || 'Ocorreu um erro inesperado.'
      });
      setStep('mapping');
    }
  };

  const handleImport = async () => {
    if (!validateMappings()) return;

    setStep('importing');
    setImportProgress(0);
    await handleImportData(excelData, columnMappings);
  };

  const handleReset = () => {
    setFile(null);
    setExcelData([]);
    setExcelColumns([]);
    setColumnMappings([]);
    setImportProgress(0);
    setStep('upload');
    setImportResults({ success: 0, failed: 0, errors: [] });
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const downloadTemplate = () => {
    // Criar planilha modelo com os campos do sistema
    const templateData = [
      fieldMappings.reduce((acc, field) => {
        acc[field.label] = field.type === 'number' ? 0 : field.type === 'date' ? '2025-01-01' : field.type === 'boolean' ? 'sim' : 'Exemplo';
        return acc;
      }, {} as any)
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, entityLabels[entityType]);
    XLSX.writeFile(workbook, `modelo_${entityType}.xlsx`);
    
    toast.success('Modelo baixado!', {
      description: 'Use este arquivo como base para sua importação.'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <FileSpreadsheet className="h-6 w-6 text-green-600" />
            Importar {entityLabels[entityType]} - Excel
          </DialogTitle>
          <DialogDescription>
            Importe dados em massa através de planilhas Excel (.xlsx, .xls) ou CSV
          </DialogDescription>
        </DialogHeader>

        {/* Step: Upload */}
        {step === 'upload' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Passo 1: Selecione o arquivo</h3>
              <Button variant="outline" size="sm" onClick={downloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Baixar Modelo
              </Button>
            </div>

            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-green-500 transition-colors cursor-pointer"
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <input
                id="file-input"
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <Upload className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h4 className="text-lg font-medium text-gray-700 mb-2">
                Arraste um arquivo ou clique para selecionar
              </h4>
              <p className="text-sm text-gray-500 mb-4">
                Formatos aceitos: .xlsx, .xls, .csv (até 5GB)
              </p>
              
              {file && (
                <div className="mt-4 p-4 bg-green-50 rounded-lg inline-block">
                  <p className="text-sm font-medium text-green-700">
                    Arquivo selecionado: {file.name}
                  </p>
                  <p className="text-xs text-green-600">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              )}
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Dica:</strong> Baixe o modelo para garantir que sua planilha tenha as colunas corretas.
                O sistema tentará mapear automaticamente as colunas com nomes similares.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Step: Mapping */}
        {step === 'mapping' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-1">Passo 2: Mapeie as colunas</h3>
              <p className="text-sm text-gray-600">
                Associe cada coluna da planilha aos campos do sistema
              </p>
            </div>

            <Alert>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription>
                {excelData.length} linhas detectadas. Configure o mapeamento abaixo.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto p-1">
              {fieldMappings.map(field => (
                <div key={field.field} className="space-y-2">
                  <Label className="flex items-center gap-2">
                    {field.label}
                    {field.required && <span className="text-red-500">*</span>}
                    {field.type && (
                      <span className="text-xs text-gray-500">({field.type})</span>
                    )}
                  </Label>
                  <Select
                    value={columnMappings.find(m => m.systemField === field.field)?.excelColumn || 'none'}
                    onValueChange={(value) => updateColumnMapping(field.field, value === 'none' ? '' : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a coluna da planilha" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Não mapear</SelectItem>
                      {excelColumns.map(col => (
                        <SelectItem key={col} value={col}>
                          {col}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            <div className="flex justify-between pt-4 border-t">
              <Button variant="outline" onClick={handleReset}>
                Voltar
              </Button>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    console.log('🔍 DEBUG - Dados atuais:', excelData);
                    console.log('🔍 DEBUG - Mapeamentos:', columnMappings);
                    console.log('🔍 DEBUG - Field Mappings:', fieldMappings);
                  }}
                  disabled={isProcessing}
                >
                  Debug
                </Button>
                <Button onClick={handleImport} disabled={isProcessing}>
                  Importar {excelData.length} {entityLabels[entityType]}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step: Importing */}
        {step === 'importing' && (
          <div className="space-y-6 py-8">
            <div className="text-center">
              <FileSpreadsheet className="h-16 w-16 mx-auto text-green-600 mb-4 animate-pulse" />
              <h3 className="text-lg font-semibold mb-2">Importando dados...</h3>
              <p className="text-sm text-gray-600">
                Por favor, aguarde enquanto processamos sua planilha
              </p>
            </div>

            <div className="space-y-2">
              <Progress value={importProgress} className="h-2" />
              <p className="text-center text-sm text-gray-600">
                {importProgress}% concluído
              </p>
            </div>
          </div>
        )}

        {/* Step: Complete */}
        {step === 'complete' && (
          <div className="space-y-6">
            <div className="text-center py-6">
              {importResults.success > 0 ? (
                <>
                  <CheckCircle2 className="h-16 w-16 mx-auto text-green-600 mb-4" />
                  <h3 className="text-lg font-semibold text-green-700 mb-2">
                    Importação concluída!
                  </h3>
                </>
              ) : (
                <>
                  <AlertCircle className="h-16 w-16 mx-auto text-red-600 mb-4" />
                  <h3 className="text-lg font-semibold text-red-700 mb-2">
                    Falha na importação
                  </h3>
                </>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-green-700">{importResults.success}</p>
                <p className="text-sm text-green-600">Importados com sucesso</p>
              </div>
              <div className="bg-red-50 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-red-700">{importResults.failed}</p>
                <p className="text-sm text-red-600">Falharam</p>
              </div>
            </div>

            {importResults.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-red-700">Erros encontrados:</h4>
                <div className="max-h-48 overflow-y-auto bg-red-50 rounded-lg p-4 space-y-1">
                  {importResults.errors.map((error, index) => (
                    <p key={index} className="text-sm text-red-600">
                      • {error}
                    </p>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between pt-4 border-t">
              <Button variant="outline" onClick={handleReset}>
                Importar outra planilha
              </Button>
              <Button onClick={handleClose}>
                Concluir
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

