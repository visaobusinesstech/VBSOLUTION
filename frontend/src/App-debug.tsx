import { useState, useEffect } from 'react';

function App() {
  const [error, setError] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<string[]>([]);
  
  console.log('🚀 Debug App rendering...');
  
  useEffect(() => {
    console.log('🔍 Debug App mounted');
    
    // Testar se o React está funcionando
    const timer = setTimeout(() => {
      console.log('✅ React useEffect working');
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  const testContext = async (name: string, importPath: string) => {
    try {
      console.log(`🔍 Testing ${name}...`);
      await import(importPath);
      console.log(`✅ ${name} import successful`);
      setTestResults(prev => [...prev, `✅ ${name} - OK`]);
      return true;
    } catch (err) {
      console.error(`❌ ${name} import failed:`, err);
      setTestResults(prev => [...prev, `❌ ${name} - ${err.message}`]);
      return false;
    }
  };
  
  const testAllContexts = async () => {
    console.log('🔍 Testing all contexts...');
    setTestResults([]);
    
    const contexts = [
      { name: 'AuthContext', path: '@/contexts/AuthContext' },
      { name: 'UserContext', path: '@/contexts/UserContext' },
      { name: 'VBContext', path: '@/contexts/VBContext' },
      { name: 'ProjectContext', path: '@/contexts/ProjectContext' },
      { name: 'WorkGroupContext', path: '@/contexts/WorkGroupContext' },
      { name: 'ConnectionsContext', path: '@/contexts/ConnectionsContext' },
    ];
    
    for (const context of contexts) {
      await testContext(context.name, context.path);
    }
  };
  
  // Testar se há erros
  try {
    return (
      <div style={{ 
        padding: '20px', 
        fontFamily: 'Arial, sans-serif',
        backgroundColor: '#f0f0f0',
        minHeight: '100vh'
      }}>
        <h1>🔧 Debug Mode - Sistema VB Solution CRM</h1>
        <p>Se você está vendo esta página, o React está funcionando!</p>
        
        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          backgroundColor: 'white', 
          borderRadius: '8px',
          border: '1px solid #ccc'
        }}>
          <h2>Status do Sistema:</h2>
          <ul>
            <li>✅ React funcionando</li>
            <li>✅ Vite funcionando</li>
            <li>✅ Servidor rodando</li>
            <li>✅ JavaScript executando</li>
            <li>✅ useEffect funcionando</li>
          </ul>
        </div>
        
        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          backgroundColor: '#e8f5e8', 
          borderRadius: '8px',
          border: '1px solid #4caf50'
        }}>
          <h3>Próximos passos:</h3>
          <ol>
            <li>Verificar console do navegador para erros</li>
            <li>Verificar se as variáveis de ambiente estão corretas</li>
            <li>Verificar se o Supabase está acessível</li>
            <li>Testar importações dos contextos</li>
          </ol>
        </div>
        
        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          backgroundColor: '#fff3cd', 
          borderRadius: '8px',
          border: '1px solid #ffc107'
        }}>
          <h3>Teste de Contextos:</h3>
          <button 
            onClick={testAllContexts}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginBottom: '10px'
            }}
          >
            Testar Todos os Contextos
          </button>
          
          {testResults.length > 0 && (
            <div style={{ 
              marginTop: '10px', 
              padding: '10px', 
              backgroundColor: '#f8f9fa', 
              borderRadius: '4px',
              border: '1px solid #dee2e6'
            }}>
              <h4>Resultados dos Testes:</h4>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                {testResults.map((result, index) => (
                  <li key={index} style={{ 
                    color: result.startsWith('✅') ? '#28a745' : '#dc3545',
                    marginBottom: '5px'
                  }}>
                    {result}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {error && (
            <div style={{ 
              marginTop: '10px', 
              padding: '10px', 
              backgroundColor: '#f8d7da', 
              color: '#721c24',
              borderRadius: '4px',
              border: '1px solid #f5c6cb'
            }}>
              <strong>Erro:</strong> {error}
            </div>
          )}
        </div>
      </div>
    );
  } catch (err) {
    console.error('❌ App render error:', err);
    return (
      <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
        <h1>❌ Erro no Sistema</h1>
        <p>Ocorreu um erro ao renderizar o App:</p>
        <pre style={{ backgroundColor: '#f0f0f0', padding: '10px', borderRadius: '4px' }}>
          {err?.toString()}
        </pre>
      </div>
    );
  }
}

export default App;
