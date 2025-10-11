
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, Image } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ImageUploadProps {
  onImageUploaded: (imageUrl: string) => void;
  currentImageUrl?: string;
  onImageRemoved?: () => void;
}

export function ImageUpload({ onImageUploaded, currentImageUrl, onImageRemoved }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const uploadImage = async (file: File) => {
    try {
      setUploading(true);
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Formato de imagem não suportado. Use JPEG, PNG, GIF ou WebP');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('O arquivo deve ter no máximo 5MB');
        return;
      }

      // Create unique filename
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `inventory/${fileName}`;

      console.log('Uploading file:', fileName, 'to path:', filePath);

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('inventory-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        throw error;
      }

      console.log('Upload successful:', data);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('inventory-images')
        .getPublicUrl(filePath);

      console.log('Public URL generated:', publicUrl);

      onImageUploaded(publicUrl);
      toast.success('Imagem carregada com sucesso!');
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Erro ao fazer upload da imagem';
      if (error?.message) {
        if (error.message.includes('row level security')) {
          errorMessage = 'Erro de permissão. Verifique as políticas de segurança.';
        } else if (error.message.includes('bucket')) {
          errorMessage = 'Erro no bucket de armazenamento.';
        } else if (error.message.includes('size')) {
          errorMessage = 'Arquivo muito grande.';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadImage(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      uploadImage(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const removeImage = async () => {
    if (currentImageUrl && onImageRemoved) {
      try {
        // Extract file path from URL for deletion
        const urlParts = currentImageUrl.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const filePath = `inventory/${fileName}`;
        
        // Delete from storage
        const { error } = await supabase.storage
          .from('inventory-images')
          .remove([filePath]);

        if (error) {
          console.error('Error deleting image:', error);
          // Don't show error to user as image removal from UI should still work
        }

        onImageRemoved();
        toast.success('Imagem removida com sucesso!');
      } catch (error) {
        console.error('Error removing image:', error);
        // Still call onImageRemoved to update UI
        onImageRemoved();
      }
    }
  };

  return (
    <div className="space-y-4">
      <Label>Imagem do Produto</Label>
      
      {currentImageUrl ? (
        <div className="relative inline-block">
          <img
            src={currentImageUrl}
            alt="Produto"
            className="w-32 h-32 object-cover rounded-lg border border-gray-200"
            onError={(e) => {
              console.error('Error loading image:', currentImageUrl);
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
            onClick={removeImage}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <Image className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-sm text-gray-600 mb-4">
            Arraste uma imagem aqui ou clique para selecionar
          </p>
          <Input
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleFileSelect}
            className="hidden"
            id="image-upload"
            disabled={uploading}
          />
          <Button
            type="button"
            variant="outline"
            asChild
            disabled={uploading}
          >
            <label htmlFor="image-upload" className="cursor-pointer">
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? 'Carregando...' : 'Selecionar Imagem'}
            </label>
          </Button>
        </div>
      )}
      
      <p className="text-xs text-gray-500">
        Formatos aceitos: JPEG, PNG, GIF, WebP. Tamanho máximo: 5MB
      </p>
    </div>
  );
}
