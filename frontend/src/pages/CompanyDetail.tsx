import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useVB } from '@/contexts/VBContext';
import { 
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  MapPin,
  FileText,
  DollarSign,
  Calendar,
  User,
  Plus,
  Edit
} from 'lucide-react';

const CompanyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state } = useVB();
  const { companies, activities, employees, settings } = state;

  const company = companies.find(c => c.id === id);
  
  if (!company) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Empresa não encontrada</h1>
          <Button onClick={() => navigate('/companies')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Empresas
          </Button>
        </div>
      </div>
    );
  }

  const stageInfo = settings.funnelStages.find(stage => stage.id === company.funnelStage) || 
                   { name: 'Não definido', color: '#gray' };

  const companyActivities = activities.filter(a => a.companyId === company.id);
  const totalProposalValue = company.proposals?.reduce((total, proposal) => total + proposal.totalValue, 0) || 0;

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    return employee?.name || 'Não atribuído';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/companies')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{company.fantasyName}</h1>
            <p className="text-muted-foreground">{company.companyName}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Button>
          <Button className="vb-button-primary">
            <Plus className="mr-2 h-4 w-4" />
            Nova Atividade
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informações principais */}
        <div className="lg:col-span-2 space-y-6">
          {/* Dados da empresa */}
          <Card className="vb-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Informações da Empresa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">E-mail:</span>
                    <span>{company.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Telefone:</span>
                    <span>{company.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">CNPJ:</span>
                    <span>{company.cnpj}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <span className="font-medium">Endereço:</span>
                      <div className="text-muted-foreground">
                        {company.address?.street && <div>{company.address.street}</div>}
                        {company.address?.city && company.address?.state && (
                          <div>{company.address.city}, {company.address.state}</div>
                        )}
                        {company.address?.zipCode && <div>CEP: {company.address.zipCode}</div>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {company.description && (
                <div className="pt-4 border-t">
                  <span className="font-medium text-sm">Descrição:</span>
                  <p className="text-sm text-muted-foreground mt-1">{company.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Atividades */}
          <Card className="vb-card">
            <CardHeader>
              <CardTitle>Histórico de Atividades</CardTitle>
              <CardDescription>
                Últimas interações e atividades relacionadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {companyActivities.length > 0 ? (
                <div className="space-y-4">
                  {companyActivities.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className="p-2 bg-muted rounded-lg">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{activity.title}</h4>
                        <p className="text-sm text-muted-foreground">{activity.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>{activity.date.toLocaleDateString('pt-BR')}</span>
                          <span>{getEmployeeName(activity.responsibleId)}</span>
                          <Badge variant="outline" className="text-xs">
                            {activity.type === 'call' ? 'Ligação' : 
                             activity.type === 'meeting' ? 'Reunião' : 
                             activity.type === 'task' ? 'Tarefa' : 'Outro'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                  {companyActivities.length > 5 && (
                    <Button variant="outline" className="w-full">
                      Ver todas as atividades ({companyActivities.length})
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium mb-2">Nenhuma atividade registrada</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Comece registrando a primeira interação com este cliente
                  </p>
                  <Button className="vb-button-primary">
                    <Plus className="mr-2 h-4 w-4" />
                    Registrar Atividade
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status no funil */}
          <Card className="vb-card">
            <CardHeader>
              <CardTitle className="text-lg">Status no Funil</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <Badge 
                  style={{ 
                    backgroundColor: `${stageInfo.color}20`,
                    color: stageInfo.color,
                    borderColor: stageInfo.color
                  }}
                  className="border text-sm px-3 py-1"
                >
                  {stageInfo.name}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Criado em:</span>
                  <span>{company.createdAt.toLocaleDateString('pt-BR')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Última atualização:</span>
                  <span>{company.updatedAt.toLocaleDateString('pt-BR')}</span>
                </div>
              </div>

              <Button variant="outline" className="w-full">
                Mover para Próxima Etapa
              </Button>
            </CardContent>
          </Card>

          {/* Propostas */}
          <Card className="vb-card">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Propostas</span>
                <Button size="sm" variant="outline">
                  <Plus className="h-3 w-3" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {company.proposals && company.proposals.length > 0 ? (
                <div className="space-y-3">
                  {company.proposals.map((proposal) => (
                    <div key={proposal.id} className="p-3 border rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">Proposta #{proposal.id}</span>
                        <Badge variant={
                          proposal.status === 'won' ? 'default' :
                          proposal.status === 'lost' ? 'destructive' : 'secondary'
                        }>
                          {proposal.status === 'negotiating' ? 'Negociando' :
                           proposal.status === 'won' ? 'Ganha' : 'Perdida'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Valor:</span>
                        <span className="font-medium text-vb-primary">
                          R$ {proposal.totalValue.toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {proposal.createdAt.toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  ))}
                  <div className="pt-2 border-t text-center">
                    <div className="text-sm text-muted-foreground">Valor Total</div>
                    <div className="text-lg font-bold text-vb-primary">
                      R$ {totalProposalValue.toLocaleString('pt-BR')}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <DollarSign className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-3">
                    Nenhuma proposta criada
                  </p>
                  <Button size="sm" className="vb-button-primary">
                    <Plus className="mr-2 h-3 w-3" />
                    Criar Proposta
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Estatísticas rápidas */}
          <Card className="vb-card">
            <CardHeader>
              <CardTitle className="text-lg">Estatísticas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Total de atividades:</span>
                <span className="font-medium">{companyActivities.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Atividades concluídas:</span>
                <span className="font-medium text-green-600">
                  {companyActivities.filter(a => a.status === 'completed').length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Atividades pendentes:</span>
                <span className="font-medium text-yellow-600">
                  {companyActivities.filter(a => a.status === 'pending').length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tempo no funil:</span>
                <span className="font-medium">
                  {Math.floor((Date.now() - company.createdAt.getTime()) / (1000 * 60 * 60 * 24))} dias
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CompanyDetail;
