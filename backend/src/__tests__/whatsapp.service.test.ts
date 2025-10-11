import { WhatsAppService } from '../services/whatsapp.service';
import { PrismaClient } from '@prisma/client';

// Mock do Prisma
const mockPrisma = {
  atendimento: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  mensagem: {
    create: jest.fn(),
  },
} as any;

// Mock do Socket.IO
const mockIO = {
  to: jest.fn().mockReturnValue({
    emit: jest.fn(),
  }),
} as any;

describe('WhatsAppService', () => {
  let whatsappService: WhatsAppService;

  beforeEach(() => {
    jest.clearAllMocks();
    whatsappService = new WhatsAppService(mockPrisma, mockIO);
  });

  describe('getStatus', () => {
    it('deve retornar status desconectado quando não há cliente', () => {
      const status = whatsappService.getStatus();
      expect(status).toEqual({
        connected: false,
        sessionName: null,
        qrCode: null,
        lastError: null,
      });
    });
  });

  describe('startSession', () => {
    it('deve iniciar uma nova sessão', async () => {
      // Mock do venom.create
      const mockVenomClient = {
        on: jest.fn(),
        close: jest.fn(),
      };
      
      // @ts-ignore
      global.venom = {
        create: jest.fn().mockResolvedValue(mockVenomClient),
      };

      await whatsappService.startSession();
      
      expect(whatsappService.getStatus().connected).toBe(true);
    });
  });

  describe('stopSession', () => {
    it('deve parar a sessão ativa', async () => {
      // Simular sessão ativa
      (whatsappService as any).client = {
        close: jest.fn(),
      };

      await whatsappService.stopSession();
      
      expect(whatsappService.getStatus().connected).toBe(false);
    });
  });
});
