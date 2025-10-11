'use client';

import React, { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import { X, Plus, Save, Play, Target, RotateCcw, Redo, Copy, Trash2, Settings, Calendar, Clock, Filter, CheckCircle, Circle, ChevronLeft, ChevronRight, SkipBack, SkipForward, Pause, CheckCircle2, AlertCircle, XCircle, Activity, Monitor, Move, ZoomIn, ZoomOut, RotateCcw as RotateLeft, RotateCw as RotateRight, Maximize2, Minimize2, Zap, AlertTriangle, Check, FileText, Instagram, Facebook, Mail, MessageSquare, FileText as Docs, Clock as Cal, Globe, Database, Code, Users, Terminal, Building, GitBranch as Branch, Table as Sheets } from 'lucide-react';
import { Step, StepKind, CatalogItem, WorkflowTrigger, WorkflowExecution } from '@/types/workflow';
import { WORKFLOW_CATALOG, CATALOG_BY_GROUP } from '@/data/workflow-catalog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ReactFlowProvider, 
  ReactFlow, 
  Background, 
  Controls, 
  MiniMap,
  Handle,
  Position
} from 'reactflow';
import 'reactflow/dist/style.css';

// -------- Tipos auxiliares ----------
const makeId = () => Math.random().toString(36).slice(2, 10);

