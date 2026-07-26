import { Response } from 'express';
import { prisma } from '../server';
import { AuthRequest } from '../middlewares/auth.middleware';

const APPROVAL_STEPS: { step: number; role: 'AUDIT' | 'MANAGER' | 'LOGISTIC'; label: string }[] = [
  { step: 2, role: 'AUDIT', label: 'Audit' },
  { step: 3, role: 'MANAGER', label: 'Manager' },
  { step: 4, role: 'LOGISTIC', label: 'Logistics' },
];

const NEXT_STATUS: Record<string, 'PENDING_MANAGER' | 'PENDING_LOGISTIC' | 'DELIVERED'> = {
  AUDIT: 'PENDING_MANAGER',
  MANAGER: 'PENDING_LOGISTIC',
  LOGISTIC: 'DELIVERED',
};

export async function listDocuments(_req: AuthRequest, res: Response) {
  try {
    const documents = await prisma.memoDocument.findMany({
      include: { approvals: { orderBy: { step: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: documents });
  } catch {
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}

export async function getDocument(req: AuthRequest, res: Response) {
  try {
    const document = await prisma.memoDocument.findUnique({
      where: { id: req.params.id },
      include: { approvals: { orderBy: { step: 'asc' } } },
    });
    if (!document) {
      res.status(404).json({ success: false, error: 'Document not found' });
      return;
    }
    res.json({ success: true, data: document });
  } catch {
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}

export async function createDocument(req: AuthRequest, res: Response) {
  try {
    if (req.user!.role !== 'SALE' && req.user!.role !== 'ADMIN') {
      res.status(403).json({ success: false, error: 'Only Sale can request a document' });
      return;
    }
    const { clinicName, fromName, fromPosition, fromDept, subject, rows, notes } = req.body;
    if (!clinicName || !fromName || !subject || !Array.isArray(rows) || rows.length === 0) {
      res.status(400).json({ success: false, error: 'Missing required fields' });
      return;
    }

    const products = await prisma.product.findMany({
      where: { id: { in: rows.map((r) => r.productId) } },
    });
    for (const row of rows) {
      const product = products.find((p) => p.id === row.productId);
      if (!product) {
        res.status(400).json({ success: false, error: `Product not found: ${row.name || row.productId}` });
        return;
      }
      if (!Number.isFinite(row.qty) || row.qty <= 0) {
        res.status(400).json({ success: false, error: `Invalid quantity for ${product.name}` });
        return;
      }
      if (row.qty > product.stock) {
        res.status(400).json({ success: false, error: `${product.name} คงเหลือ ${product.stock} ไม่สามารถขอเบิก ${row.qty} ได้` });
        return;
      }
    }

    const now = new Date();
    const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const countToday = await prisma.memoDocument.count({ where: { createdAt: { gte: dayStart } } });
    const docNo = `MEMO-${datePart}-${countToday + 1}`;

    const document = await prisma.$transaction(async (tx) => {
      for (const row of rows) {
        await tx.product.update({
          where: { id: row.productId },
          data: { stock: { decrement: row.qty } },
        });
      }
      return tx.memoDocument.create({
        data: {
          docNo,
          clinicName,
          fromName,
          fromPosition,
          fromDept,
          subject,
          rows,
          notes: notes || null,
          status: 'PENDING_AUDIT',
          createdById: req.user!.id,
          createdByName: fromName,
          approvals: {
            create: [
              {
                step: 1,
                role: 'SALE',
                label: 'ผู้ขออนุมัติ',
                status: 'APPROVED',
                approvedById: req.user!.id,
                approvedByName: fromName,
                decidedAt: new Date(),
              },
              ...APPROVAL_STEPS.map((s) => ({ step: s.step, role: s.role, label: s.label, status: 'PENDING' as const })),
            ],
          },
        },
        include: { approvals: { orderBy: { step: 'asc' } } },
      });
    });

    res.status(201).json({ success: true, data: document });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}

export async function decideDocument(req: AuthRequest, res: Response) {
  try {
    const { decision, reason } = req.body;
    if (decision !== 'APPROVED' && decision !== 'REJECTED') {
      res.status(400).json({ success: false, error: 'decision must be APPROVED or REJECTED' });
      return;
    }
    if (decision === 'REJECTED' && !String(reason || '').trim()) {
      res.status(400).json({ success: false, error: 'reason is required when rejecting' });
      return;
    }

    const document = await prisma.memoDocument.findUnique({
      where: { id: req.params.id },
      include: { approvals: { orderBy: { step: 'asc' } } },
    });
    if (!document) {
      res.status(404).json({ success: false, error: 'Document not found' });
      return;
    }
    if (document.status === 'DELIVERED' || document.status === 'REJECTED') {
      res.status(400).json({ success: false, error: 'Document is already finalized' });
      return;
    }

    const pending = document.approvals.find((a) => a.status === 'PENDING');
    if (!pending) {
      res.status(400).json({ success: false, error: 'No pending approval step' });
      return;
    }
    if (req.user!.role !== pending.role && req.user!.role !== 'ADMIN') {
      res.status(403).json({ success: false, error: `Only ${pending.label} can act on this step` });
      return;
    }

    const nextStatus = decision === 'REJECTED' ? 'REJECTED' : NEXT_STATUS[pending.role];

    const updated = await prisma.$transaction(async (tx) => {
      await tx.memoApproval.update({
        where: { id: pending.id },
        data: {
          status: decision,
          approvedById: req.user!.id,
          approvedByName: req.user!.email,
          reason: decision === 'REJECTED' ? String(reason).trim() : null,
          decidedAt: new Date(),
        },
      });
      if (decision === 'REJECTED') {
        const rows = document.rows as { productId: string; qty: number }[];
        for (const row of rows) {
          await tx.product.update({
            where: { id: row.productId },
            data: { stock: { increment: row.qty } },
          });
        }
      }
      return tx.memoDocument.update({
        where: { id: document.id },
        data: { status: nextStatus },
        include: { approvals: { orderBy: { step: 'asc' } } },
      });
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}
