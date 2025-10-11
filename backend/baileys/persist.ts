import fetch from "node-fetch";

const EDGE_PERSIST_URL = process.env.EDGE_PERSIST_URL!;
const TOKEN = process.env.INTERNAL_WEBHOOK_TOKEN!;

export type PersistPayload = {
  ownerId: string;           // NEW: required
  companyId?: string | null; // NEW: optional
  connectionId?: string | null;
  numero: string;
  nome?: string | null;
  direction: "in" | "out";
  type: "TEXTO"|"IMAGEM"|"AUDIO"|"VIDEO"|"DOCUMENTO"|"STICKER"|"LOCALIZACAO"|"CONTATO"|"OUTRO";
  texto?: string | null;
  midia?: { url?: string | null; mime?: string | null; nome?: string | null; tamanho?: number | null } | null;
  createdAt?: string | null;
  clientId?: string | null;
};

export async function persistToSupabase(payload: PersistPayload) {
  const res = await fetch(EDGE_PERSIST_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-WA-SIGNATURE": TOKEN },
    body: JSON.stringify(payload),
  });
  
  const text = await res.text().catch(() => "");
  console.log("[persistToSupabase]", res.status, text.slice(0, 200));
  
  if (!res.ok) {
    console.error("[persistToSupabase] failed", res.status, text);
  }
}

