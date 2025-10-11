
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Upload, Search } from 'lucide-react';

export function BudgetsTab() {
  const [selectedProduct, setSelectedProduct] = useState('');
  const [value, setValue] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [comment, setComment] = useState('');
  const [observation, setObservation] = useState('');

  const handleCreateBudget = () => {
    console.log('Criando orçamento:', {
      product: selectedProduct,
      value,
      client: selectedClient,
      dateTime,
      comment,
      observation
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log('Arquivo selecionado:', file.name);
    }
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
      <div className="flex items-center gap-4 mb-6">
        <Button 
          className="bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 text-sm"
          onClick={handleCreateBudget}
        >
          CRIAR ORÇAMENTO
        </Button>
      </div>

      <div className="space-y-4">
        {/* Produto */}
        <div className="space-y-2">
          <Label className="text-sm text-gray-600">Produto</Label>
          <div className="relative">
            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar produto" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                <SelectItem value="consultoria">Consultoria Estratégica</SelectItem>
                <SelectItem value="sistema">Sistema ERP Completo</SelectItem>
                <SelectItem value="desenvolvimento">Desenvolvimento Web</SelectItem>
                <SelectItem value="suporte">Suporte Técnico</SelectItem>
                <SelectItem value="outro">Outro produto</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" size="sm" className="absolute right-8 top-1/2 transform -translate-y-1/2 p-1 h-6 w-6">
              <Search className="h-4 w-4 text-gray-400" />
            </Button>
          </div>
        </div>

        {/* Valor */}
        <div className="space-y-2">
          <Label className="text-sm text-gray-600">Valor</Label>
          <div className="flex items-center">
            <Input
              placeholder="0,00"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="flex-1"
              type="number"
              min="0"
              step="0.01"
            />
            <span className="text-sm text-gray-500 ml-2">R$</span>
          </div>
        </div>

        {/* Cliente */}
        <div className="space-y-2">
          <Label className="text-sm text-gray-600">Cliente</Label>
          <div className="relative">
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar cliente" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                <SelectItem value="tech-solutions">Tech Solutions Ltda</SelectItem>
                <SelectItem value="marketing-pro">Marketing Pro</SelectItem>
                <SelectItem value="consultoria-plus">Consultoria Plus</SelectItem>
                <SelectItem value="inovacao-digital">Inovação Digital</SelectItem>
                <SelectItem value="outro">Outro cliente</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" size="sm" className="absolute right-8 top-1/2 transform -translate-y-1/2 p-1 h-6 w-6">
              <Search className="h-4 w-4 text-gray-400" />
            </Button>
          </div>
        </div>

        {/* Data e hora */}
        <div className="space-y-2">
          <Label className="text-sm text-gray-600">Data e hora</Label>
          <div className="relative">
            <Input
              type="datetime-local"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              className="pr-8"
            />
            <Button variant="ghost" size="sm" className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 h-6 w-6">
              <Calendar className="h-4 w-4 text-gray-400" />
            </Button>
          </div>
        </div>

        {/* Comentário */}
        <div className="space-y-2">
          <Label className="text-sm text-gray-600">Comentário</Label>
          <Textarea
            placeholder="Adicione um comentário sobre o orçamento..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="min-h-[80px] resize-none"
          />
        </div>

        {/* Observação */}
        <div className="space-y-2">
          <Label className="text-sm text-gray-600">Observação</Label>
          <Textarea
            placeholder="Observações importantes..."
            value={observation}
            onChange={(e) => setObservation(e.target.value)}
            className="min-h-[80px] resize-none"
          />
        </div>

        {/* Arquivo */}
        <div className="space-y-2">
          <Label className="text-sm text-gray-600">Arquivo</Label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
            <Upload className="h-6 w-6 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-500 mb-2">Clique para fazer upload ou arraste o arquivo aqui</p>
            <input 
              type="file" 
              className="hidden" 
              id="file-upload"
              onChange={handleFileUpload}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
            />
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs"
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              Escolher arquivo
            </Button>
          </div>
        </div>
      </div>

      {/* Summary section */}
      <div className="mt-8 space-y-2 text-right border-t pt-4">
        <div className="text-lg font-bold text-gray-900">
          <span>Valor total do orçamento:</span>
          <span className="ml-4 text-green-600">R$ {value || '0,00'}</span>
        </div>
        <div className="text-sm text-gray-500">
          Cliente: {selectedClient ? selectedClient.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Não selecionado'}
        </div>
      </div>
    </div>
  );
}
