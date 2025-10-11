# Baileys Server Universal - Inicialização Automática

## 🚀 **Sistema Universal de Inicialização**

Este sistema mantém o servidor Baileys sempre ativo, funcionando em qualquer plataforma (Windows, macOS, Linux).

## 📱 **Scripts Disponíveis**

### **1. Script Universal (Recomendado)**
```bash
# Qualquer plataforma
node start-baileys-anywhere.js
```

### **2. Scripts por Plataforma**

#### **Windows**
```cmd
# Opção 1: Script Node.js
node start-baileys-universal.js

# Opção 2: Script Batch
start-baileys.bat
```

#### **macOS/Linux**
```bash
# Opção 1: Script Node.js
node start-baileys-universal.js

# Opção 2: Script Shell
./start-baileys.sh
```

## 🎯 **Como Usar**

### **Método 1: Inicialização Manual**
```bash
cd backend
node start-baileys-anywhere.js
```

### **Método 2: Inicialização Automática no Frontend**
O frontend já está configurado para verificar e iniciar o servidor automaticamente quando necessário.

### **Método 3: Inicialização no Startup do Sistema**

#### **Windows (Task Scheduler)**
1. Abrir Task Scheduler
2. Criar nova tarefa
3. Ação: Iniciar programa
4. Programa: `node`
5. Argumentos: `C:\caminho\para\backend\start-baileys-anywhere.js`

#### **macOS (LaunchAgent)**
```bash
# Criar arquivo de configuração
cat > ~/Library/LaunchAgents/com.baileys.server.plist << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.baileys.server</string>
    <key>ProgramArguments</key>
    <array>
        <string>node</string>
        <string>/caminho/para/backend/start-baileys-anywhere.js</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
</dict>
</plist>
EOF

# Carregar o serviço
launchctl load ~/Library/LaunchAgents/com.baileys.server.plist
```

#### **Linux (systemd)**
```bash
# Criar arquivo de serviço
sudo cat > /etc/systemd/system/baileys-server.service << EOF
[Unit]
Description=Baileys Server
After=network.target

[Service]
Type=simple
User=seu-usuario
WorkingDirectory=/caminho/para/backend
ExecStart=/usr/bin/node start-baileys-anywhere.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Habilitar e iniciar o serviço
sudo systemctl enable baileys-server.service
sudo systemctl start baileys-server.service
```

## 🔧 **Funcionalidades**

### **✅ Inicialização Automática**
- Verifica se o servidor está rodando
- Inicia automaticamente se necessário
- Funciona em qualquer plataforma

### **✅ Monitoramento Contínuo**
- Verifica saúde do servidor a cada 30 segundos
- Reinicia automaticamente se parar
- Logs detalhados de todas as operações

### **✅ Gerenciamento de Processos**
- Salva PID do processo
- Permite parar/restartar facilmente
- Limpeza automática de arquivos temporários

### **✅ Logs Completos**
- Todos os logs salvos em arquivo
- Rotação automática de logs
- Debugging facilitado

## 📊 **Arquivos Gerados**

- `baileys-anywhere.pid` - PID do processo
- `baileys-anywhere.log` - Logs do servidor
- `baileys-server.log` - Logs específicos do Baileys

## 🎯 **Integração com Frontend**

O frontend já está configurado para:
1. Verificar se o servidor está rodando
2. Tentar iniciar automaticamente se necessário
3. Mostrar instruções se não conseguir iniciar
4. Funcionar normalmente quando o servidor estiver ativo

## 🚀 **Comandos Úteis**

### **Verificar Status**
```bash
# Verificar se está rodando
ps aux | grep baileys-server

# Ver logs
tail -f baileys-anywhere.log
```

### **Parar Servidor**
```bash
# Método 1: Via PID
kill $(cat baileys-anywhere.pid)

# Método 2: Via processo
pkill -f "simple-baileys-server.js"
```

### **Reiniciar Servidor**
```bash
# Parar e iniciar novamente
kill $(cat baileys-anywhere.pid) && node start-baileys-anywhere.js
```

## 🎉 **Sistema Pronto**

Com este sistema, o servidor Baileys:
- ✅ Inicia automaticamente quando necessário
- ✅ Mantém-se rodando continuamente
- ✅ Reinicia automaticamente se parar
- ✅ Funciona em qualquer plataforma
- ✅ Integra-se perfeitamente com o frontend

**O servidor estará sempre disponível para gerar QR codes!** 🚀
