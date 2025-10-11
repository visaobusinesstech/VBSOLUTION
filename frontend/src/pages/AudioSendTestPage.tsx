import React from 'react';
import { AudioSendTest } from '@/components/AudioSendTest';

export default function AudioSendTestPage() {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">
          Teste de Envio de Áudio
        </h1>
        
        <div className="max-w-6xl mx-auto">
          <AudioSendTest />
          
          <div className="mt-8 p-6 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Instruções de Teste:</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Configure o número de telefone de destino no campo "Configuração do Teste"</li>
              <li>Clique em "Testar JID" para verificar se o formato está correto</li>
              <li>Clique em "Iniciar Gravação" e fale algo no microfone</li>
              <li>Clique em "Parar" após alguns segundos</li>
              <li>Use o botão de play para reproduzir o áudio gravado</li>
              <li>Clique em "Enviar Áudio" para testar o envio</li>
              <li>Verifique os logs para identificar problemas</li>
            </ol>
          </div>
          
          <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
            <h4 className="font-semibold mb-2">Debug Info:</h4>
            <p className="text-sm">
              Os logs mostram todo o processo de gravação e envio. Verifique se:
            </p>
            <ul className="list-disc list-inside text-sm mt-2 space-y-1">
              <li>O JID está sendo normalizado corretamente</li>
              <li>O arquivo de áudio está sendo criado com tamanho > 0</li>
              <li>A conexão WhatsApp está ativa</li>
              <li>O backend está recebendo os dados corretamente</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
