#!/bin/bash

# Script de instalação do FFmpeg para VBSolution WhatsApp Backend
# Suporta macOS, Ubuntu/Debian e CentOS/RHEL

echo "🎬 Instalando FFmpeg para VBSolution WhatsApp Backend..."

# Detectar sistema operacional
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    echo "🍎 Detectado macOS"
    
    # Verificar se Homebrew está instalado
    if ! command -v brew &> /dev/null; then
        echo "❌ Homebrew não encontrado. Instalando Homebrew..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    fi
    
    echo "📦 Instalando FFmpeg via Homebrew..."
    brew install ffmpeg
    
elif [[ -f /etc/debian_version ]]; then
    # Ubuntu/Debian
    echo "🐧 Detectado Ubuntu/Debian"
    
    echo "🔄 Atualizando lista de pacotes..."
    sudo apt update
    
    echo "📦 Instalando FFmpeg..."
    sudo apt install -y ffmpeg
    
elif [[ -f /etc/redhat-release ]]; then
    # CentOS/RHEL
    echo "🔴 Detectado CentOS/RHEL"
    
    # Verificar se EPEL está instalado
    if ! rpm -q epel-release &> /dev/null; then
        echo "📦 Instalando EPEL repository..."
        sudo yum install -y epel-release
    fi
    
    echo "📦 Instalando FFmpeg..."
    sudo yum install -y ffmpeg
    
else
    echo "❌ Sistema operacional não suportado automaticamente."
    echo "Por favor, instale FFmpeg manualmente:"
    echo "  - macOS: brew install ffmpeg"
    echo "  - Ubuntu/Debian: sudo apt install ffmpeg"
    echo "  - CentOS/RHEL: sudo yum install ffmpeg"
    exit 1
fi

# Verificar instalação
echo "🔍 Verificando instalação do FFmpeg..."
if command -v ffmpeg &> /dev/null; then
    echo "✅ FFmpeg instalado com sucesso!"
    ffmpeg -version | head -n 1
    
    # Verificar codecs necessários
    echo "🔍 Verificando codecs necessários..."
    if ffmpeg -codecs 2>/dev/null | grep -q "libopus"; then
        echo "✅ Codec Opus disponível"
    else
        echo "⚠️ Codec Opus não encontrado - áudio pode não funcionar corretamente"
    fi
    
    if ffmpeg -codecs 2>/dev/null | grep -q "libx264"; then
        echo "✅ Codec H.264 disponível"
    else
        echo "⚠️ Codec H.264 não encontrado - vídeo pode não funcionar corretamente"
    fi
    
    echo ""
    echo "🎉 Instalação concluída!"
    echo "📝 O backend agora pode converter áudios e vídeos para formato otimizado do WhatsApp"
    echo "🔧 Para testar, envie uma mensagem de áudio ou vídeo através da interface"
    
else
    echo "❌ Erro na instalação do FFmpeg"
    exit 1
fi
