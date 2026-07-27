import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../server';
import { AuthRequest } from '../middlewares/auth.middleware';

const VALID_ROLES = ['USER', 'ADMIN', 'SALE', 'AUDIT', 'MANAGER', 'LOGISTIC'];

export async function register(req: Request, res: Response) {
  try {
    const { email, password, name, role } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashed, name, role: VALID_ROLES.includes(role) ? role : 'USER' },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });
    res.status(201).json({ success: true, data: user });
  } catch (err: any) {
    console.error('register error:', err);
    if (err?.code === 'P2002') {
      res.status(400).json({ success: false, error: 'Email already exists' });
      return;
    }
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password as string))) {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
      return;
    }
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );
    res.json({ success: true, data: { token, user: { id: user.id, email: user.email, name: user.name, role: user.role } } });
  } catch {
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}

export async function devLogin(_req: Request, res: Response) {
  if (process.env.NODE_ENV === 'production') {
    res.status(404).json({ success: false });
    return;
  }
  const token = jwt.sign(
    { id: 'dev', email: 'admin@demo.com', role: 'ADMIN' },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '7d' }
  );
  res.json({ success: true, data: { token, user: { id: 'dev', email: 'admin@demo.com', name: 'Admin (Dev)', role: 'ADMIN' } } });
}

export async function getMe(req: AuthRequest, res: Response) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });
    res.json({ success: true, data: user });
  } catch {
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}
