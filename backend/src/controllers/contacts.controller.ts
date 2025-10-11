import { Request, Response } from 'express';
import { getBaileysSimpleService } from '../services/baileys-simple.service';

export class ContactsController {
  private baileysService: any;

  constructor() {
    this.baileysService = getBaileysSimpleService();
  }

  // Listar contatos
  async listContacts(req: Request, res: Response) {
    try {
      const { query, connectionId } = req.query;

      if (!connectionId) {
        return res.status(400).json({
          success: false,
          error: 'connectionId é obrigatório'
        });
      }

      // Por enquanto, retornar contatos mock
      const mockContacts = [
        {
          id: '2147483647@s.whatsapp.net',
          name: 'João Silva',
          phone: '2147483647',
          profilePicture: null,
          isGroup: false,
          lastSeen: new Date().toISOString()
        },
        {
          id: '2147483647@s.whatsapp.net',
          name: 'Maria Santos',
          phone: '2147483647',
          profilePicture: null,
          isGroup: false,
          lastSeen: new Date().toISOString()
        }
      ];

      let filteredContacts = mockContacts;
      if (query) {
        filteredContacts = mockContacts.filter(contact => 
          contact.name.toLowerCase().includes((query as string).toLowerCase()) ||
          contact.phone.includes(query as string)
        );
      }

      res.json({
        success: true,
        data: {
          contacts: filteredContacts,
          total: filteredContacts.length
        }
      });
    } catch (error) {
      console.error('Error listing contacts:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao listar contatos'
      });
    }
  }

  // Obter contato específico
  async getContact(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { connectionId } = req.query;

      if (!connectionId) {
        return res.status(400).json({
          success: false,
          error: 'connectionId é obrigatório'
        });
      }

      // Por enquanto, retornar contato mock
      const mockContact = {
        id,
        name: 'João Silva',
        phone: '2147483647',
        profilePicture: null,
        isGroup: false,
        lastSeen: new Date().toISOString(),
        customFields: {
          company: 'Empresa ABC',
          position: 'Gerente',
          notes: 'Cliente VIP'
        }
      };

      res.json({
        success: true,
        data: mockContact
      });
    } catch (error) {
      console.error('Error getting contact:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao obter contato'
      });
    }
  }

  // Atualizar campos customizados
  async updateCustomFields(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { customFields } = req.body;
      const { connectionId } = req.query;

      if (!connectionId) {
        return res.status(400).json({
          success: false,
          error: 'connectionId é obrigatório'
        });
      }

      // Por enquanto, apenas retornar sucesso
      res.json({
        success: true,
        data: {
          id,
          customFields,
          updatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error updating custom fields:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao atualizar campos customizados'
      });
    }
  }

  // Listar campos customizados
  async listCustomFields(req: Request, res: Response) {
    try {
      const { connectionId } = req.query;

      if (!connectionId) {
        return res.status(400).json({
          success: false,
          error: 'connectionId é obrigatório'
        });
      }

      // Por enquanto, retornar campos mock
      const mockFields = [
        {
          id: 'company',
          name: 'Empresa',
          type: 'text',
          required: false
        },
        {
          id: 'position',
          name: 'Cargo',
          type: 'text',
          required: false
        },
        {
          id: 'notes',
          name: 'Observações',
          type: 'textarea',
          required: false
        }
      ];

      res.json({
        success: true,
        data: {
          fields: mockFields
        }
      });
    } catch (error) {
      console.error('Error listing custom fields:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao listar campos customizados'
      });
    }
  }
}