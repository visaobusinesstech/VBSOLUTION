
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Company } from '@/hooks/useCompanies';
import ImprovedCompanyForm from './ImprovedCompanyForm';

interface CompanyEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: Company | null;
  onUpdate: (id: string, data: any) => Promise<void>;
}

export function CompanyEditModal({ isOpen, onClose, company, onUpdate }: CompanyEditModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (formData: any) => {
    if (!company) return;
    
    try {
      setIsSubmitting(true);
      await onUpdate(company.id, formData);
      onClose();
    } catch (error) {
      console.error('Error updating company:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!company) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Editar Empresa</DialogTitle>
        </DialogHeader>
        <ImprovedCompanyForm 
          onSubmit={handleSubmit}
          initialData={company}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
}
