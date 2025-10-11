"use client";

import React, { useState, useRef } from 'react';
import { Mic, Square, Play, Pause, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useConnections } from '@/contexts/ConnectionsContext';

export const AudioSendTest: React.FC = () => {
  const { activeConnection } = useConnections();
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [testJid, setTestJid] = useState('5511999999999');
  const [logs, setLogs] = useState<string[]>([]);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
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
      
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/mp4';
        }
      }
      
      addLog(`🎤 Codec selecionado: ${mimeType}`);
      
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      setDuration(0);
      setIsRecording(true);

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
          
          setAudioBlob(blob);
          const url = URL.createObjectURL(blob);
          setAudioUrl(url);
          
          addLog('✅ Áudio gravado com sucesso!');
        } else {
          addLog('⚠️ Nenhum chunk foi capturado');
        }
        
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start(100);
      
      intervalRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

    } catch (error) {
      addLog(`❌ Erro na gravação: ${error.message}`);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  };

  const playAudio = () => {
    if (audioRef.current && audioUrl) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const testJidValidation = async () => {
    try {
      addLog(`🧪 Testando JID: ${testJid}`);
      
      const response = await fetch(`${API_URL}/api/baileys-simple/test-jid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jid: testJid })
      });

      const result = await response.json();
      addLog(`🧪 Resultado do teste JID: ${JSON.stringify(result, null, 2)}`);
      
    } catch (error) {
      addLog(`❌ Erro no teste JID: ${error.message}`);
    }
  };

  const sendAudio = async () => {
    if (!audioBlob || !activeConnection?.id) {
      addLog('❌ Áudio ou conexão não disponível');
      return;
    }

    try {
      setIsSending(true);
      addLog('📤 Enviando áudio...');
      
      const formData = new FormData();
      formData.append('file', audioBlob, 'recording.webm');
      formData.append('connectionId', activeConnection.id);
      formData.append('jid', testJid);

      addLog(`📤 Dados do envio: connectionId=${activeConnection.id}, jid=${testJid}, size=${audioBlob.size}`);

      // Usar endpoint de debug para erro de padrão
      addLog('🔍 Usando endpoint de debug para erro de padrão...');
      const response = await fetch(`${API_URL}/api/baileys-simple/debug-pattern-error`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      
      if (response.ok) {
        addLog(`✅ Áudio enviado com sucesso!`);
        addLog(`📋 JID que funcionou: ${result.data.workingJid}`);
        addLog(`📋 Conteúdo que funcionou: ${result.data.workingContent.join(', ')}`);
        addLog(`📋 Message ID: ${result.data.messageId}`);
        addLog(`📋 Todos os resultados: ${JSON.stringify(result.data.allResults, null, 2)}`);
      } else {
        addLog(`❌ Erro no debug: ${JSON.stringify(result, null, 2)}`);
        
        // Se falhar, tentar com endpoint normal
        addLog('🔄 Tentando com endpoint normal...');
        const formData2 = new FormData();
        formData2.append('file', audioBlob, 'recording.webm');
        formData2.append('connectionId', activeConnection.id);
        formData2.append('jid', testJid);
        formData2.append('type', 'audio');

        const response2 = await fetch(`${API_URL}/api/baileys-simple/send-media-optimized`, {
          method: 'POST',
          body: formData2
        });

        const result2 = await response2.json();
        
        if (response2.ok) {
          addLog(`✅ Áudio enviado com endpoint normal: ${JSON.stringify(result2, null, 2)}`);
        } else {
          addLog(`❌ Erro também no endpoint normal: ${JSON.stringify(result2, null, 2)}`);
        }
      }
      
    } catch (error) {
      addLog(`❌ Erro no envio: ${error.message}`);
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4">Teste de Envio de Áudio</h2>
      
      {/* Configuração do JID */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">Configuração do Teste</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={testJid}
            onChange={(e) => setTestJid(e.target.value)}
            placeholder="Número de telefone (ex: 5511999999999)"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
          />
          <Button onClick={testJidValidation} variant="outline">
            Testar JID
          </Button>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Conexão ativa: {activeConnection?.id || 'Nenhuma'}
        </p>
      </div>
      
      {/* Gravação */}
      {!isRecording && !audioBlob && (
        <Button onClick={startRecording} className="w-full mb-4">
          <Mic className="w-4 h-4 mr-2" />
          Iniciar Gravação
        </Button>
      )}
      
      {isRecording && (
        <div className="mb-4 p-4 bg-red-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="font-medium">Gravando: {formatTime(duration)}</span>
            </div>
            <Button onClick={stopRecording} variant="destructive">
              <Square className="w-4 h-4 mr-2" />
              Parar
            </Button>
          </div>
        </div>
      )}
      
      {audioBlob && (
        <div className="mb-4 p-4 bg-green-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4" />
              <span>Áudio gravado: {formatTime(duration)}</span>
            </div>
            <div className="flex gap-2">
              <Button onClick={playAudio} variant="outline" size="sm">
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              <Button 
                onClick={sendAudio} 
                disabled={isSending || !activeConnection?.id}
                className="bg-green-500 hover:bg-green-600"
              >
                {isSending ? 'Enviando...' : 'Enviar Áudio'}
              </Button>
            </div>
          </div>
          
          <div className="text-sm text-gray-600">
            <p>Tamanho: {Math.round(audioBlob.size / 1024)} KB</p>
            <p>Tipo: {audioBlob.type}</p>
          </div>
        </div>
      )}
      
      {/* Logs */}
      <div className="mt-6">
        <h3 className="font-semibold mb-2">Logs de Debug</h3>
        <div className="bg-black text-green-400 p-4 rounded-lg h-64 overflow-y-auto font-mono text-sm">
          {logs.map((log, index) => (
            <div key={index}>{log}</div>
          ))}
        </div>
        <Button 
          onClick={() => setLogs([])} 
          variant="outline" 
          size="sm" 
          className="mt-2"
        >
          Limpar Logs
        </Button>
      </div>
      
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
