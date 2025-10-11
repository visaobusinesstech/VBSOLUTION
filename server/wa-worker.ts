import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

const app = express();
app.use(cors());
app.use(express.json());

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Simple message sending endpoint
app.post('/api/wa/send', async (req, res) => {
  try {
    const { connectionId, chatId, type, text } = req.body;
    
    if (!connectionId || !chatId || !text) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Find the conversation
    const { data: conversation, error: convError } = await supabase
      .from('whatsapp_atendimentos')
      .select('id, owner_id')
      .eq('connection_id', connectionId)
      .eq('numero_cliente', chatId)
      .single();

    if (convError || !conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Insert the message
    const { data: message, error: msgError } = await supabase
      .from('whatsapp_mensagens')
      .insert({
        atendimento_id: conversation.id,
        owner_id: conversation.owner_id,
        connection_id: connectionId,
        chat_id: chatId,
        remetente: 'ATENDENTE',
        tipo: 'TEXTO',
        conteudo: text,
        created_at: new Date().toISOString(),
        lida: true
      })
      .select()
      .single();

    if (msgError) {
      console.error('Error inserting message:', msgError);
      return res.status(500).json({ error: 'Failed to save message' });
    }

    // Update conversation last message
    await supabase
      .from('whatsapp_atendimentos')
      .update({
        ultima_mensagem_preview: text,
        ultima_mensagem_em: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', conversation.id);

    res.json({ success: true, message });
  } catch (error) {
    console.error('Error in send endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`WhatsApp worker running on port ${PORT}`);
  console.log(`Send endpoint: http://localhost:${PORT}/api/wa/send`);
});
