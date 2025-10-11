'use client';

import React, { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import { X, Plus, Save, Play, Target, RotateCcw, Redo, Copy, Trash2, Settings, Calendar, Clock, Filter, CheckCircle, Circle, ChevronLeft, ChevronRight, SkipBack, SkipForward, Pause, CheckCircle2, AlertCircle, XCircle, Activity, Monitor, Move, ZoomIn, ZoomOut, RotateCcw as RotateLeft, RotateCw as RotateRight, Maximize2, Minimize2, Zap, AlertTriangle, Check, FileText, NotebookText, StickyNote, Focus, Terminal, Square, Loader2, RefreshCw, CircleDot, Search } from 'lucide-react';
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

// -------- Enhanced Brand Node with HOVER TRASH --------
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

  const [isRunning, setIsRunning] = useState(false);
  const [isOn, setIsOn] = useState(true);
  const [showHoverTrash, setShowHoverTrash] = useState(false);

  const handleRunNode = () => {
    setIsRunning(true);
    data.onRunNode?.(data.id);
    setTimeout(() => setIsRunning(false), 2000);
  };

  const handleToggleOnOff = () => {
    setIsOn(!isOn);
    data.onToggleOnOff?.(data.id, !isOn);
  };

  const handleDeleteNode = () => {
    data.onDeleteNode?.(data.id);
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
      
      <div 
        className={`min-w-[220px] relative rounded-xl border-2 ${getNodeColor(data.kind)} shadow-lg hover:shadow-xl cursor-grab active:cursor-grabbing transition-all duration-200 group`}
        onMouseEnter={() => setShowHoverTrash(true)}
        onMouseLeave={() => setShowHoverTrash(false)}
      >
        {/* Node Header with Icon and Type */}
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
          
          {/* ALWAYS SHOWN CONTROL BUTTONS */}
          <div className="flex items-center gap-1">
            {/* PLAY BUTTON - Execute this specific node */}
            <button
              onClick={handleRunNode}
              disabled={isRunning || !isOn}
              className="p-1.5 rounded-full bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
              title="Execute this node"
            >
              {isRunning ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Play className="w-3 h-3" />
              )}
            </button>

            {/* ON/OFF BUTTON - Toggle node activation */}
            <button
              onClick={handleToggleOnOff}
              className={`p-1.5 rounded-full transition-colors ${
                isOn 
                  ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                  : 'bg-gray-400 hover:bg-gray-500 text-white'
              }`}
              title={isOn ? 'Turn OFF node' : 'Turn ON node'}
            >
              <CircleDot className="w-3 h-3" />
            </button>

            {/* HOVER DELETE TRASH CAN */}
            <div className={`transition-all duration-200 ${showHoverTrash ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
              <button
                onClick={handleDeleteNode}
                className="p-1.5 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors shadow-lg"
                title="Delete node"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Node Content */}
        <div className="px-4 py-3 text-xs text-gray-600 bg-white/60 backdrop-blur-sm rounded-b-xl">
          {data.description || 'Configure this step...'}
          {!isOn && (
            <div className="mt-2 text-orange-600 font-medium text-xs flex items-center gap-1">
              <div className="w-1 h-1 bg-orange-500 rounded-full"></div>
              DISABLED
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// -------- Custom Edge with Trash Button --------
const getEdgeCenter = ({ sourceX, sourceY, targetX, targetY }: { sourceX: number; sourceY: number; targetX: number; targetY: number }) => {
  const xOffset = (targetX - sourceX) / 2;
  const yOffset = (targetY - sourceY) / 2;
  return [sourceX + xOffset, sourceY + yOffset];
};

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

// -------- NODE LIST PANEL (Right Side) --------
function NodeListPanel({ 
  onSelectNode, 
  selectedNodeType, 
  isCollapsed = false 
}: { 
  onSelectNode?: (nodeType: string) => void;
  selectedNodeType?: string;
  isCollapsed?: boolean;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  
  const nodeCategories = [
    {
      title: 'AI',
      icon: '🤖',
      nodes: [
        { type: 'openai.chat', title: 'ChatGPT', description: 'AI agent' },
        { type: 'ai.summarize', title: 'Summarize', description: 'Summarize text' },
        { type: 'ai.translate', title: 'Translate', description: 'Translate text' }
      ]
    },
    {
      title: 'Google',
      icon: '📧',
      nodes: [
        { type: 'gcal.create', title: 'Google Calendar', description: 'Create event' },
        { type: 'gsheets.read', title: 'Google Sheets', description: 'Read data' },
        { type: 'gdocs.create', title: 'Google Docs', description: 'Create document' },
        { type: 'gmail.send', title: 'Gmail', description: 'Send email' }
      ]
    },
    {
      title: 'Social',
      icon: '📱',
      nodes: [
        { type: 'instagram.post', title: 'Instagram', description: 'Post to Instagram' },
        { type: 'facebook.post', title: 'Facebook', description: 'Post to Facebook' },
        { type: 'whatsapp.send', title: 'WhatsApp', description: 'Send message' }
      ]
    },
    {
      title: 'System',
      icon: '⚙️',
      nodes: [
        { type: 'http.request', title: 'HTTP Request', description: 'API call' },
        { type: 'data.transform', title: 'Data Transform', description: 'Transform data' },
        { type: 'sleep.wait', title: 'Wait', description: 'Sleep timer' }
      ]
    }
  ];

  const filteredNodes = nodeCategories.map(category => ({
    ...category,
    nodes: category.nodes.filter(node => 
      node.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      node.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.nodes.length > 0);

  return (
    <div className={`transition-all duration-300 ${isCollapsed ? 'w-0' : 'w-80'} overflow-hidden bg-white/95 backdrop-blur-xl border-l border-gray-200 flex flex-col`}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Add Steps</h3>
          <button className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search nodes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 bg-white/80 text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {filteredNodes.map((category, categoryIndex) => (
          <div key={categoryIndex} className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">{category.icon}</span>
              <h4 className="font-medium text-gray-700">{category.title}</h4>
            </div>
            
            <div className="space-y-1">
              {category.nodes.map((node, nodeIndex) => (
                <button
                  key={`${categoryIndex}-${nodeIndex}`}
                  onClick={() => onSelectNode?.(node.type)}
                  className={`w-full text-left p-3 rounded-lg border border-gray-100 hover:border-blue-300 hover:bg-blue-50 transition-colors ${
                    selectedNodeType === node.type ? 'border-blue-400 bg-blue-50' : ''
                  }`}
                >
                  <div className="font-medium text-sm text-gray-800">{node.title}</div>
                  <div className="text-xs text-gray-500">{node.description}</div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// -------- Enhanced Workflow Canvas with Node Controls --------
function EnhancedWorkflowCanvas({ 
  steps, 
  onStepsChange, 
  className = "", 
  isFullscreen = false,
  onNodeRun,
  onNodeToggle,
  onNodeDelete 
}: {
  steps: Step[];
  onStepsChange: (steps: Step[]) => void;
  className?: string;
  isFullscreen?: boolean;
  onNodeRun?: (nodeId: string) => void;
  onNodeToggle?: (nodeId: string, isOn: boolean) => void;
  onNodeDelete?: (nodeId: string) => void;
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const reactFlowInstance = useReactFlow();

  // Convert steps to ReactFlow format with node controls  
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
        onRunNode: onNodeRun,
        onToggleOnOff: onNodeToggle,
        onDeleteNode: onNodeDelete,
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
  }, [steps, onStepsChange, onNodeRun, onNodeToggle, onNodeDelete]);

  // **** VUE FLOW FUNCTIONS - CHEAT SHEET IMPLEMENTATION ****
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

// -------- N8N Style THIN Log Footer --------
function ThinLogFooter({
  logs,
  currentStepIndex,
  onStepNavigation,
  isPlaying,
}: {
  logs: LogEntry[];
  currentStepIndex: number;
  onStepNavigation: (stepIndex: number) => void;
  isPlaying: boolean;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 bg-white border-t border-gray-200 shadow-sm">
      <div className="max-w-6xl mx-auto">
        <div className="px-4 py-2 text-sm text-gray-600 bg-gray-50 border-b">
          Execution Log • Step {currentStepIndex + 1} of {Math.max(logs.length, 1)}
        </div>
        
        <div className="px-4 py-3">
          {logs.length > 0 ? (
            <div className="flex items-center gap-4 text-sm">
              <div className="text-green-600">
                {logs[logs.length - 1]?.status === 'running' && (
                  <Activity className="w-4 h-4 animate-pulse inline mr-1" />
                )}
              </div>
              <span className="text-gray-700">{logs[logs.length - 1]?.message}</span>
              <div className="flex items-center gap-2 ml-auto">
                <button 
                  onClick={() => onStepNavigation(currentStepIndex - 1)}
                  disabled={currentStepIndex <= 0}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-gray-500 text-xs">{currentStepIndex + 1}/{logs.length}</span>
                <button 
                  onClick={() => onStepNavigation(currentStepIndex + 1)}
                  disabled={currentStepIndex >= logs.length - 1}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="text-gray-500 text-sm">
              No execution logs yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// -------- Log Entry Type --------
type LogEntry = {
  id: string;
  timestamp: number;
  status: 'running' | 'success' | 'error' | 'warning' | 'info';
  message: string;
  stepName?: string;
  duration?: number;
};

// -------- Main Workflow Builder Component --------
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
  const [showNodePanel, setShowNodePanel] = useState(false);

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
    saveWorkflow();
  };

  // **** NODE-SPECIFIC CONTROL FUNCTIONS ****
  const handleNodeRun = (nodeId: string) => {
    const step = steps.find(s => s.id === nodeId);
    if (step) {
      addLog(`Executando "${step.title}"`, 'running', step.title);
    }
  };

  const handleNodeToggle = (nodeId: string, isOn: boolean) => {
    const step = steps.find(s => s.id === nodeId);
    if (step) {
      addLog(`${isOn ? 'Ativando' : 'Desativando'} "${step.title}"`, 'info', step.title);
    }
  };

  const handleNodeDelete = (nodeId: string) => {
    const step = steps.find(s => s.id === nodeId);
    if (step) {
      setSteps(prevSteps => prevSteps.filter(s => s.id !== nodeId));
      addLog(`Removido "${step.title}"`, 'info', step.title);
    }
  };

  return (
    <div className="w-full flex bg-gray-50 h-full min-h-0 relative">
      {/* TITLE HEADER */}
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
            onNodeRun={handleNodeRun}
            onNodeToggle={handleNodeToggle}
            onNodeDelete={handleNodeDelete}
            className="bg-[#f5f6f8]"
            isFullscreen={isFullscreen}
          />
        </ReactFlowProvider>

        {/* BOTTOM RIGHT CORNER BUTTONS - N8N Style */}
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
            onClick={() => setShowNodePanel(!showNodePanel)}
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

        {/* TOP ACTION BAR */}
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

      {/* RIGHT SIDE NODE LIST PANEL */}
      <NodeListPanel 
        onSelectNode={(nodeType) => {
          // Add new node when selected
          handleAddStep();
        }}
        isCollapsed={!showNodePanel}
      />

      {/* N8N Style THIN LOG FOOTER */}
      <ThinLogFooter
        logs={logs}
        currentStepIndex={currentStepIndex}
        onStepNavigation={handleStepNavigation}
        isPlaying={isPlaying}
      />
    </div>
  );
}
