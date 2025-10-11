#!/usr/bin/env node

/**
 * Script de Backup Automático para Configurações do WhatsApp
 * Este script garante que as configurações nunca sejam perdidas
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://nrbsocawokmihvxfcpso.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NzQwNTMsImV4cCI6MjA3MjA1MDA1M30.3SxEVRNNBHhAXgJ7S2BMHm1QWq9kxYamuLjvZm0_OU0';
const supabase = createClient(supabaseUrl, supabaseKey);

// Configurações
const BACKUP_DIR = path.join(__dirname, 'backups');
const MAX_BACKUPS = 30; // Manter últimos 30 backups

class WhatsAppBackupManager {
  constructor() {
    this.ensureBackupDir();
  }

  ensureBackupDir() {
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
      console.log(`📁 Diretório de backup criado: ${BACKUP_DIR}`);
    }
  }

  /**
   * Criar backup completo das configurações
   */
  async createBackup() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = path.join(BACKUP_DIR, `whatsapp-backup-${timestamp}.json`);
      
      console.log(`🔄 Iniciando backup das configurações WhatsApp...`);
      
      // Backup das sessões
      const { data: sessions, error: sessionsError } = await supabase
        .from('whatsapp_sessions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (sessionsError) {
        throw new Error(`Erro ao buscar sessões: ${sessionsError.message}`);
      }
      
      // Backup dos atendimentos
      const { data: atendimentos, error: atendimentosError } = await supabase
        .from('whatsapp_atendimentos')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (atendimentosError) {
        throw new Error(`Erro ao buscar atendimentos: ${atendimentosError.message}`);
      }
      
      // Backup das mensagens (últimas 1000)
      const { data: mensagens, error: mensagensError } = await supabase
        .from('whatsapp_mensagens')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);
      
      if (mensagensError) {
        console.warn(`⚠️ Aviso: Erro ao buscar mensagens: ${mensagensError.message}`);
      }
      
      // Criar objeto de backup
      const backupData = {
        metadata: {
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          totalSessions: sessions?.length || 0,
          totalAtendimentos: atendimentos?.length || 0,
          totalMensagens: mensagens?.length || 0
        },
        sessions: sessions || [],
        atendimentos: atendimentos || [],
        mensagens: mensagens || []
      };
      
      // Salvar backup
      fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
      
      console.log(`✅ Backup criado com sucesso: ${backupFile}`);
      console.log(`📊 Estatísticas do backup:`);
      console.log(`   - Sessões: ${backupData.metadata.totalSessions}`);
      console.log(`   - Atendimentos: ${backupData.metadata.totalAtendimentos}`);
      console.log(`   - Mensagens: ${backupData.metadata.totalMensagens}`);
      
      // Limpar backups antigos
      await this.cleanupOldBackups();
      
      return { success: true, file: backupFile };
      
    } catch (error) {
      console.error(`❌ Erro ao criar backup:`, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Restaurar backup
   */
  async restoreBackup(backupFile) {
    try {
      console.log(`🔄 Iniciando restauração do backup: ${backupFile}`);
      
      if (!fs.existsSync(backupFile)) {
        throw new Error(`Arquivo de backup não encontrado: ${backupFile}`);
      }
      
      const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
      
      console.log(`📊 Restaurando backup de ${backupData.metadata.timestamp}`);
      console.log(`   - Sessões: ${backupData.metadata.totalSessions}`);
      console.log(`   - Atendimentos: ${backupData.metadata.totalAtendimentos}`);
      console.log(`   - Mensagens: ${backupData.metadata.totalMensagens}`);
      
      // Restaurar sessões
      if (backupData.sessions && backupData.sessions.length > 0) {
        console.log(`🔄 Restaurando ${backupData.sessions.length} sessões...`);
        
        const { error: sessionsError } = await supabase
          .from('whatsapp_sessions')
          .upsert(backupData.sessions, { 
            onConflict: 'id',
            ignoreDuplicates: false 
          });
        
        if (sessionsError) {
          throw new Error(`Erro ao restaurar sessões: ${sessionsError.message}`);
        }
        
        console.log(`✅ Sessões restauradas com sucesso`);
      }
      
      // Restaurar atendimentos
      if (backupData.atendimentos && backupData.atendimentos.length > 0) {
        console.log(`🔄 Restaurando ${backupData.atendimentos.length} atendimentos...`);
        
        const { error: atendimentosError } = await supabase
          .from('whatsapp_atendimentos')
          .upsert(backupData.atendimentos, { 
            onConflict: 'id',
            ignoreDuplicates: false 
          });
        
        if (atendimentosError) {
          throw new Error(`Erro ao restaurar atendimentos: ${atendimentosError.message}`);
        }
        
        console.log(`✅ Atendimentos restaurados com sucesso`);
      }
      
      // Restaurar mensagens
      if (backupData.mensagens && backupData.mensagens.length > 0) {
        console.log(`🔄 Restaurando ${backupData.mensagens.length} mensagens...`);
        
        const { error: mensagensError } = await supabase
          .from('whatsapp_mensagens')
          .upsert(backupData.mensagens, { 
            onConflict: 'id',
            ignoreDuplicates: false 
          });
        
        if (mensagensError) {
          console.warn(`⚠️ Aviso: Erro ao restaurar mensagens: ${mensagensError.message}`);
        } else {
          console.log(`✅ Mensagens restauradas com sucesso`);
        }
      }
      
      console.log(`✅ Backup restaurado com sucesso!`);
      return { success: true };
      
    } catch (error) {
      console.error(`❌ Erro ao restaurar backup:`, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Listar backups disponíveis
   */
  listBackups() {
    try {
      const files = fs.readdirSync(BACKUP_DIR)
        .filter(file => file.startsWith('whatsapp-backup-') && file.endsWith('.json'))
        .map(file => {
          const filePath = path.join(BACKUP_DIR, file);
          const stats = fs.statSync(filePath);
          return {
            file,
            path: filePath,
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime
          };
        })
        .sort((a, b) => b.created - a.created);
      
      console.log(`📋 Backups disponíveis (${files.length}):`);
      files.forEach((backup, index) => {
        console.log(`   ${index + 1}. ${backup.file}`);
        console.log(`      Tamanho: ${(backup.size / 1024).toFixed(2)} KB`);
        console.log(`      Criado: ${backup.created.toISOString()}`);
        console.log(`      Modificado: ${backup.modified.toISOString()}`);
        console.log('');
      });
      
      return files;
      
    } catch (error) {
      console.error(`❌ Erro ao listar backups:`, error.message);
      return [];
    }
  }

  /**
   * Limpar backups antigos
   */
  async cleanupOldBackups() {
    try {
      const files = this.listBackups();
      
      if (files.length > MAX_BACKUPS) {
        const filesToDelete = files.slice(MAX_BACKUPS);
        
        console.log(`🧹 Removendo ${filesToDelete.length} backups antigos...`);
        
        for (const file of filesToDelete) {
          fs.unlinkSync(file.path);
          console.log(`   🗑️ Removido: ${file.file}`);
        }
        
        console.log(`✅ Limpeza concluída`);
      }
      
    } catch (error) {
      console.error(`❌ Erro ao limpar backups antigos:`, error.message);
    }
  }

  /**
   * Verificar integridade do backup
   */
  async verifyBackup(backupFile) {
    try {
      console.log(`🔍 Verificando integridade do backup: ${backupFile}`);
      
      if (!fs.existsSync(backupFile)) {
        throw new Error(`Arquivo de backup não encontrado: ${backupFile}`);
      }
      
      const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
      
      // Verificar estrutura
      if (!backupData.metadata || !backupData.sessions) {
        throw new Error('Estrutura de backup inválida');
      }
      
      // Verificar contagens
      const actualSessions = backupData.sessions?.length || 0;
      const actualAtendimentos = backupData.atendimentos?.length || 0;
      const actualMensagens = backupData.mensagens?.length || 0;
      
      const expectedSessions = backupData.metadata.totalSessions || 0;
      const expectedAtendimentos = backupData.metadata.totalAtendimentos || 0;
      const expectedMensagens = backupData.metadata.totalMensagens || 0;
      
      console.log(`📊 Verificação de integridade:`);
      console.log(`   - Sessões: ${actualSessions}/${expectedSessions} ${actualSessions === expectedSessions ? '✅' : '❌'}`);
      console.log(`   - Atendimentos: ${actualAtendimentos}/${expectedAtendimentos} ${actualAtendimentos === expectedAtendimentos ? '✅' : '❌'}`);
      console.log(`   - Mensagens: ${actualMensagens}/${expectedMensagens} ${actualMensagens === expectedMensagens ? '✅' : '❌'}`);
      
      const isValid = actualSessions === expectedSessions && 
                     actualAtendimentos === expectedAtendimentos && 
                     actualMensagens === expectedMensagens;
      
      if (isValid) {
        console.log(`✅ Backup íntegro e válido`);
      } else {
        console.log(`❌ Backup corrompido ou incompleto`);
      }
      
      return { success: isValid, data: backupData };
      
    } catch (error) {
      console.error(`❌ Erro ao verificar backup:`, error.message);
      return { success: false, error: error.message };
    }
  }
}

// Função principal
async function main() {
  const backupManager = new WhatsAppBackupManager();
  
  const command = process.argv[2];
  const arg = process.argv[3];
  
  switch (command) {
    case 'create':
      await backupManager.createBackup();
      break;
      
    case 'restore':
      if (!arg) {
        console.error('❌ Especifique o arquivo de backup para restaurar');
        console.log('Uso: node backup-whatsapp-config.js restore <arquivo>');
        process.exit(1);
      }
      await backupManager.restoreBackup(arg);
      break;
      
    case 'list':
      backupManager.listBackups();
      break;
      
    case 'verify':
      if (!arg) {
        console.error('❌ Especifique o arquivo de backup para verificar');
        console.log('Uso: node backup-whatsapp-config.js verify <arquivo>');
        process.exit(1);
      }
      await backupManager.verifyBackup(arg);
      break;
      
    case 'cleanup':
      await backupManager.cleanupOldBackups();
      break;
      
    default:
      console.log('🔄 WhatsApp Backup Manager');
      console.log('');
      console.log('Uso:');
      console.log('  node backup-whatsapp-config.js create          - Criar backup');
      console.log('  node backup-whatsapp-config.js restore <file>  - Restaurar backup');
      console.log('  node backup-whatsapp-config.js list            - Listar backups');
      console.log('  node backup-whatsapp-config.js verify <file>   - Verificar backup');
      console.log('  node backup-whatsapp-config.js cleanup        - Limpar backups antigos');
      break;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = WhatsAppBackupManager;
