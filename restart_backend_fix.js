#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🔄 Script para reiniciar backend e corrigir cache...');

// 1. Verificar processos Node.js rodando
try {
  console.log('\n1. Verificando processos Node.js...');
  const processes = execSync('ps aux | grep node | grep -v grep', { encoding: 'utf8' });
  if (processes.trim()) {
    console.log('📋 Processos Node.js encontrados:');
    console.log(processes);
  } else {
    console.log('ℹ️ Nenhum processo Node.js em execução');
  }
} catch (error) {
  console.log('ℹ️ Não foi possível verificar processos');
}

// 2. Verificar se há processos na porta 3000 ou 8080
const ports = [3000, 8080, 3001, 8000];
ports.forEach(port => {
  try {
    const result = execSync(`lsof -ti:${port}`, { encoding: 'utf8' }).trim();
    if (result) {
      console.log(`⚠️ Processo rodando na porta ${port}: PID ${result}`);
      console.log(`   Para matar: kill -9 ${result}`);
    }
  } catch (error) {
    // Porta livre
  }
});

// 3. Verificar arquivos modificados recentemente
console.log('\n2. Verificando arquivos modificados recentemente...');
try {
  const recentFiles = execSync('find . -name "*.js" -not -path "./node_modules/*" -not -path "./.git/*" -mtime -1', { encoding: 'utf8' });
  if (recentFiles.trim()) {
    console.log('📁 Arquivos JS modificados nas últimas 24h:');
    console.log(recentFiles);
  }
} catch (error) {
  console.log('ℹ️ Não foi possível verificar arquivos modificados');
}

// 4. Limpar cache do Node.js
console.log('\n3. Limpando cache do Node.js...');
try {
  // Limpar cache npm
  execSync('npm cache clean --force');
  console.log('✅ Cache npm limpo');
} catch (error) {
  console.log('⚠️ Não foi possível limpar cache npm');
}

// 5. Verificar se há arquivos .log com erros recentes
console.log('\n4. Verificando logs de erro...');
try {
  const errorLogs = execSync('find . -name "*.log" -not -path "./node_modules/*" -exec grep -l "phone_number" {} \\;', { encoding: 'utf8' });
  if (errorLogs.trim()) {
    console.log('📋 Logs com referências a phone_number:');
    console.log(errorLogs);
  } else {
    console.log('✅ Nenhum log com phone_number encontrado');
  }
} catch (error) {
  console.log('ℹ️ Nenhum log com phone_number encontrado');
}

console.log('\n🎯 Próximos passos recomendados:');
console.log('1. Parar todos os processos Node.js em execução');
console.log('2. Executar: npm run dev (ou o comando para iniciar o backend)');
console.log('3. Verificar se o erro de phone_number ainda aparece');
console.log('4. Se persistir, pode ser um problema no banco de dados');

console.log('\n💡 Se o erro persistir, execute:');
console.log('   - node final_contacts_phone_fix.sql no Supabase SQL Editor');
console.log('   - Reinicie completamente o sistema');

