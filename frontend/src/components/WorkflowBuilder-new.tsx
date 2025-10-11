'use client';

import React, { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import { X, Plus, Save, Play, Target, RotateCcw, Redo, Copy, Trash2, Settings, Calendar, Clock, Filter, CheckCircle, Circle, ChevronLeft, ChevronRight, SkipBack, SkipForward, Pause, CheckCircle2, AlertCircle, XCircle, Activity, Monitor, Move, ZoomIn, ZoomOut, RotateCcw as RotateLeft, RotateCw as RotateRight, Maximize2, Minimize2, Zap, AlertTriangle, Check, FileText, NotebookText, StickyNote, Focus, Terminal, Square, Loader2, RefreshCw } from 'lucide-react';
import { Step, StepKind, CatalogItem, WorkflowTrigger, WorkflowExecution } from '@/types/workflow';
import { WORKFLOW_CATALOG, CATALOG_BY_GROUP } from '@/data/workflow-catalog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ReactFlowProvider, ReactFlow, Node, Edge, useNodesState, useEdgesState, addEdge, useReactFlow, Background, Controls, MiniMap, Panel, Handle, Position, EdgeProps, NodeTypes, EdgeTypes } from 'reactflow';
import 'reactflow/dist/style.css';

const makeId = () => `node-${Math.random().toString(36).substr(2, 9)}`;

// -------- Node Wire Component --------
const NodeWire = ({ isConnectable, position, id, nodeId }: { isConnectable: boolean; position: Position; id: string; nodeId: string }) => (
  <Handle
    type={position === Position.Left ? 'target' : 'source'}
    position={position}
    id={id}
    style={{
      width: 12,
      height: 12,
      background: position === Position.Left ? '#3B82F6' : '#10B981',
      border: '2px solid white',
      borderRadius: '50%',
    }}
    isConnectable={isConnectable}
  />
);

// -------- Enhanced Brand Node Component with Node Wires --------
const BrandNode = ({ data, isConnectable }: { data: any; isConnectable: boolean }) => {
  const getNodeColor = (kind: string) => {
    switch (kind) {
      case 'trigger': return 'border-purple-300 bg-gradient-to-br from-purple-50 to-purple-100';
      case 'send_message': return 'border-blue-300 bg-gradient-to-br from-blue-50 to-blue-100';
      case 'http_request': return 'border-green-300 bg-gradient-to-br from-green-50 to-green-100';
      case 'ai_agent': return 'border-indigo-300 bg-gradient-to-br from-indigo-50 to-indigo-100';
      default: return 'border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100';
    }
  };

  return (
    <div className="w-full min-w-[220px] relative">
      <NodeWire
        position={Position.Left}
        isConnectable={isConnectable}
        id="input-1"
        nodeId={data.id}
      />
      <NodeWire
        position={Position.Right}
        isConnectable={isConnectable}
        id="output-1"
        nodeId={data.id}
      />
      
      <div className={`min-w-[220px] relative rounded-xl border-2 ${getNodeColor(data.kind)} shadow-lg hover:shadow-xl cursor-grab active:cursor-grabbing transition-all duration-200`}>
        <div className="px-4 py-3 flex items-center justify-between bg-white/80 backdrop-blur-sm rounded-t-xl border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-lg">
              {data.icon || '🔧'}
            </div>
            <div>
              <div className="font-semibold text-gray-800 text-sm">{data.title}</div>
              <div className="text-xs text-gray-500">{data.kind || 'node'}</div>
            </div>
          </div>
        </div>
        <div className="px-4 py-3 text-xs text-gray-600 bg-white/60 backdrop-blur-sm rounded-b-xl">
          {data.description || 'Configure this step...'}
        </div>
      </div>
    </div>
  );
};

// -------- Custom Edge with Trash Button - VUE FLOW IMPLEMENTATION --------
const getEdgeCenter = ({ sourceX, sourceY, targetX, targetY }: { sourceX: number; sourceY: number; targetX: number; targetY: number }) => {
  const xOffset = (targetX - sourceX) / 2;
  const yOffset = (targetY - sourceY) / 2;
  return [sourceX + xOffset, sourceY + yOffset];
};

// Custom edge with trash delete button in middle
const CustomEdgeWithTrash = ({ id, sourceX, sourceY, targetX, targetY, style, onEdgeDelete }: EdgeProps & { onEdgeDelete?: (edgeId: string) => void }) => {
  const [edgeCenterX, edgeCenterY] = getEdgeCenter({ sourceX, sourceY, targetX, targetY });
  
  return (
    <>
      <path
        id={id}
        style={style}
        className="react-flow__edge-path stroke-[#10B981] stroke-[2px]"
        d={`M ${sourceX},${sourceY} Q ${edgeCenterX},${edgeCenterY} ${targetX},${targetY}`}
      />
      {/* Trash button in middle of edge */}
      <foreignObject
        width="20"
        height="20"
        x={edgeCenterX - 10}
        y={edgeCenterY - 10}
      >
        <button
          onClick={() => onEdgeDelete?.(id)}
          className="w-5 h-5 rounded-full bg-red-500 hover:bg-red-600 text-white text-xs flex items-center justify-center cursor-pointer border-2 border-white shadow-lg"
          title="Delete Connection"
        >
          <X className="w-3 h-3" />
        </button>
      </foreignObject>
    </>
  );
};

const nodeTypes = {
  brandNode: BrandNode,
};

const edgeTypes = {
  customEdge: CustomEdgeWithTrash,
};

// -------- Enhanced Workflow Canvas with Vue Flow --------
function EnhancedWorkflowCanvas({ steps, onStepsChange, className = "", isFullscreen = false }: {
  steps: Step[];
  onStepsChange: (steps: Step[]) => void;
  className?: string;
  isFullscreen?: boolean;
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const reactFlowInstance = useReactFlow();

  // Convert steps to ReactFlow format  
  useEffect(() => {
    const flowNodes = steps.map((step, index) => ({
      id: step.id,
      type: 'brandNode',
      position: { x: 100 + index * 300, y: 100 },
      data: { 
        title: step.title,
        kind: step.kind,
        config: step.config,
        icon: step.kind === 'trigger' ? '⚡' : step.kind === 'send_message' ? '✉️' : step.kind === 'http_request' ? '🌐' : step.kind === 'ai_agent' ? '🤖' : '🔧',
        onAddNext: () => {
          const stepIndex = steps.findIndex(s => s.id === step.id);
          const nextStep: Step = {
            id: makeId(),
            kind: 'send_message',
            title: 'New Step',
            config: {}
          };
          const newSteps = [...steps];
          newSteps.splice(stepIndex + 1, 0, nextStep);
          onStepsChange(newSteps);
        }
      },
    }));
    setNodes(flowNodes);
  }, [steps, onStepsChange]);

  // **** VUE FLOW FUNCTIONS - CHEAT SHEET IMPLEMENTATION ****
  // Delete edge function for trash buttons
  const onEdgeDelete = useCallback((edgeId: string) => {
    setEdges((eds) => eds.filter((e) => e.id !== edgeId));
  }, [setEdges]);

  const onConnect = useCallback((params: any) => {
    setEdges((eds) => addEdge({ 
      ...params, 
      type: 'customEdge',
      animated: true,
      style: { stroke: '#10B981', strokeWidth: 2 }
    }, eds));
  }, [setEdges]);

  const onDragOver = useCallback((evt: React.DragEvent) => {
    evt.preventDefault();
    evt.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((evt: React.DragEvent) => {
    evt.preventDefault();
    const raw = evt.dataTransfer.getData('application/reactflow');
    if (!raw) return;

    try {
      const payload = JSON.parse(raw) as { type: string; label: string; icon?: string };
      
      // **** VUE FLOW PROJECT FUNCTION - Accurate placement even when zoomed/panned ****
      const position = reactFlowInstance.screenToFlowPosition({
        x: evt.clientX,
        y: evt.clientY,
      });
      
      const newId = makeId();
      const newStep: Step = {
        id: newId,
        kind: payload.type as StepKind,
        title: payload.label,
        config: {}
      };
      
      const newSteps = [...steps, newStep];
      onStepsChange(newSteps);
    } catch (error) {
      console.error('Failed to parse drag data:', error);
    }
  }, [reactFlowInstance, steps, onStepsChange]);

  // **** VUE FLOW TOPOLOGY HELPERS - ADD STEP AFTER NODE ****  
  const addStepAfter = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    const nextNodeId = makeId();
    const newNodeStep: Step = {
      id: nextNodeId,
      kind: 'send_message',
      title: 'New Step',
      config: {}
    };

    const nextNode = {
      id: nextNodeId,
      type: 'brandNode',
      position: { x: node.position.x, y: node.position.y + 140 },
      data: {
        title: 'New Step',
        kind: 'send_message',
        description: 'Configure this step...',
        icon: '🔧',
        nodeStatus: 'idle',
      }
    };

    // Add new node and connect it
    setNodes((nds) => [...nds, nextNode]);
    setEdges((eds) => [...eds, {
      id: makeId(),
      source: nodeId,
      target: nextNodeId,
      type: 'customEdge',
      animated: true,
      style: { stroke: '#10B981', strokeWidth: 2 }
    }]);

    onStepsChange([...steps, newNodeStep]);
  }, [nodes, setNodes, setEdges, steps, onStepsChange]);

  return (
    <div className={`h-full w-full bg-[#f5f6f8] ${className}`}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={{
          customEdge: (props: any) => <CustomEdgeWithTrash {...props} onEdgeDelete={onEdgeDelete} />
        }}
        fitView
        panOnDrag={true}
        panOnScroll={true}
        panOnScrollMode="free"
        zoomOnScroll={true}
        zoomOnPinch={true}
        selectionOnDrag={true}
        selectionByRectangle={true}
        nodesDraggable={true}
        nodesConnectable={true}
        elementsSelectable={true}
        minZoom={0.25}
        maxZoom={2.5}
        className="bg-transparent"
        onDrop={onDrop}
        onDragOver={onDragOver}
        style={{ cursor: 'grab' }}
      >
        <Background
          variant="dots"
          gap={16}
          size={1}
          color="#cfd3da"
        />
        <Controls 
          position="top-right"
          className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-lg"
        />
        <MiniMap 
          position="bottom-right"
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg"
        />
        
        {/* ZOOM BUTTONS INSIDE VUE FLOW CONTEXT */}
        <Panel position="bottom-left">
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => reactFlowInstance.fitView()}
              className="h-8 w-8 bg-white/80 backdrop-blur-xl border border-white/20 hover:bg-white/90"
              title="Zoom to Fit"
            >
              <Target className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => reactFlowInstance.zoomIn()}
              className="h-8 w-8 bg-white/80 backdrop-blur-xl border border-white/20 hover:bg-white/90"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => reactFlowInstance.zoomOut()}
              className="h-8 w-8 bg-white/80 backdrop-blur-xl border border-white/20 hover:bg-white/90"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => reactFlowInstance.fitView({ padding: 0.2 })}
              className="h-8 w-8 bg-white/80 backdrop-blur-xl border border-white/20 hover:bg-white/90"
              title="Reset Zoom"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                // **** VUE FLOW TIDY UP - Auto layout nodes ****
                setNodes((nds) => nds.map((node, index) => ({ ...node, position: { x: 100 + index * 300, y: 100 } })));
                reactFlowInstance.fitView({ padding: 0.2 });
              }}
              className="h-8 w-8 bg-white/80 backdrop-blur-xl border border-white/20 hover:bg-white/90"
              title="Tidy up"
            >
              <Square className="w-4 h-4" />
            </Button>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}

