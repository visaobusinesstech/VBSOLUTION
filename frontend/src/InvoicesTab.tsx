
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Search, Send, MessageSquare, Plus, Edit } from 'lucide-react';

export function InvoicesTab() {
  const [selectedClient, setSelectedClient] = useState('');
  const [invoiceMessage, setInvoiceMessage] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [selectedPredefinedMessage, setSelectedPredefinedMessage] = useState('');
  const [isCreatingNewMessage, setIsCreatingNewMessage] = useState(false);
  const [newMessageTitle, setNewMessageTitle] = useState('');
  const [newMessageContent, setNewMessageContent] = useState('');

  const predefinedMessages = [
    { id: 'payment-due', label: 'Cobrança vencimento', message: 'Prezado cliente, sua fatura está próxima do vencimento. Por favor, efetue o pagamento até a data limite para evitar juros e multas.' },
    { id: 'payment-overdue', label: 'Cobrança em atraso', message: 'Prezado cliente, identificamos que sua fatura está em atraso. Solicitamos a regularização do pagamento o mais breve possível.' },
    { id: 'payment-received', label: 'Confirmação de pagamento', message: 'Confirmamos o recebimento do seu pagamento. Agradecemos pela pontualidade e confiança em nossos serviços!' },
    { id: 'invoice-sent', label: 'Fatura enviada', message: 'Sua fatura foi gerada e enviada para o seu e-mail. Verifique os detalhes e prazo de pagamento.' },
    { id: 'payment-reminder', label: 'Lembrete de pagamento', message: 'Este é um lembrete gentil sobre o vencimento da sua fatura. Agradecemos sua atenção.' }
  ];

  const handleSelectPredefinedMessage = (messageId: string) => {
    const message = predefinedMessages.find(m => m.id === messageId);
    if (message) {
      setInvoiceMessage(message.message);
      setSelectedPredefinedMessage(messageId);
    }
  };

  const handleSendInvoice = () => {
    if (!selectedClient || !invoiceMessage.trim()) {
      alert('Por favor, selecione um cliente e adicione uma mensagem.');
      return;
    }
    
    // Future WhatsApp integration
    console.log('Enviando fatura via WhatsApp:', {
      client: selectedClient,
      message: invoiceMessage,
      dateTime: dateTime
    });
    
    alert('Fatura enviada com sucesso! (Integração WhatsApp será implementada em breve)');
  };

  const handleCreateNewMessage = () => {
    if (!newMessageTitle.trim() || !newMessageContent.trim()) {
      alert('Por favor, preencha o título e conteúdo da nova mensagem.');
      return;
    }
    
    console.log('Criando nova mensagem:', {
      title: newMessageTitle,
      content: newMessageContent
    });
    
    setInvoiceMessage(newMessageContent);
    setIsCreatingNewMessage(false);
    setNewMessageTitle('');
    setNewMessageContent('');
    alert('Nova mensagem criada com sucesso!');
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
      <div className="flex items-center gap-4 mb-6">
        <Button className="bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 text-sm">
          NOVA FATURA
        </Button>
      </div>

      <div className="space-y-4">
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
                <SelectItem value="startup-tech">Startup Tech</SelectItem>
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

        {/* Mensagens prontas */}
        <div className="space-y-2">
          <Label className="text-sm text-gray-600">Mensagens prontas</Label>
          <div className="flex items-center gap-2">
            <Select value={selectedPredefinedMessage} onValueChange={handleSelectPredefinedMessage}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar mensagem pronta" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                {predefinedMessages.map((message) => (
                  <SelectItem key={message.id} value={message.id}>
                    {message.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              size="sm" 
              className="px-3 py-2 text-sm"
              onClick={() => setIsCreatingNewMessage(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Criar nova
            </Button>
          </div>
        </div>

        {/* Criação de nova mensagem */}
        {isCreatingNewMessage && (
          <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-gray-700 font-medium">Criar nova mensagem</Label>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setIsCreatingNewMessage(false)}
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs text-gray-600">Título da mensagem</Label>
              <Input
                placeholder="Ex: Cobrança personalizada"
                value={newMessageTitle}
                onChange={(e) => setNewMessageTitle(e.target.value)}
                className="text-sm"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs text-gray-600">Conteúdo da mensagem</Label>
              <Textarea
                placeholder="Escreva aqui o conteúdo da nova mensagem..."
                value={newMessageContent}
                onChange={(e) => setNewMessageContent(e.target.value)}
                className="min-h-[80px] text-sm resize-none"
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                size="sm" 
                className="bg-green-500 hover:bg-green-600 text-white text-xs"
                onClick={handleCreateNewMessage}
              >
                Criar mensagem
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs"
                onClick={() => setIsCreatingNewMessage(false)}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* Mensagem de fatura */}
        <div className="space-y-2">
          <Label className="text-sm text-gray-600">Mensagem de fatura</Label>
          <Textarea
            placeholder="Escreva a mensagem da fatura que será enviada ao cliente..."
            value={invoiceMessage}
            onChange={(e) => setInvoiceMessage(e.target.value)}
            className="min-h-[120px] resize-none"
          />
        </div>

        {/* Botões de ação */}
        <div className="flex items-center gap-3 pt-4">
          <Button 
            onClick={handleSendInvoice}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 text-sm"
            disabled={!selectedClient || !invoiceMessage.trim()}
          >
            <Send className="h-4 w-4 mr-2" />
            ENVIAR FATURA
          </Button>
          <Button variant="outline" className="px-6 py-2 text-sm">
            <MessageSquare className="h-4 w-4 mr-2" />
            VISUALIZAR
          </Button>
        </div>
      </div>

      {/* Preview section */}
      {invoiceMessage && (
        <div className="mt-8 p-4 bg-gray-50 rounded-lg border">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Pré-visualização da mensagem:</h4>
          <p className="text-sm text-gray-600 whitespace-pre-line">{invoiceMessage}</p>
          
          {selectedClient && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                <strong>Cliente:</strong> {selectedClient.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </p>
              {dateTime && (
                <p className="text-xs text-gray-500">
                  <strong>Data e hora:</strong> {new Date(dateTime).toLocaleString('pt-BR')}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
