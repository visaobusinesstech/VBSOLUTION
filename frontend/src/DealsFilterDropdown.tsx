
import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Search } from 'lucide-react';

interface DealsFilterDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DealsFilterDropdown({ isOpen, onClose }: DealsFilterDropdownProps) {
  const [selectedFilter, setSelectedFilter] = useState('Negócios em andamento');
  const [searchTerm, setSearchTerm] = useState('');

  const filterOptions = [
    'Meus negócios',
    'Negócios fechados', 
    'Negócios de teste'
  ].filter(option => option && option.trim() !== '');

  const handleFilterSelect = (filter: string) => {
    setSelectedFilter(filter);
    console.log('Selected filter:', filter);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white p-0 overflow-hidden rounded-lg shadow-lg">
        {/* Header */}
        <div className="bg-white border-b p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Negócios em andamento</h2>
            <Button variant="ghost" onClick={onClose} className="p-1 h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Filter Options */}
        <div className="p-4 space-y-3">
          {filterOptions.map((option) => (
            <button
              key={option}
              onClick={() => handleFilterSelect(option)}
              className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
            >
              {option}
            </button>
          ))}
        </div>

        {/* Search Section */}
        <div className="border-t p-4">
          <div className="space-y-4">
            {/* Nome */}
            <div className="space-y-2">
              <Label className="text-sm text-gray-600">Nome</Label>
              <div className="relative">
                <Input
                  placeholder="Nome"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-8"
                />
                <Button variant="ghost" size="sm" className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 h-6 w-6">
                  <X className="h-4 w-4 text-gray-400" />
                </Button>
              </div>
            </div>

            {/* Pessoa responsável */}
            <div className="space-y-2">
              <Label className="text-sm text-gray-600">Pessoa responsável</Label>
              <Input placeholder="Pessoa responsável" />
            </div>

            {/* Total */}
            <div className="space-y-2">
              <Label className="text-sm text-gray-600">Total</Label>
              <Select defaultValue="valor-exato">
                <SelectTrigger>
                  <SelectValue placeholder="Valor exato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="valor-exato">Valor exato</SelectItem>
                  <SelectItem value="maior-que">Maior que</SelectItem>
                  <SelectItem value="menor-que">Menor que</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Data de término */}
            <div className="space-y-2">
              <Label className="text-sm text-gray-600">Data de término</Label>
              <Select defaultValue="qualquer-data">
                <SelectTrigger>
                  <SelectValue placeholder="Qualquer data" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="qualquer-data">Qualquer data</SelectItem>
                  <SelectItem value="hoje">Hoje</SelectItem>
                  <SelectItem value="esta-semana">Esta semana</SelectItem>
                  <SelectItem value="este-mes">Este mês</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Grupo de fase */}
            <div className="space-y-2">
              <Label className="text-sm text-gray-600">Grupo de fase</Label>
              <Select defaultValue="grupo-etapas">
                <SelectTrigger>
                  <SelectValue placeholder='Grupo de etapas "Negócio em anda..."' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grupo-etapas">Grupo de etapas "Negócio em anda..."</SelectItem>
                  <SelectItem value="outro-grupo">Outro grupo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Adicionar campo / Recuperar campos padrão */}
            <div className="flex items-center justify-between text-sm">
              <button className="text-blue-600 hover:underline">Adicionar campo</button>
              <button className="text-gray-500 hover:underline">Recuperar campos padrão</button>
            </div>

            {/* Salvar filtro */}
            <button className="text-left text-sm text-gray-600 hover:text-gray-800 flex items-center gap-2">
              <span>+</span>
              <span>Salvar filtro</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
          <Button className="bg-blue-500 hover:bg-blue-600 text-white px-6">
            Pesquisar
          </Button>
          <Button variant="outline" onClick={onClose}>
            Redefinir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
