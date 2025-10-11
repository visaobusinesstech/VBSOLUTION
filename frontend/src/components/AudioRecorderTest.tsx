"use client";

import React, { useState, useRef } from 'react';
import { Mic, Square, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const AudioRecorderTest: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const startRecording = async () => {
    try {
      setError(null);
      console.log('🎤 [TEST] Iniciando gravação...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      console.log('🎤 [TEST] Stream obtido:', stream);
      
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
      
      console.log('🎤 [TEST] Codec selecionado:', mimeType);
      
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      
      recorder.ondataavailable = (event) => {
        console.log('🎤 [TEST] Dados recebidos:', event.data.size, 'bytes');
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      recorder.onstop = () => {
        console.log('🎤 [TEST] Gravação parada, chunks:', audioChunksRef.current.length);
        
        if (audioChunksRef.current.length > 0) {
          const blob = new Blob(audioChunksRef.current, { type: mimeType });
          console.log('🎤 [TEST] Blob criado:', blob.size, 'bytes');
          
          setAudioBlob(blob);
          const url = URL.createObjectURL(blob);
          setAudioUrl(url);
          
          // Parar todas as tracks
          stream.getTracks().forEach(track => track.stop());
          
          console.log('✅ [TEST] Áudio gravado com sucesso!');
        } else {
          setError('Nenhum áudio foi gravado');
        }
      };
      
      recorder.start(100);
      setIsRecording(true);
      
    } catch (error: any) {
      console.error('❌ [TEST] Erro:', error);
      setError(`Erro: ${error.name} - ${error.message}`);
    }
  };

  const stopRecording = () => {
    console.log('🛑 [TEST] Parando gravação...');
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
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

  const reset = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setIsPlaying(false);
    setIsRecording(false);
    setError(null);
    audioChunksRef.current = [];
    mediaRecorderRef.current = null;
    
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4 text-center">Teste de Gravação de Áudio</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded text-red-700">
          {error}
        </div>
      )}
      
      <div className="space-y-4">
        {!isRecording && !audioBlob && (
          <Button
            onClick={startRecording}
            className="w-full bg-red-500 hover:bg-red-600 text-white"
          >
            <Mic className="w-4 h-4 mr-2" />
            Iniciar Gravação
          </Button>
        )}
        
        {isRecording && (
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Gravando...</span>
            </div>
            <Button
              onClick={stopRecording}
              className="bg-gray-500 hover:bg-gray-600 text-white"
            >
              <Square className="w-4 h-4 mr-2" />
              Parar Gravação
            </Button>
          </div>
        )}
        
        {audioBlob && (
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">
              Áudio gravado: {(audioBlob.size / 1024).toFixed(1)} KB
            </p>
            <div className="flex gap-2 justify-center">
              <Button
                onClick={playAudio}
                variant="outline"
                size="sm"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              <Button
                onClick={reset}
                variant="outline"
                size="sm"
              >
                Testar Novamente
              </Button>
            </div>
          </div>
        )}
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
