import express from 'express';
import cors from 'cors';
import { config } from './config';
import { clerk, syncUser } from './middlewares/clerk';
import { requestLogging } from './middlewares/logging';
import { notFound } from './middlewares/notFound';
import { errorHandler } from './middlewares/errorHandler';
import routes from './routes';
import healthRoutes from './routes/health';

const app = express();

app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      config.frontendUrl,
    ].filter(Boolean),
    credentials: true,
  }),
);

app.use(express.json());

app.use(requestLogging);

// Health check endpoint - no auth required
app.use('/api', healthRoutes);

app.use(clerk);
app.use(syncUser);

app.use('/api', routes);

app.use('*', notFound);

app.use(errorHandler);

export default app;
