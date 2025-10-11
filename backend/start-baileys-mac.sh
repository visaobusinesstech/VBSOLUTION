#!/bin/bash

# Script para iniciar o Baileys Server no macOS
# Este script mantém o servidor rodando em background

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="$SCRIPT_DIR/baileys-server.log"
PID_FILE="$SCRIPT_DIR/baileys-server.pid"

echo "🚀 Iniciando Baileys Server no macOS..."

# Função para parar o servidor
stop_server() {
    echo "🛑 Parando servidor Baileys..."
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p $PID > /dev/null 2>&1; then
            kill $PID
            echo "✅ Servidor parado (PID: $PID)"
        fi
        rm -f "$PID_FILE"
    fi
    exit 0
}

# Configurar handlers de sinal
trap stop_server SIGINT SIGTERM

# Verificar se o servidor já está rodando
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p $PID > /dev/null 2>&1; then
        echo "✅ Servidor já está rodando (PID: $PID)"
        echo "📱 API disponível em: http://localhost:3000/api"
        echo "🔗 Teste: http://localhost:3000/api/test"
        echo "💡 Para parar: kill $PID ou Ctrl+C"
        
        # Manter o script rodando
        while true; do
            sleep 30
            if ! ps -p $PID > /dev/null 2>&1; then
                echo "⚠️ Servidor parou inesperadamente, reiniciando..."
                break
            fi
        done
    else
        echo "🧹 Removendo arquivo PID obsoleto..."
        rm -f "$PID_FILE"
    fi
fi

# Iniciar o servidor
echo "📱 Iniciando servidor Baileys..."
cd "$SCRIPT_DIR"

# Iniciar em background e salvar PID
nohup node simple-baileys-server.js > "$LOG_FILE" 2>&1 &
SERVER_PID=$!

# Salvar PID
echo $SERVER_PID > "$PID_FILE"

echo "✅ Servidor Baileys iniciado (PID: $SERVER_PID)"
echo "📱 API disponível em: http://localhost:3000/api"
echo "🔗 Teste: http://localhost:3000/api/test"
echo "📝 Logs salvos em: $LOG_FILE"
echo "💡 Para parar: kill $SERVER_PID ou Ctrl+C"

# Monitorar o servidor
while true; do
    sleep 30
    
    # Verificar se o processo ainda está rodando
    if ! ps -p $SERVER_PID > /dev/null 2>&1; then
        echo "⚠️ Servidor parou inesperadamente, reiniciando..."
        
        # Reiniciar
        nohup node simple-baileys-server.js > "$LOG_FILE" 2>&1 &
        SERVER_PID=$!
        echo $SERVER_PID > "$PID_FILE"
        
        echo "🔄 Servidor reiniciado (PID: $SERVER_PID)"
    fi
done
