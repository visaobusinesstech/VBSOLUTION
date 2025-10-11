import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import env from '../env';
import logger from '../logger';

// Criar diretório de uploads se não existir
const uploadDir = env.UPLOAD_DIR;
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuração de armazenamento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    
    const datePath = path.join(uploadDir, String(year), month, day);
    
    if (!fs.existsSync(datePath)) {
      fs.mkdirSync(datePath, { recursive: true });
    }
    
    cb(null, datePath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// Filtro de tipos de arquivo permitidos
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = [
    // Imagens
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    // Documentos
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    // Áudio
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/ogg',
    'audio/webm',
    // Vídeo (WhatsApp suporta)
    'video/mp4',
    'video/3gpp',
    'video/quicktime'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    logger.warn(`Tipo de arquivo não permitido: ${file.mimetype} - ${file.originalname}`);
    cb(new Error(`Tipo de arquivo não permitido: ${file.mimetype}`));
  }
};

// Configuração do Multer
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB
    files: 1 // 1 arquivo por vez
  }
});

// Middleware para capturar erros do Multer
export const uploadErrorHandler = (error: any, req: any, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'Arquivo muito grande',
        details: 'O tamanho máximo permitido é 25MB'
      });
    }
    
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'Muitos arquivos',
        details: 'Apenas 1 arquivo por vez é permitido'
      });
    }
    
    return res.status(400).json({
      success: false,
      error: 'Erro no upload',
      details: error.message
    });
  }
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Erro no upload',
      details: error.message
    });
  }
  
  next();
};

// Função para gerar URL pública do arquivo
export const getFileUrl = (filePath: string): string => {
  const relativePath = path.relative(uploadDir, filePath);
  return `/uploads/${relativePath.replace(/\\/g, '/')}`;
};

// Função para obter informações do arquivo
export const getFileInfo = (file: Express.Multer.File) => {
  const fileId = path.basename(file.filename, path.extname(file.filename));
  const url = getFileUrl(file.path);
  
  return {
    fileId,
    url,
    mimeType: file.mimetype,
    filename: file.originalname,
    size: file.size
  };
};
