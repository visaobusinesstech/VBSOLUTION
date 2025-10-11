import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import nodemailer from 'nodemailer';
import Imap from 'imap';
import { simpleParser } from 'mailparser';

interface EmailSettings {
  id: string;
  owner_id: string;
  provider: string;
  smtp_host: string;
  smtp_port: number;
  email: string;
  password: string;
  use_tls: boolean;
}

interface EmailData {
  from_email: string;
  to_email: string;
  subject: string;
  body: string;
  date: string;
  is_read: boolean;
  provider: string;
  message_id: string;
  attachments?: string[];
}

export class EmailController {
  // Obter configurações de email do usuário
  async getEmailSettings(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const { data, error } = await supabase
        .from('email_settings')
        .select('*')
        .eq('owner_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      // Não retornar a senha por segurança
      if (data) {
        const { password, ...settingsWithoutPassword } = data;
        res.json(settingsWithoutPassword);
      } else {
        res.json(null);
      }
    } catch (error: any) {
      console.error('Erro ao obter configurações de email:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Salvar configurações de email
  async saveEmailSettings(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const { provider, smtp_host, smtp_port, email, password, use_tls } = req.body;

      // Validação
      if (!provider || !smtp_host || !email || !password) {
        return res.status(400).json({ error: 'Campos obrigatórios não fornecidos' });
      }

      const { data, error } = await supabase
        .from('email_settings')
        .upsert({
          owner_id: userId,
          provider,
          smtp_host,
          smtp_port: smtp_port || 587,
          email,
          password, // Em produção, criptografar
          use_tls: use_tls !== false,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Não retornar a senha
      const { password: _, ...settingsWithoutPassword } = data;
      res.json(settingsWithoutPassword);
    } catch (error: any) {
      console.error('Erro ao salvar configurações de email:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Sincronizar emails
  async syncEmails(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      // Obter configurações de email
      const { data: settings, error: settingsError } = await supabase
        .from('email_settings')
        .select('*')
        .eq('owner_id', userId)
        .single();

      if (settingsError || !settings) {
        return res.status(400).json({ error: 'Configurações de email não encontradas' });
      }

      // Configurar IMAP
      const imap = new Imap({
        user: settings.email,
        password: settings.password,
        host: settings.smtp_host,
        port: settings.smtp_port,
        tls: settings.use_tls,
        tlsOptions: { rejectUnauthorized: false }
      });

      const emails: EmailData[] = [];

      imap.once('ready', () => {
        imap.openBox('INBOX', false, (err, box) => {
          if (err) throw err;

          // Buscar emails dos últimos 30 dias
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

          const searchCriteria = ['SINCE', thirtyDaysAgo];
          imap.search(searchCriteria, (err, results) => {
            if (err) throw err;

            if (results.length === 0) {
              imap.end();
              return res.json({ message: 'Nenhum email encontrado', count: 0 });
            }

            const fetch = imap.fetch(results, { bodies: '' });
            let processedCount = 0;

            fetch.on('message', (msg) => {
              msg.on('body', (stream) => {
                simpleParser(stream, async (err, parsed) => {
                  if (err) {
                    console.error('Erro ao processar email:', err);
                    return;
                  }

                  const emailData: EmailData = {
                    from_email: parsed.from?.text || '',
                    to_email: parsed.to?.text || settings.email,
                    subject: parsed.subject || '',
                    body: parsed.html || parsed.text || '',
                    date: parsed.date?.toISOString() || new Date().toISOString(),
                    is_read: false,
                    provider: settings.provider,
                    message_id: parsed.messageId || '',
                    attachments: parsed.attachments?.map(att => att.filename) || []
                  };

                  emails.push(emailData);
                  processedCount++;

                  if (processedCount === results.length) {
                    // Salvar emails no Supabase
                    try {
                      const { error: insertError } = await supabase
                        .from('emails')
                        .upsert(
                          emails.map(email => ({
                            ...email,
                            owner_id: userId
                          })),
                          { onConflict: 'message_id' }
                        );

                      if (insertError) {
                        console.error('Erro ao salvar emails:', insertError);
                      }

                      imap.end();
                      res.json({ 
                        message: 'Emails sincronizados com sucesso', 
                        count: emails.length 
                      });
                    } catch (error) {
                      console.error('Erro ao salvar emails:', error);
                      imap.end();
                      res.status(500).json({ error: 'Erro ao salvar emails' });
                    }
                  }
                });
              });
            });

            fetch.once('error', (err) => {
              console.error('Erro ao buscar emails:', err);
              imap.end();
              res.status(500).json({ error: 'Erro ao buscar emails' });
            });

            fetch.once('end', () => {
              if (processedCount === 0) {
                imap.end();
                res.json({ message: 'Nenhum email processado', count: 0 });
              }
            });
          });
        });
      });

      imap.once('error', (err) => {
        console.error('Erro de conexão IMAP:', err);
        res.status(500).json({ error: 'Erro de conexão com o servidor de email' });
      });

      imap.once('end', () => {
        console.log('Conexão IMAP encerrada');
      });

      imap.connect();
    } catch (error: any) {
      console.error('Erro ao sincronizar emails:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Enviar email
  async sendEmail(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const { to, subject, body, attachments } = req.body;

      if (!to || !subject || !body) {
        return res.status(400).json({ error: 'Campos obrigatórios não fornecidos' });
      }

      // Obter configurações de email
      const { data: settings, error: settingsError } = await supabase
        .from('email_settings')
        .select('*')
        .eq('owner_id', userId)
        .single();

      if (settingsError || !settings) {
        return res.status(400).json({ error: 'Configurações de email não encontradas' });
      }

      // Configurar transporter
      const transporter = nodemailer.createTransporter({
        host: settings.smtp_host,
        port: settings.smtp_port,
        secure: settings.use_tls,
        auth: {
          user: settings.email,
          pass: settings.password
        }
      });

      // Enviar email
      const info = await transporter.sendMail({
        from: settings.email,
        to,
        subject,
        html: body,
        attachments: attachments || []
      });

      res.json({ 
        message: 'Email enviado com sucesso', 
        messageId: info.messageId 
      });
    } catch (error: any) {
      console.error('Erro ao enviar email:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Obter emails do usuário
  async getEmails(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const { page = 1, limit = 20, search = '' } = req.query;

      let query = supabase
        .from('emails')
        .select('*')
        .eq('owner_id', userId)
        .order('date', { ascending: false });

      if (search) {
        query = query.or(`subject.ilike.%${search}%,from_email.ilike.%${search}%,body.ilike.%${search}%`);
      }

      const { data, error } = await query
        .range((Number(page) - 1) * Number(limit), Number(page) * Number(limit) - 1);

      if (error) {
        throw error;
      }

      res.json(data || []);
    } catch (error: any) {
      console.error('Erro ao obter emails:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Marcar email como lido
  async markAsRead(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const { emailId } = req.params;

      const { error } = await supabase
        .from('emails')
        .update({ is_read: true })
        .eq('id', emailId)
        .eq('owner_id', userId);

      if (error) {
        throw error;
      }

      res.json({ message: 'Email marcado como lido' });
    } catch (error: any) {
      console.error('Erro ao marcar email como lido:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Obter emails agendados
  async getScheduledEmails(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const { data, error } = await supabase
        .from('scheduled_emails')
        .select('*')
        .eq('user_id', userId)
        .order('scheduled_date', { ascending: true });

      if (error) {
        console.error('Erro ao buscar emails agendados:', error);
        return res.status(400).json({ error: 'Erro ao buscar emails agendados' });
      }

      res.json({ success: true, data });
    } catch (error: any) {
      console.error('Erro ao buscar emails agendados:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Criar email agendado
  async createScheduledEmail(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const { subject, recipients, message, template_id, scheduled_date, status = 'pending' } = req.body;

      if (!subject || !recipients || !Array.isArray(recipients) || recipients.length === 0) {
        return res.status(400).json({ error: 'Campos obrigatórios não fornecidos' });
      }

      if (!scheduled_date) {
        return res.status(400).json({ error: 'Data de agendamento é obrigatória' });
      }

      const { data, error } = await supabase
        .from('scheduled_emails')
        .insert({
          user_id: userId,
          subject,
          recipients,
          message,
          template_id,
          scheduled_date,
          status
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar email agendado:', error);
        return res.status(400).json({ error: 'Erro ao criar email agendado' });
      }

      res.json({ success: true, data });
    } catch (error: any) {
      console.error('Erro ao criar email agendado:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Atualizar email agendado
  async updateScheduledEmail(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const { id } = req.params;
      const updateData = req.body;

      // Remover campos que não devem ser atualizados diretamente
      delete updateData.id;
      delete updateData.user_id;
      delete updateData.created_at;

      const { data, error } = await supabase
        .from('scheduled_emails')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar email agendado:', error);
        return res.status(400).json({ error: 'Erro ao atualizar email agendado' });
      }

      if (!data) {
        return res.status(404).json({ error: 'Email agendado não encontrado' });
      }

      res.json({ success: true, data });
    } catch (error: any) {
      console.error('Erro ao atualizar email agendado:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Deletar email agendado
  async deleteScheduledEmail(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const { id } = req.params;

      const { error } = await supabase
        .from('scheduled_emails')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        console.error('Erro ao deletar email agendado:', error);
        return res.status(400).json({ error: 'Erro ao deletar email agendado' });
      }

      res.json({ success: true, message: 'Email agendado deletado com sucesso' });
    } catch (error: any) {
      console.error('Erro ao deletar email agendado:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}
