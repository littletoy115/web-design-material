import { Response } from 'express';
import { prisma } from '../server';
import { AuthRequest } from '../middlewares/auth.middleware';

export async function listProducts(_req: AuthRequest, res: Response) {
  try {
    const products = await prisma.product.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: products });
  } catch {
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}

export async function getProductStats(_req: AuthRequest, res: Response) {
  try {
    const [totalProducts, totalUsers, totalStock] = await Promise.all([
      prisma.product.count(),
      prisma.user.count(),
      prisma.product.aggregate({ _sum: { stock: true } }),
    ]);
    res.json({
      success: true,
      data: {
        totalProducts,
        totalUsers,
        totalStock: totalStock._sum.stock ?? 0,
      },
    });
  } catch {
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}

export async function createProduct(req: AuthRequest, res: Response) {
  try {
    const { sku, name, category, price, stock, description } = req.body;
    if (!sku || !name) {
      res.status(400).json({ success: false, error: 'sku and name are required' });
      return;
    }
    const product = await prisma.product.create({
      data: {
        sku,
        name,
        category: category || null,
        price: price ?? 0,
        stock: stock ?? 0,
        description: description || null,
      },
    });
    res.status(201).json({ success: true, data: product });
  } catch {
    res.status(400).json({ success: false, error: 'SKU already exists' });
  }
}

export async function updateProduct(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { name, category, price, stock, description } = req.body;

    const data: { name?: string; category?: string | null; price?: number; stock?: number; description?: string | null } = {};
    if (name !== undefined) data.name = name;
    if (category !== undefined) data.category = category || null;
    if (price !== undefined) data.price = price;
    if (stock !== undefined) data.stock = stock;
    if (description !== undefined) data.description = description || null;

    const product = await prisma.product.update({ where: { id }, data });
    res.json({ success: true, data: product });
  } catch {
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}

export async function deleteProduct(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    await prisma.product.delete({ where: { id } });
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}
