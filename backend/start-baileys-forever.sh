#!/bin/bash

# Baileys Forever - Script que garante que o serviço Baileys nunca morra
# Este script implementa múltiplas camadas de proteção

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="$SCRIPT_DIR/baileys-forever.log"
WATCHDOG_PID_FILE="$SCRIPT_DIR/baileys-watchdog.pid"
LOCK_FILE="$SCRIPT_DIR/baileys-forever.lock"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$LOG_FILE"
}

warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] INFO:${NC} $1" | tee -a "$LOG_FILE"
}

# Função para verificar se o processo está rodando
is_running() {
    if [ -f "$WATCHDOG_PID_FILE" ]; then
        local pid=$(cat "$WATCHDOG_PID_FILE")
        if ps -p "$pid" > /dev/null 2>&1; then
            return 0
        else
            rm -f "$WATCHDOG_PID_FILE"
            return 1
        fi
    fi
    return 1
}

# Função para parar o watchdog
stop_watchdog() {
    if [ -f "$WATCHDOG_PID_FILE" ]; then
        local pid=$(cat "$WATCHDOG_PID_FILE")
        if ps -p "$pid" > /dev/null 2>&1; then
            log "Parando watchdog (PID: $pid)..."
            kill -TERM "$pid" 2>/dev/null
            sleep 2
            if ps -p "$pid" > /dev/null 2>&1; then
                warn "Forçando parada do watchdog..."
                kill -KILL "$pid" 2>/dev/null
            fi
        fi
        rm -f "$WATCHDOG_PID_FILE"
    fi
    
    # Parar todos os processos relacionados
    pkill -f "simple-baileys-server.js" 2>/dev/null
    pkill -f "baileys-watchdog.js" 2>/dev/null
    
    log "Watchdog parado"
}

# Função para iniciar o watchdog
start_watchdog() {
    if is_running; then
        warn "Watchdog já está rodando"
        return 1
    fi
    
    # Verificar se há lock file
    if [ -f "$LOCK_FILE" ]; then
        local lock_pid=$(cat "$LOCK_FILE")
        if ps -p "$lock_pid" > /dev/null 2>&1; then
            error "Outro processo está rodando (PID: $lock_pid)"
            return 1
        else
            rm -f "$LOCK_FILE"
        fi
    fi
    
    # Criar lock file
    echo $$ > "$LOCK_FILE"
    
    log "🚀 Iniciando Baileys Forever Watchdog..."
    
    # Verificar dependências
    if ! command -v node &> /dev/null; then
        error "Node.js não encontrado"
        exit 1
    fi
    
    if ! command -v curl &> /dev/null; then
        error "curl não encontrado"
        exit 1
    fi
    
    # Verificar se o arquivo do servidor existe
    if [ ! -f "$SCRIPT_DIR/simple-baileys-server.js" ]; then
        error "Arquivo simple-baileys-server.js não encontrado"
        exit 1
    fi
    
    # Verificar se o arquivo do watchdog existe
    if [ ! -f "$SCRIPT_DIR/baileys-watchdog.js" ]; then
        error "Arquivo baileys-watchdog.js não encontrado"
        exit 1
    fi
    
    # Tornar o watchdog executável
    chmod +x "$SCRIPT_DIR/baileys-watchdog.js"
    
    # Iniciar o watchdog em background
    cd "$SCRIPT_DIR"
    nohup node baileys-watchdog.js > "$LOG_FILE" 2>&1 &
    local watchdog_pid=$!
    
    # Salvar PID
    echo "$watchdog_pid" > "$WATCHDOG_PID_FILE"
    
    # Aguardar um pouco para verificar se iniciou corretamente
    sleep 3
    
    if ps -p "$watchdog_pid" > /dev/null 2>&1; then
        log "✅ Watchdog iniciado com sucesso (PID: $watchdog_pid)"
        log "📝 Logs sendo salvos em: $LOG_FILE"
        log "🔒 Lock file: $LOCK_FILE"
        
        # Remover lock file
        rm -f "$LOCK_FILE"
        
        return 0
    else
        error "Falha ao iniciar watchdog"
        rm -f "$WATCHDOG_PID_FILE" "$LOCK_FILE"
        return 1
    fi
}

