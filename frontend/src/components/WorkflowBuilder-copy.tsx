'use client';

import React, { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import { X, Plus, Save, Play, Target, RotateCcw, Redo, Copy, Trash2, Settings, Calendar, Clock, Filter, CheckCircle, Circle, ChevronLeft, ChevronRight, SkipBack, SkipForward, Pause, CheckCircle2, AlertCircle, XCircle, Activity, Monitor, Move, ZoomIn, ZoomOut, RotateCcw as RotateLeft, RotateCw as RotateRight, Maximize2, Minimize2, Zap, AlertTriangle, Check, FileText } from 'lucide-react';
import { Step, StepKind, CatalogItem, WorkflowTrigger, WorkflowExecution } from '@/types/workflow';
import { WORKFLOW_CATALOG, CATALOG_BY_GROUP } from '@/data/workflow-catalog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ReactFlowProvider, ReactFlow, Node, Edge, useNodesState, useEdgesState, addEdge, useReactFlow, Background, Controls, MiniMap, Panel } from 'reactflow';
import 'reactflow/dist/style.css';

// -------- Tipos auxiliares ----------
const makeId = () => Math.random().toString(36).slice(2, 10);

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

        <Separator className="my-2" />

        <div className="text-[10px] text-gray-500 rotate-90 transform -mt-4">
          FERRAMENTAS
        </div>
      </div>

      {/* Enhanced React Flow Canvas with N8N Style Background */}
      <div className="flex-1 relative overflow-hidden bg-[#f5f6f8] flex flex-col min-h-0">
        <ReactFlowProvider>
          <ReactFlow 
            nodes={[]} 
            edges={[]} 
            className="bg-[#f5f6f8]"
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
      </div>

      {/* Logger Section */}
      <div className="h-20 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200 flex items-center justify-center">
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