// -------- Node Types para ReactFlow Personalizado --------
const CustomNode = ({ data, selected }: { data: any; selected: boolean }) => {
  const { label, icon: IconComponent, iconColor } = data;
  
  // Determine subtitle based on label
  const getNodeSubtitle = (label: string) => {
    if (label.includes('Trigger')) return 'Starter';
    if (label.includes('Instagram')) return 'Instagram API';
    if (label.includes('Facebook')) return 'Facebook API';
    if (label.includes('Google')) return 'Google API';
    if (label.includes('WhatsApp')) return 'WhatsApp';
    if (label.includes('Email')) return 'Email';
    return 'Action Node';
  };

  // Determine if it's a trigger node
  const isTrigger = label.includes('Trigger') || label.includes('trigger');
  
  return (
    <div 
      className={`
        bg-white border-2 rounded-xl p-4 min-w-[200px] max-w-[240px] 
        shadow-lg hover:shadow-xl transition-all duration-300 relative
        ${selected ? 'ring-2 ring-blue-400 ring-offset-2' : ''}
      `} 
      style={{ 
        borderColor: isTrigger ? '#86efac' : iconColor, // Light green border for trigger
        borderWidth: '2px',
        boxShadow: `0 8px 20px ${isTrigger ? '#86efac40' : `${iconColor}30`}` 
      }}
    >
      {/* ReactFlow Connection Handles - Only for triggers and action nodes */}
      <Handle 
        type="target" 
        position={Position.Top}
        className="w-3 h-3 bg-white border-2 border-gray-300 rounded-full shadow-sm hover:border-green-500 hover:bg-green-50 transition-all duration-200"
        id="input"
      />
      <Handle 
        type="source" 
        position={Position.Bottom}
        className="w-3 h-3 bg-white border-2 border-gray-300 rounded-full shadow-sm hover:border-green-500 hover:bg-green-50 transition-all duration-200"
        id="output"
      />
      
      <div className="flex items-center gap-3">
        {IconComponent && (
          <div 
            className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-md
              ${isTrigger ? 'bg-green-100' : ''}
            `}
            style={{ backgroundColor: isTrigger ? '#4ade80' : iconColor }}
          >
            {/* Special thunder icon for trigger */}
            {isTrigger ? (
              <Zap className="w-5 h-5 text-white drop-shadow-sm" />
            ) : (
              <IconComponent className="w-5 h-5 text-white drop-shadow-sm" />
            )}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-gray-900 text-sm leading-tight mb-0.5">
            {label}
          </div>
          <div className="text-xs text-gray-500 font-medium opacity-90">
            {getNodeSubtitle(label)}
          </div>
        </div>
      </div>
    </div>
  );
};

// -------- Catálogo de Nós ----------
const NODE_CATALOG = {
  'instagram': [
    {
      id: 'instagram-create-container',
      name: 'Instagram - Criar Container',
      icon: Instagram,
      description: 'POST /{ig-user-id}/media → create container (image_url|video_url, caption)',
      color: 'bg-pink-500'
    },
    {
      id: 'instagram-publish',
      name: 'Instagram - Publicar',
      icon: Instagram,
      description: 'POST /{ig-user-id}/media_publish → publish (creation_id)',
      color: 'bg-pink-500'
    },
    {
      id: 'instagram-get-user',
      name: 'Instagram - Obter Usuário',
      icon: Instagram,
      description: 'GET /{ig-user-id}?fields=username,followers_count,media_count',
      color: 'bg-pink-500'
    },
    {
      id: 'instagram-get-media',
      name: 'Instagram - Obter Mídia',
      icon: Instagram,
      description: 'GET /{ig-user-id}/media?fields=id,caption,media_type,media_url,permalink,timestamp',
      color: 'bg-pink-500'
    },
    {
      id: 'instagram-create-comment',
      name: 'Instagram - Comentar',
      icon: Instagram,
      description: 'POST /{ig-media-id}/comments (message)',
      color: 'bg-pink-500'
    },
    {
      id: 'instagram-get-insights',
      name: 'Instagram - Obter Insights',
      icon: Instagram,
      description: 'GET /{ig-media-id}/insights?metric=impressions,reach,engagement',
      color: 'bg-pink-500'
    }
  ],
  'facebook': [
    {
      id: 'facebook-post-to-page',
      name: 'Facebook - Postar na Página',
      icon: Facebook,
      description: 'POST /{page-id}/feed (message, link)',
      color: 'bg-blue-600'
    },
    {
      id: 'facebook-get-posts',
      name: 'Facebook - Obter Posts',
      icon: Facebook,
      description: 'GET /{page-id}/posts',
      color: 'bg-blue-600'
    },
    {
      id: 'facebook-create-comment',
      name: 'Facebook - Comentar',
      icon: Facebook,
      description: 'POST /{post-id}/comments (message)',
      color: 'bg-blue-600'
    },
    {
      id: 'facebook-get-insights',
      name: 'Facebook - Obter Insights',
      icon: Facebook,
      description: 'GET /{page-id}/insights (various metrics)',
      color: 'bg-blue-600'
    }
  ],
  'google': [
    {
      id: 'google-calendar-get-events',
      name: 'Google Calendar - Obter Eventos',
      icon: Cal,
      description: 'GET /calendar/v3/calendars/{id}/events',
      color: 'bg-blue-500'
    },
    {
      id: 'google-calendar-create-event',
      name: 'Google Calendar - Criar Evento',
      icon: Cal,
      description: 'POST /calendar/v3/calendars/{id}/events',
      color: 'bg-blue-500'
    },
    {
      id: 'google-calendar-update-event',
      name: 'Google Calendar - Atualizar Evento',
      icon: Cal,
      description: 'PATCH/DELETE /calendar/v3/calendars/{id}/events/{eventId}',
      color: 'bg-blue-500'
    },
    {
      id: 'gmail-send',
      name: 'Gmail - Enviar Email',
      icon: Mail,
      description: 'POST /gmail/v1/users/me/messages/send',
      color: 'bg-red-500'
    },
    {
      id: 'gmail-get-messages',
      name: 'Gmail - Obter Mensagens',
      icon: Mail,
      description: 'GET /gmail/v1/users/me/messages / .../threads',
      color: 'bg-red-500'
    },
    {
      id: 'gmail-get-message-details',
      name: 'Gmail - Detalhes da Mensagem',
      icon: Mail,
      description: 'GET /gmail/v1/users/me/messages/{id}',
      color: 'bg-red-500'
    },
    {
      id: 'google-sheets-get-values',
      name: 'Google Sheets - Obter Valores',
      icon: Sheets,
      description: 'GET /v4/spreadsheets/{id}/values/{range}',
      color: 'bg-green-500'
    },
    {
      id: 'google-sheets-append',
      name: 'Google Sheets - Adicionar Valores',
      icon: Sheets,
      description: 'POST /v4/spreadsheets/{id}/values/{range}:append',
      color: 'bg-green-500'
    },
    {
      id: 'google-sheets-update',
      name: 'Google Sheets - Atualizar Valores',
      icon: Sheets,
      description: 'PUT /v4/spreadsheets/{id}/values/{range}',
      color: 'bg-green-500'
    },
    {
      id: 'google-docs-get',
      name: 'Google Docs - Obter Documento',
      icon: Docs,
      description: 'GET /v1/documents/{documentId}',
      color: 'bg-blue-400'
    },
    {
      id: 'google-docs-update',
      name: 'Google Docs - Atualizar',
      icon: Docs,
      description: 'POST /v1/documents/{documentId}:batchUpdate',
      color: 'bg-blue-400'
    }
  ],
  'whatsapp': [
    {
      id: 'whatsapp-send-message',
      name: 'WhatsApp - Enviar Mensagem',
      icon: MessageSquare,
      description: 'sock.sendMessage(jid, { text })',
      color: 'bg-green-500'
    },
    {
      id: 'whatsapp-listen-messages',
      name: 'WhatsApp - Escutar Mensagens',
      icon: MessageSquare,
      description: "sock.ev.on('messages.upsert', ...)",
      color: 'bg-green-500'
    },
    {
      id: 'whatsapp-get-chat-list',
      name: 'WhatsApp - Obter Lista de Chats',
      icon: MessageSquare,
      description: 'sock.chatRead, sock.groupMetadata, etc.',
      color: 'bg-green-500'
    }
  ],
  'email': [
    {
      id: 'email-send-smtp',
      name: 'Email - Enviar SMTP',
      icon: Mail,
      description: 'SMTP via nodemailer',
      color: 'bg-purple-500'
    },
    {
      id: 'email-send-sendgrid',
      name: 'Email - SendGrid',
      icon: Mail,
      description: '/v3/mail/send',
      color: 'bg-purple-500'
    },
    {
      id: 'email-send-mailgun',
      name: 'Email - Mailgun',
      icon: Mail,
      description: '/v3/{domain}/messages',
      color: 'bg-purple-500'
    }
  ],
  'system': [
    {
      id: 'sleep',
      name: 'Sleep',
      icon: Clock,
      description: 'Suspender execução por tempo determinado',
      color: 'bg-gray-500'
    },
    {
      id: 'http-request',
      name: 'HTTP Request',
      icon: Globe,
      description: 'Realizar requisição HTTP qualquer',
      color: 'bg-blue-400'
    },
    {
      id: 'aggregator',
      name: 'Agregador',
      icon: Database,
      description: 'Agrupar dados de múltiplas fontes',
      color: 'bg-orange-500'
    },
    {
      id: 'iterator',
      name: 'Iterador',
      icon: Code,
      description: 'Iterar sobre array de dados',
      color: 'bg-indigo-500'
    },
    {
      id: 'branch',
      name: 'Branch',
      icon: Branch,
      description: 'Condicionais (disponível futuramente)',
      color: 'bg-yellow-500'
    },
    {
      id: 'webhook-trigger',
      name: 'Webhook Trigger',
      icon: Terminal,
      description: 'Trigger via webhook (express route)',
      color: 'bg-green-600'
    }
  ]
};

// -------- Tipos para logs --------
interface LogEntry {
  id: string;
  timestamp: number;
  status: 'running' | 'success' | 'error' | 'warning' | 'info';
  message: string;
  stepName?: string;
  duration?: number;
}

export default function WorkflowBuilder({
  initialSteps = [],
  onSave,
  title = "Nova Automação",
  isFullscreen = false
}: {
  initialSteps?: Step[];
  onSave?: (steps: Step[]) => void;
  title?: string;
  isFullscreen?: boolean;
}) {
  const [steps, setSteps] = useState<Step[]>(
    initialSteps.length > 0 
      ? initialSteps 
      : [{ 
          id: makeId(), 
          kind: 'trigger', 
          title: 'Trigger', 
          config: { type: 'conversation_opened' } 
        }]
  );

  const [selectedId, setSelectedId] = useState<string | null>(steps[0]?.id ?? null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showNodePanel, setShowNodePanel] = useState(false);

  const convertStepsToNodes = useMemo(() => {
    return steps.map((step, index) => {
      // Determine node type and logo based on step configuration
      let nodeIcon = null;
      let nodeColor = '#3b82f6';
      let iconColor = '#ffffff';
      
      // Check if it's a trigger step
      const isTrigger = step.kind === 'trigger';
      
      // Get appropriate icon for the node type
      if (isTrigger) {
        nodeIcon = Zap; // Thunder/lightning icon for trigger
        nodeColor = '#86efac'; // Light green border and shadow
      } else {
        // Determine icon based on the config type
        const configType = step.config?.type || '';
        
        if (configType.includes('instagram')) {
          nodeIcon = Instagram;
          nodeColor = '#e91e63'; // Pink for Instagram
        } else if (configType.includes('facebook')) {
          nodeIcon = Facebook;
          nodeColor = '#1976d2'; // Blue for Facebook  
        } else if (configType.includes('google') || configType.includes('gmail') || configType.includes('calendar') || configType.includes('docs') || configType.includes('sheets')) {
          if (configType.includes('calendar')) {
            nodeIcon = Cal;
          } else if (configType.includes('docs')) {
            nodeIcon = Docs;
          } else if (configType.includes('sheets')) {
            nodeIcon = Sheets;
          } else {
            nodeIcon = Mail;
          }
          nodeColor = '#4285f4'; // Google Blue
        } else if (configType.includes('whatsapp')) {
          nodeIcon = MessageSquare;
          nodeColor = '#25d366'; // WhatsApp Green
        } else if (configType.includes('email')) {
          nodeIcon = Mail;
          nodeColor = '#ea4335'; // Email Red
        } else if (configType.includes('sleep') || configType.includes('system')) {
          nodeIcon = Clock;
          nodeColor = '#6b7280'; // Gray for system
        } else {
          nodeIcon = Code;
          nodeColor = '#6366f1'; // Purple default
        }
      }

      const IconComponent = nodeIcon;

      return {
        id: step.id,
        type: 'customNode',
        position: { 
          x: 100 + (index * 280), 
          y: 100 + (index * 180) 
        },
        data: { 
          label: step.title,
          icon: IconComponent,
          iconColor: nodeColor
        }
      };
    });
  }, [steps]);

  const centerView = () => {
    // React Flow handles this internally
  };

  const addLog = (message: string, status: LogEntry['status'] = 'info', stepName?: string) => {
    const newLog: LogEntry = {
      id: makeId(),
      timestamp: Date.now(),
      status,
      message,
      stepName
    };
    setLogs(prev => [...prev, newLog]);
  };

  const handleStepNavigation = (stepIndex: number) => {
    const newIndex = Math.max(0, Math.min(stepIndex, steps.length - 1));
    setCurrentStepIndex(newIndex);
    
    if (steps[newIndex]) {
      setSelectedId(steps[newIndex].id);
    }
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    
    if (!isPlaying) {
      addLog('Iniciando execução da automação', 'info');
    } else {
      addLog('Execução pausada', 'warning');
    }
  };

  // Define custom node types for ReactFlow
  const nodeTypes = {
    customNode: CustomNode,
  };

  return (
    <div className="w-full flex bg-gray-50 h-full min-h-0">
      {/* LEFT TOOLBAR */}
      <div className="w-16 border-r border-gray-200 bg-white flex flex-col items-center gap-4 py-4 flex-shrink-0">
        <Button
          variant="outline"
          size="icon"
          onClick={centerView}
          className="h-10 w-10"
          title="Centralizar"
        >
          <Target className="w-4 h-4" />
        </Button>

        <Button
          variant="outline" 
          size="icon"
          className="h-10 w-10"
          title="Desfazer"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>

        <Button
          variant="outline"
          size="icon" 
          className="h-10 w-10"
          title="Refazer"
        >
          <Redo className="w-4 h-4" />
        </Button>
      </div>

        {/* Enhanced React Flow Canvas with N8N Style Background */}
        <div className="flex-1 relative overflow-hidden bg-[#f5f6f8] flex flex-col min-h-0">
          <ReactFlowProvider>
            <ReactFlow 
              nodes={convertStepsToNodes} 
              edges={[]} 
              nodeTypes={nodeTypes}
              className="bg-[#f5f6f8]"
              fitView
              defaultViewport={{ x: 0, y: 0, zoom: 1 }}
              onDrop={(e) => {
                e.preventDefault();
                try {
                  const nodeData = JSON.parse(e.dataTransfer.getData('application/json'));
                  console.log('Dropped node data:', nodeData);
                  
                  // Add node to workflow when dropped
                  const newNode: Step = {
                    id: makeId(),
                    kind: 'action' as any,
                    title: nodeData.name,
                    config: { type: nodeData.id }
                  };
                  setSteps(prev => [...prev, newNode]);
                  
                  // Close the node panel after successful drop
                  setShowNodePanel(false);
                } catch (error) {
                  console.error('Error parsing dropped node:', error);
                }
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
              }}
            >
              <Background
                variant="dots"
                gap={16}
                size={1}
                color="#cfd3da"
              />
              <Controls />
              <MiniMap />
            </ReactFlow>
          </ReactFlowProvider>

        {/* TOP ACTION BAR */}
        <div className="absolute right-4 top-4 flex items-center gap-3 z-30">
          <div className="px-3 py-1 bg-white rounded-lg shadow-sm text-sm text-gray-600">
            Última versão há 3 dias
          </div>
          
          <Button variant="outline" size="sm">
            <Save className="w-4 h-4 mr-2" />
            Salvar
          </Button>
          
          <Button variant="outline" size="sm">
            <Play className="w-4 h-4 mr-2" />
            Testar
          </Button>
          
          <Button className="bg-purple-600 hover:bg-purple-700">
            Publicar
          </Button>
        </div>

        {/* Add Node Button - Top left of canvas */}
        <div className="absolute left-4 top-4 z-30">
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => setShowNodePanel(!showNodePanel)}
            className="bg-white hover:bg-gray-50 shadow-lg border-gray-300 font-medium text-gray-700 hover:text-gray-900"
            title="Adicionar Nó"
          >
            <Plus className="w-4 h-4 mr-2 font-bold" />
            Add Node
          </Button>
        </div>
      </div>

      {/* RIGHT NODE PANEL */}
      {showNodePanel && (
        <div className="w-72 border-l border-gray-200 bg-white shadow-xl animate-in slide-in-from-right duration-300">
          {/* Modern Header - Compact */}
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Add Node</h3>
                <p className="text-xs text-gray-500 mt-1">Click or drag to workflow</p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowNodePanel(false)}
                className="hover:bg-gray-100 transition-colors h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Compact Scrollable List */}
          <div className="overflow-y-auto max-h-[calc(100vh-120px)] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {Object.entries(NODE_CATALOG).map(([category, nodes]) => (
              <div key={category} className="p-3">
                <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 px-2">
                  {category === 'google' ? 'Google Services' : category.charAt(0).toUpperCase() + category.slice(1)}
                </h4>
                <div className="space-y-1">
                  {nodes.map((node) => {
                    const IconComponent = node.icon;
                    return (
                      <div 
                        key={node.id}
                        className="group flex items-center gap-3 p-2 rounded-lg bg-gray-50 hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200 cursor-pointer transition-all duration-200"
                        draggable="true"
                        onDragStart={(e) => {
                          console.log('Start dragging node:', node);
                          e.dataTransfer.setData('application/json', JSON.stringify(node));
                          e.dataTransfer.effectAllowed = 'copy';
                          (e.target as HTMLElement).style.opacity = '0.5';
                        }}
                        onDragEnd={(e) => {
                          (e.target as HTMLElement).style.opacity = '1';
                        }}
                        onClick={() => {
                          console.log('Add node via click:', node);
                          
                          const newNode: Step = {
                            id: makeId(),
                            kind: 'action' as any,
                            title: node.name,
                            config: { type: node.id }
                          };
                          setSteps(prev => [...prev, newNode]);
                          setShowNodePanel(false);
                        }}
                      >
                        {/* Compact Icon */}
                        <div className={`w-8 h-8 rounded-lg ${node.color} flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-200`}>
                          <IconComponent className="w-4 h-4 text-white" />
                        </div>
                        
                        {/* Compact Content */}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 text-sm leading-tight">
                            {node.name}
                          </div>
                          <div className="text-xs text-gray-500 leading-tight line-clamp-1 mt-0.5">
                            {node.description}
                          </div>
                        </div>
                        
                        {/* Plus Indicator */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1">
                          <Plus className="w-3 h-3 text-gray-400" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Logger Section - Modified width - not full screen */}
      <div className="h-20 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200 flex items-center justify-center mx-auto max-w-2xl w-auto px-4 shadow-lg rounded-t-lg">
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-green-500 animate-pulse" />
          <span className="text-sm text-gray-600">Automação Ativa</span>
          <Button size="sm" variant={isPlaying ? "destructive" : "default"} onClick={handlePlayPause}>
            {isPlaying ? 'Pausar' : 'Executar'}
          </Button>
        </div>
      </div>
    </div>
  );
}
