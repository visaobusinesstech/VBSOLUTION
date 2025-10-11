"use client";
import React, { useState, useEffect } from "react";
import { 
  Mail, 
  Calendar,
  FileText,
  BarChart3,
  Send,
  Clock,
  AlignJustify,
  Plus,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUserProfile } from "@/hooks/useUserProfile";
import { supabase } from "@/integrations/supabase/client";
import { useSidebar } from "@/contexts/SidebarContext";
import { useTheme } from "@/contexts/ThemeContext";

// Componentes das seções
import { SimpleAppointmentsList } from "@/components/email/SimpleAppointmentsList";
import { RealEmailModal } from "@/components/email/RealEmailModal";
import { EmailTemplates } from "@/components/email/EmailTemplates";
import { EmailDetails } from "@/components/email/EmailDetails";
import { EmailDashboard } from "@/components/email/EmailDashboard";

export default function EmailPage() {
  const { user } = useUserProfile();
  const { sidebarExpanded, setSidebarExpanded, showMenuButtons, expandSidebarFromMenu } = useSidebar();
  const { topBarColor } = useTheme();
  const [viewMode, setViewMode] = useState<'scheduling' | 'templates' | 'details' | 'dashboard'>('scheduling');
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<any>(null);

  // View buttons configuration
  const viewButtons = [
    {
      id: 'scheduling',
      label: 'Agendamento',
      icon: Clock,
      active: viewMode === 'scheduling'
    },
    {
      id: 'templates',
      label: 'Templates',
      icon: FileText,
      active: viewMode === 'templates'
    },
    {
      id: 'details',
      label: 'Detalhes dos Envios',
      icon: Send,
      active: viewMode === 'details'
    },
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: BarChart3,
      active: viewMode === 'dashboard'
    }
  ];

  const handleViewModeChange = (mode: 'scheduling' | 'templates' | 'details' | 'dashboard') => {
    setViewMode(mode);
  };

  const handleNewAppointment = () => {
    setEditingAppointment(null);
    setIsAppointmentModalOpen(true);
  };

  const handleEditAppointment = (appointment: any) => {
    setEditingAppointment(appointment);
    setIsAppointmentModalOpen(true);
  };

  const handleAppointmentModalClose = () => {
    setIsAppointmentModalOpen(false);
    setEditingAppointment(null);
  };

  const handleAppointmentSuccess = () => {
    // O AppointmentsList já recarrega automaticamente
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Header fixo responsivo ao sidebar */}
        <div 
          className="fixed top-[38px] right-0 bg-white border-b border-gray-200 z-30 transition-all duration-300"
          style={{
            left: sidebarExpanded ? '240px' : '64px'
          }}
        >
          {/* Botões de visualização */}
          <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
                {/* Botão fixo de toggle da sidebar - SEMPRE VISÍVEL quando colapsada */}
                {!sidebarExpanded && (
            <Button
                    variant="ghost"
              size="sm"
                    className="w-8 h-8 p-0 text-gray-600 hover:bg-gray-100 rounded transition-all duration-200 flex-shrink-0"
                    onClick={expandSidebarFromMenu}
                    title="Expandir barra lateral"
            >
                    <AlignJustify size={14} />
            </Button>
                )}
                
                {viewButtons.map((button) => {
                  const Icon = button.icon;
                  return (
                    <Button
                      key={button.id}
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewModeChange(button.id as any)}
                      className={`
                        h-10 px-4 text-sm font-medium transition-all duration-200 rounded-lg
                        ${button.active 
                          ? 'bg-gray-50 text-slate-900 shadow-inner' 
                          : 'text-slate-700 hover:text-slate-900 hover:bg-gray-25'
                        }
                      `}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {button.label}
                    </Button>
                  );
                })}
                        </div>

              {/* Botão de automação no canto direito */}
              <div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full transition-colors"
                  onClick={() => {
                    // TODO: Abrir modal de automações de email
                    console.log('Automações de email');
                  }}
                  title="Automações"
                >
                  <Zap className="h-4 w-4 text-gray-700" />
                </Button>
              </div>
                  </div>
                </div>
              </div>

        {/* Container principal com padding para o header fixo */}
        <div className="px-6 pt-[90px]" style={{minHeight: 'calc(100vh - 38px)'}}>
          {/* Conteúdo baseado na visualização selecionada */}
          {viewMode === 'scheduling' && (
            <div className="w-full">
              <SimpleAppointmentsList 
                onNewAppointment={handleNewAppointment}
                onEditAppointment={handleEditAppointment}
              />
            </div>
          )}

          {viewMode === 'templates' && (
            <div className="w-full">
              <EmailTemplates />
                </div>
              )}

          {viewMode === 'details' && (
            <div className="w-full">
              <EmailDetails />
            </div>
          )}

          {viewMode === 'dashboard' && (
            <div className="w-full">
              <EmailDashboard />
            </div>
          )}
        </div>
      </div>

      {/* Modal de Email Real */}
      <RealEmailModal
        isOpen={isAppointmentModalOpen}
        onClose={handleAppointmentModalClose}
        appointment={editingAppointment}
        onSuccess={handleAppointmentSuccess}
      />
    </>
  );
}