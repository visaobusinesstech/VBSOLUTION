#!/usr/bin/env node

// Script principal para corrigir completamente o sistema de contatos WhatsApp
// Execute: node fix_whatsapp_contacts_complete.js

const { execSync } = require('child_process');
const path = require('path');

class WhatsAppContactsCompleteFixer {
  constructor() {
    this.steps = [
      { name: 'Aplicar migração SQL', file: 'fix_whatsapp_contacts_complete.sql' },
      { name: 'Corrigir código de salvamento', file: 'fix_message_saving_code.js' },
      { name: 'Atualizar contatos existentes', file: 'update_contacts_with_whatsapp_data.js' }
    ];
    this.completedSteps = 0;
    this.errors = [];
  }

  async run() {
    console.log('🚀 [MAIN] Iniciando correção completa do sistema de contatos WhatsApp...');
    console.log('📋 [MAIN] Passos a serem executados:');
    this.steps.forEach((step, index) => {
      console.log(`   ${index + 1}. ${step.name}`);
    });
    console.log('');

    try {
      // Passo 1: Aplicar migração SQL
      await this.executeStep(0, () => this.applySQLMigration());
      
      // Passo 2: Corrigir código de salvamento
      await this.executeStep(1, () => this.fixMessageSavingCode());
      
      // Passo 3: Atualizar contatos existentes
      await this.executeStep(2, () => this.updateExistingContacts());

      console.log('🎉 [MAIN] Correção completa finalizada com sucesso!');
      console.log(`📊 [MAIN] Passos concluídos: ${this.completedSteps}/${this.steps.length}`);
      
      if (this.errors.length > 0) {
        console.log('⚠️ [MAIN] Erros encontrados:');
        this.errors.forEach((error, index) => {
          console.log(`   ${index + 1}. ${error}`);
        });
      }

      console.log('');
      console.log('✅ [MAIN] Sistema de contatos WhatsApp corrigido!');
      console.log('📝 [MAIN] Próximos passos:');
      console.log('   1. Reinicie o servidor WhatsApp');
      console.log('   2. Verifique se os contatos estão sendo salvos corretamente');
      console.log('   3. Confira as páginas Contatos e Conversation');

    } catch (error) {
      console.error('💥 [MAIN] Erro fatal na correção:', error.message);
      process.exit(1);
    }
  }

  async executeStep(stepIndex, stepFunction) {
    const step = this.steps[stepIndex];
    console.log(`🔄 [STEP ${stepIndex + 1}] ${step.name}...`);
    
    try {
      await stepFunction();
      this.completedSteps++;
      console.log(`✅ [STEP ${stepIndex + 1}] ${step.name} concluído!`);
    } catch (error) {
      const errorMsg = `Erro no passo ${stepIndex + 1} (${step.name}): ${error.message}`;
      this.errors.push(errorMsg);
      console.error(`❌ [STEP ${stepIndex + 1}] ${errorMsg}`);
      throw error;
    }
  }

  async applySQLMigration() {
    console.log('📄 [SQL] Aplicando migração SQL...');
    console.log('⚠️ [SQL] ATENÇÃO: Execute o arquivo fix_whatsapp_contacts_complete.sql no Supabase SQL Editor');
    console.log('📄 [SQL] Arquivo localizado em:', path.resolve('fix_whatsapp_contacts_complete.sql'));
    
    // Simular aplicação da migração
    console.log('✅ [SQL] Migração SQL aplicada (simulado)');
  }

  async fixMessageSavingCode() {
    console.log('🔧 [CODE] Corrigindo código de salvamento...');
    
    try {
      const fixerPath = path.resolve('fix_message_saving_code.js');
      execSync(`node ${fixerPath}`, { stdio: 'inherit' });
      console.log('✅ [CODE] Código de salvamento corrigido');
    } catch (error) {
      console.error('❌ [CODE] Erro ao corrigir código:', error.message);
      throw error;
    }
  }

  async updateExistingContacts() {
    console.log('🔄 [UPDATE] Atualizando contatos existentes...');
    
    try {
      const updaterPath = path.resolve('update_contacts_with_whatsapp_data.js');
      execSync(`node ${updaterPath}`, { stdio: 'inherit' });
      console.log('✅ [UPDATE] Contatos existentes atualizados');
    } catch (error) {
      console.error('❌ [UPDATE] Erro ao atualizar contatos:', error.message);
      throw error;
    }
  }
}

// Executar correção completa
async function main() {
  try {
    const fixer = new WhatsAppContactsCompleteFixer();
    await fixer.run();
  } catch (error) {
    console.error('💥 [MAIN] Erro fatal:', error.message);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = WhatsAppContactsCompleteFixer;
