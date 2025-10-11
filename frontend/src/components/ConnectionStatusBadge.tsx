import { useEffect, useMemo } from "react";
import { Wifi, WifiOff, Loader2 } from "lucide-react";
import { useConnections } from "@/contexts/ConnectionsContext";

type Normalized = "connected" | "connecting" | "disconnected";

function normalizeStatus(s?: string | null): Normalized {
  // Normalize different status values to our three states
  if (s === "connected" || s === "active") return "connected";
  if (s === "connecting" || s === "qr" || s === "open") return "connecting";
  return "disconnected";
}

export default function ConnectionStatusBadge({
  onConnectClick,                 // open your "Nova Conexão" modal
}: { onConnectClick?: () => void }) {
  const { activeConnection, updateConnectionStatus } = useConnections();

  const status = useMemo<Normalized>(() => normalizeStatus(activeConnection?.status), [activeConnection?.status]);

  // Light auto-refresh for stale UIs
  useEffect(() => {
    if (!activeConnection) return;
    const id = activeConnection.id;
    const t = setInterval(() => updateConnectionStatus(id).catch(() => {}), 10_000);
    return () => clearInterval(t);
  }, [activeConnection?.id, updateConnectionStatus]);

  if (!activeConnection) {
    // No connection configured at all
    return (
      <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium
                      bg-rose-50 text-rose-700 border border-rose-200">
        <WifiOff className="h-4 w-4" />
        <span>Desconectado</span>
        {onConnectClick && (
          <button onClick={onConnectClick}
                  className="ml-2 rounded-full bg-rose-600 text-white px-2 py-0.5 text-xs hover:bg-rose-700 transition">
            Conectar
          </button>
        )}
      </div>
    );
  }

  if (status === "connecting") {
    return (
      <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium
                      bg-amber-50 text-amber-700 border border-amber-200">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Conectando…</span>
      </div>
    );
  }

  if (status === "connected") {
    return (
      <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium
                      bg-emerald-50 text-emerald-700 border border-emerald-200">
        <Wifi className="h-4 w-4" />
        <span>{activeConnection.name} — Conectado</span>
      </div>
    );
  }

  // disconnected (has a record, but offline)
  return (
    <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium
                    bg-rose-50 text-rose-700 border border-rose-200">
      <WifiOff className="h-4 w-4" />
      <span>{activeConnection.name} — Desconectado</span>
      {onConnectClick && (
        <button onClick={onConnectClick}
                className="ml-2 rounded-full bg-rose-600 text-white px-2 py-0.5 text-xs hover:bg-rose-700 transition">
          Conectar
        </button>
      )}
    </div>
  );
}
