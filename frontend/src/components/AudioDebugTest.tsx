"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Play, Pause, Send } from 'lucide-react';

export const AudioDebugTest: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(`[AUDIO-DEBUG] ${message}`);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      addLog('🎤 Iniciando gravação...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      addLog('🎤 Stream de áudio obtido com sucesso');
      
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/mp4';
        }
      }
      
      addLog(`🎤 Codec selecionado: ${mimeType}`);
      
      const recorder = new MediaRecorder(stream, { mimeType });
      setMediaRecorder(recorder);
      chunksRef.current = [];
      setDuration(0);
      setIsRecording(true);
      setIsPaused(false);

      recorder.ondataavailable = (event) => {
        addLog(`🎤 Dados recebidos: ${event.data.size} bytes`);
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        addLog(`🎤 Parando gravação, chunks: ${chunksRef.current.length}`);
        
        if (chunksRef.current.length > 0) {
          const blob = new Blob(chunksRef.current, { type: mimeType });
          addLog(`🎤 Blob criado: ${blob.size} bytes, tipo: ${blob.type}`);
          
          if (blob.size > 0) {
            setAudioBlob(blob);
            const url = URL.createObjectURL(blob);
            setAudioUrl(url);
            addLog(`✅ Áudio gravado com sucesso: ${blob.size} bytes`);
          } else {
            addLog('❌ Blob criado mas está vazio');
          }
        } else {
          addLog('⚠️ Nenhum chunk foi capturado');
        }
        
        stream.getTracks().forEach(track => {
          addLog(`🎤 Parando track: ${track.kind}`);
          track.stop();
        });
      };

      recorder.start(100);
      addLog('🎤 MediaRecorder iniciado');
      
      intervalRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

    } catch (error) {
      addLog(`❌ Erro ao iniciar gravação: ${error.message}`);
    }
  };

  const stopRecording = () => {
    addLog('🛑 Parando gravação...');
    
    if (mediaRecorder && isRecording) {
      addLog(`🛑 Estado do MediaRecorder: ${mediaRecorder.state}`);
      
      if (mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        addLog('🛑 MediaRecorder.stop() chamado');
      } else {
        addLog(`⚠️ MediaRecorder não está gravando, estado: ${mediaRecorder.state}`);
      }
      
      setIsRecording(false);
      setIsPaused(false);
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    } else {
      addLog('⚠️ Não há gravação ativa para parar');
    }
  };

  const playAudio = () => {
    if (audioRef.current && audioUrl) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
        addLog('⏸️ Áudio pausado');
      } else {
        audioRef.current.play();
        setIsPlaying(true);
        addLog('▶️ Áudio reproduzindo');
      }
    }
  };

  const sendAudio = () => {
    if (audioBlob) {
      addLog(`📤 Enviando áudio: ${audioBlob.size} bytes`);
      // Aqui você pode implementar o envio
    } else {
      addLog('❌ Nenhum áudio para enviar');
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Teste de Debug de Áudio</h1>
      
      {/* Controles de gravação */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            {!isRecording && !audioBlob && (
              <Button onClick={startRecording} className="bg-red-500 hover:bg-red-600 text-white">
                <Mic className="w-4 h-4 mr-2" />
                Iniciar Gravação
              </Button>
            )}
            
            {isRecording && (
              <Button onClick={stopRecording} className="bg-red-500 hover:bg-red-600 text-white">
                <Square className="w-4 h-4 mr-2" />
                Parar Gravação
              </Button>
            )}
            
            {audioBlob && (
              <>
                <Button onClick={playAudio} className="bg-blue-500 hover:bg-blue-600 text-white">
                  {isPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                  {isPlaying ? 'Pausar' : 'Reproduzir'}
                </Button>
                
                <Button onClick={sendAudio} className="bg-green-500 hover:bg-green-600 text-white">
                  <Send className="w-4 h-4 mr-2" />
                  Enviar Áudio
                </Button>
              </>
            )}
          </div>
          
          <div className="text-sm text-gray-600">
            {isRecording && `Gravando: ${formatTime(duration)}`}
            {audioBlob && `Áudio: ${formatTime(duration)}`}
          </div>
        </div>
        
        {isRecording && (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-red-500 h-2 rounded-full transition-all duration-1000"
              style={{ width: `${Math.min((duration / 120) * 100, 100)}%` }}
            />
          </div>
        )}
      </div>

      {/* Informações do áudio */}
      {audioBlob && (
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2">Informações do Áudio</h3>
          <div className="text-sm text-blue-700 space-y-1">
            <div>Tamanho: {audioBlob.size} bytes</div>
            <div>Tipo: {audioBlob.type}</div>
            <div>Duração: {formatTime(duration)}</div>
          </div>
        </div>
      )}

      {/* Logs */}
      <div className="bg-gray-900 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-white">Logs de Debug</h3>
          <Button 
            onClick={clearLogs} 
            variant="outline" 
            size="sm"
            className="text-white border-white hover:bg-white hover:text-gray-900"
          >
            Limpar
          </Button>
        </div>
        <div className="h-64 overflow-y-auto text-green-400 text-sm font-mono space-y-1">
          {logs.map((log, index) => (
            <div key={index}>{log}</div>
          ))}
        </div>
      </div>

      {/* Elemento de áudio oculto */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => setIsPlaying(false)}
          onPause={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
          className="hidden"
        />
      )}
    </div>
  );
};
