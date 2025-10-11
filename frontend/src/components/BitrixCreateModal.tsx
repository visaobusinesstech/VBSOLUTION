
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { ProductsModal } from './ProductsModal';
import { BudgetsTab } from './BudgetsTab';
import { InvoicesTab } from './InvoicesTab';
import { ActivitySchedulingPanel } from './ActivitySchedulingPanel';
import { DealFormTab } from './DealFormTab';
import { useDeals } from '@/hooks/useDeals';
import { toast } from '@/hooks/use-toast';

interface BitrixCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductsClick?: () => void;
}

export function BitrixCreateModal({ isOpen, onClose, onProductsClick }: BitrixCreateModalProps) {
  const [activeTab, setActiveTab] = useState('negocio');
  const [activeRightPanel, setActiveRightPanel] = useState<'activity' | 'scheduling'>('activity');
  const [showProductsModal, setShowProductsModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { createDeal } = useDeals();

  const tabs = [
    { id: 'negocio', label: 'Negócio', clickable: true },
    { id: 'produtos', label: 'Produtos', clickable: true },
    { id: 'orcamentos', label: 'Orçamentos' },
    { id: 'faturas', label: 'Faturas' }
  ];

  const handleTabClick = (tabId: string) => {
    if (tabId === 'produtos') {
      setShowProductsModal(true);
    } else {
      setActiveTab(tabId);
    }
  };

  const handleDealSubmit = async (dealData: any) => {
    setIsSubmitting(true);
    try {
      await createDeal(dealData);
      toast({
        title: "Sucesso",
        description: "Negócio criado com sucesso!",
      });
      onClose();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar negócio. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'negocio':
        return (
          <DealFormTab
            onSubmit={handleDealSubmit}
            isSubmitting={isSubmitting}
          />
        );
      case 'produtos':
        return <div className="p-6 text-center text-gray-500">Use o botão Produtos para gerenciar produtos</div>;
      case 'orcamentos':
        return <BudgetsTab />;
      case 'faturas':
        return <InvoicesTab />;
      default:
        return <div className="p-6 text-center text-gray-500">Conteúdo em desenvolvimento</div>;
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden p-0 bg-white">
          {/* Header com tabs principais */}
          <div className="bg-blue-50 border-b">
            <div className="flex items-center justify-between p-4 pb-0">
              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={onClose} className="p-1 h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
                <div className="text-sm text-gray-600">
                  CRIAR NEGÓCIO
                </div>
                <Button variant="ghost" className="text-sm text-blue-600 px-2 py-1 h-auto" onClick={onClose}>
                  cancelar
                </Button>
              </div>
            </div>
            
            <div className="flex items-center gap-6 px-4">
              {tabs.map((tab) => (
                <Button
                  key={tab.id}
                  variant="ghost"
                  className={`px-0 py-3 text-sm border-b-2 rounded-none ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 font-medium'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  } ${tab.clickable ? 'cursor-pointer' : ''}`}
                  onClick={() => handleTabClick(tab.id)}
                >
                  {tab.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Left Panel - Main Content */}
            <div className="flex-1 overflow-y-auto">
              {renderTabContent()}
            </div>

            {/* Right Panel - Activity/Scheduling */}
            <ActivitySchedulingPanel 
              activePanel={activeRightPanel}
              onPanelChange={setActiveRightPanel}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Products Modal */}
      <ProductsModal 
        isOpen={showProductsModal}
        onClose={() => setShowProductsModal(false)}
      />
    </>
  );
}
