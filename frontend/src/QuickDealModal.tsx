
import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Building2, User, Search } from 'lucide-react';

interface QuickDealModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuickDealModal({ isOpen, onClose }: QuickDealModalProps) {
  const [dealName, setDealName] = useState('');
  const [value, setValue] = useState('');
  const [currency, setCurrency] = useState('Brazilian Real');
  const [contact, setContact] = useState('');
  const [company, setCompany] = useState('');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white p-0 overflow-hidden rounded-lg shadow-lg">
        {/* Header */}
        <div className="bg-white border-b p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Negócio rápido</h2>
            <Button variant="ghost" onClick={onClose} className="p-1 h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6 space-y-4">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="deal-name" className="text-sm text-gray-600">Nome</Label>
            <Input
              id="deal-name"
              placeholder="Negócio #"
              value={dealName}
              onChange={(e) => setDealName(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Valor e moeda */}
          <div className="space-y-2">
            <Label className="text-sm text-gray-600">Valor e moeda</Label>
            <div className="flex gap-2">
              <Input
                placeholder="0"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="flex-1"
              />
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Brazilian Real">Brazilian Real</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Cliente */}
          <div className="space-y-3">
            <Label className="text-sm text-gray-600">Cliente</Label>
            
            {/* Contato */}
            <div>
              <Label className="text-xs text-gray-500">Contato</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Nome do contato"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  className="pl-10 pr-8"
                />
                <Button variant="ghost" size="sm" className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 h-6 w-6">
                  <Search className="h-4 w-4 text-gray-400" />
                </Button>
              </div>
            </div>

            <Button variant="ghost" className="text-sm text-gray-600 px-0 h-auto justify-start">
              + Adicionar participante
            </Button>
          </div>

          {/* Empresa */}
          <div className="space-y-2">
            <Label className="text-sm text-gray-600">Empresa</Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Nome da empresa"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="pl-10 pr-8"
              />
              <Button variant="ghost" size="sm" className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 h-6 w-6">
                <Search className="h-4 w-4 text-gray-400" />
              </Button>
            </div>
          </div>

          {/* Selecionar campo */}
          <div className="pt-4 border-t">
            <Button variant="ghost" className="text-sm text-gray-600 px-0">
              Selecionar campo
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex items-center gap-3">
          <Button className="bg-cyan-500 hover:bg-cyan-600 text-white px-6">
            SALVAR
          </Button>
          <Button variant="outline" onClick={onClose}>
            CANCELAR
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
