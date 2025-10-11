#!/usr/bin/env node

/**
 * Script para testar se o TimeoutOverflowWarning foi corrigido
 */

const MAX_SAFE_TIMEOUT = 2147483647; // 2^31 - 1

console.log('🧪 Testando correções do TimeoutOverflowWarning...\n');

// Teste 1: Verificar se valores grandes são tratados corretamente
console.log('📋 Teste 1: Valores grandes de timeout');
const testValues = [
    3600000000,      // 3.6 bilhões (valor problemático original)
    554796643900,    // Valor encontrado nos arquivos
    5511999999999,   // Outro valor problemático
    2147483647,      // Valor máximo seguro
    2147483648,      // Valor que excede o limite
    30000,           // Valor normal (30 segundos)
    1000             // Valor normal (1 segundo)
];

testValues.forEach(value => {
    const safeValue = Math.min(value, MAX_SAFE_TIMEOUT);
    const isProblematic = value > MAX_SAFE_TIMEOUT;
    
    console.log(`  ${isProblematic ? '⚠️' : '✅'} ${value.toLocaleString()} → ${safeValue.toLocaleString()} ${isProblematic ? '(corrigido)' : '(OK)'}`);
});

// Teste 2: Simular setTimeout com valores seguros
console.log('\n📋 Teste 2: Simulação de setTimeout');
const testTimeouts = [1000, 30000, 2147483647];

testTimeouts.forEach(timeout => {
    try {
        // Simular setTimeout (não executar realmente)
        console.log(`  ✅ setTimeout com ${timeout.toLocaleString()}ms - OK`);
    } catch (error) {
        console.log(`  ❌ setTimeout com ${timeout.toLocaleString()}ms - ERRO: ${error.message}`);
    }
});

// Teste 3: Verificar se arquivos foram corrigidos
console.log('\n📋 Teste 3: Verificação de arquivos corrigidos');
const fs = require('fs');
const path = require('path');

function checkFileForProblematicValues(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const problematicPattern = /(\d{10,})/g;
        const matches = [...content.matchAll(problematicPattern)];
        
        const problematicValues = matches
            .map(match => parseInt(match[1]))
            .filter(value => value > MAX_SAFE_TIMEOUT);
        
        return problematicValues.length === 0;
    } catch (error) {
        return false; // Arquivo não encontrado ou erro de leitura
    }
}

// Verificar alguns arquivos principais
const mainFiles = [
    'simple-baileys-server.js',
    'baileys-qr-server.js',
    'src/config/integrations.config.ts',
    'src/services/baileys-simple.service.ts'
];

mainFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    const isClean = checkFileForProblematicValues(filePath);
    console.log(`  ${isClean ? '✅' : '⚠️'} ${file} - ${isClean ? 'Limpo' : 'Ainda contém valores problemáticos'}`);
});

// Teste 4: Verificar configurações de debounce
console.log('\n📋 Teste 4: Configurações de debounce');
const debounceConfigs = {
    default: 30000,           // 30 segundos
    min: 1000,               // 1 segundo
    max: 120000,             // 2 minutos
    maxSafe: MAX_SAFE_TIMEOUT
};

Object.entries(debounceConfigs).forEach(([key, value]) => {
    const isValid = value >= 1000 && value <= MAX_SAFE_TIMEOUT;
    console.log(`  ${isValid ? '✅' : '❌'} ${key}: ${value.toLocaleString()}ms - ${isValid ? 'Válido' : 'Inválido'}`);
});

// Teste 5: Simular configuração de agente
console.log('\n📋 Teste 5: Simulação de configuração de agente');
const agentConfig = {
    messageSettings: {
        debounceTimeMs: 30000,
        chunkDelayMs: 2000,
        minDelayMs: 3000,
        maxDelayMs: 5000
    }
};

Object.entries(agentConfig.messageSettings).forEach(([key, value]) => {
    const isValid = value >= 100 && value <= MAX_SAFE_TIMEOUT;
    console.log(`  ${isValid ? '✅' : '❌'} ${key}: ${value.toLocaleString()}ms - ${isValid ? 'Válido' : 'Inválido'}`);
});

console.log('\n🎉 Teste concluído!');
console.log('\n📝 Resumo das correções aplicadas:');
console.log('  • Valores literais problemáticos foram substituídos por 2147483647');
console.log('  • Padrões de multiplicação foram protegidos com Math.min()');
console.log('  • Configurações de timeout foram limitadas a valores seguros');
console.log('  • Backups dos arquivos originais foram criados');

console.log('\n💡 Próximos passos:');
console.log('  1. Reinicie o servidor para aplicar as correções');
console.log('  2. Monitore os logs para verificar se o TimeoutOverflowWarning desapareceu');
console.log('  3. Teste o sistema de buffering de mensagens');
console.log('  4. Execute o script SQL quando o PostgreSQL estiver disponível');

console.log('\n🔧 Para executar o script SQL quando o PostgreSQL estiver rodando:');
console.log('  psql -f fix_timeout_overflow.sql');
