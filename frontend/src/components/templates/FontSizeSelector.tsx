import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface FontSizeSelectorProps {
  value: string;
  onChange: (fontSize: string) => void;
}

export function FontSizeSelector({ value, onChange }: FontSizeSelectorProps) {
  const fontSizes = [
    { value: '12px', label: '12px (Pequeno)' },
    { value: '14px', label: '14px (Normal pequeno)' },
    { value: '16px', label: '16px (Normal)' },
    { value: '18px', label: '18px (Grande)' },
    { value: '20px', label: '20px (Muito grande)' },
    { value: '24px', label: '24px (Extra grande)' }
  ];

  return (
    <div className="space-y-2">
      <Label htmlFor="font-size">Tamanho da Fonte</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Selecione o tamanho da fonte" />
        </SelectTrigger>
        <SelectContent>
          {fontSizes.map((size) => (
            <SelectItem key={size.value} value={size.value}>
              {size.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        Este tamanho será aplicado ao conteúdo do template
      </p>
    </div>
  );
}
