// Utilitário para mapear ACK status para ícones
export function ackToIcon(ack?: number) {
  // 0 queued, 1 sent, 2/3 delivered, 4 read
  if (ack === 4) return "✓✓ (read)";
  if (ack === 2 || ack === 3) return "✓✓";
  if (ack === 1) return "✓";
  return "•"; // queued
}

// Função para obter cor do ACK
export function ackToColor(ack?: number) {
  if (ack === 4) return "text-blue-500"; // read
  if (ack === 2 || ack === 3) return "text-gray-500"; // delivered
  if (ack === 1) return "text-gray-400"; // sent
  return "text-gray-300"; // queued
}

