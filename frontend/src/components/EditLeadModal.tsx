import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Edit } from 'lucide-react';
import { Lead, CreateLeadData, useLeads } from '@/hooks/useLeads-fixed';
import { useFunnelStages } from '@/hooks/useFunnelStages';

import { useContacts } from '@/hooks/useContacts';
import { useProducts } from '@/hooks/useProducts';
import { useTheme } from '@/contexts/ThemeContext';
import { toast } from '@/hooks/use-toast';

interface EditLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead;
}

const EditLeadModal: React.FC<EditLeadModalProps> = ({ 
  isOpen, 
  onClose, 
  lead 
}) => {
  const { topBarColor } = useTheme();
  const { updateLead } = useLeads();
  const { stages } = useFunnelStages();
  const { contacts } = useContacts();
  const { products } = useProducts();

  const [formData, setFormData] = useState<Partial<CreateLeadData>>({});
  const [loading, setLoading] = useState(false);

  // Carregar dados do lead
  useEffect(() => {
    if (isOpen && lead) {
      setFormData({
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        position: lead.position,
        source: lead.source,
        priority: lead.priority,
        stage_id: lead.stage_id,
        responsible_id: lead.responsible_id,
        contact_id: lead.contact_id,
        product_id: lead.product_id,
        product_quantity: lead.product_quantity,
        product_price: lead.product_price,
        value: lead.value,
        currency: lead.currency,
        expected_close_date: lead.expected_close_date,
        notes: lead.notes,
        status: lead.status
      });
    }
  }, [isOpen, lead]);

  // Opções de origem do lead
  const leadSources = [
    { value: 'website', label: 'Website' },
    { value: 'whatsapp', label: 'WhatsApp' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'facebook', label: 'Facebook' },
    { value: 'telegram', label: 'Telegram' },
    { value: 'youtube', label: 'YouTube' },
    { value: 'tiktok', label: 'TikTok' },
    { value: 'referral', label: 'Indicação' },
    { value: 'cold_call', label: 'Ligação Fria' },
    { value: 'email', label: 'E-mail' },
    { value: 'event', label: 'Evento' },
    { value: 'other', label: 'Outro' }
  ];

  const priorities = [
    { value: 'low', label: 'Baixa' },
    { value: 'medium', label: 'Média' },
    { value: 'high', label: 'Alta' },
    { value: 'urgent', label: 'Urgente' }
  ];

  const statuses = [
    { value: 'hot', label: 'Quente' },
    { value: 'cold', label: 'Frio' },
    { value: 'won', label: 'Ganho' },
    { value: 'lost', label: 'Perdido' }
  ];

  // Salvar alterações
  const handleSave = async () => {
    try {
      setLoading(true);

      const success = await updateLead(lead.id, formData);
      
      if (success) {
        toast({
          title: "Lead atualizado",
          description: "Lead atualizado com sucesso!",
        });
        onClose();
      } else {
        toast({
          title: "Erro",
          description: "Erro ao atualizar lead. Tente novamente.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar lead. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Editar Lead
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações pessoais */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-4">Informações Pessoais</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={formData.name || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="company">Empresa</Label>
                  <Input
                    id="company"
                    value={formData.company || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                  />
                </div>
              </div>

              <div className="mt-4">
                <Label htmlFor="position">Cargo</Label>
                <Input
                  id="position"
                  value={formData.position || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Configurações do lead */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-4">Configurações</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="source">Origem do Lead</Label>
                  <Select
                    value={formData.source || ''}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, source: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {leadSources.map((source) => (
                        <SelectItem key={source.value} value={source.value}>
                          {source.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="priority">Prioridade</Label>
                  <Select
                    value={formData.priority || ''}
                    onValueChange={(value: any) => setFormData(prev => ({ ...prev, priority: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priorities.map((priority) => (
                        <SelectItem key={priority.value} value={priority.value}>
                          {priority.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <Label htmlFor="stage">Etapa do Funil</Label>
                  <Select
                    value={formData.stage_id || ''}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, stage_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {stages.map((stage) => (
                        <SelectItem key={stage.id} value={stage.id}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: stage.color }}
                            />
                            {stage.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status || ''}
                    onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-4">
                <Label htmlFor="expectedCloseDate">Data Esperada de Fechamento</Label>
                <Input
                  id="expectedCloseDate"
                  type="date"
                  value={formData.expected_close_date || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, expected_close_date: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Produto e valor */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-4">Produto e Valor</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="product">Produto</Label>
                  <Select
                    value={formData.product_id || ''}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, product_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar produto" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} - R$ {product.base_price.toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="value">Valor Total</Label>
                  <Input
                    id="value"
                    type="number"
                    value={formData.value || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
                    step="0.01"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <Label htmlFor="quantity">Quantidade</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={formData.product_quantity || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, product_quantity: parseInt(e.target.value) || 1 }))}
                    min="1"
                  />
                </div>

                <div>
                  <Label htmlFor="price">Preço Unitário</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.product_price || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, product_price: parseFloat(e.target.value) || 0 }))}
                    step="0.01"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Observações */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-4">Observações</h3>
              <Textarea
                value={formData.notes || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Adicione observações sobre o lead..."
                rows={4}
              />
            </CardContent>
          </Card>
        </div>

        {/* Botões de ação */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || !formData.name}
            style={{ backgroundColor: topBarColor, color: 'white' }}
          >
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditLeadModal;

