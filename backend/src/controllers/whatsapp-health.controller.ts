import { Request, Response } from 'express';
import { whatsappServiceV2 } from '../services/whatsapp-v2.service';

// Contadores em memória para observação
let inboundCount = 0;
let outboundCount = 0;
let lastInboundAt: string | null = null;
let lastOutboundAt: string | null = null;

export function incrementInboundCount() {
  if (process.env.FEATURE_WHATSAPP_STRICT_OBSERVE === 'true') {
    inboundCount++;
    lastInboundAt = new Date().toISOString();
  }
}

export function incrementOutboundCount() {
  if (process.env.FEATURE_WHATSAPP_STRICT_OBSERVE === 'true') {
    outboundCount++;
    lastOutboundAt = new Date().toISOString();
  }
}

export async function getWhatsAppHealth(req: Request, res: Response) {
  try {
    const healthStatus = await whatsappServiceV2.getHealthStatus();
    const sessions = whatsappServiceV2.getAllSessions();
    
    // Encontrar sessão ativa
    const activeSession = sessions.find(s => s.status === 'connected');
    
    res.json({
      session: {
        name: activeSession?.name || 'none',
        status: activeSession?.status || 'DISCONNECTED',
        updated_at: activeSession?.updatedAt?.toISOString() || new Date().toISOString()
      },
      inbound_count: inboundCount,
      outbound_count: outboundCount,
      last_inbound_at: lastInboundAt,
      last_outbound_at: lastOutboundAt,
      health_status: healthStatus
    });
  } catch (error) {
    res.status(500).json({
      error: 'Erro ao obter status do WhatsApp',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}
