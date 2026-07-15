import { Router } from 'express';
import { getUsers } from '../controllers/user.controller';
import { authMiddleware, adminMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authMiddleware, adminMiddleware, getUsers);

export default router;
