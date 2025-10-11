/**
 * Configuração dinâmica do Vite para portas
 * Este arquivo permite configurar a porta do frontend dinamicamente
 */

const { defineConfig } = require('vite');
const path = require('path');

// Função para encontrar porta disponível
async function findAvailablePort(startPort = 5173) {
  const net = require('net');
  
  for (let port = startPort; port <= startPort + 100; port++) {
    const isAvailable = await new Promise((resolve) => {
      const server = net.createServer();
      
      server.listen(port, () => {
        server.once('close', () => resolve(true));
        server.close();
      });
      
      server.on('error', () => resolve(false));
    });
    
    if (isAvailable) {
      return port;
    }
  }
  
  throw new Error('Nenhuma porta disponível encontrada');
}

// Configuração do Vite com porta dinâmica
module.exports = defineConfig(async ({ command }) => {
  const port = await findAvailablePort();
  
  console.log(`🌐 Configurando Vite na porta ${port}`);
  
  return {
    server: {
      port: port,
      host: true, // Permitir acesso externo
      strictPort: false, // Tentar próxima porta se ocupada
      open: false // Não abrir browser automaticamente
    },
    build: {
      outDir: 'dist',
      sourcemap: true
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    }
  };
});
