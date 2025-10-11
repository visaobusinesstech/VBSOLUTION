import { supabase } from '../supabaseClient';
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

export interface TranscriptionResult {
  success: boolean;
  text?: string;
  error?: string;
  duration?: number;
}

export interface AudioTranscriptionConfig {
  enabled: boolean;
  language: string;
  provider: 'openai' | 'disabled';
  model: string;
  autoSave: boolean;
  maxDuration: number; // em segundos
  fallbackText: string;
}

export class AudioTranscriptionService {
  private openaiApiKey: string;
  private config: AudioTranscriptionConfig;
  private tempDir: string;

  constructor(openaiApiKey: string, config: AudioTranscriptionConfig) {
    this.openaiApiKey = openaiApiKey;
    this.config = config;
    this.tempDir = path.join(process.cwd(), 'uploads', 'temp');
    
    // Garantir que o diretório temp existe
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * Transcreve um áudio usando OpenAI Whisper
   */
  async transcribeAudio(audioUrl: string, ownerId: string): Promise<TranscriptionResult> {
    try {
      // Verificar se a transcrição está habilitada
      if (!this.config.enabled || this.config.provider === 'disabled') {
        console.log('🎵 Transcrição de áudios desabilitada nas configurações');
        return {
          success: true,
          text: this.config.fallbackText
        };
      }

      console.log('🎵 Iniciando transcrição de áudio:', audioUrl);

      // 1. Baixar o arquivo de áudio
      const audioBuffer = await this.downloadAudio(audioUrl);
      if (!audioBuffer) {
        return { success: false, error: 'Falha ao baixar o áudio' };
      }

      // 2. Salvar temporariamente
      const tempFilePath = path.join(this.tempDir, `audio_${Date.now()}.ogg`);
      fs.writeFileSync(tempFilePath, audioBuffer);

      try {
        // 3. Transcrever usando OpenAI Whisper
        const transcription = await this.callWhisperAPI(tempFilePath);
        
        if (transcription.success && transcription.text) {
          console.log('✅ Transcrição concluída:', transcription.text);
          
          // 4. Salvar transcrição no banco de dados
          await this.saveTranscriptionToDatabase(ownerId, audioUrl, transcription.text);
          
          return {
            success: true,
            text: transcription.text,
            duration: transcription.duration
          };
        } else {
          return { success: false, error: transcription.error || 'Erro na transcrição' };
        }
      } finally {
        // 5. Limpar arquivo temporário
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
      }
    } catch (error) {
      console.error('❌ Erro na transcrição:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }

  /**
   * Baixa o arquivo de áudio da URL
   */
  private async downloadAudio(audioUrl: string): Promise<Buffer | null> {
    try {
      const response = await axios.get(audioUrl, {
        responseType: 'arraybuffer',
        timeout: 30000 // 30 segundos
      });
      
      return Buffer.from(response.data);
    } catch (error) {
      console.error('❌ Erro ao baixar áudio:', error);
      return null;
    }
  }

  /**
   * Chama a API do OpenAI Whisper
   */
  private async callWhisperAPI(filePath: string): Promise<TranscriptionResult> {
    try {
      const formData = new FormData();
      formData.append('file', fs.createReadStream(filePath));
      formData.append('model', this.config.model);
      formData.append('language', this.config.language.split('-')[0]); // pt-BR -> pt
      formData.append('response_format', 'json');

      const response = await axios.post(
        'https://api.openai.com/v1/audio/transcriptions',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${this.openaiApiKey}`,
            ...formData.getHeaders()
          },
          timeout: 60000 // 60 segundos
        }
      );

      return {
        success: true,
        text: response.data.text,
        duration: response.data.duration
      };
    } catch (error) {
      console.error('❌ Erro na API Whisper:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro na API Whisper'
      };
    }
  }

  /**
   * Salva a transcrição no banco de dados
   */
  private async saveTranscriptionToDatabase(
    ownerId: string, 
    audioUrl: string, 
    transcription: string
  ): Promise<void> {
    try {
      // Verificar se deve salvar automaticamente
      if (!this.config.autoSave) {
        console.log('🎵 Auto-save desabilitado, não salvando transcrição no banco');
        return;
      }

      // Buscar a mensagem de áudio correspondente
      const { data: audioMessage, error: findError } = await supabase
        .from('whatsapp_mensagens')
        .select('*')
        .eq('media_url', audioUrl)
        .eq('owner_id', ownerId)
        .eq('message_type', 'AUDIO')
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      if (findError || !audioMessage) {
        console.error('❌ Mensagem de áudio não encontrada:', findError);
        return;
      }

      // Atualizar a mensagem com a transcrição
      const updateData: any = {
        transcription: transcription,
        transcription_status: 'completed',
        transcription_updated_at: new Date().toISOString()
      };

      // Se autoSave está habilitado, atualizar também o conteudo
      if (this.config.autoSave) {
        updateData.conteudo = `[Áudio transcrito] ${transcription}`;
      }

      const { error: updateError } = await supabase
        .from('whatsapp_mensagens')
        .update(updateData)
        .eq('id', audioMessage.id);

      if (updateError) {
        console.error('❌ Erro ao salvar transcrição:', updateError);
      } else {
        console.log('✅ Transcrição salva no banco de dados');
      }
    } catch (error) {
      console.error('❌ Erro ao salvar transcrição no banco:', error);
    }
  }

  /**
   * Verifica se o áudio precisa ser transcrito
   */
  async shouldTranscribe(audioUrl: string, ownerId: string): Promise<boolean> {
    try {
      const { data: existingMessage } = await supabase
        .from('whatsapp_mensagens')
        .select('transcription_status, transcription')
        .eq('media_url', audioUrl)
        .eq('owner_id', ownerId)
        .eq('message_type', 'AUDIO')
        .single();

      // Se já tem transcrição ou está em processo, não transcrever novamente
      return !existingMessage || 
             (!existingMessage.transcription_status || 
              existingMessage.transcription_status === 'pending');
    } catch (error) {
      console.error('❌ Erro ao verificar status da transcrição:', error);
      return true; // Em caso de erro, tentar transcrever
    }
  }
}

export default AudioTranscriptionService;
