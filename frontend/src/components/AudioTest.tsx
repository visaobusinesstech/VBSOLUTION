"use client";

import React, { useState, useRef } from 'react';
import { Mic, Square, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const AudioTest: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      console.log('🎤 Iniciando teste de gravação...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      // Detectar codec suportado
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/mp4';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = 'audio/wav';
          }
        }
      }
      
      console.log('🎤 Codec selecionado:', mimeType);
      console.log('🎤 Codecs suportados:', {
        'audio/webm;codecs=opus': MediaRecorder.isTypeSupported('audio/webm;codecs=opus'),
        'audio/webm': MediaRecorder.isTypeSupported('audio/webm'),
        'audio/mp4': MediaRecorder.isTypeSupported('audio/mp4'),
        'audio/wav': MediaRecorder.isTypeSupported('audio/wav')
      });
      
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      setDuration(0);
      setIsRecording(true);

      recorder.ondataavailable = (event) => {
        console.log('🎤 Dados recebidos:', event.data.size, 'bytes');
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        console.log('🎤 Parando gravação, chunks:', chunksRef.current.length);
        
        if (chunksRef.current.length > 0) {
          const blob = new Blob(chunksRef.current, { type: mimeType });
          console.log('🎤 Blob criado:', { 
            size: blob.size, 
            type: blob.type,
            chunks: chunksRef.current.length
          });
          
          setAudioBlob(blob);
          const url = URL.createObjectURL(blob);
          setAudioUrl(url);
          
          console.log('🎤 Áudio gravado com sucesso!');
        } else {
          console.warn('⚠️ Nenhum chunk foi capturado');
        }
        
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start(100);
      
      // Timer
      intervalRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('❌ Erro na gravação:', error);
      alert('Erro ao acessar microfone: ' + error.message);
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4">Teste de Gravação de Áudio</h2>
      
      {!isRecording && !audioBlob && (
        <Button onClick={startRecording} className="w-full">
          <Mic className="w-4 h-4 mr-2" />
          Iniciar Gravação
        </Button>
      )}
      
      {isRecording && (
        <div className="space-y-4">
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
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-red-500 h-2 rounded-full transition-all duration-1000"
              style={{ width: `${Math.min((duration / 30) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}
      
      {audioBlob && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4" />
              <span>Áudio gravado: {formatTime(duration)}</span>
            </div>
            <Button onClick={playAudio} variant="outline">
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
          </div>
          
          <div className="text-sm text-gray-600">
            <p>Tamanho: {Math.round(audioBlob.size / 1024)} KB</p>
            <p>Tipo: {audioBlob.type}</p>
          </div>
          
          <Button onClick={() => {
            setAudioBlob(null);
            setAudioUrl(null);
            setDuration(0);
            setIsPlaying(false);
            if (audioUrl) {
              URL.revokeObjectURL(audioUrl);
            }
          }} variant="outline" className="w-full">
            Gravar Novamente
          </Button>
        </div>
      )}
      
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
