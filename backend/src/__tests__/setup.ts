/// <reference types="jest" />

import { PrismaClient } from '@prisma/client';

// Mock do Prisma para testes
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    atendimento: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    mensagem: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    configuracaoAtendimento: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    opcaoAtendimento: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  })),
}));

// Mock do Socket.IO
jest.mock('socket.io', () => ({
  Server: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    emit: jest.fn(),
    to: jest.fn().mockReturnValue({
      emit: jest.fn(),
    }),
    close: jest.fn(),
  })),
}));

// Mock do Venom-Bot
jest.mock('venom-bot', () => ({
  create: jest.fn(),
}));

// Configurações globais de teste
beforeEach(() => {
  jest.clearAllMocks();
});

afterAll(() => {
  jest.restoreAllMocks();
});
