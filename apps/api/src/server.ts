import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth.route';
import userRoutes from './routes/user.route';
import documentRoutes from './routes/document.route';
import productRoutes from './routes/product.route';
import { errorMiddleware } from './middlewares/error.middleware';
import { setupSocket } from './socket';

export const prisma = new PrismaClient();

const app = express();
const httpServer = createServer(app);

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const BACKOFFICE_URL = process.env.BACKOFFICE_URL || 'http://localhost:5174';

export const io = new Server(httpServer, {
  cors: {
    origin: [CLIENT_URL, BACKOFFICE_URL],
    methods: ['GET', 'POST'],
  },
});

app.use(cors({ origin: [CLIENT_URL, BACKOFFICE_URL] }));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/products', productRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Socket.io
setupSocket(io);

// Error handler
app.use(errorMiddleware);

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
