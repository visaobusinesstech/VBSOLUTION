
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle, Building2 } from 'lucide-react';

const ImportCompaniesTab = () => {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Verificar se é um arquivo Excel ou CSV
      const validTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv',
        '.csv',
        '.xlsx',
        '.xls'
      ];
      
      if (validTypes.some(type => selectedFile.type.includes(type) || selectedFile.name.endsWith(type))) {
        setFile(selectedFile);
      } else {
        toast({
          title: "Arquivo inválido",
          description: "Por favor, selecione um arquivo Excel (.xlsx, .xls) ou CSV (.csv)",
          variant: "destructive",
        });
      }
    }
  };

  const downloadTemplate = () => {
    // Criar um CSV template
    const headers = [
      'fantasy_name',
      'company_name', 
      'cnpj',
      'email',
      'phone',
      'cep',
      'address',
      'city',
      'state',
      'sector',
      'reference',
      'description'
    ];
    
    const csvContent = headers.join(',') + '\n' + 
      'Empresa Exemplo Ltda,Empresa Exemplo Limitada,12.345.678/0001-90,contato@exemplo.com,(11) 99999-9999,01234-567,Rua Exemplo 123,São Paulo,SP,Tecnologia,Cliente Referência,Descrição da empresa';
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'template_empresas.csv';
    link.click();
    
    toast({
      title: "Template baixado",
      description: "Template de empresas baixado com sucesso!",
    });
  };

  const handleImport = async () => {
    if (!file) {
      toast({
        title: "Nenhum arquivo selecionado",
        description: "Por favor, selecione um arquivo para importar",
        variant: "destructive",
      });
      return;
    }

    setImporting(true);
    setProgress(0);

    try {
      // Simular processo de importação
      for (let i = 0; i <= 100; i += 10) {
        setProgress(i);
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      toast({
        title: "Importação concluída",
        description: `Dados de ${file.name} importados com sucesso!`,
      });
      
      setFile(null);
      setProgress(0);
    } catch (error) {
      toast({
        title: "Erro na importação",
        description: "Ocorreu um erro ao importar o arquivo",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Building2 className="h-6 w-6" />
          Importar Empresas
        </h2>
        <p className="text-gray-600 mt-1">
          Importe dados de empresas em lote através de planilhas
        </p>
      </div>

      {/* Instruções */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-blue-600" />
            Como Importar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                1
              </div>
              <div>
                <h4 className="font-medium">Baixe o Template</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Baixe nosso modelo com as colunas corretas
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
              <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                2
              </div>
              <div>
                <h4 className="font-medium">Preencha os Dados</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Complete a planilha com os dados das empresas
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
              <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                3
              </div>
              <div>
                <h4 className="font-medium">Faça o Upload</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Envie o arquivo e confirme a importação
                </p>
              </div>
            </div>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Formatos aceitos:</strong> Excel (.xlsx, .xls) e CSV (.csv).
              Certifique-se de que os dados estão no formato correto para evitar erros.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Download Template */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-green-600" />
            Template de Empresas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="h-8 w-8 text-green-600" />
              <div>
                <h4 className="font-medium">template_empresas.csv</h4>
                <p className="text-sm text-gray-600">
                  Template com todas as colunas necessárias e exemplo
                </p>
              </div>
            </div>
            <Button onClick={downloadTemplate} variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Baixar Template
            </Button>
          </div>
          
          <div className="mt-4 space-y-2">
            <h5 className="font-medium text-sm">Colunas incluídas no template:</h5>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">fantasy_name *</span>
              <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">company_name</span>
              <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">cnpj</span>
              <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">email</span>
              <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">phone</span>
              <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">address</span>
              <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">city</span>
              <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">state</span>
              <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">sector</span>
              <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">description</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">* Campo obrigatório</p>
          </div>
        </CardContent>
      </Card>

      {/* Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-blue-600" />
            Importar Arquivo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file">Selecione o arquivo</Label>
            <Input
              id="file"
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              disabled={importing}
            />
          </div>

          {file && (
            <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-green-800">{file.name}</p>
                <p className="text-sm text-green-600">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
          )}

          {importing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Importando...</span>
                <span className="text-sm">{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          <Button 
            onClick={handleImport} 
            disabled={!file || importing}
            className="w-full"
          >
            {importing ? (
              <>Importando... {progress}%</>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Importar Empresas
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Histórico de Importações */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Importações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium">empresas_janeiro.xlsx</p>
                  <p className="text-sm text-gray-600">25 empresas importadas • 15/01/2024</p>
                </div>
              </div>
              <span className="text-sm text-green-600 font-medium">Sucesso</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="font-medium">novos_clientes.csv</p>
                  <p className="text-sm text-gray-600">12 empresas importadas, 3 com erro • 10/01/2024</p>
                </div>
              </div>
              <span className="text-sm text-yellow-600 font-medium">Parcial</span>
            </div>
          </div>

          {/* Estado vazio */}
          <div className="text-center py-8 text-gray-500 hidden">
            <FileSpreadsheet className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">Nenhuma importação realizada</p>
            <p className="text-sm">Seu histórico aparecerá aqui</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ImportCompaniesTab;
