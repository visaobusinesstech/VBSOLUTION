import React from 'react';
import { AudioTest } from '@/components/AudioTest';

export default function AudioTestPage() {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">
          Teste de Funcionalidades de Áudio
        </h1>
        
        <div className="max-w-2xl mx-auto">
          <AudioTest />
          
          <div className="mt-8 p-6 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Instruções de Teste:</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Clique em "Iniciar Gravação"</li>
              <li>Fale algo no microfone</li>
              <li>Clique em "Parar" após alguns segundos</li>
              <li>Use o botão de play para reproduzir o áudio gravado</li>
              <li>Verifique se o áudio foi capturado corretamente</li>
            </ol>
          </div>
          
          <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
            <h4 className="font-semibold mb-2">Debug Info:</h4>
            <p className="text-sm">
              Abra o console do navegador (F12) para ver os logs detalhados da gravação.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
