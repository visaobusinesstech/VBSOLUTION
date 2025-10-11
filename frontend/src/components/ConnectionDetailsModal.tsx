import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useConnections } from '@/contexts/ConnectionsContext';
import { 
  Cloud, 
  Phone, 
  User, 
  Hash, 
  Calendar,
  Wifi,
  WifiOff,
  X,
  AlertTriangle,
  Trash2,
  Copy,
  Check,
  Smartphone,
  Globe,
  Shield,
  Clock,
  Save,
  Bot,
  Users,
  Settings
} from 'lucide-react';

interface ConnectionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  connection: any;
}

const ConnectionDetailsModal: React.FC<ConnectionDetailsModalProps> = ({
  isOpen,
  onClose,
  connection
}) => {
  const { openDeleteConnectionModal } = useConnections();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [connectionName, setConnectionName] = useState(connection?.name || '');
  const [attendanceType, setAttendanceType] = useState(connection?.attendance_type || 'human');

  if (!connection) return null;

  const handleDelete = () => {
    openDeleteConnectionModal(connection);
  };

  const handleSave = async () => {
    if (!connection?.id) return;
    
    setIsSaving(true);
    try {
      const userId = localStorage.getItem('userId') || '905b926a-785a-4f6d-9c3a-9455729500b3';
      
      // Atualizar nome da conexão
      if (connectionName !== connection.name) {
        const response = await fetch(`/api/connections/${connection.id}/name`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId
          },
          body: JSON.stringify({
            session_name: connectionName
          })
        });
        
        if (!response.ok) {
          throw new Error('Erro ao atualizar nome da conexão');
        }
      }
      
      // Atualizar tipo de atendimento
      if (attendanceType !== connection.attendance_type) {
        const response = await fetch(`/api/connections/${connection.id}/attendance-type`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId
          },
          body: JSON.stringify({
            attendance_type: attendanceType
          })
        });
        
        if (!response.ok) {
          throw new Error('Erro ao atualizar tipo de atendimento');
        }
      }
      
      setIsEditing(false);
      // Atualizar dados locais
      connection.name = connectionName;
      connection.attendance_type = attendanceType;
      
      // Recarregar a página para atualizar os dados
      window.location.reload();
      
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      alert('Erro ao salvar configurações. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setConnectionName(connection?.name || '');
    setAttendanceType(connection?.attendance_type || 'human');
    setIsEditing(false);
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error('Erro ao copiar:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'disconnected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <Wifi className="w-4 h-4" />;
      case 'disconnected':
        return <WifiOff className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  // Deriva o WhatsApp ID a partir das possíveis fontes disponíveis
  const whatsappIdRaw = connection.whatsappId 
    || connection.whatsappInfo?.whatsappId 
    || connection.whatsappInfo?.jid 
    || connection.phoneNumber
    || null;
  
  // Extrair apenas o número (antes dos dois pontos)
  const whatsappIdNumbersOnly = whatsappIdRaw ? 
    whatsappIdRaw.split(':')[0].replace('@s.whatsapp.net', '') : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <img 
                src="https://img.icons8.com/color/48/whatsapp--v1.png" 
                alt="WhatsApp" 
                className="w-6 h-6"
              />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-gray-900">
                Detalhes da Conexão
              </DialogTitle>
              <p className="text-sm text-gray-500 mt-1">
                Informações completas da conexão WhatsApp
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Card - Modern WhatsApp Style */}
          <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 rounded-2xl border border-emerald-200/50 shadow-lg shadow-emerald-500/10">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-400/10 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-teal-400/10 to-transparent rounded-full translate-y-12 -translate-x-12"></div>
            
            <div className="relative p-6">
              <div className="flex items-center justify-between">
                {/* Left Side - Connection Name */}
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg shadow-emerald-500/20 border border-white/50">
                    <img 
                      src="https://img.icons8.com/color/48/whatsapp--v1.png" 
                      alt="WhatsApp" 
                      className="w-6 h-6"
                    />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">{connection.name}</h2>
                    <p className="text-sm text-emerald-700 font-medium">Conexão WhatsApp Ativa</p>
                  </div>
                </div>
                
                {/* Right Side - Status */}
                <div className="text-right">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg shadow-emerald-500/20 border border-white/50">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-semibold text-emerald-700">Conectado</span>
                  </div>
                  <p className="text-xs text-emerald-600 mt-2 font-medium">Status da API</p>
                </div>
              </div>
            </div>
          </div>

          {/* Informações Básicas - Modern Style */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg shadow-gray-500/5 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 px-6 py-4 border-b border-gray-200/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-xl">
                  <User className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Informações Básicas</h3>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* WhatsApp Name - Modern Design */}
              {connection.whatsappInfo?.name && (
                <div className="group">
                  <label className="text-sm font-semibold text-gray-700 mb-3 block">WhatsApp</label>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 relative">
                      <div className="px-4 py-3 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200/60 rounded-xl shadow-sm group-hover:shadow-md transition-all duration-200">
                        <span className="text-amber-800 font-medium text-sm">{connection.whatsappInfo.name}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(connection.whatsappInfo.name, 'whatsappName')}
                      className="p-3 hover:bg-amber-100 rounded-xl transition-colors"
                    >
                      {copiedField === 'whatsappName' ? (
                        <Check className="w-4 h-4 text-amber-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-amber-500" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-amber-600 mt-2 font-medium">Nome do perfil WhatsApp</p>
                </div>
              )}

              {/* WhatsApp ID - Modern Design */}
              {whatsappIdNumbersOnly && (
                <div className="group">
                  <label className="text-sm font-semibold text-gray-700 mb-3 block">WhatsApp ID</label>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 relative">
                      <div className="px-4 py-3 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200/60 rounded-xl shadow-sm group-hover:shadow-md transition-all duration-200">
                        <span className="text-amber-800 font-mono text-sm font-medium">{whatsappIdNumbersOnly}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(whatsappIdNumbersOnly, 'whatsappId')}
                      className="p-3 hover:bg-amber-100 rounded-xl transition-colors"
                    >
                      {copiedField === 'whatsappId' ? (
                        <Check className="w-4 h-4 text-amber-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-amber-500" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-amber-600 mt-2 font-medium">Número do WhatsApp (apenas dígitos)</p>
                </div>
              )}
            </div>
          </div>

          {/* Informações de Conexão - Modern Style */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg shadow-gray-500/5 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 px-6 py-4 border-b border-gray-200/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <Hash className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Informações de Conexão</h3>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Created Date */}
                <div className="group">
                  <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200/60 shadow-sm group-hover:shadow-md transition-all duration-200">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Calendar className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-blue-700">Criado em</p>
                      <p className="text-sm text-blue-900 font-medium">{formatDate(connection.createdAt)}</p>
                    </div>
                  </div>
                </div>
                
                {/* Connection ID */}
                <div className="group">
                  <div className="p-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl border border-gray-200/60 shadow-sm group-hover:shadow-md transition-all duration-200">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <Hash className="w-5 h-5 text-gray-600" />
                      </div>
                      <p className="text-sm font-semibold text-gray-700">ID da Conexão</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 px-3 py-2 bg-white border border-gray-200/60 rounded-lg shadow-sm">
                        <code className="text-xs font-mono text-gray-700 truncate block">{connection.id}</code>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(connection.id, 'connectionId')}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        {copiedField === 'connectionId' ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-500" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Informações Técnicas - Modern Style */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-xl">
                    <Wifi className="w-5 h-5 text-purple-600" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900">Informações Técnicas</h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="group p-4 bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-xl border border-blue-200/60 shadow-sm group-hover:shadow-md transition-all duration-200">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Smartphone className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-blue-700">Dispositivo</p>
                        <p className="text-sm text-blue-900 font-medium">Mobile</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="group p-4 bg-gradient-to-r from-green-50 to-green-100/50 rounded-xl border border-green-200/60 shadow-sm group-hover:shadow-md transition-all duration-200">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Globe className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-green-700">Protocolo</p>
                        <p className="text-sm text-green-900 font-medium">WhatsApp Web</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="group p-4 bg-gradient-to-r from-purple-50 to-purple-100/50 rounded-xl border border-purple-200/60 shadow-sm group-hover:shadow-md transition-all duration-200">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Shield className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-purple-700">Criptografia</p>
                        <p className="text-sm text-purple-900 font-medium">End-to-End</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="group p-4 bg-gradient-to-r from-orange-50 to-orange-100/50 rounded-xl border border-orange-200/60 shadow-sm group-hover:shadow-md transition-all duration-200">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <img 
                          src="https://img.icons8.com/color/48/whatsapp--v1.png" 
                          alt="WhatsApp" 
                          className="w-5 h-5"
                        />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-orange-700">Tipo</p>
                        <p className="text-sm text-orange-900 font-medium">Baileys API</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Configurações - Modern Style */}
          <div className="space-y-6 pt-6 border-t border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-xl">
                <Settings className="w-5 h-5 text-green-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900">Configurações</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nome da Conexão */}
              <div className="space-y-2">
                <Label htmlFor="connection-name" className="text-sm font-medium text-gray-700">
                  Nome da Conexão
                </Label>
                {isEditing ? (
                  <Input
                    id="connection-name"
                    value={connectionName}
                    onChange={(e) => setConnectionName(e.target.value)}
                    placeholder="Digite o nome da conexão"
                    className="rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                ) : (
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-900">{connection.name || 'Sem nome'}</p>
                  </div>
                )}
              </div>
              
              {/* Tipo de Atendimento */}
              <div className="space-y-2">
                <Label htmlFor="attendance-type" className="text-sm font-medium text-gray-700">
                  Tipo de Atendimento
                </Label>
                {isEditing ? (
                  <Select value={attendanceType} onValueChange={setAttendanceType}>
                    <SelectTrigger className="rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                      <SelectValue placeholder="Selecione o tipo de atendimento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="human">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-blue-600" />
                          <span>Atendimento Humano</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="ai">
                        <div className="flex items-center gap-2">
                          <Bot className="w-4 h-4 text-purple-600" />
                          <span>Agente IA</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2">
                      {attendanceType === 'ai' ? (
                        <>
                          <Bot className="w-4 h-4 text-purple-600" />
                          <span className="text-sm text-gray-900">Agente IA</span>
                        </>
                      ) : (
                        <>
                          <Users className="w-4 h-4 text-blue-600" />
                          <span className="text-sm text-gray-900">Atendimento Humano</span>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Descrição do Tipo de Atendimento */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <div className="p-1 bg-blue-100 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-900 mb-1">Como funciona o Tipo de Atendimento?</p>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• <strong>Atendimento Humano:</strong> Novas conversas começam com "Você" - operador manual</li>
                    <li>• <strong>Agente IA:</strong> Novas conversas começam automaticamente com o AI Agent ativado</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Ações - Modern Style */}
          <div className="flex items-center justify-between pt-6">
            <Button
              variant="outline"
              onClick={onClose}
              className="px-8 py-3 rounded-xl border-gray-300 hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Fechar
            </Button>
            
            <div className="flex items-center gap-3">
              {isEditing ? (
                <>
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    className="px-6 py-3 rounded-xl border-gray-300 hover:bg-gray-50 transition-all duration-200"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg shadow-green-500/25 transition-all duration-200"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? 'Salvando...' : 'Salvar'}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={() => setIsEditing(true)}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-500/25 transition-all duration-200"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Editar Configurações
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg shadow-red-500/25 transition-all duration-200"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConnectionDetailsModal;
