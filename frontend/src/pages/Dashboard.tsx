import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useVB } from '@/contexts/VBContext';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import ModernDashboard from '@/components/dashboard/ModernDashboard';

import { 
  Clock,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Star
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, LineChart, Line, CartesianGrid, XAxis, YAxis } from 'recharts';

const Dashboard = () => {
  const { state } = useVB();
  const { companies, employees, activities, settings, currentUser } = state;
  const { getProfile } = useAuth();
  const navigate = useNavigate();
  const [userFirstName, setUserFirstName] = useState('');
  
  // Buscar o perfil do usuário do Supabase quando o componente montar
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { profile, error } = await getProfile();
        
        if (profile && profile.name) {
          // Extrair o primeiro nome
          const firstName = profile.name.split(' ')[0];
          setUserFirstName(firstName);
        } else if (error) {
          console.warn('⚠️ Dashboard: Erro ao buscar perfil:', error);
          // Fallback para o nome do currentUser se disponível
          if (currentUser?.name) {
            const firstName = currentUser.name.split(' ')[0];
            setUserFirstName(firstName);
          }
        }
      } catch (error) {
        console.error('❌ Dashboard: Erro ao buscar perfil do usuário:', error);
        // Fallback para o nome do currentUser se disponível
        if (currentUser?.name) {
          const firstName = currentUser.name.split(' ')[0];
          setUserFirstName(firstName);
        }
      }
    };

    fetchUserProfile();
  }, []); // Array vazio = executa apenas uma vez
  


  // Métricas calculadas
  const overdueActivities = activities.filter(a => new Date(a.date) < new Date() && a.status !== 'completed').length;
  const pendingActivities = activities.filter(a => a.status === 'pending').length;
  const inProgressActivities = activities.filter(a => a.status === 'in-progress').length;
  const completedActivities = activities.filter(a => a.status === 'completed').length;

  // Debug temporário para verificar atividades
  console.log('🔍 Dashboard - Atividades:', {
    total: activities.length,
    pending: pendingActivities,
    inProgress: inProgressActivities,
    completed: completedActivities,
    overdue: overdueActivities,
    statuses: activities.map(a => ({ id: a.id, title: a.title, status: a.status }))
  });

  // Dados para gráficos
  const companiesByStage = settings.funnelStages.map(stage => ({
    name: stage.name,
    value: companies.filter(c => c.funnelStage === stage.id).length,
    color: '#6b7280' // Cor neutra para todos
  }));

  // Dados para o gráfico de linha "Horas Totais"
  const totalHoursData = [
    { month: 'Jan', hours: 240 },
    { month: 'Feb', hours: 320 },
    { month: 'Mar', hours: 280 },
    { month: 'Apr', hours: 380 },
    { month: 'Mai', hours: 420 },
    { month: 'Jun', hours: 360 },
  ];

  // Ranking da equipe
  const teamRanking = [
    { name: 'Ana Silva', role: 'Desenvolvedora Senior', hours: 180, tasks: 24, efficiency: 95 },
    { name: 'Carlos Santos', role: 'Product Manager', hours: 165, tasks: 21, efficiency: 92 },
    { name: 'Maria Costa', role: 'Designer UX/UI', hours: 170, tasks: 18, efficiency: 88 },
    { name: 'João Oliveira', role: 'Desenvolvedor Full Stack', hours: 155, tasks: 15, efficiency: 85 },
    { name: 'Paula Lima', role: 'QA Engineer', hours: 140, tasks: 12, efficiency: 82 },
  ];

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    return employee?.name || 'Funcionário não encontrado';
  };

  // Função para obter saudação baseada na hora do dia
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom Dia';
    if (hour < 18) return 'Boa Tarde';
    return 'Boa Noite';
  };



  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Principal */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-1">{getGreeting()}, {userFirstName || 'Usuário'}</h1>
            <p className="text-sm text-gray-600">Aqui está um resumo do seu negócio hoje</p>
          </div>
        </div>
      </div>

      {/* Dashboard Moderno */}
      <ModernDashboard />
    </div>
  );
};

export default Dashboard;

