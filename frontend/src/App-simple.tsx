import { useState } from 'react';

function App() {
  console.log('🚀 Simple App rendering...');
  
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Sistema VB Solution CRM</h1>
      <p>Se você está vendo esta página, o React está funcionando!</p>
      
      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f0f0f0', borderRadius: '8px' }}>
        <h2>Status do Sistema:</h2>
        <ul>
          <li>✅ React funcionando</li>
          <li>✅ Vite funcionando</li>
          <li>✅ Servidor rodando</li>
          <li>✅ JavaScript executando</li>
        </ul>
      </div>
      
      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e8f5e8', borderRadius: '8px' }}>
        <h3>Próximos passos:</h3>
        <ol>
          <li>Verificar console do navegador para erros</li>
          <li>Verificar se as variáveis de ambiente estão corretas</li>
          <li>Verificar se o Supabase está acessível</li>
        </ol>
      </div>
    </div>
  );
}

export default App;
