import { useState } from "react";
import { TrendingUp, MessageCircle, Clock, Bot } from "lucide-react";

export default function DashboardUnderChat() {
  const [open, setOpen] = useState(true);
  return (
    <div className={`${open ? "max-h-80" : "max-h-10"} transition-all duration-300 overflow-hidden`}>
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-t">
        <span className="text-sm font-medium text-gray-700">Dashboard (insights da conversa)</span>
        <button onClick={() => setOpen((v) => !v)} className="text-xs text-gray-600 hover:text-gray-900">
          {open ? "Ocultar" : "Mostrar"}
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3 px-4 py-3 bg-gray-50">
        <Kpi icon={<MessageCircle className="h-4 w-4" />} title="Msgs hoje" value="32" delta="+12%" />
        <Kpi icon={<Clock className="h-4 w-4" />} title="TMA" value="1m 42s" delta="-8%" />
        <Kpi icon={<TrendingUp className="h-4 w-4" />} title="Conversões" value="6" delta="+2" />
        <Kpi icon={<Bot className="h-4 w-4" />} title="Agente AI" value="Ativo" delta="ok" />
      </div>
    </div>
  );
}

function Kpi({ icon, title, value, delta }: { icon: React.ReactNode; title: string; value: string; delta: string }) {
  return (
    <div className="rounded-xl border bg-white p-3 shadow-sm">
      <div className="flex items-center gap-2 text-gray-500 text-xs">
        {icon}
        <span>{title}</span>
      </div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
      <div className="text-xs text-emerald-600">{delta}</div>
    </div>
  );
}
