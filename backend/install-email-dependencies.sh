#!/bin/bash

echo "📧 Instalando dependências para funcionalidade de email..."

# Instalar nodemailer para envio de emails
echo "Instalando nodemailer..."
pnpm add nodemailer

# Instalar @types/nodemailer para TypeScript
echo "Instalando @types/nodemailer..."
pnpm add -D @types/nodemailer

# Instalar imap para leitura de emails
echo "Instalando imap..."
pnpm add imap

# Instalar @types/imap para TypeScript
echo "Instalando @types/imap..."
pnpm add -D @types/imap

# Instalar mailparser para parsing de emails
echo "Instalando mailparser..."
pnpm add mailparser

# Instalar @types/mailparser para TypeScript
echo "Instalando @types/mailparser..."
pnpm add -D @types/mailparser

echo "✅ Dependências de email instaladas com sucesso!"
echo "📋 Dependências instaladas:"
echo "   - nodemailer (envio de emails)"
echo "   - imap (leitura de emails)"
echo "   - mailparser (parsing de emails)"
echo "   - @types/* (tipos TypeScript)"
