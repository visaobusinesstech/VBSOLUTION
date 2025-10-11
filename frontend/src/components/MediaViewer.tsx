"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { X, Download, Play, Pause } from 'lucide-react';

interface MediaViewerProps {
  type: 'IMAGEM' | 'AUDIO' | 'VIDEO' | 'DOCUMENTO' | 'STICKER';
  mediaUrl: string;
  mediaMime?: string;
  fileName?: string;
  duration?: number;
}

export default function MediaViewer({
  type,
  mediaUrl,
  mediaMime,
  fileName,
  duration
}: MediaViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Reset error state when mediaUrl changes
  useEffect(() => {
    setHasError(false);
    setIsLoading(false);
  }, [mediaUrl]);

  // CRITICAL: Validate URL before rendering to prevent 404 spam
  if (!mediaUrl || 
      mediaUrl === 'undefined' || 
      mediaUrl === 'null' || 
      mediaUrl === '' ||
      mediaUrl.includes('localhost:3000/api/media') ||
      mediaUrl.includes('/mmg') || 
      mediaUrl.endsWith('mmg') ||
      mediaUrl.includes(';%20codecs') || 
      mediaUrl.includes('codecs=opus') ||
      mediaUrl.includes('web.whatsapp.net') || 
      mediaUrl.includes('mmg.whatsapp.net') ||
      !mediaUrl.startsWith('http')) {
    return (
      <div className="p-2 bg-gray-100 rounded text-xs text-gray-500 max-w-[200px]">
        [Mídia não disponível]
      </div>
    );
  }

  // Verificar se é um hash de mídia
  const isMediaHash = mediaUrl?.startsWith('media:');
  const mediaHash = isMediaHash ? mediaUrl.replace('media:', '') : null;
  
  // Debug: Log para verificar URLs (comentado para reduzir spam)
  // console.log('MediaViewer Debug:', { type, mediaUrl, isMediaHash, mediaHash });

  // Obter URL da mídia (priorizar URL real do Supabase/WhatsApp) - memoizado para evitar re-renders
  const mediaUrlResolved = useMemo(() => {
    // Se temos uma URL real SUPABASE ou Valida do backend, usar ela diretamente
    if (mediaUrl && mediaUrl.startsWith('http')) {
      // Verificar se é uma URL inválida como web.whatsapp.net ou similar
      if (mediaUrl.includes('web.whatsapp.net') || 
          mediaUrl.includes('mmg.whatsapp.net') ||
          mediaUrl.includes('.whatsapp.net/')) {
        // Tentar usar o hash API diretamente
        const match = mediaUrl.match(/\/([A-Za-z0-9_-]+)\./);
        if (match && match[1]) {
          const hash = match[1];
          return `http://localhost:3000/api/media/${hash}`;
        }
        return null;
      }
      
      // URLs válidas (Supabase, backend API, outros domínios)
      if (mediaUrl.includes('supabase.co') || 
          mediaUrl.includes('localhost') ||
          mediaUrl.includes('api/media') ||
          (!mediaUrl.includes('whatsapp.net'))) {
        return mediaUrl;
      }
    }
    
    // Se é um hash, tentar buscar via API
    if (isMediaHash && mediaHash) {
      return `http://localhost:3000/api/media/${mediaHash}`;
    }
    
    return null;
  }, [mediaUrl, isMediaHash, mediaHash]);

  const handleImageClick = useCallback(() => {
    if (type === 'IMAGEM' || type === 'STICKER') {
      setIsFullscreen(true);
    }
  }, [type]);

  const handleDownload = useCallback(() => {
    if (mediaUrlResolved) {
      const link = document.createElement('a');
      link.href = mediaUrlResolved;
      link.download = fileName || `media_${Date.now()}`;
      link.click();
    }
  }, [mediaUrlResolved, fileName]);

  // Função para buscar mídia por hash
  const fetchMediaByHash = async (hash: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:3000/api/media/${hash}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        return url;
      }
    } catch (error) {
      console.error('Erro ao buscar mídia:', error);
    } finally {
      setIsLoading(false);
    }
    return null;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderMedia = useMemo(() => {
    switch (type) {
      case 'IMAGEM':
        if (!mediaUrlResolved || hasError) {
          return (
            <div className="bg-gray-100 rounded-lg p-2 text-center max-w-xs">
              <div className="text-xs text-gray-500">Imagem não disponível</div>
            </div>
          );
        }
        
        return (
          <div className="relative">
            <img
              src={mediaUrlResolved}
              alt="Imagem"
              className="max-w-xs h-auto rounded-lg cursor-pointer"
              onClick={handleImageClick}
              onLoad={() => {
                setIsLoading(false);
                setHasError(false);
              }}
              onLoadStart={() => setIsLoading(true)}
              onError={(e) => {
                // Silent: Erro ao carregar imagem
                // Silent: URL da imagem
                setIsLoading(false);
                setHasError(true);
              }}
            />
            {hasError && !isLoading && (
              <div className="bg-red-100 rounded-lg p-2 text-center max-w-xs">
                <div className="text-xs text-red-600">❌ Erro ao carregar imagem</div>
                <div className="text-xs text-red-500 mt-1">URL não acessível</div>
              </div>
            )}
            {isLoading && (
              <div className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
        );

      case 'AUDIO':
        return <WhatsAppAudioPlayer 
          mediaUrl={mediaUrlResolved} 
          mediaMime={mediaMime} 
          duration={duration}
          onError={(e) => {
            setHasError(true);
            // Silent error - don't log to console
          }}
        />;

      case 'VIDEO':
        return <WhatsAppVideoPlayer 
          mediaUrl={mediaUrlResolved} 
          mediaMime={mediaMime}
          onError={(e) => {
            setHasError(true);
            // Silent error - don't log to console
          }}
        />;

      case 'STICKER':
        if (!mediaUrlResolved || hasError) {
          return (
            <div className="bg-gray-100 rounded-lg p-2 text-center max-w-32">
              <div className="text-xs text-gray-500">Sticker não disponível</div>
            </div>
          );
        }
        
        return (
          <div className="relative">
            <img
              src={mediaUrlResolved}
              alt="Sticker"
              className="max-w-32 h-auto rounded-lg cursor-pointer hover:scale-105 transition-transform duration-200"
              onClick={handleImageClick}
              onLoad={() => {
                setIsLoading(false);
                setHasError(false);
              }}
              onLoadStart={() => setIsLoading(true)}
              onError={(e) => {
                // Silent: Erro ao carregar sticker
                // Silent: URL do sticker
                setIsLoading(false);
                setHasError(true);
              }}
            />
            {hasError && !isLoading && (
              <div className="bg-red-100 rounded-lg p-2 text-center max-w-32">
                <div className="text-xs text-red-600">❌ Erro ao carregar sticker</div>
                <div className="text-xs text-red-500 mt-1">URL não acessível</div>
              </div>
            )}
            {isLoading && (
              <div className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            {/* Botão de download para sticker - apenas quando carregado com sucesso */}
            {!hasError && !isLoading && (
              <button
                onClick={handleDownload}
                className="absolute top-1 right-1 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 transition-colors opacity-0 hover:opacity-100"
                title="Baixar sticker"
              >
                <Download className="h-3 w-3" />
              </button>
            )}
          </div>
        );

      case 'DOCUMENTO':
        return (
          <div className="bg-gray-100 rounded-lg p-3 flex items-center gap-3">
            <div className="bg-gray-300 text-gray-700 p-2 rounded">
              📄
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{fileName || 'Documento'}</p>
              <p className="text-xs text-gray-500">{mediaMime}</p>
            </div>
            <button
              onClick={handleDownload}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <Download className="h-4 w-4" />
            </button>
          </div>
        );

      default:
        return (
          <div className="bg-gray-100 rounded-lg p-4 text-center">
            <p className="text-gray-500">Tipo de mídia não suportado</p>
          </div>
        );
    }
  }, [type, mediaUrlResolved, hasError, isLoading, mediaMime, duration, fileName, handleImageClick, handleDownload]);

  return (
    <>
      {renderMedia}
      
      {/* Modal de visualização de imagem/sticker em tela cheia */}
      {isFullscreen && (type === 'IMAGEM' || type === 'STICKER') && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
          >
            <X className="h-8 w-8" />
          </button>
          <div className="max-w-full max-h-full">
            <img
              src={mediaUrlResolved}
              alt="Imagem em tela cheia"
              className="max-w-full max-h-full object-contain"
            />
          </div>
          <button
            onClick={handleDownload}
            className="absolute bottom-4 right-4 bg-white/20 text-white p-3 rounded-full hover:bg-white/30 transition-colors"
          >
            <Download className="h-6 w-6" />
          </button>
        </div>
      )}
    </>
  );
}

// Componente de Player de Áudio estilo WhatsApp
function WhatsAppAudioPlayer({ 
  mediaUrl, 
  mediaMime, 
  duration, 
  onError 
}: { 
  mediaUrl: string | null; 
  mediaMime?: string; 
  duration?: number; 
  onError: () => void;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration || 0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedTooltip, setShowSpeedTooltip] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [audioLoadTimeout, setAudioLoadTimeout] = useState<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [waveformData, setWaveformData] = useState<number[]>([]);

  // Gerar dados de waveform simulados
  useEffect(() => {
    if (audioDuration > 0) {
      const bars = 20;
      const data = Array.from({ length: bars }, () => Math.random() * 0.8 + 0.2);
      setWaveformData(data);
    }
  }, [audioDuration]);

  // Timeout de fallback para áudio
  useEffect(() => {
    if (isLoading && mediaUrl) {
      const timeout = setTimeout(() => {
        // Timeout de carregamento atingido
        setIsLoading(false);
        setHasError(false);
      }, 5000); // 5 segundos timeout para áudio
      
      setAudioLoadTimeout(timeout);
      
      return () => {
        if (timeout) {
          clearTimeout(timeout);
        }
      };
    }
  }, [isLoading, mediaUrl]);

  // Limpar timeout quando componente desmonta
  useEffect(() => {
    return () => {
      if (audioLoadTimeout) {
        clearTimeout(audioLoadTimeout);
      }
    };
  }, [audioLoadTimeout]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(error => {
          // Silent: Erro ao reproduzir áudio
          setHasError(true);
          onError();
        });
      }
    }
  };

  const handleSpeedChange = () => {
    if (audioRef.current) {
      const newRate = playbackRate === 1 ? 1.5 : playbackRate === 1.5 ? 2 : 1;
      setPlaybackRate(newRate);
      audioRef.current.playbackRate = newRate;
      // Velocidade alterada
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (audioRef.current && audioDuration > 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = clickX / rect.width;
      const newTime = percentage * audioDuration;
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const progressPercentage = audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0;

  // Verificar se a URL é válida
  if (!mediaUrl) {
    return (
      <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl px-6 py-4 flex items-center gap-4 max-w-md shadow-lg">
        <div className="flex-shrink-0 w-12 h-12 bg-gray-400 text-white rounded-full flex items-center justify-center">
          <Pause className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="text-base text-gray-600 dark:text-gray-400 font-medium">Áudio não disponível</div>
          <div className="text-sm text-gray-500 dark:text-gray-500 truncate">
            URL não encontrada
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl px-6 py-4 flex items-center gap-4 max-w-md shadow-lg">
      {/* Play/Pause Button */}
      <button
        onClick={handlePlayPause}
        className="flex-shrink-0 w-12 h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-colors shadow-md"
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : isPlaying ? (
          <Pause className="h-5 w-5" />
        ) : (
          <Play className="h-5 w-5 ml-0.5" />
        )}
      </button>

      {/* Audio Element (Hidden) */}
      <audio
        ref={audioRef}
        src={mediaUrl}
        onPlay={() => {
          // Áudio iniciado
          setIsPlaying(true);
          setHasError(false);
        }}
        onPause={() => {
          
          setIsPlaying(false);
        }}
        onTimeUpdate={(e) => {
          const audio = e.currentTarget;
          setCurrentTime(audio.currentTime);
        }}
        onLoadedMetadata={(e) => {
          const audio = e.currentTarget;
          setAudioDuration(audio.duration);
          setIsLoading(false);
          setHasError(false);
          if (audioLoadTimeout) {
            clearTimeout(audioLoadTimeout);
            setAudioLoadTimeout(null);
          }
          // Metadados carregados
        }}
        onError={(e) => {
          setIsLoading(false);
          setHasError(true);
          onError();
        }}
        onLoadStart={() => {
          
          setIsLoading(true);
          setHasError(false);
        }}
        onCanPlay={() => {
          
          setIsLoading(false);
          setHasError(false);
          if (audioLoadTimeout) {
            clearTimeout(audioLoadTimeout);
            setAudioLoadTimeout(null);
          }
        }}
        onLoadedData={() => {
          
          setIsLoading(false);
          setHasError(false);
          if (audioLoadTimeout) {
            clearTimeout(audioLoadTimeout);
            setAudioLoadTimeout(null);
          }
        }}
        onCanPlayThrough={() => {
          
          setIsLoading(false);
          setHasError(false);
          if (audioLoadTimeout) {
            clearTimeout(audioLoadTimeout);
            setAudioLoadTimeout(null);
          }
        }}
        onSuspend={() => {
          
          setIsLoading(false);
          setHasError(false);
          if (audioLoadTimeout) {
            clearTimeout(audioLoadTimeout);
            setAudioLoadTimeout(null);
          }
        }}
        className="hidden"
        preload="metadata"
        crossOrigin="anonymous"
      >
        <source src={mediaUrl} type={mediaMime || 'audio/ogg'} />
        <source src={mediaUrl} type="audio/webm" />
        <source src={mediaUrl} type="audio/mpeg" />
        <source src={mediaUrl} type="audio/wav" />
        Seu navegador não suporta o elemento de áudio.
      </audio>

      {/* Waveform Visualization */}
      <div className="flex-1 min-w-0">
        {/* Waveform Bars */}
        <div className="flex items-center justify-center h-8 mb-3">
          <div className="flex items-center space-x-1">
            {waveformData.map((height, i) => {
              const isActive = (i / waveformData.length) * 100 <= progressPercentage;
              return (
                <div
                  key={i}
                  className={`w-1 rounded-full transition-all duration-150 ${
                    isActive 
                      ? 'bg-blue-500' 
                      : 'bg-gray-400 dark:bg-gray-500'
                  }`}
                  style={{
                    height: `${height * 28 + 8}px`,
                    animation: isPlaying && isActive
                      ? `waveform ${0.5 + Math.random() * 0.5}s ease-in-out infinite alternate`
                      : 'none'
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Progress Bar */}
        <div 
          className="relative h-2 bg-gray-300 dark:bg-gray-600 rounded-full cursor-pointer mb-3"
          onClick={handleSeek}
        >
          <div 
            className="absolute top-0 left-0 h-full bg-blue-500 rounded-full transition-all duration-100"
            style={{ width: `${progressPercentage}%` }}
          />
          <div 
            className="absolute top-1/2 transform -translate-y-1/2 w-4 h-4 bg-blue-500 rounded-full shadow-md"
            style={{ left: `calc(${progressPercentage}% - 8px)` }}
          />
        </div>

        {/* Time and Speed Controls */}
        <div className="flex items-center justify-between text-sm text-gray-700 dark:text-gray-300">
          <span className="font-mono font-medium">
            {formatDuration(Math.floor(currentTime))}
          </span>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={handleSpeedChange}
                onMouseEnter={() => setShowSpeedTooltip(true)}
                onMouseLeave={() => setShowSpeedTooltip(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 rounded-full text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-300"
                title={`Velocidade atual: ${playbackRate}x. Clique para alterar.`}
              >
                {playbackRate}x
              </button>
              
              {/* Tooltip de velocidade */}
              {showSpeedTooltip && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg shadow-lg whitespace-nowrap z-10">
                  Velocidade: {playbackRate}x
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                </div>
              )}
            </div>
            
            {/* Botão de Download */}
            <button
              onClick={() => {
                if (mediaUrl) {
                  const link = document.createElement('a');
                  link.href = mediaUrl;
                  link.download = `audio_${Date.now()}.ogg`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  
                }
              }}
              className="p-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 rounded-full transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-300"
              title="Baixar áudio"
            >
              <Download className="h-4 w-4" />
            </button>
          </div>
          <span className="font-mono font-medium">
            {formatDuration(Math.floor(audioDuration))}
          </span>
        </div>
      </div>

      {/* Error State */}
      {hasError && (
        <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <div className="text-sm text-red-600 dark:text-red-400 font-medium">Áudio não disponível</div>
        </div>
      )}
    </div>
  );
}

// Componente de Player de Vídeo estilo WhatsApp
function WhatsAppVideoPlayer({ 
  mediaUrl, 
  mediaMime,
  onError 
}: { 
  mediaUrl: string | null; 
  mediaMime?: string; 
  onError: () => void;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Começar como false
  const [hasError, setHasError] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [loadTimeout, setLoadTimeout] = useState<NodeJS.Timeout | null>(null);
  const [hasStartedLoading, setHasStartedLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(error => {
          // Silent: Erro ao reproduzir vídeo
          setHasError(true);
          onError();
        });
      }
    }
  };

  const handleVideoClick = () => {
    handlePlayPause();
  };

  const handleMuteToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
      
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current && duration > 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = clickX / rect.width;
      const newTime = percentage * duration;
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Detectar tipo de vídeo baseado na URL e MIME type
  const detectVideoType = (url: string) => {
    // Se temos um MIME type válido, usar ele
    if (mediaMime && mediaMime.startsWith('video/')) {
      return mediaMime;
    }
    
    // Detectar por extensão na URL
    if (url.includes('.webm')) return 'video/webm';
    if (url.includes('.mov')) return 'video/quicktime';
    if (url.includes('.avi')) return 'video/avi';
    if (url.includes('.mp4')) return 'video/mp4';
    
    // URLs do WhatsApp geralmente são MP4
    if (url.includes('whatsapp.net')) {
      return 'video/mp4';
    }
    
    // Padrão para Supabase e outras URLs
    return 'video/mp4';
  };

  // Timeout para evitar carregamento infinito
  useEffect(() => {
    if (isLoading && mediaUrl && hasStartedLoading) {
      const timeout = setTimeout(() => {
        
        setIsLoading(false);
        setHasError(true);
      }, 15000); // 15 segundos timeout para vídeo
      
      setLoadTimeout(timeout);
      
      return () => {
        if (timeout) {
          clearTimeout(timeout);
        }
      };
    }
  }, [isLoading, mediaUrl, hasStartedLoading]);

  // Limpar timeout quando componente desmonta
  useEffect(() => {
    return () => {
      if (loadTimeout) {
        clearTimeout(loadTimeout);
      }
    };
  }, [loadTimeout]);

  // Tentar carregar o vídeo automaticamente quando o componente monta
  useEffect(() => {
    if (mediaUrl && videoRef.current && !hasStartedLoading) {
      
      setHasStartedLoading(true);
      setIsLoading(true);
      setHasError(false);
      
      // Forçar o carregamento do vídeo
      videoRef.current.load();
    }
  }, [mediaUrl, hasStartedLoading]);

  // Verificar se a URL é válida
  if (!mediaUrl) {
    return (
      <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 text-center max-w-xs">
        <div className="text-sm text-gray-600 dark:text-gray-400">Vídeo não disponível</div>
        <div className="text-xs text-gray-500 dark:text-gray-500 truncate">
          URL não encontrada
        </div>
      </div>
    );
  }

  return (
    <div 
      className="relative bg-black rounded-lg overflow-hidden max-w-xs cursor-pointer group"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={mediaUrl}
        onClick={handleVideoClick}
        onPlay={() => {
          
          setIsPlaying(true);
          setHasError(false);
          if (loadTimeout) {
            clearTimeout(loadTimeout);
            setLoadTimeout(null);
          }
        }}
        onPause={() => {
          
          setIsPlaying(false);
        }}
        onTimeUpdate={(e) => {
          const video = e.currentTarget;
          setCurrentTime(video.currentTime);
        }}
        onLoadedMetadata={(e) => {
          const video = e.currentTarget;
          setDuration(video.duration);
          // Metadados carregados
        }}
        onError={(e) => {
          setIsLoading(false);
          setHasError(true);
          if (loadTimeout) {
            clearTimeout(loadTimeout);
            setLoadTimeout(null);
          }
          onError();
        }}
        onLoadStart={() => {
          
          setIsLoading(true);
          setHasError(false);
          setHasStartedLoading(true);
        }}
        onCanPlay={() => {
          
          setIsLoading(false);
          setHasError(false);
          if (loadTimeout) {
            clearTimeout(loadTimeout);
            setLoadTimeout(null);
          }
        }}
        onLoadedData={() => {
          
          setIsLoading(false);
          if (loadTimeout) {
            clearTimeout(loadTimeout);
            setLoadTimeout(null);
          }
        }}
        onCanPlayThrough={() => {
          
          setIsLoading(false);
          setHasError(false);
          if (loadTimeout) {
            clearTimeout(loadTimeout);
            setLoadTimeout(null);
          }
        }}
        onProgress={() => {
          // Quando há progresso no carregamento, remover erro se existir
          if (hasError) {
            
            setHasError(false);
          }
        }}
        className="w-full h-auto max-h-64 object-cover"
        preload="metadata"
        crossOrigin="anonymous"
        muted={isMuted}
        playsInline
        controls={false}
        type={detectVideoType(mediaUrl)}
      >
        Seu navegador não suporta o elemento de vídeo.
      </video>

      {/* Play/Pause Overlay */}
      {(showControls || !isPlaying) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <button
            onClick={handlePlayPause}
            className="w-12 h-12 bg-white/90 hover:bg-white text-gray-800 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-gray-800 border-t-transparent rounded-full animate-spin" />
            ) : isPlaying ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6 ml-1" />
            )}
          </button>
        </div>
      )}

      {/* Controles de vídeo */}
      {showControls && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
          {/* Barra de progresso */}
          <div 
            className="relative h-1 bg-white/30 rounded-full cursor-pointer mb-2"
            onClick={handleSeek}
          >
            <div 
              className="absolute top-0 left-0 h-full bg-white rounded-full transition-all duration-100"
              style={{ width: `${progressPercentage}%` }}
            />
            <div 
              className="absolute top-1/2 transform -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-sm"
              style={{ left: `calc(${progressPercentage}% - 6px)` }}
            />
          </div>
          
          {/* Controles inferiores */}
          <div className="flex items-center justify-between text-white text-sm">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePlayPause}
                className="p-1 hover:bg-white/20 rounded transition-colors"
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4 ml-0.5" />
                )}
              </button>
              
              <button
                onClick={handleMuteToggle}
                className="p-1 hover:bg-white/20 rounded transition-colors"
                title={isMuted ? 'Ativar áudio' : 'Desativar áudio'}
              >
                {isMuted ? (
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L5.5 14H3a1 1 0 01-1-1V7a1 1 0 011-1h2.5l2.883-2.793a1 1 0 011.617.793zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L5.5 14H3a1 1 0 01-1-1V7a1 1 0 011-1h2.5l2.883-2.793a1 1 0 011.617.793zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
              
              {/* Botão de Download */}
              <button
                onClick={() => {
                  if (mediaUrl) {
                    const link = document.createElement('a');
                    link.href = mediaUrl;
                    link.download = `video_${Date.now()}.mp4`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    
                  }
                }}
                className="p-1 hover:bg-white/20 rounded transition-colors"
                title="Baixar vídeo"
              >
                <Download className="h-4 w-4" />
              </button>
            </div>
            
            <div className="text-xs font-mono">
              {formatDuration(Math.floor(currentTime))} / {formatDuration(Math.floor(duration))}
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-center text-white">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <div className="text-sm font-medium">Carregando vídeo...</div>
            <div className="text-xs text-gray-300 mt-1">Aguarde alguns segundos</div>
          </div>
        </div>
      )}

      {/* Error State */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
          <div className="text-center text-white p-4">
            <div className="text-sm font-medium">Vídeo não disponível</div>
            <div className="text-xs text-gray-300 mt-1">Erro ao carregar o vídeo</div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => {
                  
                  setHasError(false);
                  setIsLoading(true);
                  setHasStartedLoading(true);
                  if (videoRef.current) {
                    videoRef.current.load();
                  }
                }}
                className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded transition-colors"
              >
                Tentar novamente
              </button>
              <button
                onClick={() => {
                  if (mediaUrl) {
                    const link = document.createElement('a');
                    link.href = mediaUrl;
                    link.download = `video_${Date.now()}.mp4`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    
                  }
                }}
                className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-xs rounded transition-colors"
              >
                Baixar mesmo assim
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
