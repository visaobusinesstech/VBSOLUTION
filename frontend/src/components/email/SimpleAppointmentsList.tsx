import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Mail, 
  User, 
  Calendar, 
  Clock, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Plus,
  Edit,
  Trash2
} from 'lucide-react';

interface SimpleAppointmentsListProps {
  onNewAppointment: () => void;
  onEditAppointment: (appointment: any) => void;
}

export function SimpleAppointmentsList({ onNewAppointment, onEditAppointment }: SimpleAppointmentsListProps) {
  // Dados mock para teste
  const mockAppointments = [
    {
      id: '1',
      subject: 'Demonstração de Serviço',
      recipients: ['leonardosena1010@hotmail.com'],
      scheduled_date: '2025-06-06T00:27:00Z',
      status: 'failed',
      created_at: '2024-12-09T00:27:00Z',
      message: 'Email de demonstração'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'pending':
      default:
        return <Clock className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge variant="default" className="bg-green-100 text-green-800">Enviado</Badge>;
      case 'failed':
        return <Badge variant="destructive">Erro</Badge>;
      case 'pending':
      default:
        return <Badge variant="secondary">Pendente</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-4">
      {mockAppointments.length === 0 ? (
        <Card className="p-8 text-center">
          <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum agendamento encontrado</h3>
          <p className="text-gray-600 mb-4">Crie seu primeiro agendamento usando o botão + no canto inferior direito</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {mockAppointments.map((appointment) => (
            <Card key={appointment.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Cabeçalho do agendamento */}
                    <div className="flex items-center gap-3 mb-3">
                      <Mail className="h-5 w-5 text-blue-600" />
                      <h3 className="text-lg font-semibold text-gray-900">
                        {appointment.subject}
                      </h3>
                      <div className="ml-auto">
                        {getStatusBadge(appointment.status)}
                      </div>
                    </div>

                    {/* Destinatários */}
                    <div className="flex items-center gap-2 mb-3">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        Para: {appointment.recipients.join(', ')}
                      </span>
                    </div>

                    {/* Data e hora agendada */}
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {formatDate(appointment.scheduled_date)}, {formatTime(appointment.scheduled_date)}
                      </span>
                      <span className="text-xs text-gray-500">
                        (agendado)
                      </span>
                    </div>

                    {/* Data de criação */}
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        Criado em {formatDate(appointment.created_at)}
                      </span>
                    </div>

                    {/* Status com ícone */}
                    {appointment.status === 'failed' && (
                      <div className="flex items-center gap-2 mt-3 p-2 bg-red-50 rounded-lg">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <span className="text-sm text-red-700">
                          Erro no envio do email
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditAppointment(appointment)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => console.log('Excluir:', appointment.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Botão flutuante para novo agendamento */}
      <Button
        onClick={onNewAppointment}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg z-50 transition-colors duration-200"
        style={{
          backgroundColor: '#021529',
          borderColor: '#021529'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#001122';
          e.currentTarget.style.borderColor = '#001122';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#021529';
          e.currentTarget.style.borderColor = '#021529';
        }}
      >
        <Plus className="h-6 w-6 text-white" />
      </Button>
    </div>
  );
}


