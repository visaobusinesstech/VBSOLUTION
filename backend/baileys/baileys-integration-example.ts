import { proto } from "@whiskeysockets/baileys";
import { persistToSupabase } from "./persist";

function extract(msg: proto.IWebMessageInfo) {
  const jid = msg.key?.remoteJid ?? "";
  const ts = msg.messageTimestamp ? new Date(Number(msg.messageTimestamp) * 1000).toISOString() : new Date().toISOString();
  const m = msg.message || {};

  if (m.conversation || m.extendedTextMessage?.text) {
    return { type: "TEXTO" as const, texto: m.conversation ?? m.extendedTextMessage?.text, createdAt: ts, numero: jid };
  }
  if (m.imageMessage) {
    return {
      type: "IMAGEM" as const,
      texto: m.imageMessage.caption ?? null,
      midia: { url: m.imageMessage.url ?? null, mime: m.imageMessage.mimetype ?? null, nome: m.imageMessage.fileName ?? null, tamanho: Number(m.imageMessage.fileLength ?? 0) },
      createdAt: ts, numero: jid,
    };
  }
  if (m.audioMessage) {
    return {
      type: "AUDIO" as const,
      midia: { url: m.audioMessage.url ?? null, mime: m.audioMessage.mimetype ?? null, nome: null, tamanho: Number(m.audioMessage.fileLength ?? 0) },
      createdAt: ts, numero: jid,
    };
  }
  if (m.documentMessage) {
    return {
      type: "DOCUMENTO" as const,
      texto: m.documentMessage.caption ?? null,
      midia: { url: m.documentMessage.url ?? null, mime: m.documentMessage.mimetype ?? null, nome: m.documentMessage.fileName ?? null, tamanho: Number(m.documentMessage.fileLength ?? 0) },
      createdAt: ts, numero: jid,
    };
  }
  if (m.videoMessage) {
    return {
      type: "VIDEO" as const,
      texto: m.videoMessage.caption ?? null,
      midia: { url: m.videoMessage.url ?? null, mime: m.videoMessage.mimetype ?? null, nome: null, tamanho: Number(m.videoMessage.fileLength ?? 0) },
      createdAt: ts, numero: jid,
    };
  }
  return { type: "OUTRO" as const, texto: null, createdAt: ts, numero: jid };
}

// Incoming messages
export function setupIncomingMessages(sock: any, connectionId?: string, ownerId?: string, companyId?: string) {
  sock.ev.on("messages.upsert", async ({ messages }) => {
    for (const msg of messages) {
      if (msg.key?.fromMe) continue; // inbound only
      const base = extract(msg);
      await persistToSupabase({
        ...base,
        direction: "in",
        nome: msg.pushName ?? null,
        connectionId: connectionId,
        ownerId: ownerId ?? "00000000-0000-0000-0000-000000000000", // fallback
        companyId: companyId ?? null,
      });
    }
  });
}

// After sending (outgoing)
export async function afterSend(jid: string, payload: { type: "TEXTO"|"IMAGEM"|"AUDIO"|"VIDEO"|"DOCUMENTO"; texto?: string; media?: { url?: string; mime?: string; nome?: string; tamanho?: number } }, connectionId?: string, ownerId?: string, companyId?: string) {
  await persistToSupabase({
    numero: jid,
    direction: "out",
    type: payload.type,
    texto: payload.texto ?? null,
    midia: payload.media ?? null,
    createdAt: new Date().toISOString(),
    connectionId: connectionId,
    ownerId: ownerId ?? "00000000-0000-0000-0000-000000000000", // fallback
    companyId: companyId ?? null,
  });
}

