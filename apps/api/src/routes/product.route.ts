import { Router } from 'express';
import { listProducts, getProductStats, createProduct, updateProduct, deleteProduct } from '../controllers/product.controller';
import { authMiddleware, adminMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.get('/stats', authMiddleware, getProductStats);
router.get('/', authMiddleware, listProducts);
router.post('/', authMiddleware, adminMiddleware, createProduct);
router.patch('/:id', authMiddleware, adminMiddleware, updateProduct);
router.delete('/:id', authMiddleware, adminMiddleware, deleteProduct);

export default router;
