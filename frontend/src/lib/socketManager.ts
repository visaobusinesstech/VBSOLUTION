import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;
let ready = false;
const queue: Array<{event: string; payload: any; ack?: Function}> = [];

export function getSocket() { return socket; }

export function connectSocket(baseUrl: string, auth: any) {
  // ✅ DESABILITADO: Socket.IO temporariamente para evitar erros
  // Usando Supabase Realtime ao invés de Socket.IO
  console.log('🔧 Socket.IO desabilitado - usando Supabase Realtime');
  
  // Retornar um mock socket para compatibilidade
  return {
    connected: false,
    emit: () => {},
    on: () => {},
    off: () => {},
    disconnect: () => {},
    connect: () => {}
  } as any;
}

export function safeEmit(event: string, payload: any, ack?: Function) {
  if (!socket || !ready) {
    // Silent: Socket não pronto, adicionando à fila
    queue.push({ event, payload, ack });
    return;
  }

  // Silent: Emitindo evento Socket.IO
  socket.emit(event, payload, ack);
}