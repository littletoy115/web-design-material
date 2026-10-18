import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../server';
import { AuthRequest } from '../middlewares/auth.middleware';

export async function getUsers(_req: AuthRequest, res: Response) {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: users });
  } catch {
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}

const VALID_ROLES = ['USER', 'ADMIN', 'SALE', 'AUDIT', 'MANAGER', 'LOGISTIC'];

export async function createUser(req: AuthRequest, res: Response) {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ success: false, error: 'name, email and password are required' });
      return;
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashed, role: VALID_ROLES.includes(role) ? role : 'USER' },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });
    res.status(201).json({ success: true, data: user });
  } catch {
    res.status(400).json({ success: false, error: 'Email already exists' });
  }
}

export async function updateUser(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { name, role } = req.body;

    const data: { name?: string; role?: 'USER' | 'ADMIN' | 'SALE' | 'AUDIT' | 'MANAGER' | 'LOGISTIC' } = {};
    if (name !== undefined) data.name = name;
    if (VALID_ROLES.includes(role)) data.role = role;

    const user = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });
    res.json({ success: true, data: user });
  } catch {
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}

export async function deleteUser(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    if (req.user?.id === id) {
      res.status(400).json({ success: false, error: 'Cannot delete yourself' });
      return;
    }
    await prisma.user.delete({ where: { id } });
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}