# Função para mostrar status
show_status() {
    echo "=== BAILEYS FOREVER STATUS ==="
    echo
    
    if is_running; then
        local pid=$(cat "$WATCHDOG_PID_FILE")
        echo -e "Status: ${GREEN}RODANDO${NC} (PID: $pid)"
        
        # Verificar se o servidor está respondendo
        if curl -s http://localhost:3000/api/baileys-simple/health > /dev/null 2>&1; then
            echo -e "Servidor: ${GREEN}RESPONDENDO${NC}"
        else
            echo -e "Servidor: ${RED}NÃO RESPONDE${NC}"
        fi
        
        echo "Log file: $LOG_FILE"
        echo "PID file: $WATCHDOG_PID_FILE"
        
        # Mostrar últimas linhas do log
        echo
        echo "=== ÚLTIMAS 10 LINHAS DO LOG ==="
        tail -10 "$LOG_FILE" 2>/dev/null || echo "Log file não encontrado"
        
    else
        echo -e "Status: ${RED}PARADO${NC}"
    fi
    
    echo
}

# Função para mostrar logs
show_logs() {
    if [ -f "$LOG_FILE" ]; then
        tail -f "$LOG_FILE"
    else
        error "Log file não encontrado: $LOG_FILE"
    fi
}

# Função para reiniciar
restart() {
    log "🔄 Reiniciando Baileys Forever..."
    stop_watchdog
    sleep 2
    start_watchdog
}

# Função para limpar logs antigos
clean_logs() {
    if [ -f "$LOG_FILE" ]; then
        local size=$(stat -f%z "$LOG_FILE" 2>/dev/null || stat -c%s "$LOG_FILE" 2>/dev/null)
        local size_mb=$((size / 1024 / 1024))
        
        if [ "$size_mb" -gt 10 ]; then
            log "Limpeza de logs (tamanho: ${size_mb}MB)..."
            tail -1000 "$LOG_FILE" > "${LOG_FILE}.tmp" && mv "${LOG_FILE}.tmp" "$LOG_FILE"
            log "Logs limpos"
        else
            info "Logs estão com tamanho normal (${size_mb}MB)"
        fi
    fi
}

# Função para instalar como serviço do sistema
install_service() {
    log "Instalando como serviço do sistema..."
    
    # Criar arquivo de serviço systemd
    local service_file="/etc/systemd/system/baileys-forever.service"
    
    sudo tee "$service_file" > /dev/null << EOF
[Unit]
Description=Baileys Forever - WhatsApp QR Code Service
After=network.target

[Service]
Type=simple
User=$(whoami)
WorkingDirectory=$SCRIPT_DIR
ExecStart=$SCRIPT_DIR/start-baileys-forever.sh start
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

    sudo systemctl daemon-reload
    sudo systemctl enable baileys-forever.service
    
    log "✅ Serviço instalado. Use 'sudo systemctl start baileys-forever' para iniciar"
}

# Função para desinstalar serviço
uninstall_service() {
    log "Desinstalando serviço do sistema..."
    
    sudo systemctl stop baileys-forever.service 2>/dev/null
    sudo systemctl disable baileys-forever.service 2>/dev/null
    sudo rm -f /etc/systemd/system/baileys-forever.service
    sudo systemctl daemon-reload
    
    log "✅ Serviço desinstalado"
}

# Main
case "${1:-}" in
    start)
        start_watchdog
        ;;
    stop)
        stop_watchdog
        ;;
    restart)
        restart
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs
        ;;
    clean)
        clean_logs
        ;;
    install)
        install_service
        ;;
    uninstall)
        uninstall_service
        ;;
    *)
        echo "Baileys Forever - Serviço que nunca morre"
        echo
        echo "Uso: $0 {start|stop|restart|status|logs|clean|install|uninstall}"
        echo
        echo "Comandos:"
        echo "  start     - Iniciar o watchdog"
        echo "  stop      - Parar o watchdog"
        echo "  restart   - Reiniciar o watchdog"
        echo "  status    - Mostrar status do serviço"
        echo "  logs      - Mostrar logs em tempo real"
        echo "  clean     - Limpar logs antigos"
        echo "  install   - Instalar como serviço do sistema"
        echo "  uninstall - Desinstalar serviço do sistema"
        echo
        ;;
esac
