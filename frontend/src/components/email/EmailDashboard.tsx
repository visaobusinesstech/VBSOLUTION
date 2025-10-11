import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Mail, 
  Send, 
  CheckCircle, 
  XCircle, 
  Clock, 
  TrendingUp,
  TrendingDown,
  Calendar,
  Users,
  FileText,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';
// Charts serão implementados depois
// import { BarChart, Bar, XAxis, YAxis, etc... } from 'recharts';

interface DashboardStats {
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  totalPending: number;
  totalScheduled: number;
  totalTemplates: number;
  deliveryRate: number;
  failureRate: number;
}

export function EmailDashboard() {
  const { user } = useUserProfile();
  const [stats, setStats] = useState<DashboardStats>({
    totalSent: 0,
    totalDelivered: 0,
    totalFailed: 0,
    totalPending: 0,
    totalScheduled: 0,
    totalTemplates: 0,
    deliveryRate: 0,
    failureRate: 0
  });
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [user?.id]);

  const loadDashboardData = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      // Carregar estatísticas de email_logs
      const { data: emailLogs, error: logsError } = await supabase
        .from('email_logs')
        .select('status, sent_at');

      if (logsError) throw logsError;

      // Carregar emails agendados
      const scheduledResponse = await fetch('/api/email/scheduled', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || 'vb_dev_token_12345'}`,
          'Content-Type': 'application/json',
        },
      });

      let scheduledEmails = [];
      if (scheduledResponse.ok) {
        const scheduledResult = await scheduledResponse.json();
        if (scheduledResult.success && scheduledResult.data) {
          scheduledEmails = scheduledResult.data.filter((email: any) => email.status === 'pending');
        }
      }

      // Carregar templates
      const { data: templates, error: templatesError } = await supabase
        .from('templates')
        .select('id')
        .eq('canal', 'email')
        .eq('status', 'ativo');

      if (templatesError) throw templatesError;

      // Calcular estatísticas
      const total = emailLogs?.length || 0;
      const sent = emailLogs?.filter(log => log.status === 'sent' || log.status === 'delivered').length || 0;
      const delivered = emailLogs?.filter(log => log.status === 'delivered').length || 0;
      const failed = emailLogs?.filter(log => log.status === 'failed').length || 0;
      const pending = emailLogs?.filter(log => log.status === 'pending').length || 0;

      const deliveryRate = total > 0 ? (sent / total) * 100 : 0;
      const failureRate = total > 0 ? (failed / total) * 100 : 0;

      setStats({
        totalSent: sent,
        totalDelivered: delivered,
        totalFailed: failed,
        totalPending: pending,
        totalScheduled: scheduledEmails?.length || 0,
        totalTemplates: templates?.length || 0,
        deliveryRate: Math.round(deliveryRate * 10) / 10,
        failureRate: Math.round(failureRate * 10) / 10
      });

      // Agrupar dados por dia (últimos 7 dias)
      if (emailLogs) {
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (6 - i));
          return date.toISOString().split('T')[0];
        });

        const dailyStats = last7Days.map(date => {
          const dayLogs = emailLogs.filter(log => 
            log.sent_at?.startsWith(date)
          );

          return {
            date: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            enviados: dayLogs.filter(log => log.status === 'sent' || log.status === 'delivered').length,
            falharam: dayLogs.filter(log => log.status === 'failed').length
          };
        });

        setDailyData(dailyStats);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const statusData = [
    { name: 'Enviados', value: stats.totalSent, color: '#10b981' },
    { name: 'Falharam', value: stats.totalFailed, color: '#ef4444' },
    { name: 'Pendentes', value: stats.totalPending, color: '#f59e0b' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Carregando dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Enviados</p>
                <p className="text-3xl font-bold text-green-600">{stats.totalSent}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Taxa: {stats.deliveryRate}%
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Falharam</p>
                <p className="text-3xl font-bold text-red-600">{stats.totalFailed}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Taxa: {stats.failureRate}%
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Agendados</p>
                <p className="text-3xl font-bold text-blue-600">{stats.totalScheduled}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Aguardando envio
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Templates</p>
                <p className="text-3xl font-bold text-purple-600">{stats.totalTemplates}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Templates ativos
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts - Versão Simplificada */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Estatísticas por Dia */}
        <Card>
          <CardHeader>
            <CardTitle>Envios nos Últimos 7 Dias</CardTitle>
            <CardDescription>
              Comparação de emails enviados vs falhados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dailyData.map((day, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">{day.date}</span>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-muted-foreground">{day.enviados} enviados</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-sm text-muted-foreground">{day.falharam} falharam</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Distribuição de Status */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Status</CardTitle>
            <CardDescription>
              Proporção de emails por status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {statusData.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="text-sm font-medium">{item.name}</span>
                    </div>
                    <span className="text-sm font-bold">{item.value}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full transition-all" 
                      style={{ 
                        width: `${(item.value / (stats.totalSent + stats.totalFailed + stats.totalPending)) * 100}%`,
                        backgroundColor: item.color 
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Taxa de Entrega</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-2xl font-bold">{stats.deliveryRate}%</p>
                <div className="flex items-center text-sm text-green-600 mt-1">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Boa performance
                </div>
              </div>
              <div className="h-16 w-16 rounded-full bg-green-50 flex items-center justify-center">
                <Send className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Taxa de Falha</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-2xl font-bold">{stats.failureRate}%</p>
                <div className="flex items-center text-sm text-muted-foreground mt-1">
                  {stats.failureRate > 10 ? (
                    <>
                      <TrendingUp className="h-4 w-4 mr-1 text-red-600" />
                      <span className="text-red-600">Atenção necessária</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="h-4 w-4 mr-1 text-green-600" />
                      <span className="text-green-600">Dentro do esperado</span>
                    </>
                  )}
                </div>
              </div>
              <div className="h-16 w-16 rounded-full bg-gray-50 flex items-center justify-center">
                <XCircle className="h-8 w-8 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Média Diária</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-2xl font-bold">
                  {Math.round(stats.totalSent / 7)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Emails por dia
                </p>
              </div>
              <div className="h-16 w-16 rounded-full bg-blue-50 flex items-center justify-center">
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Botão flutuante para atualizar dashboard */}
      <Button
        onClick={loadDashboardData}
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
        <RefreshCw className="h-6 w-6 text-white" />
      </Button>
    </div>
  );
}