// -------- Modern Footer Log Container ---------
function ModernLogFooter({
  logs,
  currentStepIndex,
  onStepNavigation,
  onCenterView,
  isPlaying,
  onPlayPause,
  isFullscreen = false
}: {
  logs: LogEntry[];
  currentStepIndex: number;
  onStepNavigation: (stepIndex: number) => void;
  onCenterView: () => void;
  isPlaying: boolean;
  onPlayPause: () => void;
  isFullscreen?: boolean;
}) {
  const formatDuration = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    return seconds > 0 ? `${seconds}s ago` : 'now';
  };

  const getStatusIcon = (status: LogEntry['status']) => {
    switch (status) {
      case 'running':
        return <Activity className="w-4 h-4 text-blue-500 animate-pulse" />;
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: LogEntry['status']) => {
    switch (status) {
      case 'running':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'success':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (isFullscreen && logs.length === 0) return null;

  return (
    <div className={`fixed inset-x-0 bottom-0 z-50 bg-gradient-to-t from-white via-white to-transparent ${isFullscreen ? 'p-4' : ''} transition-all duration-300`}>
      <div className={`bg-white/95 backdrop-blur-xl border border-gray-200 rounded-t-xl shadow-lg max-w-6xl mx-auto ${isFullscreen ? '' : 'mr-4'}`}>
        <div className="p-4">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={onPlayPause}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                  isPlaying ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
                } text-white shadow-lg`}
                title={isPlaying ? 'Pause Automation' : 'Play Automation'}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => onStepNavigation(currentStepIndex - 1)}
                  disabled={currentStepIndex <= 0}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 flex items-center justify-center"
                >
                  <SkipBack className="w-4 h-4 text-gray-600" />
                </button>
                <span className="text-sm text-gray-600">Step {currentStepIndex} of {Math.max(logs.length, 1)}</span>
                <button 
                  onClick={() => onStepNavigation(currentStepIndex + 1)}
                  disabled={currentStepIndex >= logs.length - 1}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 flex items-center justify-center"
                >
                  <SkipForward className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              <button
                onClick={onCenterView}
                className="w-8 h-8 rounded-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center transition-all duration-200"
                title="Center on Step"
              >
                <Target className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Execução em Tempo Real</span>
            </div>
          </div>

          {logs.length > 0 ? (
            <div className="max-h-32 overflow-y-auto space-y-2">
              {logs.map((log) => (
                <div 
                  key={log.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 ${getStatusColor(log.status)} ${
                    logs.indexOf(log) === currentStepIndex ? 'ring-2 ring-blue-300 shadow-md' : ''
                  }`}
                  onClick={() => onStepNavigation(logs.indexOf(log))}
                >
                  {getStatusIcon(log.status)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate">
                        {log.stepName || log.message}
                      </span>
                      <span className="text-xs opacity-70 ml-2">
                        {formatDuration(log.timestamp)}
                      </span>
                    </div>
                    {log.stepName && log.message !== log.stepName && (
                      <p className="text-xs opacity-80 mt-1">{log.message}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhuma execução no momento</p>
              <p className="text-xs mt-1">Execute a automação para visualizar os logs</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

type LogEntry = {
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
  const [isExecuting, setIsExecuting] = useState(false);
  const [workflowTitle, setWorkflowTitle] = useState(title);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [savingStatus, setSavingStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

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

  // NEW: Execute workflow function
  const handleExecute = async () => {
    setIsExecuting(true);
    addLog('Workflow iniciado', 'running');
    
    // Simulate execution with timeout
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    addLog('Workflow concluído', 'success');
    setIsExecuting(false);
  };

  // NEW: Save to Supabase
  const saveWorkflow = async () => {
    setSavingStatus('saving');
    try {
      // TODO: Connect to Supabase
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate save
      setSavingStatus('saved');
      setTimeout(() => setSavingStatus('idle'), 2000);
      addLog('Workflow salvo no Supabase', 'success');
    } catch (error) {
      setSavingStatus('idle');
      addLog('Erro ao salvar', 'error');
    }
  };

  // NEW: Add step
  const handleAddStep = () => {
    const newStep: Step = {
      id: makeId(),
      kind: 'send_message',
      title: 'New Step',
      config: {}
    };
    setSteps([...steps, newStep]);
  };

  // NEW: Rename automation
  const handleTitleUpdate = async (newTitle: string) => {
    setWorkflowTitle(newTitle);
    setIsEditingTitle(false);
    // Save immediately or schedule save
    saveWorkflow();
  };

  return (
    <div className="w-full flex bg-gray-50 h-full min-h-0 relative">
      {/* TITLE HEADER */}
        {/* Editable Title */}
        <div className="absolute top-4 left-4 z-40">
          {isEditingTitle ? (
            <input
              type="text"
              value={workflowTitle}
              onChange={(e) => setWorkflowTitle(e.target.value)}
              onBlur={(e) => handleTitleUpdate(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleTitleUpdate(workflowTitle);
                }
                if (e.key === 'Escape') {
                  setIsEditingTitle(false);
                }
              }}
              className="text-2xl font-semibold bg-transparent border-none outline-none bg-white rounded-lg px-3 py-1"
              autoFocus
            />
          ) : (
            <button
              onClick={() => setIsEditingTitle(true)}
              className="text-2xl font-semibold hover:bg-white/50 rounded-lg px-3 py-1 transition-colors"
            >
              {workflowTitle}
            </button>
          )}
          {/* Save Status Indicator */}
          {savingStatus === 'saving' && (
            <span className="text-sm text-blue-500 ml-2">
              <Loader2 className="w-4 h-4 animate-spin inline mr-1" />
              Salvando...
            </span>
          )}
          {savingStatus === 'saved' && (
            <span className="text-sm text-green-500 ml-2">Salvo!</span>
          )}
        </div>

      {/* Enhanced React Flow Canvas with N8N Style Background */}
      <div className="flex-1 relative overflow-hidden bg-[#f5f6f8] flex flex-col min-h-0">
        <ReactFlowProvider>
          <EnhancedWorkflowCanvas
            steps={steps}
            onStepsChange={(newSteps) => {
              setSteps(newSteps);
            }}
            className="bg-[#f5f6f8]"
            isFullscreen={isFullscreen}
          />
        </ReactFlowProvider>

        {/* BOTTOM RIGHT CORNER BUTTONS - N8N Style - MOVED FROM TOP */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-30">
          <Button
            variant="outline"
            size="icon"
            onClick={handleAddStep}
            className="h-8 w-8 bg-white/80 backdrop-blur-xl border border-white/20 hover:bg-white/90"
            title="Add Node"
          >
            <Plus className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 bg-white/80 backdrop-blur-xl border border-white/20 hover:bg-white/90"
            title="Add Note"
          >
            <StickyNote className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 bg-white/80 backdrop-blur-xl border border-white/20 hover:bg-white/90"
            title="Open Focus Panel"
          >
            <Focus className="w-4 h-4" />
          </Button>
        </div>

        {/* BOTTOM CENTER EXECUTE BUTTON - N8N Style */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-30">
          <Button
            onClick={handleExecute}
            disabled={isExecuting}
            className="h-12 px-6 bg-blue-800 hover:bg-blue-900 text-white font-semibold shadow-lg rounded-lg disabled:opacity-50"
          >
            {isExecuting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Rodando...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Executar
              </>
            )}
          </Button>
        </div>

        {/* TOP ACTION BAR - Moved left to avoid Controls overlap */}
        <div className="absolute right-24 sm:right-32 top-4 flex items-center gap-2 sm:gap-3 z-30">
          <div className="px-3 py-1 bg-white rounded-lg shadow-sm text-sm text-gray-600">
            Última versão há 3 dias
          </div>
          
          <Button variant="outline" size="sm" onClick={saveWorkflow}>
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
      </div>

      {/* ENHANCED MODERN LOGGER FOOTER */}
      <ModernLogFooter
        logs={logs}
        currentStepIndex={currentStepIndex}
        onStepNavigation={handleStepNavigation}
        onCenterView={centerView}
        isPlaying={isPlaying}
        onPlayPause={handlePlayPause}
        isFullscreen={isFullscreen}
      />
    </div>
  );
}
