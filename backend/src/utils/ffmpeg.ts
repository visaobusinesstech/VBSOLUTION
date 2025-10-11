import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

export interface AudioConversionOptions {
  inputPath: string;
  outputPath: string;
  codec?: string;
  channels?: number;
  sampleRate?: number;
  bitrate?: string;
}

export class FFmpegConverter {
  private static instance: FFmpegConverter;
  private isAvailable: boolean = false;

  private constructor() {
    this.checkFFmpegAvailability();
  }

  public static getInstance(): FFmpegConverter {
    if (!FFmpegConverter.instance) {
      FFmpegConverter.instance = new FFmpegConverter();
    }
    return FFmpegConverter.instance;
  }

  private async checkFFmpegAvailability(): Promise<void> {
    try {
      await execAsync('ffmpeg -version');
      this.isAvailable = true;
      console.log('✅ FFmpeg está disponível');
    } catch (error) {
      this.isAvailable = false;
      console.warn('⚠️ FFmpeg não está disponível. Conversão de áudio será limitada.');
    }
  }

  public isFFmpegAvailable(): boolean {
    return this.isAvailable;
  }

  /**
   * Converte áudio para formato OGG/Opus compatível com WhatsApp
   */
  public async convertToWhatsAppAudio(options: AudioConversionOptions): Promise<string> {
    if (!this.isAvailable) {
      throw new Error('FFmpeg não está disponível');
    }

    const {
      inputPath,
      outputPath,
      codec = 'libopus',
      channels = 1,
      sampleRate = 48000,
      bitrate = '64k'
    } = options;

    // Verificar se o arquivo de entrada existe
    if (!fs.existsSync(inputPath)) {
      throw new Error(`Arquivo de entrada não encontrado: ${inputPath}`);
    }

    // Criar diretório de saída se não existir
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Comando FFmpeg para conversão otimizada para WhatsApp
    const command = `ffmpeg -i "${inputPath}" -c:a ${codec} -ac ${channels} -ar ${sampleRate} -b:a ${bitrate} -avoid_negative_ts make_zero -y "${outputPath}"`;

    console.log('🔄 Convertendo áudio com FFmpeg:', command);

    try {
      const { stdout, stderr } = await execAsync(command);
      
      if (stderr && stderr.includes('error')) {
        console.error('❌ Erro no FFmpeg:', stderr);
        throw new Error(`Erro na conversão: ${stderr}`);
      }

      // Verificar se o arquivo de saída foi criado
      if (!fs.existsSync(outputPath)) {
        throw new Error('Arquivo de saída não foi criado');
      }

      console.log('✅ Áudio convertido com sucesso:', outputPath);
      return outputPath;

    } catch (error) {
      console.error('❌ Erro ao converter áudio:', error);
      throw error;
    }
  }

  /**
   * Converte vídeo para formato compatível com WhatsApp
   */
  public async convertToWhatsAppVideo(options: {
    inputPath: string;
    outputPath: string;
    maxSize?: string;
    quality?: number;
  }): Promise<string> {
    if (!this.isAvailable) {
      throw new Error('FFmpeg não está disponível');
    }

    const {
      inputPath,
      outputPath,
      maxSize = '720x1280', // Resolução máxima para WhatsApp
      quality = 23 // Qualidade CRF (0-51, menor = melhor qualidade)
    } = options;

    if (!fs.existsSync(inputPath)) {
      throw new Error(`Arquivo de entrada não encontrado: ${inputPath}`);
    }

    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Comando FFmpeg para vídeo otimizado para WhatsApp
    const command = `ffmpeg -i "${inputPath}" -c:v libx264 -crf ${quality} -vf "scale='min(${maxSize},iw)':'min(${maxSize},ih)':force_original_aspect_ratio=decrease" -c:a aac -b:a 128k -movflags +faststart -y "${outputPath}"`;

    console.log('🔄 Convertendo vídeo com FFmpeg:', command);

    try {
      const { stdout, stderr } = await execAsync(command);
      
      if (stderr && stderr.includes('error')) {
        console.error('❌ Erro no FFmpeg:', stderr);
        throw new Error(`Erro na conversão: ${stderr}`);
      }

      if (!fs.existsSync(outputPath)) {
        throw new Error('Arquivo de saída não foi criado');
      }

      console.log('✅ Vídeo convertido com sucesso:', outputPath);
      return outputPath;

    } catch (error) {
      console.error('❌ Erro ao converter vídeo:', error);
      throw error;
    }
  }

  /**
   * Obtém informações sobre um arquivo de mídia
   */
  public async getMediaInfo(filePath: string): Promise<{
    duration: number;
    format: string;
    codec: string;
    bitrate: number;
    sampleRate?: number;
    channels?: number;
    width?: number;
    height?: number;
  }> {
    if (!this.isAvailable) {
      throw new Error('FFmpeg não está disponível');
    }

    const command = `ffprobe -v quiet -print_format json -show_format -show_streams "${filePath}"`;

    try {
      const { stdout } = await execAsync(command);
      const info = JSON.parse(stdout);

      const format = info.format;
      const videoStream = info.streams.find((s: any) => s.codec_type === 'video');
      const audioStream = info.streams.find((s: any) => s.codec_type === 'audio');

      return {
        duration: parseFloat(format.duration) || 0,
        format: format.format_name || 'unknown',
        codec: videoStream?.codec_name || audioStream?.codec_name || 'unknown',
        bitrate: parseInt(format.bit_rate) || 0,
        sampleRate: audioStream ? parseInt(audioStream.sample_rate) : undefined,
        channels: audioStream ? parseInt(audioStream.channels) : undefined,
        width: videoStream ? parseInt(videoStream.width) : undefined,
        height: videoStream ? parseInt(videoStream.height) : undefined,
      };

    } catch (error) {
      console.error('❌ Erro ao obter informações da mídia:', error);
      throw error;
    }
  }

  /**
   * Limpa arquivos temporários
   */
  public async cleanupTempFiles(filePaths: string[]): Promise<void> {
    for (const filePath of filePaths) {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log('🗑️ Arquivo temporário removido:', filePath);
        }
      } catch (error) {
        console.warn('⚠️ Erro ao remover arquivo temporário:', filePath, error);
      }
    }
  }
}

export default FFmpegConverter;
