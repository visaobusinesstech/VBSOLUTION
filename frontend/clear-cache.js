const fs = require('fs');
const path = require('path');

console.log('🧹 Limpando cache do Vite...');

// Diretórios de cache do Vite
const cacheDirs = [
  'node_modules/.vite',
  'dist',
  '.vite'
];

cacheDirs.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  if (fs.existsSync(fullPath)) {
    console.log(`🗑️ Removendo: ${dir}`);
    fs.rmSync(fullPath, { recursive: true, force: true });
  } else {
    console.log(`ℹ️ Diretório não encontrado: ${dir}`);
  }
});

console.log('✅ Cache limpo!');
console.log('🔄 Reinicie o servidor de desenvolvimento com: npm run dev');

