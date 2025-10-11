import { Router } from 'express';
import { ContactsController } from '../controllers/contacts.controller';

const router = Router();
const contactsController = new ContactsController();

// GET /api/contacts?query=
router.get('/', contactsController.listContacts);

// GET /api/contacts/:id
router.get('/:id', contactsController.getContact);

// PUT /api/contacts/:id/custom-fields
router.put('/:id/custom-fields', contactsController.updateCustomFields);

// GET /api/custom-fields
router.get('/custom-fields', contactsController.listCustomFields);

export default router;

