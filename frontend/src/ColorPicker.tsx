import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function ColorPicker({ label, value, onChange, className }: ColorPickerProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor={`color-${label.toLowerCase()}`}>{label}</Label>
      <div className="flex items-center gap-3">
        <Input
          id={`color-${label.toLowerCase()}`}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-16 h-10 p-1 border rounded-lg cursor-pointer"
        />
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="flex-1"
        />
        <div 
          className="w-10 h-10 rounded-lg border-2 border-gray-200"
          style={{ backgroundColor: value }}
        />
      </div>
    </div>
  );
}
