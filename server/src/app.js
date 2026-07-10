import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { env } from './config/env.js';
import { notFound, errorHandler } from './middleware/error.js';

import authRoutes from './routes/authRoutes.js';
import companyRoutes from './routes/companyRoutes.js';
import creatorRoutes from './routes/creatorRoutes.js';
import campaignRoutes from './routes/campaignRoutes.js';
import applicationRoutes from './routes/applicationRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import {
  savedRouter,
  collabRouter,
  complaintRouter,
  mediaRouter,
  publicRouter,
} from './routes/miscRoutes.js';

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: [env.clientUrl, 'http://localhost:5173', 'capacitor://localhost', 'http://localhost'],
      credentials: true,
    })
  );
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));
  if (env.nodeEnv === 'development') app.use(morgan('dev'));

  app.get('/api/health', (_req, res) =>
    res.json({ success: true, service: 'InfluConnect API', time: new Date().toISOString() })
  );

  app.use('/api/auth', authRoutes);
  app.use('/api/company', companyRoutes);
  app.use('/api/creator', creatorRoutes);
  app.use('/api/campaigns', campaignRoutes);
  app.use('/api/applications', applicationRoutes);
  app.use('/api/chat', chatRoutes);
  app.use('/api/reviews', reviewRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/saved', savedRouter);
  app.use('/api/collaborations', collabRouter);
  app.use('/api/complaints', complaintRouter);
  app.use('/api/media', mediaRouter);
  app.use('/api/public', publicRouter);
  app.use('/api/admin', adminRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
