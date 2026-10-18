import { Router } from 'express';
import { listDocuments, getDocument, createDocument, decideDocument } from '../controllers/document.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authMiddleware, listDocuments);
router.get('/:id', authMiddleware, getDocument);
router.post('/', authMiddleware, createDocument);
router.post('/:id/decision', authMiddleware, decideDocument);

export default router;
