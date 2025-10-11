-- CreateTable
CREATE TABLE "user_profiles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avatar_url" TEXT,
    "company_id" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_profiles_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "domain" TEXT,
    "settings" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'task',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "due_date" DATETIME,
    "start_date" DATETIME,
    "end_date" DATETIME,
    "responsible_id" TEXT,
    "created_by" TEXT NOT NULL,
    "company_id" TEXT,
    "project_id" TEXT,
    "work_group" TEXT,
    "department" TEXT,
    "estimated_hours" REAL,
    "actual_hours" REAL,
    "tags" TEXT NOT NULL,
    "attachments" TEXT,
    "comments" TEXT,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "is_urgent" BOOLEAN NOT NULL DEFAULT false,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "activities_responsible_id_fkey" FOREIGN KEY ("responsible_id") REFERENCES "user_profiles" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "activities_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user_profiles" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "activities_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Atendimento" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "numero" TEXT NOT NULL,
    "clienteNome" TEXT,
    "atendenteId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'NOVO',
    "canal" TEXT NOT NULL DEFAULT 'whatsapp',
    "dataInicio" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataFim" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Mensagem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "atendimentoId" INTEGER NOT NULL,
    "remetente" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "conteudo" TEXT,
    "midiaPath" TEXT,
    "mimeType" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Mensagem_atendimentoId_fkey" FOREIGN KEY ("atendimentoId") REFERENCES "Atendimento" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OpcaoAtendimento" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ordem" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "atendenteId" INTEGER NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ConfiguracaoAtendimento" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "mensagemPadrao" TEXT NOT NULL,
    "opcoes" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "WhatsAppSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'disconnected',
    "qrCode" TEXT,
    "lastError" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "WhatsAppMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionName" TEXT NOT NULL,
    "from" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT,
    "mediaPath" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "direction" TEXT NOT NULL DEFAULT 'INBOUND',
    "rawData" TEXT,
    CONSTRAINT "WhatsAppMessage_sessionName_fkey" FOREIGN KEY ("sessionName") REFERENCES "WhatsAppSession" ("name") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "whatsapp_chats" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "connectionId" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "name" TEXT,
    "isGroup" BOOLEAN NOT NULL DEFAULT false,
    "participants" TEXT NOT NULL,
    "unreadCount" INTEGER NOT NULL DEFAULT 0,
    "lastMessage" TEXT,
    "timestamp" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "whatsapp_contacts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "connectionId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "name" TEXT,
    "notify" TEXT,
    "verifiedName" TEXT,
    "imgUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "whatsapp_messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "connectionId" TEXT NOT NULL,
    "messageKey" TEXT NOT NULL,
    "remoteJid" TEXT NOT NULL,
    "fromMe" BOOLEAN NOT NULL DEFAULT false,
    "messageId" TEXT NOT NULL,
    "message" TEXT,
    "messageTimestamp" DATETIME NOT NULL,
    "status" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "whatsapp_connections" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "connectionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'whatsapp_baileys',
    "status" TEXT NOT NULL DEFAULT 'disconnected',
    "description" TEXT,
    "phoneNumber" TEXT,
    "whatsappInfo" TEXT,
    "qrCode" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastConnectedAt" DATETIME
);

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_email_key" ON "user_profiles"("email");

-- CreateIndex
CREATE INDEX "Atendimento_numero_status_idx" ON "Atendimento"("numero", "status");

-- CreateIndex
CREATE INDEX "Atendimento_atendenteId_idx" ON "Atendimento"("atendenteId");

-- CreateIndex
CREATE INDEX "Mensagem_atendimentoId_createdAt_idx" ON "Mensagem"("atendimentoId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "OpcaoAtendimento_ordem_ativo_key" ON "OpcaoAtendimento"("ordem", "ativo");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppSession_name_key" ON "WhatsAppSession"("name");

-- CreateIndex
CREATE INDEX "WhatsAppSession_name_idx" ON "WhatsAppSession"("name");

-- CreateIndex
CREATE INDEX "WhatsAppSession_status_idx" ON "WhatsAppSession"("status");

-- CreateIndex
CREATE INDEX "WhatsAppMessage_sessionName_idx" ON "WhatsAppMessage"("sessionName");

-- CreateIndex
CREATE INDEX "WhatsAppMessage_timestamp_idx" ON "WhatsAppMessage"("timestamp");

-- CreateIndex
CREATE INDEX "WhatsAppMessage_from_idx" ON "WhatsAppMessage"("from");

-- CreateIndex
CREATE INDEX "WhatsAppMessage_to_idx" ON "WhatsAppMessage"("to");

-- CreateIndex
CREATE INDEX "whatsapp_chats_connectionId_idx" ON "whatsapp_chats"("connectionId");

-- CreateIndex
CREATE INDEX "whatsapp_chats_timestamp_idx" ON "whatsapp_chats"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_chats_connectionId_chatId_key" ON "whatsapp_chats"("connectionId", "chatId");

-- CreateIndex
CREATE INDEX "whatsapp_contacts_connectionId_idx" ON "whatsapp_contacts"("connectionId");

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_contacts_connectionId_contactId_key" ON "whatsapp_contacts"("connectionId", "contactId");

-- CreateIndex
CREATE INDEX "whatsapp_messages_connectionId_idx" ON "whatsapp_messages"("connectionId");

-- CreateIndex
CREATE INDEX "whatsapp_messages_remoteJid_idx" ON "whatsapp_messages"("remoteJid");

-- CreateIndex
CREATE INDEX "whatsapp_messages_messageTimestamp_idx" ON "whatsapp_messages"("messageTimestamp");

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_messages_connectionId_messageKey_key" ON "whatsapp_messages"("connectionId", "messageKey");

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_connections_connectionId_key" ON "whatsapp_connections"("connectionId");

-- CreateIndex
CREATE INDEX "whatsapp_connections_connectionId_idx" ON "whatsapp_connections"("connectionId");

-- CreateIndex
CREATE INDEX "whatsapp_connections_status_idx" ON "whatsapp_connections"("status");
